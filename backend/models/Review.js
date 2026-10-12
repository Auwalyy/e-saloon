/**
 * Customer reviews. A review is tied to a completed appointment (one each)
 * and is only shown publicly once an administrator approves it.
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    isApproved: { type: Boolean, default: false, index: true },
    reply: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

/** Recalculates the cached rating on an employee from approved reviews. */
reviewSchema.statics.refreshEmployeeRating = async function refreshEmployeeRating(employeeId) {
  if (!employeeId) return;
  const [stats] = await this.aggregate([
    { $match: { employee: new mongoose.Types.ObjectId(employeeId), isApproved: true } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('Employee').findByIdAndUpdate(employeeId, {
    rating: { average: stats ? Math.round(stats.average * 10) / 10 : 0, count: stats ? stats.count : 0 },
  });
};

module.exports = mongoose.model('Review', reviewSchema);
