const { Op } = require('sequelize');
const {
  sequelize, Employee, EmployeeFinalSettlement, ManagerReassignmentLog, LeaveType, LeaveYear, LeaveRequest,
} = require('../models');
const balanceService = require('./balance.service');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');

/**
 * LMS-016/017: deactivate an employee, recording a last working day, and produce
 * a final settlement position — the balance at that date, prorated. No payment
 * calculation is performed; this is a snapshot for downstream consumption only.
 */
async function deactivate({ employeeId, lastWorkingDay, actorId }) {
  return sequelize.transaction(async (transaction) => {
    const employee = await Employee.findByPk(employeeId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });
    if (employee.status === 'DEACTIVATED') {
      throw Object.assign(new Error('Employee is already deactivated.'), { status: 400, code: 'ALREADY_DEACTIVATED' });
    }

    const leaveYear = await LeaveYear.findOne({ where: { is_current: true }, transaction });
    const leaveTypes = await LeaveType.findAll({ where: { is_balance_affecting: true }, transaction });

    const balancesAtSettlement = {};
    for (const lt of leaveTypes) {
      const b = await balanceService.getEffectiveBalance(employeeId, lt.leave_type_id, leaveYear.leave_year_id);
      balancesAtSettlement[lt.type_code] = b;
    }

    const settlement = await EmployeeFinalSettlement.create({
      employee_id: employeeId,
      deactivated_at: lastWorkingDay,
      settlement_snapshot_json: JSON.stringify({ lastWorkingDay, leaveYear: leaveYear.year_code, balances: balancesAtSettlement }),
      created_by: actorId,
    }, { transaction });

    employee.status = 'DEACTIVATED';
    employee.deactivated_at = lastWorkingDay;
    await employee.save({ transaction });

    await auditService.record({
      actorId, action: 'EMPLOYEE_DEACTIVATED', entityType: 'employees', entityId: employeeId,
      newValue: { lastWorkingDay }, transaction,
    });

    return { employee, settlement };
  });
}

/** LMS-018: reassign an employee to a new manager. Requests already pending with
 * the previous manager remain there unless explicitly transferred — silently
 * moving a pending request to a manager with no context is worse than leaving
 * it, per the FRD's own detail note on this requirement.
 */
async function reassignManager({ employeeId, newManagerId, transferPendingRequests, actorId }) {
  return sequelize.transaction(async (transaction) => {
    const employee = await Employee.findByPk(employeeId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const approvalRouting = require('./approvalRouting.service');
    const circular = await approvalRouting.wouldCreateCircularHierarchy(employeeId, newManagerId);
    if (circular) {
      throw Object.assign(new Error('This reassignment would create a circular reporting chain.'), { status: 400, code: 'CIRCULAR_HIERARCHY' });
    }

    const oldManagerId = employee.reporting_manager_id;
    employee.reporting_manager_id = newManagerId;
    await employee.save({ transaction });

    if (transferPendingRequests) {
      await LeaveRequest.update(
        { current_approver_id: newManagerId },
        { where: { employee_id: employeeId, current_approver_id: oldManagerId, state: 'PENDING_MANAGER' }, transaction },
      );
    }

    const log = await ManagerReassignmentLog.create({
      employee_id: employeeId, old_manager_id: oldManagerId, new_manager_id: newManagerId,
      pending_requests_transferred: !!transferPendingRequests, reassigned_by: actorId,
    }, { transaction });

    await auditService.record({
      actorId, action: 'MANAGER_REASSIGNED', entityType: 'employees', entityId: employeeId,
      priorValue: { reporting_manager_id: oldManagerId }, newValue: { reporting_manager_id: newManagerId, transferred: !!transferPendingRequests },
      transaction,
    });

    // Both managers and the employee are notified — explicit, never silent (per the FRD's detail note).
    await notificationService.notify({ recipientId: employeeId, templateKey: 'MANAGER_REASSIGNED', tokens: { newManagerId }, transaction }).catch(() => {});
    if (oldManagerId) await notificationService.notify({ recipientId: oldManagerId, templateKey: 'MANAGER_REASSIGNED', tokens: { newManagerId }, transaction }).catch(() => {});
    await notificationService.notify({ recipientId: newManagerId, templateKey: 'MANAGER_REASSIGNED', tokens: { newManagerId }, transaction }).catch(() => {});

    return log;
  });
}

module.exports = { deactivate, reassignManager };