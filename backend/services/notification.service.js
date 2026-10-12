/**
 * Notification hub: fans a single business event out to the right channels
 * (dashboard, email, SMS) so controllers stay free of delivery details.
 */
const { Notification, User } = require('../models');
const emailService = require('./email.service');
const { sendSms } = require('./sms.service');

/** Creates a dashboard notification for one user. */
const notifyUser = (userId, { type, title, message, link = '' }) =>
  Notification.create({ recipient: userId, type, title, message, link }).catch((error) => {
    console.error('[notification] failed:', error.message);
  });

/** Creates a dashboard notification for every active administrator. */
const notifyAdmins = async ({ type, title, message, link = '' }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (!admins.length) return;
    await Notification.insertMany(admins.map((admin) => ({ recipient: admin._id, type, title, message, link })));
  } catch (error) {
    console.error('[notification] failed:', error.message);
  }
};

/** Sends a text only when the customer has opted in and has a phone number. */
const smsIfOptedIn = (user, message) => {
  if (user.phone && user.notificationPreferences && user.notificationPreferences.sms) {
    return sendSms({ to: user.phone, message });
  }
  return Promise.resolve();
};

const emailIfOptedIn = (user, send) =>
  !user.notificationPreferences || user.notificationPreferences.email !== false ? send() : Promise.resolve();

/* ------------------------------ Business events ----------------------------- */

const onBookingCreated = async (customer, appointment) => {
  await Promise.all([
    emailIfOptedIn(customer, () => emailService.sendBookingConfirmation(customer, appointment)),
    smsIfOptedIn(customer, `Booking ${appointment.reference} received for ${appointment.date} at ${appointment.startTime}.`),
    notifyUser(customer._id, {
      type: 'appointment',
      title: 'Booking received',
      message: `Your ${appointment.service.name} booking for ${appointment.date} at ${appointment.startTime} is awaiting confirmation.`,
      link: '/my-bookings',
    }),
    notifyAdmins({
      type: 'appointment',
      title: 'New booking',
      message: `${customer.name} booked ${appointment.service.name} with ${appointment.employee.name} on ${appointment.date} at ${appointment.startTime}.`,
      link: '/admin/appointments',
    }),
  ]);
};

const onAppointmentStatusChanged = async (customer, appointment, { reason, byCustomer } = {}) => {
  const label = appointment.status.replace('_', ' ');
  const tasks = [
    emailIfOptedIn(customer, () => emailService.sendAppointmentStatusEmail(customer, appointment, reason)),
    smsIfOptedIn(customer, `Your appointment ${appointment.reference} is now ${label}.`),
    notifyUser(customer._id, {
      type: 'appointment',
      title: `Appointment ${label}`,
      message: `Your ${appointment.service.name} appointment on ${appointment.date} at ${appointment.startTime} is now ${label}.`,
      link: '/my-bookings',
    }),
  ];
  if (byCustomer) {
    tasks.push(notifyAdmins({
      type: 'appointment',
      title: 'Booking cancelled by customer',
      message: `${customer.name} cancelled ${appointment.reference} (${appointment.date} at ${appointment.startTime}).`,
      link: '/admin/appointments',
    }));
  }
  await Promise.all(tasks);
};

const onAppointmentRescheduled = async (customer, appointment, { byCustomer } = {}) => {
  const tasks = [
    emailIfOptedIn(customer, () => emailService.sendRescheduleEmail(customer, appointment)),
    notifyUser(customer._id, {
      type: 'appointment',
      title: 'Appointment rescheduled',
      message: `Your appointment ${appointment.reference} is now on ${appointment.date} at ${appointment.startTime}.`,
      link: '/my-bookings',
    }),
  ];
  if (byCustomer) {
    tasks.push(notifyAdmins({
      type: 'appointment',
      title: 'Booking rescheduled',
      message: `${customer.name} moved ${appointment.reference} to ${appointment.date} at ${appointment.startTime}.`,
      link: '/admin/appointments',
    }));
  }
  await Promise.all(tasks);
};

const onPaymentReceived = async (customer, payment, appointment, receiptPdf) => {
  await Promise.all([
    emailService.sendPaymentReceipt(customer, payment, appointment, receiptPdf),
    notifyUser(customer._id, {
      type: 'payment',
      title: 'Payment received',
      message: `We received your payment for ${appointment.reference}. Receipt ${payment.receiptNumber} is ready.`,
      link: '/profile?tab=payments',
    }),
    notifyAdmins({
      type: 'payment',
      title: 'Payment received',
      message: `${customer.name} paid for ${appointment.reference} via ${payment.method.replace('_', ' ')}.`,
      link: '/admin/payments',
    }),
  ]);
};

const onReviewSubmitted = (customer, review) =>
  notifyAdmins({
    type: 'review',
    title: 'New review awaiting approval',
    message: `${customer.name} left a ${review.rating}-star review.`,
    link: '/admin/reviews',
  });

const onLowStock = (item) =>
  notifyAdmins({
    type: 'inventory',
    title: 'Low stock alert',
    message: `${item.name} is down to ${item.quantity} ${item.unit} (reorder level ${item.reorderLevel}).`,
    link: '/admin/inventory',
  });

/**
 * Fire-and-forget wrapper: notifications run after the response is sent and
 * can never fail the request that triggered them.
 */
const dispatch = (promise) => {
  Promise.resolve(promise).catch((error) => console.error('[notification] dispatch failed:', error.message));
};

module.exports = {
  notifyUser, notifyAdmins, dispatch,
  onBookingCreated, onAppointmentStatusChanged, onAppointmentRescheduled,
  onPaymentReceived, onReviewSubmitted, onLowStock,
};
