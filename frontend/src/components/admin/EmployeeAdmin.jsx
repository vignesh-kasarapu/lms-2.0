import { useEffect, useState } from 'react';
import { UserPlus, Upload, Search, Users, CheckCircle2, AlertCircle, Plus, Pencil } from 'lucide-react';
import { listEmployees, createEmployee, bulkImportEmployees } from '../../api/employees';
import { listManagementLevels, listRegions, createRegion } from '../../api/admin';
import GlassCard from '../common/GlassCard';
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
    const res = await createRegion(newRegion);
    setRegions((r) => [...r, res.data]);
    setForm((f) => ({ ...f, regionId: res.data.region_id }));
    setNewRegion({ code: '', name: '' });
    setAddingRegion(false);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <GlassCard className="lg:col-span-2 !p-5 border-indigo-500/20">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <h3 className="font-display font-bold text-slate-100 text-base">Onboard Employee</h3>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Full Name</label>
            <input className="glass-input" placeholder="e.g. Jane Doe" value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Work Email</label>
            <input type="email" className="glass-input" placeholder="jane@company.com" value={form.workEmail}
              onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Emp Code</label>
            <input className="glass-input" placeholder="EMP-101" value={form.employeeCode}
              onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Designation</label>
            <input className="glass-input" placeholder="Senior Engineer" value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Date of Joining</label>
            <input type="date" className="glass-input" value={form.dateOfJoining}
              onChange={(e) => setForm((f) => ({ ...f, dateOfJoining: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Department</label>
            <input className="glass-input" placeholder="e.g. Engineering" value={form.departmentName}
              onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Assigned Role</label>
            <select className="glass-input text-slate-200 bg-void-900" value={form.roleCode}
              onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value, managementLevelId: e.target.value === 'EMPLOYEE' ? '' : f.managementLevelId }))} required>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR Admin</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Roles can also be granted or revoked later from the directory below.</p>
          </div>
          {form.roleCode !== 'EMPLOYEE' && (
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Management Level (optional)</label>
              <select className="glass-input text-slate-200 bg-void-900" value={form.managementLevelId}
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
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Reporting Manager</label>
            <select className="glass-input text-slate-200 bg-void-900" value={form.reportingManagerId}
              onChange={(e) => setForm((f) => ({ ...f, reportingManagerId: e.target.value }))}>
              <option value="">No reporting manager (Top Level)</option>
              {employees.map((emp) => <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name} ({emp.designation})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Gender (optional)</label>
              <select className="glass-input text-slate-200 bg-void-900" value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Marital Status (optional)</label>
              <input className="glass-input" placeholder="e.g. Single, Married" value={form.maritalStatus}
                onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Region of Working</label>
            <div className="flex gap-1.5">
              <select className="glass-input text-slate-200 bg-void-900 flex-1" value={form.regionId}
                onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}>
                <option value="">No region</option>
                {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
              </select>
              <button type="button" onClick={() => setAddingRegion((v) => !v)}
                className="ghost-btn !px-3 shrink-0" title="Add a new region">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Determines which holidays this employee sees and has deducted.</p>
            {addingRegion && (
              <div className="flex gap-1.5 mt-1.5">
                <input className="glass-input !py-1.5 text-xs w-20" placeholder="Code" value={newRegion.code}
                  onChange={(e) => setNewRegion((r) => ({ ...r, code: e.target.value.toUpperCase() }))} />
                <input className="glass-input !py-1.5 text-xs flex-1" placeholder="Region name" value={newRegion.name}
                  onChange={(e) => setNewRegion((r) => ({ ...r, name: e.target.value }))} />
                <button type="button" onClick={submitNewRegion} className="admin-btn !px-3 !py-1.5 text-xs shrink-0">Add</button>
              </div>
            )}
          </div>

          {error && <p className="text-xs font-semibold text-status-rejected bg-status-rejected/10 p-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={saving} className="admin-btn w-full mt-2">
            {saving ? 'Creating Record…' : 'Create Employee Profile'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10">
          <label className="ghost-btn w-full justify-center text-indigo-300 hover:border-indigo-500/40 cursor-pointer text-xs font-semibold py-2.5">
            <Upload className="w-4 h-4" />
            {importing ? 'Processing CSV…' : 'Bulk Import Employees (CSV)'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <p className="text-[11px] text-slate-400 mt-2">
            Requires columns: fullName, workEmail, employeeCode, dateOfJoining, designation.
          </p>

          {importResult && (
            importResult.committed ? (
              <p className="text-xs font-semibold text-status-approved mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Imported {importResult.importedCount} employee(s) successfully.
              </p>
            ) : (
              <div className="text-xs text-status-rejected mt-2 p-2 rounded-lg bg-status-rejected/10 space-y-1">
                <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Import rejected:</p>
                {importResult.errors.map((e, i) => (
                  <p key={i}>Row {e.row} ({e.employeeCode}): {e.errors.join('; ')}</p>
                ))}
              </div>
            )
          )}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3 !p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-bold text-slate-100 text-base">Employee Directory</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {filtered.length} total
            </span>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input !py-1.5 !pl-9 text-xs"
            />
          </div>
        </div>

        <div className="divide-y divide-white/5 pr-1 max-h-[75vh] overflow-y-auto">
          {!filtered.length ? (
            <p className="text-xs text-slate-500 py-8 text-center">No employees matching search criteria.</p>
          ) : (
            filtered.map((emp) => (
              <div key={emp.employee_id} className="py-3.5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(emp)}
                  className="w-full flex items-center justify-between gap-3 group text-left rounded-lg -mx-1.5 px-1.5 py-1 hover:bg-white/[0.03] transition-colors"
                  title="Click to edit employee details"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0">
                      {emp.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate">
                        {emp.full_name}
                        <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </p>
                      <p className="text-xs text-slate-400 truncate">{emp.designation} · <span className="font-mono text-slate-300">{emp.employee_code}</span></p>
                      {emp.Department?.department_name && (
                        <p className="text-[11px] text-slate-500 truncate">{emp.Department.department_name}</p>
                      )}
                    </div>
                  </div>

                  <span className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    emp.status === 'ACTIVE'
                      ? 'text-status-approved border-status-approved/30 bg-status-approved/10'
                      : 'text-slate-400 border-slate-500/30 bg-slate-500/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-status-approved' : 'bg-slate-500'}`} />
                    {emp.status}
                  </span>
                </button>

                <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <RoleAssignment employeeId={emp.employee_id} />
                  <div className="hidden sm:block w-px h-4 bg-white/10" />
                  <StandingWatcherControl employeeId={emp.employee_id} employeeName={emp.full_name} />
                  <EmployeeLifecycleActions employee={emp} allEmployees={employees} onChange={load} />
                </div>
              </div>
            ))
          )}
        </div>
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
