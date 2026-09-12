import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, Sparkles, Inbox, Clock, ChevronRight, ArrowLeft, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    listNotifications()
      .then((res) => setNotifications(res.data))
      .catch(() => {});
    getUnreadCount()
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open) {
      setSelectedNotification(null);
      load();
    }
    setOpen((o) => !o);
  };

  const inspectNotification = async (n, e) => {
    if (e) e.stopPropagation();
    if (!n.read_at) {
      try {
        await markNotificationRead(n.notification_id);
      } catch {
        // Non-critical — still open the notification even if marking it read failed.
      }
    }
    setSelectedNotification(n);
    load();
  };

  const handleNavigateToRequest = (n) => {
    setOpen(false);
    setSelectedNotification(null);
    if (n.related_request_id) {
      navigate(`/my-requests/${n.related_request_id}`);
    } else {
      navigate('/my-requests');
    }
  };

  const markAll = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsRead();
    } catch {
      // Non-critical — the periodic poll will pick the real state back up regardless.
    }
    load();
  };

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.read_at)
    : notifications;

  return (
    <>
      <button
        onClick={toggleOpen}
        type="button"
        className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/[0.06] border border-white/20 flex items-center justify-center hover:bg-white/[0.14] hover:border-aurora-violet/60 transition-all shadow-md active:scale-95 cursor-pointer z-20 shrink-0"
        title="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-ink-50" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] px-1 sm:px-1.5 rounded-full bg-aurora-violet text-white text-[10px] sm:text-xs font-black flex items-center justify-center ring-2 ring-void-950 shadow-glow animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Silver Full-Page Modal Portal with Heavy Background Blur */}
      {open &&
        createPortal(
          <div className="theme-frozen fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 pointer-events-auto">
            {/* Backdrop layer blurs out the entire background dashboard */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xl transition-all duration-300"
              onClick={() => {
                setOpen(false);
                setSelectedNotification(null);
              }}
            />

            {/* Silver Metallic Modal Box */}
            <div className="relative w-full max-w-4xl h-[85vh] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-900 border-2 border-slate-300/80 shadow-[0_25px_80px_rgba(0,0,0,0.65)] rounded-3xl flex flex-col overflow-hidden z-[100000] animate-in zoom-in-95 duration-200">
              {/* Silver Metallic Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-slate-300 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  {selectedNotification ? (
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer mr-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Inbox
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                      <Bell className="w-6 h-6 text-aurora-cyan" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">
                        {selectedNotification ? 'Notification Details' : 'Notification Center'}
                      </h2>
                      {!selectedNotification && unreadCount > 0 && (
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-aurora-violet text-white shadow-md">
                          {unreadCount} UNREAD
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {selectedNotification ? 'Review notification metadata and details' : 'Stay updated with real-time leave approvals and system alerts'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!selectedNotification && (
                    <>
                      {/* Filter Pills */}
                      <div className="flex items-center bg-slate-300/80 p-1 rounded-xl border border-slate-400/40 text-xs font-bold">
                        <button
                          onClick={() => setFilterUnreadOnly(false)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            !filterUnreadOnly
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'text-slate-700 hover:text-slate-900'
                          }`}
                        >
                          All ({notifications.length})
                        </button>
                        <button
                          onClick={() => setFilterUnreadOnly(true)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            filterUnreadOnly
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'text-slate-700 hover:text-slate-900'
                          }`}
                        >
                          Unread ({unreadCount})
                        </button>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAll}
                          type="button"
                          className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4 text-emerald-400" /> Mark All Read
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      setOpen(false);
                      setSelectedNotification(null);
                    }}
                    type="button"
                    className="p-2 rounded-xl bg-slate-300/80 hover:bg-slate-400/80 text-slate-800 transition-all cursor-pointer shadow-sm"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-200/60 to-slate-300/80">
                {selectedNotification ? (
                  /* Detail Inspector Card */
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-aurora-violet bg-aurora-violet/10 px-3 py-1 rounded-full border border-aurora-violet/20 inline-block mb-2">
                          System Notification
                        </span>
                        <h3 className="text-2xl font-display font-black text-slate-900">{selectedNotification.subject}</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" /> Sent {timeAgo(selectedNotification.created_at)} ({new Date(selectedNotification.created_at).toLocaleString()})
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Message Content</h4>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-base font-medium text-slate-800 leading-relaxed">
                        {selectedNotification.body || selectedNotification.subject}
                      </div>
                    </div>

                    <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 uppercase">Related Request Record</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {selectedNotification.related_request_id
                            ? `Request Reference ID: #${selectedNotification.related_request_id}`
                            : 'This notification is tied to your employee leave account.'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleNavigateToRequest(selectedNotification)}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
                      >
                        View My Requests <ExternalLink className="w-4 h-4 text-aurora-cyan" />
                      </button>
                    </div>

                    <div className="pt-2 flex justify-start">
                      <button
                        onClick={() => setSelectedNotification(null)}
                        className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
                      >
                        ← Return to Notification List
                      </button>
                    </div>
                  </div>
                ) : !displayedNotifications.length ? (
                  <div className="py-24 text-center px-4">
                    <Inbox className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-70" />
                    <h3 className="text-xl font-black text-slate-800">No Notifications Found</h3>
                    <p className="text-sm font-semibold text-slate-600 mt-1">
                      {filterUnreadOnly ? 'You have read all your notifications!' : 'Your notification inbox is currently clear.'}
                    </p>
                  </div>
                ) : (
                  displayedNotifications.map((n) => (
                    <div
                      key={n.notification_id}
                      onClick={(e) => inspectNotification(n, e)}
                      className={`group w-full p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 shadow-sm ${
                        !n.read_at
                          ? 'bg-white border-aurora-violet/50 shadow-md ring-1 ring-aurora-violet/30'
                          : 'bg-slate-100/90 border-slate-300/80 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${!n.read_at ? 'bg-aurora-violet shadow-glow' : 'bg-slate-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-extrabold text-slate-900 leading-snug">{n.subject}</h4>
                            {!n.read_at && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-aurora-violet/10 text-aurora-violet border border-aurora-violet/30">
                                New
                              </span>
                            )}
                          </div>
                          {n.body && (
                            <p className="text-sm font-medium text-slate-700 mt-1.5 line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-2.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{timeAgo(n.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => inspectNotification(n, e)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs group-hover:bg-aurora-violet transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
