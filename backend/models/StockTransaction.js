/**
 * Stock movements: purchases (stock in), sales (stock out) and manual adjustments.
 */
const mongoose = require('mongoose');

const TYPES = ['purchase', 'sale', 'adjustment'];

const stockTransactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
    type: { type: String, enum: TYPES, required: true, index: true },
    quantity: { type: Number, required: true }, // signed for adjustments, positive otherwise
    unitPrice: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    balanceAfter: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockTransactionSchema.statics.TYPES = TYPES;

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
