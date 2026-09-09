const express = require('express');
const controller = require('../controllers/ledger.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/my', requireAuth, controller.myLedger);
router.get('/employee/:employeeId', requireAuth, requireRole('HR_ADMIN'), controller.employeeLedger);
router.post('/adjust', requireAuth, requireRole('HR_ADMIN'), controller.adjust);

module.exports = router;
