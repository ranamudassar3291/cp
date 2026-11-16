import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface WordPressShowcaseSectionProps {
  onExploreWordPress: () => void;
}

const FLEET_ROWS = [
  {
    domain: 'studio-north.com',
    owner: 'admin@studio-north.com',
    plan: 'Managed WordPress',
    flag: 'uk',
    hasAdd: false,
  },
  {
    domain: 'meridianstore.io',
    owner: 'ops@meridianstore.io',
    plan: 'Managed WordPress',
    flag: 'uk',
    hasAdd: true,
  },
  {
    domain: 'harborcraft.co.uk',
    owner: 'hello@harborcraft.co.uk',
    plan: 'Managed WordPress',
    flag: 'uk',
    hasAdd: false,
  },
  {
    domain: 'verve-agency.com',
    owner: 'team@verve-agency.com',
    plan: 'Managed WordPress',
    flag: 'us',
    hasAdd: false,
  },
  {
    domain: 'kineticlabs.dev',
    owner: 'dev@kineticlabs.dev',
    plan: 'Managed WordPress',
    flag: 'uk',
    hasAdd: true,
  },
  {
    domain: 'oakridge-press.com',
    owner: 'web@oakridge-press.com',
    plan: 'Managed WordPress',
    flag: 'us',
    hasAdd: false,
  },
  {
    domain: 'atlascommerce.net',
    owner: 'it@atlascommerce.net',
    plan: 'Managed WordPress',
    flag: 'uk',
    hasAdd: false,
  },
  {
    domain: 'beaconcreative.org',
    owner: 'cloud@beaconcreative.org',
    plan: 'Managed WordPress',
    flag: 'uk',
    hasAdd: true,
  },
  {
    domain: 'nordicventures.io',
    owner: 'ops@nordicventures.io',
    plan: 'Managed WordPress',
    flag: 'us',
    hasAdd: false,
  },
];

const FlagBadge: React.FC<{ country: string }> = ({ country }) => {
  const uid = React.useId();
  if (country === 'us') {
    const clipId = `us-flag-${uid}`;
    return (
      <svg viewBox="0 0 20 20" className="w-4 h-4 rounded-full shrink-0" aria-hidden="true">
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect width="20" height="20" fill="#FFFFFF" />
          <rect y="0" width="20" height="3" fill="#DC2626" />
          <rect y="6" width="20" height="3" fill="#DC2626" />
          <rect y="12" width="20" height="3" fill="#DC2626" />
          <rect y="18" width="20" height="2" fill="#DC2626" />
          <rect width="10" height="11" fill="#1D4ED8" />
          <circle cx="3" cy="3.5" r="0.8" fill="#FFFFFF" />
          <circle cx="6.5" cy="3.5" r="0.8" fill="#FFFFFF" />
          <circle cx="4.8" cy="6" r="0.8" fill="#FFFFFF" />
          <circle cx="3" cy="8.5" r="0.8" fill="#FFFFFF" />
          <circle cx="6.5" cy="8.5" r="0.8" fill="#FFFFFF" />
        </g>
      </svg>
    );
  }

  const clipId = `uk-flag-${uid}`;
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 rounded-full shrink-0" aria-hidden="true">
      <clipPath id={clipId}>
        <circle cx="10" cy="10" r="10" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="20" height="20" fill="#1E3A8A" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#FFFFFF" strokeWidth="3.2" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#DC2626" strokeWidth="1.4" />
        <path d="M10 0V20M0 10H20" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M10 0V20M0 10H20" stroke="#DC2626" strokeWidth="2.8" />
      </g>
    </svg>
  );
};

export const WordPressShowcaseSection: React.FC<
  WordPressShowcaseSectionProps
