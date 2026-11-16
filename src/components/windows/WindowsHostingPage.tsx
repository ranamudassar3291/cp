import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import winHeroImg from '../../assets/images/win_hero_iis_studio_1794561960970.jpg';
import winPerfImg from '../../assets/images/win_performance_iis_cache_1794561962436.jpg';
import {
  WINDOWS_ADVANTAGE_PILLARS,
  WINDOWS_CORE_FEATURES,
  WINDOWS_FAQS,
  WINDOWS_PLANS,
  WindowsHostingPlan,
} from '../../data/windowsHostingData';
import { WORLDWIDE_HUB_COLUMNS } from '../../data/sharedHostingData';
import {
  WinAdvantageArtwork,
  WinCoreArtwork,
  WinPlanResourceEmblem,
} from './WindowsEmblems';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface WindowsHostingPageProps {
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

export const WindowsHostingPage: React.FC<WindowsHostingPageProps> = ({
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPrice, formatPriceString } = useCurrency();
  const { cmsPages, lastSearchedDomain, setOrderCheckoutDraft } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'windows-hosting');
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);
  const [selectedPlanSummary, setSelectedPlanSummary] = useState<string>('');
  const [trialEmail, setTrialEmail] = useState('');
  const [trialDomain, setTrialDomain] = useState('');
  const [trialError, setTrialError] = useState('');
  const [trialSubmitted, setTrialSubmitted] = useState(false);

  const [showAllWinSpecs, setShowAllWinSpecs] = useState(false);
  const [showFullFeatures, setShowFullFeatures] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [perfImgFailed, setPerfImgFailed] = useState(false);

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPlan = (plan: WindowsHostingPlan) => {
    setSelectedPlanName(plan.name);
    setSelectedPlanSummary(`${formatPrice(plan.monthlyPrice)}/mo · ${plan.audience}`);
    setOrderCheckoutDraft({
      orderCategory: 'windows-hosting',
      planId: plan.id,
      planName: plan.name,
      productType: 'Windows Hosting',
      billingCycle: '1 Year',
      datacenterId: 'uk',
      datacenterLabel: 'London, UK',
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
      onNavigatePath('/order/windows-hosting');
      return;
    }
    setTimeout(() => {
      scrollToElement('#win-checkout-panel');
    }, 60);
  };

  const handleSelectFiveYear = () => {
    setSelectedPlanName('Exclusive 5-Year WinCore Pro');
    setSelectedPlanSummary(`${formatPrice(75)} One-Off · All WinCore Pro Specs Locked`);
    setOrderCheckoutDraft({
      orderCategory: 'windows-hosting',
      planId: 'plan-win-core',
      planName: 'WinCore Pro (5-Year Lock)',
      productType: 'Windows Hosting',
      billingCycle: '4 Years',
      datacenterId: 'uk',
      datacenterLabel: 'London, UK',
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
      onNavigatePath('/order/windows-hosting');
      return;
    }
    setTimeout(() => {
      scrollToElement('#win-checkout-panel');
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
            Windows Web Hosting
          </span>
        </div>
      </div>

      {/* 1. Windows Web Hosting Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() ||
                  'cpcloudhost.com · StackCP Windows IIS Cloud'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Enterprise Windows Cloud & ASP.NET Web Hosting'}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  'Power data-driven Microsoft .NET portals, WebForms apps, and IIS 10 websites inside isolated StackCP Windows containers at cpcloudhost.com. Built natively for ASP.NET Core, MS SQL Server, and seamless Visual Studio Web Deploy workflows.'}
              </p>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Every environment ships with Wildcard SSL, global Anycast DNS routing, daily
                snapshots, and round-the-clock Windows systems specialists ready when your
                team deploys.
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
                      scrollToElement(url || '#win-plans');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
                >
                  <span>{pageCms?.primaryCtaText?.trim() || 'Start Free Trial Now'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.secondaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      scrollToElement(url || '#win-core-features');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6B63] hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Explore IIS 10 Architecture'}</span>
                </button>
              </div>
            </div>

            {/* Right High-End Commercial Windows Server Studio Visual */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgFailed ? (
                  <img
                    src={winHeroImg}
                    alt="Enterprise Windows Server compute tower beside glass IIS 10 telemetry dashboard and SSL badge"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <Server className="w-10 h-10 text-[#0284C7]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      Windows IIS 10 &amp; ASP.NET Cloud Cluster
                    </span>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <ShieldCheck className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    <span>ASP.NET Core + .NET Framework 4.8</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <Zap className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
                    <span>MS SQL Add-Ons &amp; Wildcard SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Windows Cloud Plans + Exclusive 5-Year Value Tier */}
      <section
        id="win-plans"
        className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Pick Your Windows IIS &amp; .NET Cloud Package
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Provision dedicated Microsoft IIS application pools backed by 1 Tbps+ network
              filtering, Wildcard SSL certificates, and round-the-clock Windows systems
              engineering on cpcloudhost.com.
            </p>
          </div>

          {/* 3-Column Windows Plan Cards */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {WINDOWS_PLANS.map((plan) => {
              const isSelected = selectedPlanName === plan.name;
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

                    <p className="mt-1.5 text-xs font-semibold text-[#0E6B63]">
                      {plan.audience}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      {plan.tagline}
                    </p>
                    <p className="mt-2.5 text-[11px] font-semibold text-[#0284C7]">
                      {plan.annualBonus}
                    </p>

                    {/* Pricing */}
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="font-mono-num font-display text-3xl font-extrabold text-[#0F172A]">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-sm text-slate-500">/month</span>
                    </div>

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
                        Try {plan.name}
                      </button>
                      <p className="text-[11px] text-center text-slate-500 mt-2.5 leading-snug">
                        Free domain name included automatically on annual plans.
                      </p>
                    </div>

                    <hr className="my-6 border-[#E2E8F0]" />

                    {/* 4 Windows Resource Spec Rows */}
                    <div className="space-y-2.5">
                      {plan.resources.map((res) => (
                        <div
                          key={res.label}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#F0F7FC] border border-[#D4E7F5]"
                        >
                          <WinPlanResourceEmblem kind={res.key} />
                          <span className="font-mono-num text-xs sm:text-sm font-semibold text-[#0F172A]">
                            {res.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Checklist */}
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

          {/* Exclusive 5-Year Value Container Card (Inspired by Dark Bottom Card) */}
          <div className="mt-8 rounded-2xl bg-[#0F172A] text-white p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Lock In 5-Year Windows Value Pricing
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Includes full WinCore Pro specifications (6 Websites, 18 MySQL Databases,
                24 Emails, 10GB SSD) shielded from annual price changes.
              </p>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-mono-num font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {formatPrice(75)}
                </span>
                <span className="text-xs text-slate-400">/One-Off</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectFiveYear}
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-[#0F172A] bg-white hover:bg-[#DFECEB] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
            >
              Select 5-Year Plan
            </button>
          </div>

          {/* Inline Provisioning Bar (Zero Modals) */}
          <div
            id="win-checkout-panel"
            className={`mt-6 rounded-2xl border p-6 sm:p-7 transition-all ${
              selectedPlanName
                ? 'border-[#0E6B63] bg-[#F4FAF9]'
                : 'border-[#E2E8F0] bg-[#F8FAFC]'
            }`}
          >
            {selectedPlanName ? (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold text-[#0E6B63]">
                    Selected Windows IIS Configuration
                  </p>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] mt-0.5">
                    {selectedPlanName} ({selectedPlanSummary})
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Provisioned on Windows Server + IIS 10 with Free Wildcard SSL &amp; 30-day
                    trial protection.
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
                      placeholder="App domain (e.g. app.company.com)"
                      aria-label="Application domain name"
                      className="px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0E6B63] sm:w-56"
                    />
                    <input
                      type="email"
                      value={trialEmail}
                      onChange={(e) => {
                        setTrialEmail(e.target.value);
                        setTrialError('');
                      }}
                      placeholder="Work email address"
                      aria-label="Email for Windows cloud setup"
                      className="px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0E6B63] sm:w-56"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Provision Windows Node
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#10B981]/40 text-sm text-[#0F172A]">
                    <CheckCircle2
                      className="w-5 h-5 text-[#10B981] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Windows IIS provisioning ticket created for{' '}
                      <strong>{trialEmail}</strong>. Message us on WhatsApp or check your
                      inbox for Web Deploy credentials.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-slate-600">
                <span>
                  Choose any Windows IIS plan or the 5-Year value package above to launch your
                  30-day risk-free environment on cpcloudhost.com.
                </span>
                <span className="font-mono-num text-xs font-semibold text-[#0E6B63] whitespace-nowrap">
                  IIS 10 &middot; ASP.NET Core Ready
                </span>
              </div>
            )}

            {trialError && (
              <p className="mt-2.5 text-xs font-medium text-red-600">{trialError}</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Core Windows Cloud Capabilities (Soft Ice-Blue Rounded Panel) */}
      <section id="win-core-features" className="bg-white py-16 lg:py-20">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#EFF5FB] border border-[#DCE7F3] px-6 sm:px-10 lg:px-14 py-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] text-center"
              style={{ textWrap: 'balance' }}
            >
              Core Capabilities of StackCP Windows Cloud
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 text-center">
              {WINDOWS_CORE_FEATURES.map((feat) => (
                <div key={feat.id} className="flex flex-col items-center">
                  <div className="mb-4">
                    <WinCoreArtwork id={feat.id} />
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
                onClick={() => setShowAllWinSpecs((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
              >
                <span>
                  {showAllWinSpecs
                    ? 'Hide Runtime Specifications'
                    : 'View Windows Runtime Specs'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {showAllWinSpecs && (
              <div className="mt-6 pt-6 border-t border-[#D2E0EE] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {[
                  {
                    label: '.NET & IIS Runtime',
                    detail:
                      'Isolated IIS 10 App Pools, Classic ASP, ASP.NET Framework 2.0–4.8 & ASP.NET Core 8.',
                  },
                  {
                    label: 'SQL & Data Engines',
                    detail:
                      `Included MySQL databases plus dedicated MS SQL Server instances from ${formatPrice(15.99)}/mo.`,
                  },
                  {
                    label: 'Deployment Pipelines',
                    detail:
                      'Visual Studio Web Deploy, FTPS/SFTP publishing, scheduled tasks & web.config editing.',
                  },
                  {
                    label: 'Edge & Network Protection',
                    detail:
                      'Anycast global CDN caching, Wildcard SSL certificates & 1 Tbps+ DDoS filtering.',
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

      {/* 4. Precision Runtime Tuning for ASP.NET & MS SQL Apps */}
      <section className="bg-white py-14 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 flex items-center justify-center">
              {!perfImgFailed ? (
                <img
                  src={winPerfImg}
                  alt="Isometric Microsoft IIS and ASP.NET Core cluster connected to MS SQL storage and CDN nodes"
                  referrerPolicy="no-referrer"
                  onError={() => setPerfImgFailed(true)}
                  className="w-full max-w-[520px] h-auto rounded-2xl object-contain mix-blend-multiply"
                />
              ) : (
                <div className="w-full max-w-[500px] aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <Zap className="w-10 h-10 text-[#0284C7]" aria-hidden="true" />
                  <span className="font-display text-sm font-bold text-[#0F172A]">
                    Optimised IIS 10 + MS SQL Architecture
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Precision Runtime Tuning for ASP.NET &amp; MS SQL Apps
              </h2>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed">
                StackCP Windows hosting on cpcloudhost.com runs directly on hardened Microsoft
                IIS 10 pools — engineered for brisk server execution and compatibility across
                classic ASP, MVC, Razor Pages, and ASP.NET Core runtimes.
              </p>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Need heavy transactional storage? Attach dedicated{' '}
                <strong className="font-semibold text-[#0F172A]">
                  MS SQL Database add-ons starting from {formatPrice(15.99)}/month
                </strong>{' '}
                paired with NVMe SSD arrays and automated page caching so APIs and business
                dashboards stay fast under heavy concurrency.
              </p>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => scrollToElement('#win-plans')}
                  className="inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors cursor-pointer"
                >
                  Start Free Trial Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Mint-Teal Risk-Free Evaluation Strip */}
      <section className="bg-[#DFECEB] border-b border-[#CDE0DF] py-9">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              Evaluate StackCP Windows Hosting Free for 30 Days
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Test isolated IIS worker pools, ASP.NET deployment pipelines, and 24/7
              engineering care on cpcloudhost.com with zero long-term lock-in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToElement('#win-plans')}
            className="inline-flex items-center justify-center px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Start Free Trial Now
          </button>
        </div>
      </section>

      {/* 6. Global Edge Network & Data Centre Locations */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Global Edge Network &amp; Data Centre Locations
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Deliver low-latency Windows portal responses worldwide from Tier-III+
              datacentres and Anycast CDN hubs across Europe, North America, Asia Pacific,
              and the Middle East.
            </p>
          </div>

          {/* Crisp Dotted World Map Illustration */}
          <div className="mt-10 max-w-[920px] mx-auto">
            <div className="relative w-full aspect-[2.1/1] bg-[#FAFAFC] rounded-2xl border border-[#E2E8F0]/80 overflow-hidden p-4">
              <svg
                viewBox="0 0 1000 460"
                className="w-full h-full"
                fill="none"
                aria-label="Global Windows datacentre edge map"
              >
                {[
                  [130, 120], [150, 110], [170, 100], [190, 95], [215, 95], [240, 105], [265, 115], [290, 118],
                  [145, 140], [170, 138], [195, 136], [220, 136], [245, 138], [270, 140], [295, 145],
                  [165, 165], [190, 165], [215, 165], [240, 166], [265, 168], [285, 170],
                  [185, 190], [210, 192], [235, 194], [255, 196], [225, 220], [245, 232],
                ].map(([cx, cy], idx) => (
                  <circle key={`na-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {[
                  [295, 275], [315, 270], [335, 282], [355, 295], [372, 315],
                  [310, 300], [330, 305], [350, 322], [322, 330], [342, 342],
                  [325, 360], [332, 385], [324, 408],
                ].map(([cx, cy], idx) => (
                  <circle key={`sa-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {[
                  [462, 115], [482, 108], [505, 105], [528, 108], [548, 114],
                  [472, 136], [492, 134], [514, 134], [534, 136], [552, 138],
                  [480, 158], [502, 158], [525, 158],
                ].map(([cx, cy], idx) => (
                  <circle key={`eu-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {[
                  [478, 196], [502, 194], [526, 196], [548, 205],
                  [482, 222], [506, 222], [532, 224], [554, 234],
                  [505, 252], [528, 255], [546, 268],
                  [520, 286], [538, 296], [528, 324],
                ].map(([cx, cy], idx) => (
                  <circle key={`af-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {[
                  [585, 118], [612, 114], [640, 112], [670, 110], [700, 114], [732, 118], [764, 126], [795, 135],
                  [595, 145], [625, 142], [655, 140], [685, 140], [715, 142], [745, 145], [775, 150], [805, 158],
                  [605, 175], [635, 172], [665, 172], [695, 174], [725, 176], [755, 180], [785, 185], [848, 168],
                  [622, 204], [655, 204], [682, 212], [712, 212], [742, 215], [768, 225],
                  [672, 238], [745, 248], [772, 266],
                ].map(([cx, cy], idx) => (
                  <circle key={`as-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}
                {[
                  [825, 326], [850, 322], [875, 328], [895, 342],
                  [835, 348], [862, 348], [886, 358], [868, 372],
                ].map(([cx, cy], idx) => (
                  <circle key={`au-${idx}`} cx={cx} cy={cy} r="3.4" fill="#CBD5E1" />
                ))}

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

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {WORLDWIDE_HUB_COLUMNS.map((col) => (
              <div key={col.region}>
                <div className="font-display text-xs font-bold text-[#0F172A] mb-2">
                  {col.region}
                </div>
                <ul className="space-y-1 text-[11px] sm:text-xs text-slate-600 leading-snug">
                  {col.cities.slice(0, 6).map((city) => (
                    <li key={city}>{city}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Built Exclusively for Modern Windows Web Workloads (IIS & MS SQL Artwork Grid) */}
      <section className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="text-center mb-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mb-3"
              style={{ textWrap: 'balance' }}
            >
              Built Exclusively for Modern Windows Workloads
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Combines native Microsoft IIS 10 web pools, elastic scaling, and optional SQL
              Server power inside the intuitive StackCP workspace at cpcloudhost.com.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 text-center">
            {WINDOWS_ADVANTAGE_PILLARS.map((item) => (
              <div key={item.id} className="flex flex-col items-center">
                <div className="mb-3.5">
                  <WinAdvantageArtwork id={item.id} />
                </div>
                <h3 className="font-display text-sm sm:text-[15px] font-bold text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-2 max-w-[265px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={() => setShowFullFeatures((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
            >
              <span>
                {showFullFeatures
                  ? 'Collapse Feature List'
                  : 'View All Windows Features'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {showFullFeatures && (
            <div className="mt-6 p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs text-slate-600">
              <div>
                <div className="font-display font-bold text-[#0E6B63] mb-2">
                  IIS &amp; Frameworks
                </div>
                <p className="leading-relaxed">
                  IIS 10 Pipeline, Classic ASP, MVC 5, Razor, .NET 4.8 &amp; ASP.NET Core 8.
                </p>
              </div>
              <div>
                <div className="font-display font-bold text-[#0E6B63] mb-2">
                  Database Engines
                </div>
                <p className="leading-relaxed">
                  Unlimited/multi MySQL databases included; dedicated MS SQL Server from{' '}
                  {formatPrice(15.99)}/mo.
                </p>
              </div>
              <div>
                <div className="font-display font-bold text-[#0E6B63] mb-2">
                  Dev &amp; Security Controls
                </div>
                <p className="leading-relaxed">
                  Visual Studio Web Deploy, FTPS/SSH, Wildcard SSL &amp; 1 Tbps+ DDoS filtering.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. Interactive Windows FAQ's */}
      <section id="win-faq" className="bg-white border-b border-[#E2E8F0] py-16 lg:py-20">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A] text-center mb-10">
            FAQ&apos;s
          </h2>

          <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
            {WINDOWS_FAQS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.question} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-3 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
                  >
                    <span className="shrink-0 text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </span>
                    <span className="font-display text-sm sm:text-[15px] font-semibold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                      {formatPriceString(item.question)}
                    </span>
                  </button>

                  {isOpen && (
                    <p className="mt-2.5 pl-6.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {formatPriceString(item.answer)}
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
