const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', ctrl.getCategories);
router.post('/', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'categories'; next(); },
  upload.single('image'), ctrl.createCategory);
router.put('/:id', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'categories'; next(); },
  upload.single('image'), ctrl.updateCategory);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCategory);

module.exports = router;
