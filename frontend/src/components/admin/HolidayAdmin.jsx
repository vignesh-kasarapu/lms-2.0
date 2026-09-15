import { useEffect, useState } from 'react';
import { CalendarPlus, TriangleAlert, Trash2, Users } from 'lucide-react';
import { listHolidays, addHoliday, removeHoliday, getOptionalHolidayUsage } from '../../api/admin';
import { listRegions } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import Table from '../common/Table';
import { PrimaryButton } from '../common/GlassButton';

const USAGE_COLUMNS = [{ label: 'Employee' }, { label: 'Taken' }, { label: 'Remaining' }];

export default function HolidayAdmin({ leaveYearId }) {
  const [holidays, setHolidays] = useState([]);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({ date: '', name: '', regionId: '', isOptional: false });
  const [warning, setWarning] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [usage, setUsage] = useState({ quota: 0, employees: [] });

  const load = () => leaveYearId && listHolidays(leaveYearId).then((res) => setHolidays(res.data));
  const loadUsage = () => leaveYearId && getOptionalHolidayUsage(leaveYearId).then((res) => setUsage(res.data));
  useEffect(() => { load(); loadUsage(); }, [leaveYearId]);
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
      setForm({ date: '', name: '', regionId: '', isOptional: false });
      load();
      loadUsage();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <h3 className="font-display font-bold text-ink-100 mb-4 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-aurora-violet" /> Add holiday
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <input type="date" className="glass-input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          <input className="glass-input" placeholder="Holiday name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="text-[11px] font-semibold uppercase text-ink-400 mb-1 block">Region</label>
            <select className="glass-input text-ink-200 bg-void-900" value={form.regionId}
              onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}>
              <option value="">All regions (org-wide)</option>
              {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-300 cursor-pointer">
            <input type="checkbox" checked={form.isOptional} onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))} />
            Optional holiday (employees opt in, up to their quota) — otherwise mandatory for everyone
          </label>
          {warning && (
            <div className="flex items-start gap-2 text-xs text-status-advance bg-status-advance/10 border border-status-advance/25 rounded-xl px-3 py-2.5">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" /> {warning}
            </div>
          )}
          <PrimaryButton type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Add holiday'}</PrimaryButton>
        </form>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h3 className="font-display font-bold text-ink-100 mb-4">Current & next leave year</h3>
        <div className="divide-y divide-frost/5">
          {holidays.map((h) => (
            <div key={h.holiday_id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink-100 flex items-center gap-2">
                  {h.holiday_name}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                    h.Region ? 'text-aurora-cyan border-aurora-cyan/30 bg-aurora-cyan/10' : 'text-ink-400 border-frost/10 bg-frost/5'
                  }`}>
                    {h.Region ? h.Region.region_name : 'All regions'}
                  </span>
                  {h.is_optional && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 text-status-advance border-status-advance/30 bg-status-advance/10">
                      Optional
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-500">{h.holiday_date}</p>
              </div>
              {confirmDeleteId === h.holiday_id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <p className="text-xs font-semibold text-status-rejected">Delete?</p>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="ghost-btn !py-1 !px-2.5 text-xs">Cancel</button>
                  <button
                    type="button"
                    onClick={() => { removeHoliday(h.holiday_id).then(load); setConfirmDeleteId(null); }}
                    className="bg-status-rejected hover:bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteId(h.holiday_id)} className="text-ink-500 hover:text-status-rejected transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-5">
        <h3 className="font-display font-bold text-ink-100 mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-aurora-violet" /> Optional holiday usage
        </h3>
        <p className="text-xs text-ink-500 mb-4">
          Quota this leave year: <strong className="text-ink-200">{usage.quota}</strong> per employee
          {' '}— auto-computed as half of published optional holidays, unless overridden in Settings.
        </p>
        {!usage.employees.length ? (
          <p className="text-xs text-ink-500 text-center py-6">No employees to show.</p>
        ) : (
          <Table columns={USAGE_COLUMNS} maxHeight="max-h-[40vh]">
            {usage.employees.map((e) => (
              <tr key={e.employeeId} className="hover:bg-frost/[0.03] transition-colors">
                <td className="px-4 py-2.5 text-sm text-ink-100 whitespace-nowrap">{e.fullName}</td>
                <td className="px-4 py-2.5 text-sm text-ink-300">{e.taken}</td>
                <td className={`px-4 py-2.5 text-sm font-bold ${e.remaining === 0 ? 'text-ink-500' : 'text-status-approved'}`}>{e.remaining}</td>
              </tr>
            ))}
          </Table>
        )}
      </GlassCard>
    </div>
  );
}
