/**
 * Review routes: public list, customer submission, admin moderation.
 */
const express = require('express');
const controller = require('../controllers/review.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { protect, optionalAuth, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', optionalAuth, validate(pagination), controller.getReviews);
router.post('/', protect, authorize('customer'), validate(rules.createReview), controller.createReview);
router.put('/:id', protect, authorize('admin'), validate([...idParam, ...rules.updateReview]), controller.updateReview);
router.delete('/:id', protect, validate(idParam), controller.deleteReview);

module.exports = router;
