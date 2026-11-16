import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Server,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import resellerHeroImg from '../../assets/images/cpanel_biz_hero_v2_1794568169285.jpg';
import {
  RESELLER_BENEFITS,
  RESELLER_FAQS,
  RESELLER_HOSTING_PLANS,
  RESELLER_WORKFLOW_STEPS,
  ResellerHostingPlan,
} from '../../data/resellerHostingData';
import { CmsExtraSections } from '../cms/CmsExtraSections';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';

interface ResellerHostingPageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

const BENEFIT_ICONS = [Layers, Globe, ShieldCheck, Cpu, HardDrive, TrendingUp];

export const ResellerHostingPage: React.FC<ResellerHostingPageProps> = ({
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPrice } = useCurrency();
  const { cmsPages, hostingPlans, lastSearchedDomain, setOrderCheckoutDraft } =
    usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'reseller-hosting');

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const liveResellerPlans: ResellerHostingPlan[] = useMemo(() => {
    const adminReseller = hostingPlans.filter(
      (p) => p.pageCategory === 'reseller-hosting' && p.enabled
    );
    if (adminReseller.length === 0) return RESELLER_HOSTING_PLANS;
    return adminReseller.map((ap, idx) => {
      const template =
        RESELLER_HOSTING_PLANS.find(
          (rp) =>
            rp.id === ap.id || rp.name.toLowerCase() === ap.name.toLowerCase()
        ) ?? RESELLER_HOSTING_PLANS[idx % RESELLER_HOSTING_PLANS.length];
      return {
        id: ap.id || template.id,
        name: ap.name,
        audience: ap.audience || template.audience,
        tagline: ap.tagline || template.tagline,
        monthlyPrice: ap.monthlyPrice,
        yearlyPrice: ap.yearlyPrice,
        renewalPrice: ap.renewalPrice,
        storage: ap.storage || template.storage,
        bandwidth: ap.bandwidth || template.bandwidth,
        cpanelAccounts: template.cpanelAccounts,
        features: ap.features.length > 0 ? ap.features : template.features,
        popular: ap.popular,
        serverPackageName: ap.serverPackageName || template.serverPackageName,
      };
    });
  }, [hostingPlans]);

  const faqs = useMemo(() => {
    if (pageCms?.faqItems && pageCms.faqItems.length > 0) {
      return pageCms.faqItems;
    }
    return RESELLER_FAQS;
  }, [pageCms]);

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOrderResellerPlan = (plan: ResellerHostingPlan) => {
    setOrderCheckoutDraft({
      orderCategory: 'reseller-hosting',
      planId: plan.id,
      planName: plan.name,
      productType: 'Reseller Hosting',
      billingCycle: billingCycle === 'yearly' ? '1 Year' : '1 Month',
      datacenterId: 'uk',
      datacenterLabel: 'London, United Kingdom (Tier III+)',
      domainOption: lastSearchedDomain ? 'register' : 'existing',
      domainName: lastSearchedDomain?.domain || '',
      domainTld: lastSearchedDomain?.tld,
      domainYears: lastSearchedDomain?.minYears,
      domainPriceUsd: lastSearchedDomain?.priceUsd,
      domainSearchedFromSite: Boolean(lastSearchedDomain),
      preselectedFromSite: true,
      step: 1,
      sourceOrigin: 'public',
      updatedAtUtc: new Date().toISOString(),
    });
    if (onNavigatePath) {
      onNavigatePath('/order/reseller-hosting');
    } else {
      onNavigateHome('/order/reseller-hosting');
    }
  };

  const handleCtaUrl = (rawUrl: string | undefined, fallbackSelector: string) => {
    const clean = (rawUrl || '').trim();
    if (!clean || clean.startsWith('#')) {
      scrollToElement(clean || fallbackSelector);
      return;
    }
    if (onNavigatePath) {
      onNavigatePath(clean);
    } else {
      onNavigateHome(clean);
    }
  };

  return (
    <div id="top" className="bg-white text-[#0F172A]">
      {/* Breadcrumb Bar */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onNavigateHome('#top')}
            className="hover:text-[#0E6B63] font-medium cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-semibold">Reseller Hosting</span>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E6F4F1] border border-[#CDE0DF] text-[11px] font-bold uppercase tracking-wider text-[#0E6B63] mb-4">
                <Server className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {pageCms?.heroBadge ||
                    'cpcloudhost.com · WHM Partner & White-Label Infrastructure'}
                </span>
              </div>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0F172A] tracking-tight leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle ||
                  'Build Your Own Hosting Brand With White-Label Reseller Power'}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle ||
                  'Sell fast NVMe cPanel hosting under your own brand, private nameservers, and custom pricing. Manage 25 to 150+ isolated client accounts inside your WHM Partner console backed by CloudLinux LVE isolation and automated JetBackup snapshots.'}
              </p>

              {(pageCms?.highlights && pageCms.highlights.length > 0) && (
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700">
                  {pageCms.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCtaUrl(pageCms?.primaryCtaUrl, '#reseller-plans')
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0F172A] hover:bg-[#0E6B63] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>{pageCms?.primaryCtaText || 'Compare Reseller Plans'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCtaUrl(pageCms?.secondaryCtaUrl, '#reseller-benefits')
                  }
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText || 'Inspect Partner Benefits'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
                {!heroImgFailed ? (
                  <img
                    src={resellerHeroImg}
                    alt="Enterprise WHM Reseller Hosting Cluster"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-[290px] sm:h-[340px] object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-[320px] rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <div className="text-center px-6">
                      <Server className="w-10 h-10 text-[#14B8A6] mx-auto mb-2" />
                      <p className="font-display font-bold text-lg">
                        White-Label WHM Partner Cloud
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                    <div className="font-mono font-bold text-sm sm:text-base text-[#0F172A] tabular-nums">
                      25–150+
                    </div>
                    <div className="text-[11px] text-slate-500">cPanel Accounts</div>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                    <div className="font-mono font-bold text-sm sm:text-base text-[#0E6B63] tabular-nums">
                      99.99%
                    </div>
                    <div className="text-[11px] text-slate-500">Uptime SLA</div>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                    <div className="font-mono font-bold text-sm sm:text-base text-[#0F172A]">
                      100%
                    </div>
                    <div className="text-[11px] text-slate-500">White-Label DNS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 3 Reseller Hosting Plans Grid */}
      <section id="reseller-plans" className="bg-[#F8FAFC] border-b border-[#E2E8F0] py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0E6B63]">
                Wholesale NVMe Partner Tiers
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">
                Choose Your Reseller Hosting Capacity
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
                Every tier ships with isolated CloudLinux cPanel accounts, WHM reseller root control, private nameservers, Imunify360 defense, and automated daily JetBackup.
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-lg bg-white border border-slate-200 shrink-0 self-start">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-[#0F172A] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-[#0E6B63] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly (Save ~17%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {liveResellerPlans.map((plan) => {
              const displayPrice =
                billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              const perTerm = billingCycle === 'yearly' ? '/yr' : '/mo';
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl bg-white p-6 sm:p-7 flex flex-col justify-between transition-all ${
                    plan.popular
                      ? 'border-2 border-[#0E6B63] shadow-lg'
                      : 'border border-slate-200 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
                          {plan.audience}
                        </p>
                        <h3 className="font-display text-xl font-extrabold text-[#0F172A] mt-0.5">
                          {plan.name}
                        </h3>
                      </div>
                      {plan.popular && (
                        <span className="px-2.5 py-0.5 rounded-md bg-[#E6F4F1] border border-[#B7DFD8] text-[10px] font-bold uppercase tracking-wider text-[#0E6B63]">
                          Most Popular
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {plan.tagline}
                    </p>

                    <div className="mt-5 pb-5 border-b border-slate-200 flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl font-extrabold text-[#0F172A] tabular-nums">
                        {formatPrice(displayPrice)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {perTerm}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Storage
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {plan.storage}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Sub-Accounts
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {plan.cpanelAccounts}
                        </div>
                      </div>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-slate-700">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check
                            className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOrderResellerPlan(plan)}
                    className={`mt-7 w-full py-3 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      plan.popular
                        ? 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
                        : 'bg-[#0F172A] hover:bg-[#0E6B63] text-white'
                    }`}
                  >
                    <span>Order {plan.name}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Benefits of Reseller Hosting */}
      <section id="reseller-benefits" className="bg-white border-b border-[#E2E8F0] py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0E6B63]">
              Partner Infrastructure Benefits
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">
              Why Agencies &amp; Web Hosts Standardise on CPCloudHost Reseller
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Enterprise hardware, zero noisy neighbors, complete brand privacy, and predictable wholesale economics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESELLER_BENEFITS.map((benefit, idx) => {
              const Icon = BENEFIT_ICONS[idx % BENEFIT_ICONS.length];
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0E6B63] mb-4">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. 4-Step Launch Workflow */}
      <section className="bg-[#0B0F17] text-white py-14 border-b border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-9">
            <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">
              Rapid Onboarding
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              From Checkout to Selling Client Hosting in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RESELLER_WORKFLOW_STEPS.map((st) => (
              <div
                key={st.step}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="font-mono text-xs font-bold text-[#14B8A6] mb-2">
                  STEP {st.step}
                </div>
                <h3 className="font-display font-bold text-base text-white">
                  {st.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {st.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CMS Extra Sections */}
      <CmsExtraSections
        sections={pageCms?.sections}
        onNavigateUrl={(url) =>
          url.startsWith('#')
            ? scrollToElement(url)
            : onNavigatePath
              ? onNavigatePath(url)
              : onNavigateHome(url)
        }
      />

      {/* 5. FAQs */}
      <section className="bg-[#F8FAFC] py-16 border-b border-[#E2E8F0]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-9">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              Reseller Hosting Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Everything you need to know about WHM licensing, private DNS, and client scaling.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#0F172A]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-[#CDE0DF] bg-[#DFECEB] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E6B63]">
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ready to Launch Your Hosting Business?</span>
              </div>
              <h3 className="font-display text-xl font-extrabold text-[#0F172A] mt-1">
                Provision Your White-Label WHM Reseller Node Today
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleOrderResellerPlan(liveResellerPlans[1] || liveResellerPlans[0])}
              className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-[#0E6B63] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Start Reseller Order</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
