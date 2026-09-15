const { Holiday, LeaveYear } = require('../models');
const { Op } = require('sequelize');
const { ok, created } = require('../utils/apiResponse');
const optionalHolidayService = require('../services/optionalHoliday.service');

/** LMS-077: all users view the holiday calendar for the current and next leave year,
 * scoped to their own region of working (plus org-wide, region-less holidays). */
async function list(req, res) {
  const years = await LeaveYear.findAll({
    where: { is_closed: false },
    order: [['start_date', 'ASC']],
    limit: 2,
  });
  const yearIds = years.map((y) => y.leave_year_id);
  const employeeRegionId = req.currentUser.employee.region_id;

  const holidays = await Holiday.findAll({
    where: {
      leave_year_id: { [Op.in]: yearIds },
      [Op.or]: employeeRegionId ? [{ region_id: null }, { region_id: employeeRegionId }] : [{ region_id: null }],
    },
    order: [['holiday_date', 'ASC']],
  });
  return ok(res, holidays);
}

/** Quota + eligible optional holidays + which ones this employee has already selected, for
 * whichever leave year is passed (defaults to the current one). */
async function optionalSummary(req, res) {
  const leaveYearId = req.query.leaveYearId
    ? Number(req.query.leaveYearId)
    : (await LeaveYear.findOne({ where: { is_current: true } }))?.leave_year_id;
  if (!leaveYearId) return ok(res, { quota: 0, taken: 0, remaining: 0, eligibleHolidays: [] });

  const summary = await optionalHolidayService.getOptionalHolidaySummary(
    req.currentUser.employeeId, leaveYearId, req.currentUser.employee.region_id,
  );
  return ok(res, summary);
}

async function selectOptional(req, res) {
  const selection = await optionalHolidayService.selectOptionalHoliday(req.currentUser.employeeId, req.params.holidayId);
  return created(res, selection);
}

async function deselectOptional(req, res) {
  const result = await optionalHolidayService.deselectOptionalHoliday(req.currentUser.employeeId, req.params.holidayId);
  return ok(res, result);
}

module.exports = { list, optionalSummary, selectOptional, deselectOptional };
