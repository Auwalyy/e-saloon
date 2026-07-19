const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/auth.validator');

router.post('/register', registerValidator, validate, ctrl.register);
router.post('/login', loginValidator, validate, ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', forgotPasswordValidator, validate, ctrl.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, ctrl.resetPassword);
router.get('/me', protect, ctrl.getMe);
router.put('/profile', protect, ctrl.updateProfile);
router.put('/change-password', protect, ctrl.changePassword);
router.put('/avatar', protect, (req, res, next) => { req.uploadFolder = 'avatars'; next(); }, upload.single('avatar'), ctrl.updateAvatar);

module.exports = router;
