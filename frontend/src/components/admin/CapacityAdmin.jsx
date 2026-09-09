import { useEffect, useState } from 'react';
import { Ban, Users2 } from 'lucide-react';
import { listBlackoutPeriods, createBlackoutPeriod, deactivateBlackoutPeriod, createTeamCapacityLimit } from '../../api/admin';
import { listEmployees } from '../../api/employees';
import GlassCard from '../common/GlassCard';
import { PrimaryButton, GhostButton } from '../common/GlassButton';

export default function CapacityAdmin() {
  const [periods, setPeriods] = useState([]);
  const [managers, setManagers] = useState([]);
  const [periodForm, setPeriodForm] = useState({ name: '', startDate: '', endDate: '' });
  const [capacityForm, setCapacityForm] = useState({ managerEmployeeId: '', maxConcurrentOnLeave: '', effectiveFrom: '' });
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [savingCapacity, setSavingCapacity] = useState(false);

  const load = () => {
    listBlackoutPeriods().then((res) => setPeriods(res.data));
    listEmployees().then((res) => setManagers(res.data));
  };
  useEffect(() => { load(); }, []);

  const submitPeriod = async (e) => {
    e.preventDefault();
    setSavingPeriod(true);
    try {
      await createBlackoutPeriod(periodForm);
      setPeriodForm({ name: '', startDate: '', endDate: '' });
      load();
    } finally {
      setSavingPeriod(false);
    }
  };

  const submitCapacity = async (e) => {
    e.preventDefault();
    setSavingCapacity(true);
    try {
      await createTeamCapacityLimit(capacityForm);
      setCapacityForm({ managerEmployeeId: '', maxConcurrentOnLeave: '', effectiveFrom: '' });
    } finally {
      setSavingCapacity(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GlassCard>
        <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Ban className="w-4 h-4 text-status-rejected" /> Blackout periods
        </h3>
        <p className="text-xs text-slate-500 mb-4">Leave cannot be applied for during these windows — this blocks submission, not just a warning.</p>
        <form onSubmit={submitPeriod} className="space-y-3 pb-4 mb-4 border-b border-white/5">
          <input className="glass-input" placeholder="Name (e.g. Year-end freeze)" value={periodForm.name}
            onChange={(e) => setPeriodForm((f) => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="glass-input" value={periodForm.startDate} onChange={(e) => setPeriodForm((f) => ({ ...f, startDate: e.target.value }))} required />
            <input type="date" className="glass-input" value={periodForm.endDate} onChange={(e) => setPeriodForm((f) => ({ ...f, endDate: e.target.value }))} required />
          </div>
          <PrimaryButton type="submit" disabled={savingPeriod} className="w-full">{savingPeriod ? 'Saving…' : 'Create blackout period'}</PrimaryButton>
        </form>
        <div className="space-y-2">
          {periods.map((p) => (
            <div key={p.blackout_id} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-lg px-3 py-2">
              <div>
                <p className="text-slate-100">{p.name}</p>
                <p className="text-xs text-slate-500">{p.start_date} → {p.end_date}</p>
              </div>
              <GhostButton onClick={() => deactivateBlackoutPeriod(p.blackout_id).then(load)} className="!px-2.5 !py-1.5 text-xs">Remove</GhostButton>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Users2 className="w-4 h-4 text-aurora-violet" /> Team capacity limits
        </h3>
        <p className="text-xs text-slate-500 mb-4">Cap how many of a manager's direct reports may be on leave at once.</p>
        <form onSubmit={submitCapacity} className="space-y-3">
          <select className="glass-input" value={capacityForm.managerEmployeeId} onChange={(e) => setCapacityForm((f) => ({ ...f, managerEmployeeId: e.target.value }))} required>
            <option value="">Manager…</option>
            {managers.map((m) => <option key={m.employee_id} value={m.employee_id}>{m.full_name}</option>)}
          </select>
          <input type="number" min="1" className="glass-input" placeholder="Max concurrent on leave" value={capacityForm.maxConcurrentOnLeave}
            onChange={(e) => setCapacityForm((f) => ({ ...f, maxConcurrentOnLeave: e.target.value }))} required />
          <input type="date" className="glass-input" value={capacityForm.effectiveFrom} onChange={(e) => setCapacityForm((f) => ({ ...f, effectiveFrom: e.target.value }))} required />
          <PrimaryButton type="submit" disabled={savingCapacity} className="w-full">{savingCapacity ? 'Saving…' : 'Set limit'}</PrimaryButton>
        </form>
      </GlassCard>
    </div>
  );
}
