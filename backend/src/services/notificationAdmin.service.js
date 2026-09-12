const { NotificationTemplate, NotificationDigestPreference } = require('../models');
const auditService = require('./audit.service');

/** LMS-071: HR/Admin edits notification templates through the administration interface. */
async function listTemplates() { return NotificationTemplate.findAll({ order: [['template_key', 'ASC']] }); }

async function createTemplate({ templateKey, subjectTemplate, bodyTemplate }, actorId) {
  const existing = await NotificationTemplate.findByPk(templateKey);
  if (existing) throw Object.assign(new Error(`A template with key "${templateKey}" already exists.`), { status: 400, code: 'DUPLICATE_TEMPLATE_KEY' });

  const template = await NotificationTemplate.create({
    template_key: templateKey, subject_template: subjectTemplate, body_template: bodyTemplate, updated_by: actorId,
  });
  await auditService.record({ actorId, action: 'NOTIFICATION_TEMPLATE_CREATED', entityType: 'notification_templates', entityId: templateKey, newValue: { subjectTemplate, bodyTemplate } });
  return template;
}

async function setTemplateActive(templateKey, isActive, actorId) {
  const template = await NotificationTemplate.findByPk(templateKey);
  if (!template) throw Object.assign(new Error('Template not found'), { status: 404 });
  template.is_active = isActive;
  await template.save();
  await auditService.record({ actorId, action: isActive ? 'NOTIFICATION_TEMPLATE_ENABLED' : 'NOTIFICATION_TEMPLATE_DISABLED', entityType: 'notification_templates', entityId: templateKey });
  return template;
}

async function deleteTemplate(templateKey, actorId) {
  const template = await NotificationTemplate.findByPk(templateKey);
  if (!template) throw Object.assign(new Error('Template not found'), { status: 404 });
  await template.destroy();
  await auditService.record({ actorId, action: 'NOTIFICATION_TEMPLATE_DELETED', entityType: 'notification_templates', entityId: templateKey, priorValue: { subject_template: template.subject_template } });
  return { deleted: true };
}

async function updateTemplate(templateKey, { subjectTemplate, bodyTemplate }, actorId) {
  const template = await NotificationTemplate.findByPk(templateKey);
  if (!template) throw Object.assign(new Error('Template not found'), { status: 404 });

  const prior = { subject_template: template.subject_template, body_template: template.body_template };
  template.subject_template = subjectTemplate;
  template.body_template = bodyTemplate;
  template.updated_by = actorId;
  await template.save();

  await auditService.record({
    actorId, action: 'NOTIFICATION_TEMPLATE_UPDATED', entityType: 'notification_templates', entityId: templateKey,
    priorValue: prior, newValue: { subjectTemplate, bodyTemplate },
  });
  return template;
}

/** LMS-072: a Manager may opt into a daily digest in place of individual per-request notifications. */
async function setDigestPreference(employeeId, digestEnabled) {
  const [pref] = await NotificationDigestPreference.findOrCreate({
    where: { employee_id: employeeId },
    defaults: { digest_enabled: digestEnabled },
  });
  pref.digest_enabled = digestEnabled;
  await pref.save();
  return pref;
}

async function getDigestPreference(employeeId) {
  const pref = await NotificationDigestPreference.findOne({ where: { employee_id: employeeId } });
  return pref ? pref.digest_enabled : false;
}

module.exports = {
  listTemplates, createTemplate, updateTemplate, setTemplateActive, deleteTemplate,
  setDigestPreference, getDigestPreference,
};
