const notificationAdminService = require('../services/notificationAdmin.service');
const { ok } = require('../utils/apiResponse');

async function listTemplates(req, res) {
  return ok(res, await notificationAdminService.listTemplates());
}

async function updateTemplate(req, res) {
  const { subjectTemplate, bodyTemplate } = req.body;
  const template = await notificationAdminService.updateTemplate(req.params.templateKey, { subjectTemplate, bodyTemplate }, req.currentUser.employeeId);
  return ok(res, template);
}

async function getMyDigestPreference(req, res) {
  const enabled = await notificationAdminService.getDigestPreference(req.currentUser.employeeId);
  return ok(res, { digestEnabled: enabled });
}

async function setMyDigestPreference(req, res) {
  const pref = await notificationAdminService.setDigestPreference(req.currentUser.employeeId, !!req.body.digestEnabled);
  return ok(res, pref);
}

module.exports = { listTemplates, updateTemplate, getMyDigestPreference, setMyDigestPreference };
