/**
 * Service categories: public list and admin CRUD.
 */
const { Category, Service } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, pick } = require('../utils/helpers');
const mediaService = require('../services/media.service');

const FIELDS = ['name', 'description', 'isActive'];

exports.getCategories = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const categories = await Category.find(isAdmin ? {} : { isActive: true }).sort('name');

  const counts = await Service.aggregate([
    { $match: isAdmin ? {} : { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    data: categories.map((category) => ({ ...category.toJSON(), serviceCount: countById.get(category.id) || 0 })),
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.image = (await mediaService.saveImage(req.file, req.user.id)) || '';
  const category = await Category.create(data);
  res.status(201).json({ success: true, message: 'Category created', data: category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw AppError.notFound('Category');
  category.set(pick(req.body, FIELDS));
  if (req.file) category.image = await mediaService.replaceImage(req.file, category.image, req.user.id);
  await category.save();
  res.json({ success: true, message: 'Category updated', data: category });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw AppError.notFound('Category');
  const inUse = await Service.countDocuments({ category: category._id });
  if (inUse) throw AppError.conflict(`This category still has ${inUse} service(s). Move or delete them first.`);
  await Promise.all([mediaService.removeImage(category.image), category.deleteOne()]);
  res.json({ success: true, message: 'Category deleted' });
});
