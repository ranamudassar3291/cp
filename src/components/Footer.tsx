import React from 'react';
import { usePlatform } from '../context/PlatformContext';

interface FooterProps {
  onNavigateSection: (selector: string) => void;
  onNavigatePath?: (path: string) => void;
  onOpenSharedHosting?: () => void;
  onOpenWordPressHosting?: () => void;
  onOpenWindowsHosting?: () => void;
  onOpenFreeTrial?: () => void;
  onOpenVpsHosting?: () => void;
  onOpenN8nHosting?: () => void;
  onOpenDomainRegistration?: () => void;
  onOpenDomainTransfer?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenAboutUs?: () => void;
  onOpenMigrationFree?: () => void;
  onOpenCpanelHosting?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenOrderTerms?: () => void;
  onOpenRefundPolicy?: () => void;
  onOpenAbusePolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  onNavigatePath,
  onOpenSharedHosting,
  onOpenWordPressHosting,
  onOpenWindowsHosting,
  onOpenFreeTrial,
  onOpenVpsHosting,
  onOpenN8nHosting,
  onOpenDomainRegistration,
  onOpenDomainTransfer,
  onOpenKnowledgeBase,
  onOpenAboutUs,
  onOpenMigrationFree,
  onOpenCpanelHosting,
  onOpenTerms,
  onOpenPrivacy,
  onOpenOrderTerms,
  onOpenRefundPolicy,
  onOpenAbusePolicy,
}) => {
  const { cmsSiteSettings, cmsPages } = usePlatform();
  const customFooterPages = cmsPages.filter(
    (p) => !p.isSystemPage && p.status === 'published' && p.showInFooter
  );

  return (
    <footer
      id="footer"
      className="bg-[#0F172A] text-slate-300 py-14 border-t border-slate-800"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* 5-Column Enterprise Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: cpcloudhost.com Brand */}
          <div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateSection('#top');
              }}
              className="inline-flex items-center gap-2.5 text-white"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect width="30" height="30" rx="7" fill="#0E6B63" />
                <path
                  d="M9.2 18.2H20.8C22.1807 18.2 23.3 17.0807 23.3 15.7C23.3 14.4327 22.357 13.3855 21.1329 13.2215C20.7423 10.9367 18.7526 9.2 16.35 9.2C13.6714 9.2 11.5 11.3714 11.5 14.05C11.5 14.191 11.506 14.3307 11.5178 14.4688C9.69915 14.6225 8.3 16.1465 8.3 18C8.3 18.0674 8.30185 18.1343 8.3055 18.2H9.2Z"
                  fill="white"
                />
                <rect
                  x="8.8"
                  y="20.4"
                  width="12.4"
                  height="1.8"
                  rx="0.9"
                  fill="#10B981"
                />
              </svg>
              <span className="font-display text-base font-bold tracking-tight text-white">
                cpcloudhost.com
              </span>
            </a>

            <p className="text-xs sm:text-sm text-slate-400 mt-3.5 leading-relaxed">
              {cmsSiteSettings.footerTagline ||
                'Enterprise StackCP, cPanel, KVM VPS, n8n, and cloud web hosting engineered for 99.99% uptime across worldwide datacentres.'}
            </p>
          </div>

          {/* Column 2: Web Hosting */}
          <div>
            <h3 className="font-display text-xs font-bold tracking-wide text-white mb-4">
              Web Hosting
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="/shared-hosting"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenSharedHosting) onOpenSharedHosting();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Shared Web Hosting
                </a>
              </li>
              <li>
                <a
                  href="/wordpress-hosting"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenWordPressHosting) onOpenWordPressHosting();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Managed WordPress
                </a>
              </li>
              <li>
                <a
                  href="/windows-hosting"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenWindowsHosting) onOpenWindowsHosting();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Windows Web Hosting
                </a>
              </li>
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Reseller Program
                </a>
              </li>
              <li>
                <a
                  href="/cpanel-hosting"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenCpanelHosting) onOpenCpanelHosting();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  cPanel Web Hosting
                </a>
              </li>
              <li>
                <a
                  href="/free-trial"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenFreeTrial) onOpenFreeTrial();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  30-Day Free Trial
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Cloud & VPS */}
          <div>
            <h3 className="font-display text-xs font-bold tracking-wide text-white mb-4">
              Cloud &amp; VPS
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="/vps-hosting"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenVpsHosting) onOpenVpsHosting();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Unmanaged VPS
                </a>
              </li>
              <li>
                <a
                  href="/n8n-hosting"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenN8nHosting) onOpenN8nHosting();
                    else onNavigateSection('#services');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  n8n Hosting
                </a>
              </li>
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateSection('#infrastructure');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Global Data Centers
                </a>
              </li>
              <li>
                <a
                  href="/migration-free"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenMigrationFree) onOpenMigrationFree();
                    else onNavigateSection('#migrations');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Unlimited Migrations
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Domains */}
          <div>
            <h3 className="font-display text-xs font-bold tracking-wide text-white mb-4">
              Domains
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="/domain-registration"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenDomainRegistration) onOpenDomainRegistration();
                    else onNavigateSection('#domain-search');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Domain Search
                </a>
              </li>
              <li>
                <a
                  href="/domain-transfer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenDomainTransfer) onOpenDomainTransfer();
                    else onNavigateSection('#domain-search');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Domain Transfer
                </a>
              </li>
              <li>
                <a
                  href="/domain-registration"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenDomainRegistration) onOpenDomainRegistration();
                    else onNavigateSection('#domain-search');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Free WHOIS Privacy
                </a>
              </li>
              <li>
                <a
                  href="/domain-registration"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenDomainRegistration) onOpenDomainRegistration();
                    else onNavigateSection('#domain-search');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Free Wildcard SSL
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Support & Legal */}
          <div>
            <h3 className="font-display text-xs font-bold tracking-wide text-white mb-4">
              Support &amp; Legal
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="/knowledge-base"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenKnowledgeBase) onOpenKnowledgeBase();
                    else onNavigateSection('#top');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Knowledge Base
                </a>
              </li>
              <li>
                <a
                  href="/about-us"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenAboutUs) onOpenAboutUs();
                    else onNavigateSection('#infrastructure');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/migration-free"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenMigrationFree) onOpenMigrationFree();
                    else onNavigateSection('#migrations');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Switch Credits
                </a>
              </li>
              <li>
                <a
                  href="/terms-conditions"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenTerms) onOpenTerms();
                    else onNavigateSection('#footer');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenPrivacy) onOpenPrivacy();
                    else onNavigateSection('#footer');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/order-terms"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenOrderTerms) onOpenOrderTerms();
                    else onNavigateSection('#footer');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Order Terms
                </a>
              </li>
              <li>
                <a
                  href="/refund-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenRefundPolicy) onOpenRefundPolicy();
                    else onNavigateSection('#footer');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="/abuse-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenAbusePolicy) onOpenAbusePolicy();
                    else onNavigateSection('#footer');
                  }}
                  className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                >
                  Report Abuse
                </a>
              </li>
              {customFooterPages.map((cp) => (
                <li key={cp.id}>
                  <a
                    href={cp.slug}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePath?.(cp.slug);
                    }}
                    className="hover:text-[#10B981] transition-colors cursor-pointer text-left inline-block"
                  >
                    {cp.navTitle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <p>{cmsSiteSettings.footerCopyright || '© 2026 cpcloudhost.com. All rights reserved.'}</p>
          <div className="flex flex-wrap items-center gap-5">
            <span>99.99% Uptime SLA</span>
            <span aria-hidden="true">·</span>
            <span>30-Day Money-Back Guarantee</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('cpcloud:open-cookie-settings'));
                }
              }}
              className="hover:text-[#10B981] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cookie Settings
            </button>
            <span aria-hidden="true">·</span>
            <span>{cmsSiteSettings.supportEmail || 'support@cpcloudhost.com'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
