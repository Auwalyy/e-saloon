/**
 * Appointments: availability lookup, booking, and the full lifecycle
 * (approve, reject, cancel, reschedule, reassign, complete).
 */
const mongoose = require('mongoose');
const { Appointment, Payment, User, Service, Setting, Review } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, searchRegex, generateReference } = require('../utils/helpers');
const { timeToMinutes, minutesToTime, zonedToUtc } = require('../utils/time');
const slotService = require('../services/slot.service');
const paymentService = require('../services/payment.service');
const notifications = require('../services/notification.service');

const POPULATE = [
  { path: 'customer', select: 'name email phone avatar notificationPreferences' },
  { path: 'service', select: 'name image duration price' },
  { path: 'employee', select: 'name photo specialization' },
];

const isAdmin = (user) => user.role === 'admin';

/** Loads an appointment and enforces that customers only ever see their own. */
const findAccessible = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Appointment');
  const appointment = await Appointment.findById(id).populate(POPULATE);
  if (!appointment) throw AppError.notFound('Appointment');
  if (!isAdmin(user) && String(appointment.customer._id) !== user.id) throw AppError.notFound('Appointment');
  return appointment;
};

/** Customers may only change a booking up to N hours before it starts. */
const assertCustomerCanModify = async (appointment) => {
  if (!Appointment.ACTIVE_STATUSES.includes(appointment.status)) {
    throw AppError.badRequest(`A ${appointment.status.replace('_', ' ')} appointment can no longer be changed`);
  }
  const { cancellationWindowHours } = await Setting.getMain();
  const deadline = appointment.startAt.getTime() - cancellationWindowHours * 60 * 60 * 1000;
  if (Date.now() > deadline) {
    throw AppError.badRequest(
      `Appointments can only be changed up to ${cancellationWindowHours} hour(s) before the start time. Please call the salon.`
    );
  }
};

/** Moves an appointment to a new slot/stylist, keeping the booking grid consistent. */
const moveAppointment = async (appointment, { date, startTime, employeeId }) => {
  const targetEmployee = employeeId || appointment.employee._id;
  await slotService.assertSlotIsBookable({
    serviceId: appointment.service._id, employeeId: targetEmployee, date, startTime, excludeAppointmentId: appointment._id,
  });

  const previous = {
    employeeId: appointment.employee._id, date: appointment.date, startTime: appointment.startTime, duration: appointment.duration,
  };
  await slotService.releaseSlots(appointment._id);
  try {
    await slotService.reserveSlots({
      appointmentId: appointment._id, employeeId: targetEmployee, date, startTime, duration: appointment.duration,
    });
  } catch (error) {
    // Lost a race for the new slot: put the original reservation back.
    await slotService.reserveSlots({ appointmentId: appointment._id, ...previous }).catch(() => {});
    throw error;
  }

  const { timezone } = await Setting.getMain();
  const endTime = minutesToTime(timeToMinutes(startTime) + appointment.duration);
  appointment.set({
    employee: targetEmployee,
    date,
    startTime,
    endTime,
    startAt: zonedToUtc(date, startTime, timezone),
    endAt: zonedToUtc(date, endTime, timezone),
    reminderSentAt: null,
  });
  await appointment.save();
  return appointment.populate(POPULATE);
};

/* --------------------------------- Lookups --------------------------------- */

exports.getSlots = asyncHandler(async (req, res) => {
  const { serviceId, employeeId, date, excludeAppointmentId } = req.query;
  const slots = await slotService.getSlotsForDate({ serviceId, employeeId, date, excludeAppointmentId });
  res.json({ success: true, data: slots });
});

exports.getAvailableDates = asyncHandler(async (req, res) => {
  const { serviceId, employeeId, month } = req.query;
  const dates = await slotService.getAvailableDates({ serviceId, employeeId, month });
  res.json({ success: true, data: dates });
});

