import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, FileText, User, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { getPeerCalendar, getTeamCalendar } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/common/GlassCard';
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
    if (isManagerView) {
      document.body.classList.add('theme-hr');
    }
    const fetcher = isManagerView ? getTeamCalendar({}) : getPeerCalendar({});
    fetcher.then((res) => setEntries(res.data)).finally(() => setLoading(false));

    return () => {
      if (isManagerView) {
        document.body.classList.remove('theme-hr');
      }
    };
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
      <Topbar title={isManagerView ? 'Team Calendar & Schedule' : 'Peer Leave Calendar'} />

      {/* Calendar Month Header & Controls Bar */}
      <div className="glass-panel-hr p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-teal-500/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 shadow-lg shadow-teal-500/10">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                {MONTH_NAMES[month]} {year}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                {entries.length} Total Scheduled Leaves
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Click any date on the calendar to view team member leave notes, days taken, and reasons on the right side.
            </p>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 font-bold text-xs border border-teal-500/40 transition-all shadow-sm"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side (3 cols): Interactive Monthly Grid Calendar */}
        <div className="lg:col-span-3 glass-panel p-5 rounded-2xl border border-white/10">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300 py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank cells before month starts */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 sm:h-24 rounded-xl bg-white/[0.01] border border-transparent" />
            ))}

            {/* Month Day Cells */}
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
                  className={`h-20 sm:h-24 rounded-xl p-1.5 text-left border flex flex-col justify-between transition-all duration-150 relative group cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border-teal-400 ring-2 ring-teal-400 shadow-lg shadow-teal-500/20'
                      : isToday
                      ? 'bg-teal-500/10 border-teal-500/40 text-white'
                      : dayLeaves.length > 0
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-teal-400 text-slate-950 font-black'
                          : isSelected
                          ? 'text-teal-300 font-extrabold'
                          : 'text-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {dayLeaves.length}
                      </span>
                    )}
                  </div>

                  {/* Employee Leave Pills Inside Day Box */}
                  <div className="space-y-1 overflow-hidden">
                    {dayLeaves.slice(0, 2).map((l) => (
                      <div
                        key={l.request_id}
                        className="text-[10px] font-semibold truncate px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{l.employee?.full_name?.split(' ')[0]}</span>
                      </div>
                    ))}
                    {dayLeaves.length > 2 && (
                      <p className="text-[9px] font-bold text-teal-300 pl-1">
                        +{dayLeaves.length - 2} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side (2 cols): Team Notes & Leave Inspector Panel */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between">
          <div>
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-300" />
                  Team Notes & Details
                </h3>
                <p className="text-xs text-teal-300 font-semibold mt-0.5">
                  {formatNiceDate(selectedDateStr)}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {selectedLeaves.length} Leave(s)
              </span>
            </div>

            {/* Leave Details List for Selected Day */}
            {loading ? (
              <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-32 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
            ) : !selectedLeaves.length ? (
              <EmptyState
                icon={CalendarDays}
                title="No leaves on this date"
                description="Select a day on the calendar grid to inspect leave days taken, reasons, and team notes."
              />
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {selectedLeaves.map((l) => {
                  const emp = l.employee || {};
                  const initials = emp.full_name?.slice(0, 2).toUpperCase() || 'EMP';
                  const leaveTypeName = isManagerView
                    ? l.LeaveType?.type_name || 'Scheduled Leave'
                    : 'Scheduled Time Off';

                  return (
                    <div
                      key={l.request_id}
                      className="bg-slate-900/80 p-4 rounded-2xl border border-teal-500/30 space-y-3 hover:border-teal-500/50 transition-all shadow-lg shadow-teal-950/30"
                    >
                      {/* Member Info Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-md border border-teal-400/30 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-100 text-sm leading-snug flex items-center gap-1.5">
                              {emp.full_name}
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            </h4>
                            <p className="text-xs text-teal-400 font-medium">
                              {emp.designation || 'Team Member'}
                            </p>
                          </div>
                        </div>
                        <StatusBadge state={l.state} />
                      </div>

                      {/* Leave Metadata Row */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Category</span>
                          <span className="text-teal-300 font-extrabold text-xs">{leaveTypeName}</span>
                        </div>
                        <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Days Taken</span>
                          <span className="text-slate-100 font-extrabold text-xs">
                            {l.deducted_days ? `${l.deducted_days} day(s)` : `${l.start_date} → ${l.end_date}`}
                            {l.is_half_day && ` (${l.half_day_portion === 'FIRST' ? '1st Half AM' : '2nd Half PM'})`}
                          </span>
                        </div>
                      </div>

                      {/* Employee Reason / Notes Box */}
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-teal-400" /> Reason & Notes:
                        </p>
                        <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 text-xs text-slate-200 italic leading-relaxed">
                          "{l.reason || 'No detailed notes provided for this leave application.'}"
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

