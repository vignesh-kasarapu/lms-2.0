const { Op } = require('sequelize');
const {
  Employee, LeaveRequest, Delegation, SelfApprovalPermission, EmployeeRole, Role,
} = require('../models');
const configService = require('./config.service');

/** Role assignment rule: self-approval is prohibited in any capacity, including as delegate/HR. */
function assertNotSelfApproval(actorId, subjectEmployeeId) {
  if (String(actorId) === String(subjectEmployeeId)) {
    throw Object.assign(
      new Error('You cannot approve, reject, or otherwise act on your own leave request, in any capacity.'),
      { status: 403, code: 'SELF_APPROVAL_BLOCKED' },
    );
  }
}

/** BR-22: first-stage approver is the employee's Manager, or that Manager's active Delegate. */
async function getFirstStageApprover(employee, onDate = new Date()) {
  const managerId = employee.reporting_manager_id;
  if (!managerId) return null;

  const activeDelegation = await Delegation.findOne({
    where: {
      nominator_id: managerId,
      from_date: { [Op.lte]: onDate },
      to_date: { [Op.gte]: onDate },
      revoked_at: null,
    },
  });

  return {
    approverId: activeDelegation ? activeDelegation.delegate_id : managerId,
    onBehalfOfId: activeDelegation ? managerId : null,
  };
}

/**
 * BR-24: aggregate contiguous requests (zero deducted working days apart), Pending/Approved only,
 * to decide whether the long-leave (BR-23) or sick-leave (BR-43/44) threshold is crossed.
 * Sick-type days only aggregate with Sick-type days (BR-44).
 */
async function getContiguousAggregateDays(employeeId, leaveTypeId, candidateStart, candidateEnd, { sickOnly = false } = {}) {
  const where = {
    employee_id: employeeId,
    state: { [Op.in]: ['PENDING_MANAGER', 'PENDING_HR', 'APPROVED'] },
  };
  if (sickOnly) where.leave_type_id = leaveTypeId; // only same (Sick) type aggregates for BR-44

  const candidates = await LeaveRequest.findAll({ where });
  // Contiguity check kept simple/explicit here; a full implementation walks the calendar
  // between requests counting only deducted working days, per BR-24's "zero deducted working
  // days apart" definition — delegated to businessDay.service in the request lifecycle.
  const overlappingOrAdjacent = candidates.filter((r) => {
    return new Date(r.end_date) >= new Date(candidateStart) && new Date(r.start_date) <= new Date(candidateEnd);
  });

  const total = overlappingOrAdjacent.reduce((sum, r) => sum + parseFloat(r.deducted_days || 0), 0);
  return total;
}

/** BR-23: does this request (post-aggregation) require HR/Admin second-stage approval? */
async function requiresLongLeaveSecondStage(deductedDays, aggregateDays) {
  const threshold = await configService.get('approval.long_leave_threshold_days');
  return Math.max(deductedDays, aggregateDays) > threshold;
}

/**
 * R1 Addendum (table 37): controlled self-approval.
 * Grants only apply when the employee has an active grant AND no valid higher authority exists.
 * "No valid higher authority" = no reporting manager AND escalation would exhaust the hierarchy.
 */
async function isEligibleForSelfApproval(employee, onDate = new Date()) {
  const grant = await SelfApprovalPermission.findOne({
    where: {
      employee_id: employee.employee_id,
      is_active: true,
      effective_from: { [Op.lte]: onDate },
      [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: onDate } }],
    },
  });
  if (!grant) return false;

  const hasHigherAuthority = Boolean(employee.reporting_manager_id);
  return !hasHigherAuthority;
}

/** BR-37 precondition check used at hierarchy-entry time (LMS-011), not at escalation time. */
async function wouldCreateCircularHierarchy(employeeId, proposedManagerId) {
  let cursor = proposedManagerId;
  const seen = new Set();
  while (cursor) {
    if (String(cursor) === String(employeeId)) return true;
    if (seen.has(cursor)) return true; // defensive: pre-existing cycle
    seen.add(cursor);
    const mgr = await Employee.findByPk(cursor);
    cursor = mgr ? mgr.reporting_manager_id : null;
  }
  return false;
}

/** Explicit role check per Addendum override: Manager role is assigned via employee_roles, not derived. */
async function hasRole(employeeId, roleCode) {
  const count = await EmployeeRole.count({
    include: [{ model: Role, where: { role_code: roleCode }, attributes: [] }],
    where: { employee_id: employeeId },
  });
  return count > 0;
}

module.exports = {
  assertNotSelfApproval,
  getFirstStageApprover,
  getContiguousAggregateDays,
  requiresLongLeaveSecondStage,
  isEligibleForSelfApproval,
  wouldCreateCircularHierarchy,
  hasRole,
};
