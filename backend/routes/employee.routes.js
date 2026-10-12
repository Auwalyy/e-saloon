/**
 * Employee (stylist) routes: public listing, admin CRUD and schedules.
 */
const express = require('express');
const controller = require('../controllers/employee.controller');
const rules = require('../validators/catalog.validator');
const { idParam, pagination } = require('../validators/common.validator');
const validate = require('../middleware/validate.middleware');
const { optionalAuth, adminOnly } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', optionalAuth, validate(pagination), controller.getEmployees);
router.get('/:id', optionalAuth, validate(idParam), controller.getEmployee);
router.get('/:id/schedule', adminOnly, validate(idParam), controller.getSchedule);

router.post('/', adminOnly, uploadImage('photo'), validate(rules.createEmployee), controller.createEmployee);
router.put('/:id', adminOnly, uploadImage('photo'), validate([...idParam, ...rules.updateEmployee]), controller.updateEmployee);
router.delete('/:id', adminOnly, validate(idParam), controller.deleteEmployee);

module.exports = router;
