import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getEmployeeRoles, assignEmployeeRole, revokeEmployeeRole } from '../../api/employees';

const ASSIGNABLE_ROLES = ['MANAGER', 'HR_ADMIN'];

export default function RoleAssignment({ employeeId }) {
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => getEmployeeRoles(employeeId).then((res) => { setRoles(res.data); setError(null); }).catch((err) => setError(err.message));
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
    <div className="flex flex-wrap items-center gap-1.5">
      <ShieldCheck className="w-3.5 h-3.5 muted shrink-0" />
      {ASSIGNABLE_ROLES.map((roleCode) => (
        <button key={roleCode} onClick={() => toggle(roleCode)} disabled={saving}
          className={`pill ${roles.includes(roleCode) ? 'pill--accent' : 'pill--muted'}`}>
          {roleCode === 'HR_ADMIN' ? 'HR/Admin' : 'Manager'}
        </button>
      ))}
      {error && <p className="w-full error-msg">{error}</p>}
    </div>
  );
}
