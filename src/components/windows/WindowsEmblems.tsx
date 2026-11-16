import React from 'react';

export const WinPlanResourceEmblem: React.FC<{
  kind: 'win-sites' | 'databases' | 'emails' | 'ssd';
}> = ({ kind }) => {
  if (kind === 'win-sites') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <rect x="3" y="3.5" width="8" height="8" rx="1.2" fill="#0284C7" />
        <rect x="13" y="3.5" width="8" height="8" rx="1.2" fill="#0E6B63" />
        <rect x="3" y="13.5" width="8" height="8" rx="1.2" fill="#0E6B63" />
        <rect x="13" y="13.5" width="8" height="8" rx="1.2" fill="#0284C7" />
      </svg>
    );
  }
  if (kind === 'databases') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="6.5" rx="7.5" ry="3" fill="#0284C7" />
        <path
          d="M4.5 6.5V17.5C4.5 19.157 7.858 20.5 12 20.5C16.142 20.5 19.5 19.157 19.5 17.5V6.5"
          fill="#0F172A"
        />
        <ellipse cx="12" cy="6.5" rx="7.5" ry="3" fill="#38BDF8" />
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
      <rect x="6" y="7.5" width="12" height="5.5" rx="1" fill="#0284C7" />
      <rect x="5" y="17" width="3" height="2.5" rx="0.6" fill="#F59E0B" />
      <rect x="10.5" y="17" width="3" height="2.5" rx="0.6" fill="#F59E0B" />
      <rect x="16" y="17" width="3" height="2.5" rx="0.6" fill="#F59E0B" />
    </svg>
  );
};

