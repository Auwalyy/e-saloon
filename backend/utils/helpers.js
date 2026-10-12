/**
 * Small shared helpers used across controllers and services.
 */
const crypto = require('crypto');

/** Wraps an async route handler so rejected promises reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Escapes user input before it is used inside a RegExp (prevents ReDoS / injection). */
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const searchRegex = (value) => new RegExp(escapeRegex(value).trim(), 'i');

/** Human friendly unique reference, e.g. APT-20261012-7F3K9Q. */
const generateReference = (prefix) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `${prefix}-${date}-${random}`;
};

const slugify = (value = '') =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const formatCurrency = (amount, currency = 'NGN') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Returns only the whitelisted keys that are actually present on the source object. */
const pick = (source, keys) =>
  keys.reduce((result, key) => {
    if (source[key] !== undefined) result[key] = source[key];
    return result;
  }, {});

/**
 * Runs a paginated query and returns `{ items, pagination }`.
 * `page` and `limit` come straight from the query string.
 */
const paginate = async (Model, filter, { page = 1, limit = 10, sort = '-createdAt', populate = [], select } = {}) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  let query = Model.find(filter).sort(sort).skip((currentPage - 1) * pageSize).limit(pageSize);
  if (select) query = query.select(select);
  [].concat(populate).forEach((p) => { query = query.populate(p); });

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return {
    items,
    pagination: { page: currentPage, limit: pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) },
  };
};

module.exports = { asyncHandler, escapeRegex, searchRegex, generateReference, slugify, formatCurrency, pick, paginate };
