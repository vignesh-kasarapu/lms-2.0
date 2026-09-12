import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, PlaneTakeoff, ListChecks, CalendarDays, Users, Settings, ShieldCheck, UserCog, PartyPopper, Sparkles, Building2, ChevronDown, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_EMPLOYEE = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE'] },
  { to: '/apply', label: 'Apply Leave', icon: PlaneTakeoff, roles: ['EMPLOYEE'] },
  { to: '/my-requests', label: 'My Requests', icon: ListChecks, roles: ['EMPLOYEE'] },
  { to: '/team-calendar', label: 'Team Calendar', icon: CalendarDays, roles: ['EMPLOYEE'] },
  { to: '/holidays', label: 'Holidays', icon: PartyPopper, roles: ['EMPLOYEE'] },
];

const NAV_MANAGEMENT = [
  { to: '/approvals', label: 'Approvals Queue', icon: ShieldCheck, roles: ['MANAGER', 'HR_ADMIN'] },
  { to: '/my-team', label: 'My Team', icon: Users, roles: ['MANAGER', 'HR_ADMIN'] },
  { to: '/delegation', label: 'Delegations', icon: UserCog, roles: ['MANAGER', 'HR_ADMIN'] },
];

const NAV_ADMIN = [
  { to: '/administration', label: 'Administration', icon: Settings, roles: ['HR_ADMIN'] },
];

const ADMIN_SECTIONS = [
  ['employees', 'Employees'],
  ['leave-types', 'Leave types & policy'],
  ['holidays', 'Holiday calendar'],
  ['self-approval', 'Self-approval'],
  ['working-patterns', 'Working patterns'],
  ['templates', 'Notification templates'],
  ['capacity', 'Blackout & capacity'],
  ['balance-extras', 'Encashment & comp-off'],
  ['balance-adjustment', 'Balance adjustment'],
  ['reports', 'Reports'],
  ['audit', 'Audit log'],
  ['ledger', 'Ledger'],
  ['org-config', 'Settings'],
];

/** Shared nav content rendered by both the desktop sidebar and the mobile drawer
 * (see AppLayout.jsx) so every route/section is reachable from either surface —
 * previously the whole sidebar, including the only way to switch Administration
 * sections, was `hidden md:flex` and unreachable on mobile entirely. */
