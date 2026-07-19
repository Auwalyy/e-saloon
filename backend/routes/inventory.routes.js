const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', protect, authorize('admin'), ctrl.getInventory);
router.get('/alerts', protect, authorize('admin'), ctrl.getLowStockAlerts);
router.post('/', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'inventory'; next(); },
  upload.single('image'), ctrl.createInventoryItem);
router.put('/:id', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'inventory'; next(); },
  upload.single('image'), ctrl.updateInventoryItem);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteInventoryItem);
router.post('/:id/transactions', protect, authorize('admin'), ctrl.addTransaction);

module.exports = router;
