/**
 * Public route that serves uploaded images.
 */
const express = require('express');
const controller = require('../controllers/media.controller');

const router = express.Router();

router.get('/:id', controller.getMedia);

module.exports = router;
