import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import heroCloudImg from '../../assets/images/shared_hero_cloud_editorial_1794560710741.jpg';
import perfCacheImg from '../../assets/images/shared_performance_cache_1794560149227.jpg';
import builderDevicesImg from '../../assets/images/shared_website_builder_devices_1794560146382.jpg';
import migrationServersImg from '../../assets/images/migration_isometric_servers_1794556019724.jpg';
import {
  EXTRA_ONE_CLICK_APPS,
  POPULAR_WEB_APPS,
  SHARED_DATACENTERS,
  SHARED_PLANS,
  STACKCP_CORE_FEATURES,
  SharedHostingPlan,
  WORLDWIDE_HUB_COLUMNS,
} from '../../data/sharedHostingData';
import {
  AppBrandArtwork,
  CoreFeatureEmblem,
  FlagBadge,
  PlanResourceEmblem,
} from './SharedPlanEmblems';
import { StackCpFeaturesSection } from '../StackCpFeaturesSection';
import { FaqSection } from '../FaqSection';
import { CmsExtraSections } from '../cms/CmsExtraSections';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';

interface SharedHostingPageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

const WORLD_DOT_MARKERS = [
  { label: 'Seattle / Oregon', x: 18, y: 31 },
  { label: 'Dallas, TX', x: 24, y: 39 },
  { label: 'North Virginia', x: 30, y: 36 },
  { label: 'London, UK', x: 47, y: 27 },
  { label: 'Frankfurt, DE', x: 52, y: 29 },
  { label: 'São Paulo', x: 35, y: 69 },
  { label: 'Bahrain / UAE', x: 61, y: 45 },
  { label: 'Mumbai, IN', x: 67, y: 49 },
  { label: 'Singapore', x: 76, y: 59 },
  { label: 'Tokyo, JP', x: 85, y: 36 },
  { label: 'Sydney, AU', x: 87, y: 74 },
];

