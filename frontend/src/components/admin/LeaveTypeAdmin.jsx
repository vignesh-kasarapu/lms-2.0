import { useEffect, useState } from 'react';
import { ListPlus, Users } from 'lucide-react';
import { listLeaveTypes, createLeaveType, updateLeaveTypePolicy } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import { PrimaryButton } from '../common/GlassButton';

const empty = { typeCode: '', typeName: '', annualEntitlement: '', accrualMethod: 'MONTHLY', carriesForward: false, carryForwardCap: '', permitsHalfDay: true, permitsAttachments: false, isSickLeave: false };

export default function LeaveTypeAdmin() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => listLeaveTypes().then((res) => setTypes(res.data)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const quickToggle = async (t, e) => {
    e.stopPropagation();
    setTogglingId(t.leave_type_id);
    setError(null);
    try {
      await updateLeaveTypePolicy(t.leave_type_id, { isSelectableByEmployee: !t.is_selectable_by_employee });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createLeaveType(form);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Create Form */}
      <GlassCard className="lg:col-span-2">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <ListPlus className="w-4 h-4 text-accent-text" />
          <h3 className="h3">New leave category</h3>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="field">
            <label>Category code</label>
            <input className="input font-mono" placeholder="e.g. PATERNITY" value={form.typeCode}
              onChange={(e) => setForm((f) => ({ ...f, typeCode: e.target.value.toUpperCase() }))} required />
          </div>
          <div className="field">
            <label>Display name</label>
            <input className="input" placeholder="Paternity Leave" value={form.typeName}
              onChange={(e) => setForm((f) => ({ ...f, typeName: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Annual entitlement (days)</label>
            <input type="number" step="0.5" className="input" placeholder="12" value={form.annualEntitlement}
              onChange={(e) => setForm((f) => ({ ...f, annualEntitlement: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Accrual method</label>
            <select className="input" value={form.accrualMethod}
              onChange={(e) => setForm((f) => ({ ...f, accrualMethod: e.target.value }))}>
              <option value="MONTHLY">Monthly accrual</option>
              <option value="QUARTERLY">Quarterly accrual</option>
              <option value="ANNUAL">Annual accrual (frontload)</option>
            </select>
          </div>

          <div className="field">
            <label>Options</label>
            <div className="choices">
              <label className="chk"><input type="checkbox" checked={form.permitsHalfDay} onChange={(e) => setForm((f) => ({ ...f, permitsHalfDay: e.target.checked }))} /> Half-day allowed</label>
              <label className="chk"><input type="checkbox" checked={form.permitsAttachments} onChange={(e) => setForm((f) => ({ ...f, permitsAttachments: e.target.checked }))} /> Attachment required</label>
              <label className="chk"><input type="checkbox" checked={form.isSickLeave} onChange={(e) => setForm((f) => ({ ...f, isSickLeave: e.target.checked }))} /> Sick rules</label>
              <label className="chk"><input type="checkbox" checked={form.carriesForward} onChange={(e) => setForm((f) => ({ ...f, carriesForward: e.target.checked }))} /> Carry-forward</label>
            </div>
          </div>

          {form.carriesForward && (
            <div className="field">
              <label>Carry-forward cap (days)</label>
              <input type="number" step="0.5" className="input" placeholder="5" value={form.carryForwardCap}
                onChange={(e) => setForm((f) => ({ ...f, carryForwardCap: e.target.value }))} />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}
          <PrimaryButton type="submit" disabled={saving} className="w-full mt-3">
            {saving ? 'Creating policy…' : 'Create leave type'}
          </PrimaryButton>
        </form>
      </GlassCard>

      {/* List Display */}
      <GlassCard className="lg:col-span-3">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
          <h3 className="h3">Active leave policies</h3>
          <span className="pill pill--accent">{types.length} policies configured</span>
        </div>

        {!types.length ? (
          <EmptyState icon={Users} title="No leave types yet" description="Create a leave category to get started." />
        ) : (
          <div className="divide-y divide-border">
            {types.map((t) => (
              <div
                key={t.leave_type_id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(t)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(t); } }}
                className="w-full py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{t.type_name}</p>
                    <span className="pill pill--muted font-mono">{t.type_code}</span>
                    {t.is_system && <span className="pill pill--warning">System default</span>}
                    {!t.is_selectable_by_employee && <span className="pill pill--danger">Disabled</span>}
                  </div>
                  <p className="small muted mt-1">
                    <strong className="text-accent-text">{t.LeavePolicy?.annual_entitlement || 0} days/yr</strong> · {t.LeaveAccrualConfig?.accrual_method?.toLowerCase()} accrual
                    {t.LeavePolicy?.carries_forward && ` · Carries forward (cap: ${t.LeavePolicy.carry_forward_cap} days)`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.is_sick_leave && <span className="pill pill--accent">Medical rules</span>}
                  {t.LeavePolicy?.permits_attachments && <span className="pill pill--muted">Proof required</span>}
                  {!t.is_system && (
                    <button
                      type="button"
                      onClick={(e) => quickToggle(t, e)}
                      disabled={togglingId === t.leave_type_id}
                      title={t.is_selectable_by_employee ? 'Disable this leave type' : 'Enable this leave type'}
                      className={`pill shrink-0 disabled:opacity-50 ${t.is_selectable_by_employee ? 'pill--danger' : 'pill--success'}`}
                    >
                      {togglingId === t.leave_type_id ? '…' : t.is_selectable_by_employee ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [error, setError] = useState(null);
  const isLocked = leaveType.is_system;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateLeaveTypePolicy(leaveType.leave_type_id, values);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={leaveType.type_name} maxWidth="max-w-md">
      {isLocked ? (
        <p className="muted">The system loss-of-pay type cannot be edited or disabled.</p>
      ) : (
        <div className="space-y-4">
          <div className="field">
            <label>Annual entitlement (days)</label>
            <input type="number" step="0.5" className="input" value={values.annualEntitlement}
              onChange={(e) => setValues((v) => ({ ...v, annualEntitlement: e.target.value }))} />
          </div>
          <label className="chk">
            <input type="checkbox" checked={values.carriesForward} onChange={(e) => setValues((s) => ({ ...s, carriesForward: e.target.checked }))} />
            Carry-forward
          </label>
          {values.carriesForward && (
            <div className="field">
              <label>Carry-forward cap (days)</label>
              <input type="number" step="0.5" className="input" value={values.carryForwardCap}
                onChange={(e) => setValues((v) => ({ ...v, carryForwardCap: e.target.value }))} />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-sm font-medium">Employees can apply for this leave type</p>
              <p className="small muted mt-0.5">Disabling removes it from the Apply Leave picker for everyone.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.isSelectableByEmployee}
              aria-label="Employees can apply for this leave type"
              onClick={() => setValues((v) => ({ ...v, isSelectableByEmployee: !v.isSelectableByEmployee }))}
              className="switch shrink-0"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          <PrimaryButton onClick={save} disabled={saving} className="w-full mt-2">
            {saving ? 'Saving…' : 'Save changes'}
          </PrimaryButton>
        </div>
      )}
    </Modal>
  );
}
