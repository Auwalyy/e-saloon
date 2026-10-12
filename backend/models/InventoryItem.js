/**
 * Inventory products (retail items and salon consumables).
 * Stock changes only through StockTransaction records so there is an audit trail.
 */
const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    category: { type: String, trim: true, maxlength: 80, default: 'General' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    quantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, trim: true, maxlength: 20, default: 'pcs' },
    reorderLevel: { type: Number, default: 5, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventoryItemSchema.virtual('isLowStock').get(function isLowStock() {
  return this.quantity <= this.reorderLevel;
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
