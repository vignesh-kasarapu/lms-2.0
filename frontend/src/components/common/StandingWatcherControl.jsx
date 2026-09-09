import { useEffect, useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { listStandingWatchers, addStandingWatcher, getWatchableEmployees } from '../../api/employees';
import { GhostButton, PrimaryButton } from './GlassButton';

export default function StandingWatcherControl({ employeeId, employeeName }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ watcherEmployeeId: '', fromDate: '', toDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => listStandingWatchers(employeeId).then((res) => setCurrent(res.data));

  useEffect(() => {
    if (open) {
      load();
      getWatchableEmployees().then((res) => setCandidates(res.data.filter((c) => String(c.employee_id) !== String(employeeId))));
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addStandingWatcher(employeeId, form);
      setForm({ watcherEmployeeId: '', fromDate: '', toDate: '' });
      load();
    } catch (err) {
      setError(err.message); // e.g. "not in your hierarchy" refusal (LMS-061 scope check)
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <GhostButton onClick={() => setOpen(true)} className="!px-2.5 !py-1.5 text-xs">
        <Eye className="w-3.5 h-3.5" /> Standing watcher
      </GhostButton>
    );
  }

  return (
    <div className="mt-2 p-3 bg-white/[0.03] rounded-xl space-y-2 text-xs">
      <p className="text-slate-400">Standing watchers on {employeeName}</p>
      {current.map((s) => (
        <div key={s.standing_watcher_id} className="text-slate-300 bg-white/[0.04] rounded-lg px-2.5 py-1.5">
          {s.watcherEmployee?.full_name} · {s.from_date} → {s.to_date}
        </div>
      ))}
      <form onSubmit={submit} className="flex flex-wrap gap-1.5 items-center pt-1">
        <select className="glass-input !py-1.5 !text-xs w-32" value={form.watcherEmployeeId}
          onChange={(e) => setForm((f) => ({ ...f, watcherEmployeeId: e.target.value }))} required>
          <option value="">Watcher…</option>
          {candidates.map((c) => <option key={c.employee_id} value={c.employee_id}>{c.full_name}</option>)}
        </select>
        <input type="date" className="glass-input !py-1.5 !text-xs w-32" value={form.fromDate}
          onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))} required />
        <input type="date" className="glass-input !py-1.5 !text-xs w-32" value={form.toDate}
          onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))} required />
        <PrimaryButton type="submit" disabled={saving} className="!px-2.5 !py-1.5">
          <Plus className="w-3.5 h-3.5" />
        </PrimaryButton>
      </form>
      {error && <p className="text-status-rejected">{error}</p>}
    </div>
  );
}
