import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlaneTakeoff, ShieldCheck, ListChecks } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Mobile bottom bar: four highest-frequency destinations for the role (FRD 7.2).
export default function BottomNav() {
  const { hasRole } = useAuth();
  const isApprover = hasRole('MANAGER', 'HR_ADMIN');

  const items = isApprover
    ? [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/approvals', icon: ShieldCheck, label: 'Approvals' },
        { to: '/apply', icon: PlaneTakeoff, label: 'Apply' },
        { to: '/my-requests', icon: ListChecks, label: 'Requests' },
      ]
    : [
        { to: '/', icon: LayoutDashboard, label: 'Home' },
        { to: '/apply', icon: PlaneTakeoff, label: 'Apply' },
        { to: '/my-requests', icon: ListChecks, label: 'Requests' },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 p-3 z-30">
      <div className="glass-panel-strong flex items-center justify-around py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium ${
                isActive ? 'text-aurora-violet' : 'text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
