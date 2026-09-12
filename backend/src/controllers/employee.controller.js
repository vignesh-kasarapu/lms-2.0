const employeeService = require('../services/employee.service');
const { ok, created } = require('../utils/apiResponse');

async function me(req, res) {
  return ok(res, { employee: req.currentUser.employee, roles: req.currentUser.roles });
}

async function dashboard(req, res) {
  const data = await employeeService.getDashboard(req.currentUser.employeeId);
  return ok(res, data);
}

async function list(req, res) {
  const employees = await employeeService.listEmployees(req.query);
  return ok(res, employees);
}

async function createEmployee(req, res) {
  const employee = await employeeService.onboardEmployee(req.body, req.currentUser.employeeId);
  return created(res, employee);
}

async function updateManager(req, res) {
  const employee = await employeeService.setReportingManager(
    req.params.employeeId, req.body.managerId, req.currentUser.employeeId,
  );
  return ok(res, employee);
}

async function updateDetails(req, res) {
  const employee = await employeeService.updateEmployeeDetails(req.params.employeeId, req.body, req.currentUser.employeeId);
  return ok(res, employee);
}

async function myTeam(req, res) {
  const team = await employeeService.getTeamBalances(req.currentUser.employeeId);
  return ok(res, team);
}

async function peerCalendar(req, res) {
  const peers = await employeeService.getPeerCalendar(req.currentUser.employeeId, req.query);
  return ok(res, peers);
}

async function teamCalendar(req, res) {
  const entries = await employeeService.getTeamCalendar(req.currentUser.employeeId, req.query);
  return ok(res, entries);
}

async function watchableEmployees(req, res) {
  const employees = await employeeService.listWatchableEmployees();
  return ok(res, employees);
}

module.exports = { me, dashboard, list, createEmployee, updateManager, updateDetails, myTeam, peerCalendar, teamCalendar, watchableEmployees };
