import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { signOut } from '../../api/auth';
import NotificationBell from '../common/NotificationBell';
import { ShieldCheck, UserCheck, Sparkles, ChevronDown, LogOut, Mail, Briefcase, IdCard, X, Building, CheckCircle2, User, AlertTriangle, Sun, Moon } from 'lucide-react';

export default function Topbar({ title }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  const isHrAdmin = user?.roles?.includes('HR_ADMIN');
  const isManager = user?.roles?.includes('MANAGER');

  // Close profile modal on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setShowLogoutConfirm(false);
      }
    };

    if (isProfileOpen || showLogoutConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen, showLogoutConfirm]);

  const confirmAndLogout = async () => {
    try {
      // Clears the httpOnly session cookie server-side (LMS-007) — without this call the
      // cookie survives a client-side reload and the same user is signed straight back in.
      await signOut();
    } catch {
      // Proceed regardless (e.g. session already expired/invalid) — every user should still
      // land back on the login page below, not get stuck.
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const emp = user?.employee || {};
  const initials = emp.full_name?.slice(0, 2).toUpperCase() || 'EX';

  return (
    <header className="glass-panel flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 mb-6 sticky top-0 z-40">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <h1 className="text-base sm:text-2xl font-display font-extrabold text-ink-50 tracking-tight truncate">{title}</h1>
        {isHrAdmin ? (
          <span className="role-badge-admin hidden md:inline-flex text-xs font-bold px-3 py-1 items-center gap-1.5 shadow-md shadow-indigo-500/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-300" /> HR Admin Portal
          </span>
        ) : isManager ? (
          <span className="role-badge-hr hidden md:inline-flex text-xs font-bold px-3 py-1 items-center gap-1.5 shadow-md shadow-emerald-500/20 shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-300" /> Manager Portal
          </span>
        ) : (
          <span className="role-badge-employee hidden md:inline-flex text-xs font-bold px-3 py-1 items-center gap-1.5 shadow-md shadow-cyan-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-300" /> Employee Workspace
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-5 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-frost/[0.06] border border-frost/20 flex items-center justify-center hover:bg-frost/[0.14] hover:border-aurora-violet/60 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-ink-50" strokeWidth={2.2} /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-ink-50" strokeWidth={2.2} />}
        </button>
        <NotificationBell />

        {/* Profile Trigger Container */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-1.5 sm:gap-3 sm:pl-4 sm:border-l border-frost/15 hover:bg-frost/5 p-1 sm:p-1.5 rounded-2xl transition-all border border-transparent hover:border-frost/10 group focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            title="Click to view full user profile & settings"
            aria-expanded={isProfileOpen}
          >
            <div className="relative shrink-0">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white shadow-lg transition-transform group-hover:scale-105 ${
                isHrAdmin
                  ? 'bg-gradient-to-br from-indigo-500 to-amber-500 ring-2 ring-indigo-400/30'
                  : isManager
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 ring-2 ring-emerald-400/30'
                  : 'bg-gradient-to-br from-aurora-violet to-aurora-cyan ring-2 ring-cyan-400/30'
              }`}>
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 ring-2 ring-void-950 animate-pulse" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-ink-50 leading-none group-hover:text-emerald-300 transition-colors">
                {emp.full_name || 'User Profile'}
              </p>
              <p className="text-xs text-ink-300 font-semibold leading-none mt-1.5">
                {emp.designation || 'Staff'}
              </p>
            </div>
            <ChevronDown className={`hidden sm:block w-4 h-4 text-ink-400 transition-transform duration-200 shrink-0 ${isProfileOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-ink-50'}`} />
          </button>

          {/* Profile Pop-Up Modal Card */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-3rem)] max-w-80 sm:max-w-96 rounded-3xl glass-panel p-5 shadow-2xl border border-frost/20 z-50 animate-in fade-in slide-in-from-top-3 duration-200 backdrop-blur-2xl bg-ink-950/90 text-ink-100">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-frost/10">
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-xl ${
                    isHrAdmin
                      ? 'bg-gradient-to-br from-indigo-500 to-amber-500 ring-2 ring-indigo-400/50'
                      : isManager
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 ring-2 ring-emerald-400/50'
                      : 'bg-gradient-to-br from-aurora-violet to-aurora-cyan ring-2 ring-cyan-400/50'
                  }`}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-50 flex items-center gap-1.5">
                      {emp.full_name || 'User'}
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">{emp.designation || 'Team Member'}</p>
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 mt-1 rounded bg-frost/10 text-ink-300 border border-frost/10">
                      ID: {emp.employee_id || 'N/A'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1.5 rounded-full text-ink-400 hover:text-ink-50 hover:bg-frost/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Roles Badges Row */}
              <div className="py-3 border-b border-frost/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">Assigned System Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {user?.roles?.map((role) => (
                    <span
                      key={role}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                        role === 'HR_ADMIN'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : role === 'MANAGER'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      {role}
                    </span>
                  )) || (
                    <span className="text-xs text-ink-400">Standard User</span>
                  )}
                </div>
              </div>

              {/* Identity & Work Information */}
              <div className="py-3 space-y-2.5 border-b border-frost/10 text-xs">
                {emp.email && (
                  <div className="flex items-center gap-2 text-ink-300">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate font-mono">{emp.email}</span>
                  </div>
                )}
                {emp.entra_oid && (
                  <div className="flex items-center gap-2 text-ink-400">
                    <IdCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">Entra: {emp.entra_oid}</span>
                  </div>
                )}
                {emp.supervisor && (
                  <div className="flex items-center gap-2 text-ink-300">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Reports to: <strong className="text-ink-100">{emp.supervisor.full_name}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-ink-300">
                  <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Status: <strong className="text-emerald-400">Active Account</strong></span>
                </div>
              </div>

              {/* Pop-Up Footer Actions */}
              <div className="pt-3">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white font-bold text-xs border border-red-500/30 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20"
                >
                  <LogOut className="w-4 h-4" /> Sign Out of Workspace
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal Dialog */}
      {showLogoutConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-red-500/30 bg-ink-950/95 text-ink-100 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3.5 text-red-400">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                  <LogOut className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-ink-50">Sign Out Confirmation</h3>
                  <p className="text-xs text-ink-300">End active session & logout of workspace</p>
                </div>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed bg-frost/[0.02] p-3 rounded-xl border border-frost/5">
                Are you sure you want to sign out of your LMS session? Any unsaved form progress or draft details will be lost.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="ghost-btn flex-1 !py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Yes, Sign Out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}


