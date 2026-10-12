/**
 * Employees (stylists): public listing, admin CRUD, working hours and schedules.
 */
const mongoose = require('mongoose');
const { Employee, Appointment } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, searchRegex, pick } = require('../utils/helpers');
const { nowInZone, addDays, DATE_PATTERN } = require('../utils/time');
const mediaService = require('../services/media.service');

const FIELDS = ['name', 'email', 'phone', 'bio', 'specialization', 'experienceYears', 'services', 'workingHours', 'isActive'];
const SERVICE_POPULATE = { path: 'services', select: 'name price duration' };

/** Guarantees exactly one entry per weekday, in order. */
const normaliseWorkingHours = (hours) => {
  if (!Array.isArray(hours)) return undefined;
  const defaults = Employee.defaultWorkingHours();
  return defaults.map((fallback) => {
    const given = hours.find((h) => Number(h.day) === fallback.day);
    if (!given) return fallback;
    if (given.isWorking && given.start >= given.end) {
      throw AppError.badRequest('Working hours must end after they start');
    }
    return { day: fallback.day, isWorking: Boolean(given.isWorking), start: given.start || fallback.start, end: given.end || fallback.end };
  });
};

exports.getEmployees = asyncHandler(async (req, res) => {
  const { search, service, status, page, limit = 20 } = req.query;
  const isAdmin = req.user && req.user.role === 'admin';
  const filter = {};

  if (!isAdmin) filter.isActive = true;
  else if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;

  if (search) {
    const regex = searchRegex(search);
    filter.$or = [{ name: regex }, { specialization: regex }, { email: regex }, { phone: regex }];
  }
  // Stylists with no services assigned are treated as able to perform every service.
  if (service && mongoose.isValidObjectId(service)) {
    filter.$and = [{ $or: [{ services: service }, { services: { $size: 0 } }] }];
  }

  const { items, pagination } = await paginate(Employee, filter, {
    page, limit, sort: '-rating.average name', populate: SERVICE_POPULATE,
    // Contact details are staff-only.
    select: isAdmin ? undefined : '-email -phone',
  });
  res.json({ success: true, data: items, pagination });
});

exports.getEmployee = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const query = Employee.findById(req.params.id).populate(SERVICE_POPULATE);
  if (!isAdmin) query.select('-email -phone');
  const employee = await query;
  if (!employee || (!employee.isActive && !isAdmin)) throw AppError.notFound('Stylist');
  res.json({ success: true, data: employee });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.workingHours = normaliseWorkingHours(data.workingHours);
  data.photo = (await mediaService.saveImage(req.file, req.user.id)) || req.body.photoUrl || '';
  const employee = await Employee.create(data);
  res.status(201).json({ success: true, message: 'Employee added', data: await employee.populate(SERVICE_POPULATE) });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw AppError.notFound('Employee');

  const data = pick(req.body, FIELDS);
  if (data.workingHours) data.workingHours = normaliseWorkingHours(data.workingHours);
  employee.set(data);
  if (req.file) employee.photo = await mediaService.replaceImage(req.file, employee.photo, req.user.id);
  await employee.save();
  res.json({ success: true, message: 'Employee updated', data: await employee.populate(SERVICE_POPULATE) });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw AppError.notFound('Employee');

  const upcoming = await Appointment.countDocuments({
    employee: employee._id, status: { $in: Appointment.ACTIVE_STATUSES }, startAt: { $gte: new Date() },
  });
  if (upcoming) {
    throw AppError.conflict(`This employee has ${upcoming} upcoming appointment(s). Reassign or cancel them first.`);
  }
  // Keep the record (deactivated) when history exists so past appointments still show a name.
  if (await Appointment.exists({ employee: employee._id })) {
    employee.isActive = false;
    await employee.save();
    return res.json({ success: true, message: 'Employee has booking history, so they were deactivated instead of deleted', data: employee });
  }
  await Promise.all([mediaService.removeImage(employee.photo), employee.deleteOne()]);
  res.json({ success: true, message: 'Employee deleted' });
});

/** Admin: appointments for one employee in a date range (default: the next 7 days). */
exports.getSchedule = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).select('name workingHours');
  if (!employee) throw AppError.notFound('Employee');

  const today = nowInZone().date;
  const from = DATE_PATTERN.test(req.query.from || '') ? req.query.from : today;
  const to = DATE_PATTERN.test(req.query.to || '') ? req.query.to : addDays(from, 6);

  const appointments = await Appointment.find({
    employee: employee._id,
    date: { $gte: from, $lte: to },
    status: { $in: ['pending', 'confirmed', 'completed'] },
  })
    .sort('startAt')
    .populate('customer', 'name phone')
    .populate('service', 'name');

  res.json({ success: true, data: { employee, from, to, appointments } });
});
