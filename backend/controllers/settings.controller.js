/**
 * Salon settings: public business information and admin updates.
 */
const { Setting } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, pick } = require('../utils/helpers');
const mediaService = require('../services/media.service');

const FIELDS = [
  'businessName', 'tagline', 'about', 'address', 'email', 'phone',
  'slotIntervalMinutes', 'cancellationWindowHours',
];
const SOCIALS = ['facebook', 'instagram', 'twitter', 'tiktok', 'whatsapp'];

exports.getSettings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Setting.getMain() });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getMain();
  settings.set(pick(req.body, FIELDS));

  if (req.body.socialLinks && typeof req.body.socialLinks === 'object') {
    SOCIALS.forEach((key) => {
      if (req.body.socialLinks[key] !== undefined) settings.socialLinks[key] = req.body.socialLinks[key];
    });
  }

  if (Array.isArray(req.body.openingHours)) {
    settings.openingHours = settings.openingHours.map((current) => {
      const given = req.body.openingHours.find((h) => Number(h.day) === current.day);
      if (!given) return current;
      const next = {
        day: current.day,
        isOpen: Boolean(given.isOpen),
        open: given.open || current.open,
        close: given.close || current.close,
      };
      if (next.isOpen && next.open >= next.close) throw AppError.badRequest('Closing time must be after opening time');
      return next;
    });
  }

  if (req.file) settings.logo = await mediaService.replaceImage(req.file, settings.logo, req.user.id);
  await settings.save();
  res.json({ success: true, message: 'Settings saved', data: settings });
});
