const { Op } = require('sequelize');
const { BlackoutPeriod } = require('../models');
const auditService = require('./audit.service');

async function listBlackoutPeriods() {
  return BlackoutPeriod.findAll({ where: { is_active: true }, order: [['start_date', 'ASC']] });
}

async function createBlackoutPeriod({ name, startDate, endDate, leaveTypeId }, actorId) {
  const period = await BlackoutPeriod.create({
    name, start_date: startDate, end_date: endDate, leave_type_id: leaveTypeId || null, created_by: actorId,
  });
  await auditService.record({ actorId, action: 'BLACKOUT_PERIOD_CREATED', entityType: 'blackout_periods', entityId: period.blackout_id, newValue: { name, startDate, endDate, leaveTypeId } });
  return period;
}

async function deactivate(blackoutId, actorId) {
  const period = await BlackoutPeriod.findByPk(blackoutId);
  if (!period) throw Object.assign(new Error('Blackout period not found'), { status: 404, code: 'NOT_FOUND' });
  period.is_active = false;
  await period.save();
  await auditService.record({ actorId, action: 'BLACKOUT_PERIOD_DEACTIVATED', entityType: 'blackout_periods', entityId: blackoutId });
  return period;
}

/**
 * LMS-085: refuses submission where the requested span overlaps an active
 * blackout period for that leave type (or a type-agnostic blackout, where
 * leave_type_id is null — applies to every type). This is a hard block, not
 * a warning, matching the FRD's wording: "leave... may not be applied for."
 */
async function assertNoBlackoutConflict({ leaveTypeId, startDate, endDate }) {
  const conflict = await BlackoutPeriod.findOne({
    where: {
      is_active: true,
      start_date: { [Op.lte]: endDate },
      end_date: { [Op.gte]: startDate },
      [Op.or]: [{ leave_type_id: null }, { leave_type_id: leaveTypeId }],
    },
  });
  if (conflict) {
    throw Object.assign(
      new Error(`This span falls within the blackout period "${conflict.name}" (${conflict.start_date} to ${conflict.end_date}). Leave cannot be applied for during this window.`),
      { status: 400, code: 'BLACKOUT_PERIOD_CONFLICT' },
    );
  }
}

module.exports = { listBlackoutPeriods, createBlackoutPeriod, deactivate, assertNoBlackoutConflict };
