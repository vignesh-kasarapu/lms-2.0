const express = require('express');
const controller = require('../controllers/r3.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Blackout periods — HR/Admin manages, everyone can read (so Apply screen can warn/block).
router.get('/blackout-periods', requireAuth, controller.blackout.list);
router.post('/blackout-periods', requireAuth, requireRole('HR_ADMIN'), controller.blackout.create);
router.post('/blackout-periods/:blackoutId/deactivate', requireAuth, requireRole('HR_ADMIN'), controller.blackout.deactivate);

// Team capacity limits — HR/Admin only.
router.get('/team-capacity-limits/:managerId', requireAuth, requireRole('HR_ADMIN', 'MANAGER'), controller.capacity.listForManager);
router.post('/team-capacity-limits', requireAuth, requireRole('HR_ADMIN'), controller.capacity.create);

// Leave encashment — HR/Admin initiates, employee views own.
router.post('/leave-encashment', requireAuth, requireRole('HR_ADMIN'), controller.encashment.create);
router.get('/leave-encashment/mine', requireAuth, controller.encashment.mine);

// Compensatory off — Manager/HR credits, employee views own.
router.post('/comp-off', requireAuth, requireRole('MANAGER', 'HR_ADMIN'), controller.compOff.credit);
router.get('/comp-off/mine', requireAuth, controller.compOff.mine);

// Calendar feed subscriptions (session-authenticated management endpoints).
router.post('/calendar-feed/subscribe', requireAuth, controller.calendarFeed.subscribe);
router.get('/calendar-feed/mine', requireAuth, controller.calendarFeed.mine);
router.post('/calendar-feed/:subscriptionId/revoke', requireAuth, controller.calendarFeed.revoke);

module.exports = router;
