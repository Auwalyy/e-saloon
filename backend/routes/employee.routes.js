const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', ctrl.getEmployees);
router.get('/:id', ctrl.getEmployee);
router.get('/by-service/:serviceId', ctrl.getEmployeesByService);
router.post('/', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'employees'; next(); },
  upload.single('avatar'), ctrl.createEmployee);
router.put('/:id', protect, authorize('admin'),
  (req, res, next) => { req.uploadFolder = 'employees'; next(); },
  upload.single('avatar'), ctrl.updateEmployee);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteEmployee);
router.put('/:id/availability', protect, authorize('admin'), ctrl.updateAvailability);

module.exports = router;
