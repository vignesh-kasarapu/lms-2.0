import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getPeerCalendar, getTeamCalendar } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/common/GlassCard';
import { GhostButton, SecondaryButton } from '../components/common/GlassButton';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Topbar from '../components/layout/Topbar';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TeamCalendar() {
  const { hasRole } = useAuth();
  const isManagerView = hasRole('MANAGER', 'HR_ADMIN');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Month / Year Navigation & Selected Date
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  useEffect(() => {
    const fetcher = isManagerView ? getTeamCalendar({}) : getPeerCalendar({});
    fetcher.then((res) => setEntries(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [isManagerView]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Calendar Grid Math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Helper to format date as YYYY-MM-DD
  const formatYMD = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Find all leave entries active on a specific YYYY-MM-DD
  const getLeavesForDate = (dateStr) => {
    return entries.filter((e) => dateStr >= e.start_date && dateStr <= e.end_date);
  };

  const selectedLeaves = getLeavesForDate(selectedDateStr);

  // Format selected date nicely (e.g. September 8, 2026)
  const formatNiceDate = (ymdStr) => {
    if (!ymdStr) return '';
    const [y, m, d] = ymdStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Topbar title={isManagerView ? 'Team Calendar' : 'Peer Leave Calendar'} />

      <GlassCard className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="ico" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-tint-3)', display: 'grid', placeItems: 'center', color: 'var(--color-accent-text)' }}>
            <CalendarDays />
          </span>
          <div>
            <h2 className="h2">{MONTH_NAMES[month]} {year}</h2>
            <p className="muted small">Click any date to see who is out and why on the right.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <GhostButton className="btn--sm !px-2" onClick={prevMonth} title="Previous month" aria-label="Previous month">
            <ChevronLeft />
          </GhostButton>
          <SecondaryButton className="btn--sm" onClick={goToToday}>Today</SecondaryButton>
          <GhostButton className="btn--sm !px-2" onClick={nextMonth} title="Next month" aria-label="Next month">
            <ChevronRight />
          </GhostButton>
        </div>
      </GlassCard>

      <div className="row2 mt-4">
        {/* Monthly grid */}
        <GlassCard>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="muted small">{wd}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 sm:h-24" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatYMD(year, month, dayNum);
              const dayLeaves = getLeavesForDate(dateStr);
              const isSelected = selectedDateStr === dateStr;
              const isToday =
                today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className="h-20 sm:h-24 p-1.5 text-left flex flex-col justify-between cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isSelected
                      ? 'color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))'
                      : isToday
                        ? 'var(--color-tint-2)'
                        : dayLeaves.length > 0
                          ? 'var(--color-tint-3)'
                          : 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={isSelected || isToday ? 'num' : 'num muted'} style={{ fontWeight: isToday || isSelected ? 'var(--font-weight-medium)' : undefined }}>
                      {dayNum}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="pill pill--accent" style={{ padding: '0 6px' }}>{dayLeaves.length}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Selected day inspector */}
        <GlassCard strong className="flex flex-col">
          <div className="panel-head">
            <div>
              <h3 className="h3 flex items-center gap-2"><FileText className="w-4 h-4" /> Team notes</h3>
              <p className="muted small">{formatNiceDate(selectedDateStr)}</p>
            </div>
            <span className="pill pill--accent">{selectedLeaves.length} leave{selectedLeaves.length === 1 ? '' : 's'}</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => <div key={i} className="skel" style={{ height: 96, borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : error ? (
            <EmptyState icon={AlertTriangle} title="Couldn't load the calendar" description={error} />
          ) : !selectedLeaves.length ? (
            <EmptyState
              icon={CalendarDays}
              title="No leaves on this date"
              description="Select a day on the calendar grid to inspect leave days taken, reasons, and team notes."
            />
          ) : (
            <div className="flex flex-col gap-3" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {selectedLeaves.map((l) => {
                const emp = l.employee || {};
                const initials = emp.full_name?.slice(0, 2).toUpperCase() || 'EMP';
                const leaveTypeName = isManagerView
                  ? l.LeaveType?.type_name || 'Scheduled leave'
                  : 'Scheduled time off';

                return (
                  <div key={l.request_id} className="flex flex-col gap-3 p-3" style={{ background: 'var(--color-tint-2)', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials}</span>
                        <div>
                          <p className="name flex items-center gap-1.5">
                            {emp.full_name}
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                          </p>
                          <p className="muted small">{emp.designation || 'Team member'}</p>
                        </div>
                      </div>
                      <StatusBadge state={l.state} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 small">
                      <div className="p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <span className="muted small">Leave category</span>
                        <p className="num" style={{ fontWeight: 'var(--font-weight-medium)' }}>{leaveTypeName}</p>
                      </div>
                      <div className="p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <span className="muted small">Days taken</span>
                        <p className="num" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {l.deducted_days ? `${l.deducted_days} day(s)` : `${l.start_date} → ${l.end_date}`}
                          {l.is_half_day && ` (${l.half_day_portion === 'FIRST' ? '1st half AM' : '2nd half PM'})`}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="muted small mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Reason &amp; notes</p>
                      <div className="p-2 small" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        "{l.reason || 'No detailed notes provided for this leave application.'}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
