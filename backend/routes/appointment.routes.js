/**
 * Appointment routes. Availability lookups are public; everything else needs a session.
 */
const express = require('express');
const controller = require('../controllers/appointment.controller');
const rules = require('../validators/appointment.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/slots', validate(rules.slots), controller.getSlots);
router.get('/available-dates', validate(rules.availableDates), controller.getAvailableDates);

router.use(protect);
router.get('/', validate(pagination), controller.getAppointments);
router.post('/', validate(rules.create), controller.createAppointment);
router.get('/:id', validate(idParam), controller.getAppointment);
router.patch('/:id/cancel', validate(rules.cancel), controller.cancelAppointment);
router.patch('/:id/reschedule', validate(rules.reschedule), controller.rescheduleAppointment);

// Staff only
router.put('/:id', authorize('admin'), validate(rules.update), controller.updateAppointment);
router.patch('/:id/status', authorize('admin'), validate(rules.status), controller.updateStatus);
router.delete('/:id', authorize('admin'), validate(idParam), controller.deleteAppointment);

module.exports = router;
