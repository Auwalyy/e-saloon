/**
 * Authentication and role based authorisation.
 *
 * A JWT is accepted from either:
 *   - the Authorization: Bearer header (not sent automatically by browsers, so
 *     it is immune to CSRF), or
 *   - the httpOnly `token` cookie. Cookie-authenticated requests that change
 *     state must also send the X-CSRF-Token header matching the `csrf` claim
 *     signed inside the JWT (signed double-submit pattern).
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return { token: header.slice(7), source: 'header' };
  if (req.cookies && req.cookies.token) return { token: req.cookies.token, source: 'cookie' };
  return { token: null, source: null };
};

const resolveUser = async (req) => {
  const { token, source } = extractToken(req);
  if (!token) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw AppError.unauthorized('Your session is invalid or has expired. Please log in again.');
  }

  if (source === 'cookie' && !SAFE_METHODS.includes(req.method)) {
    if (!decoded.csrf || req.headers['x-csrf-token'] !== decoded.csrf) {
      throw AppError.forbidden('Invalid CSRF token');
    }
  }

  const user = await User.findById(decoded.id);
  if (!user) throw AppError.unauthorized('The account for this session no longer exists.');
  if (!user.isActive) throw AppError.forbidden('Your account has been deactivated. Please contact the salon.');
  if (user.changedPasswordAfter(decoded.iat)) {
    throw AppError.unauthorized('Your password was changed recently. Please log in again.');
  }

  req.csrfToken = decoded.csrf;
  return user;
};

/** Requires a valid session. */
const protect = asyncHandler(async (req, res, next) => {
  const user = await resolveUser(req);
  if (!user) throw AppError.unauthorized();
  req.user = user;
  next();
});

/** Attaches the user when a valid session exists, but never rejects the request. */
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    req.user = await resolveUser(req);
  } catch {
    req.user = null;
  }
  next();
});

/** Restricts a route to the given roles. Must run after `protect`. */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(AppError.forbidden());
  next();
};

const adminOnly = [protect, authorize('admin')];

module.exports = { protect, optionalAuth, authorize, adminOnly };
