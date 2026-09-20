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
    <div className="w-full p-3 rounded-md space-y-2 small" style={{ background: 'var(--color-tint-2)' }}>
      <div className="flex items-center justify-between">
        <p className="muted">Optional holidays for {employeeName}</p>
        <button type="button" onClick={() => setOpen(false)} className="btn btn--ghost btn--sm !min-h-0 !px-1"><X className="w-3.5 h-3.5" /></button>
      </div>
      {!summary ? (
        <p className="muted">Loading…</p>
      ) : !summary.eligibleHolidays.length ? (
        <p className="muted">No optional holidays published for this employee's region this year.</p>
      ) : (
        <>
          <p className="muted">{summary.taken} of {summary.quota} selected{summary.remaining > 0 ? ` — ${summary.remaining} remaining` : ' — quota reached'}.</p>
          <div className="space-y-1.5">
            {summary.eligibleHolidays.map((h) => {
              const quotaReached = !h.isSelected && summary.remaining <= 0;
              return (
                <div key={h.holiday_id} className="flex items-center justify-between gap-2 rounded-sm px-2.5 py-1.5" style={{ background: 'var(--color-surface)' }}>
                  <div className="min-w-0">
                    <p className="truncate">{h.holiday_name}</p>
                    <p className="muted" style={{ fontSize: '10px' }}>{h.holiday_date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelection(h, h.isSelected)}
                    disabled={busyHolidayId === h.holiday_id || (quotaReached && !h.isSelected)}
                    className={`pill shrink-0 ${h.isSelected ? 'pill--success' : 'pill--muted'}`}
                    style={{ cursor: 'pointer', opacity: (busyHolidayId === h.holiday_id || (quotaReached && !h.isSelected)) ? 0.45 : 1 }}
                  >
                    {h.isSelected ? <><Check className="w-3 h-3" /> Selected</> : quotaReached ? 'Quota reached' : 'Assign'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}
