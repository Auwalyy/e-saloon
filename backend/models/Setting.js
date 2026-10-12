/**
 * Salon-wide settings, stored as a single document (key = "main").
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { TIME_PATTERN } = require('../utils/time');

const openingHourSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, default: true },
    open: { type: String, default: '09:00', match: TIME_PATTERN },
    close: { type: String, default: '19:00', match: TIME_PATTERN },
  },
  { _id: false }
);

const defaultOpeningHours = () =>
  Array.from({ length: 7 }, (_, day) => ({
    day,
    isOpen: day !== 0,
    open: '09:00',
    close: day === 6 ? '17:00' : '19:00',
  }));

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    businessName: { type: String, trim: true, maxlength: 120, default: "Aisha's Salon" },
    tagline: { type: String, trim: true, maxlength: 200, default: 'Where beauty meets luxury' },
    about: { type: String, trim: true, maxlength: 2000, default: '' },
    logo: { type: String, default: '' },
    address: { type: String, trim: true, maxlength: 250, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    currency: { type: String, default: 'NGN' },
    timezone: { type: String, default: env.timezone },
    openingHours: { type: [openingHourSchema], default: defaultOpeningHours },
    slotIntervalMinutes: { type: Number, enum: [15, 30, 60], default: 30 },
    cancellationWindowHours: { type: Number, min: 0, max: 72, default: 2 },
    socialLinks: {
      facebook: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      tiktok: { type: String, trim: true, default: '' },
      whatsapp: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

/** Returns the settings document, creating it with defaults on first use. */
settingSchema.statics.getMain = async function getMain() {
  return this.findOneAndUpdate({ key: 'main' }, {}, { new: true, upsert: true, setDefaultsOnInsert: true });
};

module.exports = mongoose.model('Setting', settingSchema);
