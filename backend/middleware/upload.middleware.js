/**
 * Image upload handling (multipart/form-data).
 * Files are kept in memory, validated, then persisted to MongoDB by the media service.
 */
const multer = require('multer');
const AppError = require('../utils/AppError');
const { clean } = require('./sanitize.middleware');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(AppError.badRequest('Only JPEG, PNG, WebP or GIF images are allowed'));
  },
});

/**
 * Parses a single optional image field. Because multipart bodies arrive as
 * strings, a `data` field containing JSON is expanded into req.body so that
 * nested values (arrays, objects, booleans) keep their types.
 */
const uploadImage = (field = 'image') => [
  upload.single(field),
  (req, res, next) => {
    if (typeof req.body.data === 'string') {
      try {
        req.body = { ...JSON.parse(req.body.data) };
      } catch {
        return next(AppError.badRequest('Malformed form data'));
      }
    }
    // Multipart bodies are parsed after the global sanitiser, so clean them here.
    req.body = clean(req.body || {});
    next();
  },
];

module.exports = { uploadImage };
