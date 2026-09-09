export default function Header() {
  return (
    <div className="absolute top-[38px] left-[70px] hidden lg:flex items-center gap-4 z-10">
      <div
        className="w-11 h-11 rounded-xl shrink-0"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #6366F1, #22D3EE)',
          boxShadow: '0 0 24px rgba(109,76,255,0.35), 0 4px 14px rgba(0,0,0,0.35)',
        }}
      />
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[18px] font-display font-bold text-premium-text leading-none">LMS 2.0</p>
        </div>
        <div className="w-px h-6" style={{ background: 'rgba(148,163,184,0.25)' }} />
        <p className="text-[15px] text-premium-textMuted leading-none">Leave Management System</p>
      </div>
    </div>
  );
}
