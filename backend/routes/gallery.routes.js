/**
 * Gallery routes: public grid, admin management.
 */
const express = require('express');
const controller = require('../controllers/gallery.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { optionalAuth, adminOnly } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', optionalAuth, validate(pagination), controller.getGallery);
router.post('/', adminOnly, uploadImage('image'), validate(rules.createGalleryItem), controller.createGalleryItem);
router.put('/:id', adminOnly, uploadImage('image'), validate([...idParam, ...rules.updateGalleryItem]), controller.updateGalleryItem);
router.delete('/:id', adminOnly, validate(idParam), controller.deleteGalleryItem);

module.exports = router;
