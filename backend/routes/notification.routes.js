const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, ctrl.getNotifications);
router.patch('/:id/read', protect, ctrl.markRead);
router.patch('/read-all', protect, ctrl.markAllRead);

module.exports = router;
