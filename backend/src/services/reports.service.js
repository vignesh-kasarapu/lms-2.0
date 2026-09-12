const { Op } = require('sequelize');
const {
  LeaveRequest, Employee, LeaveType, LopRecord, LeaveLedger,
} = require('../models');
const employeeService = require('./employee.service');

/** LMS-074/075: filterable by date range, leave type, status (+ department/grade for HR). */
async function leaveTakenReport({ from, to, leaveTypeId, status, departmentId, gradeId, scope, viewerId }) {
  const where = {};
  if (from) where.end_date = { [Op.gte]: from };
  if (to) where.start_date = { [Op.lte]: to };
  if (leaveTypeId) where.leave_type_id = leaveTypeId;
  if (status) where.state = status;

  let employeeWhere = {};
  if (departmentId) employeeWhere.department_id = departmentId;
  if (gradeId) employeeWhere.grade_id = gradeId;

  // Scope: Manager sees their hierarchy only (BR-39); HR/Admin sees everyone (BR-40).
  if (scope === 'MANAGER') {
    const reports = await employeeService.getTeamBalances(viewerId); // reuses recursive hierarchy walk
    where.employee_id = { [Op.in]: reports.map((r) => r.employee.employee_id) };
  }

  return LeaveRequest.findAll({
    where,
    include: [
      { model: LeaveType, attributes: ['type_name'] },
      { model: Employee, as: 'employee', where: employeeWhere, attributes: ['full_name', 'first_name', 'last_name', 'employee_code', 'department_id', 'grade_id'] },
    ],
    order: [['start_date', 'DESC']],
  });
}

/** LMS-078: LOP report for downstream payroll consumption — no salary calculation performed here. */
async function lopReport({ from, to }) {
  const where = {};
  if (from) where.start_date = { [Op.gte]: from };
  if (to) where.end_date = { [Op.lte]: to };

  return LopRecord.findAll({
    where,
    include: [{ model: Employee, attributes: ['full_name', 'first_name', 'last_name', 'employee_code'] }],
    order: [['converted_at', 'DESC']],
  });
}

async function balancesReport({ leaveYearId }) {
  if (!leaveYearId) {
    throw Object.assign(new Error('leaveYearId is required'), { status: 400, code: 'MISSING_LEAVE_YEAR_ID' });
  }
  return LeaveLedger.findAll({
    where: { leave_year_id: leaveYearId },
    include: [
      { model: Employee, attributes: ['full_name', 'first_name', 'last_name', 'employee_code'] },
      { model: LeaveType, attributes: ['type_name'] },
    ],
    order: [['employee_id', 'ASC'], ['created_at', 'ASC']],
  });
}

module.exports = { leaveTakenReport, lopReport, balancesReport };
