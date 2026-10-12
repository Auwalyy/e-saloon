/**
 * Inventory routes (admin only): products, stock movements and suppliers.
 */
const express = require('express');
const controller = require('../controllers/inventory.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(adminOnly);

// Declared before "/:id" so these paths are never treated as product ids.
router.get('/suppliers', controller.getSuppliers);
router.post('/suppliers', validate(rules.supplier), controller.createSupplier);
router.put('/suppliers/:id', validate([...idParam, ...rules.supplier]), controller.updateSupplier);
router.delete('/suppliers/:id', validate(idParam), controller.deleteSupplier);

router.get('/transactions', validate(pagination), controller.getTransactions);
router.get('/low-stock', controller.getLowStock);

router.get('/', validate(pagination), controller.getItems);
router.post('/', validate(rules.createItem), controller.createItem);
router.put('/:id', validate([...idParam, ...rules.updateItem]), controller.updateItem);
router.delete('/:id', validate(idParam), controller.deleteItem);
router.post('/:id/transactions', validate([...idParam, ...rules.createTransaction]), controller.createTransaction);

module.exports = router;
