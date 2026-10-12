/**
 * One-time password reset tokens.
 * Only a SHA-256 hash is stored, and MongoDB removes expired documents
 * automatically through the TTL index on `expiresAt`.
 */
const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
