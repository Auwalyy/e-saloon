/**
 * Dashboard notifications for the signed-in user.
 */
const { Notification } = require('../models');
const { asyncHandler, paginate } = require('../utils/helpers');

exports.getNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [{ items, pagination }, unreadCount] = await Promise.all([
    paginate(Notification, filter, { page: req.query.page, limit: req.query.limit || 15 }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data: items, pagination, unreadCount });
});

exports.markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { isRead: true });
  res.json({ success: true });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true });
});
