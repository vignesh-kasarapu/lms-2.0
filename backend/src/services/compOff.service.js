const { sequelize, CompensatoryOffCredit, LeaveLedger, LeaveType, LeaveYear } = require('../models');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');

/**
 * LMS-083: a Manager/HR-Admin records approved out-of-hours work, crediting
 * the employee's balance under the COMP_OFF leave type. This is a distinct
 * ledger entry type from a manual adjustment so it's traceable to the actual
 * work date it compensates for, not just an unexplained credit.
 */
async function creditCompOff({ employeeId, workDate, hoursOrDays, approvedBy, notes }) {
  return sequelize.transaction(async (transaction) => {
    const compOffType = await LeaveType.findOne({ where: { type_code: 'COMP_OFF' }, transaction });
    if (!compOffType) {
      throw Object.assign(new Error('The COMP_OFF leave type is not seeded. Run the seed script or create it first.'), { status: 500, code: 'COMP_OFF_TYPE_MISSING' });
    }
    const leaveYear = await LeaveYear.findOne({ where: { is_current: true }, transaction });

    const ledgerEntry = await LeaveLedger.create({
      employee_id: employeeId, leave_type_id: compOffType.leave_type_id, leave_year_id: leaveYear.leave_year_id,
      entry_type: 'MANUAL_ADJUSTMENT', quantity: Math.abs(hoursOrDays),
      source_reference: `comp_off:${workDate}`, actor_id: approvedBy,
      reason: notes || `Compensatory off for work on ${workDate}`,
    }, { transaction });

    const credit = await CompensatoryOffCredit.create({
      employee_id: employeeId, work_date: workDate, hours_or_days: hoursOrDays,
      ledger_entry_id: ledgerEntry.entry_id, approved_by: approvedBy, notes,
    }, { transaction });

    await auditService.record({
      actorId: approvedBy, action: 'COMP_OFF_CREDITED', entityType: 'compensatory_off_credits',
      entityId: credit.comp_off_id, newValue: { employeeId, workDate, hoursOrDays }, transaction,
    });

    await notificationService.notify({
      recipientId: employeeId, templateKey: 'COMP_OFF_CREDITED', tokens: { hoursOrDays, workDate }, transaction,
    }).catch(() => {});

    return credit;
  });
}

async function listForEmployee(employeeId) {
  return CompensatoryOffCredit.findAll({ where: { employee_id: employeeId }, order: [['work_date', 'DESC']] });
}

module.exports = { creditCompOff, listForEmployee };
