/**
 * Salon services: public catalogue (search, filter, sort) and admin CRUD.
 */
const mongoose = require('mongoose');
const { Service, Category, Appointment, Employee } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, searchRegex, pick } = require('../utils/helpers');
const mediaService = require('../services/media.service');

const SORTS = {
  newest: '-createdAt',
  name: 'name',
  price_asc: 'price',
  price_desc: '-price',
  duration_asc: 'duration',
  duration_desc: '-duration',
};
const FIELDS = ['name', 'description', 'category', 'price', 'duration', 'isActive', 'isFeatured'];

exports.getServices = asyncHandler(async (req, res) => {
  const { search, category, featured, status, minPrice, maxPrice, sort, page, limit = 12 } = req.query;
  const isAdmin = req.user && req.user.role === 'admin';
  const filter = {};

  // The public only ever sees active services; admins can filter by status.
  if (!isAdmin) filter.isActive = true;
  else if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;

  if (search) filter.$or = [{ name: searchRegex(search) }, { description: searchRegex(search) }];
  if (category) {
    if (mongoose.isValidObjectId(category)) filter.category = category;
    else {
      const found = await Category.findOne({ slug: category }).select('_id');
      filter.category = found ? found._id : null;
    }
  }
  if (featured === 'true') filter.isFeatured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (Number(minPrice) >= 0 && minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
    if (Number(maxPrice) > 0) filter.price.$lte = Number(maxPrice);
    if (!Object.keys(filter.price).length) delete filter.price;
  }

  const { items, pagination } = await paginate(Service, filter, {
    page, limit, sort: SORTS[sort] || SORTS.name, populate: { path: 'category', select: 'name slug' },
  });
  res.json({ success: true, data: items, pagination });
});

/** Most booked active services (used on the home page). */
exports.getPopularServices = asyncHandler(async (req, res) => {
  const limit = Math.min(12, parseInt(req.query.limit, 10) || 6);
  const ranked = await Appointment.aggregate([
    { $match: { status: { $in: ['pending', 'confirmed', 'completed'] } } },
    { $group: { _id: '$service', bookings: { $sum: 1 } } },
    { $sort: { bookings: -1 } },
    { $limit: 30 },
  ]);
  const order = new Map(ranked.map((row, index) => [String(row._id), index]));

  const services = await Service.find({ isActive: true }).populate('category', 'name slug');
  services.sort((a, b) => {
    const rankA = order.has(a.id) ? order.get(a.id) : Infinity;
    const rankB = order.has(b.id) ? order.get(b.id) : Infinity;
    if (rankA !== rankB) return rankA - rankB;
    return Number(b.isFeatured) - Number(a.isFeatured);
  });
  res.json({ success: true, data: services.slice(0, limit) });
});

exports.getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('category', 'name slug');
  const isAdmin = req.user && req.user.role === 'admin';
  if (!service || (!service.isActive && !isAdmin)) throw AppError.notFound('Service');
  res.json({ success: true, data: service });
});

exports.createService = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.category) delete data.category;
  data.image = (await mediaService.saveImage(req.file, req.user.id)) || req.body.imageUrl || '';
  const service = await Service.create(data);
  res.status(201).json({ success: true, message: 'Service created', data: await service.populate('category', 'name slug') });
});

exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw AppError.notFound('Service');

  const data = pick(req.body, FIELDS);
  if (data.category === '') data.category = null;
  service.set(data);
  if (req.file) service.image = await mediaService.replaceImage(req.file, service.image, req.user.id);
  await service.save();
  res.json({ success: true, message: 'Service updated', data: await service.populate('category', 'name slug') });
});

exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw AppError.notFound('Service');

  // Services with booking history are archived rather than destroyed, to keep records intact.
  if (await Appointment.exists({ service: service._id })) {
    service.isActive = false;
    await service.save();
    return res.json({ success: true, message: 'Service has bookings, so it was deactivated instead of deleted', data: service });
  }
  await Promise.all([
    mediaService.removeImage(service.image),
    Employee.updateMany({ services: service._id }, { $pull: { services: service._id } }),
    service.deleteOne(),
  ]);
  res.json({ success: true, message: 'Service deleted' });
});
