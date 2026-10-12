/**
 * API route registry: mounts every resource router under /api.
 */
const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/services', require('./service.routes'));
router.use('/categories', require('./category.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/gallery', require('./gallery.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./report.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/media', require('./media.routes'));

module.exports = router;
