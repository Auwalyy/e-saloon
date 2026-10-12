/**
 * Payments: listing, online checkout (Paystack), manual settlement,
 * refunds, and PDF receipts / invoices.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { Payment, Appointment, User, Setting } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, searchRegex } = require('../utils/helpers');
const paymentService = require('../services/payment.service');
const pdfService = require('../services/pdf.service');

const isAdmin = (user) => user.role === 'admin';

const LIST_POPULATE = [
  { path: 'customer', select: 'name email phone' },
  { path: 'appointment', select: 'reference date startTime status service', populate: { path: 'service', select: 'name' } },
];

const findAccessible = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Payment');
  const payment = await paymentService.populatePayment(Payment.findById(id));
  if (!payment) throw AppError.notFound('Payment');
  if (!isAdmin(user) && String(payment.customer._id) !== user.id) throw AppError.notFound('Payment');
  return payment;
};

/** Public: tells the frontend which payment options to offer. */
exports.getConfig = (req, res) => {
  res.json({
    success: true,
    data: {
      onlineEnabled: paymentService.isOnlineEnabled(),
      provider: paymentService.isOnlineEnabled() ? 'paystack' : null,
      publicKey: env.paystack.publicKey || null,
    },
  });
};

exports.getPayments = asyncHandler(async (req, res) => {
  const { status, method, from, to, search, page, limit } = req.query;
  const filter = {};

  if (!isAdmin(req.user)) filter.customer = req.user._id;
  else if (req.query.customer && mongoose.isValidObjectId(req.query.customer)) filter.customer = req.query.customer;

  if (status && Payment.STATUSES.includes(status)) filter.status = status;
  if (method && Payment.METHODS.includes(method)) filter.method = method;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00Z`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59Z`);
  }
  if (search && isAdmin(req.user)) {
    const regex = searchRegex(search);
    const customers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id').limit(200);
    filter.$or = [{ reference: regex }, { receiptNumber: regex }, { customer: { $in: customers.map((c) => c._id) } }];
  }

  const { items, pagination } = await paginate(Payment, filter, { page, limit, populate: LIST_POPULATE });

  let summary;
  if (isAdmin(req.user)) {
    const rows = await Payment.aggregate([{ $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    const of = (key) => rows.find((row) => row._id === key) || { total: 0, count: 0 };
    summary = {
      collected: of('success').total,
      outstanding: of('pending').total,
      refunded: of('refunded').total,
      pendingCount: of('pending').count,
    };
  }
  res.json({ success: true, data: items, pagination, summary });
});

exports.getPayment = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await findAccessible(req.params.id, req.user) });
});

/** Customer: start an online payment for one of their appointments. */
exports.initializePayment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.body.appointmentId, customer: req.user._id });
  if (!appointment) throw AppError.notFound('Appointment');
  if (!Appointment.ACTIVE_STATUSES.includes(appointment.status)) {
    throw AppError.badRequest('This appointment is no longer active');
  }
  const payment = await Payment.findOne({ appointment: appointment._id });
  if (!payment) throw AppError.notFound('Payment');

  const checkout = await paymentService.initializeOnlinePayment(payment, req.user);
  appointment.paymentMethod = 'paystack';
  await appointment.save();
  res.json({ success: true, data: checkout });
});

/** Customer: called from the checkout return page to confirm the transaction. */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const existing = await Payment.findOne({ providerReference: req.body.reference });
  if (!existing) throw AppError.notFound('Payment');
  if (!isAdmin(req.user) && String(existing.customer) !== req.user.id) throw AppError.notFound('Payment');

  const payment = await paymentService.verifyOnlinePayment(req.body.reference);
  res.json({ success: true, message: 'Payment verified', data: payment });
});

/**
 * Paystack webhook (server to server). Guarantees the payment is recorded even
 * if the customer closes the browser before returning to the site.
 * Mounted with express.raw so the signature is checked against the exact bytes.
 */
exports.paystackWebhook = asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  if (!paymentService.isValidWebhookSignature(rawBody, req.headers['x-paystack-signature'])) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }
  const event = JSON.parse(rawBody.toString('utf8'));
  if (event.event === 'charge.success' && event.data && event.data.reference) {
    // Re-verify with Paystack rather than trusting the payload.
    await paymentService.verifyOnlinePayment(event.data.reference).catch((error) => {
      console.error('[paystack] webhook settlement failed:', error.message);
    });
  }
  res.sendStatus(200);
});

/** Admin: record a payment taken at the salon (cash, POS or transfer). */
exports.markPaid = asyncHandler(async (req, res) => {
  const payment = await findAccessible(req.params.id, req.user);
  if (payment.status === 'success') throw AppError.conflict('This payment has already been recorded');
  if (payment.status === 'refunded') throw AppError.badRequest('A refunded payment cannot be marked as paid');
  if (['cancelled', 'rejected'].includes(payment.appointment.status)) {
    throw AppError.badRequest('Cannot take payment for a cancelled appointment');
  }
  const settled = await paymentService.settlePayment(payment._id, {
    method: req.body.method || (payment.method === 'paystack' ? 'cash' : payment.method),
    recordedBy: req.user._id,
    note: req.body.note,
  });
  res.json({ success: true, message: 'Payment recorded', data: settled });
});

/** Admin: mark a successful payment as refunded (the money is returned outside the system). */
exports.refundPayment = asyncHandler(async (req, res) => {
  const payment = await findAccessible(req.params.id, req.user);
  if (payment.status !== 'success') throw AppError.badRequest('Only successful payments can be refunded');

  payment.status = 'refunded';
  payment.refundedAt = new Date();
  if (req.body.note) payment.note = req.body.note;
  await payment.save();
  await Appointment.findByIdAndUpdate(payment.appointment._id, { paymentStatus: 'refunded' });
  res.json({ success: true, message: 'Payment marked as refunded', data: payment });
});

exports.deletePayment = asyncHandler(async (req, res) => {
  const payment = await findAccessible(req.params.id, req.user);
  if (payment.status === 'success') throw AppError.badRequest('Successful payments are financial records and cannot be deleted');
  await payment.deleteOne();
  res.json({ success: true, message: 'Payment deleted' });
});

const sendPdf = (res, buffer, filename) => {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  });
  res.send(buffer);
};

exports.downloadReceipt = asyncHandler(async (req, res) => {
  const payment = await findAccessible(req.params.id, req.user);
  if (!['success', 'refunded'].includes(payment.status) || !payment.receiptNumber) {
    throw AppError.badRequest('A receipt is only available after payment has been received');
  }
  const pdf = await pdfService.generatePaymentDocument(payment, await Setting.getMain(), 'receipt');
  sendPdf(res, pdf, `receipt-${payment.receiptNumber}.pdf`);
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
  const payment = await findAccessible(req.params.id, req.user);
  const pdf = await pdfService.generatePaymentDocument(payment, await Setting.getMain(), 'invoice');
  sendPdf(res, pdf, `invoice-${payment.reference}.pdf`);
});
