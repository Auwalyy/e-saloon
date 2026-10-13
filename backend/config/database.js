/**
 * MongoDB connection management.
 * Supports a real MongoDB (local or Atlas) and an in-memory server whose data is
 * lost on restart. The in-memory server is used when USE_MEMORY_DB=true, and
 * automatically in development when no database is configured or installed.
 */
const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1'];
const DEFAULT_DB_NAME = 'esalon';

/** Options for a configured database. Names the database when the URI does not (Atlas URIs often omit it). */
const connectOptions = () => {
  const options = { serverSelectionTimeoutMS: env.mongoUriProvided ? 10000 : 3000 };
  const path = env.mongoUri.replace(/^mongodb(\+srv)?:\/\/[^/]+/, '').split('?')[0];
  if (path.length <= 1) options.dbName = DEFAULT_DB_NAME;
  return options;
};

/**
 * Connects to the configured database. "mongodb+srv://" addresses need an SRV
 * DNS lookup, which some routers and phone hotspots cannot answer. When that
 * lookup fails, retry once using public DNS servers.
 */
const connectConfigured = async () => {
  try {
    await mongoose.connect(env.mongoUri, connectOptions());
  } catch (error) {
    const isSrvLookupFailure = env.mongoUri.startsWith('mongodb+srv://') && /querySrv|queryTxt/.test(error.message);
    if (!isSrvLookupFailure) throw error;
    await mongoose.disconnect().catch(() => {});
    console.warn(`[db] Your network's DNS could not look up the database address (${error.code || 'SRV lookup failed'}).`);
    console.warn(`[db] Retrying with public DNS servers (${PUBLIC_DNS.join(', ')})...`);
    dns.setServers(PUBLIC_DNS);
    await mongoose.connect(env.mongoUri, connectOptions());
  }
};

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
      await connectConfigured();
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
