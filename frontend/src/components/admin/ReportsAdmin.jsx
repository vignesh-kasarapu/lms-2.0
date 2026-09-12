import { useEffect, useRef, useState } from 'react';
import { FileBarChart, AlertTriangle } from 'lucide-react';
import { getLeaveTakenReport, getLopReport } from '../../api/reports';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../common/StatusBadge';
import { GhostButton } from '../common/GlassButton';

export default function ReportsAdmin() {
  const [view, setView] = useState('leave-taken');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Mirrors ApplyLeave.jsx's previewRequestId ref pattern: switching views while a
  // fetch for the OLD view is still in flight must not let that late response render
  // through the NEW view's field-mapping. Each fetch captures the view it was FOR and
  // only applies its result if that's still the current view when it resolves.
  const requestIdRef = useRef(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;
    const requestedView = view;
    const fetcher = requestedView === 'leave-taken' ? getLeaveTakenReport({}) : getLopReport({});
    fetcher
      .then((res) => {
        if (requestId === requestIdRef.current) setRows(res.data);
      })
      .catch((err) => {
        if (requestId === requestIdRef.current) setError(err.message);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [view]);

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-ink-100 flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-aurora-violet" /> Reports
        </h3>
        <div className="flex gap-2">
          <GhostButton onClick={() => setView('leave-taken')} className={`!py-1.5 !px-3 text-xs ${view === 'leave-taken' ? '!bg-frost/10' : ''}`}>Leave taken</GhostButton>
          <GhostButton onClick={() => setView('lop')} className={`!py-1.5 !px-3 text-xs ${view === 'lop' ? '!bg-frost/10' : ''}`}>Loss of pay</GhostButton>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
      ) : error ? (
        <div className="flex items-start gap-2.5 text-xs font-semibold text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      ) : !rows.length ? (
        <p className="text-sm text-ink-500">No records for this filter.</p>
      ) : view === 'leave-taken' ? (
        <div className="divide-y divide-frost/5">
          {rows.map((r) => (
            <div key={r.request_id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-100">{r.employee?.full_name}</p>
                <p className="text-xs text-ink-500">{r.LeaveType?.type_name} · {r.start_date} → {r.end_date} · {r.deducted_days}d</p>
              </div>
              <StatusBadge state={r.state} />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-frost/5">
          {rows.map((r) => (
            <div key={r.lop_record_id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-100">{r.Employee?.full_name}</p>
                <p className="text-xs text-ink-500">{r.start_date} → {r.end_date} · {r.deducted_days}d</p>
              </div>
              <span className="text-xs text-status-advance">Converted {new Date(r.converted_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
