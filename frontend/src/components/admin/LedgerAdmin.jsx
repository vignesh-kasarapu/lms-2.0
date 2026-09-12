import { useEffect, useState } from 'react';
import { BookOpenText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllLedgerEntries } from '../../api/ledger';
import { listEmployees } from '../../api/employees';
import { listLeaveTypes } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import Table from '../common/Table';

const ENTRY_TYPES = [
  'OPENING_PRO_RATA_CREDIT', 'PERIODIC_ACCRUAL_CREDIT', 'CARRY_FORWARD_CREDIT',
  'CARRY_FORWARD_LAPSE_DEBIT', 'LEAVE_DEDUCTION_DEBIT', 'CANCELLATION_RESTORATION_CREDIT',
  'MANUAL_ADJUSTMENT',
];

const COLUMNS = [
  { label: 'Date' },
  { label: 'Employee' },
  { label: 'Leave Type' },
  { label: 'Entry Type' },
  { label: 'Quantity' },
  { label: 'Source / Reason' },
];

const emptyFilters = { employeeId: '', leaveTypeId: '', entryType: '', dateFrom: '', dateTo: '' };

export default function LedgerAdmin() {
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [result, setResult] = useState({ total: 0, page: 1, pageSize: 50, entries: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
    listLeaveTypes().then((res) => setLeaveTypes(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { ...filters, page };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    getAllLedgerEntries(params).then((res) => setResult(res.data)).finally(() => setLoading(false));
  }, [filters, page]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const totalPages = Math.max(Math.ceil(result.total / result.pageSize), 1);

  return (
    <GlassCard>
      <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
        <BookOpenText className="w-4 h-4 text-aurora-violet" /> Leave ledger
      </h3>
      <p className="text-xs text-slate-500 mb-4">Every balance-affecting transaction across every employee, with filters.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <select className="glass-input !py-2 text-xs" value={filters.employeeId} onChange={(e) => updateFilter('employeeId', e.target.value)}>
          <option value="">All employees</option>
          {employees.map((e) => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
        </select>
        <select className="glass-input !py-2 text-xs" value={filters.leaveTypeId} onChange={(e) => updateFilter('leaveTypeId', e.target.value)}>
          <option value="">All leave types</option>
          {leaveTypes.map((t) => <option key={t.leave_type_id} value={t.leave_type_id}>{t.type_name}</option>)}
        </select>
        <select className="glass-input !py-2 text-xs" value={filters.entryType} onChange={(e) => updateFilter('entryType', e.target.value)}>
          <option value="">All entry types</option>
          {ENTRY_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
        </select>
        <input type="date" className="glass-input !py-2 text-xs" value={filters.dateFrom}
          onChange={(e) => updateFilter('dateFrom', e.target.value)} placeholder="From" />
        <input type="date" className="glass-input !py-2 text-xs" value={filters.dateTo}
          onChange={(e) => updateFilter('dateTo', e.target.value)} placeholder="To" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-11 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
      ) : !result.entries.length ? (
        <p className="text-xs text-slate-500 text-center py-8">No ledger entries match these filters.</p>
      ) : (
        <>
          <Table columns={COLUMNS} maxHeight="max-h-[55vh]">
            {result.entries.map((e) => (
              <tr key={e.entry_id} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-sm text-slate-100 whitespace-nowrap">{e.Employee?.full_name || `#${e.employee_id}`}</td>
                <td className="px-4 py-2.5 text-xs text-slate-300 whitespace-nowrap">{e.LeaveType?.type_name || `#${e.leave_type_id}`}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{e.entry_type.replaceAll('_', ' ')}</td>
                <td className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap ${parseFloat(e.quantity) < 0 ? 'text-status-rejected' : 'text-status-approved'}`}>
                  {parseFloat(e.quantity) > 0 ? '+' : ''}{e.quantity}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{e.reason || e.source_reference}</td>
              </tr>
            ))}
          </Table>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>{result.total} total entries — page {result.page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}
                className="ghost-btn !px-2.5 !py-1.5 disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages}
                className="ghost-btn !px-2.5 !py-1.5 disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
