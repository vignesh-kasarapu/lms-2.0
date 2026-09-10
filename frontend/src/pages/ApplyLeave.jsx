import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarDays, Paperclip, Sparkles, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { previewApplication, submitRequest, saveDraft } from '../api/leaveRequests';
import { getDashboard } from '../api/employees';
import { uploadAttachment } from '../api/attachments';
import GlassCard from '../components/common/GlassCard';
import { PrimaryButton, GhostButton } from '../components/common/GlassButton';
import Topbar from '../components/layout/Topbar';

const FALLBACK_LEAVE_TYPES = [
  { id: 1, name: 'Annual Leave', icon: '🏖️', halfDay: true, attachments: false, desc: 'Paid vacation time' },
  { id: 2, name: 'Sick Leave', icon: '🩺', halfDay: true, attachments: true, desc: 'Medical recovery & doctor visits' },
  { id: 3, name: 'Casual Leave', icon: '⚡', halfDay: true, attachments: false, desc: 'Personal urgent matters' },
];

const LEAVE_TYPE_META = {
  ANNUAL: { icon: '🌴', desc: 'Paid vacation time' },
  SICK: { icon: '🩺', desc: 'Medical recovery & doctor visits' },
  CASUAL: { icon: '⚡', desc: 'Personal urgent matters' },
  MATERNITY: { icon: '🌸', desc: 'Time for childbirth and recovery' },
  BEREAVEMENT: { icon: '🕊️', desc: 'Time to grieve and support family' },
};

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState(FALLBACK_LEAVE_TYPES);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', isHalfDay: false, halfDayPortion: 'FIRST', reason: '' });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

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
      if (dynamicTypes.length) setLeaveTypes(dynamicTypes);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.leaveTypeId || !form.startDate || !form.endDate) { setPreview(null); return; }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      previewApplication({ ...form })
        .then((res) => setPreview(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setPreviewLoading(false));
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {leaveTypes.map((t) => {
                  const isSelected = String(form.leaveTypeId) === String(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setForm((f) => ({ ...f, leaveTypeId: t.id }))}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-aurora-violet/20 to-aurora-cyan/10 border-aurora-violet/60 shadow-[0_0_20px_rgba(139,109,255,0.25)] text-white scale-[1.02]'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-xl mb-1">{t.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-slate-100">{t.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.desc}</p>
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
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">Start Date</label>
                  <input type="date" className="glass-input" value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">End Date</label>
                  <input type="date" className="glass-input" value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>
            </div>

            {/* Half Day Option */}
            {selectedType?.halfDay && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={form.isHalfDay}
                    onChange={(e) => setForm((f) => ({ ...f, isHalfDay: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-aurora-violet focus:ring-aurora-violet" />
                  Half-day leave duration
                </label>
                {form.isHalfDay && (
                  <select className="glass-input !py-1 text-xs w-36" value={form.halfDayPortion}
                    onChange={(e) => setForm((f) => ({ ...f, halfDayPortion: e.target.value }))}>
                    <option value="FIRST" className="bg-void-900 text-slate-200">First Half (AM)</option>
                    <option value="SECOND" className="bg-void-900 text-slate-200">Second Half (PM)</option>
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Supporting Document (Medical / Official)
                </label>
                <label className="ghost-btn w-full justify-center text-slate-300 border-dashed border-white/20 hover:border-aurora-violet/50 cursor-pointer py-4">
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
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-lg bg-aurora-cyan/10 text-aurora-cyan flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-slate-100 text-base">Leave Impact Breakdown</h3>
            </div>

            <AnimatePresence mode="wait">
              {!preview ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">Select a leave category and valid start/end dates to calculate deducted working days.</p>
                </div>
              ) : (
                <motion.div key="preview" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deducted Working Days</p>
                    <p className="text-4xl font-display font-extrabold text-aurora-cyan mt-1">
                      {preview.deductedWorkingDays}
                      <span className="text-xs font-medium text-slate-400 ml-1">day(s)</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      {preview.calendarDaysSelected} calendar day(s) selected
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <StatRow label="Accrued Balance" value={`${preview.ledgerBalance} days`} />
                    <StatRow label="In Review" value={`${preview.committedToOpenRequests} days`} />
                    <StatRow label="Effective Balance" value={`${preview.effectiveBalance} days`} />
                    <StatRow
                      label="Balance After Leave"
                      value={`${preview.projectedBalance} days`}
                      highlight={preview.projectedBalance < 0}
                    />
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
        </div>
      </div>
    </>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5">
      <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
      <p className={`text-sm font-extrabold mt-0.5 ${highlight ? 'text-status-advance' : 'text-slate-100'}`}>{value}</p>
    </div>
  );
}
