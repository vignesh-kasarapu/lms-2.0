export default function HeroBadge() {
  return (
    <span
      className="inline-flex items-center gap-2.5 self-start px-4 py-1.5 rounded-full text-[13px] font-medium"
      style={{
        color: '#A78BFA',
        background: 'rgba(109,76,255,0.06)',
        border: '1px solid rgba(109,76,255,0.45)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 0 20px rgba(109,76,255,0.15)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-premium-purple shadow-[0_0_8px_rgba(109,76,255,0.9)]" />
      Simple&nbsp;&nbsp;·&nbsp;&nbsp;Transparent&nbsp;&nbsp;·&nbsp;&nbsp;Efficient
      <span className="w-1.5 h-1.5 rounded-full bg-premium-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
    </span>
  );
}
