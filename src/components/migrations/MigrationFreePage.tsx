import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Globe,
  HardDrive,
  Lock,
  Mail,
  Minus,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import migrationHeroImg from '../../assets/images/migration_hero_cloud_1794566989040.jpg';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

export type MigrationPlanTarget =
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'vps-hosting'
  | 'n8n-hosting'
  | 'free-trial';

interface MigrationFreePageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onOpenPage: (page: MigrationPlanTarget, selector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

interface MigrationHostingCard {
  id: string;
  pageTarget: MigrationPlanTarget;
  pageLabel: string;
  planName: string;
  usdPrice: number;
  cycle: string;
  bestFor: string;
  highlights: string[];
  recommended?: boolean;
}

const MIGRATION_HOSTING_CARDS: MigrationHostingCard[] = [
  {
    id: 'shared',
    pageTarget: 'shared-hosting',
    pageLabel: 'Shared Hosting Page',
    planName: 'Shared Web Hosting',
    usdPrice: 2.5,
    cycle: '/mo',
    bestFor: 'Business sites, agencies, multi-site portfolios & PHP apps',
    highlights: [
      'StackCP Autoscaling Cloud & NVMe',
      'Free Unlimited Zero-Downtime Migrations',
      'Free Wildcard SSL & Daily Backups',
    ],
    recommended: true,
  },
  {
    id: 'wordpress',
    pageTarget: 'wordpress-hosting',
    pageLabel: 'WordPress Hosting Page',
    planName: 'Managed WordPress',
    usdPrice: 2.5,
    cycle: '/mo',
    bestFor: 'High-traffic WordPress blogs, Elementor builds & WooCommerce stores',
    highlights: [
      'LiteSpeed + StackCache & Redis Ready',
      '1-Click Staging & Automated Core Updates',
      'Free WooCommerce Order-Safe Cutover',
    ],
  },
  {
    id: 'windows',
    pageTarget: 'windows-hosting',
    pageLabel: 'Windows Hosting Page',
    planName: 'Windows Web Hosting',
    usdPrice: 2.5,
    cycle: '/mo',
    bestFor: 'ASP.NET Core 8 apps, MSSQL databases, .NET APIs & IIS 10 sites',
    highlights: [
      'Dedicated Windows Server & IIS 10 Stack',
      'MSSQL + Web.config Transfer Handled Free',
      'Free SSL & Scheduled Database Snapshots',
    ],
  },
  {
    id: 'vps',
    pageTarget: 'vps-hosting',
    pageLabel: 'Unmanaged VPS Page',
    planName: 'Unmanaged KVM VPS',
    usdPrice: 12.99,
    cycle: '/mo',
    bestFor: 'Full root SSH servers, Laravel SaaS & high-concurrency workloads',
    highlights: [
      '4 to 12 Dedicated vCPU & 8–48 GB RAM',
      'Up to 400GB SSD / 200GB NVMe Storage',
      'Full Rsync, Docker & KVM Image Transfer',
    ],
  },
  {
    id: 'n8n',
    pageTarget: 'n8n-hosting',
    pageLabel: 'n8n Hosting Page',
    planName: 'n8n Automation Nodes',
    usdPrice: 12.99,
    cycle: '/mo',
    bestFor: 'Self-hosted workflow engines, PostgreSQL & production webhooks',
    highlights: [
      'Pre-Tuned HTTPS Webhook Reverse Proxy',
      'PostgreSQL, Credentials & Volume Sync',
      'Unlimited Traffic & Automated Snapshots',
    ],
  },
  {
    id: 'trial',
    pageTarget: 'free-trial',
    pageLabel: '30-Day Free Trial Page',
    planName: '30-Day Free Trial',
    usdPrice: 0,
    cycle: '/ 30 days',
    bestFor: 'Test Cloud Ignite, WP Core or WinCore Pro risk-free before switching',
    highlights: [
      'Promo Code STARTFREE Pre-Applied',
      'Clone Staging Copy to Verify Speed First',
      'Upgrade Seamlessly With Switch Credits',
    ],
  },
];

const MIGRATION_PROCESS_STEPS = [
  {
    num: '01.',
    title: 'Pick Your Plan & Submit Credentials',
    desc: 'Choose Shared Hosting, Managed WordPress, Windows IIS, or VPS—then drop in your current host URL securely or open a request below.',
  },
  {
    num: '02.',
    title: 'Private Cloned Sync Without Touching Live Traffic',
    desc: 'Our engineers replicate all website files, MySQL/MSSQL databases, cron jobs, and IMAP mailboxes directly to your new cpcloudhost.com container.',
  },
  {
    num: '03.',
    title: 'Hosts-File QA & Pre-Provisioned SSL',
    desc: 'We install Free Wildcard SSL and send you a private hosts preview link so your team can verify pages, cart checkout, and logins beforehand.',
  },
  {
    num: '04.',
    title: 'Coordinated Anycast DNS Cutover',
    desc: 'Once approved, DNS switches cleanly within minutes—preserving historical email and running a final delta database sync with zero downtime.',
  },
];

const TRANSFER_CAPABILITIES = [
  {
    icon: Server,
    title: 'cPanel, Plesk & DirectAdmin',
    desc: 'Full account transfers including add-on domains, subdomains, cron tasks, and PHP version matching.',
  },
  {
    icon: Globe,
    title: 'WordPress & WooCommerce',
    desc: 'Search-replace path updates, serialized Elementor data preservation, and active cart/order delta syncs.',
  },
  {
    icon: Mail,
    title: 'Mailboxes & IMAP Folders',
    desc: 'Zero-loss inbox history migration over TLS IMAP sync along with aligned SPF, DKIM, and DMARC records.',
  },
  {
    icon: Database,
    title: 'MySQL, MariaDB & MSSQL',
    desc: 'Full transactional SQL dump and UTF-8 charset preservation without truncating large ecommerce tables.',
  },
  {
    icon: HardDrive,
    title: 'VPS, Docker & n8n Workflows',
    desc: 'Container volumes, Nginx/Caddy configs, SSL certificates, and PostgreSQL databases moved cleanly.',
  },
  {
    icon: ShieldCheck,
    title: 'Switch Credits Included',
    desc: 'Moving mid-contract from another host? Submit your current renewal receipt for up to 12 months in Switch Credits.',
  },
];

const MIGRATION_FAQS = [
  {
    q: 'Will my live website or emails go offline during migration?',
    a: 'No. We clone your complete website, database, and email accounts onto cpcloudhost.com while your existing host continues serving visitors. DNS is only updated once the new environment passes private QA.',
  },
  {
    q: 'How many websites can I migrate for free?',
    a: 'All cpcloudhost.com Shared, WordPress, Windows, and Reseller tiers qualify for unlimited free migrations handled directly by our engineering desk.',
  },
  {
    q: 'Which hosting plan should I choose if I want to buy hosting and migrate today?',
    a: 'For most business websites, blogs, and WooCommerce stores, clicking "Buy Hosting & Migrate" takes you directly to our Shared Web Hosting plans starting at $2.50/mo with Free Wildcard SSL and daily backups.',
  },
  {
    q: 'How do Switch Credits work if I already paid annually somewhere else?',
    a: 'Share proof of your remaining term on another hosting provider and we will match up to 12 months of unused time on an eligible annual cpcloudhost.com plan.',
  },
];

export const MigrationFreePage: React.FC<MigrationFreePageProps> = ({
  onNavigateHome,
  onOpenPage,
  onNavigatePath,
}) => {
  const { currency, formatPrice, formatPriceString } = useCurrency();
  const { cmsPages } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'migration-free');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive zero-downtime migration intake form
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [domainName, setDomainName] = useState('');
  const [currentProvider, setCurrentProvider] = useState('');
  const [targetPlanId, setTargetPlanId] = useState('shared');
  const [includeEmailSync, setIncludeEmailSync] = useState(true);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const destinationOptions = [
    { id: 'shared', label: `Shared Web Hosting (${formatPrice(2.5)}/mo)` },
    { id: 'wordpress', label: `Managed WordPress Hosting (${formatPrice(2.5)}/mo)` },
    { id: 'windows', label: `Windows Web Hosting (${formatPrice(2.5)}/mo)` },
    { id: 'vps', label: `Unmanaged KVM VPS (${formatPrice(12.99)}/mo)` },
    { id: 'n8n', label: `n8n Automation Hosting (${formatPrice(12.99)}/mo)` },
    { id: 'trial', label: '30-Day Free Trial (STARTFREE)' },
  ];
  const selectedDestinationLabel =
    destinationOptions.find((o) => o.id === targetPlanId)?.label ??
    destinationOptions[0].label;

  useEffect(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://cpcloudhost.com';
    applyPageSeoMetadata({
      title:
        pageCms?.seoTitle?.trim() ||
        'Free Zero-Downtime Website & Server Migrations | cpcloudhost.com',
      description:
        pageCms?.seoDescription?.trim() ||
        'Migrate WordPress, cPanel, Windows IIS, IMAP email, or KVM VPS to cpcloudhost.com for free with zero downtime. Compare eligible hosting plans or Buy Hosting & Migrate now.',
      keywords: [
        'free website migration',
        'zero downtime cPanel migration',
        'buy hosting and migrate',
        'WordPress migration service',
        'cpcloudhost switch credits',
      ],
      ogType: 'website',
      canonicalPath: '/migration-free',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            name: 'cpcloudhost.com Zero-Downtime Free Website Migration',
            provider: {
              '@type': 'Organization',
              name: 'cpcloudhost.com',
              url: origin,
            },
            areaServed: 'Worldwide',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: currency.code,
            },
          },
          {
            '@type': 'HowTo',
            name: 'How Zero-Downtime Migration to cpcloudhost.com Works',
            step: MIGRATION_PROCESS_STEPS.map((s, idx) => ({
              '@type': 'HowToStep',
              position: idx + 1,
              name: s.title,
              text: s.desc,
            })),
          },
        ],
      },
    });
  }, [currency.code, pageCms]);

  const handleSubmitMigration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter your name so our migration team can address you.');
      return;
    }
    if (
      !contactEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
    ) {
      setFormError('Enter a valid email address for staging preview updates.');
      return;
    }
    if (!domainName.trim() || !domainName.includes('.')) {
      setFormError('Enter the domain name you want migrated (e.g., yourbrand.com).');
      return;
    }
    setFormError('');
    setSubmittedRef(`MIG-${Math.floor(100000 + Math.random() * 899999)}`);
  };

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb & Hero Split Section */}
      <section className="bg-gradient-to-b from-[#F2FAF8] via-white to-white border-b border-[#E2E8F0] pt-8 pb-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-600 mb-6"
          >
            <button
              type="button"
              onClick={() => onNavigateHome('#top')}
              className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
            >
              Home
            </button>
            <ChevronRight
              className="w-3.5 h-3.5 text-slate-400"
              aria-hidden="true"
            />
            <span className="text-[#0F172A] font-semibold">
              Free Migrations
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                {pageCms?.heroBadge?.trim() ||
                  `White-Glove Engineering Service · ${formatPrice(0, { compactZero: true })} Migration Fee`}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Seamless, Zero-Downtime Website & Server Migrations'}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
                {pageCms?.heroSubtitle?.trim() ||
                  'Leave slow legacy servers behind without risking lost orders or broken emails. Our specialists clone your websites, databases, SSL certificates, and IMAP mailboxes onto cpcloudhost.com with zero downtime—plus Switch Credits up to 12 months.'}
              </p>

              <ul className="mt-5 space-y-2 text-xs sm:text-sm text-slate-700">
                {(pageCms?.highlights && pageCms.highlights.length > 0
                  ? pageCms.highlights
                  : [
                      'cPanel, StackCP, Plesk, WordPress, Windows IIS & VPS',
                      'Full Staging Verification Link Before Switching Live DNS',
                      'Switch Credits Cover Unused Annual Contract Months',
                    ]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2
                      className="w-4 h-4 text-[#0E6B63] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else if (url && url.startsWith('#')) {
                      document.querySelector(url)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      onOpenPage('shared-hosting', '#top');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg shadow-[0_6px_18px_rgba(14,107,99,0.22)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{pageCms?.primaryCtaText?.trim() || 'Buy Hosting & Migrate'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.secondaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      const el = document.querySelector(url || '#migration-plans');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Browse Eligible Plans'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F2FAF8] aspect-[4/3] lg:h-full shadow-[0_18px_40px_-20px_rgba(15,23,42,0.16)]">
                {!heroImgFailed ? (
                  <img
                    src={migrationHeroImg}
                    alt="Isometric cloud infrastructure showing zero-downtime data, SSL, and database transfer between servers"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#F2FAF8] to-[#E2ECE9]">
                    <RefreshCw className="w-12 h-12 text-[#0E6B63] mb-3" />
                    <p className="font-display font-bold text-[#0F172A]">
                      Zero-Downtime Migration Bridge
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Files, databases, SSL &amp; IMAP mailboxes synced cleanly
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Migration Assurance Bar */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#E2E8F0] rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0]">
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0E6B63] tabular-nums">
                0 min
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Planned Downtime
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Site stays live on old server until QA passes
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                Unlimited
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Free Site Transfers
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Single business sites or multi-client portfolios
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                Up to 12 mo
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Switch Credits Match
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Credit unused annual hosting from your old host
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0E6B63] tabular-nums">
                100%
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                IMAP &amp; SSL Preserved
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Inboxes, DNS zones, and AutoSSL synced clean
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hosting Plan Cards Grid (Each Card Has Explicit "View Plan" Button Linked to Its Page + "Buy Hosting & Migrate" Link to Shared Hosting) */}
      <section
        id="migration-plans"
        className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                Select Your Target Infrastructure
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Hosting Plans Eligible for Free Engineering Migration
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
                Explore each dedicated hosting tier via its <strong>View Plan</strong>{' '}
                button below, or jump straight to <strong>Buy Hosting &amp; Migrate</strong>{' '}
                for instant Shared Hosting onboarding.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenPage('shared-hosting', '#top')}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-end"
            >
              <span>Buy Hosting &amp; Migrate</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MIGRATION_HOSTING_CARDS.map((card) => (
              <div
                key={card.id}
                className={`bg-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-colors ${
                  card.recommended
                    ? 'border-2 border-[#0E6B63]'
                    : 'border border-[#E2E8F0] hover:border-[#0E6B63]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-3">
                    <span className="font-semibold text-[#0E6B63]">
                      {card.recommended ? 'Most Popular Destination' : 'Free Migration Eligible'}
                    </span>
                    <span className="text-slate-500">
                      {currency.code} Pricing
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-[#0F172A]">
                    {card.planName}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-[#0F172A] tabular-nums">
                      {formatPrice(card.usdPrice, { compactZero: true })}
                    </span>
                    <span className="text-xs text-slate-500">{card.cycle}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                    {card.bestFor}
                  </p>

                  <ul className="mt-5 pt-5 border-t border-slate-100 space-y-2.5">
                    {card.highlights.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"
                      >
                        <Check
                          className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenPage(card.pageTarget, '#top')}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                      card.recommended
                        ? 'bg-[#0E6B63] text-white hover:bg-[#0A534D]'
                        : 'bg-[#F2FAF8] text-[#0E6B63] hover:bg-[#0E6B63] hover:text-white border border-[#0E6B63]/20'
                    }`}
                  >
                    <span>View Plan — {card.planName}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPage('shared-hosting', '#top')}
                    className="w-full text-center py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E6B63] transition-colors cursor-pointer"
                  >
                    Buy Hosting &amp; Migrate on Shared Hosting →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Transfer Without Data Loss */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Complete Stack Coverage
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Every File, Database Table &amp; Inbox Transferred Intact
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRANSFER_CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="border border-[#E2E8F0] rounded-xl p-6 bg-white"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F2FAF8] border border-[#0E6B63]/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#0E6B63]" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4-Step Zero-Downtime Workflow */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Predictable Cutover Protocol
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              How Your Zero-Downtime Migration Works in Four Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MIGRATION_PROCESS_STEPS.map((step) => (
              <div
                key={step.num}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-7"
              >
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  <span className="font-mono text-[#0E6B63] tabular-nums mr-2">
                    {step.num}
                  </span>
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Highlight Strip for Switch Credits + Buy Hosting & Migrate CTA */}
          <div className="mt-10 bg-[#DFECEB] border border-[#0E6B63]/20 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold text-[#0E6B63] mb-1">
                Switch Credits &amp; Immediate Onboarding
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
                Ready to Start? Buy Hosting &amp; Schedule Your Free Move
              </h3>
              <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                Lock in autoscaling NVMe Shared Hosting starting at {formatPrice(2.5)}/mo, then
                let our engineering desk migrate every website and email inbox free.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenPage('shared-hosting', '#top')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-center"
            >
              <span>Buy Hosting &amp; Migrate</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Migration Intake Form + Security Note */}
      <section
        id="migration-intake-form"
        className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Schedule With Engineering
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Request Your Free Migration Window
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Submit your domain and destination tier below. Support cpcloudhost
              and our migration engineers coordinate a convenient sync window and
              send your encrypted credential drop link.
            </p>

            <div className="mt-6 border-t border-[#E2E8F0] pt-5 space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5" />
                <span>
                  Encrypted temporary credential handling purged right after QA verification
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5" />
                <span>
                  Zero modification to your current hosting account or live DNS
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 bg-[#F8FAFC]">
            {submittedRef ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-11 h-11 text-[#0E6B63] mx-auto mb-3" />
                <h3 className="font-display text-xl font-bold text-[#0F172A]">
                  Migration Request Confirmed
                </h3>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                  Ticket <strong className="font-mono text-[#0F172A]">{submittedRef}</strong> is queued for{' '}
                  <strong>{domainName}</strong> targeting{' '}
                  <strong>{selectedDestinationLabel}</strong>. Next steps sent to{' '}
                  <strong>{contactEmail}</strong>.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenPage('shared-hosting', '#top')}
                    className="px-5 py-2.5 text-xs font-semibold bg-[#0E6B63] text-white rounded-lg hover:bg-[#0A534D] cursor-pointer"
                  >
                    Buy Hosting &amp; Migrate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRef(null);
                      setDomainName('');
                      setNotes('');
                    }}
                    className="px-5 py-2.5 text-xs font-semibold border border-[#CBD5E1] text-[#0F172A] rounded-lg hover:bg-white cursor-pointer"
                  >
                    Add Another Domain
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitMigration}
                noValidate
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mig-name"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="mig-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mig-email"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="mig-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@yourdomain.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mig-domain"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Primary Domain to Migrate
                    </label>
                    <input
                      id="mig-domain"
                      type="text"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      placeholder="yourdomain.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mig-provider"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Current Provider / Panel
                    </label>
                    <input
                      id="mig-provider"
                      type="text"
                      value={currentProvider}
                      onChange={(e) => setCurrentProvider(e.target.value)}
                      placeholder="e.g., cPanel, Plesk, WordPress Host"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="mig-target"
                    className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                  >
                    Destination cpcloudhost.com Plan
                  </label>
                  <select
                    id="mig-target"
                    value={targetPlanId}
                    onChange={(e) => setTargetPlanId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  >
                    {destinationOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mig-notes"
                    className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                  >
                    Additional Domains, WooCommerce Orders, or Preferred Cutover Time (Optional)
                  </label>
                  <textarea
                    id="mig-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mention extra add-on domains, large mailbox counts, or Switch Credit invoices..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmailSync}
                    onChange={(e) => setIncludeEmailSync(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                  />
                  <span>
                    Include full IMAP email inbox sync &amp; SPF/DKIM alignment
                  </span>
                </label>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer"
                >
                  Schedule Free Migration
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Migration FAQ Accordion */}
      <section className="py-14 bg-[#F8FAFC]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Migration Frequently Asked Questions
            </h2>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
            {MIGRATION_FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="p-5 sm:p-6">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                      {item.q}
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
