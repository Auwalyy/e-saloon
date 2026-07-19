const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { reviewValidator } = require('../validators/service.validator');

router.get('/', ctrl.getReviews);
router.post('/', protect, reviewValidator, validate, ctrl.createReview);
router.patch('/:id/approve', protect, authorize('admin'), ctrl.approveReview);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteReview);

module.exports = router;
