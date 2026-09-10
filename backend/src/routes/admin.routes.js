const express = require('express');
const controller = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth, requireRole('HR_ADMIN')); // every admin route is HR/Admin-only

router.get('/departments', controller.departments.list);
router.post('/departments', controller.departments.create);
router.get('/management-levels', controller.managementLevels.list);

router.get('/grades', controller.grades.list);
router.post('/grades', controller.grades.create);

router.get('/projects', controller.projects.list);
router.post('/projects', controller.projects.create);
router.post('/project-assignments', controller.projects.assign);

router.get('/leave-types', controller.leaveTypes.list);
router.post('/leave-types', controller.leaveTypes.create);
router.patch('/leave-types/:leaveTypeId/policy', controller.leaveTypes.updatePolicy);

router.get('/holidays', controller.holidays.list);
router.post('/holidays', controller.holidays.create);
router.delete('/holidays/:holidayId', controller.holidays.remove);

router.get('/self-approval-permissions', controller.selfApproval.list);
router.post('/self-approval-permissions', controller.selfApproval.grant);
router.post('/self-approval-permissions/:grantId/revoke', controller.selfApproval.revoke);

router.get('/working-patterns', controller.workingPatterns.list);
router.post('/working-patterns', controller.workingPatterns.create);
router.post('/working-pattern-assignments', controller.workingPatterns.assign);

router.post('/carry-forward/trigger', controller.carryForward.trigger);

const notificationAdminController = require('../controllers/notificationAdmin.controller');
router.get('/notification-templates', notificationAdminController.listTemplates);
router.patch('/notification-templates/:templateKey', notificationAdminController.updateTemplate);

module.exports = router;
