const { Op } = require('sequelize');
const { Employee, LeaveType, LeaveYear, LeaveRequest } = require('../models');
const balanceService = require('./balance.service');
const approvalRouting = require('./approvalRouting.service');
const auditService = require('./audit.service');

/** LMS-036/dashboard: balance card per leave type — available, committed, effective, projected. */
async function getDashboard(employeeId) {
  const leaveYear = await LeaveYear.findOne({ where: { is_current: true } });
  const leaveTypes = await LeaveType.findAll({ where: { is_selectable_by_employee: true } });

  const balances = await Promise.all(leaveTypes.map(async (lt) => {
    const b = await balanceService.getEffectiveBalance(employeeId, lt.leave_type_id, leaveYear.leave_year_id);
    return { leaveType: lt, ...b };
  }));

  const pending = await LeaveRequest.findAll({
    where: { employee_id: employeeId, state: { [Op.in]: ['PENDING_MANAGER', 'PENDING_HR'] } },
  });
  const upcoming = await LeaveRequest.findAll({
    where: { employee_id: employeeId, state: 'APPROVED', start_date: { [Op.gte]: new Date() } },
    order: [['start_date', 'ASC']],
    limit: 5,
  });
  const withdrawalWindow = await LeaveRequest.findOne({
    where: { employee_id: employeeId, state: 'REJECTED_PENDING_WITHDRAWAL' },
  });

  return { balances, pending, upcoming, withdrawalWindow, leaveYear };
}

async function listEmployees({ search, departmentId, gradeId } = {}) {
  const where = {};
  if (search) where.full_name = { [Op.like]: `%${search}%` }; // MySQL's default collation is case-insensitive already
  if (departmentId) where.department_id = departmentId;
  if (gradeId) where.grade_id = gradeId;
  return Employee.findAll({ where, order: [['full_name', 'ASC']] });
}

/** LMS-010/012: create employee, then auto pro-rata entitlement is posted by a dedicated onboarding job. */
async function onboardEmployee(payload, createdBy) {
  if (payload.reportingManagerId) {
    const circular = await approvalRouting.wouldCreateCircularHierarchy(null, payload.reportingManagerId);
    if (circular) throw Object.assign(new Error('This reporting relationship would be circular.'), { status: 400, code: 'CIRCULAR_HIERARCHY' });
  }

  const employee = await Employee.create({
    entra_oid: payload.entraOid || null,
    work_email: payload.workEmail,
    employee_code: payload.employeeCode,
    full_name: payload.fullName,
    date_of_joining: payload.dateOfJoining,
    department_id: payload.departmentId,
    grade_id: payload.gradeId,
    management_level_id: payload.managementLevelId,
    designation: payload.designation,
    reporting_manager_id: payload.reportingManagerId || null,
  });

  await auditService.record({
    actorId: createdBy, action: 'EMPLOYEE_CREATED', entityType: 'employees', entityId: employee.employee_id, newValue: payload,
  });

  // Pro-rata opening entitlement posting (BR-13 to BR-15) is triggered here via the accrual job.
  const { postOpeningProRata } = require('../jobs/accrual.job');
  await postOpeningProRata(employee.employee_id);

  return employee;
}

/** LMS-011: refuse circular relationships at entry time (BR-37). */
async function setReportingManager(employeeId, managerId, actorId) {
  const circular = await approvalRouting.wouldCreateCircularHierarchy(employeeId, managerId);
  if (circular) {
    throw Object.assign(
      new Error(`Assigning this manager would create a circular reporting chain through employee #${managerId}.`),
      { status: 400, code: 'CIRCULAR_HIERARCHY' },
    );
  }
  const employee = await Employee.findByPk(employeeId);
  const prior = employee.reporting_manager_id;
  employee.reporting_manager_id = managerId;
  await employee.save();
  await auditService.record({
    actorId, action: 'MANAGER_REASSIGNED', entityType: 'employees', entityId: employeeId,
    priorValue: { reporting_manager_id: prior }, newValue: { reporting_manager_id: managerId },
  });
  return employee;
}

