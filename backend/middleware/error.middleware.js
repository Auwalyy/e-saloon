/**
 * 404 handler and the single place where errors become HTTP responses.
 * Known error types (validation, duplicate keys, bad ids, upload limits) are
 * translated into friendly messages; anything unexpected is hidden in production.
 */
const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));

const normalise = (err) => {
  if (err.isOperational) return err;

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return AppError.badRequest(details[0] ? details[0].message : 'Validation failed', details);
  }
  if (err.name === 'CastError') return AppError.badRequest(`Invalid value for ${err.path}`);
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    return AppError.conflict(`That ${field} is already in use`);
  }
  if (err.name === 'MulterError') {
    return AppError.badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (maximum 3 MB)' : err.message);
  }
  if (err.type === 'entity.too.large') return AppError.badRequest('Request body is too large');
  if (err.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON in request body');

  return null;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const known = normalise(err);
  if (!known) console.error('[error]', err);

  const statusCode = known ? known.statusCode : 500;
  const body = {
    success: false,
    message: known ? known.message : 'Something went wrong. Please try again later.',
  };
  if (known && known.details) body.errors = known.details;
  if (!known && !env.isProduction) body.debug = err.message;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
