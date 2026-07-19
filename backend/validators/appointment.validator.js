const { body } = require('express-validator');

exports.createAppointmentValidator = [
  body('service_id').isUUID().withMessage('Valid service ID required'),
  body('employee_id').isUUID().withMessage('Valid employee ID required'),
  body('appointment_date').isDate().withMessage('Valid date required'),
  body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('Valid time required (HH:MM)'),
];
