import React from 'react';
import { TrialEligiblePlan } from '../../data/freeTrialData';

export const TrialFlagBadge: React.FC<{ countryId: 'uk' | 'us' | 'sg' }> = ({
  countryId,
}) => {
  if (countryId === 'uk') {
    return (
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        className="rounded-full shrink-0 border border-slate-200"
        aria-hidden="true"
      >
        <clipPath id="trial-uk-clip">
          <circle cx="15" cy="15" r="15" />
        </clipPath>
        <g clipPath="url(#trial-uk-clip)">
          <rect width="30" height="30" fill="#012169" />
          <path d="M0 0L30 30M30 0L0 30" stroke="#FFFFFF" strokeWidth="5.5" />
          <path d="M0 0L30 30M30 0L0 30" stroke="#C8102E" strokeWidth="3.2" />
          <path d="M15 0V30M0 15H30" stroke="#FFFFFF" strokeWidth="8.5" />
          <path d="M15 0V30M0 15H30" stroke="#C8102E" strokeWidth="5" />
        </g>
      </svg>
    );
  }

  if (countryId === 'us') {
    return (
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        className="rounded-full shrink-0 border border-slate-200"
        aria-hidden="true"
      >
        <clipPath id="trial-us-clip">
          <circle cx="15" cy="15" r="15" />
        </clipPath>
        <g clipPath="url(#trial-us-clip)">
          <rect width="30" height="30" fill="#FFFFFF" />
          <rect y="0" width="30" height="3.2" fill="#B22234" />
          <rect y="6" width="30" height="3.2" fill="#B22234" />
          <rect y="12" width="30" height="3.2" fill="#B22234" />
          <rect y="18" width="30" height="3.2" fill="#B22234" />
          <rect y="24" width="30" height="3.2" fill="#B22234" />
          <rect width="15" height="15.2" fill="#3C3B6E" />
          <circle cx="4.2" cy="4.2" r="1" fill="#FFFFFF" />
          <circle cx="7.8" cy="4.2" r="1" fill="#FFFFFF" />
          <circle cx="11.4" cy="4.2" r="1" fill="#FFFFFF" />
          <circle cx="6" cy="7.6" r="1" fill="#FFFFFF" />
          <circle cx="9.6" cy="7.6" r="1" fill="#FFFFFF" />
          <circle cx="4.2" cy="11" r="1" fill="#FFFFFF" />
          <circle cx="7.8" cy="11" r="1" fill="#FFFFFF" />
          <circle cx="11.4" cy="11" r="1" fill="#FFFFFF" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      className="rounded-full shrink-0 border border-slate-200"
      aria-hidden="true"
    >
      <clipPath id="trial-sg-clip">
        <circle cx="15" cy="15" r="15" />
      </clipPath>
      <g clipPath="url(#trial-sg-clip)">
        <rect width="30" height="15" fill="#EF3340" />
        <rect y="15" width="30" height="15" fill="#FFFFFF" />
        <circle cx="10" cy="8" r="4.3" fill="#FFFFFF" />
        <circle cx="11.5" cy="8" r="3.6" fill="#EF3340" />
        <circle cx="13.5" cy="6" r="0.8" fill="#FFFFFF" />
        <circle cx="15.2" cy="7.6" r="0.8" fill="#FFFFFF" />
        <circle cx="13.8" cy="9.8" r="0.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const TrialResourceEmblem: React.FC<{
  resourceKey: 'websites' | 'databases' | 'emails' | 'ssd';
}> = ({ resourceKey }) => {
  switch (resourceKey) {
    case 'websites':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <circle cx="12" cy="12" r="10" fill="#1E293B" />
          <rect x="6" y="7" width="12" height="10" rx="1.8" fill="#F8FAFC" />
          <rect x="6" y="7" width="12" height="3" rx="1" fill="#0EA5E9" />
          <circle cx="8" cy="8.5" r="0.6" fill="#FFFFFF" />
          <circle cx="10" cy="8.5" r="0.6" fill="#FFFFFF" />
          <rect x="8" y="12" width="8" height="1.4" rx="0.7" fill="#38BDF8" />
          <rect x="8" y="14.2" width="5" height="1.2" rx="0.6" fill="#94A3B8" />
        </svg>
      );
    case 'databases':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <ellipse cx="12" cy="6.2" rx="7" ry="2.6" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <path d="M5 6.2V11.8C5 13.2 8.1 14.4 12 14.4C15.9 14.4 19 13.2 19 11.8V6.2" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.2" />
          <path d="M5 11.8V17.4C5 18.8 8.1 20 12 20C15.9 20 19 18.8 19 17.4V11.8" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.2" />
        </svg>
      );
    case 'emails':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="#FDE68A" stroke="#D97706" strokeWidth="1.3" />
          <path d="M4.2 7L12 12.6L19.8 7" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17.5" cy="14.8" r="2.3" fill="#0E6B63" />
          <path d="M16.6 14.8L17.3 15.5L18.5 14.2" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'ssd':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3.5" y="6" width="17" height="12" rx="2.5" fill="#334155" />
          <rect x="5" y="7.5" width="14" height="5.5" rx="1" fill="#0F172A" />
          <rect x="6.5" y="9" width="7" height="2.4" rx="0.8" fill="#10B981" />
          <circle cx="16.5" cy="15.2" r="1.2" fill="#38BDF8" />
          <rect x="5.5" y="14.4" width="6.5" height="1.6" rx="0.8" fill="#94A3B8" />
        </svg>
      );
  }
};

