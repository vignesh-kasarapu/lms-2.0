import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmployeeAdmin from '../components/admin/EmployeeAdmin';
import LeaveTypeAdmin from '../components/admin/LeaveTypeAdmin';
import HolidayAdmin from '../components/admin/HolidayAdmin';
import OrgConfigAdmin from '../components/admin/OrgConfigAdmin';
import ReportsAdmin from '../components/admin/ReportsAdmin';
import AuditLogAdmin from '../components/admin/AuditLogAdmin';
import SelfApprovalAdmin from '../components/admin/SelfApprovalAdmin';
import WorkingPatternAdmin from '../components/admin/WorkingPatternAdmin';
import NotificationTemplateAdmin from '../components/admin/NotificationTemplateAdmin';
import CapacityAdmin from '../components/admin/CapacityAdmin';
import BalanceExtrasAdmin from '../components/admin/BalanceExtrasAdmin';
import DelegationAdmin from '../components/admin/DelegationAdmin';
import BalanceAdjustmentAdmin from '../components/admin/BalanceAdjustmentAdmin';
import { getDashboard } from '../api/employees';

export default function Administration() {
  const [leaveYearId, setLeaveYearId] = useState(null);
  const [searchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'employees';

  useEffect(() => {
    document.body.classList.add('theme-admin');
    getDashboard().then((res) => setLeaveYearId(res.data.leaveYear?.leave_year_id));
    return () => document.body.classList.remove('theme-admin');
  }, []);

  const sections = {
    employees: { label: 'Employees', content: <EmployeeAdmin /> },
    'leave-types': { label: 'Leave types & policy', content: <LeaveTypeAdmin /> },
    holidays: { label: 'Holiday calendar', content: <HolidayAdmin leaveYearId={leaveYearId} /> },
    'org-config': { label: 'Organisation', content: <OrgConfigAdmin /> },
    'self-approval': { label: 'Self-approval', content: <SelfApprovalAdmin /> },
    'working-patterns': { label: 'Working patterns', content: <WorkingPatternAdmin /> },
    templates: { label: 'Notification templates', content: <NotificationTemplateAdmin /> },
    capacity: { label: 'Blackout & capacity', content: <CapacityAdmin /> },
    'balance-extras': { label: 'Encashment & comp-off', content: <BalanceExtrasAdmin /> },
    delegations: { label: 'Delegations', content: <DelegationAdmin /> },
    'balance-adjustment': { label: 'Balance adjustment', content: <BalanceAdjustmentAdmin /> },
    reports: { label: 'Reports', content: <ReportsAdmin /> },
    audit: { label: 'Audit log', content: <AuditLogAdmin /> },
  };

  const active = sections[activeSection] || sections.employees;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Administration</p>
          <h1 className="mt-1 text-2xl font-display font-extrabold tracking-tight text-white">{active.label}</h1>
        </div>
        <div className="hidden rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 sm:block">
          HR Admin workspace
        </div>
      </div>

      <main className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-slate-950/20 sm:p-6">
        {active.content}
      </main>
    </div>
  );
}
