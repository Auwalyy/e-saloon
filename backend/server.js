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
  }

  server = app.listen(env.port, () => {
    console.log(`[server] API listening on port ${env.port} (${env.nodeEnv})`);
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

start().catch((error) => {
  console.error('[server] failed to start:', error.message);
  process.exit(1);
});
