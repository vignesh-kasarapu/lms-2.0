import { useEffect, useState } from 'react';
import { History, AlertTriangle } from 'lucide-react';
import { getAuditLog } from '../../api/reports';
import GlassCard from '../common/GlassCard';
import EmptyState from '../common/EmptyState';

export default function AuditLogAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAuditLog({}).then((res) => setRows(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <GlassCard>
      <h3 className="font-display font-bold text-ink-100 mb-5 flex items-center gap-2">
        <History className="w-4 h-4 text-aurora-violet" /> Audit log
      </h3>
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-frost/[0.03] animate-pulse" />)}</div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load the audit log" description={error} />
      ) : (
        <div className="divide-y divide-frost/5 max-h-[520px] overflow-y-auto">
          {rows.map((r) => (
            <div key={r.audit_id} className="py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-100">
                  {r.is_system_actor ? 'SYSTEM' : r.actor?.full_name || `#${r.actor_id}`} · <span className="text-ink-400">{r.action}</span>
                </p>
                <span className="text-xs text-ink-600">{new Date(r.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-ink-500 mt-0.5">{r.entity_type} #{r.entity_id}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
