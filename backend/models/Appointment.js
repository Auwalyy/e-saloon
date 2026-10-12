/**
 * Appointments (bookings).
 * `price` and `duration` are snapshots taken at booking time so later changes
 * to a service never rewrite history.
 */
const mongoose = require('mongoose');
const { DATE_PATTERN, TIME_PATTERN } = require('../utils/time');

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show'];
// Statuses that keep the stylist's time reserved.
const ACTIVE_STATUSES = ['pending', 'confirmed'];
const PAYMENT_METHODS = ['cash', 'pos', 'bank_transfer', 'paystack'];

// Allowed status transitions (state machine).
const TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  rejected: [],
  no_show: [],
};

const appointmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true, match: DATE_PATTERN }, // salon-local calendar date
    startTime: { type: String, required: true, match: TIME_PATTERN },
    endTime: { type: String, required: true, match: TIME_PATTERN },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    cancelReason: { type: String, trim: true, maxlength: 500 },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reminderSentAt: Date,
  },
  { timestamps: true }
);

appointmentSchema.index({ employee: 1, date: 1 });
appointmentSchema.index({ status: 1, startAt: 1 });

appointmentSchema.methods.canTransitionTo = function canTransitionTo(next) {
  return TRANSITIONS[this.status].includes(next);
};

appointmentSchema.statics.STATUSES = STATUSES;
appointmentSchema.statics.ACTIVE_STATUSES = ACTIVE_STATUSES;
appointmentSchema.statics.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = mongoose.model('Appointment', appointmentSchema);
