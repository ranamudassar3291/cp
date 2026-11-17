import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  Minus,
  Plus,
  Server,
  ShieldCheck,
  ShoppingBag,
  Users,
  Zap,
} from 'lucide-react';
import wpHeroImg from '../../assets/images/wp_hero_editorial_cluster_1794561316432.jpg';
import perfCacheImg from '../../assets/images/shared_performance_cache_1794560149227.jpg';
import wpTeamImg from '../../assets/images/wp_team_workspace_photo_1794561317633.jpg';
import wpWooImg from '../../assets/images/wp_woocommerce_store_photo_1794561317667.jpg';
import migrationServersImg from '../../assets/images/migration_isometric_servers_1794556019724.jpg';
import { SHARED_DATACENTERS } from '../../data/sharedHostingData';
import {
  WORDPRESS_CORE_FEATURES,
  WORDPRESS_FAQS,
  WORDPRESS_PLANS,
  WordPressPlan,
} from '../../data/wordpressHostingData';
import { FlagBadge } from '../shared/SharedPlanEmblems';
import {
  WordPressFeatureArtwork,
  WpPlanResourceEmblem,
} from './WordPressEmblems';
import { StackCpFeaturesSection } from '../StackCpFeaturesSection';
import { CmsExtraSections } from '../cms/CmsExtraSections';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';

interface WordPressHostingPageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

