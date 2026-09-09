const { Op } = require('sequelize');
const {
  sequelize, LeaveRequest, Employee, LeaveType, LeaveYear, Watcher, ProjectAssignment,
} = require('../models');
const businessDayService = require('./businessDay.service');
const balanceService = require('./balance.service');
const approvalRouting = require('./approvalRouting.service');
const configService = require('./config.service');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const blackoutPeriodService = require('./blackoutPeriod.service');
const teamCapacityService = require('./teamCapacity.service');
const watcherService = require('./watcher.service');

class LeaveRequestError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** LMS-037: refuse overlap with the employee's own request in Pending/Approved/Cancellation Requested. */
async function assertNoOverlap(employeeId, startDate, endDate, excludeRequestId = null) {
  const where = {
    employee_id: employeeId,
    state: { [Op.in]: ['PENDING_MANAGER', 'PENDING_HR', 'APPROVED', 'CANCELLATION_REQUESTED'] },
    start_date: { [Op.lte]: endDate },
    end_date: { [Op.gte]: startDate },
  };
  if (excludeRequestId) where.request_id = { [Op.ne]: excludeRequestId };

  const conflict = await LeaveRequest.findOne({ where });
  if (conflict) {
    throw new LeaveRequestError(
      'OVERLAP',
      `This span overlaps request #${conflict.request_id} (${conflict.start_date} to ${conflict.end_date}).`,
    );
  }
}

/** BR-27/BR-28: backdating window capped at the leave-year start; a closed year is never touched. */
async function assertWithinBackdatingWindow(startDate, leaveYear) {
  if (leaveYear.is_closed) throw new LeaveRequestError('CLOSED_YEAR', 'The selected leave year is closed.');

  const windowDays = await configService.get('backdating.window_days');
  const earliestByWindow = new Date();
  earliestByWindow.setDate(earliestByWindow.getDate() - windowDays);

  const earliest = earliestByWindow > new Date(leaveYear.start_date) ? earliestByWindow : new Date(leaveYear.start_date);
  if (new Date(startDate) < earliest) {
    throw new LeaveRequestError(
      'BACKDATING_WINDOW_EXCEEDED',
      `The earliest permitted start date is ${earliest.toISOString().slice(0, 10)}.`,
    );
  }
}

/**
 * LMS-033 to LMS-040: build the live "cost" preview shown on the Apply screen (LMS-036),
 * without creating a request. Never a bare number.
 */
async function previewApplication({ employeeId, leaveTypeId, startDate, endDate, isHalfDay }) {
  const leaveYear = await LeaveYear.findOne({ where: { is_current: true } });
  const breakdown = await businessDayService.computeDeductionBreakdown({
    startDate, endDate, isHalfDay, leaveYearId: leaveYear.leave_year_id, employeeId,
  });
  const balance = await balanceService.getEffectiveBalance(employeeId, leaveTypeId, leaveYear.leave_year_id);
  const projectedBalance = balance.effectiveBalance - breakdown.deductedWorkingDays;
  const shortfall = projectedBalance < 0 ? Math.abs(projectedBalance) : 0;

  return {
    ...breakdown,
    ...balance,
    projectedBalance,
    isAdvanceLeave: shortfall > 0,
    shortfall,
    leaveYear,
  };
}

/**
 * LMS-033: submit a new leave request end to end — validates overlap and backdating (blocking),
 * computes deduction + advance-leave flag (warns, never blocks per BR-11), then routes it
 * to first-stage approval (self-approval addendum, or Manager/Delegate per BR-22).
 */
