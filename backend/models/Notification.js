/**
 * In-app (dashboard) notifications, one document per recipient.
 */
const mongoose = require('mongoose');

const TYPES = ['appointment', 'payment', 'review', 'inventory', 'system'];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPES, default: 'system' },
    title: { type: String, required: true, maxlength: 150 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Keep the collection small: notifications expire after 90 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Notification', notificationSchema);