> = ({ onExploreWordPress }) => {
  const { formatPrice } = useCurrency();
  const highlights = [
    'Instant 1-click WordPress & WooCommerce deployment',
    'Full compatibility with Elementor, Gutenberg & custom blocks',
    'Built-in LiteSpeed & Redis edge caching included free',
    'Automated core, plugin & theme security updates',
    'Isolated staging sandboxes with 1-click clone & push',
  ];

  const toolkitTiles = [
    {
      label: 'WP Admin',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="32" height="28" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="4" y="4" width="32" height="7" rx="3" fill="#334155" />
          <circle cx="9" cy="7.5" r="1.2" fill="#94A3B8" />
          <circle cx="13" cy="7.5" r="1.2" fill="#94A3B8" />
          <rect x="7" y="14" width="7" height="15" rx="1" fill="#E2E8F0" />
          <rect x="17" y="14" width="16" height="5" rx="1" fill="#CBD5E1" />
          <rect x="17" y="21" width="10" height="8" rx="1" fill="#E2E8F0" />
          <circle cx="28" cy="24" r="5" fill="#0E6B63" />
          <path d="M25.5 22L27.2 26.5L28.5 22.8L29.8 26.5L31.2 22" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Reinstall WP',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <rect x="6" y="5" width="28" height="20" rx="2.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          <rect x="9" y="8" width="22" height="14" rx="1" fill="#FFFFFF" />
          <path d="M3 26H37L34.5 30H5.5L3 26Z" fill="#94A3B8" />
          <circle cx="20" cy="15" r="5.5" fill="#21759B" />
          <circle cx="24.5" cy="19" r="5.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.2" />
          <path d="M22.8 19C22.8 18 23.6 17.2 24.6 17.2C25.4 17.2 26 17.7 26.2 18.4M26.2 19.6C25.9 20.3 25.3 20.8 24.5 20.8C23.8 20.8 23.2 20.4 22.9 19.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Plugins',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <path d="M20 22V28C20 30.5 22 32 24.5 32H30" stroke="#94A3B8" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="16" y="7" width="2.5" height="6" rx="1" fill="#CBD5E1" />
          <rect x="21.5" y="7" width="2.5" height="6" rx="1" fill="#CBD5E1" />
          <path d="M13 13H27V17C27 20.5 24 23 20 23C16 23 13 20.5 13 17V13Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
          <rect x="12" y="12" width="16" height="2.8" rx="1" fill="#334155" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <circle cx="20" cy="18" r="11" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3.5 2.5" />
          <circle cx="20" cy="18" r="7.2" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.5" />
          <path d="M16.5 15L18.8 21.5L20 17L21.2 21.5L23.5 15" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Staging',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <rect x="5" y="7" width="20" height="16" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.4" />
          <rect x="5" y="7" width="20" height="4.5" rx="2" fill="#10B981" />
          <rect x="15" y="13" width="20" height="16" rx="2" fill="#FFFFFF" stroke="#0E6B63" strokeWidth="1.4" />
          <rect x="15" y="13" width="20" height="4.5" rx="2" fill="#0E6B63" />
          <rect x="18" y="20" width="14" height="2.5" rx="1" fill="#CBD5E1" />
          <rect x="18" y="24" width="9" height="2.5" rx="1" fill="#E2E8F0" />
        </svg>
      ),
    },
    {
      label: 'Checksum',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <path d="M10 5H24L30 11V31H10V5Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M24 5V11H30" fill="#E2E8F0" />
          <rect x="13" y="14" width="14" height="10" rx="1.5" fill="#0284C7" />
          <text x="20" y="20.5" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="monospace">
            0101
          </text>
          <rect x="13" y="26.5" width="11" height="2" rx="1" fill="#CBD5E1" />
        </svg>
      ),
    },
    {
      label: 'Themes',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <rect x="4" y="6" width="24" height="20" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.4" />
          <rect x="4" y="6" width="24" height="5" rx="2" fill="#0F172A" />
          <circle cx="13" cy="18" r="4.5" fill="#0E6B63" />
          <rect x="23" y="11" width="13" height="20" rx="2" fill="#FFFFFF" stroke="#0E6B63" strokeWidth="1.4" />
          <rect x="23" y="11" width="13" height="4" rx="2" fill="#10B981" />
          <rect x="25.5" y="18" width="8" height="4" rx="1" fill="#E2E8F0" />
          <rect x="25.5" y="24" width="8" height="4" rx="1" fill="#CBD5E1" />
        </svg>
      ),
    },
    {
      label: 'Users',
      icon: (
        <svg viewBox="0 0 40 36" className="w-9 h-8" fill="none" aria-hidden="true">
          <circle cx="16" cy="13" r="5" fill="#0E6B63" />
          <path d="M7 29C7 23.5 11 20 16 20C21 20 25 23.5 25 29" fill="#0E6B63" fillOpacity="0.85" />
          <circle cx="26" cy="14" r="4" fill="#D97706" />
          <path d="M21 29C21 24.5 23.2 21.5 27 21.5C30.8 21.5 33 24.5 33 29" fill="#10B981" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="wordpress-suite"
      className="bg-white py-16 lg:py-22 border-b border-[#E2E8F0] overflow-x-clip"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline, 5 Bullets, Pill CTA */}
          <div className="lg:col-span-5 min-w-0">
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#0F172A] leading-[1.16]"
              style={{ textWrap: 'balance' }}
            >
              Scale Faster with WooCommerce &amp; WordPress Hosting
            </h2>

            <ul className="mt-6 space-y-2.5 text-sm sm:text-[15px] text-slate-600">
              {highlights.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-[#0F172A] mt-2 shrink-0"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                type="button"
                onClick={onExploreWordPress}
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
              >
                Start for {formatPrice(2.5)}/mo
              </button>
            </div>
          </div>

          {/* Right Column: High-Resolution Product Illustration (Image-Style Overlapping Mockup) */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end min-w-0">
            <div
              aria-hidden="true"
              className="relative w-full max-w-[560px] h-[330px] sm:h-[420px] select-none pointer-events-none flex items-center justify-center"
            >
              <div className="relative w-[540px] h-[410px] origin-center scale-[0.62] sm:scale-[0.88] lg:scale-100 shrink-0">
                {/* 3 Soft Pastel Backdrop Circles */}
                <div className="absolute top-0 left-[110px] w-[240px] h-[240px] rounded-full bg-[#D7ECEE]" />
                <div className="absolute bottom-0 right-[18px] w-[245px] h-[245px] rounded-full bg-[#F4EFE0]" />
                <div className="absolute bottom-[18px] left-[16px] w-[105px] h-[105px] rounded-full bg-[#D3E2F1]" />

                {/* Back Bezel Window: Multi-Site StackCP WordPress Fleet */}
                <div className="absolute top-[26px] right-[18px] w-[392px] p-2.5 rounded-xl bg-[#EAECEF] shadow-[0_20px_48px_-14px_rgba(15,23,42,0.18)]">
                  <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden divide-y divide-[#F1F5F9]">
                    {FLEET_ROWS.map((row) => (
                      <div
                        key={row.domain}
                        className="px-3 py-2 flex items-center justify-between gap-2 text-[10px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-300 font-bold text-[10px] leading-none">
                            &rsaquo;
                          </span>
                          <span className="w-2.5 h-2.5 rounded-[2px] border border-slate-300 shrink-0" />
                          <span className="w-4 h-4 rounded-full bg-[#0E6B63]/12 text-[#0E6B63] font-bold text-[8px] flex items-center justify-center shrink-0">
                            W
                          </span>
                          <div className="min-w-0 leading-tight">
                            <div className="font-semibold text-[#0E6B63] truncate">
                              {row.domain}
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">
                              Accessible by: {row.owner}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-slate-500">
                            {row.plan}
                          </span>
                          <FlagBadge country={row.flag} />
                          {row.hasAdd ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#0E6B63] font-bold text-[8px]">
                              Add
                            </span>
                          ) : (
                            <span className="w-3 h-3 text-slate-400 text-[9px] flex items-center justify-center">
                              &#128274;
                            </span>
                          )}
                          <span className="w-3.5 h-3.5 rounded-[3px] bg-slate-100 border border-slate-200 text-slate-400 text-[9px] flex items-center justify-center">
                            +
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Front Overlapping Bezel Card: 3-Column WordPress Control Toolkit */}
                <div className="absolute bottom-[18px] left-[32px] w-[306px] p-2.5 rounded-2xl bg-[#EAECEF] shadow-[0_24px_56px_-12px_rgba(15,23,42,0.24)]">
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {toolkitTiles.map((tile) => (
                        <div
                          key={tile.label}
                          className="flex flex-col items-center justify-center text-center py-2.5 px-1.5 rounded-lg border border-[#E2E8F0] bg-white"
                        >
                          {tile.icon}
                          <span className="mt-1.5 text-[10px] font-semibold text-[#0F172A] leading-tight">
                            {tile.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
