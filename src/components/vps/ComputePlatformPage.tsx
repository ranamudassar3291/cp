import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Cpu,
  Minus,
  Plus,
  Server,
  Workflow,
} from 'lucide-react';
import vpsHeroImg from '../../assets/images/vps_hero_isometric_cluster_1794563676694.jpg';
import n8nHeroImg from '../../assets/images/n8n_hero_automation_nodes_1794563675698.jpg';
import {
  ComputePlan,
  N8N_FAQS,
  N8N_FEATURE_PILLARS,
  N8N_PLANS,
  VPS_FAQS,
  VPS_FEATURE_PILLARS,
  VPS_PLANS,
} from '../../data/vpsAndN8nData';
import {
  ComputeMetricEmblem,
  ComputePillarArtwork,
} from './ComputeArtworkEmblems';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface ComputePlatformPageProps {
  mode: 'vps' | 'n8n';
  onNavigateHome: (sectionSelector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

const REGIONS = [
  'London, United Kingdom (Tier-III+)',
  'Dallas, Texas, USA (Multi-AZ)',
  'Frankfurt, Germany (EU Sovereign)',
  'Singapore, Asia-Pacific',
];

const VPS_OS_OPTIONS = [
  'Ubuntu 24.04 LTS',
  'Debian 12 Bookworm',
  'AlmaLinux 9 Enterprise',
  'Rocky Linux 9',
];

const N8N_STACK_OPTIONS = [
  'n8n + Docker + PostgreSQL + Redis Queue',
  'n8n + Docker + Caddy Auto-SSL',
  'n8n + Custom Python & Puppeteer Image',
];

export const ComputePlatformPage: React.FC<ComputePlatformPageProps> = ({
  mode,
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPrice, countryName } = useCurrency();
  const { addOrder, cmsPages, hostingPlans, lastSearchedDomain, setOrderCheckoutDraft } = usePlatform();
  const isN8n = mode === 'n8n';
  const pageCms = cmsPages.find((p) => p.id === (isN8n ? 'n8n-hosting' : 'vps-hosting'));
  const plans = isN8n ? N8N_PLANS : VPS_PLANS;
  const pillars = isN8n ? N8N_FEATURE_PILLARS : VPS_FEATURE_PILLARS;
  const faqs = isN8n ? N8N_FAQS : VPS_FAQS;

  const [selectedPlan, setSelectedPlan] = useState<ComputePlan | null>(null);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [selectedRuntime, setSelectedRuntime] = useState(
    isN8n ? N8N_STACK_OPTIONS[0] : VPS_OS_OPTIONS[0]
  );
  const [addPanelOrBackup, setAddPanelOrBackup] = useState(true);
  const [hostnameInput, setHostnameInput] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleConfigurePlan = (plan: ComputePlan) => {
    setSelectedPlan(plan);
    setSelectedRuntime(isN8n ? N8N_STACK_OPTIONS[0] : VPS_OS_OPTIONS[0]);
    setOrderSubmitted(false);
    setFormError('');
    const targetCategory = isN8n ? 'n8n-hosting' : 'vps-hosting';
    const matchedManaged = hostingPlans.find(
      (hp) =>
        hp.pageCategory === targetCategory &&
        (hp.id === `plan-${plan.id}` || hp.id === plan.id || hp.name.toLowerCase() === plan.name.toLowerCase())
    );
    setOrderCheckoutDraft({
      orderCategory: targetCategory,
      planId: matchedManaged?.id || `plan-${plan.id}`,
      planName: matchedManaged?.name || plan.name,
      productType: isN8n ? 'n8n Hosting' : 'Unmanaged VPS',
      billingCycle: '1 Month',
      datacenterId: 'uk',
      datacenterLabel: 'London, UK',
      domainOption: lastSearchedDomain ? lastSearchedDomain.mode : 'later',
      domainName: lastSearchedDomain?.domain || '',
      domainTld: lastSearchedDomain?.tld,
      domainYears: lastSearchedDomain?.minYears,
      domainPriceUsd: lastSearchedDomain?.priceUsd,
      eppAuthCode: lastSearchedDomain?.eppAuthCode,
      preselectedFromSite: true,
      domainSearchedFromSite: Boolean(lastSearchedDomain),
      step: 1,
      sourceOrigin: 'public',
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    if (onNavigatePath) {
      onNavigatePath(`/order/${targetCategory}`);
      return;
    }
    setTimeout(() => {
      scrollToElement('#compute-configurator');
    }, 60);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = contactEmail.trim();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setFormError('Please enter a valid email address for server access details.');
      return;
    }
    setFormError('');
    if (selectedPlan) {
      addOrder({
        clientEmail: cleaned,
        country: countryName || 'International',
        productType: isN8n ? 'n8n Hosting' : 'Unmanaged VPS',
        planName: selectedPlan.name,
        domainOrHost:
          hostnameInput.trim() ||
          `${selectedPlan.id}.${isN8n ? 'n8n' : 'vps'}.cpcloudhost.com`,
        billingCycle: 'Monthly',
        amountUsd: selectedPlan.monthlyPrice,
        datacenter: selectedRegion,
        paymentMethod: 'Compute Portal',
        status: 'pending',
      });
    }
    setOrderSubmitted(true);
  };

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb Bar */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onNavigateHome('#top')}
            className="font-medium text-slate-600 hover:text-[#0E6B63] transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-slate-600">VPS Hosting</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-[#0E6B63]">
            {isN8n ? 'n8n Hosting' : 'Unmanaged VPS Hosting'}
          </span>
        </div>
      </div>

      {/* 1. Hero Split Section */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() ||
                  (isN8n
                    ? 'cpcloudhost.com · Dedicated n8n Automation Infrastructure'
                    : 'cpcloudhost.com · High-Frequency KVM Compute')}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  (isN8n
                    ? 'Self-Hosted n8n Automation Without Execution Limits'
                    : 'Complete Root Control Over High-Speed Cloud Compute')}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  (isN8n
                    ? 'Deploy dedicated n8n automation servers backed by isolated KVM hardware, pre-configured Docker containers, and PostgreSQL + Redis queues. Run unlimited multi-step workflows, webhooks, and AI pipelines on infrastructure tuned by cpcloudhost.com.'
                    : 'Run latency-sensitive applications, custom stacks, and Docker workloads inside dedicated KVM virtual machines with unshared CPU cores and fast SSD or NVMe storage engineered at cpcloudhost.com.')}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-sm text-slate-500">From</span>
                <span className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                  {formatPrice(12.99)}
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {(pageCms?.highlights && pageCms.highlights.length > 0
                  ? pageCms.highlights
                  : isN8n
                    ? [
                        'Unlimited workflows, triggers & webhook runs',
                        'Pre-configured Docker, HTTPS SSL & PostgreSQL',
                        'UK, USA, EU & Singapore automation nodes',
                        'Instant snapshot rollbacks & full root SSH',
                      ]
                    : [
                        'Full root SSH & out-of-band console access',
                        'Enterprise SSD & optional NVMe storage arrays',
                        'UK, USA, Frankfurt & Singapore server hubs',
                        'Unlimited traffic with up to 800 Mbit/s uplinks',
                      ]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      scrollToElement(url || '#compute-plans');
                    }
                  }}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#000000] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  {pageCms?.primaryCtaText?.trim() || 'View All Packages'}
                </button>
              </div>
            </div>

            {/* Right Isometric Studio Illustration */}
            <div className="lg:col-span-6 flex items-center justify-center lg:justify-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgFailed ? (
                  <img
                    src={isN8n ? n8nHeroImg : vpsHeroImg}
                    alt={
                      isN8n
                        ? 'Dedicated isometric n8n workflow automation cloud cluster linked with Docker and PostgreSQL containers'
                        : 'Isometric KVM cloud VPS compute rack with SSD storage bays and encrypted network firewall'
                    }
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    {isN8n ? (
                      <Workflow className="w-10 h-10 text-[#EA580C]" aria-hidden="true" />
                    ) : (
                      <Server className="w-10 h-10 text-[#0284C7]" aria-hidden="true" />
                    )}
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      {isN8n
                        ? 'Dedicated n8n Automation Cluster'
                        : 'Enterprise KVM VPS Compute'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compute Plans & Exact Hardware Spec Matrix */}
      <section
        id="compute-plans"
        className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              {isN8n
                ? 'Choose Your Dedicated n8n Node'
                : 'Select Your KVM Cloud VPS Tier'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {isN8n
                ? 'Instant container provisioning backed by PostgreSQL, automatic webhook SSL, and full ownership of your workflow history. Zero setup fee on Tiers 2–4.'
                : 'Instant OS provisioning across Ubuntu, Debian, or AlmaLinux with optional cPanel/WHM control panels and zero setup fee from 6 vCPU upward.'}
            </p>
          </div>

          {/* 4-Column Plan Cards with Exact Unified Specs on Both VPS & n8n */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-[20px] border bg-white p-6 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-[#0E6B63] ring-2 ring-[#0E6B63]/20 shadow-[0_18px_40px_-20px_rgba(14,107,99,0.22)]'
                      : 'border-[#CBD5E1] hover:border-slate-400'
                  }`}
                >
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {plan.eyebrow}
                    </p>

                    <h3 className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A]">
                      {plan.name}
                    </h3>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[34px]">
                      {plan.summary}
                    </p>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleConfigurePlan(plan)}
                        className="w-full py-2.5 px-4 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Configure Now
                      </button>
                    </div>

                    {/* Exact Tier Plan Specs Inside Card */}
                    <div className="mt-6 rounded-xl bg-[#F4F6F9] divide-y-2 divide-white overflow-hidden">
                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ComputeMetricEmblem kind="cpu" />
                          <span className="text-xs text-[#0369A1] font-medium">
                            Cores
                          </span>
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-[#0F172A]">
                          {plan.cores}
                        </span>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ComputeMetricEmblem kind="ram" />
                          <span className="text-xs text-[#0369A1] font-medium">
                            Memory
                          </span>
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-[#0F172A]">
                          {plan.memory}
                        </span>
                      </div>

                      <div className="px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ComputeMetricEmblem kind="storage" />
                            <span className="text-xs text-[#0369A1] font-medium">
                              Storage
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#0F172A] text-right">
                            {plan.storage}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Extension Available</span>
                          <span>{plan.storageNote}</span>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ComputeMetricEmblem kind="snapshot" />
                          <span className="text-xs text-[#0369A1] font-medium">
                            Snapshots
                          </span>
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-[#0F172A]">
                          {plan.snapshots}
                        </span>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ComputeMetricEmblem kind="port" />
                          <span className="text-xs text-[#0369A1] font-medium">
                            Port Speeds
                          </span>
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-[#0F172A]">
                          {plan.portSpeed}
                        </span>
                      </div>

                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ComputeMetricEmblem kind="traffic" />
                          <span className="text-xs text-[#0369A1] font-medium">
                            Traffic
                          </span>
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-[#0F172A]">
                          {plan.traffic}
                        </span>
                      </div>
                    </div>
                  </div>

                  {plan.noSetupFee && (
                    <div className="mt-4 flex justify-center">
                      <span className="inline-block px-3.5 py-1 rounded bg-[#0066CC] text-white text-xs font-semibold">
                        No Setup Fee
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline Zero-Modal Deployment Configurator */}
          {selectedPlan && (
            <div
              id="compute-configurator"
              className="mt-8 rounded-2xl border-2 border-[#0E6B63] bg-[#F8FAFC] p-6 sm:p-8"
            >
              {!orderSubmitted ? (
                <form
                  onSubmit={handleOrderSubmit}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  <div className="lg:col-span-5">
                    <p className="text-xs font-semibold tracking-wide text-[#0E6B63]">
                      {isN8n
                        ? 'n8n Node Configuration · cpcloudhost.com'
                        : 'KVM Server Configuration · cpcloudhost.com'}
                    </p>
                    <h3 className="mt-1.5 font-display text-xl font-bold text-[#0F172A]">
                      {selectedPlan.name} ({selectedPlan.cores} ·{' '}
                      {selectedPlan.memory})
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600">
                      {selectedPlan.storage} &middot; {selectedPlan.portSpeed}{' '}
                      &middot; {selectedPlan.snapshots}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between text-sm">
                      <span className="text-slate-600">Monthly Rate:</span>
                      <span className="font-mono-num font-display text-2xl font-extrabold text-[#0E6B63]">
                        {formatPrice(selectedPlan.monthlyPrice)}/mo
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="compute-region"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Server Location
                        </label>
                        <select
                          id="compute-region"
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                        >
                          {REGIONS.map((reg) => (
                            <option key={reg} value={reg}>
                              {reg}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="compute-runtime"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          {isN8n ? 'Automation Stack' : 'Operating System Image'}
                        </label>
                        <select
                          id="compute-runtime"
                          value={selectedRuntime}
                          onChange={(e) => setSelectedRuntime(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                        >
                          {(isN8n ? N8N_STACK_OPTIONS : VPS_OS_OPTIONS).map(
                            (opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="compute-hostname"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          {isN8n ? 'Webhook Subdomain' : 'Server Hostname'}
                        </label>
                        <input
                          id="compute-hostname"
                          type="text"
                          value={hostnameInput}
                          onChange={(e) => setHostnameInput(e.target.value)}
                          placeholder={
                            isN8n ? 'flows.yourdomain.com' : 'node01.yourdomain.com'
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="compute-email"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Provisioning Email
                        </label>
                        <input
                          id="compute-email"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="ops@company.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPanelOrBackup}
                          onChange={(e) => setAddPanelOrBackup(e.target.checked)}
                          className="rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                        />
                        <span>
                          {isN8n
                            ? 'Enable automated daily PostgreSQL workflow backups'
                            : 'Enable automatic weekly off-site disaster snapshots'}
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="px-7 py-2.5 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer shrink-0"
                      >
                        {isN8n ? 'Deploy n8n Node' : 'Provision KVM VPS'}
                      </button>
                    </div>

                    {formError && (
                      <p className="text-xs font-medium text-rose-600">{formError}</p>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-6 h-6 text-[#0E6B63] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="font-display text-base font-bold text-[#0F172A]">
                        {selectedPlan.name} Queued for {contactEmail}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Stack: <strong>{selectedRuntime}</strong> in{' '}
                        <strong>{selectedRegion}</strong>
                        {hostnameInput.trim()
                          ? ` (${hostnameInput.trim()})`
                          : ''}
                        . Root credentials and panel instructions are on the way.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F172A] hover:border-slate-400 cursor-pointer shrink-0"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Warm Peach Soft Feature Card Grid */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#FDF2ED] px-6 sm:px-12 py-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] text-center max-w-2xl mx-auto"
              style={{ textWrap: 'balance' }}
            >
              {isN8n
                ? 'Everything Dedicated n8n Hosting Delivers'
                : 'Everything Our Unmanaged KVM VPS Platform Includes'}
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
              {pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4">
                    <ComputePillarArtwork id={pillar.id} />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#0F172A]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Platform FAQ Accordion */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0E6B63] mb-2">
              <Cpu className="w-4 h-4" aria-hidden="true" />
              <span>Technical Specifications &amp; Architecture</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {isN8n
                ? 'n8n Hosting Questions & Answers'
                : 'Unmanaged VPS Hosting FAQs'}
            </h2>
          </div>

          <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.question} className="py-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left py-1.5 cursor-pointer group"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                      {item.question}
                    </span>
                    <span className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 group-hover:border-[#0E6B63] group-hover:text-[#0E6B63]">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 pr-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CmsExtraSections
        sections={pageCms?.sections}
        onNavigateUrl={(url) => (onNavigatePath ? onNavigatePath(url) : onNavigateHome(url))}
      />
    </div>
  );
};
