import { useState } from 'react';
import { PartyPopper, Check, X } from 'lucide-react';
import { getOptionalHolidaySummaryFor, assignOptionalHoliday, unassignOptionalHoliday } from '../../api/holidays';
import { GhostButton } from './GlassButton';

/** Manager-facing per-team-member control to assign (or remove) an optional holiday on an
 * employee's behalf, up to their quota — same backend rules as employee self-selection
 * (optionalHoliday.service.js#selectOptionalHoliday doesn't distinguish who called it),
 * scoped server-side to the manager's own reporting hierarchy. */
export default function OptionalHolidayControl({ employeeId, employeeName }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [busyHolidayId, setBusyHolidayId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => getOptionalHolidaySummaryFor(employeeId).then((res) => setSummary(res.data)).catch((err) => setError(err.message));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const toggleSelection = async (holiday, isSelected) => {
    setBusyHolidayId(holiday.holiday_id);
    setError(null);
    try {
      if (isSelected) await unassignOptionalHoliday(holiday.holiday_id, employeeId);
      else await assignOptionalHoliday(holiday.holiday_id, employeeId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyHolidayId(null);
    }
  };

  if (!open) {
    return (
      <GhostButton onClick={toggle} className="!px-2.5 !py-1.5 text-xs">
        <PartyPopper className="w-3.5 h-3.5" /> Optional holidays
      </GhostButton>
    );
  }

  return (
    <div className="w-full p-3 bg-frost/[0.03] rounded-xl space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <p className="text-ink-400">Optional holidays for {employeeName}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-500 hover:text-ink-200"><X className="w-3.5 h-3.5" /></button>
      </div>
      {!summary ? (
        <p className="text-ink-500">Loading…</p>
      ) : !summary.eligibleHolidays.length ? (
        <p className="text-ink-500">No optional holidays published for this employee's region this year.</p>
      ) : (
        <>
          <p className="text-ink-400">{summary.taken} of {summary.quota} selected{summary.remaining > 0 ? ` — ${summary.remaining} remaining` : ' — quota reached'}.</p>
          <div className="space-y-1.5">
            {summary.eligibleHolidays.map((h) => {
              const quotaReached = !h.isSelected && summary.remaining <= 0;
              return (
                <div key={h.holiday_id} className="flex items-center justify-between gap-2 bg-frost/[0.04] rounded-lg px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="text-ink-200 truncate">{h.holiday_name}</p>
                    <p className="text-ink-600 text-[10px]">{h.holiday_date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelection(h, h.isSelected)}
                    disabled={busyHolidayId === h.holiday_id || (quotaReached && !h.isSelected)}
                    className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold border transition-colors disabled:opacity-40 ${
                      h.isSelected
                        ? 'text-status-approved border-status-approved/30 bg-status-approved/10 hover:text-status-rejected hover:border-status-rejected/30 hover:bg-status-rejected/10'
                        : 'text-ink-300 border-frost/15 hover:border-aurora-violet/40 hover:text-aurora-violet'
                    }`}
                  >
                    {h.isSelected ? <><Check className="w-3 h-3" /> Selected</> : quotaReached ? 'Quota reached' : 'Assign'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
      {error && <p className="text-status-rejected">{error}</p>}
    </div>
  );
}
