/**
 * Input sanitisation.
 *  - Strips HTML/script content from every incoming string (stored XSS defence).
 *  - Removes keys starting with "$" or containing "." (NoSQL operator injection).
 * Passwords are left untouched so special characters are never altered.
 */
const xss = require('xss');

const SKIP_KEYS = new Set(['password', 'confirmPassword', 'currentPassword', 'newPassword']);
const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] };

const clean = (value, key) => {
  if (typeof value === 'string') return SKIP_KEYS.has(key) ? value : xss(value, xssOptions);
  if (Array.isArray(value)) return value.map((item) => clean(item, key));
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return Object.keys(value).reduce((result, childKey) => {
      if (childKey.startsWith('$') || childKey.includes('.')) return result;
      result[childKey] = clean(value[childKey], childKey);
      return result;
    }, {});
  }
  return value;
};

const sanitize = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  // req.query is a getter in Express 5, so mutate in place to stay compatible.
  const query = clean(req.query || {});
  Object.keys(req.query || {}).forEach((key) => delete req.query[key]);
  Object.assign(req.query, query);
  next();
};

module.exports = sanitize;
module.exports.clean = clean;
