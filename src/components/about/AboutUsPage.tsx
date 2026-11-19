import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Headphones,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import aboutHeroImg from '../../assets/images/about_hero_datacenter_1794566984778.jpg';
import mudassarPortrait from '../../assets/images/leader_mudassar_portrait_1794566986834.jpg';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

export type AboutNavTarget =
  | 'home'
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'free-trial'
  | 'vps-hosting'
  | 'n8n-hosting'
  | 'domain-registration'
  | 'domain-transfer'
  | 'knowledge-base'
  | 'migration-free';

interface AboutUsPageProps {
  onNavigateHome: (sectionSelector?: string) => void;
  onOpenPage: (page: AboutNavTarget, selector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

interface TeamMember {
  name: string;
  roleTitle: string;
  department: string;
  bio: string;
  focusAreas: string[];
  portrait?: string;
  initials: string;
}

const LEADERSHIP_TEAM: TeamMember[] = [
  {
    name: 'Mr. Mudassar',
    roleTitle: 'CEO & Founder',
    department: 'Chief Executive Officer & Cloud Architecture',
    bio: 'Leads cpcloudhost.com global strategy, carrier-grade network partnerships, autoscaling StackCP & KVM NVMe infrastructure, Anycast DNS routing, and multi-region SLA governance worldwide.',
    focusAreas: [
      'Global Strategy & Enterprise SLA',
      'NVMe Storage & KVM Virtualization',
      'Zero-Downtime Migration Architecture',
    ],
    portrait: mudassarPortrait,
    initials: 'MM',
  },
  {
    name: 'Cloud Core Engineering',
    roleTitle: 'Infrastructure Unit',
    department: 'Systems, Edge Network & Automation',
    bio: 'Maintains Gen4 NVMe arrays, LiteSpeed Enterprise clusters, WHM/cPanel & StackCP provisioning automation, daily JetBackup snapshots, and sub-200ms global routing.',
    focusAreas: [
      '99.99% Uptime & Edge Cache Tuning',
      'WHM / StackCP Auto-Provisioning',
      'Automated SSL & Network DDoS Mitigation',
    ],
    initials: 'CC',
  },
  {
    name: 'Support cpcloudhost',
    roleTitle: '24/7 Operations Desk',
    department: 'Technical Support, Migrations & Trust',
    bio: 'Handles round-the-clock ticket resolution, live chat troubleshooting, zero-downtime website migrations, DNS/WHOIS verification, and Abuse compliance monitoring.',
    focusAreas: [
      '24/7 Incident & Error Diagnostics',
      'Free White-Glove Site & Mail Migrations',
      'Domain, DNS & Compliance Operations',
    ],
    initials: 'SC',
  },
];

const ENGINEERING_PILLARS = [
  {
    num: '01.',
    title: 'Multi-Region NVMe Architecture',
    desc: 'Workloads run on isolated PCIe Gen4 NVMe arrays with L2/L3 network redundancy and automated edge caching across five global regions.',
  },
  {
    num: '02.',
    title: 'Zero-Downtime Onboarding & Switch Credits',
    desc: 'Our engineering desk clones your files, databases, SSL, and IMAP email privately before touching live DNS, backed by up to 12 months of Switch Credits.',
  },
  {
    num: '03.',
    title: 'Predictable Local Currency Pricing Without Surprise Hikes',
    desc: 'Every shared, WordPress, Windows, domain, and KVM VPS plan displays upfront billing converted into your local currency with free Wildcard SSL and daily snapshots built in.',
  },
  {
    num: '04.',
    title: 'Unified StackCP, cPanel & Root KVM Control',
    desc: 'Whether your team prefers streamlined StackCP autoscaling, classic WHM/cPanel workspaces, or full root SSH on KVM VPS nodes, every tool lives in one portal.',
  },
];

const GLOBAL_HUBS = [
  {
    region: 'London, UK',
    tier: 'Tier-4 Primary European Core',
    specialty: 'StackCP Cloud & Low-Latency EU/UK Routing',
  },
  {
    region: 'New York & Dallas, USA',
    tier: 'North American East / Central Mesh',
    specialty: 'Managed WordPress, WooCommerce & SaaS Apps',
  },
  {
    region: 'Frankfurt, Germany',
    tier: 'GDPR-Compliant Continental Node',
    specialty: 'Unmanaged KVM VPS & n8n Webhook Clusters',
  },
  {
    region: 'Singapore & Sydney',
    tier: 'Asia-Pacific Edge Backbone',
    specialty: 'Anycast DNS, Edge CDN & High-Throughput I/O',
  },
];

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onNavigateHome,
  onOpenPage,
  onNavigatePath,
}) => {
  const { currency } = useCurrency();
  const { cmsPages } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'about-us');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [failedPortraits, setFailedPortraits] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://cpcloudhost.com';
    applyPageSeoMetadata({
      title:
        pageCms?.seoTitle?.trim() ||
        'About Us — Global Cloud Infrastructure & Leadership | cpcloudhost.com',
      description:
        pageCms?.seoDescription?.trim() ||
        'Meet Chief Executive Officer & Founder Mr. Mudassar and the cpcloudhost.com cloud engineering and Support cpcloudhost operations team — powering 99.99% uptime across global NVMe cloud hubs.',
      keywords: [
        'about cpcloudhost',
        'cpcloudhost leadership team',
        'enterprise NVMe hosting provider',
        'managed cloud infrastructure SLA',
      ],
      ogType: 'website',
      canonicalPath: '/about-us',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About cpcloudhost.com',
        url: `${origin}/about-us`,
        mainEntity: {
          '@type': 'Organization',
          name: 'cpcloudhost.com',
          url: origin,
          founder: {
            '@type': 'Person',
            name: 'Mr. Mudassar',
            jobTitle: 'Chief Executive Officer & Founder',
          },
          employee: [
            {
              '@type': 'Person',
              name: 'Mr. Mudassar',
              jobTitle: 'Chief Executive Officer & Founder',
            },
          ],
        },
      },
    });
  }, [pageCms]);

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb & Executive Split Hero */}
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
            <span className="text-[#0F172A] font-semibold">About Us</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                {pageCms?.heroBadge?.trim() ||
                  'About cpcloudhost.com · Global Cloud & Hosting Platform'}
              </p>
              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Cloud Infrastructure Engineered for Speed, Trust & Human Support'}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
                {pageCms?.heroSubtitle?.trim() ||
                  'cpcloudhost.com delivers NVMe shared cloud hosting, managed WordPress, Windows IIS, root KVM VPS, and domain automation for agencies and businesses worldwide. Every node combines bare-metal reliability with direct access to senior systems engineers.'}
              </p>

              <p className="text-xs sm:text-sm text-slate-500 mt-4">
                99.99% Uptime SLA · Transparent {currency.code} ({currency.symbol}) Pricing · Free White-Glove Migrations
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && url !== '/shared-hosting' && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      onOpenPage('shared-hosting', '#top');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg shadow-[0_6px_18px_rgba(14,107,99,0.22)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{pageCms?.primaryCtaText?.trim() || 'Explore Hosting Plans'}</span>
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
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Free Migration Service'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#0F172A] aspect-[4/3] lg:h-full shadow-[0_18px_40px_-20px_rgba(15,23,42,0.18)]">
                {!heroImgFailed ? (
                  <img
                    src={aboutHeroImg}
                    alt="Modern cpcloudhost.com tier-4 cloud datacenter operations floor and glass engineering command center"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white bg-gradient-to-br from-[#0F172A] to-[#0E6B63]">
                    <Server className="w-12 h-12 text-[#10B981] mb-3" />
                    <p className="font-display text-lg font-bold">
                      cpcloudhost.com Global Cloud Core
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Multi-region Tier-4 NVMe datacenters engineered for 99.99% uptime
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Executive KPI Strip Below Split Hero */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#E2E8F0] rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0]">
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0E6B63] tabular-nums">
                99.99%
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Verified Uptime SLA
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-path Anycast routing &amp; redundant power
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                5 Regions
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Global Datacenter Hubs
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                UK, USA, EU, Singapore &amp; Sydney edge presence
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tabular-nums">
                &lt; 15 min
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                24/7 Engineer Response
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct ticket &amp; live troubleshooting escalation
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#0E6B63] tabular-nums">
                30 Days
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Money-Back Assurance
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Plus Switch Credits up to 12 months
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Core Engineering Support Team */}
      <section id="leadership-team" className="py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              Leadership &amp; Core Support Team
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Built &amp; Backed by Hands-On Infrastructure Leaders
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Unlike faceless conglomerates, cpcloudhost.com is operated directly
              by engineers and leadership accountable for every server node,
              migration, and client ticket.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {LEADERSHIP_TEAM.map((member) => {
              const portraitFailed = !!failedPortraits[member.name];
              return (
                <article
                  key={member.name}
                  className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white flex flex-col justify-between transition-colors hover:border-[#0E6B63]/60"
                >
                  <div>
                    <div className="aspect-square bg-[#F4F5F7] overflow-hidden border-b border-[#E2E8F0]">
                      {member.portrait && !portraitFailed ? (
                        <img
                          src={member.portrait}
                          alt={`${member.name} — ${member.roleTitle} at cpcloudhost.com`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedPortraits((prev) => ({
                              ...prev,
                              [member.name]: true,
                            }))
                          }
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F2FAF8] to-[#E2ECE9] text-[#0E6B63] p-6 text-center">
                          {member.initials === 'CC' ? (
                            <Server className="w-12 h-12 text-[#0E6B63] mb-3" aria-hidden="true" />
                          ) : member.initials === 'SC' ? (
                            <Headphones className="w-12 h-12 text-[#0E6B63] mb-3" aria-hidden="true" />
                          ) : (
                            <span className="font-display text-3xl font-bold">
                              {member.initials}
                            </span>
                          )}
                          <span className="font-display text-lg font-bold text-[#0F172A]">
                            {member.name}
                          </span>
                          <span className="text-xs text-slate-600 mt-1">
                            {member.roleTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold text-[#0E6B63]">
                        {member.roleTitle}
                        <span className="text-slate-400 mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-600 font-medium">
                          {member.department}
                        </span>
                      </p>

                      <h3 className="font-display text-xl font-bold text-[#0F172A] mt-1.5">
                        {member.name}
                      </h3>

                      <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                        {member.bio}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-slate-100">
                    <ul className="space-y-1.5">
                      {member.focusAreas.map((focus) => (
                        <li
                          key={focus}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-[#0E6B63] shrink-0"
                            aria-hidden="true"
                          />
                          <span>{focus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Principles (01-04 Editorial Grid) */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-[#0E6B63] mb-2">
              How We Operate
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Four Infrastructure Standards Every Client Receives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ENGINEERING_PILLARS.map((item) => (
              <div
                key={item.num}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-7"
              >
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  <span className="font-mono text-[#0E6B63] tabular-nums mr-2">
                    {item.num}
                  </span>
                  {item.num === '03.'
                    ? `Predictable ${currency.code} Pricing Without Surprise Hikes`
                    : item.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  {item.num === '03.'
                    ? `Every shared, WordPress, Windows, domain, and KVM VPS plan displays upfront billing in ${currency.code} (${currency.symbol}) with free Wildcard SSL and daily snapshots built in.`
                    : item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Datacenter Presence & Quick Guarantees */}
      <section className="py-16 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                Global Network Backbone
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Deploy Close to Your Audience Anywhere Worldwide
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Select regional server locations during deployment while Anycast
                DNS and our Edge CDN accelerate static and dynamic assets across
                six continents.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#0E6B63] shrink-0" />
                  <span>Free Wildcard SSL &amp; Daily Malware Scanning</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#0E6B63] shrink-0" />
                  <span>Sub-200ms Edge Cache &amp; PHP 8.3 Workers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#0E6B63] shrink-0" />
                  <span>24/7 Monitoring with Automated Snapshot Recovery</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GLOBAL_HUBS.map((hub) => (
                <div
                  key={hub.region}
                  className="border border-[#E2E8F0] rounded-xl p-5 bg-[#F8FAFC]"
                >
                  <div className="flex items-center gap-2 text-[#0E6B63] mb-1.5">
                    <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="font-display text-base font-bold text-[#0F172A]">
                      {hub.region}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0E6B63]">
                    {hub.tier}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {hub.specialty}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Executive CTA Strip */}
      <section className="py-14 bg-[#0F172A] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              Ready to Move Your Infrastructure to cpcloudhost.com?
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Launch a new shared, WordPress, Windows, or KVM VPS environment in
              seconds—or let Support cpcloudhost and our migration engineers handle your move free.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenPage('shared-hosting', '#top')}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>View Shared Hosting</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onOpenPage('knowledge-base', '#kb-contact-support')}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-slate-600 hover:border-[#10B981] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Headphones className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
              <span>Contact Engineering</span>
            </button>
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
