const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, ctrl.getPayments);
router.post('/initialize', protect, ctrl.initializePayment);
router.post('/verify', protect, ctrl.verifyPayment);
router.get('/:id/receipt', protect, ctrl.downloadReceipt);

module.exports = router;
