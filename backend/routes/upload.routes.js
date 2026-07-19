const router = require('express').Router();
const ctrl = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/', protect,
  (req, res, next) => { req.uploadFolder = req.query.folder || 'general'; next(); },
  upload.single('image'), ctrl.uploadImage);

module.exports = router;
