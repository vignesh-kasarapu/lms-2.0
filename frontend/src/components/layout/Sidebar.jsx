import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlaneTakeoff, ListChecks, CalendarDays, Users, Settings, ShieldCheck, UserCog, PartyPopper, Sparkles, Building2
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
  { to: '/delegation', label: 'Delegations', icon: UserCog, roles: ['MANAGER'] },
];

const NAV_ADMIN = [
  { to: '/administration', label: 'Administration', icon: Settings, roles: ['HR_ADMIN'] },
];

export default function Sidebar() {
  const { hasRole } = useAuth();

  const employeeItems = NAV_EMPLOYEE.filter((item) => hasRole(...item.roles));
  const managementItems = NAV_MANAGEMENT.filter((item) => hasRole(...item.roles));
  const adminItems = NAV_ADMIN.filter((item) => hasRole(...item.roles));

  return (
    <aside className="hidden md:flex md:flex-col w-72 shrink-0 p-4 sticky top-0 h-screen z-30">
      <div className="glass-panel-strong flex flex-col h-full p-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 px-2 pb-6 pt-2 border-b border-white/10 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aurora-violet via-indigo-500 to-aurora-cyan shadow-glow flex items-center justify-center text-white shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-display font-extrabold text-slate-100 leading-none text-lg">LMS 2.0</p>
            <p className="text-xs text-slate-300 font-semibold leading-none mt-1">Enterprise Leave Hub</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
          {/* Employee Section */}
          {employeeItems.length > 0 && (
            <div>
              <p className="px-3 text-xs font-black uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-aurora-violet" /> Employee
              </p>
              <div className="space-y-1">
                {employeeItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-aurora-violet/25 to-aurora-violet/10 text-white border border-aurora-violet/40 shadow-[0_0_20px_rgba(139,109,255,0.2)] font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
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
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/25 to-emerald-500/10 text-white border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
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
              <p className="px-3 text-xs font-black uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-amber-400" /> System Admin
              </p>
              <div className="space-y-1">
                {adminItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/25 to-amber-500/15 text-white border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 text-amber-400" strokeWidth={2} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
