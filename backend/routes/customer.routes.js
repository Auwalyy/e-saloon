const router = require('express').Router();
const ctrl = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), ctrl.getCustomers);
router.get('/:id', protect, authorize('admin'), ctrl.getCustomer);
router.patch('/:id/toggle-status', protect, authorize('admin'), ctrl.toggleCustomerStatus);

module.exports = router;
