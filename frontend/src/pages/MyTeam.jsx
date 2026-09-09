import { useEffect, useState } from 'react';
import { Users, Search, UserCheck, Shield, Sparkles, Award } from 'lucide-react';
import { getMyTeam } from '../api/employees';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import StandingWatcherControl from '../components/common/StandingWatcherControl';
import Topbar from '../components/layout/Topbar';

export default function MyTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Apply manager/HR theme (emerald green accent) to body
    document.body.classList.add('theme-hr');
    getMyTeam()
      .then((res) => setTeam(res.data))
      .finally(() => setLoading(false));

    return () => document.body.classList.remove('theme-hr');
  }, []);

  const filteredTeam = team.filter(({ employee }) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      employee.full_name?.toLowerCase().includes(query) ||
      employee.designation?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Topbar title="My Team Management" />

      {/* Team Header & Stats Bar */}
      <div className="glass-panel-hr p-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                My Team Directory & Balances
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                {team.length} Direct & Indirect Members
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Overview of employees reporting to you, their leave balances, and standing watcher assignments.
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10 !py-2 text-xs w-full focus:border-emerald-500/60 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl glass-panel animate-pulse p-4 space-y-3" />
          ))}
        </div>
      ) : !filteredTeam.length ? (
        <GlassCard>
          <EmptyState
            icon={Users}
            title={search ? 'No team members match your search' : 'No team members assigned'}
            description={search ? 'Try clearing your search query to see all team members.' : 'Employees reporting to you, at any depth, will appear here.'}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeam.map(({ employee, balances }) => {
            const initials = employee.full_name?.slice(0, 2).toUpperCase() || 'EMP';
            return (
              <div
                key={employee.employee_id}
                className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
              >
                <div>
                  {/* Team Member Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-400/30">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-100 text-base leading-snug">
                          {employee.full_name}
                        </h3>
                        <p className="text-xs text-emerald-400 font-medium">
                          {employee.designation || 'Team Member'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      ID #{employee.employee_id}
                    </span>
                  </div>

                  {/* Leave Balances Section - All Fields in Right & Green */}
                  <div className="py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Available Balances</span>
                      <span className="text-emerald-400 text-[10px]">Effective Days</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {balances.map((b) => (
                        <div
                          key={b.leaveType}
                          className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-xl text-center hover:border-emerald-500/40 transition-colors"
                        >
                          <p className="text-[10px] text-emerald-300 font-semibold truncate">
                            {b.leaveType}
                          </p>
                          <p
                            className={`text-sm font-extrabold mt-0.5 ${
                              b.effectiveBalance < 0
                                ? 'text-status-advance font-black'
                                : 'text-emerald-400'
                            }`}
                          >
                            {b.effectiveBalance.toFixed(1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Standing Watcher Control Footer */}
                <div className="pt-3 border-t border-white/10">
                  <StandingWatcherControl
                    employeeId={employee.employee_id}
                    employeeName={employee.full_name}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

