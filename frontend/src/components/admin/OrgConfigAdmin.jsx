import { useEffect, useState } from 'react';
import { Settings2, Save } from 'lucide-react';
import { listConfig, updateConfig } from '../../api/config';
import GlassCard from '../common/GlassCard';
import { PrimaryButton } from '../common/GlassButton';

const FIELD_META = {
  'leave_year.start_month_day': { label: 'Leave year start (MM-DD)', hint: 'Changes apply from the next leave year only — never retrospective.' },
  'weekend.days': { label: 'Weekend days', hint: 'Comma-separated, e.g. SAT,SUN' },
  'weekend.count_within_leave': { label: 'Count weekends within leave', hint: 'ON deducts weekend days inside a requested span.' },
  'holiday.count_within_leave': { label: 'Count public holidays within leave', hint: 'ON deducts holidays inside a requested span.' },
  timezone: { label: 'Time zone', hint: 'All dates, deadlines and scheduled jobs resolve in this zone.' },
  'approval.long_leave_threshold_days': { label: 'Long-leave HR threshold (days)', hint: 'Above this, HR/Admin second-stage approval is required.' },
  'approval.sla_working_days': { label: 'Approval SLA (working days)', hint: 'Per approval stage.' },
  'approval.sla_reminder_days_before': { label: 'SLA reminder (days before deadline)', hint: 'A reminder fires this many days before the SLA deadline.' },
  'backdating.window_days': { label: 'Backdating window (calendar days)', hint: 'Capped further at the current leave-year start.' },
  'advance_leave.withdrawal_window_days': { label: 'Advance-leave withdrawal window (days)', hint: 'Before an unwithdrawn rejection converts to loss of pay.' },
  'sick_leave.alert_threshold_days': { label: 'Sick-leave alert threshold (days)', hint: 'Above this, the supervisor/HR alerts fire.' },
  'sick_leave.alert_supervisor_enabled': { label: 'Sick-leave alert to supervisor', hint: 'Independent of the HR toggle.' },
  'sick_leave.alert_hr_enabled': { label: 'Sick-leave alert to HR/Admin', hint: 'Independent of the supervisor toggle.' },
};

// weekend.days is stored as a JSON array string (e.g. '["SAT","SUN"]') — shown/edited here
// as a plain comma-separated list instead of raw JSON.
function toDisplayValue(key, rawValue) {
  if (key !== 'weekend.days') return rawValue;
  try { return JSON.parse(rawValue).join(','); } catch { return rawValue; }
}
function fromDisplayValue(key, displayValue) {
  if (key !== 'weekend.days') return displayValue;
  return JSON.stringify(displayValue.split(',').map((d) => d.trim().toUpperCase()).filter(Boolean));
}

export default function OrgConfigAdmin() {
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const load = () => listConfig().then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const save = async (key, valueType) => {
    setSavingKey(key);
    try {
      await updateConfig(key, fromDisplayValue(key, drafts[key]), valueType);
      load();
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <GlassCard>
      <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-aurora-violet" /> Organisation configuration
      </h3>
      <p className="text-xs text-slate-500 mb-5">Every value here is read at runtime — nothing on this screen is a code constant.</p>

      <div className="space-y-3">
        {rows.map((row) => {
          const meta = FIELD_META[row.config_key] || { label: row.config_key };
          const displayStored = toDisplayValue(row.config_key, row.config_value);
          const draftValue = drafts[row.config_key] ?? displayStored;
          const dirty = draftValue !== displayStored;

          return (
            <div key={row.config_key} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start bg-white/[0.03] rounded-xl px-4 py-3">
              <div className="sm:col-span-1">
                <p className="text-sm font-medium text-slate-200">{meta.label}</p>
                {meta.hint && <p className="text-xs text-slate-500 mt-0.5">{meta.hint}</p>}
              </div>
              <div className="sm:col-span-2 flex gap-2">
                {row.value_type === 'BOOL' ? (
                  <select className="glass-input" value={draftValue}
                    onChange={(e) => setDrafts((d) => ({ ...d, [row.config_key]: e.target.value }))}>
                    <option value="true">ON</option>
                    <option value="false">OFF</option>
                  </select>
                ) : (
                  <input className="glass-input" value={draftValue}
                    placeholder={row.config_key === 'weekend.days' ? 'SAT,SUN' : undefined}
                    onChange={(e) => setDrafts((d) => ({ ...d, [row.config_key]: e.target.value }))} />
                )}
                {dirty && (
                  <PrimaryButton onClick={() => save(row.config_key, row.value_type)} disabled={savingKey === row.config_key} className="!px-3 !py-2">
                    <Save className="w-3.5 h-3.5" />
                  </PrimaryButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
