const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', ctrl.getSettings);
router.put('/', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'settings'; next(); },
  upload.single('logo'), ctrl.updateSettings);

module.exports = router;