export const WordPressHostingPage: React.FC<WordPressHostingPageProps> = ({
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPrice } = useCurrency();
  const { cmsPages, lastSearchedDomain, setOrderCheckoutDraft } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'wordpress-hosting');
  const [selectedRegion, setSelectedRegion] = useState<'uk' | 'us' | 'sg'>('uk');
  const [selectedPlan, setSelectedPlan] = useState<WordPressPlan | null>(null);
  const [trialEmail, setTrialEmail] = useState('');
  const [trialDomain, setTrialDomain] = useState('');
  const [trialError, setTrialError] = useState('');
  const [trialSubmitted, setTrialSubmitted] = useState(false);

  const [showAllWpSpecs, setShowAllWpSpecs] = useState(false);
  const [migrationRequested, setMigrationRequested] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [perfImgFailed, setPerfImgFailed] = useState(false);
  const [teamImgFailed, setTeamImgFailed] = useState(false);
  const [wooImgFailed, setWooImgFailed] = useState(false);
  const [migrationImgFailed, setMigrationImgFailed] = useState(false);

  const activeDatacenter =
    SHARED_DATACENTERS.find((dc) => dc.id === selectedRegion) ??
    SHARED_DATACENTERS[0];

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPlan = (plan: WordPressPlan) => {
    setSelectedPlan(plan);
    setTrialSubmitted(false);
    setTrialError('');
    setOrderCheckoutDraft({
      orderCategory: 'wordpress-hosting',
      planId: plan.id,
      planName: plan.name,
      productType: 'Managed WordPress',
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
      onNavigatePath('/order/wordpress-hosting');
      return;
    }
    setTimeout(() => {
      scrollToElement('#wp-checkout-panel');
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
            Managed WordPress Hosting
          </span>
        </div>
      </div>

      {/* 1. Managed WordPress Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() ||
                  'cpcloudhost.com · StackCP Managed WordPress Cloud'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Managed WordPress Cloud Hosting Built for Speed & Growth'}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  'Accelerate your editorial blogs, agency builds, and WooCommerce storefronts on isolated NVMe infrastructure tuned specifically for WordPress and PHP 8.4. Every cpcloudhost.com package ships with Wildcard SSL, Anycast CDN delivery, automated core updates, and 1-click staging sandboxes.'}
              </p>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                With a 99.99% uptime commitment, enterprise malware scanning, and 24/7
                WordPress engineers on standby, your team stays focused on content and sales
                while we handle server maintenance.
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
                      scrollToElement(url || '#wp-plans');
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
                      scrollToElement(url || '#wp-core-features');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6B63] hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Explore WP Architecture'}</span>
                </button>
              </div>
            </div>

            {/* Right High-End Studio Commercial Visual */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgFailed ? (
                  <img
                    src={wpHeroImg}
                    alt="Brushed aluminum WordPress enterprise cloud compute unit with glass WordPress performance dashboard"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <Server className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      Managed WordPress Cloud Architecture
                    </span>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <ShieldCheck className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    <span>1-Click Staging &amp; Wildcard SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <Zap className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    <span>PHP 8.4 + StackCache Edge CDN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Datacenter Selector & 3 New Managed WordPress Tiers */}
      <section
        id="wp-plans"
        className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Select Your Managed WordPress Cluster &amp; Tier
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Position your WordPress databases close to your audience across three global
              hubs. Every cpcloudhost.com package includes 1 Tbps+ DDoS filtering,
              automated SSL, and dedicated staging sandboxes.
            </p>
          </div>

          {/* 3 Datacenter Location Flag Cards (UK, USA, Singapore) */}
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

          {/* 3-Column WordPress Plan Grid */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {WORDPRESS_PLANS.map((plan) => {
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
                        Select {plan.name}
                      </button>
                      <p className="text-[11px] text-center text-slate-500 mt-2">
                        Includes 30-day evaluation &middot; {activeDatacenter.city}
                      </p>
                    </div>

                    <hr className="my-6 border-[#E2E8F0]" />

                    {/* 4 Core WordPress Resource Rows */}
                    <div className="space-y-2.5">
                      {plan.resources.map((res) => (
                        <div
                          key={res.label}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#F4FAF9] border border-[#CDE0DF]/80"
                        >
                          <WpPlanResourceEmblem kind={res.key} />
                          <span className="font-mono-num text-xs sm:text-sm font-semibold text-[#0F172A]">
                            {res.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Feature Checklist */}
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

          {/* Inline 30-Day Managed WordPress Sandbox Bar (Zero Modals) */}
          <div
            id="wp-checkout-panel"
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
                    Selected Managed WordPress Cluster
                  </p>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] mt-0.5">
                    {selectedPlan.name} ({formatPrice(selectedPlan.monthlyPrice)}/mo) &middot;{' '}
                    {activeDatacenter.clusterLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Ready with PHP 8.4, 1-click staging, automated core updates, and Wildcard
                    SSL.
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
                      placeholder="Site domain (e.g. myblog.com)"
                      aria-label="Primary WordPress domain"
                      className="px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0E6B63] sm:w-52"
                    />
                    <input
                      type="email"
                      value={trialEmail}
                      onChange={(e) => {
                        setTrialEmail(e.target.value);
                        setTrialError('');
                      }}
                      placeholder="Your email address"
                      aria-label="Email for Managed WordPress setup"
                      className="px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0E6B63] sm:w-56"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Launch WP Sandbox
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#10B981]/40 text-sm text-[#0F172A]">
                    <CheckCircle2
                      className="w-5 h-5 text-[#10B981] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      WordPress cloud environment queued for <strong>{trialEmail}</strong> on{' '}
                      <strong>{activeDatacenter.city}</strong>. Reach us on WhatsApp or
                      check your inbox for setup details.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
                  <span>
                    Selected Region:{' '}
                    <strong className="text-[#0F172A]">
                      {activeDatacenter.clusterLabel}
                    </strong>{' '}
                    ({activeDatacenter.latencyLabel}) &mdash; Choose any WordPress tier
                    above to start your 30-day risk-free evaluation.
                  </span>
                </div>
                <span className="font-mono-num text-xs font-semibold text-[#0E6B63] whitespace-nowrap">
                  WP-CLI &amp; Staging Ready
                </span>
              </div>
            )}

            {trialError && (
              <p className="mt-2.5 text-xs font-medium text-red-600">{trialError}</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Purpose-Built WordPress Tooling (Soft Surface Container) */}
      <section id="wp-core-features" className="bg-white py-16 lg:py-20">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#EFF5FB] border border-[#DCE7F3] px-6 sm:px-10 lg:px-14 py-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] text-center"
              style={{ textWrap: 'balance' }}
            >
              Purpose-Built WordPress Tooling on StackCP
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 text-center">
              {WORDPRESS_CORE_FEATURES.map((feat) => (
                <div key={feat.id} className="flex flex-col items-center">
                  <div className="mb-4">
                    <WordPressFeatureArtwork id={feat.id} />
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                    {feat.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-[305px]">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllWpSpecs((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
              >
                <span>
                  {showAllWpSpecs
                    ? 'Hide Developer Stack'
                    : 'Explore Full WordPress Stack'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {showAllWpSpecs && (
              <div className="mt-6 pt-6 border-t border-[#D2E0EE] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {[
                  {
                    label: 'WordPress Caching Engine',
                    detail:
                      'StackCache full-page edge caching, Redis/Memcached support & automatic cache purging.',
                  },
                  {
                    label: 'PHP & Database Speed',
                    detail:
                      'Per-site PHP 5.6 to PHP 8.4 selector, OPcache tuned workers, and NVMe MariaDB arrays.',
                  },
                  {
                    label: 'Stage & Deploy Workflow',
                    detail:
                      'Isolated staging URLs, 1-click database push/pull, WP-CLI shell & Git deployments.',
                  },
                  {
                    label: 'Malware & Checksum Shield',
                    detail:
                      'Automated core integrity scans, 2FA, XML-RPC hardening, and 1 Tbps+ network mitigation.',
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

      {/* 4. Accelerated Content & Checkout Delivery Split */}
      <section className="bg-white py-14 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 flex items-center justify-center">
              {!perfImgFailed ? (
                <img
                  src={perfCacheImg}
                  alt="StackCache WordPress edge delivery core and Anycast CDN network nodes"
                  referrerPolicy="no-referrer"
                  onError={() => setPerfImgFailed(true)}
                  className="w-full max-w-[520px] h-auto rounded-2xl object-contain mix-blend-multiply"
                />
              ) : (
                <div className="w-full max-w-[500px] aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <Zap className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                  <span className="font-display text-sm font-bold text-[#0F172A]">
                    StackCache + Anycast WordPress Edge
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Accelerated Delivery for Content &amp; Checkouts
              </h2>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed">
                At cpcloudhost.com, our WordPress stack is engineered around rapid first-byte
                response and fault tolerance. Combining autoscaling cloud nodes, Anycast CDN
                PoPs, and pure NVMe drives eliminates sluggish backend load times across heavy
                themes and large media libraries.
              </p>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Every environment runs under a strict 99.99% uptime SLA and includes access
                to dedicated WordPress systems specialists ready to help optimise plugins,
                database indexes, and core performance.
              </p>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => scrollToElement('#wp-plans')}
                  className="inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors cursor-pointer"
                >
                  Start Free Trial Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How Managed WordPress Differs (Editorial Team Photography Split) */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                How Managed WordPress Differs From Generic Hosting
              </h2>

              <div className="mt-5 space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  Managed WordPress cloud hosting is architected exclusively around
                  WordPress&apos;s PHP and MySQL execution lifecycle rather than sharing static
                  configuration with legacy scripts.
                </p>
                <p>
                  Instead of configuring server caching rules, PHP workers, or firewall
                  signatures yourself, StackCP on cpcloudhost.com handles automatic core
                  updates, sandboxed staging clones, and dynamic edge routing out of the box.
                </p>
                <p>
                  Plus, whenever a plugin conflict or database bottleneck slows down an update,
                  our engineers step in directly so creative teams keep shipping without
                  server firefighting.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              {!teamImgFailed ? (
                <img
                  src={wpTeamImg}
                  alt="Agency engineers reviewing WordPress analytics and performance grids in studio office"
                  referrerPolicy="no-referrer"
                  onError={() => setTeamImgFailed(true)}
                  className="w-full h-auto rounded-2xl object-cover shadow-[0_18px_40px_-16px_rgba(15,23,42,0.16)]"
                />
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center gap-3 text-sm font-semibold text-[#0E6B63]">
                  <Users className="w-6 h-6" aria-hidden="true" />
                  <span>24/7 WordPress Engineering Support</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Mint-Teal Free Trial Banner */}
      <section className="bg-[#DFECEB] border-y border-[#CDE0DF] py-9">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              Try Managed WordPress Cloud Risk-Free
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Test one-click staging, PHP 8.4 acceleration, and Anycast CDN speed on
              cpcloudhost.com with our 30-day free trial guarantee.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToElement('#wp-plans')}
            className="inline-flex items-center justify-center px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Start Free Trial Now
          </button>
        </div>
      </section>

      {/* 7. Storefronts Built to Scale With WooCommerce Showcase */}
      <section className="bg-white py-16 lg:py-22 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Commercial Portrait with Architectural Framing */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-full max-w-[480px]">
                {/* Crisp Architectural Deep-Teal Curve Accent */}
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute -top-4 -left-4 w-36 h-36 rounded-tl-[64px] border-t-[10px] border-l-[10px] border-[#0E6B63] pointer-events-none"
                />
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute -bottom-4 -right-4 w-28 h-28 rounded-br-[48px] bg-[#DFECEB] -z-0 pointer-events-none"
                />

                {!wooImgFailed ? (
                  <img
                    src={wpWooImg}
                    alt="Independent WooCommerce brand founder preparing customer shipments in boutique studio"
                    referrerPolicy="no-referrer"
                    onError={() => setWooImgFailed(true)}
                    className="relative z-10 w-full h-auto rounded-2xl object-cover shadow-[0_20px_48px_-16px_rgba(15,23,42,0.18)]"
                  />
                ) : (
                  <div className="relative z-10 w-full aspect-[4/3] rounded-2xl bg-[#F4FAF9] border border-[#CDE0DF] flex items-center justify-center gap-3 text-sm font-bold text-[#0E6B63]">
                    <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                    <span>High-Conversion WooCommerce Cloud</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Storefront Copy */}
            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Storefronts Built to Scale With WooCommerce
              </h2>
              <p className="mt-2.5 font-display text-sm sm:text-base font-bold text-[#0E6B63]">
                Keep Cart &amp; Checkout Sessions Snappy Under Peak Orders
              </p>

              <div className="mt-4 space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  Online stores fail when static caches break cart sessions or surge traffic
                  bottlenecks SQL queries. Every cpcloudhost.com WordPress tier pairs
                  full-page edge caching on catalog pages with cookie-aware dynamic routing
                  on WooCommerce checkout workflows.
                </p>
                <p>
                  Compatible seamlessly with Gutenberg, Elementor Pro, Divi, and Stripe
                  gateways, and secured with automated Wildcard SSL and malware monitoring.
                </p>
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => scrollToElement('#wp-plans')}
                  className="inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors cursor-pointer"
                >
                  Launch Your Store Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Zero-Downtime WordPress Migrations */}
      <section className="bg-white border-b border-[#E2E8F0] py-16 lg:py-20">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Zero-Downtime WordPress Migrations Included
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Moving to cpcloudhost.com takes minutes, not weekend downtime. Submit any
                number of WordPress installs, media uploads, SQL databases, and email
                boxes to our Migration Hub while your existing site remains online.
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Once our validation pass confirms identical theme layouts, SSL certs, and
                permalinks, we switch DNS cleanly without disturbing search indexing.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMigrationRequested(true)}
                  className="inline-flex items-center justify-center px-7 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors cursor-pointer"
                >
                  Request Site Migration
                </button>
                {migrationRequested && (
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#0E6B63]">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    WordPress migration desk ready via WhatsApp or support@cpcloudhost.com
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[540px] select-none pointer-events-none">
                {!migrationImgFailed ? (
                  <img
                    src={migrationServersImg}
                    alt="Isometric StackCP migration server cluster moving WordPress websites cleanly"
                    referrerPolicy="no-referrer"
                    onError={() => setMigrationImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center gap-2 text-sm font-bold text-[#0E6B63]">
                    <Globe className="w-5 h-5" aria-hidden="true" />
                    Zero-Downtime StackCP WordPress Migration
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
      </section>

      {/* 9. Platform Advantage Grid */}
      <StackCpFeaturesSection
        heading="Why WordPress Teams Choose cpcloudhost.com"
        subheading="Engineered around autoscaling StackCP containers, wildcard SSL protection, edge CDN delivery, and bulk theme management in a clean enterprise workspace."
        onViewFeatures={() => scrollToElement('#wp-core-features')}
      />

      {/* 10. Managed WordPress Interactive FAQ's */}
      <section id="wp-faq" className="bg-white border-b border-[#E2E8F0] py-16 lg:py-20">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A] text-center mb-10">
            FAQ&apos;s
          </h2>

          <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
            {WORDPRESS_FAQS.map((item, idx) => {
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
                      {item.question}
                    </span>
                  </button>

                  {isOpen && (
                    <p className="mt-2.5 pl-6.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
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
