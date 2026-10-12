/**
 * Contact form routes: public submission (rate limited), admin inbox.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/contact.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

router.post('/', contactLimiter, validate(rules.contact), controller.createMessage);
router.get('/', adminOnly, validate(pagination), controller.getMessages);
router.patch('/:id/read', adminOnly, validate(idParam), controller.markMessageRead);
router.delete('/:id', adminOnly, validate(idParam), controller.deleteMessage);

module.exports = router;
