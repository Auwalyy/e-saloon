/**
 * Service routes: public catalogue, admin CRUD.
 */
const express = require('express');
const controller = require('../controllers/service.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { optionalAuth, adminOnly } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', optionalAuth, validate(pagination), controller.getServices);
router.get('/popular', controller.getPopularServices);
router.get('/:id', optionalAuth, validate(idParam), controller.getService);

router.post('/', adminOnly, uploadImage('image'), validate(rules.createService), controller.createService);
router.put('/:id', adminOnly, uploadImage('image'), validate([...idParam, ...rules.updateService]), controller.updateService);
router.delete('/:id', adminOnly, validate(idParam), controller.deleteService);

module.exports = router;
