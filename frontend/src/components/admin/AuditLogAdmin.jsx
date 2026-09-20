import { useEffect, useState } from 'react';
import { History, AlertTriangle } from 'lucide-react';
import { getAuditLog } from '../../api/reports';
import GlassCard from '../common/GlassCard';
import EmptyState from '../common/EmptyState';
import ResponsiveList from '../common/ResponsiveList';

const COLUMNS = [
  { key: 'actor', label: 'Actor', render: (r) => (r.is_system_actor ? 'SYSTEM' : r.actor?.full_name || `#${r.actor_id}`) },
  { key: 'action', label: 'Action', render: (r) => r.action },
  { key: 'entity', label: 'Entity', render: (r) => `${r.entity_type} #${r.entity_id}` },
  { key: 'timestamp', label: 'Timestamp', render: (r) => new Date(r.timestamp).toLocaleString(), nowrap: true },
];

export default function AuditLogAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAuditLog({}).then((res) => setRows(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <GlassCard>
      <h3 className="h3 mb-5 flex items-center gap-2">
        <History className="w-4 h-4 text-accent-text" /> Audit log
      </h3>
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 48 }} />)}</div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load the audit log" description={error} />
      ) : (
        <div className="max-h-[520px] overflow-y-auto">
          <ResponsiveList
            columns={COLUMNS}
            rows={rows}
            rowKey={(r) => r.audit_id}
            empty={<EmptyState icon={History} title="No audit events yet" />}
            renderCard={(r) => (
              <>
                <header>
                  <span>{r.is_system_actor ? 'SYSTEM' : r.actor?.full_name || `#${r.actor_id}`}</span>
                  <span className="muted small">{new Date(r.timestamp).toLocaleString()}</span>
                </header>
                <div className="meta">
                  <span>{r.action}</span>
                  <span>{r.entity_type} #{r.entity_id}</span>
                </div>
              </>
            )}
          />
        </div>
      )}
    </GlassCard>
  );
}
