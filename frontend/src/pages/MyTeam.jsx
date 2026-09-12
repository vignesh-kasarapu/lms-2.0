import { useEffect, useState } from 'react';
import { Users, Search, AlertTriangle } from 'lucide-react';
import { getMyTeam } from '../api/employees';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import Table from '../components/common/Table';
import StandingWatcherControl from '../components/common/StandingWatcherControl';
import Topbar from '../components/layout/Topbar';

const COLUMNS = [
  { label: 'Employee' },
  { label: 'Designation' },
  { label: 'Balances' },
  { label: 'Standing Watcher' },
];

export default function MyTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Apply manager/HR theme (emerald green accent) to body
    document.body.classList.add('theme-hr');
    getMyTeam()
      .then((res) => setTeam(res.data))
      .catch((err) => setError(err.message))
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
            <p className="text-xs text-ink-300 mt-0.5">
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
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 rounded-xl glass-panel animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <GlassCard>
          <EmptyState icon={AlertTriangle} title="Couldn't load your team" description={error} />
        </GlassCard>
      ) : !filteredTeam.length ? (
        <GlassCard>
          <EmptyState
            icon={Users}
            title={search ? 'No team members match your search' : 'No team members assigned'}
            description={search ? 'Try clearing your search query to see all team members.' : 'Employees reporting to you, at any depth, will appear here.'}
          />
        </GlassCard>
      ) : (
        <>
          {/* Desktop / tablet: full data table */}
          <div className="hidden md:block">
            <Table columns={COLUMNS}>
              {filteredTeam.map(({ employee, balances }) => {
                const initials = employee.full_name?.slice(0, 2).toUpperCase() || 'EMP';
                return (
                  <tr key={employee.employee_id} className="hover:bg-frost/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-400/30 shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-display font-bold text-ink-100 text-sm leading-snug">{employee.full_name}</p>
                          <p className="text-[10px] font-mono text-ink-500">ID #{employee.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-400 font-medium whitespace-nowrap">
                      {employee.designation || 'Team Member'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {balances.map((b) => (
                          <span
                            key={b.leaveType}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 whitespace-nowrap"
                          >
                            {b.leaveType}:{' '}
                            <strong className={b.effectiveBalance < 0 ? 'text-status-advance' : 'text-emerald-200'}>
                              {b.effectiveBalance.toFixed(1)}
                            </strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StandingWatcherControl employeeId={employee.employee_id} employeeName={employee.full_name} />
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>

          {/* Mobile: one card per person, stacked info — no horizontal scrolling
              needed to see designation/balances/watcher for a given team member */}
          <div className="md:hidden space-y-3">
            {filteredTeam.map(({ employee, balances }) => {
              const initials = employee.full_name?.slice(0, 2).toUpperCase() || 'EMP';
              return (
                <div key={employee.employee_id} className="glass-panel rounded-2xl border border-frost/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-400/30 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-ink-100 text-sm leading-snug truncate">{employee.full_name}</p>
                      <p className="text-[11px] text-emerald-400 font-medium truncate">{employee.designation || 'Team Member'}</p>
                    </div>
                  </div>

                  {balances.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {balances.map((b) => (
                        <span
                          key={b.leaveType}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 whitespace-nowrap"
                        >
                          {b.leaveType}:{' '}
                          <strong className={b.effectiveBalance < 0 ? 'text-status-advance' : 'text-emerald-200'}>
                            {b.effectiveBalance.toFixed(1)}
                          </strong>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-frost/10">
                    <StandingWatcherControl employeeId={employee.employee_id} employeeName={employee.full_name} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

