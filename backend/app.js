/**
 * Express application: security middleware, body parsing, routes and error handling.
 * Kept separate from server.js so the app can be imported without opening a port.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const sanitize = require('./middleware/sanitize.middleware');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const paymentController = require('./controllers/payment.controller');

const app = express();

// Railway / Vercel terminate TLS at a proxy; needed for secure cookies and correct client IPs.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* --------------------------------- Security -------------------------------- */

app.use(helmet({
  // Images are displayed by the frontend, which is served from another origin.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin(origin, callback) {
    // Non-browser clients (curl, server-to-server, health checks) send no Origin header.
    if (!origin || env.frontendUrls.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Disposition'],
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/media/'),
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
}));

/* ------------------------------- Body parsing ------------------------------ */

// The webhook must see the raw bytes to verify Paystack's signature, so it is
// registered before the JSON parser.
app.post('/api/payments/webhook/paystack', express.raw({ type: 'application/json', limit: '200kb' }), paymentController.paystackWebhook);

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(cookieParser());
app.use(sanitize);
app.use(compression());
if (env.nodeEnv !== 'test') app.use(morgan(env.isProduction ? 'combined' : 'dev'));

/* ---------------------------------- Routes --------------------------------- */

app.get('/', (req, res) => res.json({ success: true, message: "Aisha's Salon API", docs: '/api/health' }));
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', environment: env.nodeEnv, uptime: Math.round(process.uptime()) });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
