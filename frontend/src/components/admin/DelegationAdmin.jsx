import { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { listAllDelegations } from '../../api/delegations';
import GlassCard from '../common/GlassCard';
import EmptyState from '../common/EmptyState';

export default function DelegationAdmin() {
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { listAllDelegations().then((res) => setDelegations(res.data)).finally(() => setLoading(false)); }, []);

  return (
    <GlassCard>
      <h3 className="font-display font-bold text-slate-100 mb-1 flex items-center gap-2">
        <UserCog className="w-4 h-4 text-aurora-violet" /> All delegations
      </h3>
      <p className="text-xs text-slate-500 mb-4">Org-wide visibility — every delegation set by every Manager, active or past.</p>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
      ) : !delegations.length ? (
        <EmptyState icon={UserCog} title="No delegations exist yet" />
      ) : (
        <div className="divide-y divide-white/5">
          {delegations.map((d) => (
            <div key={d.delegation_id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-100">{d.nominator?.full_name} → {d.delegate?.full_name}</p>
                <p className="text-xs text-slate-500">{d.from_date} to {d.to_date}{d.revoked_at ? ' · revoked' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
