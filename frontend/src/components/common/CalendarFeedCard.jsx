import { useState } from 'react';
import { CalendarPlus, Copy, Check } from 'lucide-react';
import { subscribeCalendarFeed } from '../../api/calendarFeed';
import { useAuth } from '../../context/AuthContext';
import GlassCard from './GlassCard';
import { PrimaryButton } from './GlassButton';

export default function CalendarFeedCard() {
  const { hasRole } = useAuth();
  const [url, setUrl] = useState(null);
  const [scope, setScope] = useState('OWN');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    try {
      const res = await subscribeCalendarFeed(scope);
      setUrl(res.data.url);
      setCopied(false);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-1">
        <CalendarPlus className="w-4 h-4 text-aurora-cyan" />
        <h3 className="font-display font-bold text-slate-100 text-sm">Subscribe in Outlook</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">Get your approved leave as a calendar feed you can subscribe to from Outlook or any calendar app.</p>

      {!url ? (
        <div className="flex gap-2">
          {hasRole('MANAGER', 'HR_ADMIN') && (
            <select className="glass-input !py-2 text-xs w-32" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="OWN">Just me</option>
              <option value="TEAM">My team</option>
            </select>
          )}
          <PrimaryButton onClick={subscribe} disabled={loading} className="!py-2 text-xs">
            {loading ? 'Generating…' : 'Generate feed link'}
          </PrimaryButton>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2">
          <code className="text-xs text-slate-400 truncate flex-1">{url}</code>
          <button onClick={copy} className="text-aurora-violet shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </GlassCard>
  );
}
