const router = require('express').Router();
const ctrl = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createAppointmentValidator } = require('../validators/appointment.validator');

router.get('/slots', protect, ctrl.getAvailableSlots);
router.get('/', protect, ctrl.getAppointments);
router.get('/:id', protect, ctrl.getAppointment);
router.post('/', protect, createAppointmentValidator, validate, ctrl.createAppointment);
router.put('/:id', protect, ctrl.updateAppointment);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteAppointment);

module.exports = router;
