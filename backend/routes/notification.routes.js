/**
 * Notification routes for the signed-in user.
 */
const express = require('express');
const controller = require('../controllers/notification.controller');
const { idParam } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/', controller.getNotifications);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', validate(idParam), controller.markRead);
router.delete('/:id', validate(idParam), controller.deleteNotification);

module.exports = router;
