const adminService = require('../services/admin.service');
const { ok, created } = require('../utils/apiResponse');

const departments = {
  list: async (req, res) => ok(res, await adminService.listDepartments()),
  create: async (req, res) => created(res, await adminService.createDepartment(req.body, req.currentUser.employeeId)),
};

const grades = {
  list: async (req, res) => ok(res, await adminService.listGrades()),
  create: async (req, res) => created(res, await adminService.createGrade(req.body, req.currentUser.employeeId)),
};

const projects = {
  list: async (req, res) => ok(res, await adminService.listProjects()),
  create: async (req, res) => created(res, await adminService.createProject(req.body, req.currentUser.employeeId)),
  assign: async (req, res) => created(res, await adminService.assignProject(req.body, req.currentUser.employeeId)),
};

const leaveTypes = {
  list: async (req, res) => ok(res, await adminService.listLeaveTypes()),
  create: async (req, res) => created(res, await adminService.createLeaveType(req.body, req.currentUser.employeeId)),
  updatePolicy: async (req, res) => ok(res, await adminService.updateLeaveTypePolicy(req.params.leaveTypeId, req.body, req.currentUser.employeeId)),
};

const holidays = {
  list: async (req, res) => ok(res, await adminService.listHolidays(req.query.leaveYearId)),
  create: async (req, res) => created(res, await adminService.addHoliday(req.body, req.currentUser.employeeId)),
  remove: async (req, res) => ok(res, await adminService.removeHoliday(req.params.holidayId, req.currentUser.employeeId)),
};

const selfApprovalService = require('../services/selfApproval.service');
const selfApproval = {
  list: async (req, res) => ok(res, await selfApprovalService.listAll()),
  grant: async (req, res) => created(res, await selfApprovalService.grant({ ...req.body, grantedBy: req.currentUser.employeeId })),
  revoke: async (req, res) => ok(res, await selfApprovalService.revoke(req.params.grantId, req.currentUser.employeeId)),
};

module.exports = { departments, grades, projects, leaveTypes, holidays, selfApproval };

const workingPatternService = require('../services/workingPattern.service');
const workingPatterns = {
  list: async (req, res) => ok(res, await workingPatternService.listPatterns()),
  create: async (req, res) => created(res, await workingPatternService.createPattern(req.body, req.currentUser.employeeId)),
  assign: async (req, res) => created(res, await workingPatternService.assignPattern({ ...req.body, assignedBy: req.currentUser.employeeId })),
};
module.exports.workingPatterns = workingPatterns;

const { runYearEndCarryForward } = require('../jobs/carryForward.job');
module.exports.carryForward = {
  trigger: async (req, res) => {
    await runYearEndCarryForward(req.body.leaveYearId);
    return ok(res, { triggered: true });
  },
};
