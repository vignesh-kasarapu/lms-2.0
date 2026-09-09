import { useEffect, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { listWorkingPatterns, createWorkingPattern, assignWorkingPattern } from '../../api/admin';
import { listEmployees } from '../../api/employees';
import GlassCard from '../common/GlassCard';
import { PrimaryButton } from '../common/GlassButton';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function WorkingPatternAdmin() {
  const [patterns, setPatterns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [patternForm, setPatternForm] = useState({ patternCode: '', patternName: '', weekendDays: [] });
  const [assignForm, setAssignForm] = useState({ employeeId: '', workingPatternId: '', effectiveFrom: '', effectiveTo: '' });
  const [savingPattern, setSavingPattern] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const load = () => {
    listWorkingPatterns().then((res) => setPatterns(res.data));
    listEmployees().then((res) => setEmployees(res.data));
  };
  useEffect(() => { load(); }, []);

  const toggleDay = (day) => {
    setPatternForm((f) => ({
      ...f,
      weekendDays: f.weekendDays.includes(day) ? f.weekendDays.filter((d) => d !== day) : [...f.weekendDays, day],
    }));
  };

  const submitPattern = async (e) => {
    e.preventDefault();
    setSavingPattern(true);
    try {
      await createWorkingPattern(patternForm);
      setPatternForm({ patternCode: '', patternName: '', weekendDays: [] });
      load();
    } finally {
      setSavingPattern(false);
    }
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    setSavingAssign(true);
    setAssignError(null);
    try {
      await assignWorkingPattern(assignForm);
      setAssignForm({ employeeId: '', workingPatternId: '', effectiveFrom: '', effectiveTo: '' });
    } catch (err) {
      setAssignError(err.message); // e.g. overlap refusal (LMS-015)
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-aurora-violet" /> Working patterns
        </h3>
        <p className="text-xs text-slate-500 mb-4">For round-the-clock coverage teams whose weekend differs from the org default.</p>

        <form onSubmit={submitPattern} className="space-y-3 pb-4 mb-4 border-b border-white/5">
          <input className="glass-input" placeholder="Pattern code (e.g. FRI_SAT)" value={patternForm.patternCode}
            onChange={(e) => setPatternForm((f) => ({ ...f, patternCode: e.target.value.toUpperCase() }))} required />
          <input className="glass-input" placeholder="Pattern name" value={patternForm.patternName}
            onChange={(e) => setPatternForm((f) => ({ ...f, patternName: e.target.value }))} required />
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => (
              <button type="button" key={day} onClick={() => toggleDay(day)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                  patternForm.weekendDays.includes(day) ? 'bg-aurora-violet/15 border-aurora-violet/50 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400'
                }`}>
                {day}
              </button>
            ))}
          </div>
          <PrimaryButton type="submit" disabled={savingPattern || !patternForm.weekendDays.length} className="w-full">
            {savingPattern ? 'Saving…' : 'Create pattern'}
          </PrimaryButton>
        </form>

        <div className="space-y-2">
          {patterns.map((p) => (
            <div key={p.working_pattern_id} className="text-sm bg-white/[0.03] rounded-lg px-3 py-2">
              <p className="text-slate-100">{p.pattern_name}</p>
              <p className="text-xs text-slate-500">Weekend: {JSON.parse(p.weekend_days).join(', ')}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        <h3 className="font-display font-bold text-slate-100 mb-4">Assign to employee</h3>
        <form onSubmit={submitAssign} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select className="glass-input" value={assignForm.employeeId} onChange={(e) => setAssignForm((f) => ({ ...f, employeeId: e.target.value }))} required>
            <option value="">Employee…</option>
            {employees.map((e) => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
          </select>
          <select className="glass-input" value={assignForm.workingPatternId} onChange={(e) => setAssignForm((f) => ({ ...f, workingPatternId: e.target.value }))} required>
            <option value="">Pattern…</option>
            {patterns.map((p) => <option key={p.working_pattern_id} value={p.working_pattern_id}>{p.pattern_name}</option>)}
          </select>
          <input type="date" className="glass-input" value={assignForm.effectiveFrom} onChange={(e) => setAssignForm((f) => ({ ...f, effectiveFrom: e.target.value }))} required />
          <input type="date" className="glass-input" placeholder="Open-ended" value={assignForm.effectiveTo} onChange={(e) => setAssignForm((f) => ({ ...f, effectiveTo: e.target.value }))} />
          {assignError && <p className="sm:col-span-2 text-xs text-status-rejected">{assignError}</p>}
          <PrimaryButton type="submit" disabled={savingAssign} className="sm:col-span-2">
            {savingAssign ? 'Saving…' : 'Assign pattern'}
          </PrimaryButton>
        </form>
        <p className="text-xs text-slate-500 mt-3">Exactly one pattern can be active per employee on any given date — overlapping assignments are refused.</p>
      </GlassCard>
    </div>
  );
}
