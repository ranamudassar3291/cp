import React from 'react';
import { ComputePillarItem } from '../../data/vpsAndN8nData';

export const ComputeMetricEmblem: React.FC<{
  kind: 'ram' | 'cpu' | 'storage' | 'port' | 'snapshot' | 'traffic';
}> = ({ kind }) => {
  switch (kind) {
    case 'ram':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3" y="7" width="18" height="9" rx="1.6" fill="#0F172A" />
          <rect x="5" y="9" width="3" height="5" rx="0.5" fill="#38BDF8" />
          <rect x="9" y="9" width="3" height="5" rx="0.5" fill="#38BDF8" />
          <rect x="13" y="9" width="3" height="5" rx="0.5" fill="#38BDF8" />
          <rect x="17" y="9" width="2" height="5" rx="0.5" fill="#34D399" />
          <path d="M6 16V18.5M9 16V18.5M12 16V18.5M15 16V18.5M18 16V18.5" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'cpu':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
          <rect x="9" y="9" width="6" height="6" rx="1" fill="#F97316" />
          <path d="M9 3V6M12 3V6M15 3V6M9 18V21M12 18V21M15 18V21M3 9H6M3 12H6M3 15H6M18 9H21M18 12H21M18 15H21" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'storage':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" fill="#334155" />
          <rect x="5" y="7" width="14" height="6" rx="1" fill="#0F172A" />
          <rect x="6.5" y="8.6" width="7.5" height="2.4" rx="0.8" fill="#10B981" />
          <circle cx="16.5" cy="15.5" r="1.2" fill="#38BDF8" />
          <rect x="5.5" y="14.7" width="6.5" height="1.6" rx="0.8" fill="#94A3B8" />
        </svg>
      );
    case 'port':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <circle cx="12" cy="12" r="9" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
          <path d="M7.5 14.5C7.5 11.2 9.6 9 12.2 9C14.8 9 16.5 11 16.5 14" stroke="#9A3412" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 14L15 10.5" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="14.3" r="1.3" fill="#0F172A" />
        </svg>
      );
    case 'snapshot':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="4" y="6" width="16" height="13" rx="2.5" fill="#DBEAFE" stroke="#0284C7" strokeWidth="1.4" />
          <circle cx="12" cy="12.5" r="3.2" fill="#0284C7" />
          <circle cx="12" cy="12.5" r="1.3" fill="#FFFFFF" />
          <rect x="8.5" y="4" width="7" height="2.5" rx="1" fill="#0F172A" />
        </svg>
      );
    case 'traffic':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M5 9H17L14 6" stroke="#0E6B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 15H7L10 18" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

export const ComputePillarArtwork: React.FC<{
  id: ComputePillarItem['id'];
}> = ({ id }) => {
  switch (id) {
    case 'storage':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <rect x="10" y="12" width="52" height="16" rx="3.5" fill="#1E293B" />
          <rect x="14" y="16" width="18" height="8" rx="1.5" fill="#38BDF8" />
          <circle cx="52" cy="20" r="2.2" fill="#34D399" />
          <rect x="10" y="34" width="52" height="16" rx="3.5" fill="#334155" />
          <rect x="14" y="38" width="18" height="8" rx="1.5" fill="#F97316" />
          <circle cx="52" cy="42" r="2.2" fill="#34D399" />
        </svg>
      );
    case 'provision':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <circle cx="36" cy="32" r="24" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
          <path d="M38 14L23 35H35L32 50L49 28H37L38 14Z" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'bandwidth':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <circle cx="36" cy="32" r="23" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.8" />
          <path d="M22 39C27 32 33 32 38 39" stroke="#0E6B63" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 24H48L42 18" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M44 42H24L30 48" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sla':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <path d="M36 8L58 17V33C58 45.5 48.6 54.4 36 58C23.4 54.4 14 45.5 14 33V17L36 8Z" fill="#ECFDF5" stroke="#0E6B63" strokeWidth="2" />
          <path d="M26 33L33 40L47 26" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'root':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <rect x="10" y="12" width="52" height="40" rx="5" fill="#0F172A" />
          <circle cx="18" cy="19" r="1.8" fill="#EF4444" />
          <circle cx="24" cy="19" r="1.8" fill="#F59E0B" />
          <circle cx="30" cy="19" r="1.8" fill="#10B981" />
          <path d="M20 31L27 36L20 41" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 41H45" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'flexible':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <rect x="12" y="14" width="48" height="36" rx="5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
          <path d="M12 25H60" stroke="#0F172A" strokeWidth="2" />
          <path d="M24 37L32 43L48 31" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'docker':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <rect x="16" y="22" width="11" height="10" rx="1.5" fill="#0284C7" />
          <rect x="29" y="22" width="11" height="10" rx="1.5" fill="#38BDF8" />
          <rect x="42" y="22" width="11" height="10" rx="1.5" fill="#0284C7" />
          <rect x="29" y="10" width="11" height="10" rx="1.5" fill="#0E6B63" />
          <path d="M12 36H60C58 47 49 52 36 52C23 52 14 47 12 36Z" fill="#0F172A" />
          <circle cx="24" cy="43" r="1.8" fill="#FFFFFF" />
        </svg>
      );
    case 'webhook':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <circle cx="24" cy="42" r="9" fill="#FFEDD5" stroke="#EA580C" strokeWidth="2.2" />
          <circle cx="48" cy="42" r="9" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.2" />
          <circle cx="36" cy="20" r="9" fill="#DCFCE7" stroke="#0E6B63" strokeWidth="2.2" />
          <path d="M31 27L26 34M41 27L46 34M33 42H39" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'postgres':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <ellipse cx="36" cy="18" rx="18" ry="6.5" fill="#0284C7" />
          <path d="M18 18V32C18 35.6 26 38.5 36 38.5C46 38.5 54 35.6 54 32V18" fill="#38BDF8" />
          <path d="M18 32V46C18 49.6 26 52.5 36 52.5C46 52.5 54 49.6 54 46V32" fill="#0369A1" />
          <ellipse cx="36" cy="18" rx="18" ry="6.5" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.5" />
        </svg>
      );
    case 'workflows':
      return (
        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" aria-hidden="true">
          <rect x="10" y="25" width="14" height="14" rx="3" fill="#EA580C" />
          <rect x="30" y="13" width="14" height="14" rx="3" fill="#0E6B63" />
          <rect x="30" y="37" width="14" height="14" rx="3" fill="#0284C7" />
          <rect x="50" y="25" width="12" height="14" rx="3" fill="#0F172A" />
          <path d="M24 32H27V20H30M27 32V44H30M44 20H47V32H50M44 44H47V32" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
};