async function submitRequest({ employeeId, leaveTypeId, startDate, endDate, isHalfDay, halfDayPortion, reason, attachmentRefs = [] }) {
  return sequelize.transaction(async (transaction) => {
    const employee = await Employee.findByPk(employeeId, { transaction });
    const leaveType = await LeaveType.findByPk(leaveTypeId, { transaction });
    if (!leaveType.is_selectable_by_employee) {
      throw new LeaveRequestError('TYPE_NOT_SELECTABLE', `${leaveType.type_name} cannot be applied for directly.`);
    }

    const leaveYear = await LeaveYear.findOne({ where: { is_current: true }, transaction });
    await assertWithinBackdatingWindow(startDate, leaveYear);
    await assertNoOverlap(employeeId, startDate, endDate);
    await blackoutPeriodService.assertNoBlackoutConflict({ leaveTypeId, startDate, endDate }); // LMS-085
    await teamCapacityService.assertWithinCapacity({ employeeId, startDate, endDate }); // LMS-086

    const breakdown = await businessDayService.computeDeductionBreakdown({
      startDate, endDate, isHalfDay, leaveYearId: leaveYear.leave_year_id, employeeId,
    });
    const balance = await balanceService.getEffectiveBalance(employeeId, leaveTypeId, leaveYear.leave_year_id);
    const isAdvanceLeave = breakdown.deductedWorkingDays > balance.effectiveBalance; // BR-11: warn, never block

    const aggregateDays = await approvalRouting.getContiguousAggregateDays(
      employeeId, leaveTypeId, startDate, endDate,
    );
    const isLongLeave = await approvalRouting.requiresLongLeaveSecondStage(breakdown.deductedWorkingDays, aggregateDays);

    const request = await LeaveRequest.create({
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      leave_year_id: leaveYear.leave_year_id,
      start_date: startDate,
      end_date: endDate,
      is_half_day: isHalfDay,
      half_day_portion: halfDayPortion || null,
      reason,
      state: 'PENDING_MANAGER',
      deducted_days: breakdown.deductedWorkingDays,
      is_advance_leave: isAdvanceLeave,
      is_long_leave: isLongLeave,
      application_timestamp: new Date(),
    }, { transaction });

    // Self-approval addendum: only when an active grant exists AND no higher authority exists.
    const selfEligible = await approvalRouting.isEligibleForSelfApproval(employee);
    if (selfEligible) {
      await approveStageInternal({
        request, stage: 'SELF', actorId: employeeId, onBehalfOfId: null, transaction,
      });
    } else {
      const firstStage = await approvalRouting.getFirstStageApprover(employee);
      if (!firstStage) {
        throw new LeaveRequestError('NO_APPROVER', 'No reporting manager on record and no self-approval grant exists.');
      }
      request.current_approver_id = firstStage.approverId;
      request.sla_started_at = new Date();
      await request.save({ transaction });

      await notificationService.notify({
        recipientId: firstStage.approverId,
        templateKey: 'REQUEST_AWAITING_DECISION',
        tokens: { employeeName: employee.full_name, startDate, endDate, days: breakdown.deductedWorkingDays },
        relatedRequestId: request.request_id,
        transaction,
      });
    }

    // LMS-014: project lead auto-watcher for the assignment's effective period.
    const activeAssignments = await ProjectAssignment.findAll({
      where: {
        employee_id: employeeId,
        effective_from: { [Op.lte]: startDate },
        [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: endDate } }],
      },
      transaction,
    });
    for (const assignment of activeAssignments) {
      await Watcher.create({
        request_id: request.request_id,
        watcher_employee_id: assignment.project_lead_id,
        added_by_id: employeeId,
      }, { transaction });
    }

    // LMS-062: standing watchers auto-apply to every request raised in their active period.
    await watcherService.applyStandingWatchers(request, transaction);

    // Notification matrix §6.5 — every watcher (project-lead or standing) is told a watched request was submitted.
    await watcherService.notifyWatchers(request.request_id, 'WATCHED_REQUEST_SUBMITTED', transaction);

    // BR-43/44/45: extended sick-leave alerting, aggregated over contiguous Sick-only days.
    if (leaveType.is_sick_leave) {
      const sickThreshold = await configService.get('sick_leave.alert_threshold_days');
      const sickAggregate = await approvalRouting.getContiguousAggregateDays(
        employeeId, leaveTypeId, startDate, endDate, { sickOnly: true },
      );
      if (Math.max(breakdown.deductedWorkingDays, sickAggregate) > sickThreshold) {
        const alertSupervisor = await configService.get('sick_leave.alert_supervisor_enabled');
        const alertHr = await configService.get('sick_leave.alert_hr_enabled');
        const tokens = { employeeName: employee.full_name, days: breakdown.deductedWorkingDays };

        if (alertSupervisor && employee.reporting_manager_id) {
          const manager = await Employee.findByPk(employee.reporting_manager_id, { transaction });
          if (manager?.reporting_manager_id) {
            await notificationService.notify({
              recipientId: manager.reporting_manager_id, templateKey: 'EXTENDED_SICK_LEAVE_ALERT', tokens,
              relatedRequestId: request.request_id, transaction,
            });
          }
        }
        if (alertHr) {
          const { EmployeeRole, Role } = require('../models');
          const hrAdmins = await EmployeeRole.findAll({ include: [{ model: Role, where: { role_code: 'HR_ADMIN' } }], transaction });
          for (const hr of hrAdmins) {
            await notificationService.notify({
              recipientId: hr.employee_id, templateKey: 'EXTENDED_SICK_LEAVE_ALERT', tokens,
              relatedRequestId: request.request_id, transaction,
            });
          }
        }
      }
    }

    await auditService.record({
      actorId: employeeId, action: 'LEAVE_REQUEST_SUBMITTED', entityType: 'leave_requests',
      entityId: request.request_id, newValue: { state: request.state, deducted_days: request.deducted_days },
      transaction,
    });

    await notificationService.notify({
      recipientId: employeeId,
      templateKey: 'REQUEST_SUBMITTED_CONFIRMATION',
      tokens: { days: breakdown.deductedWorkingDays, startDate, endDate },
      relatedRequestId: request.request_id,
      transaction,
    });

    return request;
  });
}

