/**
 * Settings routes: public read, admin update.
 */
const express = require('express');
const controller = require('../controllers/settings.controller');
const rules = require('../validators/catalog.validator');
const validate = require('../middleware/validate.middleware');
const { adminOnly } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', controller.getSettings);
router.put('/', adminOnly, uploadImage('logo'), validate(rules.settings), controller.updateSettings);

module.exports = router;
