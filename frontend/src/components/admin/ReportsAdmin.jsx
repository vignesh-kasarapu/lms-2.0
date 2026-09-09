import { useEffect, useState } from 'react';
import { FileBarChart } from 'lucide-react';
import { getLeaveTakenReport, getLopReport } from '../../api/reports';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../common/StatusBadge';
import { GhostButton } from '../common/GlassButton';

export default function ReportsAdmin() {
  const [view, setView] = useState('leave-taken');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = view === 'leave-taken' ? getLeaveTakenReport({}) : getLopReport({});
    fetcher.then((res) => setRows(res.data)).finally(() => setLoading(false));
  }, [view]);

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-slate-100 flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-aurora-violet" /> Reports
        </h3>
        <div className="flex gap-2">
          <GhostButton onClick={() => setView('leave-taken')} className={`!py-1.5 !px-3 text-xs ${view === 'leave-taken' ? '!bg-white/10' : ''}`}>Leave taken</GhostButton>
          <GhostButton onClick={() => setView('lop')} className={`!py-1.5 !px-3 text-xs ${view === 'lop' ? '!bg-white/10' : ''}`}>Loss of pay</GhostButton>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
      ) : !rows.length ? (
        <p className="text-sm text-slate-500">No records for this filter.</p>
      ) : view === 'leave-taken' ? (
        <div className="divide-y divide-white/5">
          {rows.map((r) => (
            <div key={r.request_id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">{r.employee?.full_name}</p>
                <p className="text-xs text-slate-500">{r.LeaveType?.type_name} · {r.start_date} → {r.end_date} · {r.deducted_days}d</p>
              </div>
              <StatusBadge state={r.state} />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {rows.map((r) => (
            <div key={r.lop_record_id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">{r.Employee?.full_name}</p>
                <p className="text-xs text-slate-500">{r.start_date} → {r.end_date} · {r.deducted_days}d</p>
              </div>
              <span className="text-xs text-status-advance">Converted {new Date(r.converted_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
