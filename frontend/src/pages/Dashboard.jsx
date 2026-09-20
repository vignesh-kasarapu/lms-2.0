import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowUpRight, CalendarClock, PlaneTakeoff, Calendar, ChevronRight,
  ShieldCheck, ListChecks, Stethoscope, Zap, HeartHandshake, CalendarPlus2,
} from 'lucide-react';
import { getDashboard } from '../api/employees';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { PrimaryButton } from '../components/common/GlassButton';
import Topbar from '../components/layout/Topbar';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const LEAVE_TYPE_ICON = {
  ANNUAL: PlaneTakeoff,
  SICK: Stethoscope,
  CASUAL: Zap,
  MATERNITY: HeartHandshake,
  BEREAVEMENT: HeartHandshake,
  COMP_OFF: CalendarPlus2,
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, hasRole } = useAuth();
  const isApprover = hasRole('MANAGER', 'HR_ADMIN');

  useEffect(() => {
    getDashboard().then((res) => setData(res.data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const firstName = user?.employee?.full_name?.split(' ')[0] || 'Employee';
  const primaryBalance = data?.balances?.[0];
  const pendingCount = data?.pending?.length || 0;

  return (
    <>
      <Topbar title="Dashboard" />

      {/* Greeting + primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="greet">Good day, {firstName}!</h1>
          <p>Track your leave balances, view upcoming scheduled time off, and manage your leave requests smoothly.</p>
        </div>
        <Link to="/apply" className="shrink-0">
          <PrimaryButton>
            <PlaneTakeoff className="w-4 h-4" /> Apply for leave
          </PrimaryButton>
        </Link>
      </motion.div>

      {error && (
        <div className="alert alert--danger mb-6" role="alert">
          <AlertTriangle />
          <p>Couldn&apos;t load your dashboard: {error}</p>
        </div>
      )}

      {data?.withdrawalWindow && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert alert--warning mb-6"
          role="status"
        >
          <AlertTriangle />
          <p>An advance-leave request was rejected. You can still withdraw it before loss of pay applies.</p>
          <div className="actions">
            <Link to="/my-requests" className="btn btn--sm btn--secondary">Review request</Link>
          </div>
        </motion.div>
      )}

      {/* Quick-action cards — tinted 1/2/3 in order, whole card is one link (theme.md §3) */}
      <div className="cards mb-6">
        <Link to="/apply" className="card card--1">
          <span className="ico"><PlaneTakeoff /></span>
          <h3>Apply for leave</h3>
          <p>
            {primaryBalance ? `${primaryBalance.effectiveBalance.toFixed(1)} days of ${primaryBalance.leaveType.type_name} available.` : 'Submit a new leave request.'}
          </p>
          <span className="arrow"><ChevronRight /></span>
        </Link>

        {isApprover ? (
          <Link to="/approvals" className="card card--2">
            <span className="ico"><ShieldCheck /></span>
            <h3>Needs your decision</h3>
            <p>Review leave requests waiting from your team.</p>
            <span className="arrow"><ChevronRight /></span>
          </Link>
        ) : (
          <Link to="/my-requests" className="card card--2">
            <span className="ico"><ListChecks /></span>
            <h3>My requests</h3>
            <p>{pendingCount} request(s) awaiting a decision.</p>
            <span className="arrow"><ChevronRight /></span>
          </Link>
        )}

        <Link to="/team-calendar" className="card card--3">
          <span className="ico"><Calendar /></span>
          <h3>Team calendar</h3>
          <p>See who else is on leave across your team.</p>
          <span className="arrow"><ChevronRight /></span>
        </Link>
      </div>

      {/* Stat tiles — plain surface, icon chip + tabular number + label per leave type */}
      <div className="tiles mb-6">
        {loading && [1, 2, 3, 4].map((i) => <div key={i} className="skel" style={{ minHeight: 68, borderRadius: 'var(--radius-md)' }} />)}
        {data?.balances?.map(({ leaveType, effectiveBalance }) => {
          const Icon = LEAVE_TYPE_ICON[leaveType.type_code] || Calendar;
          return (
            <div key={leaveType.leave_type_id} className="tile">
              <span className="ico"><Icon /></span>
              <div>
                <b className="num">{effectiveBalance.toFixed(1)}</b>
                <span>{leaveType.type_name} available</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row2 mb-6">
        {/* Pending Requests */}
        <GlassCard>
          <div className="panel-head">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-accent-text" />
              <h2 className="h2">Pending decisions</h2>
            </div>
            <Link to="/my-requests" className="small flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!data?.pending?.length ? (
            <EmptyState icon={CalendarClock} title="No pending requests" description="Leave applications awaiting review will show up here." />
          ) : (
            <ul className="list">
              {data.pending.map((r) => (
                <li key={r.request_id}>
                  <span className="date num">{r.start_date} → {r.end_date}</span>
                  <span>{r.deducted_days || 1} working day(s)</span>
                  <StatusBadge state={r.state} />
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Upcoming Approved Leaves */}
        <GlassCard>
          <div className="panel-head">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-text" />
              <h2 className="h2">Upcoming leaves</h2>
            </div>
            <Link to="/team-calendar" className="small flex items-center gap-1">
              Team calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!data?.upcoming?.length ? (
            <EmptyState icon={PlaneTakeoff} title="No upcoming leaves scheduled" description="Approved leave dates starting soon will be listed here." />
          ) : (
            <ul className="list">
              {data.upcoming.map((r) => (
                <li key={r.request_id}>
                  <span className="date num">{r.start_date} → {r.end_date}</span>
                  <span>{r.deducted_days || 1} day(s) approved</span>
                  <StatusBadge state={r.state} />
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </>
  );
}
