import { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, TriangleAlert, Filter, User, Clock, AlertCircle, Undo2, AlertTriangle } from 'lucide-react';
import { getApprovalsQueue, decideRequest, decideCancellation } from '../api/leaveRequests';
import GlassCard from '../components/common/GlassCard';
import { GhostButton } from '../components/common/GlassButton';
import EmptyState from '../components/common/EmptyState';
import Topbar from '../components/layout/Topbar';
import { celebrate } from '../utils/celebrate';

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'DELEGATED' | 'DIRECT' | 'ADVANCE' | 'LONG_LEAVE' | 'CANCELLATION'
  const [unelapsedInputs, setUnelapsedInputs] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => getApprovalsQueue().then((res) => setRequests(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => {
    // Add theme-hr class to body while on HR/Manager approvals view
    document.body.classList.add('theme-hr');
    load();
    return () => document.body.classList.remove('theme-hr');
  }, []);

  const approve = async (r) => {
    if (processingId) return;
    setError(null);
    setProcessingId(r.request_id);
    try {
      if (r.decision_type === 'CANCELLATION') {
        const unelapsedDays = Number(unelapsedInputs[r.request_id] ?? r.deducted_days);
        await decideCancellation(r.request_id, 'APPROVE', unelapsedDays);
      } else {
        await decideRequest(r.request_id, 'APPROVE');
      }
      celebrate();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const submitReject = async () => {
    if (processingId) return;
    const target = requests.find((r) => r.request_id === rejecting);
    setError(null);
    setProcessingId(rejecting);
    try {
      if (target?.decision_type === 'CANCELLATION') {
        await decideCancellation(rejecting, 'REJECT');
      } else {
        await decideRequest(rejecting, 'REJECT', reason);
      }
      setRejecting(null);
      setReason('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const advanceCount = requests.filter((r) => r.is_advance_leave).length;
  const longLeaveCount = requests.filter((r) => r.is_long_leave).length;
  const cancellationCount = requests.filter((r) => r.decision_type === 'CANCELLATION').length;
  const delegatedCount = requests.filter((r) => r.is_delegated).length;
  const directCount = requests.length - delegatedCount;

  const filteredRequests = requests.filter((r) => {
    if (filter === 'DELEGATED') return r.is_delegated;
    if (filter === 'DIRECT') return !r.is_delegated;
    if (filter === 'ADVANCE') return r.is_advance_leave;
    if (filter === 'LONG_LEAVE') return r.is_long_leave;
    if (filter === 'CANCELLATION') return r.decision_type === 'CANCELLATION';
    return true;
  });

  return (
    <>
      <Topbar title="Approvals Hub" />

      {/* Queue Header Stats & Filter Bar */}
      <div className="glass-panel-hr p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Leave Approvals Queue
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                {requests.length} Requests
              </span>
            </h2>
            <p className="text-xs text-ink-300">Review pending requests from your team and department</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-frost/10 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filter === 'ALL'
                ? 'bg-emerald-500 text-ink-950 font-extrabold shadow-lg shadow-emerald-500/30 border border-emerald-400/50'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            All Pending ({requests.length})
          </button>
          {delegatedCount > 0 && (
            <button
              onClick={() => setFilter('DELEGATED')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                filter === 'DELEGATED'
                  ? 'bg-violet-500 text-white font-extrabold shadow-lg shadow-violet-500/30 border border-violet-400/50'
                  : 'text-violet-300 hover:bg-violet-500/10'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Delegated to me ({delegatedCount})
            </button>
          )}
          {directCount > 0 && delegatedCount > 0 && (
            <button
              onClick={() => setFilter('DIRECT')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                filter === 'DIRECT'
                  ? 'bg-ink-200 text-ink-950 font-extrabold'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              My team ({directCount})
            </button>
          )}
          {advanceCount > 0 && (
            <button
              onClick={() => setFilter('ADVANCE')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                filter === 'ADVANCE'
                  ? 'bg-status-advance text-ink-950 font-bold shadow-md'
                  : 'text-status-advance hover:bg-status-advance/10'
              }`}
            >
              <TriangleAlert className="w-3.5 h-3.5" /> Advance ({advanceCount})
            </button>
          )}
          {longLeaveCount > 0 && (
            <button
              onClick={() => setFilter('LONG_LEAVE')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                filter === 'LONG_LEAVE'
                  ? 'bg-status-rejected text-white font-bold shadow-md'
                  : 'text-status-rejected hover:bg-status-rejected/10'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" /> HR Needed ({longLeaveCount})
            </button>
          )}
          {cancellationCount > 0 && (
            <button
              onClick={() => setFilter('CANCELLATION')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                filter === 'CANCELLATION'
                  ? 'bg-amber-500 text-ink-950 font-extrabold shadow-lg shadow-amber-500/30 border border-amber-400/50'
                  : 'text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" /> Cancellations ({cancellationCount})
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2.5 text-xs font-semibold text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl glass-panel animate-pulse" />)}</div>
      ) : !filteredRequests.length ? (
        <GlassCard>
          <EmptyState icon={ShieldCheck} title="Approvals queue clear" description="There are no pending requests matching your filter." />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((r) => {
            const isCancellation = r.decision_type === 'CANCELLATION';
            const isProcessing = processingId === r.request_id;
            return (
            <div key={r.request_id} className={`glass-panel p-5 transition-all duration-200 rounded-2xl border ${
              isCancellation
                ? 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10'
                : 'border-frost/10 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 border border-emerald-400/30">
                    {r.employee?.full_name?.slice(0, 2).toUpperCase() || 'EMP'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-ink-100 text-base">{r.employee?.full_name}</p>
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {r.employee?.designation || 'Staff'}
                      </span>
                      {isCancellation && (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold flex items-center gap-1">
                          <Undo2 className="w-3 h-3" /> Cancellation Requested
                        </span>
                      )}
                      {r.is_delegated && (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-400/30 font-semibold">
                          Delegated for {r.delegated_for?.full_name || 'manager'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-300 mt-2 flex-wrap">
                      <span className="font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-sm">
                        {r.LeaveType?.type_name}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> {r.start_date} → {r.end_date}
                      </span>
                      <span className="text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {r.deducted_days} day(s)
                      </span>
                    </div>

                    {(r.is_advance_leave || r.is_long_leave) && (
                      <div className="flex gap-2 mt-2.5">
                        {r.is_advance_leave && <Flag label="Advance Leave Flagged" color="advance" />}
                        {r.is_long_leave && <Flag label="Long Leave · Requires HR Approval" color="rejected" />}
                      </div>
                    )}

                    {isCancellation && rejecting !== r.request_id && (
                      <label className="mt-3 flex items-center gap-2 text-xs text-amber-200">
                        Days to restore on approval:
                        <input
                          type="number"
                          min="0"
                          max={r.deducted_days}
                          step="0.5"
                          className="glass-input !py-1 !px-2 !w-20 text-xs"
                          value={unelapsedInputs[r.request_id] ?? r.deducted_days}
                          onChange={(e) => setUnelapsedInputs((prev) => ({ ...prev, [r.request_id]: e.target.value }))}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {rejecting !== r.request_id && (
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    <button
                      onClick={() => approve(r)}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-ink-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-1.5 border border-emerald-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> {isCancellation ? 'Approve Cancellation' : 'Approve Request'}
                    </button>
                    <GhostButton
                      onClick={() => setRejecting(r.request_id)}
                      disabled={isProcessing}
                      className="!py-2.5 !px-4 text-xs hover:border-status-rejected/40 hover:text-status-rejected disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" /> Reject
                    </GhostButton>
                  </div>
                )}
              </div>

              {rejecting === r.request_id && (
                <div className="mt-4 pt-3 border-t border-frost/10 space-y-3 bg-red-950/20 p-3 rounded-xl border border-red-500/20">
                  {isCancellation ? (
                    <p className="text-xs font-semibold text-status-rejected flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Reject this cancellation request? The leave stays Approved as-is.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-status-rejected flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Please specify a reason for rejecting this leave request:
                      </p>
                      <textarea
                        className="glass-input min-h-[75px] resize-none text-xs"
                        placeholder="Enter explicit reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                      />
                    </>
                  )}
                  <div className="flex gap-2 justify-end">
                    <GhostButton onClick={() => setRejecting(null)} disabled={isProcessing} className="!py-2 !px-4 text-xs disabled:opacity-50">
                      Cancel
                    </GhostButton>
                    <button
                      onClick={submitReject}
                      disabled={isProcessing || (!isCancellation && !reason.trim())}
                      className="bg-status-rejected hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-40"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Flag({ label, color }) {
  const isAdvance = color === 'advance';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1 ${
      isAdvance
        ? 'text-status-advance bg-status-advance/10 border border-status-advance/30'
        : 'text-status-rejected bg-status-rejected/10 border border-status-rejected/30'
    }`}>
      <TriangleAlert className="w-3 h-3" /> {label}
    </span>
  );
}
