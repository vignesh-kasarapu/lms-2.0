const express = require('express');
const controller = require('../controllers/holidayView.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, controller.list);
router.get('/optional-summary', requireAuth, controller.optionalSummary);
router.post('/:holidayId/select', requireAuth, controller.selectOptional);
router.delete('/:holidayId/select', requireAuth, controller.deselectOptional);

module.exports = router;
