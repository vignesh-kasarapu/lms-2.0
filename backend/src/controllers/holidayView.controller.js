const { Holiday, LeaveYear } = require('../models');
const { Op } = require('sequelize');
const { ok } = require('../utils/apiResponse');

/** LMS-077: all users view the holiday calendar for the current and next leave year. */
async function list(req, res) {
  const years = await LeaveYear.findAll({
    where: { is_closed: false },
    order: [['start_date', 'ASC']],
    limit: 2,
  });
  const yearIds = years.map((y) => y.leave_year_id);

  const holidays = await Holiday.findAll({
    where: { leave_year_id: { [Op.in]: yearIds } },
    order: [['holiday_date', 'ASC']],
  });
  return ok(res, holidays);
}

module.exports = { list };
