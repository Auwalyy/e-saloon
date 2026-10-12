/**
 * Messages submitted through the public contact form.
 */
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    subject: { type: String, trim: true, maxlength: 150, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
