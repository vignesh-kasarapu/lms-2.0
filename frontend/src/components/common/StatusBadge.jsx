const STATE_META = {
  DRAFT: { label: 'Draft', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  PENDING_MANAGER: { label: 'Pending manager', color: 'bg-status-pending/15 text-status-pending border-status-pending/30' },
  PENDING_HR: { label: 'Pending HR', color: 'bg-status-pending/15 text-status-pending border-status-pending/30' },
  APPROVED: { label: 'Approved', color: 'bg-status-approved/15 text-status-approved border-status-approved/30' },
  REJECTED: { label: 'Rejected', color: 'bg-status-rejected/15 text-status-rejected border-status-rejected/30' },
  REJECTED_PENDING_WITHDRAWAL: { label: 'Rejected — withdrawal window', color: 'bg-status-advance/15 text-status-advance border-status-advance/30' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  LOP_APPLIED: { label: 'Loss of pay', color: 'bg-status-advance/15 text-status-advance border-status-advance/30' },
  CANCELLATION_REQUESTED: { label: 'Cancellation requested', color: 'bg-status-info/15 text-status-info border-status-info/30' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export default function StatusBadge({ state }) {
  const meta = STATE_META[state] || { label: state, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}>
      {meta.label}
    </span>
  );
}