/** Shared by Manager/HR/Self decision paths. Writes the approval row and advances state. */
async function approveStageInternal({ request, stage, actorId, onBehalfOfId, transaction }) {
  const { LeaveRequestApproval } = require('../models');

  if (stage !== 'SELF') approvalRouting.assertNotSelfApproval(actorId, request.employee_id);

  await LeaveRequestApproval.create({
    request_id: request.request_id,
    stage,
    actor_id: actorId,
    on_behalf_of_id: onBehalfOfId,
    decision: 'APPROVE',
    decision_timestamp: new Date(),
  }, { transaction });

  if (stage === 'SELF' || stage === 'HR' || (stage === 'MANAGER' && !request.is_long_leave)) {
    request.state = 'APPROVED';
    request.current_approver_id = null;
    await request.save({ transaction });
    await balanceService.writeDeductionEntry({ request, actorId, transaction }); // BR-09
  } else if (stage === 'MANAGER' && request.is_long_leave) {
    request.state = 'PENDING_HR'; // BR-23: sequential, HR does not see it until Manager approves
    await request.save({ transaction });

    // BR-26/LMS-046: notification only — the supervisor has no approval authority over this request.
    const manager = await Employee.findByPk(actorId, { transaction });
    if (manager?.reporting_manager_id) {
      const employee = await Employee.findByPk(request.employee_id, { transaction });
      await notificationService.notify({
        recipientId: manager.reporting_manager_id, templateKey: 'LONG_LEAVE_SUPERVISOR_NOTICE',
        tokens: { employeeName: employee.full_name }, relatedRequestId: request.request_id, transaction,
      });
    }
  }

  return request;
}

