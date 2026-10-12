/**
 * User accounts for both customers and administrators.
 * Customer profile fields live on the same document (one collection, role based),
 * which avoids a join on every authenticated request.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['customer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true, maxlength: 20 },
    password: { type: String, required: true, minlength: 8, select: false, private: true },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    avatar: { type: String, default: '' },
    address: { type: String, trim: true, maxlength: 250, default: '' },
    isActive: { type: Boolean, default: true },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    passwordChangedAt: { type: Date, private: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ name: 'text', email: 'text', phone: 'text' });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Back-date slightly so a token issued in the same second stays valid.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** True when the password changed after the given JWT `iat` (seconds). */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(issuedAt) {
  return Boolean(this.passwordChangedAt) && this.passwordChangedAt.getTime() / 1000 > issuedAt;
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
