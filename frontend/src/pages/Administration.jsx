import { useEffect, useState } from 'react';
import Topbar from '../components/layout/Topbar';
import Tabs from '../components/common/Tabs';
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

  useEffect(() => {
    document.body.classList.add('theme-admin');
    getDashboard().then((res) => setLeaveYearId(res.data.leaveYear?.leave_year_id));
    return () => document.body.classList.remove('theme-admin');
  }, []);

  return (
    <>
      <Topbar title="Administration Console" />
      <Tabs
        tabs={[
          { key: 'employees', label: 'Employees', content: <EmployeeAdmin /> },
          { key: 'leave-types', label: 'Leave types & policy', content: <LeaveTypeAdmin /> },
          { key: 'holidays', label: 'Holiday calendar', content: <HolidayAdmin leaveYearId={leaveYearId} /> },
          { key: 'org-config', label: 'Organisation', content: <OrgConfigAdmin /> },
          { key: 'self-approval', label: 'Self-approval', content: <SelfApprovalAdmin /> },
          { key: 'working-patterns', label: 'Working patterns', content: <WorkingPatternAdmin /> },
          { key: 'templates', label: 'Notification templates', content: <NotificationTemplateAdmin /> },
          { key: 'capacity', label: 'Blackout & capacity', content: <CapacityAdmin /> },
          { key: 'balance-extras', label: 'Encashment & comp-off', content: <BalanceExtrasAdmin /> },
          { key: 'delegations', label: 'Delegations', content: <DelegationAdmin /> },
          { key: 'balance-adjustment', label: 'Balance adjustment', content: <BalanceAdjustmentAdmin /> },
          { key: 'reports', label: 'Reports', content: <ReportsAdmin /> },
          { key: 'audit', label: 'Audit log', content: <AuditLogAdmin /> },
        ]}
      />
    </>
  );
}
