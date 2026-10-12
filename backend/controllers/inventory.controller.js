/**
 * Inventory: products, suppliers, stock movements (purchases, sales,
 * adjustments) and low-stock alerts.
 */
const { InventoryItem, Supplier, StockTransaction } = require('../models');
const AppError = require('../utils/AppError');
const { asyncHandler, paginate, searchRegex, pick } = require('../utils/helpers');
const notifications = require('../services/notification.service');

const ITEM_FIELDS = ['name', 'sku', 'category', 'supplier', 'unit', 'reorderLevel', 'costPrice', 'sellingPrice', 'isActive'];
const SUPPLIER_FIELDS = ['name', 'contactPerson', 'phone', 'email', 'address', 'isActive'];
const LOW_STOCK = { $expr: { $lte: ['$quantity', '$reorderLevel'] }, isActive: true };

/* --------------------------------- Products -------------------------------- */

exports.getItems = asyncHandler(async (req, res) => {
  const { search, category, supplier, lowStock, page, limit } = req.query;
  const filter = {};
  if (search) filter.$or = [{ name: searchRegex(search) }, { sku: searchRegex(search) }];
  if (category) filter.category = category;
  if (supplier) filter.supplier = supplier;
  if (lowStock === 'true') Object.assign(filter, LOW_STOCK);

  const { items, pagination } = await paginate(InventoryItem, filter, {
    page, limit, sort: 'name', populate: { path: 'supplier', select: 'name phone' },
  });

  const [totals] = await InventoryItem.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        products: { $sum: 1 },
        units: { $sum: '$quantity' },
        stockValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        retailValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
      },
    },
  ]);
  const [lowStockCount, categories] = await Promise.all([
    InventoryItem.countDocuments(LOW_STOCK),
    InventoryItem.distinct('category'),
  ]);

  res.json({
    success: true,
    data: items,
    pagination,
    summary: { products: 0, units: 0, stockValue: 0, retailValue: 0, ...(totals || {}), lowStockCount, _id: undefined },
    categories: categories.sort(),
  });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find(LOW_STOCK).sort('quantity').populate('supplier', 'name phone');
  res.json({ success: true, data: items });
});

exports.createItem = asyncHandler(async (req, res) => {
  const data = pick(req.body, ITEM_FIELDS);
  if (!data.supplier) delete data.supplier;
  const openingStock = Math.max(0, Number(req.body.quantity) || 0);
  const item = await InventoryItem.create({ ...data, quantity: openingStock });

  if (openingStock > 0) {
    await StockTransaction.create({
      item: item._id, type: 'adjustment', quantity: openingStock, unitPrice: item.costPrice,
      total: 0, note: 'Opening stock', balanceAfter: openingStock, createdBy: req.user._id,
    });
  }
  res.status(201).json({ success: true, message: 'Product added', data: await item.populate('supplier', 'name phone') });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw AppError.notFound('Product');
  const data = pick(req.body, ITEM_FIELDS); // quantity is deliberately excluded: use a stock transaction
  if (data.supplier === '') data.supplier = null;
  item.set(data);
  await item.save();
  res.json({ success: true, message: 'Product updated', data: await item.populate('supplier', 'name phone') });
});

exports.deleteItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw AppError.notFound('Product');
  await Promise.all([StockTransaction.deleteMany({ item: item._id }), item.deleteOne()]);
  res.json({ success: true, message: 'Product deleted' });
});

/* ------------------------------ Stock movements ----------------------------- */

exports.getTransactions = asyncHandler(async (req, res) => {
  const { type, item, page, limit } = req.query;
  const filter = {};
  if (type && StockTransaction.TYPES.includes(type)) filter.type = type;
  if (item) filter.item = item;

  const { items, pagination } = await paginate(StockTransaction, filter, {
    page, limit,
    populate: [
      { path: 'item', select: 'name sku unit' },
      { path: 'supplier', select: 'name' },
      { path: 'createdBy', select: 'name' },
    ],
  });
  res.json({ success: true, data: items, pagination });
});

/**
 * Records a purchase (+), sale (-) or adjustment (+/-) and updates stock atomically.
 * The conditional update means stock can never go below zero, even under concurrency.
 */
exports.createTransaction = asyncHandler(async (req, res) => {
  const { type, note } = req.body;
  const quantity = Number(req.body.quantity);
  const delta = type === 'sale' ? -Math.abs(quantity) : type === 'purchase' ? Math.abs(quantity) : quantity;

  const existing = await InventoryItem.findById(req.params.id);
  if (!existing) throw AppError.notFound('Product');

  const item = await InventoryItem.findOneAndUpdate(
    { _id: existing._id, quantity: { $gte: -delta } },
    { $inc: { quantity: delta } },
    { new: true }
  );
  if (!item) {
    throw AppError.badRequest(`Not enough stock. Only ${existing.quantity} ${existing.unit} of ${existing.name} available.`);
  }

  const fallbackPrice = type === 'sale' ? item.sellingPrice : item.costPrice;
  const unitPrice = req.body.unitPrice !== undefined && req.body.unitPrice !== '' ? Number(req.body.unitPrice) : fallbackPrice;
  const transaction = await StockTransaction.create({
    item: item._id,
    type,
    quantity: type === 'adjustment' ? delta : Math.abs(delta),
    unitPrice,
    total: type === 'adjustment' ? 0 : Math.abs(delta) * unitPrice,
    supplier: type === 'purchase' ? req.body.supplier || item.supplier : undefined,
    note,
    balanceAfter: item.quantity,
    createdBy: req.user._id,
  });

  // Alert only when this movement is what pushed the item to or below its reorder level.
  if (item.quantity <= item.reorderLevel && existing.quantity > existing.reorderLevel) {
    notifications.dispatch(notifications.onLowStock(item));
  }
  res.status(201).json({ success: true, message: 'Stock updated', data: { item, transaction } });
});

/* --------------------------------- Suppliers -------------------------------- */

exports.getSuppliers = asyncHandler(async (req, res) => {
  const filter = req.query.search ? { name: searchRegex(req.query.search) } : {};
  const suppliers = await Supplier.find(filter).sort('name');
  res.json({ success: true, data: suppliers });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(pick(req.body, SUPPLIER_FIELDS));
  res.status(201).json({ success: true, message: 'Supplier added', data: supplier });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, pick(req.body, SUPPLIER_FIELDS), {
    new: true, runValidators: true,
  });
  if (!supplier) throw AppError.notFound('Supplier');
  res.json({ success: true, message: 'Supplier updated', data: supplier });
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw AppError.notFound('Supplier');
  await Promise.all([
    InventoryItem.updateMany({ supplier: supplier._id }, { $unset: { supplier: 1 } }),
    supplier.deleteOne(),
  ]);
  res.json({ success: true, message: 'Supplier deleted' });
});
