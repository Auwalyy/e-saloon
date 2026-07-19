const { body } = require('express-validator');

exports.serviceValidator = [
  body('name').trim().notEmpty().withMessage('Service name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('duration').isInt({ min: 1 }).withMessage('Valid duration required'),
  body('category_id').isUUID().withMessage('Valid category ID required'),
];

exports.reviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('appointment_id').isUUID().withMessage('Valid appointment ID required'),
];
