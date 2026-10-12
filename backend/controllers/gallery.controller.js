/**
 * Gallery: public image grid (by category) and admin management.
 */
const { GalleryItem } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, pick } = require('../utils/helpers');
const mediaService = require('../services/media.service');

exports.getGallery = asyncHandler(async (req, res) => {
  const { category, page, limit = 24 } = req.query;
  const isAdmin = req.user && req.user.role === 'admin';
  const filter = isAdmin ? {} : { isActive: true };
  if (category && GalleryItem.CATEGORIES.includes(category)) filter.category = category;

  const { items, pagination } = await paginate(GalleryItem, filter, { page, limit });
  res.json({ success: true, data: items, pagination, categories: GalleryItem.CATEGORIES });
});

exports.createGalleryItem = asyncHandler(async (req, res) => {
  const image = (await mediaService.saveImage(req.file, req.user.id)) || req.body.imageUrl;
  if (!image) throw AppError.badRequest('Please choose an image to upload');
  const item = await GalleryItem.create({ ...pick(req.body, ['title', 'category', 'isActive']), image });
  res.status(201).json({ success: true, message: 'Image added to gallery', data: item });
});

exports.updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) throw AppError.notFound('Gallery image');
  item.set(pick(req.body, ['title', 'category', 'isActive']));
  if (req.file) item.image = await mediaService.replaceImage(req.file, item.image, req.user.id);
  await item.save();
  res.json({ success: true, message: 'Gallery image updated', data: item });
});

exports.deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) throw AppError.notFound('Gallery image');
  await Promise.all([mediaService.removeImage(item.image), item.deleteOne()]);
  res.json({ success: true, message: 'Gallery image deleted' });
});
