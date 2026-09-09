const cron = require('node-cron');
const { runSlaSweep, runLopConversionSweep } = require('./escalation.job');
const { runPeriodicAccrual } = require('./accrual.job');
const { runDailyDigest } = require('./digest.job');
const { runYearEndCarryForward } = require('./carryForward.job');

/** All scheduled-job timings are operational config, not business rules — safe to keep here. */
function start() {
  cron.schedule('*/15 * * * *', () => runSlaSweep().catch((e) => console.error('SLA sweep failed', e)));
  cron.schedule('0 1 * * *', () => runLopConversionSweep().catch((e) => console.error('LOP sweep failed', e)));
  cron.schedule('0 8 * * *', () => runDailyDigest().catch((e) => console.error('Digest run failed', e)));
  cron.schedule('0 2 1 * *', () => {
    const periodKey = new Date().toISOString().slice(0, 7);
    runPeriodicAccrual(periodKey).catch((e) => console.error('Accrual run failed', e));
  });
  // Daily check: has the current leave year ended? If so, roll it over.
  cron.schedule('30 2 * * *', async () => {
    try {
      const { LeaveYear } = require('../models');
      const current = await LeaveYear.findOne({ where: { is_current: true } });
      if (current && new Date(current.end_date) < new Date()) {
        await runYearEndCarryForward(current.leave_year_id);
      }
    } catch (e) {
      console.error('Year-end rollover check failed', e);
    }
  });
}

module.exports = { start };
