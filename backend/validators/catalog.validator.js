/**
 * Validation rules for the salon catalogue and back-office resources:
 * services, categories, employees, customers, reviews, gallery, inventory,
 * settings and the contact form.
 */
const { body, query, mongoId, email, phone } = require('./common.validator');
const { TIME_PATTERN } = require('../utils/time');

const GALLERY_CATEGORIES = ['Hair', 'Braids', 'Facials', 'Spa', 'Makeup', 'Pedicure'];

/** Makes every rule optional, for PUT/PATCH (partial update) endpoints. */
const partial = (rules) => rules.map((rule) => rule.optional());

const serviceRules = () => [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Service name must be between 2 and 150 characters'),
  body('price').isFloat({ min: 0, max: 10000000 }).withMessage('Price must be a positive number').toFloat(),
  body('duration').isInt({ min: 15, max: 600 }).withMessage('Duration must be between 15 and 600 minutes')
    .custom((value) => Number(value) % 15 === 0).withMessage('Duration must be a multiple of 15 minutes').toInt(),
];
const serviceOptional = [
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description is too long'),
  body('category').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid category'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean(),
];
exports.createService = [...serviceRules(), ...serviceOptional];
exports.updateService = [...partial(serviceRules()), ...serviceOptional];

const categoryRules = () => [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
];
const categoryOptional = [
  body('description').optional().trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean().toBoolean(),
];
exports.createCategory = [...categoryRules(), ...categoryOptional];
exports.updateCategory = [...partial(categoryRules()), ...categoryOptional];

const employeeRules = () => [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
];
const employeeOptional = [
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email address').toLowerCase(),
  phone(),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('specialization').optional().trim().isLength({ max: 150 }),
  body('experienceYears').optional().isInt({ min: 0, max: 60 }).withMessage('Experience must be between 0 and 60 years').toInt(),
  body('services').optional().isArray().withMessage('Services must be a list'),
  body('services.*').isMongoId().withMessage('Invalid service'),
  body('workingHours').optional().isArray({ min: 1, max: 7 }).withMessage('Working hours must list the days of the week'),
  body('workingHours.*.day').isInt({ min: 0, max: 6 }).toInt(),
  body('workingHours.*.start').optional().matches(TIME_PATTERN).withMessage('Start time must be HH:mm'),
  body('workingHours.*.end').optional().matches(TIME_PATTERN).withMessage('End time must be HH:mm'),
  body('isActive').optional().isBoolean().toBoolean(),
];
exports.createEmployee = [...employeeRules(), ...employeeOptional];
exports.updateEmployee = [...partial(employeeRules()), ...employeeOptional];

exports.createCustomer = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  email(),
  phone(),
  body('address').optional().trim().isLength({ max: 250 }),
];
exports.updateCustomer = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  phone(),
  body('address').optional().trim().isLength({ max: 250 }),
  body('isActive').optional().isBoolean().toBoolean(),
];

exports.createReview = [
  mongoId('appointmentId', body),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment is too long'),
];
exports.updateReview = [
  body('isApproved').optional().isBoolean().toBoolean(),
  body('reply').optional().trim().isLength({ max: 1000 }),
];

exports.createGalleryItem = [
  body('category').isIn(GALLERY_CATEGORIES).withMessage('Choose a valid gallery category'),
  body('title').optional().trim().isLength({ max: 150 }),
];
exports.updateGalleryItem = [
  body('category').optional().isIn(GALLERY_CATEGORIES).withMessage('Choose a valid gallery category'),
  body('title').optional().trim().isLength({ max: 150 }),
  body('isActive').optional().isBoolean().toBoolean(),
];

const itemRules = () => [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Product name must be between 2 and 150 characters'),
  body('sku').trim().isLength({ min: 2, max: 40 }).withMessage('SKU must be between 2 and 40 characters'),
];
const itemOptional = [
  body('category').optional().trim().isLength({ max: 80 }),
  body('supplier').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid supplier'),
  body('unit').optional().trim().isLength({ max: 20 }),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity cannot be negative').toInt(),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level cannot be negative').toInt(),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price cannot be negative').toFloat(),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price cannot be negative').toFloat(),
  body('isActive').optional().isBoolean().toBoolean(),
];
exports.createItem = [...itemRules(), ...itemOptional];
exports.updateItem = [...partial(itemRules()), ...itemOptional];

exports.createTransaction = [
  body('type').isIn(['purchase', 'sale', 'adjustment']).withMessage('Type must be purchase, sale or adjustment'),
  body('quantity').isInt().withMessage('Quantity must be a whole number')
    .custom((value) => Number(value) !== 0).withMessage('Quantity cannot be zero')
    .custom((value, { req }) => req.body.type === 'adjustment' || Number(value) > 0)
    .withMessage('Quantity must be greater than zero'),
  body('unitPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('supplier').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid supplier'),
  body('note').optional().trim().isLength({ max: 300 }),
];

exports.supplier = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Supplier name must be between 2 and 150 characters'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email address'),
  phone(),
  body('contactPerson').optional().trim().isLength({ max: 100 }),
  body('address').optional().trim().isLength({ max: 250 }),
];

exports.settings = [
  body('businessName').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Business name must be between 2 and 120 characters'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email address'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  body('address').optional().trim().isLength({ max: 250 }),
  body('tagline').optional().trim().isLength({ max: 200 }),
  body('about').optional().trim().isLength({ max: 2000 }),
  body('slotIntervalMinutes').optional().isIn([15, 30, 60]).withMessage('Slot interval must be 15, 30 or 60 minutes').toInt(),
  body('cancellationWindowHours').optional().isInt({ min: 0, max: 72 }).withMessage('Cancellation window must be 0 to 72 hours').toInt(),
  body('openingHours').optional().isArray({ max: 7 }),
  body('openingHours.*.day').isInt({ min: 0, max: 6 }).toInt(),
  body('openingHours.*.open').optional().matches(TIME_PATTERN).withMessage('Opening time must be HH:mm'),
  body('openingHours.*.close').optional().matches(TIME_PATTERN).withMessage('Closing time must be HH:mm'),
  body('socialLinks').optional().isObject(),
  body('socialLinks.*').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
];

exports.contact = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Please enter your name'),
  email(),
  phone(),
  body('subject').optional().trim().isLength({ max: 150 }),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
];

exports.report = [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'annual']).withMessage('Invalid report period'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be in YYYY-MM-DD format'),
];
