const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), ctrl.getDashboardStats);
router.get('/activity', protect, authorize('admin'), ctrl.getRecentActivity);

module.exports = router;
