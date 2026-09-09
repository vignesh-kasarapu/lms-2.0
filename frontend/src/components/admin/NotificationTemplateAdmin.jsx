import { useEffect, useState } from 'react';
import { MessageSquareText, Save } from 'lucide-react';
import { listNotificationTemplates, updateNotificationTemplate } from '../../api/admin';
import GlassCard from '../common/GlassCard';
import { PrimaryButton } from '../common/GlassButton';

export default function NotificationTemplateAdmin() {
  const [templates, setTemplates] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [draft, setDraft] = useState({ subjectTemplate: '', bodyTemplate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => listNotificationTemplates().then((res) => {
    setTemplates(res.data);
    if (!selectedKey && res.data.length) selectTemplate(res.data[0]);
  });
  useEffect(() => { load(); }, []);

  const selectTemplate = (t) => {
    setSelectedKey(t.template_key);
    setDraft({ subjectTemplate: t.subject_template, bodyTemplate: t.body_template });
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateNotificationTemplate(selectedKey, draft);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-2">
        <h3 className="font-display font-bold text-slate-100 mb-4 flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-aurora-violet" /> Templates
        </h3>
        <div className="space-y-1 max-h-[440px] overflow-y-auto">
          {templates.map((t) => (
            <button key={t.template_key} onClick={() => selectTemplate(t)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs ${selectedKey === t.template_key ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04]'}`}>
              {t.template_key}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-3">
        {!selectedKey ? (
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
            <PrimaryButton onClick={save} disabled={saving}>
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save template'}
            </PrimaryButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
