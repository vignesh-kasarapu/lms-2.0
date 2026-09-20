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
        <div key={yearId} className="alert alert--info mb-4" role="status">
          <PartyPopper />
          <p>
            Optional holidays: <b>{s.taken} of {s.quota}</b> selected
            {s.remaining > 0 ? ` — ${s.remaining} remaining` : ' — quota reached'}.
          </p>
        </div>
      ))}

      <GlassCard>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 48, borderRadius: 'var(--radius-sm)' }} />)}
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load the holiday calendar" description={error} />
        ) : !holidays.length ? (
          <EmptyState icon={PartyPopper} title="No holidays published yet" description="HR/Admin publishes the holiday calendar for the current and next leave year." />
        ) : (
          <ul className="list">
            {holidays.map((h) => {
              const summary = summaries[h.leave_year_id];
              const isSelected = summary?.eligibleHolidays?.find((e) => e.holiday_id === h.holiday_id)?.isSelected;
              const quotaReached = summary && !isSelected && summary.remaining <= 0;
              return (
                <li key={h.holiday_id}>
                  <span className="date num">{h.holiday_date}</span>
                  <span>
                    {h.holiday_name}{' '}
                    <span className={`pill ${h.is_optional ? 'pill--holiday' : 'pill--muted'}`}>
                      {h.is_optional ? 'Optional' : 'Public holiday'}
                    </span>
                  </span>
                  {h.is_optional ? (
                    <GhostButton
                      className="btn--sm"
                      onClick={() => toggleSelection(h, isSelected)}
                      disabled={busyHolidayId === h.holiday_id || (quotaReached && !isSelected)}
                    >
                      {isSelected ? 'Deselect' : quotaReached ? 'Quota reached' : 'Select'}
                    </GhostButton>
                  ) : <span />}
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </>
  );
}
