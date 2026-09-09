import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getEmployeeRoles, assignEmployeeRole, revokeEmployeeRole } from '../../api/employees';

const ASSIGNABLE_ROLES = ['MANAGER', 'HR_ADMIN'];

export default function RoleAssignment({ employeeId }) {
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => getEmployeeRoles(employeeId).then((res) => { setRoles(res.data); setError(null); });
  useEffect(() => { load(); }, [employeeId]);

  const toggle = async (roleCode) => {
    setSaving(true);
    setError(null);
    try {
      if (roles.includes(roleCode)) {
        await revokeEmployeeRole(employeeId, roleCode);
      } else {
        await assignEmployeeRole(employeeId, roleCode);
      }
      load();
    } catch (err) {
      setError(err.message); // e.g. "last HR/Admin cannot be removed"
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
      {ASSIGNABLE_ROLES.map((roleCode) => (
        <button key={roleCode} onClick={() => toggle(roleCode)} disabled={saving}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            roles.includes(roleCode)
              ? 'bg-aurora-violet/15 border-aurora-violet/50 text-white'
              : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300'
          }`}>
          {roleCode === 'HR_ADMIN' ? 'HR/Admin' : 'Manager'}
        </button>
      ))}
      {error && <p className="w-full text-[11px] text-status-rejected">{error}</p>}
    </div>
  );
}
