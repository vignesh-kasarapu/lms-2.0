const { Op } = require('sequelize');
const { WorkingPattern, WorkingPatternAssignment } = require('../models');
const auditService = require('./audit.service');

async function listPatterns() { return WorkingPattern.findAll({ order: [['pattern_name', 'ASC']] }); }

async function createPattern({ patternCode, patternName, weekendDays }, actorId) {
  const pattern = await WorkingPattern.create({
    pattern_code: patternCode, pattern_name: patternName, weekend_days: JSON.stringify(weekendDays),
  });
  await auditService.record({ actorId, action: 'WORKING_PATTERN_CREATED', entityType: 'working_patterns', entityId: pattern.working_pattern_id, newValue: { patternCode, patternName, weekendDays } });
  return pattern;
}

/**
 * LMS-015: exactly one working pattern is active for an employee on any given
 * date — enforced here as an overlap check against the employee's existing
 * assignments before the new one is created, not left to a DB constraint
 * (date-range exclusion isn't expressible as a simple unique index in either
 * Postgres or MySQL without extensions this project doesn't require elsewhere).
 */
async function assignPattern({ employeeId, workingPatternId, effectiveFrom, effectiveTo, assignedBy }) {
  const existing = await WorkingPatternAssignment.findAll({ where: { employee_id: employeeId } });

  const newFrom = new Date(effectiveFrom);
  const newTo = effectiveTo ? new Date(effectiveTo) : null;

  const overlaps = existing.some((a) => {
    const aFrom = new Date(a.effective_from);
    const aTo = a.effective_to ? new Date(a.effective_to) : null;
    const startsBeforeOtherEnds = !aTo || newFrom <= aTo;
    const endsAfterOtherStarts = !newTo || newTo >= aFrom;
    return startsBeforeOtherEnds && endsAfterOtherStarts;
  });

  if (overlaps) {
    throw Object.assign(
      new Error('This employee already has a working pattern assignment covering part of this date range. Patterns may not overlap.'),
      { status: 400, code: 'WORKING_PATTERN_OVERLAP' },
    );
  }

  const assignment = await WorkingPatternAssignment.create({
    employee_id: employeeId, working_pattern_id: workingPatternId,
    effective_from: effectiveFrom, effective_to: effectiveTo || null, assigned_by: assignedBy,
  });

  await auditService.record({ actorId: assignedBy, action: 'WORKING_PATTERN_ASSIGNED', entityType: 'working_pattern_assignments', entityId: assignment.assignment_id, newValue: { employeeId, workingPatternId, effectiveFrom, effectiveTo } });
  return assignment;
}

/**
 * Returns the weekend day-code set that applies to this employee on this date:
 * their active working pattern if one covers the date, otherwise null (caller
 * falls back to the organisation-wide default).
 */
async function getWeekendOverrideForDate(employeeId, isoDate) {
  const assignment = await WorkingPatternAssignment.findOne({
    where: {
      employee_id: employeeId,
      effective_from: { [Op.lte]: isoDate },
      [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: isoDate } }],
    },
    include: [WorkingPattern],
  });
  if (!assignment) return null;
  return JSON.parse(assignment.WorkingPattern.weekend_days);
}

module.exports = { listPatterns, createPattern, assignPattern, getWeekendOverrideForDate };
