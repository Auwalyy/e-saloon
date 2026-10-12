/**
 * Validation rules for authentication and profile endpoints.
 */
const { body, password, phone, email } = require('./common.validator');

// A function, because validation chains are mutable (e.g. `.optional()` changes the chain it is called on).
const name = () => body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters');

exports.register = [
  name(),
  email(),
  body('phone').matches(/^\+?[0-9\s-]{7,20}$/).withMessage('Enter a valid phone number'),
  password(),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
];

exports.login = [email(), body('password').notEmpty().withMessage('Password is required')];

exports.forgotPassword = [email()];

exports.resetPassword = [
  body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invalid reset token'),
  password(),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
];

exports.changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  password('newPassword'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
];

exports.updateProfile = [
  name().optional(),
  phone(),
  body('address').optional().trim().isLength({ max: 250 }).withMessage('Address is too long'),
  body('notificationPreferences').optional().isObject(),
];
