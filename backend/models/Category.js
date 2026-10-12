/**
 * Service categories (Hair, Braids, Spa ...) used to group and filter services.
 */
const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function setSlug(next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model('Category', categorySchema);