/** LMS-044/047: Manager or HR/Admin decision on a pending request. */
async function decide({ requestId, actorId, decision, reason }) {
  return sequelize.transaction(async (transaction) => {
    const request = await LeaveRequest.findByPk(requestId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!request) throw new LeaveRequestError('NOT_FOUND', 'Request not found', 404);

    approvalRouting.assertNotSelfApproval(actorId, request.employee_id);

    const validStates = ['PENDING_MANAGER', 'PENDING_HR'];
    if (!validStates.includes(request.state)) {
      throw new LeaveRequestError('INVALID_STATE', `Request is in ${request.state}, not actionable.`);
    }
    if (decision === 'REJECT' && !reason?.trim()) {
      throw new LeaveRequestError('REASON_REQUIRED', 'A rejection reason is mandatory.');
    }

    const stage = request.state === 'PENDING_MANAGER' ? 'MANAGER' : 'HR';

    if (decision === 'APPROVE') {
      await approveStageInternal({ request, stage, actorId, onBehalfOfId: null, transaction });
      // Only notify watchers on a truly final APPROVED — a Manager approval that
      // moves to PENDING_HR isn't a decision yet, just a stage transition.
      if (request.state === 'APPROVED') {
        await watcherService.notifyWatchers(request.request_id, 'WATCHED_REQUEST_APPROVED', transaction);
      }
    } else {
      // BR-25: HR rejection after Manager approval is outright — no return-for-rework.
      const isAdvance = request.is_advance_leave;
      request.state = isAdvance ? 'REJECTED_PENDING_WITHDRAWAL' : 'REJECTED';
      if (isAdvance) {
        const windowDays = await configService.get('advance_leave.withdrawal_window_days');
        const end = new Date();
        end.setDate(end.getDate() + windowDays);
        request.withdrawal_window_end = end;
      }
      request.current_approver_id = null;
      await request.save({ transaction });

      const { LeaveRequestApproval } = require('../models');
      await LeaveRequestApproval.create({
        request_id: request.request_id, stage, actor_id: actorId, decision: 'REJECT', reason, decision_timestamp: new Date(),
      }, { transaction });
      await watcherService.notifyWatchers(request.request_id, 'WATCHED_REQUEST_REJECTED', transaction);
    }

    await auditService.record({
      actorId, action: `LEAVE_REQUEST_${decision}`, entityType: 'leave_requests',
      entityId: request.request_id, newValue: { state: request.state }, transaction,
    });

    await notificationService.notify({
      recipientId: request.employee_id,
      templateKey: decision === 'APPROVE' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      tokens: { reason: reason || '' },
      relatedRequestId: request.request_id,
      transaction,
    });

    return request;
  });
}

/** LMS-051/BR-32: withdraw a Pending request. No approval needed, no ledger entry to reverse. */
async function withdraw({ requestId, employeeId }) {
  return sequelize.transaction(async (transaction) => {
    const request = await LeaveRequest.findByPk(requestId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!request || String(request.employee_id) !== String(employeeId)) {
      throw new LeaveRequestError('NOT_FOUND', 'Request not found', 404);
    }
    if (!['PENDING_MANAGER', 'PENDING_HR', 'REJECTED_PENDING_WITHDRAWAL'].includes(request.state)) {
      throw new LeaveRequestError('INVALID_STATE', 'Only a pending or advance-rejected request can be withdrawn.');
    }
    request.state = 'WITHDRAWN';
    await request.save({ transaction });
    await auditService.record({ actorId: employeeId, action: 'LEAVE_REQUEST_WITHDRAWN', entityType: 'leave_requests', entityId: requestId, transaction });
    return request;
  });
}

/** LMS-052/BR-30: request cancellation of an Approved leave. */
async function requestCancellation({ requestId, employeeId }) {
  return sequelize.transaction(async (transaction) => {
    const request = await LeaveRequest.findByPk(requestId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!request || String(request.employee_id) !== String(employeeId)) {
      throw new LeaveRequestError('NOT_FOUND', 'Request not found', 404);
    }
    if (request.state !== 'APPROVED') {
      throw new LeaveRequestError('INVALID_STATE', 'Only an Approved request can have cancellation requested.');
    }
    request.state = 'CANCELLATION_REQUESTED';
    await request.save({ transaction });

    const employee = await Employee.findByPk(employeeId, { transaction });
    const firstStage = await approvalRouting.getFirstStageApprover(employee);
    if (firstStage) {
      await notificationService.notify({
        recipientId: firstStage.approverId, templateKey: 'CANCELLATION_REQUEST_AWAITING_DECISION',
        tokens: { employeeName: employee.full_name }, relatedRequestId: requestId, transaction,
      });
    }
    return request;
  });
}

