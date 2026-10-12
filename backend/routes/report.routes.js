/**
 * Report routes (admin only): on-screen report plus PDF / Excel export.
 */
const express = require('express');
const controller = require('../controllers/report.controller');
const rules = require('../validators/catalog.validator');
const validate = require('../middleware/validate.middleware');
const { adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(adminOnly);
router.get('/', validate(rules.report), controller.getReport);
router.get('/export/pdf', validate(rules.report), controller.exportPdf);
router.get('/export/excel', validate(rules.report), controller.exportExcel);

module.exports = router;
