import { CalendarCheck2, Zap, Users, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: CalendarCheck2, primary: 'Easy', secondary: 'Leave Requests' },
  { icon: Zap, primary: 'Fast', secondary: 'Approvals' },
  { icon: Users, primary: 'Team', secondary: 'Visibility' },
  { icon: ShieldCheck, primary: 'Secure &', secondary: 'Reliable' },
];

export default function FeatureHighlights() {
  return (
    <div className="flex flex-wrap items-stretch">
      {FEATURES.map(({ icon: Icon, primary, secondary }, i) => (
        <div key={secondary} className="flex items-center">
          <div className="flex items-center gap-3 pr-6">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(139,92,246,0.10)',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 0 16px rgba(139,92,246,0.15)',
                color: '#A78BFA',
              }}
            >
              <Icon size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-[13.5px] font-medium" style={{ color: '#CBD5E1' }}>{primary}</p>
              <p className="text-[13.5px]" style={{ color: '#94A3B8' }}>{secondary}</p>
            </div>
          </div>
          {i < FEATURES.length - 1 && (
            <div className="hidden sm:block w-px h-9 mr-6" style={{ background: 'rgba(148,163,184,0.15)' }} />
          )}
        </div>
      ))}
    </div>
  );
}
