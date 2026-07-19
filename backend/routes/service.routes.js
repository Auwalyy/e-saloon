const router = require('express').Router();
const ctrl = require('../controllers/service.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const { serviceValidator } = require('../validators/service.validator');

router.get('/', ctrl.getServices);
router.get('/:id', ctrl.getService);
router.post('/', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'services'; next(); },
  upload.single('image'), serviceValidator, validate, ctrl.createService);
router.put('/:id', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'services'; next(); },
  upload.single('image'), ctrl.updateService);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteService);

module.exports = router;
