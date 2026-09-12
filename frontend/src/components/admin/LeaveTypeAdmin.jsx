import { useEffect, useState } from 'react';
import { ListPlus, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { listLeaveTypes, createLeaveType, updateLeaveTypePolicy } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import Modal from '../common/Modal';
import { PrimaryButton } from '../common/GlassButton';

const empty = { typeCode: '', typeName: '', annualEntitlement: '', accrualMethod: 'MONTHLY', carriesForward: false, carryForwardCap: '', permitsHalfDay: true, permitsAttachments: false, isSickLeave: false };

export default function LeaveTypeAdmin() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = () => listLeaveTypes().then((res) => setTypes(res.data));
  useEffect(() => { load(); }, []);

  const quickToggle = async (t, e) => {
    e.stopPropagation();
    setTogglingId(t.leave_type_id);
    try {
      await updateLeaveTypePolicy(t.leave_type_id, { isSelectableByEmployee: !t.is_selectable_by_employee });
      await load();
    } finally {
      setTogglingId(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLeaveType(form);
      setForm(empty);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Create Form */}
      <GlassCard className="lg:col-span-2 !p-6 border-indigo-500/20">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ListPlus className="w-4 h-4" />
          </div>
          <h3 className="font-display font-extrabold text-slate-100 text-base">New Leave Category</h3>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Category Code</label>
            <input className="glass-input font-mono font-bold" placeholder="e.g. PATERNITY" value={form.typeCode}
              onChange={(e) => setForm((f) => ({ ...f, typeCode: e.target.value.toUpperCase() }))} required />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Display Name</label>
            <input className="glass-input" placeholder="Paternity Leave" value={form.typeName}
              onChange={(e) => setForm((f) => ({ ...f, typeName: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Annual Entitlement (Days)</label>
            <input type="number" step="0.5" className="glass-input font-bold" placeholder="12" value={form.annualEntitlement}
              onChange={(e) => setForm((f) => ({ ...f, annualEntitlement: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Accrual Method</label>
            <select className="glass-input text-slate-200 bg-void-900" value={form.accrualMethod}
              onChange={(e) => setForm((f) => ({ ...f, accrualMethod: e.target.value }))}>
              <option value="MONTHLY">Monthly Accrual</option>
              <option value="QUARTERLY">Quarterly Accrual</option>
              <option value="ANNUAL">Annual Accrual (Frontload)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Toggle label="Half-day Allowed" checked={form.permitsHalfDay} onChange={(v) => setForm((f) => ({ ...f, permitsHalfDay: v }))} />
            <Toggle label="Attachment Req." checked={form.permitsAttachments} onChange={(v) => setForm((f) => ({ ...f, permitsAttachments: v }))} />
            <Toggle label="Sick Rules" checked={form.isSickLeave} onChange={(v) => setForm((f) => ({ ...f, isSickLeave: v }))} />
            <Toggle label="Carry-forward" checked={form.carriesForward} onChange={(v) => setForm((f) => ({ ...f, carriesForward: v }))} />
          </div>

          {form.carriesForward && (
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Carry-Forward Cap (Days)</label>
              <input type="number" step="0.5" className="glass-input font-bold" placeholder="5" value={form.carryForwardCap}
                onChange={(e) => setForm((f) => ({ ...f, carryForwardCap: e.target.value }))} />
            </div>
          )}

          <button type="submit" disabled={saving} className="admin-btn w-full mt-3 !py-3">
            {saving ? 'Creating Policy…' : 'Create Leave Type'}
          </button>
        </form>
      </GlassCard>

      {/* List Display */}
      <GlassCard className="lg:col-span-3 !p-6">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
          <h3 className="font-display font-extrabold text-slate-100 text-base">Active Leave Policies</h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {types.length} policies configured
          </span>
        </div>

        <div className="divide-y divide-white/10">
          {types.map((t) => (
            <div
              key={t.leave_type_id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(t)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(t); } }}
              className="w-full py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.03] transition-colors rounded-xl px-2 -mx-2 cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-extrabold text-slate-100">{t.type_name}</p>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-bold">
                    {t.type_code}
                  </span>
                  {t.is_system && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      System Default
                    </span>
                  )}
                  {!t.is_selectable_by_employee && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-status-rejected/10 text-status-rejected border border-status-rejected/30">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  <strong className="text-indigo-400">{t.LeavePolicy?.annual_entitlement || 0} days/yr</strong> · {t.LeaveAccrualConfig?.accrual_method?.toLowerCase()} accrual
                  {t.LeavePolicy?.carries_forward && ` · Carries forward (Cap: ${t.LeavePolicy.carry_forward_cap} days)`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.is_sick_leave && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-status-info/10 text-status-info border border-status-info/30">
                    Medical Rules
                  </span>
                )}
                {t.LeavePolicy?.permits_attachments && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    Proof Required
                  </span>
                )}
                {!t.is_system && (
                  <button
                    type="button"
                    onClick={(e) => quickToggle(t, e)}
                    disabled={togglingId === t.leave_type_id}
                    title={t.is_selectable_by_employee ? 'Disable this leave type' : 'Enable this leave type'}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors shrink-0 disabled:opacity-50 ${
                      t.is_selectable_by_employee
                        ? 'text-status-rejected border-status-rejected/30 bg-status-rejected/10 hover:bg-status-rejected/20'
                        : 'text-status-approved border-status-approved/30 bg-status-approved/10 hover:bg-status-approved/20'
                    }`}
                  >
                    {togglingId === t.leave_type_id ? '…' : t.is_selectable_by_employee ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {editing && (
        <LeaveTypeEditModal
          leaveType={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function LeaveTypeEditModal({ leaveType, onClose, onSaved }) {
  const [values, setValues] = useState({
    annualEntitlement: leaveType.LeavePolicy?.annual_entitlement ?? '',
    carriesForward: !!leaveType.LeavePolicy?.carries_forward,
    carryForwardCap: leaveType.LeavePolicy?.carry_forward_cap ?? '',
    isSelectableByEmployee: leaveType.is_selectable_by_employee,
  });
  const [saving, setSaving] = useState(false);
  const isLocked = leaveType.is_system;

  const save = async () => {
    setSaving(true);
    try {
      await updateLeaveTypePolicy(leaveType.leave_type_id, values);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={leaveType.type_name} maxWidth="max-w-md">
      {isLocked ? (
        <p className="text-sm text-slate-400">The system Loss-of-Pay type cannot be edited or disabled.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Annual Entitlement (Days)</label>
            <input type="number" step="0.5" className="glass-input font-bold" value={values.annualEntitlement}
              onChange={(e) => setValues((v) => ({ ...v, annualEntitlement: e.target.value }))} />
          </div>
          <Toggle label="Carry-forward" checked={values.carriesForward} onChange={(v) => setValues((s) => ({ ...s, carriesForward: v }))} />
          {values.carriesForward && (
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">Carry-Forward Cap (Days)</label>
              <input type="number" step="0.5" className="glass-input font-bold" value={values.carryForwardCap}
                onChange={(e) => setValues((v) => ({ ...v, carryForwardCap: e.target.value }))} />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-sm font-bold text-slate-100">Employees can apply for this leave type</p>
              <p className="text-xs text-slate-500 mt-0.5">Disabling removes it from the Apply Leave picker for everyone.</p>
            </div>
            <button
              type="button"
              onClick={() => setValues((v) => ({ ...v, isSelectableByEmployee: !v.isSelectableByEmployee }))}
              className={`relative w-12 h-6 rounded-full transition-all shrink-0 border-2 ${
                values.isSelectableByEmployee ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-600'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${values.isSelectableByEmployee ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <PrimaryButton onClick={save} disabled={saving} className="w-full mt-2">
            {saving ? 'Saving…' : 'Save changes'}
          </PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer border transition-all ${
      checked
        ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
        : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200'
    }`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500" />
      {label}
    </label>
  );
}
