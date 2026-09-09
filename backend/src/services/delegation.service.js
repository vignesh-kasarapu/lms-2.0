const { Op } = require('sequelize');
const { Employee, Delegation, EmployeeRole, Role } = require('../models');
const approvalRouting = require('./approvalRouting.service');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');

/**
 * LMS-041: eligible delegates are peer Managers — same management_level_id,
 * reporting to the same supervisor as the nominating Manager. Where no such
 * peer exists, falls back to the nominating Manager's own supervisor.
 * The system computes and returns only valid choices — never a free search.
 */
async function getEligibleDelegates(nominatorId) {
  const nominator = await Employee.findByPk(nominatorId);
  if (!nominator) throw Object.assign(new Error('Employee not found'), { status: 404 });

  const peers = await Employee.findAll({
    where: {
      reporting_manager_id: nominator.reporting_manager_id,
      management_level_id: nominator.management_level_id,
      employee_id: { [Op.ne]: nominatorId },
    },
  });

  const peerManagers = [];
  for (const peer of peers) {
    if (await approvalRouting.hasRole(peer.employee_id, 'MANAGER')) peerManagers.push(peer);
  }

  if (peerManagers.length > 0) return { candidates: peerManagers, fallbackUsed: false };

  // No peer exists — fall back to the nominating Manager's own supervisor.
  if (nominator.reporting_manager_id) {
    const supervisor = await Employee.findByPk(nominator.reporting_manager_id);
    return { candidates: supervisor ? [supervisor] : [], fallbackUsed: true };
  }
  return { candidates: [], fallbackUsed: true };
}

/** LMS-041: a Manager nominates a Delegate for a defined date range, from the eligible list only. */
async function nominate({ nominatorId, delegateId, fromDate, toDate, setById }) {
  const { candidates } = await getEligibleDelegates(nominatorId);
  const isEligible = candidates.some((c) => String(c.employee_id) === String(delegateId));
  if (!isEligible) {
    throw Object.assign(
      new Error('This employee is not an eligible delegate (must be a peer manager under the same supervisor, or the supervisor where no peer exists).'),
      { status: 400, code: 'INELIGIBLE_DELEGATE' },
    );
  }

  const delegation = await Delegation.create({
    nominator_id: nominatorId, delegate_id: delegateId, set_by_id: setById, from_date: fromDate, to_date: toDate,
  });

  await auditService.record({ actorId: setById, action: 'DELEGATION_CREATED', entityType: 'delegations', entityId: delegation.delegation_id, newValue: { nominatorId, delegateId, fromDate, toDate } });
  // LMS-041/042: both the Manager and the Delegate are notified.
  await notificationService.notify({ recipientId: nominatorId, templateKey: 'DELEGATE_ASSIGNED_TO_YOU', tokens: { nominatorId, delegateId } });
  await notificationService.notify({ recipientId: delegateId, templateKey: 'DELEGATE_ASSIGNED_TO_YOU', tokens: { nominatorId, delegateId } });

  return delegation;
}

/** LMS-042: a Manager's own supervisor may set a delegate on that Manager's behalf, for emergency cover. */
async function nominateOnBehalf({ supervisorId, nominatorId, delegateId, fromDate, toDate }) {
  const nominator = await Employee.findByPk(nominatorId);
  if (String(nominator.reporting_manager_id) !== String(supervisorId)) {
    throw Object.assign(new Error('You may only set a delegation for your own direct reports.'), { status: 403, code: 'NOT_SUPERVISOR' });
  }
  return nominate({ nominatorId, delegateId, fromDate, toDate, setById: supervisorId });
}

async function revoke(delegationId, actorId) {
  const delegation = await Delegation.findByPk(delegationId);
  if (!delegation) throw Object.assign(new Error('Delegation not found'), { status: 404 });
  delegation.revoked_at = new Date();
  await delegation.save();
  await auditService.record({ actorId, action: 'DELEGATION_REVOKED', entityType: 'delegations', entityId: delegationId });
  return delegation;
}

async function listMine(employeeId) {
  return Delegation.findAll({
    where: { [Op.or]: [{ nominator_id: employeeId }, { delegate_id: employeeId }] },
    include: [{ model: Employee, as: 'nominator', attributes: ['full_name'] }, { model: Employee, as: 'delegate', attributes: ['full_name'] }],
    order: [['from_date', 'DESC']],
  });
}

/** Roles doc §2.6: "HR/Admin: R Org (optional visibility)" — every delegation, not just the caller's own. */
async function listAll() {
  return Delegation.findAll({
    include: [{ model: Employee, as: 'nominator', attributes: ['full_name'] }, { model: Employee, as: 'delegate', attributes: ['full_name'] }],
    order: [['from_date', 'DESC']],
  });
}

module.exports = { getEligibleDelegates, nominate, nominateOnBehalf, revoke, listMine, listAll };
