import React, { useId } from 'react';

export const FlagBadge: React.FC<{ country: 'uk' | 'us' | 'sg' }> = ({ country }) => {
  const uid = useId();
  const clipId = `flag-clip-${country}-${uid}`;

  if (country === 'uk') {
    return (
      <svg viewBox="0 0 36 24" className="w-8 h-5 rounded-[3px] shadow-xs shrink-0" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect width="36" height="24" rx="2" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="36" height="24" fill="#012169" />
          <path d="M0 0L36 24M36 0L0 24" stroke="#FFFFFF" strokeWidth="4.4" />
          <path d="M0 0L36 24M36 0L0 24" stroke="#C8102E" strokeWidth="2.2" />
          <path d="M18 0V24M0 12H36" stroke="#FFFFFF" strokeWidth="6.4" />
          <path d="M18 0V24M0 12H36" stroke="#C8102E" strokeWidth="3.6" />
        </g>
      </svg>
    );
  }

  if (country === 'us') {
    return (
      <svg viewBox="0 0 36 24" className="w-8 h-5 rounded-[3px] shadow-xs shrink-0" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect width="36" height="24" rx="2" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="36" height="24" fill="#FFFFFF" />
          {[0, 4, 8, 12, 16, 20].map((y) => (
            <rect key={y} x="0" y={y} width="36" height="2.1" fill="#B22234" />
          ))}
          <rect width="16" height="13" fill="#3C3B6E" />
          {[3, 6, 9].map((y) =>
            [3, 7, 11, 14].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.65" fill="#FFFFFF" />
            ))
          )}
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 36 24" className="w-8 h-5 rounded-[3px] shadow-xs shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect width="36" height="24" rx="2" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="36" height="12" fill="#EF3340" />
        <rect y="12" width="36" height="12" fill="#FFFFFF" />
        <circle cx="9.2" cy="6" r="4" fill="#FFFFFF" />
        <circle cx="10.8" cy="6" r="3.4" fill="#EF3340" />
        <circle cx="11.5" cy="4.2" r="0.7" fill="#FFFFFF" />
        <circle cx="13.5" cy="5.5" r="0.7" fill="#FFFFFF" />
        <circle cx="12.7" cy="7.7" r="0.7" fill="#FFFFFF" />
        <circle cx="10.2" cy="7.7" r="0.7" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const PlanResourceEmblem: React.FC<{
  kind: 'websites' | 'databases' | 'emails' | 'ssd';
}> = ({ kind }) => {
  if (kind === 'websites') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <rect x="2.5" y="4" width="19" height="16" rx="3" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.5" />
        <rect x="2.5" y="4" width="19" height="4.8" rx="2" fill="#0E6B63" />
        <circle cx="5.5" cy="6.4" r="0.8" fill="#FFFFFF" />
        <circle cx="8" cy="6.4" r="0.8" fill="#FFFFFF" />
        <rect x="5.5" y="11.5" width="6" height="5" rx="1" fill="#10B981" opacity="0.85" />
        <rect x="13" y="11.5" width="5.5" height="2" rx="0.8" fill="#64748B" />
        <rect x="13" y="14.5" width="4" height="2" rx="0.8" fill="#94A3B8" />
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
        <path d="M4.5 12C4.5 13.657 7.858 15 12 15C16.142 15 19.5 13.657 19.5 12" stroke="#94A3B8" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === 'emails') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" fill="#0E6B63" />
        <path d="M3.5 6.5L12 13L20.5 6.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

export const CoreFeatureEmblem: React.FC<{
  id: 'migrations' | 'backup' | 'speed' | 'security' | 'cdn' | 'ddos';
}> = ({ id }) => {
  switch (id) {
    case 'migrations':
      return (
        <svg viewBox="0 0 72 56" className="w-16 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="8" y="11" width="18" height="34" rx="3" fill="#0F172A" />
          <rect x="12" y="16" width="10" height="2.5" rx="1" fill="#38BDF8" />
          <rect x="12" y="21" width="10" height="2.5" rx="1" fill="#94A3B8" />
          <circle cx="17" cy="39" r="2" fill="#10B981" />
          <rect x="46" y="11" width="18" height="34" rx="3" fill="#0E6B63" />
          <rect x="50" y="16" width="10" height="2.5" rx="1" fill="#FFFFFF" />
          <rect x="50" y="21" width="10" height="2.5" rx="1" fill="#A7F3D0" />
          <circle cx="55" cy="39" r="2" fill="#FFFFFF" />
          <path d="M30 23H42M42 23L38.5 19.5M42 23L38.5 26.5" stroke="#0F172A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 33H30M30 33L33.5 29.5M30 33L33.5 36.5" stroke="#0E6B63" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'backup':
      return (
        <svg viewBox="0 0 72 56" className="w-16 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="36" cy="28" r="19" fill="#0F172A" />
          <path d="M36 9C46.493 9 55 17.507 55 28C55 38.493 46.493 47 36 47C25.507 47 17 38.493 17 28" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
          <circle cx="36" cy="28" r="10.5" fill="#1E293B" />
          <path d="M36 21V28.5L41 31.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="15,24 21,29 14,32" fill="#10B981" />
        </svg>
      );
    case 'speed':
      return (
        <svg viewBox="0 0 72 56" className="w-16 h-12 mx-auto" fill="none" aria-hidden="true">
          <path d="M14 40A22 22 0 1 1 58 40" stroke="#0F172A" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M14 40A22 22 0 0 1 48 21" stroke="#0E6B63" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="36" cy="36" r="4.5" fill="#0F172A" />
          <path d="M36 36L49 21" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
          <rect x="26" y="45" width="20" height="4" rx="2" fill="#10B981" />
        </svg>
      );
    case 'security':
      return (
        <svg viewBox="0 0 72 56" className="w-16 h-12 mx-auto" fill="none" aria-hidden="true">
          <path d="M36 7L54 14V27C54 38.5 46.2 47.4 36 50C25.8 47.4 18 38.5 18 27V14L36 7Z" fill="#0F172A" />
          <path d="M36 12L49 17.2V26.8C49 35.6 43.3 42.5 36 44.6C28.7 42.5 23 35.6 23 26.8V17.2L36 12Z" fill="#0E6B63" />
          <rect x="29" y="26" width="14" height="11" rx="2.2" fill="#FFFFFF" />
          <path d="M32 26V23C32 20.8 33.8 19 36 19C38.2 19 40 20.8 40 23V26" stroke="#FFFFFF" strokeWidth="2.3" />
          <circle cx="36" cy="31.5" r="1.5" fill="#0F172A" />
        </svg>
      );
    case 'cdn':
      return (
        <svg viewBox="0 0 72 56" className="w-16 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="36" cy="28" r="19" fill="#0F172A" />
          <ellipse cx="36" cy="28" rx="9" ry="18.5" stroke="#10B981" strokeWidth="1.7" />
          <line x1="17.5" y1="28" x2="54.5" y2="28" stroke="#10B981" strokeWidth="1.7" />
          <rect x="20" y="21" width="32" height="14" rx="7" fill="#0E6B63" stroke="#FFFFFF" strokeWidth="1.4" />
          <text
            x="36"
            y="31"
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
    case 'ddos':
      return (
        <svg viewBox="0 0 72 56" className="w-16 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="13" y="12" width="46" height="32" rx="6" fill="#0F172A" />
          <rect x="17" y="16" width="38" height="24" rx="3.5" fill="#1E293B" />
          <path d="M23 33L29 25L35 29L43 20L49 23" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="49" cy="23" r="3" fill="#F59E0B" />
          <text
            x="36"
            y="38"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.5"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            1+ TBPS WAF
          </text>
        </svg>
      );
  }
};

export const AppBrandArtwork: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case 'wordpress':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="23" fill="#21759B" />
          <circle cx="28" cy="28" r="18.5" stroke="#FFFFFF" strokeWidth="2.2" />
          <text x="28" y="35.5" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="800" fontFamily="Georgia, serif">
            W
          </text>
        </svg>
      );
    case 'moodle':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="28" cy="30" r="20" fill="#FFF7ED" />
          <path d="M13 38V26C13 21.5 16.5 18 20.5 18C23.5 18 26 19.8 27 22C28 19.8 30.5 18 33.5 18C37.5 18 41 21.5 41 26V38H35.5V27C35.5 24.8 34 23 32 23C30 23 28.5 24.8 28.5 27V38H24.5V27C24.5 24.8 23 23 21 23C19 23 17.5 24.8 17.5 27V38H13Z" fill="#F98012" />
          <polygon points="8,17 19,12 29,17 19,21.5" fill="#1E293B" />
          <line x1="11" y1="18.5" x2="11" y2="25" stroke="#1E293B" strokeWidth="2" />
        </svg>
      );
    case 'roundcube':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <polygon points="28,10 47,20 28,30 9,20" fill="#37BEFF" />
          <polygon points="9,20 28,30 28,47 9,37" fill="#1B6CA8" />
          <polygon points="47,20 47,37 28,47 28,30" fill="#475569" />
          <circle cx="28" cy="20" r="5" fill="#FFFFFF" opacity="0.9" />
        </svg>
      );
    case 'piwigo':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="40" height="40" rx="10" fill="#FF7700" />
          <circle cx="28" cy="29" r="10.5" stroke="#FFFFFF" strokeWidth="3.2" />
          <circle cx="28" cy="29" r="4.2" fill="#FFFFFF" />
          <circle cx="38" cy="18" r="2.2" fill="#FFFFFF" />
        </svg>
      );
    case 'suitecrm':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="40" height="40" rx="8" fill="#4B2840" />
          <polygon points="28,13 42,28 28,43 14,28" fill="#F08377" />
          <text x="28" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            SUITE
          </text>
        </svg>
      );
    case 'sugarcrm':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <polygon points="28,8 46,18.5 46,37.5 28,48 10,37.5 10,18.5" fill="#111827" />
          <polygon points="28,8 46,18.5 28,28 10,18.5" fill="#374151" />
          <polygon points="28,28 46,18.5 46,37.5 28,48" fill="#E61718" />
          <text x="20" y="34" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">
            S
          </text>
        </svg>
      );
    case 'magento':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <polygon points="28,7 47,18 47,38 41.5,41.2 41.5,21.2 28,13.4 14.5,21.2 14.5,41.2 9,38 9,18" fill="#EE672F" />
          <polygon points="31.5,22 31.5,45 28,47 24.5,45 24.5,22 28,20" fill="#EE672F" />
        </svg>
      );
    case 'zencart':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="20" fill="#E6F4EA" stroke="#28A745" strokeWidth="3.5" />
          <path d="M15 24C21 15 35 15 41 25C36 33 23 36 16 32" stroke="#1E7E34" strokeWidth="4.2" strokeLinecap="round" />
          <circle cx="28" cy="28" r="4.5" fill="#F59E0B" />
        </svg>
      );
    case 'osticket':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <path d="M12 12H44C47 12 49 14 49 17V35C49 38 47 40 44 40H26L15 47V40H12C9 40 7 38 7 35V17C7 14 9 12 12 12Z" fill="#FF8C24" />
          <path d="M19 26L25 32L37 19" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'phpbb':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <path d="M8 14C8 11 10.5 9 13.5 9H42.5C45.5 9 48 11 48 14V34C48 37 45.5 39 42.5 39H23L13 46V39H13.5C10.5 39 8 37 8 34V14Z" fill="#236CB2" />
          <text x="28" y="29" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontStyle="italic" fontFamily="Plus Jakarta Sans, sans-serif">
            phpBB
          </text>
        </svg>
      );
    case 'phpform':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <ellipse cx="28" cy="28" rx="22" ry="14" fill="#6366F1" stroke="#312E81" strokeWidth="2.5" />
          <text x="28" y="33" textAnchor="middle" fill="#FFFFFF" fontSize="14.5" fontWeight="900" fontStyle="italic" fontFamily="Plus Jakarta Sans, sans-serif">
            php
          </text>
        </svg>
      );
    case 'abantecart':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="20" fill="#EFF6FF" />
          <path d="M13 17H19L23 34H40L44 21H21" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="40" r="3" fill="#EA580C" />
          <circle cx="38" cy="40" r="3" fill="#EA580C" />
        </svg>
      );
    case 'concrete':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="40" height="40" rx="10" fill="#0EA5E9" />
          <text x="28" y="35" textAnchor="middle" fill="#FFFFFF" fontSize="19" fontWeight="900" fontFamily="Plus Jakarta Sans, sans-serif">
            C5
          </text>
        </svg>
      );
    case 'oscommerce':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="20" fill="#0F172A" />
          <path d="M14 29C17 21 26 19 32 25C37 30 41 27 42 22" stroke="#10B981" strokeWidth="3.8" strokeLinecap="round" />
          <circle cx="28" cy="28" r="4" fill="#38BDF8" />
        </svg>
      );
    case 'fengoffice':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="40" height="40" rx="10" fill="#F59E0B" />
          <path d="M18 37V19H37" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 28H32" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
        </svg>
      );
    case 'buddypress':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="20" fill="#D97706" />
          <circle cx="22" cy="24" r="4" fill="#FFFFFF" />
          <circle cx="34" cy="24" r="4" fill="#FFFFFF" />
          <path d="M15 37C16.5 32 27.5 32 29 37M27 37C28.5 32 39.5 32 41 37" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );
    case 'formtools':
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <rect x="12" y="9" width="32" height="38" rx="5" fill="#0D9488" />
          <rect x="18" y="17" width="20" height="4" rx="1.5" fill="#FFFFFF" />
          <rect x="18" y="25" width="20" height="4" rx="1.5" fill="#FFFFFF" />
          <rect x="18" y="33" width="13" height="4" rx="1.5" fill="#A7F3D0" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 56 56" className="w-12 h-12 mx-auto" fill="none" aria-hidden="true">
          <path d="M11 13H45C47.8 13 50 15.2 50 18V35C50 37.8 47.8 40 45 40H26L15 47V40H11C8.2 40 6 37.8 6 35V18C6 15.2 8.2 13 11 13Z" fill="#0291D5" />
          <text x="28" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="11.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            vanilla
          </text>
        </svg>
      );
  }
};
