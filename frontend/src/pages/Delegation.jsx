import { useEffect, useState } from 'react';
import { UserCog, Info, Mail, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEligibleDelegates, getMyDelegations, createDelegation, revokeDelegation } from '../api/delegations';
import DelegationAdmin from '../components/admin/DelegationAdmin';
import { getMyDigestPreference, setMyDigestPreference } from '../api/employees';
import GlassCard from '../components/common/GlassCard';
import { GhostButton } from '../components/common/GlassButton';
import Topbar from '../components/layout/Topbar';
import EmptyState from '../components/common/EmptyState';

export default function Delegation() {
  const { hasRole } = useAuth();
  const isHrAdmin = hasRole('HR_ADMIN');
  const [eligible, setEligible] = useState({ candidates: [], fallbackUsed: false });
  const [mine, setMine] = useState([]);
  const [form, setForm] = useState({ delegateId: '', fromDate: '', toDate: '' });
  const [saving, setSaving] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestSaving, setDigestSaving] = useState(false);

  const load = () => {
    getEligibleDelegates().then((res) => setEligible(res.data));
    getMyDelegations().then((res) => setMine(res.data));
    getMyDigestPreference().then((res) => setDigestEnabled(res.data.digestEnabled));
  };

  useEffect(() => {
    // Apply light emerald green theme to body
    document.body.classList.add('theme-hr');
    if (!isHrAdmin) load();
    return () => document.body.classList.remove('theme-hr');
  }, [isHrAdmin]);

  if (isHrAdmin) {
    return (
      <>
        <Topbar title="Delegation Management" />
        <DelegationAdmin />
      </>
    );
  }

  const toggleDigest = async () => {
    setDigestSaving(true);
    try {
      await setMyDigestPreference(!digestEnabled);
      setDigestEnabled(!digestEnabled);
    } finally {
      setDigestSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createDelegation(form);
      setForm({ delegateId: '', fromDate: '', toDate: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Delegation Management" />

      {/* Daily Digest Feature Panel */}
      <div className="glass-panel-hr p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-teal-500/30 bg-slate-950/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 shadow-lg shadow-teal-500/10">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold flex items-center gap-2">
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent font-display">
                Daily Digest Email Summary
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Notification Control
              </span>
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Receive one combined daily summary email of pending approvals instead of individual alerts.
            </p>
          </div>
        </div>

        {/* Right Side ON/OFF Toggle Switch & Clear Status Pill */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0 bg-slate-900/90 px-3 py-2 rounded-2xl border border-white/15 shadow-xl">
          <span
            className={`text-xs font-black px-3 py-1 rounded-xl border transition-all ${
              digestEnabled
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-md shadow-emerald-500/20'
                : 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-md shadow-rose-500/20'
            }`}
          >
            {digestEnabled ? '🟢 ON (ENABLED)' : '🔴 OFF (DISABLED)'}
          </span>
          <button
            onClick={toggleDigest}
            disabled={digestSaving}
            className={`relative w-14 h-7 rounded-full transition-all shrink-0 border-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/50 ${
              digestEnabled
                ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/40'
                : 'bg-slate-800 border-slate-600'
            }`}
            title={digestEnabled ? 'Click to Turn OFF Daily Digest' : 'Click to Turn ON Daily Digest'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center text-[9px] font-black ${
                digestEnabled ? 'translate-x-7 text-emerald-600' : 'translate-x-0 text-slate-600'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Nominate Delegate Form */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-teal-500/30 hover:border-teal-500/50 transition-all">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <UserCog className="w-4 h-4" />
            </div>
            <h3 className="font-display font-extrabold text-base bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Nominate a Delegate
            </h3>
          </div>

          {eligible.fallbackUsed && eligible.candidates.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 mb-4">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>No peer manager found — your supervisor is offered as the fallback delegate.</span>
            </div>
          )}

          {!eligible.candidates.length ? (
            <EmptyState
              icon={UserCog}
              title="No eligible delegate found"
              description="You have no peer managers under your supervisor, and no supervisor is on record."
            />
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider mb-1 block">
                  Select Delegate Officer
                </label>
                <select
                  className="glass-input focus:border-emerald-500/60"
                  value={form.delegateId}
                  onChange={(e) => setForm((f) => ({ ...f, delegateId: e.target.value }))}
                  required
                >
                  <option value="">Choose an eligible delegate…</option>
                  {eligible.candidates.map((c) => (
                    <option key={c.employee_id} value={c.employee_id}>
                      {c.full_name} ({c.designation || 'Manager'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">From Date</label>
                  <input
                    type="date"
                    className="glass-input"
                    value={form.fromDate}
                    onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">To Date</label>
                  <input
                    type="date"
                    className="glass-input"
                    value={form.toDate}
                    onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="hr-btn w-full !py-2.5 text-xs font-bold mt-2"
              >
                {saving ? 'Creating Delegation…' : 'Confirm Delegation Assignment'}
              </button>
            </form>
          )}
        </div>

        {/* Current Delegations List */}
        <div className="lg:col-span-3 glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="font-display font-extrabold text-slate-100 text-base flex items-center gap-2">
              Active & Scheduled Delegations
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                {mine.length} Total
              </span>
            </h3>
          </div>

          {!mine.length ? (
            <EmptyState icon={UserCog} title="No active delegations" description="Delegated approval permissions will be listed here." />
          ) : (
            <div className="divide-y divide-white/10">
              {mine.map((d) => (
                <div key={d.delegation_id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">
                        {d.nominator?.full_name} <span className="text-emerald-400 font-normal">→</span> {d.delegate?.full_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active: <strong className="text-emerald-300">{d.from_date}</strong> to <strong className="text-emerald-300">{d.to_date}</strong>
                        {d.revoked_at && <span className="text-status-rejected ml-2 font-bold">(Revoked)</span>}
                      </p>
                    </div>
                  </div>
                  {!d.revoked_at && (
                    <GhostButton
                      onClick={() => revokeDelegation(d.delegation_id).then(load)}
                      className="!px-3.5 !py-1.5 text-xs hover:border-status-rejected/40 hover:text-status-rejected"
                    >
                      Revoke Access
                    </GhostButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

