const { sequelize, Employee } = require('../models');
const approvalRouting = require('./approvalRouting.service');
const auditService = require('./audit.service');

const REQUIRED_FIELDS = ['fullName', 'workEmail', 'employeeCode', 'dateOfJoining', 'designation'];

/**
 * LMS-019: validates every row first and produces a per-row error report.
 * The whole file is accepted or rejected as a unit — if any row fails
 * validation, nothing is committed, not even the rows that were fine.
 */
async function validateRows(rows) {
  const errors = [];
  const seenCodes = new Set();
  const seenEmails = new Set();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 2; // header is row 1
    const rowErrors = [];

    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || !String(row[field]).trim()) rowErrors.push(`Missing ${field}`);
    }

    if (row.employeeCode) {
      if (seenCodes.has(row.employeeCode)) rowErrors.push(`Duplicate employee code within file: ${row.employeeCode}`);
      seenCodes.add(row.employeeCode);
      const existing = await Employee.findOne({ where: { employee_code: row.employeeCode } });
      if (existing) rowErrors.push(`Employee code already exists: ${row.employeeCode}`);
    }
    if (row.workEmail) {
      if (seenEmails.has(row.workEmail)) rowErrors.push(`Duplicate work email within file: ${row.workEmail}`);
      seenEmails.add(row.workEmail);
      const existing = await Employee.findOne({ where: { work_email: row.workEmail } });
      if (existing) rowErrors.push(`Work email already exists: ${row.workEmail}`);
    }
    if (row.reportingManagerCode) {
      const manager = await Employee.findOne({ where: { employee_code: row.reportingManagerCode } });
      const managerInFile = rows.some((r) => r.employeeCode === row.reportingManagerCode);
      if (!manager && !managerInFile) rowErrors.push(`Reporting manager code not found: ${row.reportingManagerCode}`);
    }

    if (rowErrors.length) errors.push({ row: rowNumber, employeeCode: row.employeeCode || '(missing)', errors: rowErrors });
  }

  return errors;
}

async function importEmployees(rows, actorId) {
  const errors = await validateRows(rows);
  if (errors.length) {
    return { committed: false, errors, importedCount: 0 };
  }

  return sequelize.transaction(async (transaction) => {
    const codeToId = {};
    // First pass: create every row with no manager, so later rows can reference
    // earlier ones in the same file regardless of order.
    for (const row of rows) {
      const employee = await Employee.create({
        entra_oid: row.entraOid || null,
        work_email: row.workEmail,
        employee_code: row.employeeCode,
        full_name: row.fullName,
        date_of_joining: row.dateOfJoining,
        designation: row.designation,
      }, { transaction });
      codeToId[row.employeeCode] = employee.employee_id;
    }

    // Second pass: wire up reporting managers now that every code has an id.
    for (const row of rows) {
      if (!row.reportingManagerCode) continue;
      const managerId = codeToId[row.reportingManagerCode]
        || (await Employee.findOne({ where: { employee_code: row.reportingManagerCode }, transaction }))?.employee_id;
      if (!managerId) continue;

      const circular = await approvalRouting.wouldCreateCircularHierarchy(codeToId[row.employeeCode], managerId);
      if (circular) {
        throw Object.assign(
          new Error(`Row for ${row.employeeCode}: assigning manager ${row.reportingManagerCode} would create a circular hierarchy. Import rolled back — no partial commit.`),
          { status: 400, code: 'CIRCULAR_HIERARCHY' },
        );
      }

      await Employee.update(
        { reporting_manager_id: managerId },
        { where: { employee_id: codeToId[row.employeeCode] }, transaction },
      );
    }

    await auditService.record({
      actorId, action: 'BULK_EMPLOYEE_IMPORT', entityType: 'employees', entityId: 'bulk',
      newValue: { count: rows.length, codes: rows.map((r) => r.employeeCode) }, transaction,
    });

    return { committed: true, errors: [], importedCount: rows.length };
  });
}

module.exports = { validateRows, importEmployees };
