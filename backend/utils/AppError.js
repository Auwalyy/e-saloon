/**
 * Operational error carrying an HTTP status code.
 * Thrown anywhere in the request pipeline and rendered by the error middleware.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) { return new AppError(message, 400, details); }
  static unauthorized(message = 'Authentication required') { return new AppError(message, 401); }
  static forbidden(message = 'You do not have permission to perform this action') { return new AppError(message, 403); }
  static notFound(resource = 'Resource') { return new AppError(`${resource} not found`, 404); }
  static conflict(message) { return new AppError(message, 409); }
}

module.exports = AppError;
