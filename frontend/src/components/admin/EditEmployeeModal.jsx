import { useState } from 'react';
import Modal from '../common/Modal';
import { updateEmployeeDetails } from '../../api/employees';

export default function EditEmployeeModal({ employee, managementLevels, regions, onClose, onSaved }) {
  const showManagementLevel = (employee.Roles || []).some((r) => r.role_code === 'MANAGER' || r.role_code === 'HR_ADMIN');
  const [form, setForm] = useState({
    fullName: employee.full_name || '',
    designation: employee.designation || '',
    departmentName: employee.Department?.department_name || '',
    managementLevelId: employee.management_level_id || '',
    gender: employee.gender || '',
    maritalStatus: employee.marital_status || '',
    regionId: employee.region_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateEmployeeDetails(employee.employee_id, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${employee.full_name}`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Full Name</label>
          <input className="glass-input" value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Designation</label>
          <input className="glass-input" value={form.designation}
            onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} required />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Department</label>
          <input className="glass-input" value={form.departmentName}
            onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))} required />
        </div>
        {showManagementLevel && (
          <div>
            <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Management Level</label>
            <select className="glass-input text-ink-200 bg-void-900" value={form.managementLevelId}
              onChange={(e) => setForm((f) => ({ ...f, managementLevelId: e.target.value }))}>
              <option value="">No management level</option>
              {managementLevels.map((level) => (
                <option key={level.management_level_id} value={level.management_level_id}>
                  {level.level_code} — {level.level_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Gender</label>
            <select className="glass-input text-ink-200 bg-void-900" value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Marital Status</label>
            <input className="glass-input" placeholder="e.g. Single, Married" value={form.maritalStatus}
              onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Region of Working</label>
          <select className="glass-input text-ink-200 bg-void-900" value={form.regionId}
            onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}>
            <option value="">No region</option>
            {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
          </select>
        </div>

        {error && <p className="text-xs font-semibold text-status-rejected bg-status-rejected/10 p-2 rounded-lg">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="ghost-btn flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={saving} className="admin-btn flex-1">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}
