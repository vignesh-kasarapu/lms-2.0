import { useEffect, useState } from 'react';
import { PartyPopper, AlertTriangle } from 'lucide-react';
import { listHolidays, getOptionalHolidaySummary, selectOptionalHoliday, deselectOptionalHoliday } from '../api/holidays';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import { GhostButton } from '../components/common/GlassButton';
import Topbar from '../components/layout/Topbar';

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  // Keyed by leave_year_id — a holiday's optional-selection quota/usage is scoped to its own
  // leave year, and the calendar shows both the current and next leave year at once.
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyHolidayId, setBusyHolidayId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    return listHolidays()
      .then((res) => {
        setHolidays(res.data);
        const optionalYearIds = [...new Set(res.data.filter((h) => h.is_optional).map((h) => h.leave_year_id))];
        return Promise.all(optionalYearIds.map((id) => getOptionalHolidaySummary(id).then((r) => [id, r.data])));
      })
      .then((entries) => setSummaries(Object.fromEntries(entries)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleSelection = async (holiday, isSelected) => {
    setBusyHolidayId(holiday.holiday_id);
    try {
      if (isSelected) await deselectOptionalHoliday(holiday.holiday_id);
      else await selectOptionalHoliday(holiday.holiday_id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyHolidayId(null);
    }
  };

  return (
    <>
      <Topbar title="Holiday Calendar" />
      {Object.entries(summaries).map(([yearId, s]) => (
        <p key={yearId} className="text-xs text-ink-400 mb-3">
          Optional holidays: <strong className="text-ink-200">{s.taken} of {s.quota}</strong> selected
          {s.remaining > 0 ? ` — ${s.remaining} remaining` : ' — quota reached'}.
        </p>
      ))}
      <GlassCard>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load the holiday calendar" description={error} />
        ) : !holidays.length ? (
          <EmptyState icon={PartyPopper} title="No holidays published yet" description="HR/Admin publishes the holiday calendar for the current and next leave year." />
        ) : (
          <div className="divide-y divide-frost/5">
            {holidays.map((h) => {
              const summary = summaries[h.leave_year_id];
              const isSelected = summary?.eligibleHolidays?.find((e) => e.holiday_id === h.holiday_id)?.isSelected;
              const quotaReached = summary && !isSelected && summary.remaining <= 0;
              return (
                <div key={h.holiday_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-100 flex items-center gap-2">
                      {h.holiday_name}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                        h.is_optional ? 'text-status-advance border-status-advance/30 bg-status-advance/10' : 'text-ink-400 border-frost/10 bg-frost/5'
                      }`}>
                        {h.is_optional ? 'Optional' : 'Public holiday'}
                      </span>
                    </p>
                    <p className="text-xs text-ink-500">{h.holiday_date}</p>
                  </div>
                  {h.is_optional && (
                    <GhostButton
                      onClick={() => toggleSelection(h, isSelected)}
                      disabled={busyHolidayId === h.holiday_id || (quotaReached && !isSelected)}
                      className={`!px-3 !py-1.5 text-xs shrink-0 ${isSelected ? 'hover:border-status-rejected/40 hover:text-status-rejected' : ''}`}
                    >
                      {isSelected ? 'Deselect' : quotaReached ? 'Quota reached' : 'Select'}
                    </GhostButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </>
  );
}
