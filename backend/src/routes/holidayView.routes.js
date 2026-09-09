const express = require('express');
const controller = require('../controllers/holidayView.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, controller.list);

module.exports = router;
