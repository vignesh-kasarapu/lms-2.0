import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { getMyRequests, withdrawRequest, requestCancellation, submitDraft, discardDraft } from '../api/leaveRequests';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { GhostButton, PrimaryButton } from '../components/common/GlassButton';
import EmptyState from '../components/common/EmptyState';
import Topbar from '../components/layout/Topbar';

const WITHDRAWABLE = ['PENDING_MANAGER', 'PENDING_HR', 'REJECTED_PENDING_WITHDRAWAL'];

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => getMyRequests().then((res) => setRequests(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmitDraft = (id) => submitDraft(id).then(load).catch((err) => setError(err.message));

  return (
    <>
      <Topbar title="My Requests" />
      {error && <p className="text-xs text-status-rejected mb-3">{error}</p>}
      <GlassCard>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
        ) : !requests.length ? (
          <EmptyState icon={ListChecks} title="No requests yet" description="Your leave history will appear here once you apply." />
        ) : (
          <div className="divide-y divide-frost/5">
            {requests.map((r) => (
              <div key={r.request_id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3">
                    <Link to={`/my-requests/${r.request_id}`} className="text-sm font-medium text-ink-100 hover:text-aurora-violet transition-colors whitespace-nowrap">
                      {r.start_date} → {r.end_date}
                    </Link>
                    <span className="sm:hidden shrink-0"><StatusBadge state={r.state} /></span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{r.LeaveType?.type_name} · {r.deducted_days ?? '—'} day(s)</p>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:shrink-0">
                  <span className="hidden sm:inline-flex"><StatusBadge state={r.state} /></span>
                  {r.state === 'DRAFT' && (
                    <>
                      <PrimaryButton onClick={() => handleSubmitDraft(r.request_id)} className="!px-3 !py-1.5 text-xs">Submit</PrimaryButton>
                      <GhostButton onClick={() => discardDraft(r.request_id).then(load).catch((err) => setError(err.message))} className="!px-3 !py-1.5 text-xs">Discard</GhostButton>
                    </>
                  )}
                  {WITHDRAWABLE.includes(r.state) && (
                    <GhostButton onClick={() => withdrawRequest(r.request_id).then(load).catch((err) => setError(err.message))} className="!px-3 !py-1.5 text-xs">
                      Withdraw
                    </GhostButton>
                  )}
                  {r.state === 'APPROVED' && (
                    <GhostButton onClick={() => requestCancellation(r.request_id).then(load).catch((err) => setError(err.message))} className="!px-3 !py-1.5 text-xs">
                      Request cancellation
                    </GhostButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </>
  );
}