/** LMS-053/BR-31: Manager decides on a cancellation request. */
async function decideCancellation({ requestId, actorId, decision, unelapsedDays }) {
  return sequelize.transaction(async (transaction) => {
    const request = await LeaveRequest.findByPk(requestId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!request) throw new LeaveRequestError('NOT_FOUND', 'Request not found', 404);
    approvalRouting.assertNotSelfApproval(actorId, request.employee_id);
    if (request.state !== 'CANCELLATION_REQUESTED') {
      throw new LeaveRequestError('INVALID_STATE', 'Request is not awaiting cancellation decision.');
    }

    if (decision === 'APPROVE') {
      request.state = 'CANCELLED';
      await request.save({ transaction });
      await balanceService.writeRestorationEntry({ request, unelapsedDays, actorId, transaction }); // BR-31
      await watcherService.notifyWatchers(request.request_id, 'WATCHED_REQUEST_CANCELLED', transaction);
    } else {
      request.state = 'APPROVED'; // BR: rejection returns to Approved
      await request.save({ transaction });
    }

    const { LeaveRequestApproval } = require('../models');
    await LeaveRequestApproval.create({
      request_id: requestId, stage: 'CANCELLATION', actor_id: actorId, decision, decision_timestamp: new Date(),
    }, { transaction });

    await notificationService.notify({
      recipientId: request.employee_id,
      templateKey: decision === 'APPROVE' ? 'CANCELLATION_APPROVED' : 'CANCELLATION_REJECTED',
      relatedRequestId: requestId, transaction,
    });

    return request;
  });
}

/** LMS-040: save as draft — no effect on balance, effective balance, or overlap checks. */
async function saveDraft({ employeeId, leaveTypeId, startDate, endDate, isHalfDay, halfDayPortion, reason }) {
  const leaveYear = await LeaveYear.findOne({ where: { is_current: true } });
  const request = await LeaveRequest.create({
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    leave_year_id: leaveYear.leave_year_id,
    start_date: startDate,
    end_date: endDate,
    is_half_day: !!isHalfDay,
    half_day_portion: halfDayPortion || null,
    reason: reason || '',
    state: 'DRAFT',
  });
  await auditService.record({ actorId: employeeId, action: 'DRAFT_SAVED', entityType: 'leave_requests', entityId: request.request_id });
  return request;
}

/** A draft may be edited freely — it has no downstream effects until submitted. */
async function updateDraft({ requestId, employeeId, leaveTypeId, startDate, endDate, isHalfDay, halfDayPortion, reason }) {
  const request = await LeaveRequest.findByPk(requestId);
  if (!request || String(request.employee_id) !== String(employeeId)) {
    throw new LeaveRequestError('NOT_FOUND', 'Draft not found', 404);
  }
  if (request.state !== 'DRAFT') {
    throw new LeaveRequestError('INVALID_STATE', 'Only a draft can be edited this way.');
  }
  if (leaveTypeId !== undefined) request.leave_type_id = leaveTypeId;
  if (startDate !== undefined) request.start_date = startDate;
  if (endDate !== undefined) request.end_date = endDate;
  if (isHalfDay !== undefined) request.is_half_day = isHalfDay;
  if (halfDayPortion !== undefined) request.half_day_portion = halfDayPortion;
  if (reason !== undefined) request.reason = reason;
  await request.save();
  return request;
}

async function discardDraft({ requestId, employeeId }) {
  const request = await LeaveRequest.findByPk(requestId);
  if (!request || String(request.employee_id) !== String(employeeId)) {
    throw new LeaveRequestError('NOT_FOUND', 'Draft not found', 404);
  }
  if (request.state !== 'DRAFT') {
    throw new LeaveRequestError('INVALID_STATE', 'Only a draft can be discarded this way.');
  }
  await request.destroy();
  return { discarded: true };
}

/**
 * Promotes an existing DRAFT to PENDING_MANAGER (or straight to APPROVED under
 * the self-approval addendum), running exactly the same validation and routing
 * gates as a fresh submission (LMS-037 to LMS-039) — a draft skips those checks
 * only until this point, never after.
 */
