/**
 * MongoDB connection management.
 * Supports a real MongoDB (local or Atlas) and an in-memory server whose data is
 * lost on restart. The in-memory server is used when USE_MEMORY_DB=true, and
 * automatically in development when no database is configured or installed.
 */
const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

let memoryServer = null;

const startMemoryServer = async () => {
  // Lazy require: this is a dev dependency and is absent in production installs.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  console.log('[db] Using in-memory MongoDB (data is NOT persisted)');
  return memoryServer.getUri('esalon');
};

const connectDatabase = async () => {
  if (env.useMemoryDb) {
    await mongoose.connect(await startMemoryServer());
  } else {
    try {
      // Fail fast when probing the default local address, so the fallback below is quick.
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: env.mongoUriProvided ? 10000 : 3000 });
    } catch (error) {
      // A configured database that cannot be reached is always an error. Only the
      // "nothing configured, nothing installed" development case falls back.
      if (env.isProduction || env.mongoUriProvided) throw error;
      await mongoose.disconnect().catch(() => {});
      console.warn('[db] No MongoDB found at mongodb://127.0.0.1:27017 and MONGODB_URI is not set.');
      console.warn('[db] Falling back to an in-memory database with demo data. Set MONGODB_URI in backend/.env to keep your data.');
      env.useMemoryDb = true;
      await mongoose.connect(await startMemoryServer());
    }
  }
  console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

module.exports = { connectDatabase, disconnectDatabase };
