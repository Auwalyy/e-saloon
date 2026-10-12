/**
 * Payment routes. The Paystack webhook is mounted separately in app.js because
 * it needs the raw request body for signature verification.
 */
const express = require('express');
const controller = require('../controllers/payment.controller');
const rules = require('../validators/appointment.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/config', controller.getConfig);

router.use(protect);
router.get('/', validate(pagination), controller.getPayments);
router.post('/initialize', validate(rules.initializePayment), controller.initializePayment);
router.post('/verify', validate(rules.verifyPayment), controller.verifyPayment);
router.get('/:id', validate(idParam), controller.getPayment);
router.get('/:id/receipt', validate(idParam), controller.downloadReceipt);
router.get('/:id/invoice', validate(idParam), controller.downloadInvoice);

// Staff only
router.patch('/:id/mark-paid', authorize('admin'), validate(rules.markPaid), controller.markPaid);
router.patch('/:id/refund', authorize('admin'), validate(idParam), controller.refundPayment);
router.delete('/:id', authorize('admin'), validate(idParam), controller.deletePayment);

module.exports = router;