export const SharedHostingPage: React.FC<SharedHostingPageProps> = ({
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPrice } = useCurrency();
  const { cmsPages, hostingPlans, lastSearchedDomain, setOrderCheckoutDraft } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'shared-hosting');
  const [selectedRegion, setSelectedRegion] = useState<'uk' | 'us' | 'sg'>('uk');
  const [selectedPlan, setSelectedPlan] = useState<SharedHostingPlan | null>(null);
  const [trialEmail, setTrialEmail] = useState('');
  const [trialDomain, setTrialDomain] = useState('');
  const [trialError, setTrialError] = useState('');
  const [trialSubmitted, setTrialSubmitted] = useState(false);

  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showFullApps, setShowFullApps] = useState(false);
  const [migrationRequested, setMigrationRequested] = useState(false);

  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [perfImgFailed, setPerfImgFailed] = useState(false);
  const [builderImgFailed, setBuilderImgFailed] = useState(false);
  const [migrationImgFailed, setMigrationImgFailed] = useState(false);

  const activeDatacenter =
    SHARED_DATACENTERS.find((dc) => dc.id === selectedRegion) ?? SHARED_DATACENTERS[0];

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const liveSharedPlans: SharedHostingPlan[] = React.useMemo(() => {
    const adminShared = hostingPlans.filter(
      (p) => p.pageCategory === 'shared-hosting' && p.enabled
    );
    if (adminShared.length === 0) return SHARED_PLANS;
    return adminShared.map((ap, idx) => {
      const template =
        SHARED_PLANS.find(
          (sp) =>
            ap.id.includes(sp.id) ||
            sp.name.toLowerCase() === ap.name.toLowerCase()
        ) ?? SHARED_PLANS[idx % SHARED_PLANS.length];
      return {
        id: (ap.id as SharedHostingPlan['id']) || template.id,
        brandSeries: 'StackCP Cloud Suite',
        name: ap.name,
        audience: ap.audience || template.audience,
        tagline: ap.tagline || template.tagline,
        monthlyPrice: ap.monthlyPrice,
        annualPrice: ap.yearlyPrice,
        recommended: ap.popular,
        resources: template.resources,
        features: ap.features.length > 0 ? ap.features : template.features,
      };
    });
  }, [hostingPlans]);

  const handleSelectPlan = (plan: SharedHostingPlan) => {
    setSelectedPlan(plan);
    setTrialSubmitted(false);
    setTrialError('');
    setOrderCheckoutDraft({
      orderCategory: 'shared-hosting',
      planId: String(plan.id),
      planName: plan.name,
      productType: 'Shared Cloud',
      billingCycle: '1 Year',
      datacenterId: activeDatacenter.id,
      datacenterLabel: activeDatacenter.city,
      domainOption: lastSearchedDomain ? lastSearchedDomain.mode : 'register',
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
      onNavigatePath('/order/shared-hosting');
      return;
    }
    setTimeout(() => {
      scrollToElement('#shared-checkout-panel');
    }, 60);
  };

  const handleActivateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = trialEmail.trim();
    if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setTrialError('Please enter a valid business or personal email address.');
      return;
    }
    setTrialError('');
    setTrialSubmitted(true);
  };

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
            StackCP Shared Web Hosting
          </span>
        </div>
      </div>

      {/* 1. Shared Hosting Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Original Copy */}
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() || 'cpcloudhost.com · StackCP Cloud Platform'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Cloud-Powered StackCP Linux Hosting Built for Speed'}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  'Run your websites on resilient multi-server cloud architecture instead of a single crowded machine. Every StackCP account at cpcloudhost.com balances traffic across NVMe Linux nodes with automatic Wildcard SSL, global Anycast DNS, and a visual site builder ready out of the box.'}
              </p>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Manage domains, databases, mailboxes, and PHP versions from one clean
                control panel backed by 24/7 systems engineers and automated daily
                snapshots.
              </p>

              <div className="mt-7 flex items-baseline gap-2">
                <span className="text-sm text-slate-500">Starting at</span>
                <span className="font-mono-num font-display text-3xl font-extrabold text-[#0F172A]">
                  {formatPrice(2.5)}
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      scrollToElement(url || '#shared-plans');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
                >
                  <span>{pageCms?.primaryCtaText?.trim() || 'Launch Your Free Trial'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.secondaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      scrollToElement(url || '#shared-core-features');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6B63] hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Compare Cloud Capabilities'}</span>
                </button>
              </div>
            </div>

            {/* Right Clean Commercial Cloud Hardware Studio Visual */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgFailed ? (
                  <img
                    src={heroCloudImg}
                    alt="cpcloudhost.com brushed aluminum and dark slate StackCP cloud server hardware with security glass control console"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <Server className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      StackCP Multi-Node Cloud Cluster
                    </span>
                  </div>
                )}

                {/* Clean Architectural Spec Summary Strip Below Artwork (No Image Overlap) */}
                <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <ShieldCheck className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    <span>Wildcard SSL &amp; 1 Tbps+ Scrubbing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <Zap className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    <span>NVMe Storage &middot; 99.99% Uptime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Datacenter Region Selector + 3-Tier StackCP Shared Plans */}
      <section
        id="shared-plans"
        className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Pick Your StackCP Cloud Cluster &amp; Plan
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Deploy closer to your visitors across three regional edge hubs. Every
              cpcloudhost.com package includes automated Wildcard SSL encryption, 1 Tbps+
              network filtering, and round-the-clock engineering support.
            </p>
          </div>

          {/* 3 Datacenter Location Flag Cards */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[780px] mx-auto">
            {SHARED_DATACENTERS.map((dc) => {
              const isSelected = selectedRegion === dc.id;
              return (
                <button
                  key={dc.id}
                  type="button"
                  onClick={() => setSelectedRegion(dc.id)}
                  className={`flex items-center gap-3.5 px-5 py-4 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63] ${
                    isSelected
                      ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                      : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                  }`}
                >
                  <FlagBadge country={dc.id} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-bold text-[#0F172A] truncate">
                      {dc.country}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{dc.city}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle2
                      className="w-4 h-4 text-[#0E6B63] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 3-Column Plan Grid */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {liveSharedPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-7 flex flex-col justify-between transition-all ${
                    plan.recommended
                      ? 'border-[#0E6B63] bg-white shadow-[0_20px_48px_-20px_rgba(14,107,99,0.22)] ring-1 ring-[#0E6B63]/20'
                      : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                  } ${isSelected ? 'ring-2 ring-[#0E6B63]' : ''}`}
                >
                  <div>
                    {/* Plan Header */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{plan.brandSeries}</span>
                      {plan.recommended && (
                        <span className="font-semibold text-[#0E6B63]">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 font-display text-2xl sm:text-[26px] font-extrabold text-[#0F172A] tracking-tight">
                      {plan.name}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-[#0E6B63]">
                      {plan.audience} &middot;{' '}
                      <span className="font-normal text-slate-600">{plan.tagline}</span>
                    </p>

                    {/* Pricing */}
                    <div className="mt-6">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono-num font-display text-3xl font-extrabold text-[#0F172A]">
                          {formatPrice(plan.monthlyPrice)}
                        </span>
                        <span className="text-sm text-slate-500">/month</span>
                      </div>
                      <p className="font-mono-num text-xs text-slate-500 mt-1">
                        Billed annually at {formatPrice(plan.annualPrice)}/yr
                      </p>
                    </div>

                    {/* Get Started Action */}
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-3 px-5 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63] ${
                          plan.recommended
                            ? 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
                            : 'bg-[#0F172A] hover:bg-[#0E6B63] text-white'
                        }`}
                      >
                        Order {plan.name}
                      </button>
                      <p className="text-[11px] text-center text-slate-500 mt-2">
                        1M / 1Y / 2Y / 4Y cycles &middot; {activeDatacenter.city}
                      </p>
                    </div>

                    <hr className="my-6 border-[#E2E8F0]" />

                    {/* 4 Core Resource Rows with Custom Color Image Emblems */}
                    <div className="space-y-2.5">
                      {plan.resources.map((res) => (
                        <div
                          key={res.label}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/80"
                        >
                          <PlanResourceEmblem kind={res.key} />
                          <span className="font-mono-num text-xs sm:text-sm font-semibold text-[#0F172A]">
                            {res.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* StackCP Feature Checklist */}
                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600"
                        >
                          <Check
                            className="w-4 h-4 text-[#0E6B63] shrink-0"
                            aria-hidden="true"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inline 30-Day Free Trial / Provisioning Panel (Zero Modals) */}
          <div
            id="shared-checkout-panel"
            className={`mt-8 rounded-2xl border p-6 sm:p-7 transition-all ${
              selectedPlan
                ? 'border-[#0E6B63] bg-[#F4FAF9]'
                : 'border-[#E2E8F0] bg-[#F8FAFC]'
            }`}
          >
            {selectedPlan ? (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#0E6B63]">
                    Selected StackCP Configuration
                  </p>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] mt-0.5">
                    {selectedPlan.name} ({formatPrice(selectedPlan.monthlyPrice)}/mo) &middot;{' '}
                    {activeDatacenter.clusterLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Includes 30-day risk-free evaluation, complimentary migration, and Free
                    Wildcard SSL.
                  </p>
                </div>

                {!trialSubmitted ? (
                  <form
                    onSubmit={handleActivateTrial}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto"
                    noValidate
                  >
                    <input
                      type="text"
                      value={trialDomain}
                      onChange={(e) => setTrialDomain(e.target.value)}
                      placeholder="Domain (optional, e.g. mybrand.com)"
                      aria-label="Primary domain name"
                      className="px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0E6B63] sm:w-56"
                    />
                    <input
                      type="email"
                      value={trialEmail}
                      onChange={(e) => {
                        setTrialEmail(e.target.value);
                        setTrialError('');
                      }}
                      placeholder="Work or personal email"
                      aria-label="Email address for StackCP setup"
                      className="px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0E6B63] sm:w-56"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Provision 30-Day Trial
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#10B981]/40 text-sm text-[#0F172A]">
                    <CheckCircle2
                      className="w-5 h-5 text-[#10B981] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      StackCP sandbox queued for <strong>{trialEmail}</strong> on{' '}
                      <strong>{activeDatacenter.city}</strong>. Reach out on WhatsApp or
                      check your inbox for onboarding credentials.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
                  <span>
                    Active Cluster:{' '}
                    <strong className="text-[#0F172A]">
                      {activeDatacenter.clusterLabel}
                    </strong>{' '}
                    ({activeDatacenter.latencyLabel}) &mdash; Choose any tier above to
                    launch your 30-day StackCP cloud trial.
                  </span>
                </div>
                <span className="font-mono-num text-xs font-semibold text-[#0E6B63] whitespace-nowrap">
                  Instant Setup &middot; Cancel Anytime
                </span>
              </div>
            )}

            {trialError && (
              <p className="mt-2.5 text-xs font-medium text-red-600">{trialError}</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities of StackCP Cloud Hosting */}
      <section id="shared-core-features" className="bg-white py-16 lg:py-20">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#EFF5FB] border border-[#DCE7F3] px-6 sm:px-10 lg:px-14 py-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] text-center"
              style={{ textWrap: 'balance' }}
            >
              Engineered Into Every StackCP Cloud Account
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 text-center">
              {STACKCP_CORE_FEATURES.map((feat) => (
                <div key={feat.id} className="flex flex-col items-center">
                  <div className="mb-4">
                    <CoreFeatureEmblem id={feat.id} />
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                    {feat.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-[300px]">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllSpecs((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
              >
                <span>{showAllSpecs ? 'Hide Technical Matrix' : 'View Technical Specs'}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {showAllSpecs && (
              <div className="mt-6 pt-6 border-t border-[#D2E0EE] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {[
                  {
                    label: 'PHP & Runtime Control',
                    detail:
                      'Select PHP 5.6 through PHP 8.4 per domain alongside Node.js, Python & Ruby environments.',
                  },
                  {
                    label: 'Caching & Transport',
                    detail:
                      'NGINX Edge Cache, StackCache acceleration, HTTP/3 QUIC, Brotli & Global Anycast CDN.',
                  },
                  {
                    label: 'Developer Utilities',
                    detail:
                      'SSH access, SFTP/FTPS, WP-CLI, Git deployments, Cron jobs & phpMyAdmin.',
                  },
                  {
                    label: 'Security & Continuity',
                    detail:
                      '1 Tbps+ DDoS filtering, continuous malware scans, 2FA & daily off-site snapshots.',
                  },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="p-4 rounded-xl bg-white border border-[#DCE7F3]"
                  >
                    <div className="font-display text-xs font-bold text-[#0E6B63]">
                      {spec.label}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {spec.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Consistent Speed & Performance Split Showcase */}
      <section className="bg-white py-14 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Image Visual */}
            <div className="lg:col-span-6 flex items-center justify-center">
              {!perfImgFailed ? (
                <img
                  src={perfCacheImg}
                  alt="StackCP NGINX edge caching core with high-speed CDN routing nodes"
                  referrerPolicy="no-referrer"
                  onError={() => setPerfImgFailed(true)}
                  className="w-full max-w-[520px] h-auto rounded-2xl object-contain mix-blend-multiply"
                />
              ) : (
                <div className="w-full max-w-[500px] aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <Zap className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                  <span className="font-display text-sm font-bold text-[#0F172A]">
                    StackCache + Global Anycast CDN
                  </span>
                </div>
              )}
            </div>

            {/* Right Original Copy */}
            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Consistent Speed Under Real-World Traffic
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                    Dynamic Resource Allocation
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    Instead of forcing PHP workers, SQL queries, and email delivery onto one
                    congested box, cpcloudhost.com routes workloads across isolated StackCP
                    microservices paired with edge page caching and global CDN distribution.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                    Resilience During Traffic Surges
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    When product launches, seasonal promotions, or viral campaigns drive heavy
                    concurrent connections, compute capacity scales seamlessly under our
                    99.99% uptime SLA and round-the-clock engineering monitoring.
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => scrollToElement('#shared-plans')}
                  className="inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors cursor-pointer"
                >
                  Start 30-Day Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Visual Site Builder + Domain Registration Dual Showcase Banner */}
      <section className="bg-white py-14 lg:py-16 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Wide Showcase: Website Builder */}
            <div className="lg:col-span-8 rounded-2xl bg-[#EDF5F2] border border-[#D4E6DF] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
              <div className="sm:w-[44%] shrink-0">
                <p className="text-xs font-semibold text-[#0E6B63]">
                  Visual Drag-and-Drop Builder Included
                </p>
                <h3 className="font-display text-2xl sm:text-[28px] font-extrabold text-[#0F172A] leading-tight mt-2">
                  Design &amp; Publish Without Writing Code
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Assemble responsive company pages, portfolios, and storefronts directly
                  inside StackCP with mobile-ready layout blocks included free.
                </p>
                <button
                  type="button"
                  onClick={() => scrollToElement('#shared-plans')}
                  className="mt-5 inline-flex items-center justify-center px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explore StackCP Plans
                </button>
              </div>

              <div className="sm:w-[56%] flex items-center justify-center">
                {!builderImgFailed ? (
                  <img
                    src={builderDevicesImg}
                    alt="Responsive web templates displayed cleanly across laptop, tablet, and smartphone"
                    referrerPolicy="no-referrer"
                    onError={() => setBuilderImgFailed(true)}
                    className="w-full h-auto rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-full aspect-video rounded-xl bg-white border border-[#D4E6DF] flex items-center justify-center p-6 text-xs font-semibold text-[#0E6B63]">
                    Responsive Visual Website Builder
                  </div>
                )}
              </div>
            </div>

            {/* Right Deep Teal Domain Card */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0E6B63] text-white p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#A7F3D0]">
                  Domain Registration &amp; DNS
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-bold mt-2 leading-snug">
                  Lock in your brand domain &amp; WHOIS privacy
                </h3>
                <p className="text-xs sm:text-sm text-teal-50/90 mt-2.5 leading-relaxed">
                  Register popular domain extensions alongside your cpcloudhost.com cloud
                  hosting with instant DNSSEC &amp; record sync.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-white/15">
                <div className="font-mono-num font-display text-2xl sm:text-3xl font-extrabold text-white">
                  .com{' '}
                  <span className="text-lg font-semibold text-[#A7F3D0]">
                    {formatPrice(9.99)}/yr
                  </span>
                </div>
                <p className="font-mono-num text-xs text-teal-100 mt-1">
                  .co.uk {formatPrice(6.99)}/yr &middot; .net {formatPrice(11.99)}/yr &middot; .io{' '}
                  {formatPrice(34.99)}/yr
                </p>

                <button
                  type="button"
                  onClick={() => onNavigateHome('#domain-search')}
                  className="mt-5 w-full py-2.5 px-5 text-xs sm:text-sm font-semibold text-[#0F172A] bg-white hover:bg-[#EDF5F2] rounded-lg transition-colors cursor-pointer"
                >
                  Find Your Domain
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 80+ One-Click Web Apps Catalog (Full-Color Authentic Brand Emblems) */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Deploy 80+ Open-Source Applications in One Click
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Skip manual file uploads and SQL setup. Provision WordPress, Moodle, Magento,
              SuiteCRM, phpBB, and dozens more straight from your cpcloudhost.com StackCP
              control panel with automated updates.
            </p>
            <p className="mt-7 font-display text-xs font-bold tracking-wider uppercase text-[#0F172A]">
              Featured Web Applications
            </p>
          </div>

          {/* 6x3 App Brand Grid */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-y-10 gap-x-6 text-center">
            {POPULAR_WEB_APPS.map((app) => (
              <div
                key={app.id}
                className="flex flex-col items-center group transition-transform duration-150 hover:-translate-y-0.5"
              >
                <AppBrandArtwork id={app.id} />
                <span className="mt-2.5 text-xs font-semibold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                  {app.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={() => setShowFullApps((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
            >
              <span>
                {showFullApps
                  ? 'Collapse App Directory'
                  : 'Browse Complete StackCP App Directory'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {showFullApps && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5 p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              {EXTRA_ONE_CLICK_APPS.map((col) => (
                <div key={col.group}>
                  <h4 className="font-display text-xs font-bold text-[#0E6B63] mb-2.5">
                    {col.group}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {col.apps.map((name) => (
                      <li key={name} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. Global Edge Network & Data Centre Coverage */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Global Edge Network &amp; Data Centre Coverage
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Host across North America, Europe, Asia-Pacific, and the Middle East with
              unified Anycast DNS routing managed from a single cpcloudhost.com account.
            </p>
          </div>

          {/* Crisp Dotted World Map Illustration */}
          <div className="mt-10 max-w-[920px] mx-auto relative">
            <div className="relative w-full aspect-[2.1/1] bg-[#FAFAFC] rounded-2xl border border-[#E2E8F0]/80 overflow-hidden p-4">
              <svg
                viewBox="0 0 1000 460"
                className="w-full h-full"
                fill="none"
                aria-label="Global datacentre edge routing map"
              >
                {/* North America */}
                {[
                  [130, 120], [150, 110], [170, 100], [190, 95], [215, 95], [240, 105], [265, 115], [290, 118],
                  [145, 140], [170, 138], [195, 136], [220, 136], [245, 138], [270, 140], [295, 145],
                  [165, 165], [190, 165], [215, 165], [240, 166], [265, 168], [285, 170],
                  [185, 190], [210, 192], [235, 194], [255, 196], [225, 220], [245, 232],
                ].map(([cx, cy], idx) => (
                  <circle key={`na-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {/* South America */}
                {[
                  [295, 275], [315, 270], [335, 282], [355, 295], [372, 315],
                  [310, 300], [330, 305], [350, 322], [322, 330], [342, 342],
                  [325, 360], [332, 385], [324, 408],
                ].map(([cx, cy], idx) => (
                  <circle key={`sa-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {/* Europe */}
                {[
                  [462, 115], [482, 108], [505, 105], [528, 108], [548, 114],
                  [472, 136], [492, 134], [514, 134], [534, 136], [552, 138],
                  [480, 158], [502, 158], [525, 158],
                ].map(([cx, cy], idx) => (
                  <circle key={`eu-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {/* Africa */}
                {[
                  [478, 196], [502, 194], [526, 196], [548, 205],
                  [482, 222], [506, 222], [532, 224], [554, 234],
                  [505, 252], [528, 255], [546, 268],
                  [520, 286], [538, 296], [528, 324],
                ].map(([cx, cy], idx) => (
                  <circle key={`af-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {/* Asia */}
                {[
                  [585, 118], [612, 114], [640, 112], [670, 110], [700, 114], [732, 118], [764, 126], [795, 135],
                  [595, 145], [625, 142], [655, 140], [685, 140], [715, 142], [745, 145], [775, 150], [805, 158],
                  [605, 175], [635, 172], [665, 172], [695, 174], [725, 176], [755, 180], [785, 185], [848, 168],
                  [622, 204], [655, 204], [682, 212], [712, 212], [742, 215], [768, 225],
                  [672, 238], [745, 248], [772, 266],
                ].map(([cx, cy], idx) => (
                  <circle key={`as-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {/* Australia */}
                {[
                  [825, 326], [850, 322], [875, 328], [895, 342],
                  [835, 348], [862, 348], [886, 358], [868, 372],
                ].map(([cx, cy], idx) => (
                  <circle key={`au-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}

                {/* Active Location Marker Pins */}
                {WORLD_DOT_MARKERS.map((pin) => {
                  const cx = (pin.x / 100) * 1000;
                  const cy = (pin.y / 100) * 460;
                  return (
                    <g key={pin.label} transform={`translate(${cx}, ${cy})`}>
                      <circle cx="0" cy="0" r="10" fill="#0E6B63" opacity="0.16" />
                      <path
                        d="M0 -18C-5.5 -18 -10 -13.5 -10 -8C-10 -1.5 0 6 0 6C0 6 10 -1.5 10 -8C10 -13.5 5.5 -18 0 -18Z"
                        fill="#0E6B63"
                        stroke="#FFFFFF"
                        strokeWidth="1.6"
                      />
                      <circle cx="0" cy="-8.5" r="3" fill="#FFFFFF" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* 6-Column Regional City Directory */}
          <div className="mt-10">
            <h3 className="font-display text-xs font-bold text-[#0F172A] mb-5">
              Global Edge Routing Directory
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {WORLDWIDE_HUB_COLUMNS.map((col) => (
                <div key={col.region}>
                  <div className="font-display text-xs font-bold text-[#0F172A] mb-2.5">
                    {col.region}
                  </div>
                  <ul className="space-y-1 text-[11px] sm:text-xs text-slate-600 leading-snug">
                    {col.cities.map((city) => (
                      <li key={city}>{city}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Risk-Free Evaluation Mint-Teal Callout */}
      <section className="bg-[#DFECEB] border-b border-[#CDE0DF] py-9">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              Test StackCP Hosting Risk-Free for 30 Days
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Experience multi-node NVMe speed, one-click staging, and direct engineer support
              on cpcloudhost.com before committing long term.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToElement('#shared-plans')}
            className="inline-flex items-center justify-center px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Claim Your Free Trial
          </button>
        </div>
      </section>

      {/* 9. Hands-Free Migrations Showcase + Switch Credits Dark Bar */}
      <section className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Hands-Free Migrations From Any Hosting Panel
              </h2>
              <p className="mt-4 text-sm sm:text-base font-bold text-[#0F172A]">
                Keep Your Domains, Mail &amp; Search Rankings Intact
              </p>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                Moving from cPanel, Plesk, DirectAdmin, or another StackCP provider? Our
                migration team verifies every file, SQL database, inbox, and SSL record prior
                to DNS cutover so visitors notice zero interruption.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMigrationRequested(true)}
                  className="inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors cursor-pointer"
                >
                  Schedule a Free Migration
                </button>
                {migrationRequested && (
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0E6B63]">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    Concierge migration queued — message WhatsApp or email
                    support@cpcloudhost.com
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[540px] select-none pointer-events-none">
                {!migrationImgFailed ? (
                  <img
                    src={migrationServersImg}
                    alt="Isometric StackCP migration server cluster transferring cPanel, Plesk, and WordPress sites"
                    referrerPolicy="no-referrer"
                    onError={() => setMigrationImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center gap-2 text-sm font-bold text-[#0E6B63]">
                    <Globe className="w-5 h-5" aria-hidden="true" />
                    Zero-Downtime StackCP Migration Cluster
                  </div>
                )}
                <div className="hidden sm:block absolute top-[2%] left-1/2 -translate-x-1/2 font-display text-sm font-extrabold text-[#0F172A]">
                  StackCP<sup>&reg;</sup>
                </div>
                <div className="hidden sm:block absolute top-[18%] left-[19%] font-display text-sm font-extrabold italic text-[#0F172A]">
                  cPanel
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sleek Dark Switch Credits Banner */}
        <div className="bg-[#0B0F17] text-white py-9">
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Bring Your Unused Hosting Balance via Switch Credits
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Locked into an annual plan elsewhere? Join cpcloudhost.com and we&apos;ll
                credit up to 6 months of remaining hosting time so you never double-pay.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToElement('#shared-plans')}
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
            >
              <span>Apply Switch Credits</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. Original StackCP Platform Showcase */}
      <StackCpFeaturesSection
        heading="Why Teams Standardise on StackCP Cloud"
        subheading="Engineered for agencies, WooCommerce stores, and high-growth websites on cpcloudhost.com — uniting autoscaling cloud compute, wildcard SSL, and bulk WordPress management in one clean workspace."
        onViewFeatures={() => scrollToElement('#shared-core-features')}
      />

      {/* 11. Interactive FAQ's */}
      <FaqSection />

      {/* Custom CMS Sections */}
      <CmsExtraSections
        sections={pageCms?.sections}
        onNavigateUrl={(url) => (onNavigatePath ? onNavigatePath(url) : onNavigateHome(url))}
      />
    </div>
  );
};
