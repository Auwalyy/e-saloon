/**
 * Centralised environment configuration.
 * Every module reads settings from here instead of touching process.env directly,
 * so defaults and validation live in exactly one place.
 */
require('dotenv').config();

const bool = (value, fallback = false) =>
  value === undefined ? fallback : ['true', '1', 'yes'].includes(String(value).toLowerCase());

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  // 5050 by default: port 5000 is commonly taken by other local projects and tools.
  port: Number(process.env.PORT) || 5050,

  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esalon',
  mongoUriProvided: Boolean(process.env.MONGODB_URI),
  useMemoryDb: bool(process.env.USE_MEMORY_DB),
  // In development an empty database is filled with demo data on start (set AUTO_SEED=false to disable).
  autoSeed: bool(process.env.AUTO_SEED, true),

  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieDays: Number(process.env.JWT_COOKIE_EXPIRES) || 7,

  // Comma separated list of allowed browser origins.
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),

  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || "Aisha's Salon <noreply@aishasalon.com>",
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'console',
  },

  admin: {
    name: process.env.ADMIN_NAME || 'Aisha Bello',
    email: process.env.ADMIN_EMAIL || 'admin@aishasalon.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },

  timezone: process.env.SALON_TIMEZONE || 'Africa/Lagos',
};

env.frontendUrl = env.frontendUrls[0];

if (env.isProduction) {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
}

module.exports = env;
