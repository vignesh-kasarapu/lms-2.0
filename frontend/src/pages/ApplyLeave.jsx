import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarDays, Paperclip, Sparkles, CheckCircle2, FileText, ArrowRight, PartyPopper, ListChecks } from 'lucide-react';
import { previewApplication, submitRequest, saveDraft, getMyRequests } from '../api/leaveRequests';
import { getDashboard } from '../api/employees';
import { listHolidays, getOptionalHolidaySummary } from '../api/holidays';
import { uploadAttachment } from '../api/attachments';
import { celebrate } from '../utils/celebrate';
import GlassCard from '../components/common/GlassCard';
import { PrimaryButton, GhostButton } from '../components/common/GlassButton';
import Topbar from '../components/layout/Topbar';

const LEAVE_TYPE_META = {
  ANNUAL: { icon: '🌴', desc: 'Paid vacation time' },
  SICK: { icon: '🩺', desc: 'Medical recovery & doctor visits' },
  CASUAL: { icon: '⚡', desc: 'Personal urgent matters' },
  MATERNITY: { icon: '🌸', desc: 'Time for childbirth and recovery' },
  BEREAVEMENT: { icon: '🕊️', desc: 'Time to grieve and support family' },
};

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [typesError, setTypesError] = useState(null);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', isHalfDay: false, halfDayPortion: 'FIRST', reason: '' });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const previewRequestId = useRef(0);

  const selectedType = leaveTypes.find((t) => String(t.id) === String(form.leaveTypeId));

  useEffect(() => {
    getDashboard().then((res) => {
      const dynamicTypes = (res.data.balances || []).map(({ leaveType }) => ({
        id: leaveType.leave_type_id,
        name: leaveType.type_name,
        icon: LEAVE_TYPE_META[leaveType.type_code]?.icon || '📝',
        halfDay: leaveType.permits_half_day,
        attachments: leaveType.permits_attachments,
        desc: LEAVE_TYPE_META[leaveType.type_code]?.desc || 'Organisation leave entitlement',
      }));
      setLeaveTypes(dynamicTypes);
    }).catch(() => setTypesError('Could not load your leave types. Refresh the page to try again.'));
  }, []);

  // A merged, dated view of everything that already occupies an upcoming day — public
  // holidays, optional holidays this employee has opted into, and their own previously
  // applied leave requests — so a date can be sanity-checked here before picking one below,
  // instead of cross-referencing the separate Holiday Calendar and My Requests pages.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const EXCLUDED_STATES = ['DRAFT', 'WITHDRAWN', 'CANCELLED', 'REJECTED'];

    Promise.all([listHolidays(), getMyRequests()])
      .then(async ([holidayRes, requestRes]) => {
        const holidays = holidayRes.data;
        const optionalYearIds = [...new Set(holidays.filter((h) => h.is_optional).map((h) => h.leave_year_id))];
        const summaries = await Promise.all(
          optionalYearIds.map((id) => getOptionalHolidaySummary(id).then((r) => r.data).catch(() => ({ eligibleHolidays: [] }))),
        );
        const selectedOptionalIds = new Set(
          summaries.flatMap((s) => s.eligibleHolidays.filter((h) => h.isSelected).map((h) => h.holiday_id)),
        );

        const holidayItems = holidays
          .filter((h) => h.holiday_date >= today && (!h.is_optional || selectedOptionalIds.has(h.holiday_id)))
          .map((h) => ({ date: h.holiday_date, label: h.holiday_name, type: h.is_optional ? 'OPTIONAL_HOLIDAY' : 'HOLIDAY' }));

        const leaveItems = requestRes.data
          .filter((r) => !EXCLUDED_STATES.includes(r.state) && r.end_date >= today)
          .map((r) => ({
            date: r.start_date,
            label: `${r.LeaveType?.type_name || 'Leave'} · ${r.state.replaceAll('_', ' ').toLowerCase()}`,
            type: 'MY_LEAVE',
          }));

        setUpcoming([...holidayItems, ...leaveItems].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8));
      })
      .catch(() => {}); // non-critical sidebar context — the form itself must still work if this fails
  }, []);

  useEffect(() => {
    if (!form.leaveTypeId || !form.startDate || !form.endDate) { setPreview(null); return; }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      // Guards against an older, slower response overwriting a newer one when the form
      // changes again before the first request resolves — only the latest request's
      // result is ever applied.
      const requestId = ++previewRequestId.current;
      previewApplication({ ...form })
        .then((res) => { if (requestId === previewRequestId.current) setPreview(res.data); })
        .catch((err) => { if (requestId === previewRequestId.current) setError(err.message); })
        .finally(() => { if (requestId === previewRequestId.current) setPreviewLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [form.leaveTypeId, form.startDate, form.endDate, form.isHalfDay]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitRequest(form);
      if (file && selectedType?.attachments) {
        await uploadAttachment(res.data.request_id, file).catch((err) => setError(`Request submitted, but attachment failed: ${err.message}`));
      }
      celebrate();
      navigate('/my-requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await saveDraft(form);
      navigate('/my-requests');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Topbar title="Apply for Leave" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Application Form */}
        <GlassCard className="lg:col-span-3 !p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Leave Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-aurora-cyan mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 1. Select Leave Category
              </label>
              {typesError && (
                <div className="flex items-center gap-2 text-xs font-semibold text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-xl p-3 mb-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {typesError}
                </div>
              )}
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                {leaveTypes.map((t) => {
                  const isSelected = String(form.leaveTypeId) === String(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setForm((f) => ({ ...f, leaveTypeId: t.id }))}
                      className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl text-left border transition-all flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0 sm:justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-aurora-violet/20 to-aurora-cyan/10 border-aurora-violet/60 shadow-[0_0_20px_rgba(139,109,255,0.25)] text-ink-50 sm:scale-[1.02]'
                          : 'bg-frost/[0.03] border-frost/10 text-ink-400 hover:text-ink-200 hover:bg-frost/[0.06]'
                      }`}
                    >
                      <span className="text-lg sm:text-xl sm:mb-1 shrink-0">{t.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-ink-100 truncate">{t.name}</p>
                        <p className="hidden sm:block text-[11px] text-ink-400 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Date Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-aurora-cyan mb-2.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> 2. Schedule Dates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-400 mb-1 block">Start Date</label>
                  <input type="date" className="glass-input" value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-400 mb-1 block">End Date</label>
                  <input type="date" className="glass-input" value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>
            </div>

            {/* Half Day Option */}
            {selectedType?.halfDay && (
              <div className="p-3 rounded-xl bg-frost/[0.02] border border-frost/5 flex items-center justify-between">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-200 cursor-pointer">
                  <input type="checkbox" checked={form.isHalfDay}
                    onChange={(e) => setForm((f) => ({ ...f, isHalfDay: e.target.checked }))}
                    className="w-4 h-4 rounded border-frost/20 bg-frost/5 text-aurora-violet focus:ring-aurora-violet" />
                  Half-day leave duration
                </label>
                {form.isHalfDay && (
                  <select className="glass-input !py-1 text-xs w-36" value={form.halfDayPortion}
                    onChange={(e) => setForm((f) => ({ ...f, halfDayPortion: e.target.value }))}>
                    <option value="FIRST" className="bg-void-900 text-ink-200">First Half (AM)</option>
                    <option value="SECOND" className="bg-void-900 text-ink-200">Second Half (PM)</option>
                  </select>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-aurora-cyan mb-1.5 block">
                3. Reason for Leave
              </label>
              <textarea
                className="glass-input min-h-[95px] resize-none text-sm"
                placeholder="Provide details for your manager to review..."
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                required
              />
            </div>

            {/* Optional Attachment Dropzone */}
            {selectedType?.attachments && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-1.5 block flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Supporting Document (Medical / Official)
                </label>
                <label className="ghost-btn w-full justify-center text-ink-300 border-dashed border-frost/20 hover:border-aurora-violet/50 cursor-pointer py-4">
                  <FileText className="w-4 h-4 text-aurora-violet" />
                  <span className="text-xs font-semibold">{file ? file.name : 'Click to select PDF, PNG or JPEG (Max 10MB)'}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 text-xs font-semibold text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Submission CTAs */}
            <div className="flex items-center gap-3 pt-2">
              <PrimaryButton type="submit" disabled={submitting || !preview} className="!py-3 !px-6 text-sm font-bold shadow-glow">
                {submitting ? 'Submitting Application…' : 'Submit Leave Application'}
              </PrimaryButton>
              <GhostButton type="button" onClick={handleSaveDraft} disabled={submitting || !form.leaveTypeId || !form.startDate} className="!py-3 text-xs">
                Save Draft
              </GhostButton>
            </div>
          </form>
        </GlassCard>

        {/* Realtime Cost Breakdown Sidebar */}
        <div className="lg:col-span-2">
          <GlassCard strong className="sticky top-6 !p-6 border-aurora-cyan/20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-frost/10">
              <div className="w-8 h-8 rounded-lg bg-aurora-cyan/10 text-aurora-cyan flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-ink-100 text-base">Leave Impact Breakdown</h3>
            </div>

            <AnimatePresence mode="wait">
              {!preview ? (
                <div className="text-center py-8">
                  <p className="text-xs text-ink-400">Select a leave category and valid start/end dates to calculate deducted working days.</p>
                </div>
              ) : (
                <motion.div key="preview" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-frost/[0.03] p-4 rounded-xl border border-frost/10 text-center">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Deducted Working Days</p>
                    <p className="text-4xl font-display font-extrabold text-aurora-cyan mt-1">
                      {preview.deductedWorkingDays}
                      <span className="text-xs font-medium text-ink-400 ml-1">day(s)</span>
                    </p>
                  </div>

                  <div className="bg-frost/[0.03] rounded-xl px-4 py-3 border border-frost/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ink-400">Balance After This Leave</p>
                      <p className="text-[11px] text-ink-500 mt-0.5">{preview.effectiveBalance} day(s) available now</p>
                    </div>
                    <p className={`text-xl font-extrabold ${preview.projectedBalance < 0 ? 'text-status-advance' : 'text-ink-100'}`}>
                      {preview.projectedBalance}
                    </p>
                  </div>

                  {preview.isAdvanceLeave && (
                    <div className="flex items-start gap-2 text-xs text-status-advance bg-status-advance/10 border border-status-advance/30 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Advance Leave Flagged:</strong> Exceeds current available balance by {preview.shortfall} day(s). Requires managerial approval.
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {upcoming.length > 0 && (
            <GlassCard className="mt-4 !p-6">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-frost/10">
                <div className="w-8 h-8 rounded-lg bg-aurora-violet/10 text-aurora-violet flex items-center justify-center">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-ink-100 text-base">Upcoming</h3>
              </div>
              <div className="space-y-2.5">
                {upcoming.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.type === 'MY_LEAVE' ? (
                        <ListChecks className="w-3.5 h-3.5 text-aurora-violet shrink-0" />
                      ) : (
                        <PartyPopper className={`w-3.5 h-3.5 shrink-0 ${item.type === 'OPTIONAL_HOLIDAY' ? 'text-status-advance' : 'text-ink-400'}`} />
                      )}
                      <span className="text-ink-200 truncate">{item.label}</span>
                    </div>
                    <span className={`shrink-0 font-semibold px-1.5 py-0.5 rounded-md text-[10px] border ${
                      item.type === 'MY_LEAVE'
                        ? 'text-aurora-violet border-aurora-violet/30 bg-aurora-violet/10'
                        : item.type === 'OPTIONAL_HOLIDAY'
                          ? 'text-status-advance border-status-advance/30 bg-status-advance/10'
                          : 'text-ink-400 border-frost/10 bg-frost/5'
                    }`}>
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
}
