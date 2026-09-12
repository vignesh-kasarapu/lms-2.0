import { useEffect, useState } from 'react';
import { UserCog, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  listAllDelegations, listDelegationManagers, getEligibleDelegatesForManager,
  createDelegationOnBehalf,
} from '../../api/delegations';
import GlassCard from '../common/GlassCard';
import EmptyState from '../common/EmptyState';
import { PrimaryButton } from '../common/GlassButton';

export default function DelegationAdmin() {
  const [delegations, setDelegations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [nominatorId, setNominatorId] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => listAllDelegations().then((res) => setDelegations(res.data));

  useEffect(() => {
    Promise.all([load(), listDelegationManagers().then((res) => setManagers(res.data))])
      .finally(() => setLoading(false));
  }, []);

  const selectManager = (id) => {
    setNominatorId(id);
    setDelegateId('');
    setCandidates([]);
    setError(null);
    setSuccess(null);
    if (id) getEligibleDelegatesForManager(id).then((res) => setCandidates(res.data)).catch((err) => setError(err.message));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!nominatorId || !delegateId || !fromDate || !toDate) {
      setError('Select the manager, delegate, start date, and end date.');
      return;
    }
    if (toDate < fromDate) {
      setError('End date must be on or after the start date.');
      return;
    }
    setSaving(true);
    try {
      await createDelegationOnBehalf({ nominatorId, delegateId, fromDate, toDate });
      setSuccess('Delegation created successfully.');
      setNominatorId('');
      setDelegateId('');
      setCandidates([]);
      setFromDate('');
      setToDate('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard>
      <h3 className="font-display font-bold text-ink-100 mb-1 flex items-center gap-2">
        <UserCog className="w-4 h-4 text-aurora-violet" /> Delegations
      </h3>
      <p className="text-xs text-ink-500 mb-4">HR/Admin can set a delegate for any manager. Only same-level peer managers are offered.</p>

      <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-300" />
          <h4 className="text-sm font-bold text-ink-100">Set delegation for a manager</h4>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold uppercase text-ink-400">
            Manager being covered
            <select className="glass-input mt-1 text-ink-200 bg-void-900" value={nominatorId} onChange={(e) => selectManager(e.target.value)} required>
              <option value="">Select manager</option>
              {managers.map((manager) => (
                <option key={manager.employee_id} value={manager.employee_id}>{manager.full_name} ({manager.employee_code})</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase text-ink-400">
            Appoint delegate
            <select className="glass-input mt-1 text-ink-200 bg-void-900" value={delegateId} onChange={(e) => setDelegateId(e.target.value)} disabled={!nominatorId} required>
              <option value="">{nominatorId ? (candidates.length ? 'Select same-level manager' : 'No eligible peer managers') : 'Select manager first'}</option>
              {candidates.map((candidate) => (
                <option key={candidate.employee_id} value={candidate.employee_id}>{candidate.full_name} ({candidate.employee_code})</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold uppercase text-ink-400">
            From date
            <input type="date" className="glass-input mt-1" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
          </label>
          <label className="text-[11px] font-semibold uppercase text-ink-400">
            To date
            <input type="date" className="glass-input mt-1" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
          </label>
          {error && <p className="md:col-span-2 text-xs text-status-rejected flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}
          {success && <p className="md:col-span-2 text-xs text-status-approved">{success}</p>}
          <div className="md:col-span-2 flex justify-end">
            <PrimaryButton type="submit" disabled={saving || !candidates.length}>{saving ? 'Saving…' : 'Create delegation'}</PrimaryButton>
          </div>
        </form>
      </div>

      <h4 className="text-sm font-bold text-ink-100 mb-3">All delegations</h4>
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
      ) : !delegations.length ? (
        <EmptyState icon={UserCog} title="No delegations exist yet" />
      ) : (
        <div className="divide-y divide-frost/5">
          {delegations.map((d) => (
            <div key={d.delegation_id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-100">{d.nominator?.full_name} → {d.delegate?.full_name}</p>
                <p className="text-xs text-ink-500">{d.from_date} to {d.to_date}{d.revoked_at ? ' · revoked' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
