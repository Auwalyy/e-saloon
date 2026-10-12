/**
 * Booking grid: one document per 15-minute block reserved for a stylist.
 *
 * The unique index on (employee, date, block) is what makes double booking
 * impossible. Two simultaneous requests for overlapping times both try to
 * insert the same block and MongoDB rejects one of them atomically, with no
 * need for multi-document transactions.
 */
const mongoose = require('mongoose');

const BLOCK_MINUTES = 15;

const bookedSlotSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    block: { type: Number, required: true }, // minutes since midnight, multiple of 15
  },
  { timestamps: true }
);

bookedSlotSchema.index({ employee: 1, date: 1, block: 1 }, { unique: true });

bookedSlotSchema.statics.BLOCK_MINUTES = BLOCK_MINUTES;

module.exports = mongoose.model('BookedSlot', bookedSlotSchema);
