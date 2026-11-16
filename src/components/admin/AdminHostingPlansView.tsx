import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Plus,
  Server,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ManagedHostingPlanRecord,
  ManagedPlanCategory,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';

interface AdminHostingPlansViewProps {
  onShowToast: (msg: string) => void;
}

const PLAN_CATEGORY_TABS: {
  id: ManagedPlanCategory;
  label: string;
  path: string;
}[] = [
  { id: 'shared-hosting', label: 'Shared Hosting', path: '/shared-hosting' },
  { id: 'cpanel-hosting', label: 'cPanel Hosting', path: '/cpanel-hosting' },
  { id: 'wordpress-hosting', label: 'WordPress Hosting', path: '/wordpress-hosting' },
  { id: 'windows-hosting', label: 'Windows Hosting', path: '/windows-hosting' },
  { id: 'vps-hosting', label: 'VPS Hosting', path: '/vps-hosting' },
  { id: 'n8n-hosting', label: 'n8n Hosting', path: '/n8n-hosting' },
];

export const AdminHostingPlansView: React.FC<AdminHostingPlansViewProps> = ({
  onShowToast,
}) => {
  const {
    hostingPlans,
    provisioningModules,
    saveHostingPlan,
    createHostingPlan,
    deleteHostingPlan,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  const [activeCategory, setActiveCategory] =
    useState<ManagedPlanCategory>('shared-hosting');
  const [editingPlan, setEditingPlan] = useState<ManagedHostingPlanRecord | null>(
    null
  );
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Plan editor state
  const [planName, setPlanName] = useState('');
  const [planAudience, setPlanAudience] = useState('');
  const [planTagline, setPlanTagline] = useState('');
  const [planMonthly, setPlanMonthly] = useState('9.99');
  const [planYearly, setPlanYearly] = useState('99.00');
  const [planRenewal, setPlanRenewal] = useState('99.00');
  const [planStorage, setPlanStorage] = useState('50 GB NVMe Storage');
  const [planBandwidth, setPlanBandwidth] = useState('Unlimited Bandwidth');
  const [planSsl, setPlanSsl] = useState('Free Wildcard SSL');
  const [planBackups, setPlanBackups] = useState('Daily Snapshots');
  const [planFeaturesText, setPlanFeaturesText] = useState('');
  const [planPopular, setPlanPopular] = useState(false);
  const [planEnabled, setPlanEnabled] = useState(true);
  const [planAutoProvision, setPlanAutoProvision] = useState(true);
  const [planServerModuleId, setPlanServerModuleId] = useState('');
  const [planServerPackageName, setPlanServerPackageName] = useState('');
  const [formError, setFormError] = useState('');

  const plansInCategory = useMemo(
    () => hostingPlans.filter((p) => p.pageCategory === activeCategory),
    [hostingPlans, activeCategory]
  );

  const selectedServerModule = useMemo(
    () => provisioningModules.find((m) => m.id === planServerModuleId) ?? null,
    [provisioningModules, planServerModuleId]
  );

  const openEditor = (plan?: ManagedHostingPlanRecord) => {
    setFormError('');
    if (plan) {
      setEditingPlan(plan);
      setCreatingPlan(false);
      setPlanName(plan.name);
      setPlanAudience(plan.audience);
      setPlanTagline(plan.tagline);
      setPlanMonthly(plan.monthlyPrice.toFixed(2));
      setPlanYearly(plan.yearlyPrice.toFixed(2));
      setPlanRenewal(plan.renewalPrice.toFixed(2));
      setPlanStorage(plan.storage);
      setPlanBandwidth(plan.bandwidth);
      setPlanSsl(plan.ssl);
      setPlanBackups(plan.backups);
      setPlanFeaturesText(plan.features.join('\n'));
      setPlanPopular(plan.popular);
      setPlanEnabled(plan.enabled);
      setPlanAutoProvision(plan.autoProvision);
      setPlanServerModuleId(plan.serverModuleId);
      setPlanServerPackageName(plan.serverPackageName);
    } else {
      const defaultMod =
        activeCategory === 'cpanel-hosting'
          ? provisioningModules.find((m) => m.moduleType === 'whm')
          : activeCategory === 'vps-hosting' || activeCategory === 'n8n-hosting'
          ? provisioningModules.find((m) => m.moduleType === 'proxmox')
          : provisioningModules[0];
      setEditingPlan(null);
      setCreatingPlan(true);
      setPlanName('');
      setPlanAudience('For Growing Teams');
      setPlanTagline('High-availability NVMe cloud plan with automated provisioning.');
      setPlanMonthly('12.99');
      setPlanYearly('129.00');
      setPlanRenewal('129.00');
      setPlanStorage('50 GB NVMe Storage');
      setPlanBandwidth('Unlimited Bandwidth');
      setPlanSsl('Free Wildcard SSL');
      setPlanBackups('Daily Snapshots');
      setPlanFeaturesText('Free Migration\n24/7 Expert Support\nAuto-Provisioned Node');
      setPlanPopular(false);
      setPlanEnabled(true);
      setPlanAutoProvision(true);
      setPlanServerModuleId(defaultMod?.id || '');
      setPlanServerPackageName(defaultMod?.packages[0] || '');
    }
  };

  const handleServerModuleSelect = (moduleId: string) => {
    setPlanServerModuleId(moduleId);
    const mod = provisioningModules.find((m) => m.id === moduleId);
    if (mod && mod.packages.length > 0) {
      if (!mod.packages.includes(planServerPackageName)) {
        setPlanServerPackageName(mod.packages[0]);
      }
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = parseFloat(planMonthly);
    const yearly = parseFloat(planYearly);
    const renewal = parseFloat(planRenewal);

    if (!planName.trim()) {
      setFormError('Plan name is required.');
      return;
    }
    if ([monthly, yearly, renewal].some((n) => !Number.isFinite(n) || n < 0)) {
      setFormError('Monthly, Yearly, and Renewal prices must be valid numbers.');
      return;
    }

    const features = planFeaturesText
      .split(/\n|,/)
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingPlan) {
      const res = saveHostingPlan(editingPlan.id, {
        name: planName.trim(),
        audience: planAudience.trim(),
        tagline: planTagline.trim(),
        monthlyPrice: monthly,
        yearlyPrice: yearly,
        renewalPrice: renewal,
        storage: planStorage.trim(),
        bandwidth: planBandwidth.trim(),
        ssl: planSsl.trim(),
        backups: planBackups.trim(),
        features,
        popular: planPopular,
        enabled: planEnabled,
        autoProvision: planAutoProvision,
        serverModuleId: planServerModuleId,
        serverPackageName: planServerPackageName.trim(),
      });
      if (!res.ok) {
        setFormError(res.error || 'Unable to save plan.');
        return;
      }
      onShowToast(`Saved ${planName.trim()} (${planServerPackageName || 'Manual'})`);
      setEditingPlan(null);
      return;
    }

    const res = createHostingPlan({
      pageCategory: activeCategory,
      name: planName.trim(),
      audience: planAudience.trim() || 'For Teams',
      tagline: planTagline.trim(),
      monthlyPrice: monthly,
      yearlyPrice: yearly,
      renewalPrice: renewal,
      storage: planStorage.trim() || '50 GB NVMe',
      bandwidth: planBandwidth.trim() || 'Unlimited',
      ssl: planSsl.trim() || 'Free SSL',
      backups: planBackups.trim() || 'Daily',
      features,
      popular: planPopular,
      enabled: planEnabled,
      autoProvision: planAutoProvision,
      serverModuleId: planServerModuleId,
      serverPackageName: planServerPackageName.trim(),
    });
    if (!res.ok) {
      setFormError(res.error || 'Unable to create plan.');
      return;
    }
    onShowToast(`Created plan ${planName.trim()} in ${activeCategory}`);
    setCreatingPlan(false);
  };

  return (
    <div className="space-y-5">
      {/* Hosting Page Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-px">
        <div className="flex items-center gap-1 overflow-x-auto">
          {PLAN_CATEGORY_TABS.map((tab) => {
            const count = hostingPlans.filter((p) => p.pageCategory === tab.id).length;
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.id);
                  setEditingPlan(null);
                  setCreatingPlan(false);
                }}
                className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-[#0E6B63] text-[#0E6B63]'
                    : 'border-transparent text-slate-500 hover:text-[#0F172A]'
                }`}
              >
                {tab.label}{' '}
                <span className="font-mono text-[11px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="pb-2">
          <button
            type="button"
            onClick={() => (creatingPlan ? setCreatingPlan(false) : openEditor())}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{creatingPlan ? 'Close Form' : 'Add Hosting Plan'}</span>
          </button>
        </div>
      </div>

      {/* Create / Edit Plan Form */}
      {(creatingPlan || editingPlan) && (
        <form
          onSubmit={handleSaveSubmit}
          className="bg-white border border-[#0E6B63] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0F172A]">
                {editingPlan
                  ? `Edit Hosting Plan: ${editingPlan.name}`
                  : `New Plan for ${PLAN_CATEGORY_TABS.find((t) => t.id === activeCategory)?.label}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure pricing, renewal rate, specifications, and bind a server module &amp; WHM/server package for auto-provisioning.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setCreatingPlan(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. cPanel Velocity"
                className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Audience / Badge Subtitle
              </label>
              <input
                type="text"
                value={planAudience}
                onChange={(e) => setPlanAudience(e.target.value)}
                placeholder="For Growing Agencies"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={planTagline}
                onChange={(e) => setPlanTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Monthly Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={planMonthly}
                onChange={(e) => setPlanMonthly(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Yearly Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={planYearly}
                onChange={(e) => setPlanYearly(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Annual Renewal Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={planRenewal}
                onChange={(e) => setPlanRenewal(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Storage Spec
              </label>
              <input
                type="text"
                value={planStorage}
                onChange={(e) => setPlanStorage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Bandwidth Spec
              </label>
              <input
                type="text"
                value={planBandwidth}
                onChange={(e) => setPlanBandwidth(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                SSL &amp; Backups
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={planSsl}
                  onChange={(e) => setPlanSsl(e.target.value)}
                  placeholder="SSL"
                  className="px-2.5 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                />
                <input
                  type="text"
                  value={planBackups}
                  onChange={(e) => setPlanBackups(e.target.value)}
                  placeholder="Backups"
                  className="px-2.5 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Server Auto-Provisioning Section */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Auto-Provisioning Server &amp; WHM Package Mapping
                </span>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={planAutoProvision}
                  onChange={(e) => setPlanAutoProvision(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Enable Auto-Provisioning on Payment</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Server Module
                </label>
                <select
                  value={planServerModuleId}
                  onChange={(e) => handleServerModuleSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                >
                  <option value="">Manual Provisioning (No Server Bound)</option>
                  {provisioningModules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.moduleType.toUpperCase()} · {mod.hostname})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Server Plan / Package Name (WHM or Compute Profile)
                </label>
                <div className="flex gap-2">
                  {selectedServerModule && selectedServerModule.packages.length > 0 && (
                    <select
                      value={
                        selectedServerModule.packages.includes(planServerPackageName)
                          ? planServerPackageName
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value) setPlanServerPackageName(e.target.value);
                      }}
                      className="w-1/2 px-2.5 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      <option value="">Pick server package...</option>
                      {selectedServerModule.packages.map((pkg) => (
                        <option key={pkg} value={pkg}>
                          {pkg}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={planServerPackageName}
                    onChange={(e) => setPlanServerPackageName(e.target.value)}
                    placeholder="e.g. cpcloud_velocity"
                    className="flex-1 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-8">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Plan Features (One per line)
              </label>
              <textarea
                rows={3}
                value={planFeaturesText}
                onChange={(e) => setPlanFeaturesText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div className="lg:col-span-4 space-y-2.5 pt-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={planPopular}
                  onChange={(e) => setPlanPopular(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Highlight as Most Popular Plan</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={planEnabled}
                  onChange={(e) => setPlanEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Visible &amp; Orderable on Storefront</span>
              </label>
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-[#DC2626]">{formError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setCreatingPlan(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
            >
              {editingPlan ? 'Save Plan Configuration' : 'Create Hosting Plan'}
            </button>
          </div>
        </form>
      )}

      {/* Plans Table / List for Active Page Tab */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              {PLAN_CATEGORY_TABS.find((t) => t.id === activeCategory)?.label} Plans
            </h3>
            <p className="text-[11px] text-slate-500">
              Each plan displays its billing rates, renewal price, and bound WHM/server package for automated provisioning.
            </p>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Route: {PLAN_CATEGORY_TABS.find((t) => t.id === activeCategory)?.path}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Plan &amp; Specs</th>
                <th className="py-3 px-4 text-right">Monthly</th>
                <th className="py-3 px-4 text-right">Yearly</th>
                <th className="py-3 px-4 text-right">Renewal</th>
                <th className="py-3 px-4">Auto-Provisioning Server &amp; Package</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {plansInCategory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No plans configured in this category yet. Click Add Hosting Plan above.
                  </td>
                </tr>
              ) : (
                plansInCategory.map((plan) => {
                  const mod = provisioningModules.find(
                    (m) => m.id === plan.serverModuleId
                  );
                  return (
                    <tr key={plan.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-[#0F172A]">
                            {plan.name}
                          </span>
                          {plan.popular && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#D97706]">
                              <Sparkles className="w-3 h-3" aria-hidden="true" />
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {plan.storage} · {plan.bandwidth} · {plan.backups}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A] whitespace-nowrap">
                        {formatPrice(plan.monthlyPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#0E6B63] whitespace-nowrap">
                        {formatPrice(plan.yearlyPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatPrice(plan.renewalPrice)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#0F172A]">
                            <Cpu
                              className="w-3.5 h-3.5 text-[#0E6B63] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate max-w-[210px]">
                              {mod ? mod.name : 'Manual Queue'}
                            </span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-[#0F172A] border border-[#E2E8F0]">
                              {plan.serverPackageName || 'unassigned'}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                plan.autoProvision ? 'text-[#16A34A]' : 'text-slate-400'
                              }`}
                            >
                              {plan.autoProvision ? 'Auto-Provision ON' : 'Manual'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            saveHostingPlan(plan.id, { enabled: !plan.enabled });
                            onShowToast(
                              `${plan.name} ${!plan.enabled ? 'enabled' : 'disabled'}`
                            );
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                            plan.enabled
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          <span>{plan.enabled ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditor(plan)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded-lg cursor-pointer"
                        >
                          Edit Plan &amp; Server
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteHostingPlan(plan.id);
                            onShowToast(`Deleted ${plan.name}`);
                          }}
                          aria-label={`Delete ${plan.name}`}
                          className="p-1.5 text-slate-400 hover:text-[#DC2626] rounded-lg inline-flex items-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
