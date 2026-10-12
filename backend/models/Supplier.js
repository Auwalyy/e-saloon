/**
 * Suppliers of inventory products.
 */
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    contactPerson: { type: String, trim: true, maxlength: 100, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    email: { type: String, lowercase: true, trim: true, maxlength: 150, default: '' },
    address: { type: String, trim: true, maxlength: 250, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
