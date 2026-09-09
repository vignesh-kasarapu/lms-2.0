const { LeaveLedger, LeaveYear } = require('../models');
const balanceService = require('../services/balance.service');
const auditService = require('../services/audit.service');
const notificationService = require('../services/notification.service');
const { ok, created } = require('../utils/apiResponse');

function withRunningBalance(entries) {
  let running = 0;
  return entries.map((e) => {
    running += parseFloat(e.quantity);
    return { ...e.toJSON(), running_balance: running };
  });
}

/** Builds a where clause that only includes filters the caller actually supplied — an
 * explicit `undefined` in a Sequelize where clause is a query error, not "no filter". */
async function buildLedgerWhere(employeeId, leaveTypeId, leaveYearId) {
  const where = { employee_id: employeeId };
  if (leaveTypeId) where.leave_type_id = leaveTypeId;
  if (leaveYearId) {
    where.leave_year_id = leaveYearId;
  } else {
    // No year specified — default to the current leave year rather than
    // silently returning every year's entries mixed together.
    const current = await LeaveYear.findOne({ where: { is_current: true } });
    if (current) where.leave_year_id = current.leave_year_id;
  }
  return where;
}

/** LMS-057: an employee's full ledger, every entry with type/quantity/running balance/source/timestamp. */
async function myLedger(req, res) {
  const { leaveTypeId, leaveYearId } = req.query;
  const where = await buildLedgerWhere(req.currentUser.employeeId, leaveTypeId, leaveYearId);
  const entries = await LeaveLedger.findAll({ where, order: [['created_at', 'ASC']] });
  return ok(res, withRunningBalance(entries));
}

/** §7.3.17: HR/Admin views any employee's full ledger — the balance-adjustment screen shows this inline. */
async function employeeLedger(req, res) {
  const { leaveTypeId, leaveYearId } = req.query;
  const where = await buildLedgerWhere(req.params.employeeId, leaveTypeId, leaveYearId);
  const entries = await LeaveLedger.findAll({ where, order: [['created_at', 'ASC']] });
  return ok(res, withRunningBalance(entries));
}

/** LMS-054: HR/Admin manual adjustment — signed quantity + mandatory reason, never silent. */
async function adjust(req, res) {
  const { employeeId, leaveTypeId, leaveYearId, quantity, reason } = req.body;

  const entry = await balanceService.writeManualAdjustment({
    employeeId, leaveTypeId, leaveYearId, quantity, reason, actorId: req.currentUser.employeeId,
  });

  await auditService.record({
    actorId: req.currentUser.employeeId, action: 'BALANCE_ADJUSTED', entityType: 'leave_ledger',
    entityId: entry.entry_id, newValue: { quantity, reason },
  });

  await notificationService.notify({
    recipientId: employeeId, templateKey: 'BALANCE_ADJUSTED', tokens: { quantity, reason },
  });

  return created(res, entry);
}

module.exports = { myLedger, employeeLedger, adjust };
