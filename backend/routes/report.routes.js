const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('admin'), ctrl.getReport);
router.get('/export/pdf', protect, authorize('admin'), ctrl.exportPDF);
router.get('/export/excel', protect, authorize('admin'), ctrl.exportExcel);

module.exports = router;
