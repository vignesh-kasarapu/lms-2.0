import { useEffect, useState } from 'react';
import { PartyPopper, AlertTriangle } from 'lucide-react';
import { listHolidays } from '../api/holidays';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import Topbar from '../components/layout/Topbar';

export default function HolidayCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listHolidays().then((res) => setHolidays(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Holiday Calendar" />
      <GlassCard>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load the holiday calendar" description={error} />
        ) : !holidays.length ? (
          <EmptyState icon={PartyPopper} title="No holidays published yet" description="HR/Admin publishes the holiday calendar for the current and next leave year." />
        ) : (
          <div className="divide-y divide-frost/5">
            {holidays.map((h) => (
              <div key={h.holiday_id} className="py-3 flex items-center justify-between">
                <p className="text-sm text-ink-100">{h.holiday_name}</p>
                <p className="text-xs text-ink-500">{h.holiday_date}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </>
  );
}
