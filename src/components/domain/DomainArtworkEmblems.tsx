import React from 'react';
import { DomainValuePillar } from '../../data/domainPagesData';

export const DomainPillarArtwork: React.FC<{ id: DomainValuePillar['id'] }> = ({
  id,
}) => {
  switch (id) {
    case 'hosting':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="56" height="36" rx="4" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
          <path d="M8 17H64" stroke="#0F172A" strokeWidth="1.8" />
          <circle cx="14" cy="12.5" r="1.4" fill="#EF4444" />
          <circle cx="19" cy="12.5" r="1.4" fill="#F59E0B" />
          <circle cx="24" cy="12.5" r="1.4" fill="#10B981" />
          <rect x="14" y="23" width="22" height="14" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
          <path d="M42 25H57M42 30H53M42 35H55" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <path d="M27 52H45M36 44V52" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'dns':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <rect x="10" y="10" width="52" height="40" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          <path d="M10 19H62" stroke="#0F172A" strokeWidth="1.8" />
          <rect x="20" y="24" width="32" height="16" rx="2.5" fill="#F0FDF4" stroke="#0E6B63" strokeWidth="1.6" />
          <text x="36" y="35.5" textAnchor="middle" fill="#0E6B63" fontSize="10" fontWeight="800" fontFamily="monospace">
            DNS
          </text>
        </svg>
      );
    case 'email':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <rect x="10" y="14" width="44" height="30" rx="3.5" fill="#FEF3C7" stroke="#0F172A" strokeWidth="2" />
          <path d="M11 16L32 31L53 16" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="53" cy="37" r="11" fill="#0E6B63" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M48 37L51.5 40.5L58.5 33.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'migration':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <rect x="10" y="10" width="22" height="36" rx="3" fill="#1E293B" />
          <rect x="14" y="16" width="14" height="3" rx="1.5" fill="#38BDF8" />
          <rect x="14" y="23" width="14" height="3" rx="1.5" fill="#34D399" />
          <circle cx="50" cy="30" r="14" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          <path d="M35 26H48L44 22M48 34H35L39 38" stroke="#0E6B63" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'ssl':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <path d="M36 7L57 15.5V30.5C57 42.5 48.1 50.8 36 54C23.9 50.8 15 42.5 15 30.5V15.5L36 7Z" fill="#ECFDF5" stroke="#0F172A" strokeWidth="2" />
          <rect x="27" y="27" width="18" height="14" rx="2.5" fill="#0E6B63" />
          <path d="M31 27V23.5C31 20.74 33.24 18.5 36 18.5C38.76 18.5 41 20.74 41 23.5V27" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'cdn':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <path d="M16 42C16 28.7 25 20 36 20C47 20 56 28.7 56 42" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M22 42C22 32.5 28 26.5 36 26.5C44 26.5 50 32.5 50 42" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
          <path d="M36 42L47 27" stroke="#0E6B63" strokeWidth="3" strokeLinecap="round" />
          <circle cx="36" cy="42" r="4" fill="#0F172A" />
        </svg>
      );
    case 'lockcheck':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <rect x="20" y="25" width="32" height="24" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          <path d="M27 25V18C27 13 31 9 36 9C41 9 45 13 45 18" stroke="#0E6B63" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M30 37L34.5 41.5L43 32.5" stroke="#0E6B63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'epp':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <circle cx="25" cy="30" r="11" fill="#FEF3C7" stroke="#0F172A" strokeWidth="2" />
          <circle cx="25" cy="30" r="4" fill="#0E6B63" />
          <path d="M36 30H58V37M50 30V36" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'renewal':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <rect x="14" y="12" width="44" height="38" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          <path d="M14 23H58" stroke="#0F172A" strokeWidth="2" />
          <text x="36" y="42" textAnchor="middle" fill="#0E6B63" fontSize="14" fontWeight="800" fontFamily="sans-serif">
            +1 YR
          </text>
        </svg>
      );
    case 'privacy':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <circle cx="36" cy="24" r="9" fill="#E0F2FE" stroke="#0F172A" strokeWidth="2" />
          <path d="M20 48C20 39 27 34 36 34C45 34 52 39 52 48" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="51" cy="40" r="9" fill="#0E6B63" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M47 40H55" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'bulk':
    case 'support':
      return (
        <svg width="64" height="54" viewBox="0 0 72 60" fill="none" aria-hidden="true">
          <circle cx="36" cy="30" r="19" fill="#ECFDF5" stroke="#0E6B63" strokeWidth="2" />
          <path d="M24 30V26C24 19.4 29.4 14 36 14C42.6 14 48 19.4 48 26V30" stroke="#0F172A" strokeWidth="2" />
          <rect x="20" y="28" width="6" height="10" rx="2.5" fill="#0284C7" />
          <rect x="46" y="28" width="6" height="10" rx="2.5" fill="#0284C7" />
        </svg>
      );
  }
};
