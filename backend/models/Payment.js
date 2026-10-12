/**
 * Payments. Each appointment has exactly one payment record, created as
 * `pending` at booking time and settled either online (Paystack) or at the salon.
 */
const mongoose = require('mongoose');

const METHODS = ['cash', 'pos', 'bank_transfer', 'paystack'];
// `cancelled` = the appointment was cancelled before any money was collected.
const STATUSES = ['pending', 'success', 'failed', 'refunded', 'cancelled'];

const paymentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    method: { type: String, enum: METHODS, default: 'cash' },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    providerReference: { type: String, index: true, sparse: true },
    receiptNumber: { type: String, unique: true, sparse: true },
    paidAt: { type: Date, index: true },
    refundedAt: Date,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

paymentSchema.statics.METHODS = METHODS;
paymentSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Payment', paymentSchema);
