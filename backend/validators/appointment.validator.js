/**
 * Validation rules for appointment and payment endpoints.
 */
const { body, query, mongoId, idParam, dateField, timeField } = require('./common.validator');

const reason = body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason is too long');
const notes = body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes are too long');

exports.slots = [
  mongoId('serviceId', query),
  mongoId('employeeId', query),
  dateField('date', query),
  query('excludeAppointmentId').optional().isMongoId(),
];

exports.availableDates = [
  mongoId('serviceId', query),
  mongoId('employeeId', query),
  query('month').matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('month must be in YYYY-MM format'),
];

exports.create = [
  mongoId('serviceId', body),
  mongoId('employeeId', body),
  dateField('date'),
  timeField('startTime'),
  body('paymentMethod').optional().isIn(['cash', 'pos', 'bank_transfer', 'paystack']).withMessage('Invalid payment method'),
  body('customerId').optional().isMongoId().withMessage('Invalid customer'),
  notes,
];

exports.reschedule = [
  ...idParam,
  dateField('date'),
  timeField('startTime'),
  body('employeeId').optional().isMongoId().withMessage('Invalid stylist'),
];

exports.status = [
  ...idParam,
  body('status').isIn(['confirmed', 'rejected', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status'),
  reason,
];

exports.cancel = [...idParam, reason];

exports.update = [
  ...idParam,
  body('employeeId').optional().isMongoId().withMessage('Invalid stylist'),
  dateField('date').optional(),
  timeField('startTime').optional(),
  body('status').optional().isIn(['confirmed', 'rejected', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status'),
  notes,
  reason,
];

exports.initializePayment = [mongoId('appointmentId', body)];

exports.verifyPayment = [body('reference').trim().isLength({ min: 6, max: 80 }).withMessage('Invalid payment reference')];

exports.markPaid = [
  ...idParam,
  body('method').optional().isIn(['cash', 'pos', 'bank_transfer']).withMessage('Invalid payment method'),
  body('note').optional().trim().isLength({ max: 300 }),
];
