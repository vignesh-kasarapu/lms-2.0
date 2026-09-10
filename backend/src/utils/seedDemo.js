/**
 * Demo data seed — run AFTER `npm run seed` (which only creates reference
 * data: roles, leave types, management levels, org config, templates).
 *
 * This script creates a small realistic org so you can log in as each role
 * and click through the actual workflows instead of staring at empty
 * screens:
 *
 *   EMP001  Asha Rao       HR_ADMIN   — no manager, sees everything
 *   EMP002  Vikram Shah    MANAGER    — reports to Asha, manages Priya + Rohan
 *   EMP003  Priya Nair     EMPLOYEE   — reports to Vikram
 *   EMP004  Rohan Mehta    EMPLOYEE   — reports to Vikram
 *
 * It also submits a couple of real leave requests through
 * `leaveRequest.service.js` (not hand-inserted rows) so the Manager/HR
 * approval queues and Employee "My Leaves" screens have live data:
 *
 *   - Priya:  ANNUAL, 2 days, still PENDING_MANAGER  → test Vikram's approval queue
 *   - Rohan:  CASUAL, 1 day, approved end-to-end      → test the approved state + ledger deduction
 *
 * Every employee's `entra_oid` is a placeholder value (dev-bypass/local use
 * only — a real Entra sign-in would need the real Object ID from Azure AD
 * written into that column instead; see setup notes for how to do that).
 *
 * Run with:  node src/utils/seedDemo.js
 * Prerequisite:  npm run seed   (reference data must exist first)
 */
require('dotenv').config();
const sequelize = require('../config/database');
const { Employee, Department, LeaveType } = require('../models');
const employeeService = require('../services/employee.service');
const roleAssignmentService = require('../services/roleAssignment.service');
const leaveRequestService = require('../services/leaveRequest.service');

const SYSTEM_ACTOR_ID = null; // seed script acts as "the system", same convention the accrual jobs use

async function ensureDepartment(code, name) {
  const [dept] = await Department.findOrCreate({
    where: { department_code: code },
    defaults: { department_name: name },
  });
  return dept;
}

async function ensureEmployee({ code, entraOid, email, fullName, designation, departmentId, managerId }) {
  const existing = await Employee.findOne({ where: { employee_code: code } });
  if (existing) return existing;

  return employeeService.onboardEmployee(
    {
      entraOid,
      workEmail: email,
      employeeCode: code,
      fullName,
      dateOfJoining: '2024-01-15',
      departmentId,
      gradeId: null,
      managementLevelId: null,
      designation,
      reportingManagerId: managerId || null,
    },
    SYSTEM_ACTOR_ID,
  );
}

async function ensureRole(employeeId, roleCode) {
  await roleAssignmentService.assignRole(employeeId, roleCode, SYSTEM_ACTOR_ID);
}

async function seedDemo() {
  await sequelize.authenticate();

  const engineering = await ensureDepartment('ENG', 'Engineering');

  const hrAdmin = await ensureEmployee({
    code: 'EMP001',
    entraOid: 'DEV-SEED-EMP001',
    email: 'asha.rao@example.com',
    fullName: 'Asha Rao',
    designation: 'HR Business Partner',
    departmentId: engineering.department_id,
    managerId: null,
  });
  await ensureRole(hrAdmin.employee_id, 'HR_ADMIN');

  const manager = await ensureEmployee({
    code: 'EMP002',
    entraOid: 'DEV-SEED-EMP002',
    email: 'vikram.shah@example.com',
    fullName: 'Vikram Shah',
    designation: 'Engineering Manager',
    departmentId: engineering.department_id,
    managerId: hrAdmin.employee_id,
  });
  await ensureRole(manager.employee_id, 'MANAGER');

  const priya = await ensureEmployee({
    code: 'EMP003',
    entraOid: 'DEV-SEED-EMP003',
    email: 'priya.nair@example.com',
    fullName: 'Priya Nair',
    designation: 'Software Engineer',
    departmentId: engineering.department_id,
    managerId: manager.employee_id,
  });
  await ensureRole(priya.employee_id, 'EMPLOYEE');

  const rohan = await ensureEmployee({
    code: 'EMP004',
    entraOid: 'DEV-SEED-EMP004',
    email: 'rohan.mehta@example.com',
    fullName: 'Rohan Mehta',
    designation: 'Software Engineer',
    departmentId: engineering.department_id,
    managerId: manager.employee_id,
  });
  await ensureRole(rohan.employee_id, 'EMPLOYEE');

  // --- Sample leave requests, submitted through the real service so accrual,
  //     balance, and approval-routing logic all actually run. -------------
  const annual = await LeaveType.findOne({ where: { type_code: 'ANNUAL' } });
  const casual = await LeaveType.findOne({ where: { type_code: 'CASUAL' } });

  const today = new Date();
  const in10Days = new Date(today);
  in10Days.setDate(in10Days.getDate() + 10);
  const in11Days = new Date(today);
  in11Days.setDate(in11Days.getDate() + 11);
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);

  const fmt = (d) => d.toISOString().slice(0, 10);

  // Priya applies for 2 days of Annual Leave — left pending so you can log
  // in as Vikram (EMP002) and see it sitting in the Manager approval queue.
  const existingPending = await require('../models').LeaveRequest.findOne({
    where: { employee_id: priya.employee_id, state: 'PENDING_MANAGER' },
  });
  if (!existingPending) {
    await leaveRequestService.submitRequest({
      employeeId: priya.employee_id,
      leaveTypeId: annual.leave_type_id,
      startDate: fmt(in10Days),
      endDate: fmt(in11Days),
      isHalfDay: false,
      reason: 'Family function',
    });
  }

  // Rohan applies for 1 day of Casual Leave and Vikram approves it — so you
  // can log in as Rohan (EMP004) and see an already-approved request with a
  // real ledger deduction behind it.
  const existingApproved = await require('../models').LeaveRequest.findOne({
    where: { employee_id: rohan.employee_id, state: 'APPROVED' },
  });
  if (!existingApproved) {
    const request = await leaveRequestService.submitRequest({
      employeeId: rohan.employee_id,
      leaveTypeId: casual.leave_type_id,
      startDate: fmt(in3Days),
      endDate: fmt(in3Days),
      isHalfDay: false,
      reason: 'Personal errand',
    });
    await leaveRequestService.decide({
      requestId: request.request_id,
      actorId: manager.employee_id,
      decision: 'APPROVE',
      reason: '',
    });
  }

  console.log('\nDemo data ready. Sign-in codes for DEV_AUTH_BYPASS_EMPLOYEE_CODE:\n');
  console.log('  EMP001  Asha Rao     HR_ADMIN  — org-wide admin views, configuration, reports');
  console.log('  EMP002  Vikram Shah  MANAGER   — has one pending request from Priya to approve/reject');
  console.log('  EMP003  Priya Nair   EMPLOYEE  — has one PENDING_MANAGER request');
  console.log('  EMP004  Rohan Mehta  EMPLOYEE  — has one APPROVED request already on the ledger\n');
  console.log('Set DEV_AUTH_BYPASS_EMPLOYEE_CODE to any of the codes above in backend/.env,');
  console.log('restart the backend, and reload the frontend to sign in as that person.\n');
}

seedDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Demo seed failed:', err);
    process.exit(1);
  });
