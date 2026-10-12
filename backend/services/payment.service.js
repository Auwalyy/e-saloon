/**
 * Payment domain logic: Paystack integration and settlement of payments.
 * Online payment is optional. It switches on when PAYSTACK_SECRET_KEY is set.
 */
const crypto = require('crypto');
const axios = require('axios');
const env = require('../config/env');
const { Payment, Appointment, Setting } = require('../models');
const AppError = require('../utils/AppError');
const { generateReference } = require('../utils/helpers');
const pdfService = require('./pdf.service');
const notifications = require('./notification.service');

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  timeout: 15000,
  headers: { Authorization: `Bearer ${env.paystack.secretKey}` },
});

const isOnlineEnabled = () => Boolean(env.paystack.secretKey);

const populatePayment = (query) =>
  query
    .populate('customer', 'name email phone notificationPreferences')
    .populate({ path: 'appointment', populate: [{ path: 'service', select: 'name' }, { path: 'employee', select: 'name' }] });

/** Starts a Paystack transaction and returns the hosted checkout URL. */
const initializeOnlinePayment = async (payment, customer) => {
  if (!isOnlineEnabled()) throw AppError.badRequest('Online payment is not available. Please pay at the salon.');
  if (payment.status === 'success') throw AppError.conflict('This appointment has already been paid for');

  const providerReference = generateReference('PSK');
  try {
    const { data } = await paystack.post('/transaction/initialize', {
      email: customer.email,
      amount: Math.round(payment.amount * 100), // Paystack expects kobo
      currency: payment.currency,
      reference: providerReference,
      callback_url: `${env.frontendUrl}/payment/callback`,
      metadata: { paymentId: payment.id, appointmentId: String(payment.appointment) },
    });
    payment.method = 'paystack';
    payment.providerReference = providerReference;
    await payment.save();
    return { authorizationUrl: data.data.authorization_url, reference: providerReference };
  } catch (error) {
    if (error.isOperational) throw error;
    console.error('[paystack] initialize failed:', error.response ? error.response.data : error.message);
    throw new AppError('Could not start the online payment. Please try again or pay at the salon.', 502);
  }
};

/**
 * Marks a payment as successful (idempotent), confirms the appointment when it
 * was paid online, then emails the receipt.
 */
const settlePayment = async (paymentId, { method, recordedBy, note } = {}) => {
  // Atomic guard: only one caller can move the payment out of a non-success state.
  const updated = await Payment.findOneAndUpdate(
    { _id: paymentId, status: { $in: ['pending', 'failed', 'cancelled'] } },
    {
      status: 'success',
      paidAt: new Date(),
      receiptNumber: generateReference('RCP'),
      ...(method && { method }),
      ...(recordedBy && { recordedBy }),
      ...(note && { note }),
    },
    { new: true }
  );
  if (!updated) return populatePayment(Payment.findById(paymentId));

  const appointment = await Appointment.findById(updated.appointment);
  if (appointment) {
    appointment.paymentStatus = 'paid';
    appointment.paymentMethod = updated.method;
    // Paying online is the customer's commitment, so the booking is confirmed automatically.
    if (updated.method === 'paystack' && appointment.status === 'pending') appointment.status = 'confirmed';
    await appointment.save();
  }

  const payment = await populatePayment(Payment.findById(paymentId));
  notifications.dispatch((async () => {
    const settings = await Setting.getMain();
    const receipt = await pdfService.generatePaymentDocument(payment, settings, 'receipt');
    await notifications.onPaymentReceived(payment.customer, payment, payment.appointment, receipt);
  })());
  return payment;
};

/** Confirms a Paystack transaction with Paystack's API and settles it. */
const verifyOnlinePayment = async (providerReference) => {
  const payment = await Payment.findOne({ providerReference });
  if (!payment) throw AppError.notFound('Payment');
  if (payment.status === 'success') return populatePayment(Payment.findById(payment._id));

  let transaction;
  try {
    const { data } = await paystack.get(`/transaction/verify/${encodeURIComponent(providerReference)}`);
    transaction = data.data;
  } catch (error) {
    console.error('[paystack] verify failed:', error.response ? error.response.data : error.message);
    throw new AppError('Could not verify the payment with Paystack. Please try again shortly.', 502);
  }

  const amountMatches = transaction.amount === Math.round(payment.amount * 100);
  if (transaction.status !== 'success' || !amountMatches) {
    if (['failed', 'abandoned'].includes(transaction.status)) {
      payment.status = 'failed';
      await payment.save();
    }
    throw AppError.badRequest('Payment was not successful');
  }
  return settlePayment(payment._id, { method: 'paystack' });
};

/** Validates the x-paystack-signature header of a webhook call. */
const isValidWebhookSignature = (rawBody, signature) => {
  if (!isOnlineEnabled() || !signature) return false;
  const expected = crypto.createHmac('sha512', env.paystack.secretKey).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  isOnlineEnabled, populatePayment, initializeOnlinePayment, settlePayment, verifyOnlinePayment, isValidWebhookSignature,
};
