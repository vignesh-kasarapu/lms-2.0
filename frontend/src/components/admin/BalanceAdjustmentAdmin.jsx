import { useEffect, useState } from 'react';
import { Scale, AlertTriangle } from 'lucide-react';
import { getEmployeeLedger, adjustBalance } from '../../api/ledger';
import { listEmployees } from '../../api/employees';
import { listLeaveTypesShort } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import { PrimaryButton } from '../common/GlassButton';

export default function BalanceAdjustmentAdmin() {
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [ledger, setLedger] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    listEmployees().then((res) => setEmployees(res.data));
    listLeaveTypesShort().then((res) => setLeaveTypes(res.data));
  }, []);

  useEffect(() => {
    if (employeeId && leaveTypeId) {
      getEmployeeLedger(employeeId, { leaveTypeId }).then((res) => setLedger(res.data));
    } else {
      setLedger([]);
    }
  }, [employeeId, leaveTypeId]);

  const currentBalance = ledger.length ? ledger[ledger.length - 1].running_balance : 0;
  const projectedBalance = currentBalance + (parseFloat(quantity) || 0);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await adjustBalance({ employeeId, leaveTypeId, leaveYearId: ledger[0]?.leave_year_id, quantity: parseFloat(quantity), reason });
      setQuantity('');
      setReason('');
      setConfirming(false);
      getEmployeeLedger(employeeId, { leaveTypeId }).then((res) => setLedger(res.data));
    } catch (err) {
      setError(err.message); // e.g. missing-reason refusal (LMS-054/BR-15)
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Scale className="w-4 h-4 text-aurora-violet" /> Balance adjustment
        </h3>
        <p className="text-xs text-slate-500 mb-4">Every adjustment requires a reason and is written to the ledger — never silent.</p>

        <div className="space-y-3">
          <select className="glass-input" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setConfirming(false); }}>
            <option value="">Employee…</option>
            {employees.map((e) => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
          </select>
          <select className="glass-input" value={leaveTypeId} onChange={(e) => { setLeaveTypeId(e.target.value); setConfirming(false); }}>
            <option value="">Leave type…</option>
            {leaveTypes.map((t) => <option key={t.leave_type_id} value={t.leave_type_id}>{t.type_name}</option>)}
          </select>

          {employeeId && leaveTypeId && (
            <>
              <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 text-sm">
                <p className="text-slate-500 text-xs">Current balance</p>
                <p className="text-slate-100 font-semibold text-lg">{currentBalance.toFixed(1)}</p>
              </div>

              <input type="number" step="0.5" className="glass-input" placeholder="Signed quantity (e.g. -2 or 5)" value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setConfirming(false); }} />
              <textarea className="glass-input min-h-[70px] resize-none" placeholder="Reason (mandatory)" value={reason}
                onChange={(e) => { setReason(e.target.value); setConfirming(false); }} />

              {quantity && (
                <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 text-sm">
                  <p className="text-slate-500 text-xs">Projected balance after this adjustment</p>
                  <p className={`font-semibold text-lg ${projectedBalance < 0 ? 'text-status-advance' : 'text-slate-100'}`}>{projectedBalance.toFixed(1)}</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-xs text-status-rejected bg-status-rejected/10 border border-status-rejected/25 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {!confirming ? (
                <PrimaryButton onClick={() => setConfirming(true)} disabled={!quantity || !reason.trim()} className="w-full">
                  Review adjustment
                </PrimaryButton>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-status-advance">Confirm: {quantity} day(s), balance will become {projectedBalance.toFixed(1)}.</p>
                  <PrimaryButton onClick={submit} disabled={saving} className="w-full">{saving ? 'Posting…' : 'Confirm adjustment'}</PrimaryButton>
                </div>
              )}
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h3 className="font-display font-bold text-slate-100 mb-4">Full ledger</h3>
        {!employeeId || !leaveTypeId ? (
          <p className="text-sm text-slate-500">Select an employee and leave type to see their ledger.</p>
        ) : !ledger.length ? (
          <p className="text-sm text-slate-500">No ledger entries for this employee/type/year.</p>
        ) : (
          <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
            {ledger.map((entry) => (
              <div key={entry.entry_id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-slate-200">{entry.entry_type.replaceAll('_', ' ').toLowerCase()}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleDateString()} · {entry.source_reference}</p>
                </div>
                <div className="text-right">
                  <p className={parseFloat(entry.quantity) < 0 ? 'text-status-rejected' : 'text-status-approved'}>
                    {parseFloat(entry.quantity) > 0 ? '+' : ''}{entry.quantity}
                  </p>
                  <p className="text-xs text-slate-500">bal: {entry.running_balance.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
