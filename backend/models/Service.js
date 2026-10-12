/**
 * Salon services that customers can book.
 * Duration is stored in minutes and must be a multiple of 15 so it maps
 * cleanly onto the booking grid (see BookedSlot).
 */
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    price: { type: Number, required: true, min: 0 },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 600,
      validate: { validator: (v) => v % 15 === 0, message: 'Duration must be a multiple of 15 minutes' },
    },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

serviceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
