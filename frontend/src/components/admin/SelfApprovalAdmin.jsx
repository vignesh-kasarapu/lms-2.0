import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { listSelfApprovalGrants, grantSelfApproval, revokeSelfApproval } from '../../api/admin';
import { listEmployees } from '../../api/employees';
import GlassCard from '../common/GlassCard';
import { PrimaryButton, GhostButton } from '../common/GlassButton';

export default function SelfApprovalAdmin() {
  const [grants, setGrants] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: '', effectiveFrom: '', effectiveTo: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    listSelfApprovalGrants().then((res) => setGrants(res.data));
    listEmployees().then((res) => setEmployees(res.data));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await grantSelfApproval(form);
      setForm({ employeeId: '', effectiveFrom: '', effectiveTo: '', notes: '' });
      load();
    } catch (err) {
      setError(err.message); // e.g. "already has an active grant" from the service-layer uniqueness check
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-status-advance" /> Grant self-approval
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Controlled addendum: only applies where the employee has no reporting manager on record.
          One active grant per employee at a time.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <select className="glass-input" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} required>
            <option value="">Select employee</option>
            {employees.map((emp) => <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="glass-input" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} required />
            <input type="date" className="glass-input" placeholder="Open-ended" value={form.effectiveTo} onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))} />
          </div>
          <textarea className="glass-input min-h-[70px] resize-none" placeholder="Notes (why this grant exists)" value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <p className="text-xs text-status-rejected">{error}</p>}
          <PrimaryButton type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Grant permission'}</PrimaryButton>
        </form>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h3 className="font-display font-bold text-slate-100 mb-4">Grants</h3>
        <div className="divide-y divide-white/5">
          {grants.map((g) => (
            <div key={g.self_approval_permission_id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">{g.grantee?.full_name}</p>
                <p className="text-xs text-slate-500">
                  {g.effective_from} → {g.effective_to || 'open-ended'} · granted by {g.grantedBy?.full_name}
                </p>
              </div>
              {g.is_active ? (
                <GhostButton onClick={() => revokeSelfApproval(g.self_approval_permission_id).then(load)} className="!px-3 !py-1.5 text-xs">Revoke</GhostButton>
              ) : (
                <span className="text-xs text-slate-500">Revoked</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
