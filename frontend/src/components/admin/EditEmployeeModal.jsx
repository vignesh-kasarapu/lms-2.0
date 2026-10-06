import { useState } from 'react';
import Modal from '../common/Modal';
import { PrimaryButton, GhostButton } from '../common/GlassButton';
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
    workEmail: employee.work_email || '',
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
        <div className="field">
          <label>Full name</label>
          <input className="input" value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
        </div>
        <div className="field">
          <label>Designation</label>
          <input className="input" value={form.designation}
            onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} required />
        </div>
        <div className="field">
          <label>Department</label>
          <input className="input" value={form.departmentName}
            onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))} required />
        </div>
        <div className="field">
          <label>Work email</label>
          <input type="email" className="input" value={form.workEmail}
            onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))} required />
        </div>
        {showManagementLevel && (
          <div className="field">
            <label>Management level</label>
            <select className="input" value={form.managementLevelId}
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
        <div className="grid2">
          <div className="field">
            <label>Gender</label>
            <select className="input" value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="field">
            <label>Marital status</label>
            <input className="input" placeholder="e.g. Single, Married" value={form.maritalStatus}
              onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>Region of working</label>
          <select className="input" value={form.regionId}
            onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}>
            <option value="">No region</option>
            {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
          </select>
        </div>

        {error && <p className="error-msg">{error}</p>}
        <div className="flex gap-2 pt-1">
          <GhostButton type="button" onClick={onClose} className="flex-1 justify-center">Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save changes'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
