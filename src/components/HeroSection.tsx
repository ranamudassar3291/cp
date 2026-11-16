import React from 'react';
import { Check, Cloud, Cpu, Server, ShieldCheck, Zap } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { usePlatform } from '../context/PlatformContext';

interface HeroSectionProps {
  onStartTrial: () => void;
  onViewPlans: () => void;
  onSelectOrbitPlatform: (sectionSelector: string) => void;
  onNavigatePath?: (path: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartTrial,
  onViewPlans,
  onSelectOrbitPlatform,
  onNavigatePath,
}) => {
  const { formatPrice } = useCurrency();
  const { cmsPages } = usePlatform();
  const homeCms = cmsPages.find((p) => p.id === 'home');

  const defaultBullets = [
    'Free Wildcard SSL & Global CDN',
    'Free Domain Hosting & WHOIS Privacy',
    '30-Day Money-Back Guarantee',
    '99.99% Uptime SLA Guarantee',
    'Global Tier-III+ Datacentres',
  ];
  const bullets =
    homeCms?.highlights && homeCms.highlights.length > 0
      ? homeCms.highlights
      : defaultBullets;
  const heroBadge =
    homeCms?.heroBadge?.trim() || 'StackCP & cPanel Web Hosting';
  const heroTitle =
    homeCms?.heroTitle?.trim() ||
    'Next-Generation Cloud & Web Hosting for Modern Websites';
  const heroSubtitle =
    homeCms?.heroSubtitle?.trim() ||
    'Fast, secure, and autoscaling cloud hosting powered by StackCP and cPanel on pure NVMe Gen4 clusters. Launch WordPress, business storefronts, or multi-cloud workloads';
  const primaryCtaLabel =
    homeCms?.primaryCtaText?.trim() || 'Start Free Trial Now';
  const secondaryCtaLabel =
    homeCms?.secondaryCtaText?.trim() || 'View Hosting Plans';

  const orbitNodes = [
    {
      label: 'cPanel',
      positionStyle: { left: '50%', top: '13%' },
      planId: 'cpanel-nvme',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
          <path
            d="M7.5 16.5C5.01472 16.5 3 14.4853 3 12C3 9.51472 5.01472 7.5 7.5 7.5H11L9.6 12H7.8C6.97157 12 6.3 12.6716 6.3 13.5C6.3 14.3284 6.97157 15 7.8 15H10.5L9.9 16.5H7.5ZM13.5 7.5H16.8C19.1196 7.5 21 9.3804 21 11.7C21 14.0196 19.1196 15.9 16.8 15.9H14.5L13.6 18.5H10.8L13.5 7.5Z"
            fill="#FF6C2C"
          />
        </svg>
      ),
    },
    {
      label: 'WordPress',
      positionStyle: { left: '82%', top: '31.5%' },
      planId: 'pro-business',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#21759B" strokeWidth="1.8" />
          <path
            d="M6.8 9L10 17.5M12 8.5L15.2 17.5M17.2 9.5L15.2 17.5"
            stroke="#21759B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: 'Google Cloud',
      positionStyle: { left: '82%', top: '68.5%' },
      planId: 'gcp-server',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
          <path
            d="M7.5 16.5H16.8C18.5673 16.5 20 15.0673 20 13.3C20 11.63 18.72 10.26 17.09 10.11C16.52 7.75 14.4 6 11.88 6C8.92 6 6.53 8.4 6.53 11.35C6.53 11.51 6.54 11.67 6.55 11.83C4.83 12.1 3.5 13.59 3.5 15.38C3.5 16.01 3.99 16.5 4.62 16.5H7.5Z"
            stroke="#4285F4"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
    {
      label: 'Windows',
      positionStyle: { left: '50%', top: '87%' },
      planId: 'windows-cloud',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" fill="#0078D4" />
          <rect x="13" y="4" width="7" height="7" fill="#0078D4" />
          <rect x="4" y="13" width="7" height="7" fill="#0078D4" />
          <rect x="13" y="13" width="7" height="7" fill="#0078D4" />
        </svg>
      ),
    },
    {
      label: 'Linux',
      positionStyle: { left: '18%', top: '68.5%' },
      planId: 'unmanaged-vps',
      icon: <Cpu className="w-4 h-4 text-[#0F172A]" aria-hidden="true" />,
    },
    {
      label: 'AWS',
      positionStyle: { left: '18%', top: '31.5%' },
      planId: 'aws-server',
      icon: <Cloud className="w-4 h-4 text-[#FF9900]" aria-hidden="true" />,
    },
  ];

  return (
    <section
      id="top"
      className="bg-white border-b border-[#E2E8F0] overflow-x-clip"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Badge, Headline, Subheadline, 5 Checkmarks, Dual CTAs */}
          <div className="lg:col-span-6 min-w-0">
            <div className="mb-5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E6B63] text-white text-xs font-semibold tracking-wide shadow-[0_6px_18px_rgba(14,107,99,0.22)]">
                <Zap className="w-3.5 h-3.5 text-[#10B981] fill-current" aria-hidden="true" />
                <span>{heroBadge}</span>
              </span>
            </div>

            <h1
              className="font-display font-extrabold tracking-tight text-[#0F172A] leading-[1.08] mb-5"
              style={{
                fontSize: 'clamp(2.15rem, 3.7vw, 3.45rem)',
                textWrap: 'balance',
              }}
            >
              {heroTitle}
            </h1>

            <p className="text-base sm:text-[17px] text-slate-600 leading-relaxed max-w-xl mb-7">
              {heroSubtitle} starting from{' '}
              <span className="font-mono-num font-bold text-[#0F172A]">
                {formatPrice(2.5)}/mo
              </span>
              .
            </p>

            {/* Feature Checkmark Points */}
            <ul className="space-y-2.5 mb-8">
              {bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm sm:text-[15px] font-medium text-[#0F172A]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#0E6B63]/10 text-[#0E6B63] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  const customUrl = homeCms?.primaryCtaUrl?.trim();
                  if (customUrl && customUrl !== '/free-trial' && onNavigatePath) {
                    onNavigatePath(customUrl);
                  } else {
                    onStartTrial();
                  }
                }}
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg shadow-[0_6px_20px_rgba(14,107,99,0.22)] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
              >
                {primaryCtaLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const customUrl = homeCms?.secondaryCtaUrl?.trim();
                  if (customUrl && customUrl !== '#services' && onNavigatePath) {
                    onNavigatePath(customUrl);
                  } else {
                    onViewPlans();
                  }
                }}
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
              >
                {secondaryCtaLabel}
              </button>
            </div>
          </div>

          {/* Right Column: Glowing Circular Orbit Ring & Vector Cloud/Server Core */}
          <div className="lg:col-span-6 flex items-center justify-center min-w-0">
            <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] shrink-0 flex items-center justify-center">
              {/* Soft Ambient Teal Halo */}
              <div
                aria-hidden="true"
                className="absolute inset-[16%] rounded-full bg-radial from-[#10B981]/12 via-[#0E6B63]/5 to-transparent blur-xl pointer-events-none"
              />

              {/* Outer Dashed Circular Orbit Ring */}
              <div
                aria-hidden="true"
                className="absolute inset-[13%] rounded-full border-2 border-dashed border-[#0E6B63]/35 shadow-[0_0_45px_rgba(16,185,129,0.12)]"
              />

              {/* Inner Glowing Concentric Ring */}
              <div
                aria-hidden="true"
                className="absolute inset-[25%] rounded-full border border-[#10B981]/30"
              />

              {/* Central Transparent Cloud Server Vector Illustration */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none">
                <svg
                  viewBox="0 0 180 165"
                  className="w-32 h-28 sm:w-44 sm:h-40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="cpcloudhost.com cloud server core"
                >
                  <circle
                    cx="90"
                    cy="84"
                    r="66"
                    fill="#0E6B63"
                    fillOpacity="0.06"
                  />
                  <path
                    d="M52 96H128C139.046 96 148 87.0457 148 76C148 65.6353 140.114 57.1127 130.02 56.1014C126.447 39.4563 111.673 27 94 27C73.5655 27 57 43.5655 57 64C57 65.1286 57.0506 66.2455 57.1495 67.3484C44.1422 69.2692 34 80.4706 34 94C34 94.675 34.0252 95.342 34.0748 96H52Z"
                    fill="#FFFFFF"
                    stroke="#0E6B63"
                    strokeWidth="2.5"
                  />
                  {/* Blade 1 */}
                  <rect
                    x="56"
                    y="80"
                    width="68"
                    height="17"
                    rx="4"
                    fill="#0F172A"
                  />
                  <circle cx="65" cy="88.5" r="2.5" fill="#10B981" />
                  <rect
                    x="73"
                    y="87"
                    width="26"
                    height="3"
                    rx="1.5"
                    fill="#94A3B8"
                  />
                  <rect
                    x="108"
                    y="86.5"
                    width="9"
                    height="4"
                    rx="1"
                    fill="#0E6B63"
                  />
                  {/* Blade 2 */}
                  <rect
                    x="56"
                    y="102"
                    width="68"
                    height="17"
                    rx="4"
                    fill="#0F172A"
                  />
                  <circle cx="65" cy="110.5" r="2.5" fill="#10B981" />
                  <rect
                    x="73"
                    y="109"
                    width="30"
                    height="3"
                    rx="1.5"
                    fill="#94A3B8"
                  />
                  <rect
                    x="108"
                    y="108.5"
                    width="9"
                    height="4"
                    rx="1"
                    fill="#10B981"
                  />
                  {/* Blade 3 */}
                  <rect
                    x="56"
                    y="124"
                    width="68"
                    height="17"
                    rx="4"
                    fill="#0E6B63"
                  />
                  <circle cx="65" cy="132.5" r="2.5" fill="#FFFFFF" />
                  <rect
                    x="73"
                    y="131"
                    width="38"
                    height="3"
                    rx="1.5"
                    fill="#FFFFFF"
                    fillOpacity="0.85"
                  />
                </svg>

                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                  <Server
                    className="w-3.5 h-3.5 text-[#0E6B63]"
                    aria-hidden="true"
                  />
                  <span>cpcloudhost.com</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <ShieldCheck
                    className="w-3 h-3 text-[#10B981]"
                    aria-hidden="true"
                  />
                  <span>NVMe · SSL · CDN</span>
                </div>
              </div>

              {/* Floating Orbit Tech Badges */}
              {orbitNodes.map((node) => (
                <button
                  key={node.label}
                  type="button"
                  onClick={() => onSelectOrbitPlatform('#services')}
                  style={node.positionStyle}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-[#E2E8F0] shadow-[0_8px_22px_-8px_rgba(15,23,42,0.14)] hover:border-[#0E6B63] hover:scale-105 transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
                >
                  <span className="shrink-0 flex items-center justify-center">
                    {node.icon}
                  </span>
                  <span className="font-display text-[11px] sm:text-xs font-bold text-[#0F172A]">
                    {node.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
