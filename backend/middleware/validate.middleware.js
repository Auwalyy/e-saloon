/**
 * Runs a list of express-validator chains and rejects the request with a
 * 400 response listing every invalid field.
 */
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (chains) => [
  ...chains,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }));
    next(AppError.badRequest(details[0].message, details));
  },
];

module.exports = validate;