async function submitDraft({ requestId, employeeId }) {
  const draft = await LeaveRequest.findByPk(requestId);
  if (!draft || String(draft.employee_id) !== String(employeeId)) {
    throw new LeaveRequestError('NOT_FOUND', 'Draft not found', 404);
  }
  if (draft.state !== 'DRAFT') {
    throw new LeaveRequestError('INVALID_STATE', 'This request is not a draft.');
  }

  return sequelize.transaction(async (transaction) => {
    const employee = await Employee.findByPk(employeeId, { transaction });
    const leaveType = await LeaveType.findByPk(draft.leave_type_id, { transaction });
    const leaveYear = await LeaveYear.findOne({ where: { is_current: true }, transaction });

    await assertWithinBackdatingWindow(draft.start_date, leaveYear);
    await assertNoOverlap(employeeId, draft.start_date, draft.end_date, draft.request_id);
    await blackoutPeriodService.assertNoBlackoutConflict({ leaveTypeId: draft.leave_type_id, startDate: draft.start_date, endDate: draft.end_date });
    await teamCapacityService.assertWithinCapacity({ employeeId, startDate: draft.start_date, endDate: draft.end_date });

    const breakdown = await businessDayService.computeDeductionBreakdown({
      startDate: draft.start_date, endDate: draft.end_date, isHalfDay: draft.is_half_day,
      leaveYearId: leaveYear.leave_year_id, employeeId,
    });
    const balance = await balanceService.getEffectiveBalance(employeeId, draft.leave_type_id, leaveYear.leave_year_id);
    const isAdvanceLeave = breakdown.deductedWorkingDays > balance.effectiveBalance;
    const aggregateDays = await approvalRouting.getContiguousAggregateDays(employeeId, draft.leave_type_id, draft.start_date, draft.end_date);
    const isLongLeave = await approvalRouting.requiresLongLeaveSecondStage(breakdown.deductedWorkingDays, aggregateDays);

    draft.state = 'PENDING_MANAGER';
    draft.deducted_days = breakdown.deductedWorkingDays;
    draft.is_advance_leave = isAdvanceLeave;
    draft.is_long_leave = isLongLeave;
    draft.application_timestamp = new Date();
    await draft.save({ transaction });

    const selfEligible = await approvalRouting.isEligibleForSelfApproval(employee);
    if (selfEligible) {
      await approveStageInternal({ request: draft, stage: 'SELF', actorId: employeeId, onBehalfOfId: null, transaction });
    } else {
      const firstStage = await approvalRouting.getFirstStageApprover(employee);
      if (!firstStage) throw new LeaveRequestError('NO_APPROVER', 'No reporting manager on record and no self-approval grant exists.');
      draft.current_approver_id = firstStage.approverId;
      draft.sla_started_at = new Date();
      await draft.save({ transaction });
      await notificationService.notify({
        recipientId: firstStage.approverId, templateKey: 'REQUEST_AWAITING_DECISION',
        tokens: { employeeName: employee.full_name, startDate: draft.start_date, endDate: draft.end_date, days: breakdown.deductedWorkingDays },
        relatedRequestId: draft.request_id, transaction,
      });
    }

    await watcherService.applyStandingWatchers(draft, transaction);
    await watcherService.notifyWatchers(draft.request_id, 'WATCHED_REQUEST_SUBMITTED', transaction);

    await auditService.record({
      actorId: employeeId, action: 'DRAFT_SUBMITTED', entityType: 'leave_requests',
      entityId: draft.request_id, newValue: { state: draft.state }, transaction,
    });
    await notificationService.notify({
      recipientId: employeeId, templateKey: 'REQUEST_SUBMITTED_CONFIRMATION',
      tokens: { days: breakdown.deductedWorkingDays, startDate: draft.start_date, endDate: draft.end_date },
      relatedRequestId: draft.request_id, transaction,
    });

    return draft;
  });
}

module.exports = {
  LeaveRequestError,
  previewApplication,
  submitRequest,
  decide,
  withdraw,
  requestCancellation,
  decideCancellation,
  assertNoOverlap,
  saveDraft,
  updateDraft,
  discardDraft,
  submitDraft,
};
