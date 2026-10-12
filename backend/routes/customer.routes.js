/**
 * Customer management routes (admin only).
 */
const express = require('express');
const controller = require('../controllers/customer.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(adminOnly);
router.get('/', validate(pagination), controller.getCustomers);
router.post('/', validate(rules.createCustomer), controller.createCustomer);
router.get('/:id', validate(idParam), controller.getCustomer);
router.put('/:id', validate([...idParam, ...rules.updateCustomer]), controller.updateCustomer);
router.patch('/:id/toggle-status', validate(idParam), controller.toggleStatus);
router.delete('/:id', validate(idParam), controller.deleteCustomer);

module.exports = router;