export const TrialFeatureEmblem: React.FC<{
  featureKey: TrialEligiblePlan['features'][number]['key'];
}> = ({ featureKey }) => {
  switch (featureKey) {
    case 'ssl':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" fill="#0E6B63" />
          <path d="M8 10V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V10" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="15.2" r="1.6" fill="#A7F3D0" />
        </svg>
      );
    case 'apps':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.8" fill="#F97316" />
          <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.8" fill="#0EA5E9" />
          <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.8" fill="#10B981" />
          <rect x="13" y="13" width="7.5" height="7.5" rx="1.8" fill="#6366F1" />
        </svg>
      );
    case 'malware':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M12 2.8L19.5 6V11.6C19.5 16.3 16.3 19.9 12 21.3C7.7 19.9 4.5 16.3 4.5 11.6V6L12 2.8Z" fill="#DCFCE7" stroke="#0E6B63" strokeWidth="1.5" />
          <path d="M8.8 12.1L11 14.3L15.4 9.7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'builder':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="#E0E7FF" stroke="#4338CA" strokeWidth="1.4" />
          <rect x="6" y="7.5" width="5" height="4.5" rx="1" fill="#6366F1" />
          <rect x="12.5" y="7.5" width="5.5" height="1.8" rx="0.9" fill="#4338CA" />
          <rect x="12.5" y="10.4" width="4" height="1.5" rx="0.75" fill="#818CF8" />
          <rect x="6" y="14" width="12" height="2.8" rx="1" fill="#38BDF8" />
        </svg>
      );
    case 'edge':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M13 2.5L5.5 13.5H11.5L10.5 21.5L18.5 10.5H12.5L13 2.5Z" fill="#059669" stroke="#065F46" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case 'staging':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3.5" y="4.5" width="11" height="10" rx="2" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.4" />
          <rect x="9.5" y="9.5" width="11" height="10" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.4" />
          <path d="M12.5 14.5H17.5M15 12V17" stroke="#0E6B63" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'ddos':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M12 2.8L19.5 5.8V11.8C19.5 16.4 16.4 20 12 21.4C7.6 20 4.5 16.4 4.5 11.8V5.8L12 2.8Z" fill="#1E293B" />
          <path d="M12 6L16.5 7.8V11.6C16.5 14.5 14.6 16.8 12 17.8V6Z" fill="#38BDF8" />
          <path d="M12 6L7.5 7.8V11.6C7.5 14.5 9.4 16.8 12 17.8V6Z" fill="#0EA5E9" />
        </svg>
      );
    case 'ssh':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="#0F172A" />
          <path d="M7.5 10L10.5 12.5L7.5 15" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 15H16.5" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};
