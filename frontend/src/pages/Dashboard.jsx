import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, CalendarClock, PlaneTakeoff, Sparkles, Calendar, ChevronRight } from 'lucide-react';
import { getDashboard } from '../api/employees';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { PrimaryButton, GhostButton } from '../components/common/GlassButton';
import Topbar from '../components/layout/Topbar';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    getDashboard().then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const firstName = user?.employee?.full_name?.split(' ')[0] || 'Employee';

  return (
    <>
      <Topbar title="Dashboard" />

      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-6 rounded-2xl glass-panel-strong relative overflow-hidden bg-gradient-to-r from-aurora-violet/15 via-indigo-600/10 to-aurora-cyan/10 border border-white/10"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-aurora-cyan text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Workspace Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Good day, {firstName}!
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track your leave balances, view upcoming scheduled time off, and manage your leave requests smoothly.
            </p>
          </div>
          <Link to="/apply">
            <PrimaryButton className="!py-3 !px-6 text-sm shadow-glow font-bold shrink-0">
              <PlaneTakeoff className="w-4 h-4" /> Apply for leave
            </PrimaryButton>
          </Link>
        </div>
      </motion.div>

      {data?.withdrawalWindow && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass-panel-strong border-status-advance/40 p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-status-advance shrink-0" />
          <p className="text-sm text-slate-200">
            An advance-leave request was rejected. You can still withdraw it before loss of pay applies.
          </p>
          <Link to={`/my-requests`} className="ml-auto text-sm font-semibold text-status-advance hover:underline whitespace-nowrap">
            Review Request →
          </Link>
        </motion.div>
      )}

      {/* Balance Cards Grid with Circular Gauges — 4 cards in 1 row on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading && [1, 2, 3, 4].map((i) => <GlassCard key={i} className="h-44 animate-pulse" />)}
        {data?.balances?.map(({ leaveType, effectiveBalance, ledgerBalance, committedToOpenRequests }) => {
          const maxDays = Math.max(ledgerBalance || 20, 1);
          const percent = Math.min(Math.round((effectiveBalance / maxDays) * 100), 100);
          const radius = 26;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <GlassCard key={leaveType.leave_type_id} className="relative overflow-hidden group hover:border-aurora-violet/40 transition-all !p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{leaveType.type_name}</p>
                  <p className="text-4xl font-display font-black text-white mt-1.5 leading-none">
                    {effectiveBalance.toFixed(1)}
                    <span className="text-xs font-bold text-slate-400 ml-1 block mt-1">days available</span>
                  </p>
                </div>
                {/* Circular Gauge SVG */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle cx="28" cy="28" r={22} className="text-white/10" strokeWidth="5" stroke="currentColor" fill="transparent" />
                    <circle
                      cx="28" cy="28" r={22}
                      className="text-aurora-cyan transition-all duration-1000 ease-out"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 - (percent / 100) * (2 * Math.PI * 22)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-white">{percent}%</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Accrued Total</span>
                  <span className="text-slate-100 font-extrabold text-sm">{ledgerBalance.toFixed(1)} days</span>
                </div>
                <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">In Review</span>
                  <span className="text-slate-100 font-extrabold text-sm">{committedToOpenRequests.toFixed(1)} days</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pending Requests */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-status-pending" />
              <h2 className="font-display font-bold text-slate-100 text-base">Pending Decisions</h2>
            </div>
            <Link to="/my-requests" className="text-xs font-semibold text-aurora-violet hover:text-aurora-cyan flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!data?.pending?.length ? (
            <EmptyState icon={CalendarClock} title="No pending requests" description="Leave applications awaiting review will show up here." />
          ) : (
            <div className="space-y-2">
              {data.pending.map((r) => (
                <div key={r.request_id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{r.start_date} → {r.end_date}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.deducted_days || 1} working day(s)</p>
                  </div>
                  <StatusBadge state={r.state} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Upcoming Approved Leaves Timeline */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-aurora-cyan" />
              <h2 className="font-display font-bold text-slate-100 text-base">Upcoming Leaves</h2>
            </div>
            <Link to="/team-calendar" className="text-xs font-semibold text-aurora-cyan hover:underline flex items-center gap-1">
              Team Calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!data?.upcoming?.length ? (
            <EmptyState icon={PlaneTakeoff} title="No upcoming leaves scheduled" description="Approved leave dates starting soon will be listed here." />
          ) : (
            <div className="space-y-2 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10 pl-6">
              {data.upcoming.map((r) => (
                <div key={r.request_id} className="relative flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-aurora-cyan ring-4 ring-void-900" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">{r.start_date} → {r.end_date}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.deducted_days || 1} day(s) approved</p>
                  </div>
                  <StatusBadge state={r.state} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
