/**
 * Contact form: public submission and admin inbox.
 */
const { ContactMessage, Setting } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, pick } = require('../utils/helpers');
const emailService = require('../services/email.service');
const notifications = require('../services/notification.service');

exports.createMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(pick(req.body, ['name', 'email', 'phone', 'subject', 'message']));

  notifications.dispatch((async () => {
    const settings = await Setting.getMain();
    await Promise.all([
      notifications.notifyAdmins({
        type: 'system', title: 'New contact message', message: `${message.name}: ${message.subject || message.message.slice(0, 80)}`,
        link: '/admin/settings?tab=messages',
      }),
      settings.email ? emailService.sendContactNotification(settings.email, message) : null,
    ]);
  })());

  res.status(201).json({ success: true, message: 'Thank you for reaching out. We will get back to you shortly.' });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { items, pagination } = await paginate(ContactMessage, {}, { page: req.query.page, limit: req.query.limit });
  res.json({ success: true, data: items, pagination });
});

exports.markMessageRead = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!message) throw AppError.notFound('Message');
  res.json({ success: true, data: message });
});

exports.deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw AppError.notFound('Message');
  res.json({ success: true, message: 'Message deleted' });
});
