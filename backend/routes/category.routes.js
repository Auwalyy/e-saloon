/**
 * Category routes: public list, admin CRUD.
 */
const express = require('express');
const controller = require('../controllers/category.controller');
const rules = require('../validators/catalog.validator');
const { idParam } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { optionalAuth, adminOnly } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', optionalAuth, controller.getCategories);
router.post('/', adminOnly, uploadImage('image'), validate(rules.createCategory), controller.createCategory);
router.put('/:id', adminOnly, uploadImage('image'), validate([...idParam, ...rules.updateCategory]), controller.updateCategory);
router.delete('/:id', adminOnly, validate(idParam), controller.deleteCategory);

module.exports = router;
