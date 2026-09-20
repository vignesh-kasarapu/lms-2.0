import { useEffect, useState } from 'react';
import { UserPlus, Upload, Search, Users, CheckCircle2, AlertCircle, Plus, Pencil } from 'lucide-react';
import { listEmployees, createEmployee, bulkImportEmployees } from '../../api/employees';
import { listManagementLevels, listRegions, createRegion } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import ResponsiveList from '../common/ResponsiveList';
import EmptyState from '../common/EmptyState';
import { PrimaryButton, GhostButton } from '../common/GlassButton';
import StandingWatcherControl from '../common/StandingWatcherControl';
import EmployeeLifecycleActions from './EmployeeLifecycleActions';
import RoleAssignment from './RoleAssignment';
import EditEmployeeModal from './EditEmployeeModal';
import { celebrate } from '../../utils/celebrate';

const empty = {
  fullName: '', workEmail: '', employeeCode: '', dateOfJoining: '', designation: '', departmentName: '',
  roleCode: 'EMPLOYEE', managementLevelId: '', reportingManagerId: '',
  gender: '', maritalStatus: '', regionId: '',
};

export default function EmployeeAdmin() {
  const [employees, setEmployees] = useState([]);
  const [managementLevels, setManagementLevels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [addingRegion, setAddingRegion] = useState(false);
  const [newRegion, setNewRegion] = useState({ code: '', name: '' });
  const [savingRegion, setSavingRegion] = useState(false);
  const [regionError, setRegionError] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);

  const load = () => Promise.all([listEmployees(), listManagementLevels(), listRegions()]).then(([employeeRes, levelRes, regionRes]) => {
    setEmployees(employeeRes.data);
    setManagementLevels(levelRes.data);
    setRegions(regionRes.data);
  });
  useEffect(() => {
    load();
  }, []);

  const submitNewRegion = async (e) => {
    e.preventDefault();
    if (!newRegion.code.trim() || !newRegion.name.trim()) return;
    setSavingRegion(true);
    setRegionError(null);
    try {
      const res = await createRegion(newRegion);
      setRegions((r) => [...r, res.data]);
      setForm((f) => ({ ...f, regionId: res.data.region_id }));
      setNewRegion({ code: '', name: '' });
      setAddingRegion(false);
    } catch (err) {
      setRegionError(err.message);
    } finally {
      setSavingRegion(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createEmployee(form);
      setForm(empty);
      celebrate();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await bulkImportEmployees(file);
      setImportResult(res.data);
      if (res.data.committed) load();
    } catch (err) {
      setImportResult({ committed: false, errors: [{ row: '-', employeeCode: '-', errors: [err.message] }] });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const filtered = employees.filter((emp) =>
    emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(search.toLowerCase()) ||
    emp.work_email?.toLowerCase().includes(search.toLowerCase())
  );

  const employeeSummary = (emp) => (
    <button
      type="button"
      onClick={() => setEditingEmployee(emp)}
      className="w-full flex items-center gap-3 group text-left"
      title="Click to edit employee details"
    >
      <div className="avatar shrink-0">{emp.full_name?.slice(0, 2).toUpperCase()}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium flex items-center gap-1.5 truncate">
          {emp.full_name}
          <Pencil className="w-3 h-3 muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </p>
        <p className="small muted truncate">{emp.designation} · <span className="num">{emp.employee_code}</span></p>
        {emp.Department?.department_name && <p className="small muted truncate">{emp.Department.department_name}</p>}
        <span className={`pill mt-1 ${emp.status === 'ACTIVE' ? 'pill--success' : 'pill--muted'}`}>{emp.status}</span>
      </div>
    </button>
  );

  const columns = [
    { key: 'employee', label: 'Employee', render: employeeSummary },
    { key: 'roles', label: 'Roles', render: (emp) => <RoleAssignment employeeId={emp.employee_id} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (emp) => (
        <div className="flex flex-wrap items-center gap-2">
          <StandingWatcherControl employeeId={emp.employee_id} employeeName={emp.full_name} />
          <EmployeeLifecycleActions employee={emp} allEmployees={employees} onChange={load} />
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <GlassCard className="lg:col-span-2">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <UserPlus className="w-4 h-4 text-accent-text" />
          <h3 className="h3">Onboard employee</h3>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="field">
            <label>Full name</label>
            <input className="input" placeholder="e.g. Jane Doe" value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Work email</label>
            <input type="email" className="input" placeholder="jane@company.com" value={form.workEmail}
              onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Emp code</label>
            <input className="input" placeholder="EMP-101" value={form.employeeCode}
              onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Designation</label>
            <input className="input" placeholder="Senior Engineer" value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Date of joining</label>
            <input type="date" className="input" value={form.dateOfJoining}
              onChange={(e) => setForm((f) => ({ ...f, dateOfJoining: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Department</label>
            <input className="input" placeholder="e.g. Engineering" value={form.departmentName}
              onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Assigned role</label>
            <select className="input" value={form.roleCode}
              onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value, managementLevelId: e.target.value === 'EMPLOYEE' ? '' : f.managementLevelId }))} required>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR admin</option>
            </select>
            <p className="hint">Roles can also be granted or revoked later from the directory below.</p>
          </div>
          {form.roleCode !== 'EMPLOYEE' && (
            <div className="field">
              <label>Management level (optional)</label>
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
          <div className="field">
            <label>Reporting manager</label>
            <select className="input" value={form.reportingManagerId}
              onChange={(e) => setForm((f) => ({ ...f, reportingManagerId: e.target.value }))}>
              <option value="">No reporting manager (top level)</option>
              {employees.map((emp) => <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name} ({emp.designation})</option>)}
            </select>
          </div>

          <div className="grid2">
            <div className="field">
              <label>Gender (optional)</label>
              <select className="input" value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="field">
              <label>Marital status (optional)</label>
              <input className="input" placeholder="e.g. Single, Married" value={form.maritalStatus}
                onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))} />
            </div>
          </div>

          <div className="field">
            <label>Region of working</label>
            <div className="flex gap-1.5">
              <select className="input flex-1" value={form.regionId}
                onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}>
                <option value="">No region</option>
                {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
              </select>
              <GhostButton type="button" onClick={() => setAddingRegion((v) => !v)} className="!px-3 shrink-0" title="Add a new region">
                <Plus className="w-4 h-4" />
              </GhostButton>
            </div>
            <p className="hint">Determines which holidays this employee sees and has deducted.</p>
            {addingRegion && (
              <div className="mt-1.5">
                <div className="flex gap-1.5">
                  <input className="input text-xs w-20" style={{ minHeight: 36 }} placeholder="Code" value={newRegion.code}
                    onChange={(e) => setNewRegion((r) => ({ ...r, code: e.target.value.toUpperCase() }))} />
                  <input className="input text-xs flex-1" style={{ minHeight: 36 }} placeholder="Region name" value={newRegion.name}
                    onChange={(e) => setNewRegion((r) => ({ ...r, name: e.target.value }))} />
                  <button type="button" onClick={submitNewRegion} disabled={savingRegion} className="btn btn--secondary btn--sm shrink-0">
                    {savingRegion ? 'Adding…' : 'Add'}
                  </button>
                </div>
                {regionError && <p className="error-msg mt-1">{regionError}</p>}
              </div>
            )}
          </div>

          {error && <p className="error-msg">{error}</p>}
          <PrimaryButton type="submit" disabled={saving} className="w-full mt-2">
            {saving ? 'Creating record…' : 'Create employee profile'}
          </PrimaryButton>
        </form>

        <div className="mt-5 pt-4 border-t border-border">
          <label className="btn btn--ghost w-full justify-center cursor-pointer">
            <Upload className="w-4 h-4" />
            {importing ? 'Processing CSV…' : 'Bulk import employees (CSV)'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <p className="hint mt-2">
            Requires columns: fullName, workEmail, employeeCode, dateOfJoining, designation.
          </p>

          {importResult && (
            importResult.committed ? (
              <div className="alert alert--success mt-2" role="status">
                <CheckCircle2 />
                <p>Imported {importResult.importedCount} employee(s) successfully.</p>
              </div>
            ) : (
              <div className="alert alert--danger mt-2" role="alert">
                <AlertCircle />
                <div className="space-y-1">
                  <p><b>Import rejected:</b></p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="small">Row {e.row} ({e.employeeCode}): {e.errors.join('; ')}</p>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-text" />
            <h3 className="h3">Employee directory</h3>
            <span className="pill pill--accent">{filtered.length} total</span>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 muted" />
            <input
              type="text"
              placeholder="Search by name, code, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-xs"
              style={{ minHeight: 36, paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        <ResponsiveList
          columns={columns}
          rows={filtered}
          rowKey={(emp) => emp.employee_id}
          empty={<EmptyState icon={Users} title="No employees found" description="No employees match your search criteria." />}
          renderCard={(emp) => (
            <>
              {employeeSummary(emp)}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 border-t border-border">
                <RoleAssignment employeeId={emp.employee_id} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <StandingWatcherControl employeeId={emp.employee_id} employeeName={emp.full_name} />
                <EmployeeLifecycleActions employee={emp} allEmployees={employees} onChange={load} />
              </div>
            </>
          )}
        />
      </GlassCard>

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          managementLevels={managementLevels}
          regions={regions}
          onClose={() => setEditingEmployee(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
