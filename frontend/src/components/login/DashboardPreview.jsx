import { LayoutDashboard, CalendarCheck2, FilePlus2, CalendarDays, CheckSquare, FileBarChart } from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: CalendarCheck2, label: 'My Leaves' },
  { icon: FilePlus2, label: 'Apply Leave' },
  { icon: CalendarDays, label: 'Calendar' },
  { icon: CheckSquare, label: 'Approvals' },
  { icon: FileBarChart, label: 'Reports' },
];

const CAL_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// April 2025 starts on a Tuesday; leading blanks pad the first week.
const CAL_CELLS = [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const CAL_MARKS = { 15: 'rejected', 16: 'selected', 23: 'rejected', 29: 'approved' };

function PreviewSidebar() {
  return (
    <div
      className="w-[150px] shrink-0 flex flex-col gap-1 pr-3 py-4 pl-4"
      style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <div
          className="w-5 h-5 rounded-md shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #22D3EE)' }}
        />
        <span className="text-[11px] font-display font-bold text-premium-text">LMS 2.0</span>
      </div>
      {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px]"
          style={
            active
              ? { background: 'rgba(139,92,246,0.18)', color: '#C4B5FD' }
              : { color: '#64748B' }
          }
        >
          <Icon size={12} className="shrink-0" />
          <span className="truncate">{label}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewHeader() {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div>
        <p className="text-[13px] font-semibold text-premium-text leading-tight">Welcome back!</p>
        <p className="text-[10.5px] text-premium-textFaint">Here's your leave overview</p>
      </div>
      <div
        className="w-7 h-7 rounded-full shrink-0"
        style={{ background: 'linear-gradient(135deg, #22D3EE, #8B5CF6)' }}
      />
    </div>
  );
}

function PreviewStats() {
  const stats = [
    { value: '18', label: 'Available Leave', color: '#F8FAFC' },
    { value: '2', label: 'Pending Requests', color: '#FBBF24' },
    { value: '12', label: 'Used This Year', color: '#F8FAFC' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg px-2.5 py-2 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[15px] font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[9px] text-premium-textFaint mt-1.5 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function PreviewCalendar() {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[10px] font-semibold text-premium-textSecondary mb-1.5">April 2025</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {CAL_DAYS.map((d, i) => (
          <span key={`${d}-${i}`} className="text-[7px] text-premium-textFaint">{d}</span>
        ))}
        {CAL_CELLS.map((day, i) => {
          const mark = day ? CAL_MARKS[day] : null;
          return (
            <span
              key={i}
              className="text-[8px] leading-[16px] rounded-full"
              style={
                mark === 'selected'
                  ? { background: '#7C3AED', color: '#F8FAFC', fontWeight: 600 }
                  : mark === 'rejected'
                  ? { background: 'rgba(251,113,133,0.20)', color: '#FB7185' }
                  : mark === 'approved'
                  ? { background: 'rgba(34,211,238,0.20)', color: '#22D3EE' }
                  : { color: '#64748B' }
              }
            >
              {day || ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingLeave() {
  const items = [
    { color: '#8B5CF6', label: 'Annual Leave', date: 'Apr 16 – Apr 18' },
    { color: '#FB7185', label: 'Sick Leave', date: 'Apr 15' },
    { color: '#22D3EE', label: 'Personal Leave', date: 'May 5 – May 6' },
  ];
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[10px] font-semibold text-premium-textSecondary mb-1.5">Upcoming Leave</p>
      <div className="flex flex-col gap-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-start gap-1.5 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full mt-0.5 shrink-0" style={{ background: it.color }} />
            <span className="text-premium-textSecondary">
              {it.label}
              <br />
              <span className="text-premium-textFaint">{it.date}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingCallout() {
  return (
    <div
      className="absolute -bottom-7 -right-8 w-[190px] px-4 py-3.5 rounded-2xl motion-safe:animate-float-slow z-10"
      style={{
        background: 'rgba(17,24,39,0.65)',
        border: '1px solid rgba(34,211,238,0.25)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.4), 0 0 24px rgba(34,211,238,0.10)',
        transform: 'rotate(2deg)',
        '--tw-rotate': '2deg',
      }}
    >
      <div className="flex items-center gap-2">
        <CalendarCheck2 size={16} style={{ color: '#22D3EE' }} className="shrink-0" />
        <p className="text-[12px] font-medium text-premium-text leading-snug">
          Work-life balance starts with you.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPreview() {
  return (
    <div className="relative hidden lg:block w-full max-w-[700px] mt-8 motion-safe:animate-float">
      <div
        className="grid grid-cols-[150px,1fr] rounded-[22px] overflow-hidden"
        style={{
          background: 'rgba(20,30,60,0.55)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139,92,246,0.35)',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.5), inset 2px 0 24px -18px rgba(139,92,246,0.6), inset -2px 0 24px -18px rgba(34,211,238,0.5)',
          transform: 'perspective(1200px) rotateX(2deg) rotateY(-4deg) rotateZ(-1deg)',
        }}
      >
        <PreviewSidebar />
        <div className="px-4 py-4 min-w-0">
          <PreviewHeader />
          <PreviewStats />
          <div className="grid grid-cols-[1.3fr,1fr] gap-2">
            <PreviewCalendar />
            <UpcomingLeave />
          </div>
        </div>
      </div>

      {/* soft shadow beneath the floating dashboard, standing in for a reflection */}
      <div
        className="absolute left-[8%] right-[8%] -bottom-6 h-8 rounded-full"
        style={{ background: 'rgba(0,0,0,0.45)', filter: 'blur(24px)' }}
      />

      <FloatingCallout />
    </div>
  );
}
