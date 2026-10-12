/**
 * Reusable validation building blocks shared by the domain validators.
 */
const { body, param, query } = require('express-validator');
const { DATE_PATTERN, TIME_PATTERN } = require('../utils/time');

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
const PASSWORD_MESSAGE = 'Password must be 8+ characters with an uppercase letter, a lowercase letter and a number';
const PHONE_RULE = /^\+?[0-9\s-]{7,20}$/;

const mongoId = (field, location = param) => location(field).isMongoId().withMessage(`Invalid ${field}`);
const idParam = [mongoId('id')];

const dateField = (field, location = body) =>
  location(field).matches(DATE_PATTERN).withMessage(`${field} must be a date in YYYY-MM-DD format`);
const timeField = (field, location = body) =>
  location(field).matches(TIME_PATTERN).withMessage(`${field} must be a time in HH:mm format`);

const password = (field = 'password') => body(field).matches(PASSWORD_RULE).withMessage(PASSWORD_MESSAGE);
const phone = (field = 'phone') =>
  body(field).optional({ values: 'falsy' }).matches(PHONE_RULE).withMessage('Enter a valid phone number');
const email = (field = 'email') =>
  body(field).trim().isEmail().withMessage('Enter a valid email address').isLength({ max: 150 }).toLowerCase();

const pagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = { mongoId, idParam, dateField, timeField, password, phone, email, pagination, body, param, query };
