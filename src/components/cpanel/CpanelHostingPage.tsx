import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Minus,
  Plus,
  Server,
  ShieldCheck,
} from 'lucide-react';
import cpanelHeroImg from '../../assets/images/cpanel_biz_hero_v2_1794568169285.jpg';
import cpanelDatacenterImg from '../../assets/images/cpanel_biz_nvme_datacenter_1794568153168.jpg';
import cpanelEngineerImg from '../../assets/images/cpanel_biz_cloud_engineer_1794568153537.jpg';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import {
  ArchIconCloudScale,
  ArchIconControlPanel,
  ArchIconDdosArmor,
  ArchIconEdgeCdn,
  ArchIconServerMigration,
  ArchIconWildcardSsl,
  CpanelFeatureKey,
  CpanelPlanFeatureIcon,
  IllusAutomatedBackups,
  IllusBandwidthGauge,
  IllusCloudSslShield,
  IllusMultiRuntimeStack,
  IllusNvmeDriveArray,
  IllusOneClickInstaller,
} from './CpanelIcons';
import { CpanelVsStackCpVisual, WpToolkitVisual } from './CpanelVisuals';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

export type CpanelPageTarget =
  | 'home'
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'free-trial'
  | 'migration-free';

interface CpanelHostingPageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onOpenPage: (page: CpanelPageTarget, selector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

interface CpanelPlanFeature {
  iconKey: CpanelFeatureKey;
  label: string;
}

interface CpanelPlan {
  id: 'ignite' | 'velocity' | 'zenith';
  name: string;
  subtitle: string;
  description: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  yearlyTotal: number;
  highlighted?: boolean;
  features: CpanelPlanFeature[];
}

const CPANEL_PLANS: CpanelPlan[] = [
  {
    id: 'ignite',
    name: 'cPanel Ignite',
    subtitle: 'For 3 cPanel Websites',
    description:
      'Reliable NVMe cPanel hosting engineered for growing business websites, startups, and client portfolios.',
    monthlyPrice: 14.99,
    yearlyMonthlyPrice: 11.99,
    yearlyTotal: 143.88,
    features: [
      { iconKey: 'panel', label: 'Powerful Control Panel' },
      { iconKey: 'domain', label: '1 Free .com Domain (With Yearly)' },
      { iconKey: 'ram', label: '1 GB RAM' },
      { iconKey: 'websites', label: 'Host 3 Websites' },
      { iconKey: 'nvme', label: '50 GB NVMe Storage' },
      { iconKey: 'bandwidth', label: 'Unlimited Bandwidth' },
      { iconKey: 'ssl', label: 'Free SSL Certificate' },
      { iconKey: 'migration', label: 'Free Site Migration Tool' },
      { iconKey: 'email', label: '10 Email Accounts' },
      { iconKey: 'mysql', label: '3 MySQL Databases' },
      { iconKey: 'subdomains', label: '3 Subdomains' },
      { iconKey: 'wordpress', label: 'Managed WordPress' },
      { iconKey: 'malware', label: 'Malware Scanner' },
      { iconKey: 'backups', label: 'Weekly Backups' },
      { iconKey: 'ddos', label: 'DDoS Secured' },
      { iconKey: 'runtime', label: 'Node.js & Python' },
    ],
  },
  {
    id: 'velocity',
    name: 'cPanel Velocity',
    subtitle: 'For 10 cPanel Websites',
    description:
      'High-headroom multi-site cPanel hosting with daily backups and doubled NVMe capacity for active brands.',
    monthlyPrice: 24.99,
    yearlyMonthlyPrice: 19.99,
    yearlyTotal: 239.88,
    highlighted: true,
    features: [
      { iconKey: 'panel', label: 'Powerful Control Panel' },
      { iconKey: 'domain', label: '1 Free .com Domain (With Yearly)' },
      { iconKey: 'ram', label: '2 GB RAM' },
      { iconKey: 'websites', label: 'Host 10 Websites' },
      { iconKey: 'nvme', label: '100 GB NVMe Storage' },
      { iconKey: 'bandwidth', label: 'Unlimited Bandwidth' },
      { iconKey: 'ssl', label: 'Free SSL Certificate' },
      { iconKey: 'migration', label: 'Free Site Migration Tool' },
      { iconKey: 'email', label: '20 Email Accounts' },
      { iconKey: 'mysql', label: '10 MySQL Databases' },
      { iconKey: 'subdomains', label: '10 Subdomains' },
      { iconKey: 'wordpress', label: 'Managed WordPress' },
      { iconKey: 'malware', label: 'Malware Scanner' },
      { iconKey: 'backups', label: 'Free Daily Backup' },
      { iconKey: 'ddos', label: 'DDoS Secured' },
      { iconKey: 'runtime', label: 'Node.js & Python' },
    ],
  },
  {
    id: 'zenith',
    name: 'cPanel Zenith',
    subtitle: 'For Unlimited cPanel Websites',
    description:
      'Full-power developer and agency cPanel stack with unmetered websites, daily auto backups, and SSH access.',
    monthlyPrice: 39.99,
    yearlyMonthlyPrice: 34.99,
    yearlyTotal: 419.88,
    features: [
      { iconKey: 'panel', label: 'Powerful Control Panel' },
      { iconKey: 'domain', label: '1 Free .com Domain (With Yearly)' },
      { iconKey: 'ram', label: '4 GB RAM' },
      { iconKey: 'websites', label: 'Host Unlimited Websites' },
      { iconKey: 'nvme', label: 'Unlimited NVMe Storage' },
      { iconKey: 'bandwidth', label: 'Unlimited Bandwidth' },
      { iconKey: 'ssl', label: 'Free SSL Certificates' },
      { iconKey: 'migration', label: 'Free Site Migration Tool' },
      { iconKey: 'email', label: 'Unlimited Email Accounts' },
      { iconKey: 'mysql', label: 'Unlimited MySQL Databases' },
      { iconKey: 'subdomains', label: 'Unlimited Subdomains' },
      { iconKey: 'wordpress', label: 'Managed WordPress' },
      { iconKey: 'malware', label: 'Malware Scanner' },
      { iconKey: 'backups', label: 'Free Daily Auto Backup' },
      { iconKey: 'ddos', label: 'DDoS Secured' },
      { iconKey: 'runtime', label: 'Node.js & Python' },
      { iconKey: 'ssh', label: 'SSH Access' },
    ],
  },
];

const CORE_CAPABILITIES = [
  {
    Illus: IllusOneClickInstaller,
    title: 'Instant WordPress & 300+ Apps',
    desc: 'Deploy WordPress, WooCommerce, Laravel, or Node.js frameworks in one click straight from the built-in installer.',
  },
  {
    Illus: IllusCloudSslShield,
    title: 'Free Automated SSL Certificates',
    desc: 'Every domain, add-on site, and subdomain receives instant AutoSSL / Wildcard encryption without manual configuration.',
  },
  {
    Illus: IllusAutomatedBackups,
    title: 'Automated Offsite Backups',
    desc: 'Automated weekly or daily snapshots let you restore databases and web files with a single click whenever needed.',
  },
  {
    Illus: IllusBandwidthGauge,
    title: 'Unlimited High-Throughput Traffic',
    desc: 'Every node operates over redundant multi-gigabit uplinks with unlimited bandwidth so growing traffic never stalls.',
  },
  {
    Illus: IllusNvmeDriveArray,
    title: 'Enterprise PCIe NVMe Arrays',
    desc: 'All websites run cleanly on pure NVMe solid-state disks engineered for fast MySQL queries and snappy TTFB.',
  },
  {
    Illus: IllusMultiRuntimeStack,
    title: 'Node.js, Python & PHP Control',
    desc: 'Switch PHP runtimes seamlessly or deploy Node.js and Python apps cleanly right alongside Managed WordPress.',
  },
];

const PLATFORM_PILLARS = [
  {
    Illus: ArchIconCloudScale,
    title: 'Isolated Cloud Resources',
    desc: 'Dedicated memory allocations protect every cPanel account from noisy neighbors during traffic surges.',
  },
  {
    Illus: ArchIconControlPanel,
    title: 'cPanel® Control Panel',
    desc: 'Industry-standard management for domains, mailboxes, cron jobs, databases, and runtime selectors.',
  },
  {
    Illus: ArchIconWildcardSsl,
    title: 'Free Wildcard SSL Security',
    desc: 'Continuous encrypted TLS coverage automatically renews across primary domains and subdomains.',
  },
  {
    Illus: ArchIconServerMigration,
    title: 'Free Engineering Migrations',
    desc: 'Move files, MySQL databases, and mailboxes cleanly from your previous host with zero website downtime.',
  },
  {
    Illus: ArchIconEdgeCdn,
    title: 'Global Edge Caching Ready',
    desc: 'Activate edge CDN acceleration to cache assets near visitors worldwide for crisp page load speeds.',
  },
  {
    Illus: ArchIconDdosArmor,
    title: 'Malware & DDoS Shield',
    desc: 'Automated daily malware scanning paired with perimeter L3/L4 DDoS mitigation keeps workloads online.',
  },
];

const CPANEL_FAQS = [
  {
    q: 'How do I claim my 1 Free .com domain with cPanel hosting?',
    a: 'Select Yearly billing on cPanel Ignite, cPanel Velocity, or cPanel Zenith and register your included 1 Free .com Domain during checkout for your first year at $0.',
  },
  {
    q: 'Can I host Node.js and Python applications alongside WordPress?',
    a: 'Yes. All three cPanel tiers include built-in Node.js and Python support directly inside cPanel alongside Managed WordPress tools and MySQL databases.',
  },
  {
    q: 'Which plans include Automated Daily Backups and SSH Access?',
    a: 'cPanel Ignite includes weekly backups, cPanel Velocity upgrades to Free Daily Backup snapshots, and cPanel Zenith adds both Free Daily Auto Backup and full SSH Access.',
  },
  {
    q: 'Can cpcloudhost.com engineers migrate my existing cPanel sites without downtime?',
    a: 'Yes. Every cPanel plan includes our Free Site Migration Tool plus full engineering assistance so your files, MySQL databases, and mailboxes transfer seamlessly.',
  },
  {
    q: 'How many email accounts and MySQL databases are included?',
    a: 'cPanel Ignite includes 10 Email Accounts & 3 MySQL Databases, cPanel Velocity includes 20 Email Accounts & 10 MySQL Databases, and cPanel Zenith includes Unlimited Email Accounts & Unlimited MySQL Databases.',
  },
  {
    q: 'Can I upgrade from cPanel Ignite to Velocity or Zenith later?',
    a: 'You can scale upward anytime inside your cpcloudhost.com billing portal with zero file loss or nameserver downtime.',
  },
];

export const CpanelHostingPage: React.FC<CpanelHostingPageProps> = ({
  onNavigateHome,
  onOpenPage,
  onNavigatePath,
}) => {
  const { currency, convertUsd, formatPrice, formatPriceString, countryName } =
    useCurrency();
  const { addOrder, cmsPages, setOrderCheckoutDraft } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'cpanel-hosting');
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<CpanelPlan | null>(null);
  const [domainChoice, setDomainChoice] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderConfirmedRef, setOrderConfirmedRef] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  const handleSelectCpanelPlan = (plan: CpanelPlan) => {
    setSelectedPlan(plan);
    setOrderConfirmedRef(null);
    setOrderError('');
    setOrderCheckoutDraft({
      orderCategory: 'cpanel-hosting',
      planId: `plan-cpanel-${plan.id}`,
      planName: plan.name,
      productType: 'cPanel Hosting',
      billingCycle: billingCycle === 'yearly' ? '1 Year' : '1 Month',
      datacenterId: 'us',
      datacenterLabel: 'Dallas, USA',
      domainOption: 'register',
      domainName: '',
      step: 1,
      sourceOrigin: 'public',
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    if (onNavigatePath) {
      onNavigatePath('/order/cpanel-hosting');
      return;
    }
  };

  useEffect(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://cpcloudhost.com';
    applyPageSeoMetadata({
      title:
        pageCms?.seoTitle?.trim() ||
        'cPanel Web Hosting — NVMe Storage, Free .com Domain & Node.js | cpcloudhost.com',
      description:
        pageCms?.seoDescription?.trim() ||
        `Deploy cPanel Ignite, Velocity, or Zenith NVMe web hosting starting at ${formatPrice(11.99)}/mo yearly with 1 Free .com Domain, Free SSL, DDoS defense, Node.js, and Python.`,
      keywords: [
        'cPanel web hosting',
        'NVMe cPanel hosting free .com domain',
        'Node.js Python cPanel hosting',
        'cpcloudhost cPanel plans',
      ],
      ogType: 'website',
      canonicalPath: '/cpanel-hosting',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'cpcloudhost.com cPanel Web Hosting',
        description:
          'Enterprise NVMe cPanel hosting plans with Free SSL, Malware Scanner, Node.js & Python, and 1 Free .com Domain on annual plans.',
        brand: {
          '@type': 'Brand',
          name: 'cpcloudhost.com',
        },
        url: `${origin}/cpanel-hosting`,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: currency.code,
          lowPrice: convertUsd(11.99).toFixed(currency.decimals),
          highPrice: convertUsd(39.99).toFixed(currency.decimals),
          offerCount: '3',
        },
      },
    });
  }, [currency.code, currency.decimals, convertUsd, formatPrice]);

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!domainChoice.trim() || !domainChoice.includes('.')) {
      setOrderError('Enter a valid domain name (e.g., yourbrand.com) for provisioning.');
      return;
    }
    if (
      !orderEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderEmail.trim())
    ) {
      setOrderError('Enter a valid account email address for cPanel login delivery.');
      return;
    }
    setOrderError('');
    const ref = `CP-${Math.floor(100000 + Math.random() * 899999)}`;
    addOrder({
      customRef: ref,
      clientEmail: orderEmail.trim(),
      country: countryName || 'International',
      productType: 'cPanel Hosting',
      planName: selectedPlan.name,
      domainOrHost: domainChoice.trim(),
      billingCycle: billingCycle === 'yearly' ? 'Yearly' : 'Monthly',
      amountUsd:
        billingCycle === 'yearly'
          ? selectedPlan.yearlyTotal
          : selectedPlan.monthlyPrice,
      datacenter: 'Dallas, USA (Tier-4 NVMe)',
      paymentMethod: 'Storefront Checkout',
      status: 'pending',
    });
    setOrderConfirmedRef(ref);
  };

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Section 1: Executive Split Hero + Editorial Orbital Composition */}
      <section className="bg-white border-b border-[#E2E8F0] pt-8 pb-12 lg:pt-12 lg:pb-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-6"
          >
            <button
              type="button"
              onClick={() => onNavigateHome('#top')}
              className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <button
              type="button"
              onClick={() => onOpenPage('shared-hosting', '#top')}
              className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
            >
              Web Hosting
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="text-[#0F172A] font-semibold">cPanel Web Hosting</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Copy & Pricing Lead */}
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                {pageCms?.heroBadge?.trim() ||
                  'cPanel® Cloud Infrastructure · 1 Free .com Domain With Yearly'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Enterprise cPanel Web Hosting Engineered for Total Control'}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
                {pageCms?.heroSubtitle?.trim() ||
                  'Take full ownership of your business websites with high-speed PCIe NVMe storage, automated offsite backups, malware defense, and integrated DDoS protection. Manage domains, MySQL databases, WordPress, and Node.js or Python workloads seamlessly from the familiar cPanel workspace.'}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-xs font-semibold text-slate-500">From</span>
                <span className="font-display text-4xl font-bold text-[#0F172A] tabular-nums">
                  {billingCycle === 'yearly'
                    ? formatPrice(11.99)
                    : formatPrice(14.99)}
                </span>
                <span className="text-sm text-slate-500">/mo</span>
                {billingCycle === 'yearly' && (
                  <span className="text-xs font-semibold text-[#0E6B63] ml-1.5">
                    · Includes 1 Free .com Domain
                  </span>
                )}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      document
                        .querySelector(url || '#cpanel-pricing')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{pageCms?.primaryCtaText?.trim() || 'View Hosting Plans'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.secondaryCtaUrl?.trim();
                    if (url && url !== '/migration-free' && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      onOpenPage('migration-free', '#top');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Free Migration Available'}</span>
                </button>
              </div>
            </div>

            {/* Right Studio Hosting Specialist Portrait Framed in Clean Orbital Composition */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-full max-w-[520px] py-2">
                {/* Soft Circular Orbital Backdrop Rings */}
                <div
                  className="absolute -inset-2 rounded-full border border-dashed border-slate-200 pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute -top-3 right-6 w-20 h-20 rounded-full bg-[#FF6C2C] flex items-center justify-center shadow-lg z-20 pointer-events-none"
                  aria-hidden="true"
                >
                  <span className="font-display text-2xl font-extrabold tracking-tight text-white">
                    cP
                  </span>
                </div>
                <div
                  className="absolute bottom-6 -left-3 w-12 h-12 rounded-full bg-[#DCEFED] z-0 pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative z-10 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] aspect-[4/3] shadow-[0_20px_50px_-24px_rgba(15,23,42,0.22)]">
                  {!imgFailed['hero'] ? (
                    <img
                      src={cpanelHeroImg}
                      alt="Web hosting specialist holding a laptop inside clean minimalist hosting operations studio"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgFailed((prev) => ({ ...prev, hero: true }))
                      }
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#F2FAF8] to-[#E2ECE9]">
                      <Server className="w-12 h-12 text-[#0E6B63] mb-3" />
                      <p className="font-display font-bold text-[#0F172A]">
                        cpcloudhost.com cPanel Cloud Platform
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Infrastructure Proof Strip */}
          <div className="mt-10 pt-6 border-t border-[#E2E8F0] grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600">
            <div>
              <p className="font-display text-sm font-bold text-[#0F172A]">
                99.99% Uptime SLA
              </p>
              <p className="mt-0.5 text-slate-500">Dual-redundant power &amp; uplinks</p>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#0F172A]">
                PCIe NVMe Storage
              </p>
              <p className="mt-0.5 text-slate-500">50 GB to Unlimited enterprise NVMe</p>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#0F172A]">
                1 Free .com Domain
              </p>
              <p className="mt-0.5 text-slate-500">Included on every annual plan</p>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#0F172A]">
                Node.js &amp; Python
              </p>
              <p className="mt-0.5 text-slate-500">Alongside Managed WordPress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 3-Card Pricing Section With Dedicated Technical Feature Icons (Zero Generic Ticks) */}
      <section
        id="cpanel-pricing"
        className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Choose Your cPanel Web Hosting Plan
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Every plan includes Powerful Control Panel, Unlimited Bandwidth, Free SSL
              Certificate, Malware Scanner, DDoS security, and Node.js &amp; Python.
              Select Yearly billing to claim <strong>1 Free .com Domain</strong>.
            </p>

            {/* Clean Segmented Monthly vs Yearly Switch */}
            <div className="mt-6 inline-flex items-center p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-[#0E6B63] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Yearly Billing (1 Free .com Domain)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Monthly Billing
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {CPANEL_PLANS.map((plan) => {
              const isHighlighted = !!plan.highlighted;
              const displayedPrice = formatPrice(
                billingCycle === 'yearly'
                  ? plan.yearlyMonthlyPrice
                  : plan.monthlyPrice
              );
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                    isHighlighted
                      ? 'bg-[#0F172A] text-white border-2 border-[#0E6B63] shadow-[0_24px_50px_-22px_rgba(14,107,99,0.42)]'
                      : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#0E6B63]/60 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.14)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <span
                        className={`font-semibold ${
                          isHighlighted ? 'text-[#34D399]' : 'text-[#0E6B63]'
                        }`}
                      >
                        cPanel Web Hosting
                      </span>
                      <span
                        className={
                          isHighlighted ? 'text-slate-300 font-semibold' : 'text-slate-500'
                        }
                      >
                        {isHighlighted ? 'Most Popular' : 'Instant Provisioning'}
                      </span>
                    </div>

                    <h3
                      className={`font-display text-2xl sm:text-[1.7rem] font-bold ${
                        isHighlighted ? 'text-white' : 'text-[#0F172A]'
                      }`}
                    >
                      {plan.name}
                    </h3>

                    <div
                      className={`mt-2 px-3 py-1.5 rounded-md text-xs font-semibold ${
                        isHighlighted
                          ? 'bg-white/10 text-[#34D399]'
                          : 'bg-[#F2FAF8] text-[#0E6B63]'
                      }`}
                    >
                      {plan.subtitle}
                    </div>

                    <p
                      className={`text-xs mt-3 leading-relaxed ${
                        isHighlighted ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {plan.description}
                    </p>

                    <div className="mt-4 inline-block px-3 py-1.5 rounded-md bg-[#0E6B63] text-white text-xs font-semibold">
                      1 Free .com Domain (With Yearly)
                    </div>

                    <div
                      className={`mt-5 pb-6 border-b ${
                        isHighlighted ? 'border-slate-700' : 'border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`font-display text-4xl font-bold tabular-nums ${
                            isHighlighted ? 'text-white' : 'text-[#0F172A]'
                          }`}
                        >
                          {displayedPrice}
                        </span>
                        <span
                          className={`text-xs ${
                            isHighlighted ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          /mo
                        </span>
                      </div>

                      <p
                        className={`text-xs mt-1.5 ${
                          isHighlighted ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {billingCycle === 'yearly'
                          ? `${formatPrice(plan.yearlyTotal)} billed annually · Free .com domain included`
                          : 'Billed monthly · Switch to Yearly for 1 Free .com Domain'}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleSelectCpanelPlan(plan)}
                        className={`mt-5 w-full py-3 px-4 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                          isHighlighted
                            ? 'bg-[#0E6B63] hover:bg-[#34D399] hover:text-[#0F172A] text-white'
                            : 'bg-[#0F172A] hover:bg-[#0E6B63] text-white'
                        }`}
                      >
                        Select {plan.name}
                      </button>
                    </div>

                    {/* Feature List With Specific Domain-Matched Icons Instead of Generic Ticks */}
                    <div className="mt-6">
                      <p
                        className={`text-xs font-bold mb-3.5 ${
                          isHighlighted ? 'text-white' : 'text-[#0F172A]'
                        }`}
                      >
                        Plan Specifications &amp; Included Tools
                      </p>
                      <ul className="space-y-3">
                        {plan.features.map((feat) => {
                          const isDomainLine = feat.iconKey === 'domain';
                          return (
                            <li
                              key={feat.label}
                              className={`flex items-center gap-3 text-xs sm:text-sm ${
                                isHighlighted ? 'text-slate-200' : 'text-slate-700'
                              }`}
                            >
                              <CpanelPlanFeatureIcon
                                featureKey={feat.iconKey}
                                highlighted={isHighlighted}
                              />
                              <span
                                className={
                                  isDomainLine && billingCycle === 'yearly'
                                    ? 'font-semibold'
                                    : undefined
                                }
                              >
                                {feat.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inline Order Provisioning Drawer (Zero Pop-up Modals) */}
          {selectedPlan && (
            <div className="mt-8 border border-[#0E6B63]/30 bg-[#F2FAF8] rounded-2xl p-6 sm:p-8">
              {orderConfirmedRef ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-10 h-10 text-[#0E6B63] mx-auto mb-3" />
                  <h3 className="font-display text-xl font-bold text-[#0F172A]">
                    cPanel Order Queued — Reference {orderConfirmedRef}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 max-w-lg mx-auto">
                    Your <strong>{selectedPlan.name}</strong> ({billingCycle}{' '}
                    billing) setup for <strong>{domainChoice}</strong>{' '}
                    {billingCycle === 'yearly'
                      ? '(with 1 Free .com Domain registration included)'
                      : ''}{' '}
                    has been dispatched to <strong>{orderEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="mt-5 px-5 py-2 text-xs font-semibold bg-[#0E6B63] text-white rounded-lg hover:bg-[#0A534D] cursor-pointer"
                  >
                    Close Checkout Summary
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleConfirmOrder}
                  noValidate
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end"
                >
                  <div className="lg:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#0E6B63]/15">
                    <div>
                      <p className="text-xs font-bold text-[#0E6B63]">
                        Selected Package: {selectedPlan.name} (
                        {billingCycle === 'yearly'
                          ? `${formatPrice(selectedPlan.yearlyMonthlyPrice)}/mo · 1 Free .com Domain Included`
                          : `${formatPrice(selectedPlan.monthlyPrice)}/mo Monthly`}
                        )
                      </p>
                      <h3 className="font-display text-lg font-bold text-[#0F172A] mt-0.5">
                        Configure Your Domain &amp; Account Email
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer self-start sm:self-center"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="lg:col-span-5">
                    <label
                      htmlFor="cpanel-order-domain"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      {billingCycle === 'yearly'
                        ? 'Claim Free .com Domain or Use Existing Domain'
                        : 'Domain Name for Hosting'}
                    </label>
                    <input
                      id="cpanel-order-domain"
                      type="text"
                      value={domainChoice}
                      onChange={(e) => setDomainChoice(e.target.value)}
                      placeholder="yourcompany.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <label
                      htmlFor="cpanel-order-email"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Account Email for cPanel Access
                    </label>
                    <input
                      id="cpanel-order-email"
                      type="email"
                      value={orderEmail}
                      onChange={(e) => setOrderEmail(e.target.value)}
                      placeholder="you@yourdomain.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer"
                    >
                      Provision cPanel Plan
                    </button>
                  </div>

                  {orderError && (
                    <p
                      role="alert"
                      className="lg:col-span-12 text-xs font-medium text-red-600"
                    >
                      {orderError}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Framed Soft-Mint Core Features Panel With 64px Custom Vector Illustrations */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Core Features of cPanel Web Hosting
            </h2>
          </div>

          <div className="rounded-3xl bg-[#EBF5F3] border border-[#0E6B63]/10 px-6 py-12 sm:px-12 sm:py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 text-center">
              {CORE_CAPABILITIES.map((cap) => {
                const Illustration = cap.Illus;
                return (
                  <div key={cap.title} className="flex flex-col items-center">
                    <div className="mb-4">
                      <Illustration />
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#0F172A]">
                      {cap.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-xs">
                      {cap.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector('#cpanel-pricing')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
              >
                <span>View All Features</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Enterprise NVMe Data Center Performance Split */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] aspect-[4/3] shadow-[0_18px_40px_-22px_rgba(15,23,42,0.18)]">
              {!imgFailed['datacenter'] ? (
                <img
                  src={cpanelDatacenterImg}
                  alt="Modern Tier-4 cloud hosting data center aisle with enterprise NVMe racks and teal fiber optic cabling"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgFailed((prev) => ({ ...prev, datacenter: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-[#0E6B63]">
                  <Cpu className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Enterprise Hardware &amp; Network Integrity
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Unbeatable NVMe Speed, Isolation &amp; Network Defense
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
              Every cPanel Ignite, Velocity, and Zenith account provisions onto clean
              Tier-4 data center racks backed by enterprise PCIe NVMe solid-state pools,
              redundant 10Gbps networking, and always-on DDoS mitigation. Your PHP,
              WordPress, MySQL, Node.js, and Python workloads maintain responsive low-latency
              delivery even under concurrent campaign traffic.
            </p>
            <div className="mt-7">
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector('#cpanel-pricing')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors cursor-pointer"
              >
                <span>Compare NVMe Packages</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Verified Platform Operations Proof Strip */}
      <section className="py-12 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              Trusted by Over 2,000 Businesses Worldwide
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Engineered for digital agencies, eCommerce stores, and high-availability
              web applications on cpcloudhost.com.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            <div>
              <p className="font-display text-2xl font-bold text-[#0E6B63] tabular-nums">
                99.99%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Uptime Guarantee</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[#0F172A] tabular-nums">
                24/7
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Operations Desk</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[#0F172A] tabular-nums">
                Free
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Zero-Downtime Migrations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Soft-Mint Free Trial Callout Strip */}
      <section className="py-10 bg-[#DCEFED] border-b border-[#0E6B63]/15">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              Try Our Autoscaling StackCP Cloud Alternative
            </h2>
            <p className="text-sm text-slate-700 mt-1">
              Test Cloud Ignite, WP Core, or WinCore Pro risk-free for 30 days using
              promo code <strong>STARTFREE</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenPage('free-trial', '#top')}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-center"
          >
            <span>Start 30-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Section 7: StackCP vs cPanel Interactive Visual Comparison Split */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Control Panel Architecture
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Choosing the Right Control Panel: StackCP vs cPanel
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
              StackCP offers a streamlined dashboard with automatic horizontal cloud
              scaling, making it ideal for agencies and business owners focused on zero
              maintenance overhead.
            </p>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              cPanel, by contrast, remains the industry benchmark for developers needing
              direct access to Apache/Nginx toggles, custom cron scheduling, SSH keys,
              MySQL tooling, and native Node.js &amp; Python runners.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector('#cpanel-pricing')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors cursor-pointer"
              >
                Order cPanel Now
              </button>
              <button
                type="button"
                onClick={() => onOpenPage('shared-hosting', '#top')}
                className="px-5 py-3 text-sm font-semibold text-[#0F172A] border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg transition-colors cursor-pointer"
              >
                Explore StackCP Shared
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <CpanelVsStackCpVisual />
          </div>
        </div>
      </section>

      {/* Section 8: Managed WordPress vs cPanel WordPress Split */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <WpToolkitVisual />
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Managed WordPress &amp; Multi-App Hosting
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Managed WordPress Alongside Custom Node.js &amp; Python Services
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
              Every cPanel Ignite, Velocity, and Zenith plan pairs one-click Managed
              WordPress workflows with granular PHP version selection, MySQL databases,
              subdomains, and isolated RAM—letting your marketing site and backend APIs
              coexist inside one dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector('#cpanel-pricing')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors cursor-pointer"
              >
                Order Now
              </button>
              <button
                type="button"
                onClick={() => onOpenPage('wordpress-hosting', '#top')}
                className="px-5 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg transition-colors cursor-pointer"
              >
                View Managed WordPress Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Cloud Operations Engineer & Zero-Downtime Migration Split */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Dedicated Cloud Support &amp; Switch Credits
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Move Your Existing cPanel Workloads With Zero Downtime
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
              Our systems engineering team handles full cPanel-to-cPanel archives,
              MySQL database sync, email inbox transfers, and DNS cutovers safely. You
              keep every email folder and URL intact while stepping onto faster NVMe
              infrastructure.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                <ShieldCheck className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                Verified Backup Pre-Check
              </span>
              <span aria-hidden="true">·</span>
              <span>Zero DNS Propagation Gaps</span>
            </div>
            <div className="mt-7">
              <button
                type="button"
                onClick={() => onOpenPage('migration-free', '#top')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer"
              >
                <span>Request Free Engineering Migration</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] aspect-[4/3] shadow-[0_18px_40px_-22px_rgba(15,23,42,0.18)]">
              {!imgFailed['engineer'] ? (
                <img
                  src={cpanelEngineerImg}
                  alt="Cloud infrastructure systems engineer inspecting enterprise NVMe server blades in bright data facility"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgFailed((prev) => ({ ...prev, engineer: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-[#0E6B63]">
                  <Server className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Dark Switch Credits Conversion Strip */}
      <section className="py-12 bg-[#0F172A] text-white border-b border-slate-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Switch to cpcloudhost.com With Switch Credits
            </h2>
            <p className="text-sm text-slate-300 mt-1.5">
              Already paying another provider? Transfer your cPanel account free and
              claim up to 12 months of credited time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenPage('migration-free', '#top')}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-center"
          >
            <span>Switch Now</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Section 11: Web Hosting Platform Architecture Grid With Custom Vector Emblems */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              A Web Hosting Platform Built Without Compromise
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Combines cPanel control, enterprise NVMe storage, Cloudflare-ready edge
              caching, and cloud isolation in one dependable platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 text-center">
            {PLATFORM_PILLARS.map((item) => {
              const Emblem = item.Illus;
              return (
                <div key={item.title} className="px-2">
                  <div className="mb-4">
                    <Emblem />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 12: Clean Minimalist FAQ List */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              FAQs
            </h2>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
            {CPANEL_FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="p-5 sm:p-6">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                      {formatPriceString(item.q)}
                    </span>
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[#0E6B63] shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      {formatPriceString(item.a)}
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
