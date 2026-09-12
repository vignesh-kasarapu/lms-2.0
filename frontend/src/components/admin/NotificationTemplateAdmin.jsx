import { useEffect, useState } from 'react';
import { MessageSquareText, Save, Plus, Trash2 } from 'lucide-react';
import {
  listNotificationTemplates, createNotificationTemplate, updateNotificationTemplate,
  setNotificationTemplateActive, deleteNotificationTemplate,
} from '../../api/admin';
import GlassCard from '../common/GlassCard';
import Modal from '../common/Modal';
import { PrimaryButton, GhostButton } from '../common/GlassButton';

const emptyNew = { templateKey: '', subjectTemplate: '', bodyTemplate: '' };

export default function NotificationTemplateAdmin() {
  const [templates, setTemplates] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [draft, setDraft] = useState({ subjectTemplate: '', bodyTemplate: '' });
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState(emptyNew);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const load = () => listNotificationTemplates().then((res) => {
    setTemplates(res.data);
    if (!selectedKey && res.data.length) selectTemplate(res.data[0]);
  });
  useEffect(() => { load(); }, []);

  const selectTemplate = (t) => {
    setSelectedKey(t.template_key);
    setDraft({ subjectTemplate: t.subject_template, bodyTemplate: t.body_template });
  };

  const selected = templates.find((t) => t.template_key === selectedKey);

  const save = async () => {
    setSaving(true);
    try {
      await updateNotificationTemplate(selectedKey, draft);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    await setNotificationTemplateActive(selectedKey, !selected.is_active);
    load();
  };

  const remove = async () => {
    await deleteNotificationTemplate(selectedKey);
    setSelectedKey(null);
    load();
  };

  const submitNew = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await createNotificationTemplate(newTemplate);
      setNewTemplate(emptyNew);
      setAdding(false);
      await load();
      selectTemplate(res.data);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="font-display font-bold text-slate-100 flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-aurora-violet" /> Templates
          </h3>
          <button type="button" onClick={() => setAdding(true)} className="ghost-btn !px-2.5 !py-1.5 text-xs" title="Add a new template">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
        <div className="space-y-1 max-h-[440px] overflow-y-auto">
          {templates.map((t) => (
            <button key={t.template_key} onClick={() => selectTemplate(t)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 ${selectedKey === t.template_key ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04]'}`}>
              <span className="truncate">{t.template_key}</span>
              {!t.is_active && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-status-rejected/10 text-status-rejected border border-status-rejected/30 shrink-0">
                  Disabled
                </span>
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        {!selected ? (
          <p className="text-sm text-slate-500">Select a template to edit.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Subject</label>
              <input className="glass-input" value={draft.subjectTemplate} onChange={(e) => setDraft((d) => ({ ...d, subjectTemplate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Body — use {'{{tokenName}}'} for substitutions</label>
              <textarea className="glass-input min-h-[140px] resize-none font-mono" value={draft.bodyTemplate} onChange={(e) => setDraft((d) => ({ ...d, bodyTemplate: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PrimaryButton onClick={save} disabled={saving}>
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save template'}
              </PrimaryButton>
              <GhostButton onClick={toggleActive} className="text-xs">
                {selected.is_active ? 'Disable' : 'Enable'}
              </GhostButton>
              <button type="button" onClick={remove}
                className="ghost-btn !px-3 !py-2 text-xs hover:border-status-rejected/40 hover:text-status-rejected ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      <Modal open={adding} onClose={() => setAdding(false)} title="New notification template" maxWidth="max-w-lg">
        <form onSubmit={submitNew} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Template key</label>
            <input className="glass-input font-mono" placeholder="e.g. CUSTOM_REMINDER" value={newTemplate.templateKey}
              onChange={(e) => setNewTemplate((t) => ({ ...t, templateKey: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Subject</label>
            <input className="glass-input" value={newTemplate.subjectTemplate}
              onChange={(e) => setNewTemplate((t) => ({ ...t, subjectTemplate: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Body — use {'{{tokenName}}'} for substitutions</label>
            <textarea className="glass-input min-h-[120px] resize-none font-mono" value={newTemplate.bodyTemplate}
              onChange={(e) => setNewTemplate((t) => ({ ...t, bodyTemplate: e.target.value }))} required />
          </div>
          {createError && <p className="text-xs font-semibold text-status-rejected bg-status-rejected/10 p-2 rounded-lg">{createError}</p>}
          <PrimaryButton type="submit" disabled={creating} className="w-full">
            {creating ? 'Creating…' : 'Create template'}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