function SidebarNav({ onNavigate }) {
  const { hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdministration = location.pathname === '/administration';
  const activeAdminSection = new URLSearchParams(location.search).get('section') || 'employees';
  const [adminOpen, setAdminOpen] = useState(isAdministration);

  useEffect(() => {
    if (isAdministration) setAdminOpen(true);
  }, [isAdministration]);

  const employeeItems = NAV_EMPLOYEE.filter((item) => hasRole(...item.roles));
  const managementItems = NAV_MANAGEMENT.filter((item) => hasRole(...item.roles));
  const adminItems = NAV_ADMIN.filter((item) => hasRole(...item.roles));

  const goTo = (path) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <>
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-2 pb-6 pt-2 border-b border-frost/10 mb-4 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aurora-violet via-indigo-500 to-aurora-cyan shadow-glow flex items-center justify-center text-white shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <p className="font-display font-extrabold text-ink-100 leading-none text-lg">LMS 2.0</p>
          <p className="text-xs text-ink-300 font-semibold leading-none mt-1">Enterprise Leave Hub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {/* Employee Section */}
        {employeeItems.length > 0 && (
          <div>
            <p className="px-3 text-xs font-black uppercase tracking-wider text-ink-300 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-aurora-violet" /> Employee
            </p>
            <div className="space-y-1">
              {employeeItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-aurora-violet/25 to-aurora-violet/10 text-ink-50 border border-aurora-violet/40 shadow-[0_0_20px_rgba(139,109,255,0.2)] font-bold'
                        : 'text-ink-300 hover:text-ink-50 hover:bg-frost/[0.06]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Management Section */}
        {managementItems.length > 0 && (
          <div>
            <p className="px-3 text-xs font-black uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> HR & Management
            </p>
            <div className="space-y-1">
              {managementItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/25 to-emerald-500/10 text-ink-50 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] font-bold'
                        : 'text-ink-300 hover:text-ink-50 hover:bg-frost/[0.06]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-emerald-400" strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <div>
            <div className="space-y-1">
              {adminItems.map(({ to, label, icon: Icon }) => (
                <div key={to}>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminOpen((open) => !open);
                      if (!isAdministration) goTo(to);
                    }}
                    aria-expanded={adminOpen}
                    aria-controls="administration-submenu"
                    className={`w-full flex items-center justify-between gap-3.5 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                      isAdministration
                        ? 'bg-gradient-to-r from-indigo-500/25 to-amber-500/15 text-ink-50 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] font-bold'
                        : 'text-ink-300 hover:text-ink-50 hover:bg-frost/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-3.5">
                      <Icon className="w-5 h-5 text-amber-400" strokeWidth={2} />
                      {label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-amber-300 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {adminOpen && (
                    <div id="administration-submenu" className="mt-1 ml-4 space-y-0.5 border-l border-amber-400/25 pl-3">
                      {ADMIN_SECTIONS.map(([key, sectionLabel]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => goTo(`${to}?section=${key}`)}
                          className={`w-full rounded-xl px-3.5 py-3 text-left text-base font-semibold transition-all ${
                            isAdministration && activeAdminSection === key
                              ? 'bg-frost/[0.08] text-ink-50 font-bold'
                              : 'text-ink-300 hover:bg-frost/[0.06] hover:text-ink-50'
                          }`}
                        >
                          {sectionLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

/** Mobile menu content: a grid of large icon tiles grouped by section, the
 * "app launcher" pattern most native mobile apps use for an overflow/more
 * menu — not a shrunk clone of the desktop list. Administration is a single
 * tile here; switching between its 13 sections happens on the Administration
 * page itself via a horizontal chip bar (see Administration.jsx), so this
 * sheet never needs the desktop's nested accordion. */
function MobileMenuGrid({ onNavigate }) {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const employeeItems = NAV_EMPLOYEE.filter((item) => hasRole(...item.roles));
  const managementItems = NAV_MANAGEMENT.filter((item) => hasRole(...item.roles));
  const adminItems = NAV_ADMIN.filter((item) => hasRole(...item.roles));

  const groups = [
    { heading: 'Employee', accent: 'text-aurora-violet', items: employeeItems },
    { heading: 'HR & Management', accent: 'text-emerald-400', items: managementItems },
    { heading: 'Admin', accent: 'text-amber-400', items: adminItems },
  ].filter((g) => g.items.length > 0);

  const goTo = (path) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className="space-y-6">
      {groups.map(({ heading, accent, items }) => (
        <div key={heading}>
          <p className={`px-1 text-xs font-black uppercase tracking-wider mb-3 ${accent}`}>{heading}</p>
          <div className="grid grid-cols-3 gap-2.5">
            {items.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                type="button"
                onClick={() => goTo(to)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-frost/[0.05] border border-frost/10 py-4 px-2 text-center active:scale-95 transition-transform hover:bg-frost/[0.08]"
              >
                <Icon className={`w-6 h-6 ${accent}`} strokeWidth={2} />
                <span className="text-[11px] font-semibold text-ink-100 leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:flex-col w-72 shrink-0 p-4 sticky top-0 h-screen z-30">
        <div className="glass-panel-strong flex flex-col h-full p-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile bottom sheet — the native "more menu" pattern (grid of icon
          tiles sliding up from the bottom), distinct from the desktop sidebar */}
      {mobileOpen && createPortal(
        <div className="md:hidden fixed inset-0 z-[90]">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-x-0 bottom-0 max-h-[80vh] animate-in slide-in-from-bottom duration-250">
            <div className="glass-panel-strong relative flex flex-col rounded-t-3xl rounded-b-none max-h-[80vh] p-4 pt-3">
              <div className="mx-auto w-10 h-1.5 rounded-full bg-frost/20 mb-3 shrink-0" />
              <div className="flex items-center justify-between mb-4 shrink-0">
                <p className="font-display font-extrabold text-ink-50 text-lg">Menu</p>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-2 rounded-full text-ink-400 hover:text-ink-50 hover:bg-frost/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                <MobileMenuGrid onNavigate={onCloseMobile} />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
