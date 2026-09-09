const { Op } = require('sequelize');
const {
  Employee, LeaveType, LeavePolicy, LeaveAccrualConfig, LeaveYear, ScheduledJobRun, LeaveLedger,
} = require('../models');
const balanceService = require('../services/balance.service');

/** BR-13/14/15: pro-rata opening entitlement, rounded UP, posted automatically on onboarding. */
async function postOpeningProRata(employeeId) {
  const employee = await Employee.findByPk(employeeId);
  const leaveYear = await LeaveYear.findOne({ where: { is_current: true } });
  const policies = await LeavePolicy.findAll({ include: [{ model: LeaveType, where: { is_balance_affecting: true } }] });

  const periodKey = `${leaveYear.year_code}:${employeeId}`;
  const existing = await ScheduledJobRun.findOne({ where: { job_type: 'ACCRUAL', period_key: `OPENING:${periodKey}` } });
  if (existing) return; // NFR-16 idempotency guard

  const totalDaysInYear = (new Date(leaveYear.end_date) - new Date(leaveYear.start_date)) / 86400000 + 1;
  const daysFromJoinToYearEnd = (new Date(leaveYear.end_date) - new Date(employee.date_of_joining)) / 86400000 + 1;

  for (const policy of policies) {
    const raw = policy.annual_entitlement * (daysFromJoinToYearEnd / totalDaysInYear); // BR-13
    const rounded = Math.ceil(raw); // BR-14: rounds up, deliberate generosity

    await LeaveLedger.create({
      employee_id: employeeId,
      leave_type_id: policy.leave_type_id,
      leave_year_id: leaveYear.leave_year_id,
      entry_type: 'OPENING_PRO_RATA_CREDIT',
      quantity: rounded,
      source_reference: `onboarding:${employeeId}`,
      is_system_actor: true,
    });
  }

  await ScheduledJobRun.create({ job_type: 'ACCRUAL', period_key: `OPENING:${periodKey}`, status: 'SUCCESS', finished_at: new Date() });
}

/** LMS-055: periodic accrual posting, uniquely keyed on (employee, leave type, period) — never double-credits. */
async function runPeriodicAccrual(periodKey) {
  const jobRun = await ScheduledJobRun.create({ job_type: 'ACCRUAL', period_key: periodKey, status: 'RUNNING' });
  try {
    const leaveYear = await LeaveYear.findOne({ where: { is_current: true } });
    const configs = await LeaveAccrualConfig.findAll({ include: [LeaveType] });
    const policies = await LeavePolicy.findAll();
    const employees = await Employee.findAll({ where: { status: 'ACTIVE' } });

    for (const cfg of configs) {
      const policy = policies.find((p) => p.leave_type_id === cfg.leave_type_id);
      if (!policy) continue;
      const periodsPerYear = { MONTHLY: 12, QUARTERLY: 4, ANNUAL: 1 }[cfg.accrual_method];
      const perPeriod = parseFloat(policy.annual_entitlement) / periodsPerYear;

      for (const emp of employees) {
        const uniqueKey = `${periodKey}:${cfg.leave_type_id}:${emp.employee_id}`;
        const already = await LeaveLedger.findOne({ where: { source_reference: uniqueKey } });
        if (already) continue; // idempotent

        await LeaveLedger.create({
          employee_id: emp.employee_id,
          leave_type_id: cfg.leave_type_id,
          leave_year_id: leaveYear.leave_year_id,
          entry_type: 'PERIODIC_ACCRUAL_CREDIT',
          quantity: perPeriod,
          source_reference: uniqueKey,
          is_system_actor: true,
        });
      }
    }
    jobRun.status = 'SUCCESS';
  } catch (err) {
    jobRun.status = 'FAILED';
    jobRun.error_message = err.message;
  } finally {
    jobRun.finished_at = new Date();
    await jobRun.save();
  }
}

module.exports = { postOpeningProRata, runPeriodicAccrual };
