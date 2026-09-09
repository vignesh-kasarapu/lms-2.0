import { ShieldCheck } from 'lucide-react';

function MicrosoftLogo() {
  // Real four-color Microsoft logo, not a stand-in glyph.
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function LMSLogo() {
  return (
    <div
      className="w-16 h-16 rounded-2xl mx-auto mb-6"
      style={{
        background: 'linear-gradient(135deg, #7C3AED, #6366F1, #22D3EE)',
        boxShadow: '0 0 44px rgba(109,76,255,0.35), 0 8px 24px rgba(0,0,0,0.35)',
      }}
    />
  );
}

export default function LoginCard() {
  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      {/* ambient glow behind the card: purple left, cyan right */}
      <div
        className="absolute -inset-10 -z-10"
        style={{
          background:
            'radial-gradient(closest-side, rgba(109,76,255,0.22), transparent 70%) 0% 50% / 55% 100% no-repeat, radial-gradient(closest-side, rgba(34,211,238,0.16), transparent 70%) 100% 50% / 55% 100% no-repeat',
          filter: 'blur(50px)',
        }}
      />

      <div
        className="relative px-9 py-10 text-center"
        style={{
          background: 'rgba(17,24,39,0.60)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '28px',
          boxShadow:
            '0 30px 90px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(139,92,246,0.10), inset -1px -1px 0 rgba(34,211,238,0.08)',
        }}
      >
        <LMSLogo />

        <h1 className="text-[30px] font-display font-bold text-premium-text leading-none">LMS 2.0</h1>
        <p className="text-[14px] text-premium-textMuted mt-2">Leave Management System</p>

        <div className="h-px my-7" style={{ background: 'rgba(255,255,255,0.10)' }} />

        <p className="font-display font-semibold" style={{ fontSize: '25px', color: '#A78BFA' }}>Welcome!</p>
        <p className="text-[14px] text-premium-textMuted mt-2 mb-8 leading-relaxed">
          Sign in with your Microsoft account
          <br />
          to continue
        </p>

        <a
          href="/api/auth/login"
          className="group flex items-center justify-center gap-3 w-full transition-all duration-150"
          style={{
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(90deg, #743CFF, #6350F5, #32C9E8)',
            boxShadow: '0 10px 35px rgba(109,76,255,0.35)',
            color: '#F8FAFC',
            fontSize: '15px',
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 14px 42px rgba(109,76,255,0.48)';
            e.currentTarget.style.filter = 'brightness(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 35px rgba(109,76,255,0.35)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </a>

        {import.meta.env.DEV && (
          <a
            href="/api/auth/dev-login"
            className="block mt-3 text-sm text-premium-textMuted hover:text-white transition-colors"
          >
            Use local demo account (EMP001)
          </a>
        )}

        <p className="text-[12.5px] text-premium-textFaint mt-6">
          Trouble signing in? Contact your HR administrator.
        </p>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-premium-textFaint mt-5">
          <ShieldCheck size={13} />
          Secure login powered by Microsoft Entra ID
        </div>
      </div>
    </div>
  );
}
