const { Holiday, LeaveYear } = require('../models');
const { Op } = require('sequelize');
const { ok } = require('../utils/apiResponse');

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

module.exports = { list };
