/**
 * Authentication and profile routes.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const rules = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

const router = express.Router();

// Strict limit on credential endpoints to slow down brute-force and enumeration attempts.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

router.post('/register', credentialLimiter, validate(rules.register), controller.register);
router.post('/login', credentialLimiter, validate(rules.login), controller.login);
router.post('/logout', controller.logout);
router.post('/forgot-password', credentialLimiter, validate(rules.forgotPassword), controller.forgotPassword);
router.post('/reset-password', credentialLimiter, validate(rules.resetPassword), controller.resetPassword);

router.use(protect);
router.get('/me', controller.getMe);
router.put('/profile', validate(rules.updateProfile), controller.updateProfile);
router.put('/avatar', uploadImage('avatar'), controller.updateAvatar);
router.put('/change-password', credentialLimiter, validate(rules.changePassword), controller.changePassword);

module.exports = router;
