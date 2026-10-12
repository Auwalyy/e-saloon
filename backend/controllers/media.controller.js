/**
 * Serves images stored in MongoDB.
 */
const mongoose = require('mongoose');
const { Media } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');

exports.getMedia = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw AppError.notFound('Image');
  const media = await Media.findById(req.params.id).select('+data');
  if (!media) throw AppError.notFound('Image');

  res.set({
    'Content-Type': media.contentType,
    'Content-Length': media.size,
    // Each upload gets a new id, so the bytes behind a URL never change.
    'Cache-Control': 'public, max-age=31536000, immutable',
    // Allow the frontend (a different origin in production) to display the image.
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(media.data);
});
