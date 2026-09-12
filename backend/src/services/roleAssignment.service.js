const { EmployeeRole, Role, Employee } = require('../models');
const auditService = require('./audit.service');

/** HR/Admin grants an explicit role (EMPLOYEE, MANAGER, or HR_ADMIN) to an employee. Idempotent. */
async function assignRole(employeeId, roleCode, actorId) {
  const role = await Role.findOne({ where: { role_code: roleCode } });
  if (!role) throw Object.assign(new Error(`Unknown role code: ${roleCode}`), { status: 400, code: 'UNKNOWN_ROLE' });

  const employee = await Employee.findByPk(employeeId);
  if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404, code: 'NOT_FOUND' });

  const existing = await EmployeeRole.findOne({ where: { employee_id: employeeId, role_id: role.role_id } });
  if (existing) return existing; // idempotent — already holds the role

  const grant = await EmployeeRole.create({ employee_id: employeeId, role_id: role.role_id, assigned_by: actorId });

  // LMS-009: an audit entry is written for every role change.
  await auditService.record({
    actorId, action: 'ROLE_ASSIGNED', entityType: 'employee_roles', entityId: grant.employee_role_id,
    newValue: { employeeId, roleCode },
  });
  return grant;
}

/**
 * Revokes a role. Role assignment rule: "At least one HR/Admin must exist at
 * all times; the system must prevent removal of the last one." Enforced here,
 * not left to the caller.
 */
async function revokeRole(employeeId, roleCode, actorId) {
  const role = await Role.findOne({ where: { role_code: roleCode } });
  if (!role) throw Object.assign(new Error(`Unknown role code: ${roleCode}`), { status: 400, code: 'UNKNOWN_ROLE' });

  if (roleCode === 'HR_ADMIN') {
    const hrAdminCount = await EmployeeRole.count({ where: { role_id: role.role_id } });
    if (hrAdminCount <= 1) {
      throw Object.assign(
        new Error('At least one HR/Admin must exist at all times. This is the last one and cannot be removed.'),
        { status: 400, code: 'LAST_HR_ADMIN' },
      );
    }
  }

  const existing = await EmployeeRole.findOne({ where: { employee_id: employeeId, role_id: role.role_id } });
  if (!existing) return { removed: false };

  await auditService.record({
    actorId, action: 'ROLE_REVOKED', entityType: 'employee_roles', entityId: existing.employee_role_id,
    priorValue: { employeeId, roleCode },
  });
  await existing.destroy();
  return { removed: true };
}

async function listRolesForEmployee(employeeId) {
  const rows = await EmployeeRole.findAll({
    where: { employee_id: employeeId },
    include: [{ model: Role, attributes: ['role_code', 'role_name'] }],
  });
  return rows.map((r) => r.Role.role_code);
}

module.exports = { assignRole, revokeRole, listRolesForEmployee };
