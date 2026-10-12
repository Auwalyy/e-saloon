/**
 * Stores uploaded images in MongoDB and returns the URL they are served from.
 */
const mongoose = require('mongoose');
const { Media } = require('../models');

const MEDIA_PREFIX = '/api/media/';

/** Persists a multer file and returns its public path, or null when no file was sent. */
const saveImage = async (file, userId) => {
  if (!file) return null;
  const media = await Media.create({
    filename: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    data: file.buffer,
    uploadedBy: userId,
  });
  return `${MEDIA_PREFIX}${media.id}`;
};

/** Deletes a previously uploaded image. External URLs (e.g. seed data) are ignored. */
const removeImage = async (url) => {
  if (!url || !url.startsWith(MEDIA_PREFIX)) return;
  const id = url.slice(MEDIA_PREFIX.length);
  if (mongoose.isValidObjectId(id)) await Media.findByIdAndDelete(id);
};

/** Saves a new image (if any) and removes the one it replaces. Returns the URL to store. */
const replaceImage = async (file, previousUrl, userId) => {
  if (!file) return previousUrl;
  const url = await saveImage(file, userId);
  await removeImage(previousUrl);
  return url;
};

module.exports = { saveImage, removeImage, replaceImage };
