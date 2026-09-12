import { useEffect, useState } from 'react';
import { CalendarPlus, TriangleAlert, Trash2 } from 'lucide-react';
import { listHolidays, addHoliday, removeHoliday } from '../../api/admin';
import { listRegions } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import { PrimaryButton } from '../common/GlassButton';

export default function HolidayAdmin({ leaveYearId }) {
  const [holidays, setHolidays] = useState([]);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({ date: '', name: '', regionId: '' });
  const [warning, setWarning] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => leaveYearId && listHolidays(leaveYearId).then((res) => setHolidays(res.data));
  useEffect(() => { load(); }, [leaveYearId]);
  useEffect(() => { listRegions().then((res) => setRegions(res.data)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setWarning(null);
    try {
      const res = await addHoliday({ ...form, leaveYearId });
      if (res.data.affectedRequestIds?.length) {
        setWarning(`This date falls inside ${res.data.affectedRequestIds.length} already-approved leave request(s) — their deduction was computed under the prior calendar.`);
      }
      setForm({ date: '', name: '', regionId: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <h3 className="font-display font-bold text-slate-100 mb-4 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-aurora-violet" /> Add holiday
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <input type="date" className="glass-input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          <input className="glass-input" placeholder="Holiday name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Region</label>
            <select className="glass-input text-slate-200 bg-void-900" value={form.regionId}
              onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}>
              <option value="">All regions (org-wide)</option>
              {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
            </select>
          </div>
          {warning && (
            <div className="flex items-start gap-2 text-xs text-status-advance bg-status-advance/10 border border-status-advance/25 rounded-xl px-3 py-2.5">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" /> {warning}
            </div>
          )}
          <PrimaryButton type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Add holiday'}</PrimaryButton>
        </form>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h3 className="font-display font-bold text-slate-100 mb-4">Current & next leave year</h3>
        <div className="divide-y divide-white/5">
          {holidays.map((h) => (
            <div key={h.holiday_id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-100 flex items-center gap-2">
                  {h.holiday_name}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                    h.Region ? 'text-aurora-cyan border-aurora-cyan/30 bg-aurora-cyan/10' : 'text-slate-400 border-white/10 bg-white/5'
                  }`}>
                    {h.Region ? h.Region.region_name : 'All regions'}
                  </span>
                </p>
                <p className="text-xs text-slate-500">{h.holiday_date}</p>
              </div>
              <button onClick={() => removeHoliday(h.holiday_id).then(load)} className="text-slate-500 hover:text-status-rejected transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