/** BR-39: Manager sees every employee beneath them at any depth. */
async function getTeamBalances(managerId) {
  const allReports = await getAllReportsRecursive(managerId);
  const leaveYear = await LeaveYear.findOne({ where: { is_current: true } });
  const leaveTypes = await LeaveType.findAll({ where: { is_selectable_by_employee: true } });

  return Promise.all(allReports.map(async (emp) => {
    const balances = await Promise.all(leaveTypes.map(async (lt) => ({
      leaveType: lt.type_name,
      ...(await balanceService.getEffectiveBalance(emp.employee_id, lt.leave_type_id, leaveYear.leave_year_id)),
    })));
    return { employee: emp, balances };
  }));
}

async function getAllReportsRecursive(managerId) {
  const direct = await Employee.findAll({ where: { reporting_manager_id: managerId } });
  let all = [...direct];
  for (const d of direct) {
    all = all.concat(await getAllReportsRecursive(d.employee_id));
  }
  return all;
}

/** LMS-061: is `employeeId` a direct or indirect report of `managerId`? */
async function isInManagerHierarchy(managerId, employeeId) {
  const reports = await getAllReportsRecursive(managerId);
  return reports.some((r) => String(r.employee_id) === String(employeeId));
}

/** BR-41: peer calendar shows name, dates, status only — never leave type. */
/**
 * §7.3.7: Team calendar (Manager/HR-Admin) — every employee beneath them at
 * any depth, WITH leave type shown. Distinct from the peer calendar below,
 * which is deliberately narrower and never sends type (BR-41/NFR-14).
 */
async function getTeamCalendar(managerId, { from, to } = {}) {
  const reports = await getAllReportsRecursive(managerId);
  const reportIds = reports.map((r) => r.employee_id);

  const where = { employee_id: { [Op.in]: reportIds }, state: { [Op.in]: ['APPROVED', 'PENDING_MANAGER', 'PENDING_HR'] } };
  if (from) where.end_date = { [Op.gte]: from };
  if (to) where.start_date = { [Op.lte]: to };

  return LeaveRequest.findAll({
    where,
    include: [
      { model: Employee, as: 'employee', attributes: ['employee_id', 'full_name', 'designation', 'employee_code'] },
      { model: LeaveType, attributes: ['type_name', 'type_code'] },
    ],
    attributes: ['request_id', 'employee_id', 'start_date', 'end_date', 'deducted_days', 'reason', 'is_half_day', 'half_day_portion', 'state', 'leave_type_id'],
  });
}

/**
 * BR-41 (as refined by Workflows §10.3): peers share the same reporting Manager
 * AND the same management level — a Manager's own peer calendar must not
 * include their direct reports just because those reports also happen to
 * report to the same person during a reorg edge case, and vice versa.
 */
async function getPeerCalendar(employeeId, { from, to } = {}) {
  const self = await Employee.findByPk(employeeId);
  const peers = await Employee.findAll({
    where: { reporting_manager_id: self.reporting_manager_id, management_level_id: self.management_level_id },
  });
  const peerIds = peers.map((p) => p.employee_id);

  const where = { employee_id: { [Op.in]: peerIds }, state: { [Op.in]: ['APPROVED', 'PENDING_MANAGER', 'PENDING_HR'] } };
  if (from) where.end_date = { [Op.gte]: from };
  if (to) where.start_date = { [Op.lte]: to };

  const requests = await LeaveRequest.findAll({
    where,
    include: [{ model: Employee, as: 'employee', attributes: ['employee_id', 'full_name', 'designation', 'employee_code'] }],
    attributes: ['request_id', 'employee_id', 'start_date', 'end_date', 'deducted_days', 'reason', 'is_half_day', 'half_day_portion', 'state'], // leave_type_id excluded for peers (BR-41)
  });
  return requests;
}

/** LMS-060/063: candidates for the "add watcher" picker — must hold Manager or HR/Admin. */
async function listWatchableEmployees() {
  const { EmployeeRole, Role } = require('../models');
  const { Op } = require('sequelize');
  const rows = await EmployeeRole.findAll({
    include: [
      { model: Role, where: { role_code: { [Op.in]: ['MANAGER', 'HR_ADMIN'] } }, attributes: [] },
      { model: Employee, attributes: ['employee_id', 'full_name', 'employee_code'] },
    ],
  });
  const seen = new Map();
  for (const row of rows) seen.set(row.Employee.employee_id, row.Employee);
  return [...seen.values()];
}

module.exports = { getDashboard, listEmployees, onboardEmployee, setReportingManager, getTeamBalances, getTeamCalendar, getPeerCalendar, listWatchableEmployees, isInManagerHierarchy };
