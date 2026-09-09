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

  const load = () => getMyRequests().then((res) => setRequests(res.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmitDraft = (id) => submitDraft(id).then(load).catch((err) => setError(err.message));

  return (
    <>
      <Topbar title="My Requests" />
      {error && <p className="text-xs text-status-rejected mb-3">{error}</p>}
      <GlassCard>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
        ) : !requests.length ? (
          <EmptyState icon={ListChecks} title="No requests yet" description="Your leave history will appear here once you apply." />
        ) : (
          <div className="divide-y divide-white/5">
            {requests.map((r) => (
              <div key={r.request_id} className="flex items-center justify-between py-3.5 gap-3">
                <div className="min-w-0">
                  <Link to={`/my-requests/${r.request_id}`} className="text-sm font-medium text-slate-100 hover:text-aurora-violet transition-colors">
                    {r.start_date} → {r.end_date}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">{r.LeaveType?.type_name} · {r.deducted_days ?? '—'} day(s)</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge state={r.state} />
                  {r.state === 'DRAFT' && (
                    <>
                      <PrimaryButton onClick={() => handleSubmitDraft(r.request_id)} className="!px-3 !py-1.5 text-xs">Submit</PrimaryButton>
                      <GhostButton onClick={() => discardDraft(r.request_id).then(load)} className="!px-3 !py-1.5 text-xs">Discard</GhostButton>
                    </>
                  )}
                  {WITHDRAWABLE.includes(r.state) && (
                    <GhostButton onClick={() => withdrawRequest(r.request_id).then(load)} className="!px-3 !py-1.5 text-xs">
                      Withdraw
                    </GhostButton>
                  )}
                  {r.state === 'APPROVED' && (
                    <GhostButton onClick={() => requestCancellation(r.request_id).then(load)} className="!px-3 !py-1.5 text-xs">
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
