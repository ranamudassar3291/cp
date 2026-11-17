import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import {
  EmailTemplateCategory,
  renderEmailMergeText,
} from '../../data/defaultEmailTemplates';
import { EmailTemplateRecord, usePlatform } from '../../context/PlatformContext';

interface AdminEmailTemplatesViewProps {
  onShowToast: (msg: string) => void;
}

const CATEGORIES: ('All' | EmailTemplateCategory)[] = [
  'All',
  'Account & Security',
  'Orders & Provisioning',
  'Billing & Invoices',
  'Hosting Lifecycle',
  'Domain Lifecycle',
  'Service Lifecycle',
  'Support & Tickets',
  'Security & Auth',
  'Admin Alerts',
];

export const AdminEmailTemplatesView: React.FC<AdminEmailTemplatesViewProps> = ({
  onShowToast,
}) => {
  const {
    emailTemplates,
    saveEmailTemplate,
    createEmailTemplate,
    deleteEmailTemplate,
    resetEmailTemplate,
    invoiceTemplateConfig,
  } = usePlatform();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<'All' | EmailTemplateCategory>('All');
  const [selectedId, setSelectedId] = useState<string>(
    emailTemplates[0]?.id || 'welcome-email'
  );
  const [rightMode, setRightMode] = useState<'edit' | 'preview'>('edit');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return emailTemplates.filter((tpl) => {
      if (categoryFilter !== 'All' && tpl.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.subject.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q)
      );
    });
  }, [emailTemplates, categoryFilter, search]);

  const selectedTemplate: EmailTemplateRecord | null = useMemo(
    () =>
      emailTemplates.find((t) => t.id === selectedId) ??
      filteredTemplates[0] ??
      emailTemplates[0] ??
      null,
    [emailTemplates, filteredTemplates, selectedId]
  );

  // Editor state
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] =
    useState<EmailTemplateCategory>('Hosting Lifecycle');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftEnabled, setDraftEnabled] = useState(true);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftPreheader, setDraftPreheader] = useState('');
  const [draftHeading, setDraftHeading] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftCtaLabel, setDraftCtaLabel] = useState('');
  const [draftCtaUrl, setDraftCtaUrl] = useState('');
  const [draftFooterNote, setDraftFooterNote] = useState('');
  const [copiedVar, setCopiedVar] = useState('');

  useEffect(() => {
    if (!selectedTemplate) return;
    setDraftName(selectedTemplate.name);
    setDraftCategory(selectedTemplate.category);
    setDraftDescription(selectedTemplate.description);
    setDraftEnabled(selectedTemplate.enabled);
    setDraftSubject(selectedTemplate.subject);
    setDraftPreheader(selectedTemplate.preheader);
    setDraftHeading(selectedTemplate.heading);
    setDraftBody(selectedTemplate.body);
    setDraftCtaLabel(selectedTemplate.ctaLabel);
    setDraftCtaUrl(selectedTemplate.ctaUrl);
    setDraftFooterNote(selectedTemplate.footerNote);
  }, [selectedTemplate]);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] =
    useState<EmailTemplateCategory>('Hosting Lifecycle');
  const [newDescription, setNewDescription] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newHeading, setNewHeading] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCtaLabel, setNewCtaLabel] = useState('Open Client Portal');
  const [newCtaUrl, setNewCtaUrl] = useState('https://cpcloudhost.com/dashboard');
  const [createError, setCreateError] = useState('');

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    const res = saveEmailTemplate(selectedTemplate.id, {
      name: draftName.trim() || selectedTemplate.name,
      category: draftCategory,
      description: draftDescription.trim(),
      enabled: draftEnabled,
      subject: draftSubject.trim(),
      preheader: draftPreheader.trim(),
      heading: draftHeading.trim(),
      body: draftBody,
      ctaLabel: draftCtaLabel.trim(),
      ctaUrl: draftCtaUrl.trim(),
      footerNote: draftFooterNote.trim(),
    });
    if (!res.ok) {
      onShowToast(res.error || 'Could not save email template.');
      return;
    }
    onShowToast(`Saved email template "${draftName.trim() || selectedTemplate.name}"`);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createEmailTemplate({
      name: newName,
      category: newCategory,
      description: newDescription,
      subject: newSubject,
      preheader: '',
      heading: newHeading || newName,
      body: newBody,
      ctaLabel: newCtaLabel,
      ctaUrl: newCtaUrl,
      footerNote: `${invoiceTemplateConfig.companyName} Automated Notification`,
    });
    if (!res.ok || !res.template) {
      setCreateError(res.error || 'Failed to create template.');
      return;
    }
    setCreateError('');
    setShowCreateForm(false);
    setNewName('');
    setNewDescription('');
    setNewSubject('');
    setNewHeading('');
    setNewBody('');
    setSelectedId(res.template.id);
    onShowToast(`Email template "${res.template.name}" created`);
  };

  const handleCopyMergeTag = (tag: string) => {
    const token = `{{${tag}}}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
    setCopiedVar(tag);
    window.setTimeout(() => setCopiedVar(''), 1600);
    onShowToast(`Copied merge variable ${token}`);
  };

  const previewOverrides = {
    company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
  };

  const renderedSubject = renderEmailMergeText(draftSubject, previewOverrides);
  const renderedPreheader = renderEmailMergeText(draftPreheader, previewOverrides);
  const renderedHeading = renderEmailMergeText(draftHeading, previewOverrides);
  const renderedBody = renderEmailMergeText(draftBody, previewOverrides);
  const renderedCtaLabel = renderEmailMergeText(draftCtaLabel, previewOverrides);
  const renderedFooter = renderEmailMergeText(draftFooterNote, previewOverrides);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0F172A]">
            Lifecycle Email Templates ({emailTemplates.length})
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Manage welcome, 2FA verification codes, order confirmation, cPanel/VPS credentials, invoice notices, and 30-day / 3-day / final / suspension / termination reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{showCreateForm ? 'Close Form' : 'New Custom Template'}</span>
        </button>
      </div>

      {/* Create New Custom Template Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateTemplate}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
        >
          <h3 className="font-display text-sm font-bold text-[#0F172A]">
            Create Custom Lifecycle Email Template
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Template Name (e.g. Dedicated IP Assigned)"
              className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
            <select
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as EmailTemplateCategory)
              }
              className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Short Trigger Description"
              className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Email Subject (supports {{client_name}}, {{domain}}, {{invoice_id}})"
              className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
            <input
              type="text"
              value={newHeading}
              onChange={(e) => setNewHeading(e.target.value)}
              placeholder="Email Banner Heading"
              className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>
          <textarea
            rows={4}
            required
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Write the email body with dynamic tags like {{client_name}}, {{domain}}, {{due_date}}, {{amount}}..."
            className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newCtaLabel}
              onChange={(e) => setNewCtaLabel(e.target.value)}
              placeholder="Primary CTA Button Label"
              className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
            <input
              type="text"
              value={newCtaUrl}
              onChange={(e) => setNewCtaUrl(e.target.value)}
              placeholder="Primary CTA Destination URL"
              className="px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
            />
          </div>
          {createError && (
            <p className="text-xs font-semibold text-[#DC2626]">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
            >
              Create Template
            </button>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search welcome email, verification code, 30 days, suspend, domain expiry..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Split Workspace: Template List (Left) + Editor & Live Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar List */}
        <div className="xl:col-span-4 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0F172A]">
              Templates ({filteredTemplates.length})
            </span>
            <span className="text-[11px] text-slate-500">Click to edit or preview</span>
          </div>

          <div className="divide-y divide-[#E2E8F0] max-h-[680px] overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No email templates match your filter.
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const active = selectedTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedId(tpl.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      active ? 'bg-[#F2FAF8]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-xs font-bold text-[#0F172A] truncate">
                          {tpl.name}
                        </p>
                        <p className="text-[11px] text-[#0E6B63] font-medium mt-0.5">
                          {tpl.category}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                          tpl.enabled
                            ? 'text-[#16A34A] bg-[#16A34A]/10'
                            : 'text-slate-500 bg-slate-100'
                        }`}
                      >
                        {tpl.enabled ? 'Active' : 'Muted'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                      {tpl.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Editor & Live HTML Email Preview */}
        {selectedTemplate && (
          <div className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
                  <h3 className="font-display text-base font-bold text-[#0F172A] truncate">
                    {selectedTemplate.name}
                  </h3>
                </div>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  key: {selectedTemplate.key} · Updated {selectedTemplate.updatedAtUtc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRightMode('edit')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      rightMode === 'edit'
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    Edit Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightMode('preview')}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      rightMode === 'preview'
                        ? 'bg-white text-[#0F172A] shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Live Email Preview</span>
                  </button>
                </div>

                {selectedTemplate.isSystem ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetEmailTemplate(selectedTemplate.id);
                      onShowToast(`Reset "${selectedTemplate.name}" to default`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-[#CBD5E1] bg-white hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const res = deleteEmailTemplate(selectedTemplate.id);
                      if (res.ok) {
                        setSelectedId(emailTemplates[0]?.id || 'welcome-email');
                        onShowToast(`Deleted custom template "${selectedTemplate.name}"`);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#DC2626] border border-[#DC2626]/30 bg-white hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {rightMode === 'edit' ? (
              <form onSubmit={handleSaveTemplate} className="p-5 sm:p-6 space-y-5">
                {/* Clickable Merge Tag Chips */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-slate-600 mb-2">
                    Dynamic Merge Variables (click any tag to copy):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.variables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleCopyMergeTag(v)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#E2E8F0] hover:border-[#0E6B63] font-mono text-[11px] text-[#0F172A] cursor-pointer"
                      >
                        {copiedVar === v ? (
                          <Check className="w-3 h-3 text-[#16A34A]" aria-hidden="true" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        )}
                        <span>{`{{${v}}}`}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      required
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lifecycle Category
                    </label>
                    <select
                      value={draftCategory}
                      onChange={(e) =>
                        setDraftCategory(e.target.value as EmailTemplateCategory)
                      }
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftEnabled}
                        onChange={(e) => setDraftEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-[#0E6B63]"
                      />
                      <span className="font-semibold text-[#0F172A]">
                        Auto-Dispatch Enabled
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Inbox Preheader Text
                    </label>
                    <input
                      type="text"
                      value={draftPreheader}
                      onChange={(e) => setDraftPreheader(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Banner Heading
                    </label>
                    <input
                      type="text"
                      value={draftHeading}
                      onChange={(e) => setDraftHeading(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email Message Body
                  </label>
                  <textarea
                    rows={9}
                    required
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono leading-relaxed border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={draftCtaLabel}
                      onChange={(e) => setDraftCtaLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CTA Button URL
                    </label>
                    <input
                      type="text"
                      value={draftCtaUrl}
                      onChange={(e) => setDraftCtaUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Footer Compliance Note
                  </label>
                  <input
                    type="text"
                    value={draftFooterNote}
                    onChange={(e) => setDraftFooterNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRightMode('preview')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] hover:border-[#0E6B63] rounded-lg cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Preview Rendered Email</span>
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save Email Template</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Live Rendered HTML Email Preview */
              <div className="p-5 sm:p-6 bg-[#F8FAFC] space-y-4">
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 text-xs space-y-1">
                  <p>
                    <span className="text-slate-500 font-semibold">Subject: </span>
                    <span className="font-bold text-[#0F172A]">{renderedSubject}</span>
                  </p>
                  {renderedPreheader && (
                    <p>
                      <span className="text-slate-500 font-semibold">Preheader: </span>
                      <span className="text-slate-600">{renderedPreheader}</span>
                    </p>
                  )}
                </div>

                <div className="max-w-xl mx-auto bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                  <div
                    className="px-6 py-5 text-white"
                    style={{
                      backgroundColor:
                        invoiceTemplateConfig.accentColor || '#0E6B63',
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-85">
                      {invoiceTemplateConfig.companyName} · Automated Notice
                    </p>
                    <h4 className="font-display text-lg font-bold mt-1">
                      {renderedHeading}
                    </h4>
                  </div>

                  <div className="p-6 space-y-5 text-xs text-slate-700 leading-relaxed">
                    <div className="whitespace-pre-line">{renderedBody}</div>

                    {renderedCtaLabel && (
                      <div className="pt-2">
                        <span
                          className="inline-block px-5 py-2.5 rounded-lg text-white font-semibold text-xs"
                          style={{
                            backgroundColor:
                              invoiceTemplateConfig.accentColor || '#0E6B63',
                          }}
                        >
                          {renderedCtaLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] text-[11px] text-slate-500">
                    <p>{renderedFooter}</p>
                    <p className="mt-1 font-mono">
                      {invoiceTemplateConfig.companyEmail} ·{' '}
                      {invoiceTemplateConfig.companyWebsite}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
