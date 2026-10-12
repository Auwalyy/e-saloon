/**
 * Database migration for MongoDB.
 *
 * MongoDB has no table DDL, so a "migration" here means:
 *   1. creating every collection,
 *   2. synchronising the indexes declared on the Mongoose schemas
 *      (unique keys, TTL indexes, the double-booking guard), and
 *   3. making sure the settings document and the first admin account exist.
 *
 * Safe to run repeatedly:  npm run migrate
 */
const env = require('../config/env');
const models = require('../models');

/** Creates the initial administrator if no admin exists yet. */
const ensureAdminUser = async () => {
  const { User, Setting } = models;
  await Setting.getMain();
  if (await User.exists({ role: 'admin' })) return null;

  const existing = await User.findOne({ email: env.admin.email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    return existing;
  }
  const admin = await User.create({
    name: env.admin.name, email: env.admin.email, password: env.admin.password, role: 'admin', phone: '',
  });
  console.log(`[migrate] Admin account created: ${admin.email}`);
  return admin;
};

const migrate = async () => {
  for (const [name, Model] of Object.entries(models)) {
    await Model.createCollection();
    const dropped = await Model.syncIndexes();
    console.log(`[migrate] ${name}: indexes in sync${dropped.length ? ` (dropped ${dropped.join(', ')})` : ''}`);
  }
  await ensureAdminUser();
};

module.exports = { migrate, ensureAdminUser };

// Run directly from the command line.
if (require.main === module) {
  const { connectDatabase, disconnectDatabase } = require('../config/database');
  connectDatabase()
    .then(migrate)
    .then(() => console.log('[migrate] Done'))
    .catch((error) => {
      console.error('[migrate] Failed:', error);
      process.exitCode = 1;
    })
    .finally(disconnectDatabase);
}
