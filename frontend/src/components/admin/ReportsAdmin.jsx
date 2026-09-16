import { useEffect, useRef, useState } from 'react';
import { FileBarChart, AlertTriangle } from 'lucide-react';
import { getLeaveTakenReport, getLopReport } from '../../api/reports';
import { getDashboard, listEmployees, getWatchableEmployees } from '../../api/employees';
import { listDepartments } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../common/StatusBadge';
import { GhostButton } from '../common/GlassButton';

const STATES = [
  'PENDING_MANAGER', 'PENDING_HR', 'APPROVED', 'REJECTED', 'REJECTED_PENDING_WITHDRAWAL',
  'WITHDRAWN', 'LOP_APPLIED', 'CANCELLATION_REQUESTED', 'CANCELLED',
];

const emptyFilters = { from: '', to: '', leaveTypeId: '', status: '', employeeId: '', departmentId: '', managerId: '' };

export default function ReportsAdmin() {
  const { hasRole } = useAuth();
  const isHrAdmin = hasRole('HR_ADMIN');

  const [view, setView] = useState('leave-taken');
  const [filters, setFilters] = useState(emptyFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  // Mirrors ApplyLeave.jsx's previewRequestId ref pattern: switching views/filters while a
  // fetch for the OLD combination is still in flight must not let that late response render
  // through the NEW combination's field-mapping. Each fetch only applies its result if it's
  // still the current one when it resolves.
  const requestIdRef = useRef(0);

  // Leave types via the dashboard endpoint (any authenticated user) rather than
  // /admin/leave-types, which is HR/Admin-only and would 403 for a Manager viewing this page.
  useEffect(() => {
    getDashboard().then((res) => {
      setLeaveTypes((res.data.balances || []).map(({ leaveType }) => leaveType));
    }).catch(() => {});
  }, []);

  // Org-wide filters (department/employee) only make sense — and are only authorized —
  // for HR/Admin's unscoped view. A Manager's results are already restricted to their own
  // reporting hierarchy server-side.
  useEffect(() => {
    if (!isHrAdmin) return;
    listDepartments().then((res) => setDepartments(res.data)).catch(() => {});
    listEmployees().then((res) => setEmployees(res.data)).catch(() => {});
    getWatchableEmployees().then((res) => setManagers(res.data)).catch(() => {});
  }, [isHrAdmin]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;
    const params = { ...filters };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    const fetcher = view === 'leave-taken' ? getLeaveTakenReport(params) : getLopReport(params);
    fetcher
      .then((res) => {
        if (requestId === requestIdRef.current) setRows(res.data);
      })
      .catch((err) => {
        if (requestId === requestIdRef.current) setError(err.message);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [view, filters]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="font-display font-bold text-ink-100 flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-aurora-violet" /> Reports
        </h3>
        <div className="flex gap-2">
          <GhostButton onClick={() => setView('leave-taken')} className={`!py-1.5 !px-3 text-xs ${view === 'leave-taken' ? '!bg-frost/10' : ''}`}>Leave taken</GhostButton>
          {isHrAdmin && (
            <GhostButton onClick={() => setView('lop')} className={`!py-1.5 !px-3 text-xs ${view === 'lop' ? '!bg-frost/10' : ''}`}>Loss of pay</GhostButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <input type="date" className="glass-input !py-2 text-xs" value={filters.from}
          onChange={(e) => updateFilter('from', e.target.value)} title="From date" />
        <input type="date" className="glass-input !py-2 text-xs" value={filters.to}
          onChange={(e) => updateFilter('to', e.target.value)} title="To date" />
        <select className="glass-input !py-2 text-xs" value={filters.leaveTypeId} onChange={(e) => updateFilter('leaveTypeId', e.target.value)}>
          <option value="">All leave types</option>
          {leaveTypes.map((t) => <option key={t.leave_type_id} value={t.leave_type_id}>{t.type_name}</option>)}
        </select>
        {view === 'leave-taken' && (
          <select className="glass-input !py-2 text-xs" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>
        )}
        {isHrAdmin && (
          <>
            <select className="glass-input !py-2 text-xs" value={filters.employeeId} onChange={(e) => updateFilter('employeeId', e.target.value)}>
              <option value="">All employees</option>
              {employees.map((e) => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
            </select>
            <select className="glass-input !py-2 text-xs" value={filters.departmentId} onChange={(e) => updateFilter('departmentId', e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
            <select className="glass-input !py-2 text-xs" value={filters.managerId} onChange={(e) => updateFilter('managerId', e.target.value)}>
              <option value="">All managers</option>
              {managers.map((m) => <option key={m.employee_id} value={m.employee_id}>{m.full_name}</option>)}
            </select>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
      ) : error ? (
        <div className="flex items-start gap-2.5 text-xs font-semibold text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : !rows.length ? (
        <p className="text-sm text-ink-500">No records for this filter.</p>
      ) : view === 'leave-taken' ? (
        <div className="divide-y divide-frost/5">
          {rows.map((r) => (
            <div key={r.request_id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-100">{r.employee?.full_name}</p>
                <p className="text-xs text-ink-500">{r.LeaveType?.type_name} · {r.start_date} → {r.end_date} · {r.deducted_days}d</p>
              </div>
              <StatusBadge state={r.state} />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-frost/5">
          {rows.map((r) => (
            <div key={r.lop_record_id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-100">{r.Employee?.full_name}</p>
                <p className="text-xs text-ink-500">{r.start_date} → {r.end_date} · {r.deducted_days}d</p>
              </div>
              <span className="text-xs text-status-advance">Converted {new Date(r.converted_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
