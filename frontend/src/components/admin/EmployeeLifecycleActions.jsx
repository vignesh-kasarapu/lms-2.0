import { useState } from 'react';
import { UserX, Repeat } from 'lucide-react';
import { deactivateEmployee, reassignManager } from '../../api/employees';
import { GhostButton, PrimaryButton } from '../common/GlassButton';

export default function EmployeeLifecycleActions({ employee, allEmployees, onChange }) {
  const [mode, setMode] = useState(null); // null | 'deactivate' | 'reassign'
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [newManagerId, setNewManagerId] = useState('');
  const [transferPending, setTransferPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (employee.status !== 'ACTIVE') {
    return <p className="text-xs text-slate-500">Deactivated {employee.deactivated_at}</p>;
  }

  const submitDeactivate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await deactivateEmployee(employee.employee_id, lastWorkingDay);
      setMode(null);
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitReassign = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await reassignManager(employee.employee_id, newManagerId, transferPending);
      setMode(null);
      onChange();
    } catch (err) {
      setError(err.message); // e.g. circular hierarchy refusal
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'deactivate') {
    return (
      <form onSubmit={submitDeactivate} className="w-full p-3 bg-status-rejected/5 border border-status-rejected/20 rounded-xl flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">Last working day:</span>
        <input type="date" className="glass-input !py-1.5 !text-xs w-36" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} required />
        <PrimaryButton type="submit" disabled={saving} className="!px-3 !py-1.5">{saving ? 'Saving…' : 'Confirm deactivation'}</PrimaryButton>
        <GhostButton type="button" onClick={() => setMode(null)} className="!px-3 !py-1.5">Cancel</GhostButton>
        {error && <p className="w-full text-status-rejected">{error}</p>}
      </form>
    );
  }

  if (mode === 'reassign') {
    return (
      <form onSubmit={submitReassign} className="w-full p-3 bg-white/[0.03] rounded-xl flex flex-wrap items-center gap-2 text-xs">
        <select className="glass-input !py-1.5 !text-xs w-40" value={newManagerId} onChange={(e) => setNewManagerId(e.target.value)} required>
          <option value="">New manager…</option>
          {allEmployees.filter((e) => e.employee_id !== employee.employee_id).map((e) => (
            <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-slate-400">
          <input type="checkbox" checked={transferPending} onChange={(e) => setTransferPending(e.target.checked)} className="rounded border-white/20 bg-white/5" />
          Transfer pending requests too
        </label>
        <PrimaryButton type="submit" disabled={saving} className="!px-3 !py-1.5">{saving ? 'Saving…' : 'Confirm'}</PrimaryButton>
        <GhostButton type="button" onClick={() => setMode(null)} className="!px-3 !py-1.5">Cancel</GhostButton>
        {error && <p className="w-full text-status-rejected">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <GhostButton onClick={() => setMode('reassign')} className="!px-2.5 !py-1.5 text-xs">
        <Repeat className="w-3.5 h-3.5" /> Reassign manager
      </GhostButton>
      <GhostButton onClick={() => setMode('deactivate')} className="!px-2.5 !py-1.5 text-xs !text-status-rejected">
        <UserX className="w-3.5 h-3.5" /> Deactivate
      </GhostButton>
    </div>
  );
}