export const WinCoreArtwork: React.FC<{
  id: 'migrations' | 'backups' | 'dotnet' | 'security' | 'cdn' | 'ddos';
}> = ({ id }) => {
  switch (id) {
    case 'migrations':
      return (
        <svg viewBox="0 0 74 58" className="w-[70px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <rect x="9" y="11" width="19" height="35" rx="3" fill="#0F172A" />
          <rect x="13" y="16" width="11" height="2.8" rx="1" fill="#38BDF8" />
          <rect x="13" y="21.5" width="11" height="2.8" rx="1" fill="#94A3B8" />
          <circle cx="18.5" cy="39.5" r="2.2" fill="#10B981" />
          <rect x="46" y="11" width="19" height="35" rx="3" fill="#0284C7" />
          <rect x="50" y="16" width="11" height="2.8" rx="1" fill="#FFFFFF" />
          <rect x="50" y="21.5" width="11" height="2.8" rx="1" fill="#BAE6FD" />
          <circle cx="55.5" cy="39.5" r="2.2" fill="#FFFFFF" />
          <path d="M31 24H43M43 24L39.5 20.5M43 24L39.5 27.5" stroke="#0F172A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M43 34H31M31 34L34.5 30.5M31 34L34.5 37.5" stroke="#0E6B63" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'backups':
      return (
        <svg viewBox="0 0 74 58" className="w-[70px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <circle cx="37" cy="29" r="19" fill="#0F172A" />
          <path d="M37 10A19 19 0 1 1 18 29" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
          <circle cx="37" cy="29" r="10.5" fill="#1E293B" />
          <path d="M37 22V29.5L42.5 32.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="15,24 22,29 14,33" fill="#0284C7" />
        </svg>
      );
    case 'dotnet':
      return (
        <svg viewBox="0 0 74 58" className="w-[70px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <rect x="12" y="11" width="50" height="36" rx="7" fill="#512BD4" />
          <rect x="16" y="15" width="42" height="28" rx="4.5" fill="#0F172A" />
          <text
            x="37"
            y="34"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="14.5"
            fontWeight="900"
            letterSpacing="0.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            .NET
          </text>
          <circle cx="51" cy="21" r="2.2" fill="#10B981" />
        </svg>
      );
    case 'security':
      return (
        <svg viewBox="0 0 74 58" className="w-[70px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <path d="M37 7L55 14V27.5C55 39 47.2 48 37 50.5C26.8 48 19 39 19 27.5V14L37 7Z" fill="#0F172A" />
          <path d="M37 12L50 17.2V27C50 36 44.3 42.8 37 45C29.7 42.8 24 36 24 27V17.2L37 12Z" fill="#0E6B63" />
          <rect x="30" y="26.5" width="14" height="11" rx="2.2" fill="#FFFFFF" />
          <path d="M33 26.5V23.5C33 21.3 34.8 19.5 37 19.5C39.2 19.5 41 21.3 41 23.5V26.5" stroke="#FFFFFF" strokeWidth="2.3" />
          <circle cx="37" cy="32" r="1.5" fill="#0F172A" />
        </svg>
      );
    case 'cdn':
      return (
        <svg viewBox="0 0 74 58" className="w-[70px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <circle cx="37" cy="29" r="19.5" fill="#0F172A" />
          <ellipse cx="37" cy="29" rx="9" ry="19" stroke="#38BDF8" strokeWidth="1.6" />
          <line x1="18" y1="29" x2="56" y2="29" stroke="#38BDF8" strokeWidth="1.6" />
          <rect x="20" y="21.5" width="34" height="15" rx="7.5" fill="#0E6B63" stroke="#FFFFFF" strokeWidth="1.5" />
          <text
            x="37"
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
    case 'ddos':
      return (
        <svg viewBox="0 0 74 58" className="w-[70px] h-[54px] mx-auto" fill="none" aria-hidden="true">
          <rect x="13" y="11" width="48" height="36" rx="6" fill="#0F172A" />
          <rect x="17" y="15" width="40" height="28" rx="3.5" fill="#1E293B" />
          <path d="M23 32L29.5 24L35.5 28L43.5 19L50 22" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="22" r="3" fill="#F59E0B" />
          <text
            x="37"
            y="39"
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

export const WinAdvantageArtwork: React.FC<{
  id: 'cloud' | 'cdn' | 'ssl' | 'migrations' | 'iis' | 'mssql';
}> = ({ id }) => {
  switch (id) {
    case 'cloud':
      return (
        <svg viewBox="0 0 72 58" className="w-[72px] h-[58px] mx-auto" fill="none" aria-hidden="true">
          <path
            d="M21 47H50.5C56.299 47 61 42.299 61 36.5C61 31.119 56.952 26.684 51.737 26.071C50.092 18.027 42.981 12 34.45 12C24.702 12 16.8 19.902 16.8 29.65C16.8 30.119 16.818 30.583 16.854 31.043C12.999 31.766 10.1 35.148 10.1 39.2C10.1 43.508 13.592 47 17.9 47H21Z"
            fill="#0F172A"
          />
          <line x1="15" y1="21" x2="31" y2="8" stroke="#0E6B63" strokeWidth="2.5" strokeLinecap="round" />
          <polyline points="14,15 14,22 21,22" stroke="#0E6B63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="25,8 32,7.5 31.5,14.5" stroke="#0E6B63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cdn':
      return <WinCoreArtwork id="cdn" />;
    case 'ssl':
      return (
        <svg viewBox="0 0 72 58" className="w-[72px] h-[58px] mx-auto" fill="none" aria-hidden="true">
          <path d="M25 25V18.5C25 12.425 29.925 7.5 36 7.5C42.075 7.5 47 12.425 47 18.5V25" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
          <rect x="19" y="24" width="34" height="26" rx="4.5" fill="#0F172A" />
          <rect x="23" y="27.5" width="26" height="2" rx="1" fill="#0284C7" />
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
      );
    case 'migrations':
      return <WinCoreArtwork id="migrations" />;
    case 'iis':
      return (
        <svg viewBox="0 0 86 58" className="w-[82px] h-[56px] mx-auto" fill="none" aria-hidden="true">
          {/* 4-Pane Windows Mark + Bold IIS Typography */}
          <rect x="11" y="15" width="12" height="12" rx="1.5" fill="#0284C7" />
          <rect x="25" y="15" width="12" height="12" rx="1.5" fill="#0F172A" />
          <rect x="11" y="29" width="12" height="12" rx="1.5" fill="#0F172A" />
          <rect x="25" y="29" width="12" height="12" rx="1.5" fill="#0E6B63" />
          <text
            x="43"
            y="38"
            fill="#0F172A"
            fontSize="24"
            fontWeight="900"
            letterSpacing="-0.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            IIS
          </text>
        </svg>
      );
    case 'mssql':
      return (
        <svg viewBox="0 0 92 58" className="w-[88px] h-[56px] mx-auto" fill="none" aria-hidden="true">
          {/* Microsoft SQL Server Cylinder + Crimson Accent Emblem */}
          <ellipse cx="32" cy="14" rx="13" ry="5" fill="#DC2626" />
          <path d="M19 14V34C19 36.8 24.8 39 32 39C39.2 39 45 36.8 45 34V14" fill="#0F172A" />
          <ellipse cx="32" cy="14" rx="13" ry="5" fill="#EF4444" />
          <path d="M19 24C19 26.8 24.8 29 32 29C39.2 29 45 26.8 45 24" stroke="#94A3B8" strokeWidth="1.5" />
          {/* SQL Label Tag */}
          <rect x="44" y="21" width="38" height="18" rx="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
          <text
            x="63"
            y="33.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="800"
            letterSpacing="0.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            MSSQL
          </text>
          <text
            x="46"
            y="51"
            textAnchor="middle"
            fill="#0F172A"
            fontSize="8.5"
            fontWeight="700"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            SQL Server Ready
          </text>
        </svg>
      );
  }
};
