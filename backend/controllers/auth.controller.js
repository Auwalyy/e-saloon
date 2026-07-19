const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const emailService = require('../services/email.service');
const { v4: uuidv4 } = require('uuid');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
  res.cookie('token', token, cookieOptions);
  const { password, ...userData } = user;
  res.status(statusCode).json({ success: true, token, user: userData });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name, email, phone, password, role) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, email, phone, hashed, 'customer']
    );
    const user = result.rows[0];
    // Create customer profile
    await query('INSERT INTO customers (user_id) VALUES ($1)', [user.id]);
    await emailService.sendWelcomeEmail(user.email, user.name);
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, role, avatar, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const result = await query(
      'UPDATE users SET name=$1, phone=$2 WHERE id=$3 RETURNING id,name,email,phone,role,avatar',
      [name, phone, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }
    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, token, expires]
    );
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await query(
      'SELECT * FROM password_reset_tokens WHERE token=$1 AND used=false AND expires_at > NOW()',
      [token]
    );
    if (!result.rows[0]) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    const hashed = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password=$1 WHERE id=$2', [hashed, result.rows[0].user_id]);
    await query('UPDATE password_reset_tokens SET used=true WHERE id=$1', [result.rows[0].id]);
    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const result = await query(
      'UPDATE users SET avatar=$1 WHERE id=$2 RETURNING id,name,email,avatar',
      [req.file.path, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
