/**
 * Stylists / employees, including their weekly availability.
 * Availability is embedded because it is always read together with the
 * employee and is small and bounded (one entry per weekday).
 */
const mongoose = require('mongoose');
const { TIME_PATTERN } = require('../utils/time');

const workingHourSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    isWorking: { type: Boolean, default: true },
    start: { type: String, default: '09:00', match: TIME_PATTERN },
    end: { type: String, default: '18:00', match: TIME_PATTERN },
  },
  { _id: false }
);

const defaultWorkingHours = () =>
  Array.from({ length: 7 }, (_, day) => ({ day, isWorking: day !== 0, start: '09:00', end: '18:00' }));

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true, maxlength: 20 },
    photo: { type: String, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    specialization: { type: String, trim: true, maxlength: 150, default: '' },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    workingHours: { type: [workingHourSchema], default: defaultWorkingHours },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

employeeSchema.statics.defaultWorkingHours = defaultWorkingHours;

module.exports = mongoose.model('Employee', employeeSchema);