exports.getAppointments = asyncHandler(async (req, res) => {
  const { status, employee, from, to, search, page, limit, scope } = req.query;
  const filter = {};

  if (!isAdmin(req.user)) filter.customer = req.user._id;
  else if (req.query.customer && mongoose.isValidObjectId(req.query.customer)) filter.customer = req.query.customer;

  if (status && Appointment.STATUSES.includes(status)) filter.status = status;
  if (employee && mongoose.isValidObjectId(employee)) filter.employee = employee;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }
  if (scope === 'upcoming') {
    filter.startAt = { $gte: new Date() };
    filter.status = { $in: Appointment.ACTIVE_STATUSES };
  } else if (scope === 'past') {
    filter.$or = [{ startAt: { $lt: new Date() } }, { status: { $nin: Appointment.ACTIVE_STATUSES } }];
  }

  if (search && isAdmin(req.user)) {
    const regex = searchRegex(search);
    const [customers, services] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select('_id').limit(200),
      Service.find({ name: regex }).select('_id').limit(200),
    ]);
    filter.$and = [{
      $or: [
        { reference: regex },
        { customer: { $in: customers.map((c) => c._id) } },
        { service: { $in: services.map((s) => s._id) } },
      ],
    }];
  }

  const sort = scope === 'upcoming' ? 'startAt' : '-startAt';
  const { items, pagination } = await paginate(Appointment, filter, { page, limit, sort, populate: POPULATE });

  // Attach each appointment's payment summary and whether it has been reviewed,
  // so list screens can offer "Pay", "Receipt" and "Review" without extra requests.
  const ids = items.map((appointment) => appointment._id);
  const [payments, reviewed] = await Promise.all([
    Payment.find({ appointment: { $in: ids } }).select('appointment status method reference receiptNumber'),
    Review.find({ appointment: { $in: ids } }).select('appointment'),
  ]);
  const paymentByAppointment = new Map(payments.map((payment) => [String(payment.appointment), payment]));
  const reviewedIds = new Set(reviewed.map((review) => String(review.appointment)));
  const data = items.map((appointment) => ({
    ...appointment.toJSON(),
    payment: paymentByAppointment.get(appointment.id) || null,
    hasReview: reviewedIds.has(appointment.id),
  }));
  res.json({ success: true, data, pagination });
});

exports.getAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAccessible(req.params.id, req.user);
  const payment = await Payment.findOne({ appointment: appointment._id });
  res.json({ success: true, data: { ...appointment.toJSON(), payment } });
});

/* --------------------------------- Booking --------------------------------- */

exports.createAppointment = asyncHandler(async (req, res) => {
  const { serviceId, employeeId, date, startTime, notes } = req.body;
  let { paymentMethod = 'cash' } = req.body;

  // Admins can book on behalf of a (walk-in / phone) customer.
  let customer = req.user;
  if (isAdmin(req.user)) {
    if (!req.body.customerId) throw AppError.badRequest('Please choose the customer this booking is for');
    customer = await User.findOne({ _id: req.body.customerId, role: 'customer' });
    if (!customer) throw AppError.notFound('Customer');
  }
  if (paymentMethod === 'paystack' && !paymentService.isOnlineEnabled()) paymentMethod = 'cash';

  await slotService.assertSlotIsBookable({ serviceId, employeeId, date, startTime });
  const [service, settings] = await Promise.all([Service.findById(serviceId), Setting.getMain()]);
  const endTime = minutesToTime(timeToMinutes(startTime) + service.duration);

  const appointment = new Appointment({
    reference: generateReference('APT'),
    customer: customer._id,
    service: service._id,
    employee: employeeId,
    date,
    startTime,
    endTime,
    startAt: zonedToUtc(date, startTime, settings.timezone),
    endAt: zonedToUtc(date, endTime, settings.timezone),
    duration: service.duration,
    price: service.price,
    paymentMethod,
    notes,
    // Bookings made by staff are confirmed straight away.
    status: isAdmin(req.user) ? 'confirmed' : 'pending',
  });

  // Reserve first: the unique index decides the winner if two people book the same time.
  await slotService.reserveSlots({
    appointmentId: appointment._id, employeeId, date, startTime, duration: service.duration,
  });

  let payment;
  try {
    await appointment.save();
    payment = await Payment.create({
      reference: generateReference('PAY'),
      appointment: appointment._id,
      customer: customer._id,
      amount: service.price,
      currency: settings.currency,
      method: paymentMethod,
    });
  } catch (error) {
    await Promise.all([slotService.releaseSlots(appointment._id), Appointment.deleteOne({ _id: appointment._id })]);
    throw error;
  }

  await appointment.populate(POPULATE);
  notifications.dispatch(notifications.onBookingCreated(customer, appointment));

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: { ...appointment.toJSON(), payment },
  });
});

/* -------------------------------- Lifecycle -------------------------------- */

