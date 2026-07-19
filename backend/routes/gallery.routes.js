const router = require('express').Router();
const ctrl = require('../controllers/gallery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', ctrl.getGallery);
router.post('/', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'gallery'; next(); },
  upload.single('image'), ctrl.addGalleryImage);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteGalleryImage);

module.exports = router;
