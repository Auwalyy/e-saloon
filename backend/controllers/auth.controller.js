/**
 * Authentication: registration, login, session, profile and password management.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User, PasswordResetToken } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, pick } = require('../utils/helpers');
const emailService = require('../services/email.service');
const mediaService = require('../services/media.service');
const notifications = require('../services/notification.service');

const RESET_TOKEN_MINUTES = 30;

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  // The frontend (Vercel) and API (Railway) live on different sites in production.
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: env.cookieDays * 24 * 60 * 60 * 1000,
  path: '/',
});

/** Issues the JWT (cookie + body) together with its paired CSRF token. */
const sendSession = (res, user, statusCode = 200, message) => {
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign({ id: user.id, role: user.role, csrf: csrfToken }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie('token', token, cookieOptions());
  res.status(statusCode).json({ success: true, message, token, csrfToken, user });
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email })) throw AppError.conflict('An account with this email already exists');

  // Role is never accepted from the client: public registration always creates a customer.
  const user = await User.create({ name, email, phone, password, role: 'customer' });
  notifications.dispatch(emailService.sendWelcomeEmail(user));
  sendSession(res, user, 201, 'Account created successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password, to avoid account enumeration.
  if (!user || !(await user.comparePassword(password))) throw AppError.unauthorized('Invalid email or password');
  if (!user.isActive) throw AppError.forbidden('Your account has been deactivated. Please contact the salon.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  sendSession(res, user, 200, 'Logged in successfully');
});

exports.logout = (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
  res.json({ success: true, user: req.user, csrfToken: req.csrfToken });
};

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ['name', 'phone', 'address']);
  if (req.body.notificationPreferences) {
    const prefs = req.body.notificationPreferences;
    if (prefs.email !== undefined) updates['notificationPreferences.email'] = Boolean(prefs.email);
    if (prefs.sms !== undefined) updates['notificationPreferences.sms'] = Boolean(prefs.sms);
  }
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', user });
});

exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('Please choose an image to upload');
  const avatar = await mediaService.replaceImage(req.file, req.user.avatar, req.user.id);
  const user = await User.findByIdAndUpdate(req.user.id, { avatar }, { new: true });
  res.json({ success: true, message: 'Profile photo updated', user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw AppError.badRequest('Current password is incorrect');
  if (currentPassword === newPassword) throw AppError.badRequest('New password must be different from the current one');

  user.password = newPassword;
  await user.save();
  notifications.dispatch(emailService.sendPasswordChangedEmail(user));
  // Old tokens are now invalid, so issue a fresh session.
  sendSession(res, user, 200, 'Password changed successfully');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, isActive: true });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.deleteMany({ user: user._id });
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
    });
    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
    if (!env.isProduction) console.log(`[auth:dev] password reset link for ${user.email}: ${resetUrl}`);
    notifications.dispatch(emailService.sendPasswordResetEmail(user, resetUrl));
  }
  // Always the same response, whether or not the email exists.
  res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  // Atomically consume the token so it can only be used once.
  const record = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { usedAt: new Date() }
  );
  if (!record) throw AppError.badRequest('This reset link is invalid or has expired');

  const user = await User.findById(record.user).select('+password');
  if (!user || !user.isActive) throw AppError.badRequest('This reset link is invalid or has expired');

  user.password = password;
  await user.save();
  await PasswordResetToken.deleteMany({ user: user._id });
  notifications.dispatch(emailService.sendPasswordChangedEmail(user));
  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});
