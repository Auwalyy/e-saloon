/**
 * Process entry point: connects to MongoDB, starts the HTTP server and the
 * background jobs, and shuts everything down cleanly on SIGTERM / SIGINT.
 */
const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const app = require('./app');
const { startReminderScheduler, stopReminderScheduler } = require('./services/reminder.service');
const { seedDatabase } = require('./database/seed');
const { ensureAdminUser } = require('./database/migrate');

let server;

const start = async () => {
  await connectDatabase();

  if (env.useMemoryDb) {
    // The in-memory database starts empty on every boot, so load the demo data.
    await seedDatabase({ log: false });
    console.log(`[db] Demo data loaded. Admin login: ${env.admin.email} / ${env.admin.password}`);
  } else {
    await ensureAdminUser();
    // A brand-new development database gets the demo catalogue so the site is not empty.
    if (!env.isProduction && env.autoSeed && (await seedDatabase({ log: false }))) {
      console.log('[db] Empty database detected: demo data loaded (set AUTO_SEED=false to disable).');
    }
  }

  server = app.listen(env.port, () => {
    console.log(`[server] API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[server] Port ${env.port} is already used by another program.`);
      console.error('[server] Stop that program, or set PORT in backend/.env and VITE_PROXY_TARGET in frontend/.env to another port.');
    } else {
      console.error('[server] failed to start:', error.message);
    }
    process.exit(1);
  });
  startReminderScheduler();
};

const shutdown = async (signal) => {
  console.log(`[server] ${signal} received, shutting down`);
  stopReminderScheduler();
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[server] unhandled rejection:', reason));

/** Turns common database start-up failures into advice the developer can act on. */
const explainStartupError = (error) => {
  const message = error.message || '';
  if (/querySrv|queryTxt|ENOTFOUND|EAI_AGAIN/.test(message)) {
    return 'Could not look up the database address. Check your internet connection and the cluster name in MONGODB_URI.';
  }
  if (/whitelist|IP that isn't|Could not connect to any servers/i.test(message)) {
    return 'MongoDB Atlas refused the connection. In Atlas open Network Access and allow your current IP address (or 0.0.0.0/0).';
  }
  if (/bad auth|Authentication failed/i.test(message)) {
    return 'The database username or password in MONGODB_URI is wrong. Special characters in the password must be URL-encoded.';
  }
  return null;
};

start().catch((error) => {
  console.error('[server] failed to start:', error.message);
  const advice = explainStartupError(error);
  if (advice) console.error(`[server] ${advice}`);
  process.exit(1);
});
