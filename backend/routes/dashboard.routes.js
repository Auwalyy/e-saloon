/**
 * Dashboard analytics (admin only).
 */
const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', adminOnly, controller.getDashboard);

module.exports = router;
