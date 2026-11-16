import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface CpanelFeaturesSectionProps {
  onViewFeatures: () => void;
  onGetStarted: () => void;
}

export const CpanelFeaturesSection: React.FC<CpanelFeaturesSectionProps> = ({
  onViewFeatures,
  onGetStarted,
}) => {
  const { formatPrice } = useCurrency();
  const features = [
    {
      title: 'cPanel with CloudLinux',
      description:
        'Up to 4GB RAM per cPanel account with CloudLinux, which lets you run PHP versions from PHP 5.6 all the way to PHP 8.4!',
      badge: (
        <svg
          viewBox="0 0 64 56"
          className="w-14 h-12 mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* CloudLinux Vortex Swirl Emblem */}
          <g transform="translate(32,28)">
            <circle cx="0" cy="0" r="19" fill="#0F172A" />
            <circle cx="0" cy="0" r="9.5" fill="#FFFFFF" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <path
                key={deg}
                d="M2 -18 C11 -17 17 -10 18 -2 L10 -3 C9 -8 5 -11 0 -11 Z"
                fill="#FFFFFF"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="5" fill="#0F172A" />
          </g>
        </svg>
      ),
    },
    {
      title: 'Jetbackup Included',
      description:
        'Unlimited browse, restore and download backups by using the JetBackup tool right inside your cpcloudhost.com cPanel control panel.',
      badge: (
        <svg
          viewBox="0 0 96 56"
          className="w-24 h-12 mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* JetBackup Emblem: Clean Speed-Wing + Bold Italic Wordmark */}
          <path d="M16 17 L27 17 L25.5 20 L14.5 20 Z" fill="#0F172A" />
          <path d="M19 22 L26 22 L24.5 25 L17.5 25 Z" fill="#0F172A" />
          <text
            x="53"
            y="25"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="18"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-0.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Jet
          </text>
          <path
            d="M22 29 L74 29"
            stroke="#0F172A"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x="48"
            y="43"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="12"
            fontWeight="800"
            fontStyle="italic"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Backup
          </text>
        </svg>
      ),
    },
    {
      title: 'NVMe SSD',
      description:
        'We run the latest enterprise cloud servers, with high-performance NVMe disks. Because we are 100% cloud, cpcloudhost.com upgrades hardware without disruption.',
      badge: (
        <svg
          viewBox="0 0 68 56"
          className="w-16 h-12 mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Solid Dark NVMe SSD Drive Module */}
          <rect x="10" y="10" width="48" height="30" rx="4" fill="#0F172A" />
          <text
            x="34"
            y="29"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="800"
            letterSpacing="0.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            NVMe
          </text>
          {/* Gold Contact Pins */}
          <rect x="16" y="40" width="5" height="5" rx="1" fill="#0F172A" />
          <rect x="24" y="40" width="5" height="5" rx="1" fill="#0F172A" />
          <rect x="32" y="40" width="5" height="5" rx="1" fill="#0F172A" />
          <rect x="40" y="40" width="5" height="5" rx="1" fill="#0F172A" />
          <rect x="48" y="40" width="4" height="5" rx="1" fill="#0F172A" />
        </svg>
      ),
    },
    {
      title: 'Imunify360',
      description:
        'Imunify360 malware protection is included as standard on all systems. This scans for malware continuously and can auto-fix.',
      badge: (
        <svg
          viewBox="0 0 64 56"
          className="w-14 h-12 mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Imunify360 8-Blade Security Starburst */}
          <g transform="translate(32,28)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <polygon
                key={deg}
                points="0,-21 5,-9 10,-12 7,-3"
                fill="#0F172A"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="6.5" fill="#FFFFFF" />
          </g>
        </svg>
      ),
    },
    {
      title: 'PCI compliance',
      description:
        'Our cPanel web hosting at cpcloudhost.com is fully PCI compliant, and our systems engineers will help you pass your compliance tests.',
      badge: (
        <svg
          viewBox="0 0 72 56"
          className="w-16 h-12 mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* PCI DSS Compliance Badge */}
          <text
            x="24"
            y="26"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="16"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            PCI
          </text>
          <path
            d="M39 22 L44 27 L56 12"
            stroke="#0F172A"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="38"
            y="41"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="11"
            fontWeight="800"
            letterSpacing="1"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            DSS
          </text>
        </svg>
      ),
    },
    {
      title: 'Spam protection',
      description:
        'We run advanced spam scanning systems on both outbound and inbound mail, stopping spam from coming in while protecting your mail reputation.',
      badge: (
        <svg
          viewBox="0 0 64 56"
          className="w-14 h-12 mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* No-Spam Prohibition Badge */}
          <circle
            cx="32"
            cy="20"
            r="11.5"
            stroke="#0F172A"
            strokeWidth="3.2"
          />
          <line
            x1="24"
            y1="12"
            x2="40"
            y2="28"
            stroke="#0F172A"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <text
            x="32"
            y="45"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="10.5"
            fontWeight="900"
            letterSpacing="0.8"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            SPAM
          </text>
        </svg>
      ),
    },
  ];

  return (
    <section id="cpanel-stack" className="bg-white border-b border-[#E2E8F0]">
      {/* Upper White Container: cPanel Logo + 2x3 Feature Grid */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
        {/* Centered cPanel Wordmark & Subtitle */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center mb-2">
            <span className="font-display text-2xl sm:text-[26px] font-extrabold italic tracking-tight text-[#0F172A]">
              cPanel
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Classic cPanel hosting on cpcloudhost.com with 4GB RAM, NVMe SSD
            &amp; Imunify360
          </p>
        </div>

        {/* 2x3 Centered Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 text-center">
          {features.map((item) => (
            <div key={item.title} className="flex flex-col items-center">
              <div className="mb-3">{item.badge}</div>
              <h3 className="font-display text-sm sm:text-[15px] font-bold text-[#0F172A]">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2 max-w-[260px]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Right-Aligned View All Features Link */}
        <div className="mt-10 flex justify-end">
          <button
            type="button"
            onClick={onViewFeatures}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors cursor-pointer"
          >
            <span>View All Features</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Bottom Mint-Teal Banner Strip */}
      <div className="bg-[#DFECEB] border-t border-[#CDE0DF] py-8">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F172A]">
              Unlimited cPanel Web Hosting
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Unlimited cPanel Web Hosting from {formatPrice(14.99)}/mo &middot;
              Free SSL &middot; Free Migration &middot; 30-Day Guarantee
            </p>
          </div>

          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
};
