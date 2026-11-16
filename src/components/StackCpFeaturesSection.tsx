import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StackCpFeaturesSectionProps {
  onViewFeatures: () => void;
  heading?: string;
  subheading?: string;
}

export const StackCpFeaturesSection: React.FC<StackCpFeaturesSectionProps> = ({
  onViewFeatures,
  heading,
  subheading,
}) => {
  const features = [
    {
      title: 'Autoscaling Cloud',
      description:
        'Host websites on true autoscaling cloud infrastructure at cpcloudhost.com, delivering instant burst capacity with no fixed limits on your growth.',
      artwork: (
        <svg
          viewBox="0 0 72 58"
          className="w-[72px] h-[58px] mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Cloud Body */}
          <path
            d="M21 47H50.5C56.299 47 61 42.299 61 36.5C61 31.119 56.952 26.684 51.737 26.071C50.092 18.027 42.981 12 34.45 12C24.702 12 16.8 19.902 16.8 29.65C16.8 30.119 16.818 30.583 16.854 31.043C12.999 31.766 10.1 35.148 10.1 39.2C10.1 43.508 13.592 47 17.9 47H21Z"
            fill="#0F172A"
          />
          {/* Subtle Teal Glow Highlight */}
          <path
            d="M24 44H49C53.418 44 57 40.418 57 36C57 31.922 53.949 28.556 50.005 28.063"
            stroke="#0E6B63"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* Diagonal Scaling Double-Arrow Above Left Wing */}
          <line
            x1="15"
            y1="21"
            x2="31"
            y2="8"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <polyline
            points="14,15 14,22 21,22"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="25,8 32,7.5 31.5,14.5"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: 'Global CDN',
      description:
        'Our global anycast CDN nodes at cpcloudhost.com deliver sub-second page speeds wherever your visitors connect from.',
      artwork: (
        <svg
          viewBox="0 0 72 58"
          className="w-[72px] h-[58px] mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Halftone Dotted Globe */}
          <circle cx="36" cy="29" r="20" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
          {/* Dotted Matrix Pattern */}
          {[
            [27, 15], [33, 13], [39, 13], [45, 15],
            [22, 20], [28, 19], [34, 18], [40, 18], [46, 19], [50, 21],
            [20, 26], [26, 25], [46, 25], [52, 26],
            [20, 32], [26, 33], [46, 33], [52, 32],
            [22, 38], [28, 39], [34, 40], [40, 40], [46, 39], [50, 37],
            [27, 43], [33, 45], [39, 45], [45, 43],
          ].map(([cx, cy], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="1.75"
              fill={idx % 3 === 0 ? '#0E6B63' : '#0F172A'}
              opacity={idx % 2 === 0 ? '0.88' : '0.65'}
            />
          ))}
          {/* Center CDN Pill Badge */}
          <rect x="20" y="21.5" width="32" height="15" rx="7.5" fill="#0F172A" />
          <text
            x="36"
            y="32"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="800"
            letterSpacing="0.8"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            CDN
          </text>
        </svg>
      ),
    },
    {
      title: 'Free SSL',
      description:
        "Every free SSL certificate is a 'wildcard' certificate, securing both your root domain and unlimited subdomains automatically.",
      artwork: (
        <svg
          viewBox="0 0 72 58"
          className="w-[72px] h-[58px] mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Lock Shackle */}
          <path
            d="M25 25V18.5C25 12.425 29.925 7.5 36 7.5C42.075 7.5 47 12.425 47 18.5V25"
            stroke="#0F172A"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          {/* Padlock Body */}
          <rect x="19" y="24" width="34" height="26" rx="4.5" fill="#0F172A" />
          {/* Top Accent Bar */}
          <rect x="23" y="27.5" width="26" height="2" rx="1" fill="#0E6B63" />
          {/* SSL Label */}
          <text
            x="36"
            y="42.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11.5"
            fontWeight="900"
            letterSpacing="1"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            SSL
          </text>
        </svg>
      ),
    },
    {
      title: 'Free Migrations',
      description:
        'Migrate website files, databases, and email accounts automatically. Transfer to cpcloudhost.com in minutes, not hours or days.',
      artwork: (
        <svg
          viewBox="0 0 78 58"
          className="w-[78px] h-[58px] mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Dedicated Server Tower */}
          <rect x="15" y="10" width="23" height="39" rx="3" fill="#0F172A" />
          <rect x="19" y="15" width="15" height="3.2" rx="1" fill="#FFFFFF" />
          <rect x="19" y="21" width="15" height="3.2" rx="1" fill="#FFFFFF" />
          <circle cx="22" cy="40.5" r="2.2" fill="#10B981" />
          <rect x="27" y="39" width="7" height="3" rx="1" fill="#334155" />
          {/* Bidirectional Sync Arrows Top-Right */}
          <path
            d="M46 11V21M46 11L42.5 14.5M46 11L49.5 14.5"
            stroke="#0E6B63"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M55 21V11M55 21L51.5 17.5M55 21L58.5 17.5"
            stroke="#0F172A"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cloud Transfer Node Overlapping Right */}
          <path
            d="M42.5 49H59.5C63.09 49 66 46.09 66 42.5C66 39.18 63.51 36.44 60.29 36.05C59.24 31.43 55.11 28 50.15 28C44.43 28 39.8 32.63 39.8 38.35C39.8 38.66 39.81 38.96 39.84 39.26C37.65 39.77 36 41.73 36 44.08C36 46.8 38.2 49 40.92 49H42.5Z"
            fill="#0F172A"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path
            d="M50 43V35.5M50 35.5L47 38.5M50 35.5L53 38.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: 'Three platforms',
      description:
        'Each dedicated sub-platform — WordPress, Cloud Linux, and Windows — is finely tuned for maximum performance.',
      artwork: (
        <svg
          viewBox="0 0 72 58"
          className="w-[72px] h-[58px] mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Top Center: WordPress Badge */}
          <circle cx="36" cy="17" r="10.5" fill="#21759B" />
          <circle cx="36" cy="17" r="8.5" stroke="#FFFFFF" strokeWidth="1.2" />
          <text
            x="36"
            y="21"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11.5"
            fontWeight="800"
            fontFamily="Georgia, serif"
          >
            W
          </text>
          {/* Bottom Left: Linux Tux Penguin Mark */}
          <g transform="translate(15, 31)">
            <ellipse cx="9" cy="13" rx="6.5" ry="8.5" fill="#0F172A" />
            <circle cx="9" cy="5.5" r="4.8" fill="#0F172A" />
            <ellipse cx="9" cy="13.5" rx="3.8" ry="5.5" fill="#FFFFFF" />
            <circle cx="7.4" cy="4.8" r="0.9" fill="#FFFFFF" />
            <circle cx="10.6" cy="4.8" r="0.9" fill="#FFFFFF" />
            <polygon points="7.5,6.8 10.5,6.8 9,8.8" fill="#F59E0B" />
            <ellipse cx="6.2" cy="21" rx="2.4" ry="1.3" fill="#F59E0B" />
            <ellipse cx="11.8" cy="21" rx="2.4" ry="1.3" fill="#F59E0B" />
          </g>
          {/* Bottom Right: Windows 4-Pane Flag */}
          <g transform="translate(39, 32)">
            <rect x="0" y="0" width="9" height="9" rx="1" fill="#00A4EF" />
            <rect x="11" y="0" width="9" height="9" rx="1" fill="#00A4EF" />
            <rect x="0" y="11" width="9" height="9" rx="1" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" rx="1" fill="#00A4EF" />
          </g>
        </svg>
      ),
    },
    {
      title: 'WordPress Manager',
      description:
        'Manage all your WordPress themes, plugins, and users from one central dashboard. Activate, update, and disable in bulk.',
      artwork: (
        <svg
          viewBox="0 0 72 58"
          className="w-[72px] h-[58px] mx-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer Gear Cog */}
          <g transform="translate(36, 29)">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <rect
                key={deg}
                x="-3.2"
                y="-23"
                width="6.4"
                height="6.5"
                rx="1.2"
                fill="#0F172A"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="18.5" fill="#0F172A" />
            <circle cx="0" cy="0" r="14.5" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="12.5" fill="#21759B" />
            <text
              x="0"
              y="5.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="16"
              fontWeight="800"
              fontFamily="Georgia, serif"
            >
              W
            </text>
          </g>
        </svg>
      ),
    },
  ];

  return (
    <section
      id="stackcp-features"
      className="bg-white border-b border-[#E2E8F0]"
    >
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
        {/* Centered StackCP® Brand Mark or Custom Headline & Subtitle */}
        <div className="text-center mb-14">
          {heading ? (
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mb-3"
              style={{ textWrap: 'balance' }}
            >
              {heading}
            </h2>
          ) : (
            <div className="inline-flex items-baseline justify-center mb-2.5">
              <span className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#0F172A]">
                StackCP
              </span>
              <span className="text-xs font-bold text-[#0F172A] ml-0.5 align-super">
                &reg;
              </span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {subheading ??
              'Autoscaling StackCP web hosting resources on cpcloudhost.com for blazing-fast speed, even under heavy load'}
          </p>
        </div>

        {/* 2x3 Centered Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 text-center">
          {features.map((item) => (
            <div key={item.title} className="flex flex-col items-center">
              <div className="mb-3.5">{item.artwork}</div>
              <h3 className="font-display text-sm sm:text-[15px] font-bold text-[#0F172A]">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2 max-w-[265px]">
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
    </section>
  );
};
