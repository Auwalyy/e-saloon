/**
 * Images shown on the public gallery page, grouped by category.
 */
const mongoose = require('mongoose');

const CATEGORIES = ['Hair', 'Braids', 'Facials', 'Spa', 'Makeup', 'Pedicure'];

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 150, default: '' },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

galleryItemSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
