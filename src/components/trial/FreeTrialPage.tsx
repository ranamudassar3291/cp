import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Layers,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-react';
import heroTrialImg from '../../assets/images/free_trial_hero_showcase_1794562765306.jpg';
import panelsTrialImg from '../../assets/images/free_trial_stackcp_panels_1794562765174.jpg';
import workflowTrialImg from '../../assets/images/free_trial_workflow_clean_1794562785388.jpg';
import migrationTrialImg from '../../assets/images/free_trial_migration_clean_1794562786334.jpg';
import {
  TRIAL_DATACENTERS,
  TRIAL_ELIGIBLE_PLANS,
  TRIAL_INCLUDED_CAPABILITIES,
  TRIAL_REVIEWS,
  TRIAL_WORKFLOW_STEPS,
  TrialDatacenter,
  TrialEligiblePlan,
} from '../../data/freeTrialData';
import {
  TrialFeatureEmblem,
  TrialFlagBadge,
  TrialResourceEmblem,
} from './FreeTrialEmblems';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface FreeTrialPageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

export const FreeTrialPage: React.FC<FreeTrialPageProps> = ({
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPrice, formatPriceString } = useCurrency();
  const { cmsPages } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'free-trial');
  const zeroToday = formatPrice(0);
  const [selectedDc, setSelectedDc] = useState<TrialDatacenter>(
    TRIAL_DATACENTERS[0]
  );
  const [selectedPlan, setSelectedPlan] = useState<TrialEligiblePlan>(
    TRIAL_ELIGIBLE_PLANS[1]
  );
  const [promoCode, setPromoCode] = useState('STARTFREE');
  const [promoCopied, setPromoCopied] = useState(false);

  const [showActivationPanel, setShowActivationPanel] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [workspaceDomain, setWorkspaceDomain] = useState('');
  const [formError, setFormError] = useState('');
  const [trialProvisioned, setTrialProvisioned] = useState(false);

  const [heroImgError, setHeroImgError] = useState(false);
  const [panelsImgError, setPanelsImgError] = useState(false);
  const [workflowImgError, setWorkflowImgError] = useState(false);
  const [migrationImgError, setMigrationImgError] = useState(false);

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleChoosePlan = (plan: TrialEligiblePlan) => {
    setSelectedPlan(plan);
    setPromoCode('STARTFREE');
    setShowActivationPanel(true);
    setTrialProvisioned(false);
    setFormError('');
    setTimeout(() => {
      scrollToElement('#trial-activation-panel');
    }, 60);
  };

  const handleApplyPromoBanner = () => {
    setPromoCode('STARTFREE');
    setPromoCopied(true);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('STARTFREE').catch(() => {});
    }
    setTimeout(() => setPromoCopied(false), 2200);
  };

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = accountEmail.trim();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setFormError('Please enter a valid email address for StackCP credentials.');
      return;
    }
    setFormError('');
    setTrialProvisioned(true);
  };

  const isStartFreeApplied = promoCode.trim().toUpperCase() === 'STARTFREE';

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb Navigation Bar */}
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
          <span className="text-slate-600">Web Hosting</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-[#0E6B63]">
            30-Day Free Trial
          </span>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() ||
                  'cpcloudhost.com · Risk-Free StackCP Evaluation'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Enterprise Cloud Hosting. Free for 30 Days.'}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  'Deploy or migrate live websites onto the high-availability StackCP cloud infrastructure at cpcloudhost.com. Benchmark NVMe storage, 99.99% uptime resiliency, and direct 24/7 engineering support with unrestricted access.'}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      scrollToElement(url || '#trial-plans');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
                >
                  <span>{pageCms?.primaryCtaText?.trim() || 'Start Your Free Trial'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-4 text-xs sm:text-sm font-medium text-slate-500">
                {zeroToday} due today &middot; Cancel anytime &middot; Instant provisioning
              </p>
            </div>

            {/* Right Studio Visual */}
            <div className="lg:col-span-6 flex items-center justify-center lg:justify-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgError ? (
                  <img
                    src={heroTrialImg}
                    alt="StackCP telemetry and cloud security dashboard panels on a clean pastel studio backdrop"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <Layers className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      StackCP 30-Day Free Trial Workspace
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trial Eligible Plans & Regional Datacentre Selector */}
      <section id="trial-plans" className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Eligible Plans for Your 30-Day Trial
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Launch your complimentary 30-day cloud container on cpcloudhost.com and
              verify real-world speed firsthand. Enter promo code{' '}
              <span className="font-mono font-bold text-[#0F172A]">STARTFREE</span> at
              checkout if it is not applied automatically.
            </p>
          </div>

          {/* Unified 3-Region Datacentre Tray */}
          <div className="mt-8 flex justify-center">
            <div
              role="tablist"
              aria-label="Choose trial datacentre location"
              className="w-full max-w-[660px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.14)] grid grid-cols-1 sm:grid-cols-3 gap-1"
            >
              {TRIAL_DATACENTERS.map((dc, index) => {
                const active = selectedDc.id === dc.id;
                return (
                  <button
                    key={dc.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedDc(dc)}
                    className={`relative flex items-center justify-center sm:justify-start gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                      active
                        ? 'border-[1.5px] border-[#0284C7] bg-white shadow-[0_6px_16px_-8px_rgba(2,132,199,0.35)] z-10'
                        : 'border-[1.5px] border-transparent hover:bg-slate-50/80'
                    }`}
                  >
                    {index > 0 && !active && (
                      <span
                        aria-hidden="true"
                        className="hidden sm:block absolute left-0 top-3 bottom-3 w-px bg-slate-200/80"
                      />
                    )}
                    <TrialFlagBadge countryId={dc.id} />
                    <div className="min-w-0">
                      <div className="font-display text-sm font-semibold text-[#0F172A] truncate">
                        {dc.country}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {dc.city}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Column Bordered First-Tier Trial Plans (Cloud Ignite, WP Core, WinCore Pro) */}
          <div className="mt-11 max-w-[1060px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {TRIAL_ELIGIBLE_PLANS.map((plan) => {
              const isSelected =
                showActivationPanel && selectedPlan.id === plan.id;
              const isAmber = plan.highlightTone === 'amber';

              return (
                <div
                  key={plan.id}
                  className={`rounded-[20px] border bg-white p-7 sm:p-8 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20 shadow-[0_18px_40px_-20px_rgba(2,132,199,0.25)]'
                      : 'border-[#B8C2CE] hover:border-[#64748B]'
                  }`}
                >
                  <div>
                    {/* Left-Aligned Header + Full-Width Black Banner */}
                    <div className="text-left">
                      <p className="text-xs font-medium text-slate-600">
                        {plan.eyebrow}
                      </p>
                      <h3 className="mt-1 font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
                        {plan.name}
                      </h3>

                      <div className="mt-3">
                        <span className="block w-full py-2 px-3.5 rounded-[4px] bg-[#000000] text-white text-xs sm:text-[13px] font-bold tracking-wide">
                          {plan.audienceTag}
                        </span>
                      </div>
                    </div>

                    {/* Full-Width Outline Pill Button */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleChoosePlan(plan)}
                        className="w-full py-2.5 px-5 rounded-full border border-[#0F172A] bg-white text-[#0F172A] hover:bg-[#0F172A] hover:text-white text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
                      >
                        Start Your Free Trial
                      </button>
                    </div>

                    {/* Highlighted Resource Rows + Features */}
                    <div className="mt-6 space-y-3">
                      {plan.resources.map((res) => (
                        <div key={res.key} className="flex items-center gap-3">
                          <TrialResourceEmblem resourceKey={res.key} />
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-[13px] font-medium leading-tight ${
                              isAmber
                                ? 'bg-[#F7EDD1] text-[#3F2E07]'
                                : 'bg-[#9FD3E8] text-[#082F49]'
                            }`}
                          >
                            {res.label}
                          </span>
                        </div>
                      ))}

                      {plan.features.map((feat) => (
                        <div
                          key={feat.label}
                          className="flex items-center gap-3 text-xs sm:text-[13px] font-normal text-[#1E293B]"
                        >
                          <TrialFeatureEmblem featureKey={feat.key} />
                          <span>{feat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bordered Promo Code Strip Directly Below Plans */}
          <div className="mt-8 rounded-2xl border border-[#CBD5E1] bg-white px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              Apply promo code{' '}
              <strong className="font-mono text-[#0F172A]">STARTFREE</strong> at
              checkout to unlock your 30-day cloud trial at{' '}
              <strong className="text-[#0F172A]">{zeroToday} due today</strong> (domain
              registrations billed separately).
            </p>
            <button
              type="button"
              onClick={handleApplyPromoBanner}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-[#F8FAFC] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {promoCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                  <span className="text-[#0E6B63]">Copied STARTFREE</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Copy STARTFREE</span>
                </>
              )}
            </button>
          </div>

          {/* Inline 30-Day Free Trial Provisioning Panel (No Modal Pop-Up) */}
          {showActivationPanel && (
            <div
              id="trial-activation-panel"
              className="mt-8 rounded-2xl border-2 border-[#0E6B63] bg-[#F8FAFC] p-6 sm:p-8"
            >
              {!trialProvisioned ? (
                <form
                  onSubmit={handleActivateSubmit}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  <div className="lg:col-span-5">
                    <p className="text-xs font-semibold tracking-wide text-[#0E6B63]">
                      Instant StackCP Trial Setup &middot; {zeroToday} Due Today
                    </p>
                    <h3 className="mt-1.5 font-display text-xl font-bold text-[#0F172A]">
                      {selectedPlan.name} ({selectedPlan.eyebrow})
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600">
                      Cluster: <strong>{selectedDc.clusterLabel}</strong>
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between text-sm">
                      <span className="text-slate-600">Due Today (30 Days):</span>
                      <span className="font-mono-num font-display text-2xl font-extrabold text-[#0E6B63]">
                        {zeroToday}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="trial-email"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Account Email Address
                        </label>
                        <input
                          id="trial-email"
                          type="email"
                          required
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="trial-domain"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Primary Domain (or leave blank for temp URL)
                        </label>
                        <input
                          id="trial-domain"
                          type="text"
                          value={workspaceDomain}
                          onChange={(e) => setWorkspaceDomain(e.target.value)}
                          placeholder="example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                      <div className="flex-1">
                        <label
                          htmlFor="trial-promo-input"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Promo Code
                        </label>
                        <input
                          id="trial-promo-input"
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-mono text-sm font-bold text-[#0E6B63] focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div className="sm:pt-5">
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Launch 30-Day Trial
                        </button>
                      </div>
                    </div>

                    {isStartFreeApplied && (
                      <p className="text-xs font-medium text-[#0E6B63] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          Promo STARTFREE active — full StackCP evaluation unlocked at{' '}
                          {zeroToday} today.
                        </span>
                      </p>
                    )}

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
                        30-Day Trial Workspace Ready for {accountEmail}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        <strong>{selectedPlan.name}</strong> deployed in{' '}
                        <strong>{selectedDc.city}</strong> with promo{' '}
                        <span className="font-mono font-bold text-[#0E6B63]">
                          {promoCode.toUpperCase() || 'STARTFREE'}
                        </span>
                        {workspaceDomain.trim()
                          ? ` mapped for ${workspaceDomain.trim()}`
                          : ' with an instant staging preview URL'}
                        .
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowActivationPanel(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F172A] hover:border-slate-400 cursor-pointer shrink-0"
                  >
                    Close Summary
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. What's Included in Your Free Trial */}
      <section className="bg-white py-16 lg:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left StackCP Panel Visual */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start min-w-0">
              <div className="w-full max-w-[540px]">
                {!panelsImgError ? (
                  <img
                    src={panelsTrialImg}
                    alt="Layered StackCP cloud control panels depicting SSL encryption, global CDN network, automated backups, and one-click app installer"
                    referrerPolicy="no-referrer"
                    onError={() => setPanelsImgError(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <ShieldCheck className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      Complete StackCP Feature Access
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Features List */}
            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Everything Included During Evaluation
              </h2>

              <ul className="mt-6 space-y-4">
                {TRIAL_INCLUDED_CAPABILITIES.map((item) => (
                  <li key={item.title} className="text-sm sm:text-[15px] leading-relaxed">
                    <div className="font-display font-bold text-[#0F172A]">
                      {item.title}
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-xs sm:text-sm font-medium text-slate-600">
                Every evaluation container runs on production NVMe clusters identical to
                our standard monthly plans.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => scrollToElement('#trial-plans')}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  Start Your Free Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dark High-Contrast Callout Strip */}
      <section className="bg-white py-10">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-[#0F172A] text-white px-7 sm:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Benchmark StackCP Cloud Speed Risk-Free Today
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl">
                Experience modern cloud hosting engineered by cpcloudhost.com with
                zero upfront obligation and promo code STARTFREE ready to apply.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToElement('#trial-plans')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#0E6B63] hover:bg-[#10B981] hover:text-[#0F172A] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. How Your 30-Day Free Trial Works */}
      <section className="bg-white py-16 lg:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Steps */}
            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                How Your 30-Day Trial Works
              </h2>

              <div className="mt-6 space-y-5">
                {TRIAL_WORKFLOW_STEPS.map((step) => (
                  <div key={step.stepLabel}>
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                      {formatPriceString(step.stepLabel)}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {formatPriceString(step.description)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => scrollToElement('#trial-plans')}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  Start Your Free Trial
                </button>
              </div>
            </div>

            {/* Right Onboarding Workflow Artwork */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!workflowImgError ? (
                  <img
                    src={workflowTrialImg}
                    alt="Instant StackCP provisioning and one-click website activation panels"
                    referrerPolicy="no-referrer"
                    onError={() => setWorkflowImgError(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      4-Step Instant Trial Activation
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Verified Customer Feedback Band */}
      <section className="bg-[#F4F5F7] py-14 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200/80">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Customer Reviews
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
                Trusted across thousands of live web applications on cpcloudhost.com
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0F172A]">
              <div className="flex items-center gap-0.5 text-[#0E6B63]" aria-hidden="true">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span>Verified reviews across Trustpilot &amp; independent partners</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRIAL_REVIEWS.map((review) => (
              <div
                key={review.author}
                className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between"
              >
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  &ldquo;{review.quote}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="font-display text-sm font-bold text-[#0F172A]">
                    {review.author}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {review.role} &middot; {review.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Migrate for Free — With Zero Downtime */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Migration Hub Visual */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start min-w-0">
              <div className="w-full max-w-[540px]">
                {!migrationImgError ? (
                  <img
                    src={migrationTrialImg}
                    alt="Zero-downtime StackCP site, database, and email migration workflow"
                    referrerPolicy="no-referrer"
                    onError={() => setMigrationImgError(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <RefreshCw className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      Zero-Downtime Migration Hub
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Migration Copy */}
            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Migrate Live Sites With Zero Downtime
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Switch smoothly from cPanel, Plesk, or external StackCP hosts via our
                automated Migration Hub. Our engineering team syncs web files, SQL
                databases, and mailboxes cleanly while your production site remains
                online throughout evaluation.
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => scrollToElement('#trial-plans')}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  Start Your Free Trial
                </button>
              </div>
            </div>
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
