/**
 * Admin customer management: list, search, detail (booking + spending history),
 * create (walk-in), update, activate / deactivate, delete.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const { User, Appointment, Payment, Review, Notification } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, searchRegex, pick } = require('../utils/helpers');

const findCustomer = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Customer');
  const customer = await User.findOne({ _id: id, role: 'customer' });
  if (!customer) throw AppError.notFound('Customer');
  return customer;
};

exports.getCustomers = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.query;
  const filter = { role: 'customer' };
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) {
    const regex = searchRegex(search);
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const { items, pagination } = await paginate(User, filter, { page, limit });
  const ids = items.map((customer) => customer._id);

  // Booking count and lifetime spend for the customers on this page only.
  const [bookings, spending] = await Promise.all([
    Appointment.aggregate([{ $match: { customer: { $in: ids } } }, { $group: { _id: '$customer', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { customer: { $in: ids }, status: 'success' } },
      { $group: { _id: '$customer', total: { $sum: '$amount' } } },
    ]),
  ]);
  const bookingsById = new Map(bookings.map((row) => [String(row._id), row.count]));
  const spendById = new Map(spending.map((row) => [String(row._id), row.total]));

  res.json({
    success: true,
    data: items.map((customer) => ({
      ...customer.toJSON(),
      totalBookings: bookingsById.get(customer.id) || 0,
      totalSpent: spendById.get(customer.id) || 0,
    })),
    pagination,
  });
});

exports.getCustomer = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);

  const [appointments, payments, statusRows] = await Promise.all([
    Appointment.find({ customer: customer._id }).sort('-startAt').limit(50)
      .populate('service', 'name').populate('employee', 'name'),
    Payment.find({ customer: customer._id }).sort('-createdAt').limit(50)
      .populate({ path: 'appointment', select: 'reference date service', populate: { path: 'service', select: 'name' } }),
    Appointment.aggregate([{ $match: { customer: customer._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const totalSpent = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
  const count = (status) => (statusRows.find((row) => row._id === status) || { count: 0 }).count;

  res.json({
    success: true,
    data: {
      customer,
      stats: {
        totalBookings: statusRows.reduce((sum, row) => sum + row.count, 0),
        completed: count('completed'),
        cancelled: count('cancelled') + count('rejected'),
        noShow: count('no_show'),
        totalSpent,
      },
      appointments,
      payments,
    },
  });
});

/** Admin: register a walk-in / phone customer. They set their own password via "Forgot password". */
exports.createCustomer = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'phone', 'address']);
  if (await User.exists({ email: data.email })) throw AppError.conflict('An account with this email already exists');
  const customer = await User.create({
    ...data,
    role: 'customer',
    password: `${crypto.randomBytes(18).toString('base64url')}aA1!`,
  });
  res.status(201).json({ success: true, message: 'Customer created', data: customer });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  customer.set(pick(req.body, ['name', 'phone', 'address', 'isActive']));
  await customer.save();
  res.json({ success: true, message: 'Customer updated', data: customer });
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  customer.isActive = !customer.isActive;
  await customer.save();
  res.json({
    success: true,
    message: customer.isActive ? 'Customer reactivated' : 'Customer deactivated',
    data: customer,
  });
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (await Appointment.exists({ customer: customer._id })) {
    throw AppError.conflict('This customer has booking history. Deactivate the account instead of deleting it.');
  }
  await Promise.all([
    Review.deleteMany({ customer: customer._id }),
    Notification.deleteMany({ recipient: customer._id }),
    customer.deleteOne(),
  ]);
  res.json({ success: true, message: 'Customer deleted' });
});
