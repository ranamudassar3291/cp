import React from 'react';

export const WpPlanResourceEmblem: React.FC<{
  kind: 'wp-sites' | 'databases' | 'emails' | 'ssd';
}> = ({ kind }) => {
  if (kind === 'wp-sites') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" fill="#21759B" />
        <circle cx="12" cy="12" r="7.5" stroke="#FFFFFF" strokeWidth="1.2" />
        <text
          x="12"
          y="15.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="800"
          fontFamily="Georgia, serif"
        >
          W
        </text>
      </svg>
    );
  }
  if (kind === 'databases') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="6.5" rx="7.5" ry="3" fill="#0E6B63" />
        <path
          d="M4.5 6.5V17.5C4.5 19.157 7.858 20.5 12 20.5C16.142 20.5 19.5 19.157 19.5 17.5V6.5"
          fill="#0F172A"
        />
        <ellipse cx="12" cy="6.5" rx="7.5" ry="3" fill="#10B981" />
        <path
          d="M4.5 12C4.5 13.657 7.858 15 12 15C16.142 15 19.5 13.657 19.5 12"
          stroke="#94A3B8"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  if (kind === 'emails') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" fill="#0E6B63" />
        <path
          d="M3.5 6.5L12 13L20.5 6.5"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18.5" cy="7" r="3" fill="#F59E0B" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="12.5" rx="2.5" fill="#0F172A" />
      <rect x="6" y="7.5" width="12" height="5.5" rx="1" fill="#0E6B63" />
      <rect x="5" y="17" width="3" height="2.5" rx="0.6" fill="#F59E0B" />
      <rect x="10.5" y="17" width="3" height="2.5" rx="0.6" fill="#F59E0B" />
      <rect x="16" y="17" width="3" height="2.5" rx="0.6" fill="#F59E0B" />
    </svg>
  );
};

export const WordPressFeatureArtwork: React.FC<{
  id: 'staging' | 'manager' | 'updates' | 'cli' | 'checksum' | 'stackcache';
}> = ({ id }) => {
  switch (id) {
    case 'staging':
      return (
        <svg viewBox="0 0 76 58" className="w-[72px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="36" height="26" rx="3.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <rect x="8" y="8" width="36" height="6.5" rx="2.5" fill="#0F172A" />
          <circle cx="13" cy="11.2" r="1" fill="#FFFFFF" />
          <circle cx="16.5" cy="11.2" r="1" fill="#FFFFFF" />
          <rect x="13" y="18.5" width="16" height="3.2" rx="1" fill="#CBD5E1" />
          <rect x="13" y="24.5" width="12" height="3.2" rx="1" fill="#E2E8F0" />
          <rect x="32" y="22" width="36" height="26" rx="3.5" fill="#ECFDF5" stroke="#0E6B63" strokeWidth="2.2" />
          <rect x="32" y="22" width="36" height="6.5" rx="2.5" fill="#0E6B63" />
          <circle cx="37" cy="25.2" r="1" fill="#FFFFFF" />
          <circle cx="40.5" cy="25.2" r="1" fill="#FFFFFF" />
          <path d="M44 38.5L48.5 42.5L57 33.5" stroke="#0E6B63" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'manager':
      return (
        <svg viewBox="0 0 76 58" className="w-[72px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <circle cx="32" cy="27" r="15.5" fill="#21759B" />
          <circle cx="32" cy="27" r="12.5" stroke="#FFFFFF" strokeWidth="1.6" />
          <text
            x="32"
            y="32"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="15.5"
            fontWeight="800"
            fontFamily="Georgia, serif"
          >
            W
          </text>
          {/* Floating Fleet Control Sliders Badge */}
          <rect x="40" y="28" width="24" height="20" rx="5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="45" y1="35" x2="59" y2="35" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="55" cy="35" r="2.2" fill="#FFFFFF" />
          <line x1="45" y1="41.5" x2="59" y2="41.5" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="49" cy="41.5" r="2.2" fill="#FFFFFF" />
        </svg>
      );
    case 'updates':
      return (
        <svg viewBox="0 0 76 58" className="w-[72px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <circle cx="38" cy="29" r="18" fill="#F0FDF4" stroke="#0E6B63" strokeWidth="3.5" strokeDasharray="34 10" />
          <polygon points="54,18 59,25 50,25" fill="#0E6B63" />
          <polygon points="22,40 17,33 26,33" fill="#0E6B63" />
          <circle cx="38" cy="29" r="9.5" fill="#0F172A" />
          <path d="M33.5 29L36.8 32.3L43 25.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cli':
      return (
        <svg viewBox="0 0 76 58" className="w-[72px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <rect x="11" y="10" width="54" height="38" rx="6" fill="#0F172A" />
          <rect x="11" y="10" width="54" height="9" rx="4" fill="#1E293B" />
          <circle cx="17" cy="14.5" r="1.5" fill="#EF4444" />
          <circle cx="22" cy="14.5" r="1.5" fill="#F59E0B" />
          <circle cx="27" cy="14.5" r="1.5" fill="#10B981" />
          <text
            x="21"
            y="36"
            fill="#FFFFFF"
            fontSize="14.5"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            WP
          </text>
          <text
            x="45"
            y="36"
            fill="#10B981"
            fontSize="14"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            $_
          </text>
        </svg>
      );
    case 'checksum':
      return (
        <svg viewBox="0 0 76 58" className="w-[72px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <rect x="18" y="8" width="32" height="40" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
          <text
            x="34"
            y="24"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="9"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            01010
          </text>
          <text
            x="34"
            y="34"
            textAnchor="middle"
            fill="#0E6B63"
            fontSize="9"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            10011
          </text>
          <circle cx="48" cy="37" r="10.5" fill="#0E6B63" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M43.5 37L46.8 40.3L52.5 34" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'stackcache':
      return (
        <svg viewBox="0 0 76 58" className="w-[72px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <circle cx="38" cy="29" r="19.5" fill="#0F172A" />
          <ellipse cx="38" cy="29" rx="9" ry="19" stroke="#10B981" strokeWidth="1.6" />
          <line x1="19" y1="29" x2="57" y2="29" stroke="#10B981" strokeWidth="1.6" />
          <rect x="21" y="21.5" width="34" height="15" rx="7.5" fill="#0E6B63" stroke="#FFFFFF" strokeWidth="1.5" />
          <text
            x="38"
            y="32"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="800"
            letterSpacing="0.8"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            CDN
          </text>
        </svg>
      );
  }
};