/** Shared status change used by the admin endpoints and customer cancellation. */
const changeStatus = async (appointment, status, { reason, actor }) => {
  if (appointment.status === status) return appointment;
  if (!appointment.canTransitionTo(status)) {
    throw AppError.badRequest(`A ${appointment.status.replace('_', ' ')} appointment cannot be marked as ${status.replace('_', ' ')}`);
  }
  if (status === 'completed' && appointment.startAt > new Date()) {
    throw AppError.badRequest('An appointment cannot be completed before it has started');
  }

  appointment.status = status;
  if (['cancelled', 'rejected'].includes(status)) {
    appointment.cancelReason = reason;
    appointment.cancelledBy = actor._id;
  }
  await appointment.save();

  // Once a booking is dead, free the stylist's time and void any payment still owed.
  if (!Appointment.ACTIVE_STATUSES.includes(status) && status !== 'completed') {
    await Promise.all([
      slotService.releaseSlots(appointment._id),
      Payment.updateOne({ appointment: appointment._id, status: { $in: ['pending', 'failed'] } }, { status: 'cancelled' }),
    ]);
  }

  notifications.dispatch(
    notifications.onAppointmentStatusChanged(appointment.customer, appointment, { reason, byCustomer: !isAdmin(actor) })
  );
  return appointment;
};

exports.updateStatus = asyncHandler(async (req, res) => {
  const appointment = await findAccessible(req.params.id, req.user);
  await changeStatus(appointment, req.body.status, { reason: req.body.reason, actor: req.user });
  res.json({ success: true, message: `Appointment ${req.body.status.replace('_', ' ')}`, data: appointment });
});

exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAccessible(req.params.id, req.user);
  if (!isAdmin(req.user)) await assertCustomerCanModify(appointment);
  await changeStatus(appointment, 'cancelled', { reason: req.body.reason, actor: req.user });
  res.json({ success: true, message: 'Appointment cancelled', data: appointment });
});

exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAccessible(req.params.id, req.user);
  if (!Appointment.ACTIVE_STATUSES.includes(appointment.status)) {
    throw AppError.badRequest(`A ${appointment.status.replace('_', ' ')} appointment cannot be rescheduled`);
  }
  if (!isAdmin(req.user)) await assertCustomerCanModify(appointment);

  const { date, startTime, employeeId } = req.body;
  const updated = await moveAppointment(appointment, { date, startTime, employeeId });
  notifications.dispatch(
    notifications.onAppointmentRescheduled(updated.customer, updated, { byCustomer: !isAdmin(req.user) })
  );
  res.json({ success: true, message: 'Appointment rescheduled', data: updated });
});

/** Admin: general update (assign a different stylist, edit notes, move, change status). */
exports.updateAppointment = asyncHandler(async (req, res) => {
  let appointment = await findAccessible(req.params.id, req.user);
  const { employeeId, date, startTime, notes, status, reason } = req.body;

  const wantsMove =
    (employeeId && employeeId !== String(appointment.employee._id)) ||
    (date && date !== appointment.date) ||
    (startTime && startTime !== appointment.startTime);

  if (wantsMove) {
    if (!Appointment.ACTIVE_STATUSES.includes(appointment.status)) {
      throw AppError.badRequest('Only pending or confirmed appointments can be moved or reassigned');
    }
    appointment = await moveAppointment(appointment, {
      date: date || appointment.date,
      startTime: startTime || appointment.startTime,
      employeeId,
    });
    notifications.dispatch(notifications.onAppointmentRescheduled(appointment.customer, appointment));
  }
  if (notes !== undefined) {
    appointment.notes = notes;
    await appointment.save();
  }
  if (status) await changeStatus(appointment, status, { reason, actor: req.user });

  res.json({ success: true, message: 'Appointment updated', data: appointment });
});

exports.deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await findAccessible(req.params.id, req.user);
  const payment = await Payment.findOne({ appointment: appointment._id });
  if (payment && payment.status === 'success') {
    throw AppError.badRequest('A paid appointment cannot be deleted. Cancel it and refund the payment instead.');
  }
  await Promise.all([
    slotService.releaseSlots(appointment._id),
    Payment.deleteOne({ appointment: appointment._id }),
    Review.deleteOne({ appointment: appointment._id }),
    appointment.deleteOne(),
  ]);
  res.json({ success: true, message: 'Appointment deleted' });
});
