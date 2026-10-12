/**
 * MongoDB connection management.
 * Supports a real MongoDB (local or Atlas) and, for demos without a database
 * installed, an in-memory server (USE_MEMORY_DB=true) whose data is lost on restart.
 */
const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

let memoryServer = null;

const resolveUri = async () => {
  if (!env.useMemoryDb) return env.mongoUri;
  // Lazy require: this is a dev dependency and is absent in production installs.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  console.log('[db] Using in-memory MongoDB (data is NOT persisted)');
  return memoryServer.getUri('esalon');
};

const connectDatabase = async () => {
  const uri = await resolveUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

module.exports = { connectDatabase, disconnectDatabase };
