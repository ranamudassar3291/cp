import React from 'react';
import {
  ArchiveRestore,
  ArrowLeftRight,
  BadgeCheck,
  Code2,
  Cpu,
  Database,
  FolderTree,
  Gauge,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Mail,
  ScanSearch,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

export type CpanelFeatureKey =
  | 'panel'
  | 'domain'
  | 'ram'
  | 'websites'
  | 'nvme'
  | 'bandwidth'
  | 'ssl'
  | 'migration'
  | 'email'
  | 'mysql'
  | 'subdomains'
  | 'wordpress'
  | 'malware'
  | 'backups'
  | 'ddos'
  | 'runtime'
  | 'ssh';

/**
 * Renders a distinct, domain-matched technical icon inside a crisp icon badge
 * for each feature row of cPanel Ignite, Velocity, and Zenith plans.
 */
export const CpanelPlanFeatureIcon: React.FC<{
  featureKey: CpanelFeatureKey;
  highlighted?: boolean;
}> = ({ featureKey, highlighted = false }) => {
  const wrapClass = highlighted
    ? 'w-6 h-6 rounded-md bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-[#34D399]'
    : 'w-6 h-6 rounded-md bg-[#F2FAF8] border border-[#0E6B63]/20 flex items-center justify-center shrink-0 text-[#0E6B63]';

  const iconClass = 'w-3.5 h-3.5 stroke-[2]';

  const renderIcon = () => {
    switch (featureKey) {
      case 'panel':
        return <SlidersHorizontal className={iconClass} aria-hidden="true" />;
      case 'domain':
        return <BadgeCheck className={iconClass} aria-hidden="true" />;
      case 'ram':
        return <Cpu className={iconClass} aria-hidden="true" />;
      case 'websites':
        return <Globe className={iconClass} aria-hidden="true" />;
      case 'nvme':
        return <HardDrive className={iconClass} aria-hidden="true" />;
      case 'bandwidth':
        return <Gauge className={iconClass} aria-hidden="true" />;
      case 'ssl':
        return <ShieldCheck className={iconClass} aria-hidden="true" />;
      case 'migration':
        return <ArrowLeftRight className={iconClass} aria-hidden="true" />;
      case 'email':
        return <Mail className={iconClass} aria-hidden="true" />;
      case 'mysql':
        return <Database className={iconClass} aria-hidden="true" />;
      case 'subdomains':
        return <FolderTree className={iconClass} aria-hidden="true" />;
      case 'wordpress':
        return <Layers className={iconClass} aria-hidden="true" />;
      case 'malware':
        return <ScanSearch className={iconClass} aria-hidden="true" />;
      case 'backups':
        return <ArchiveRestore className={iconClass} aria-hidden="true" />;
      case 'ddos':
        return <Shield className={iconClass} aria-hidden="true" />;
      case 'runtime':
        return <Code2 className={iconClass} aria-hidden="true" />;
      case 'ssh':
        return <KeyRound className={iconClass} aria-hidden="true" />;
    }
  };

  return <span className={wrapClass}>{renderIcon()}</span>;
};

/* ---------- 64px Custom Technical Line-Art Illustrations (Core Features Section) ---------- */

export const IllusOneClickInstaller: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" aria-hidden="true">
    <rect x="6" y="12" width="42" height="34" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
    <path d="M6 20H48" stroke="#0F172A" strokeWidth="2.2" />
    <circle cx="12" cy="16" r="1.5" fill="#0E6B63" />
    <circle cx="17" cy="16" r="1.5" fill="#0F172A" />
    <circle cx="22" cy="16" r="1.5" fill="#94A3B8" />
    <circle cx="27" cy="33" r="8.5" stroke="#0E6B63" strokeWidth="2.2" />
    <path d="M23 30L25.2 37L27 32L28.8 37L31 30" stroke="#0F172A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="42" y="24" width="16" height="22" rx="3" fill="#E6F2F1" stroke="#0E6B63" strokeWidth="2" />
    <path d="M50 30V38M50 38L46.5 34.5M50 38L53.5 34.5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IllusCloudSslShield: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" aria-hidden="true">
    <path
      d="M19 42H46C51 42 55 38.2 55 33.4C55 29 51.7 25.4 47.4 24.9C46 17.5 39.6 12 31.8 12C24 12 17.7 17.6 16.4 25C12.1 25.6 9 29.1 9 33.5C9 38.2 13.5 42 19 42Z"
      fill="#FFFFFF"
      stroke="#0F172A"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <rect x="23" y="29" width="18" height="16" rx="3" fill="#E6F2F1" stroke="#0E6B63" strokeWidth="2.2" />
    <path d="M27 29V24.5C27 21.7 29.2 19.5 32 19.5C34.8 19.5 37 21.7 37 24.5V29" stroke="#0E6B63" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="32" cy="36.5" r="2" fill="#0F172A" />
    <path d="M32 38.5V41" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IllusAutomatedBackups: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" aria-hidden="true">
    <rect x="10" y="12" width="44" height="36" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
    <path d="M10 21H54" stroke="#0F172A" strokeWidth="2.2" />
    <circle cx="16" cy="16.5" r="1.5" fill="#0E6B63" />
    <circle cx="21" cy="16.5" r="1.5" fill="#0F172A" />
    <circle cx="26" cy="16.5" r="1.5" fill="#94A3B8" />
    <path
      d="M40.5 34.5A9 9 0 1 1 38 27.5"
      stroke="#0E6B63"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M39 23V28.5H33.5" stroke="#0E6B63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 30.5V35L35 37" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IllusBandwidthGauge: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="21" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
    <path d="M17.5 38.5A16 16 0 1 1 46.5 38.5" stroke="#0E6B63" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M21 23L23.5 25M32 17V20M43 23L40.5 25M17 33H20M44 33H47" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 34L42 23" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="32" cy="34" r="3.2" fill="#0E6B63" />
    <rect x="24" y="42" width="16" height="5" rx="2.5" fill="#E6F2F1" stroke="#0E6B63" strokeWidth="1.5" />
  </svg>
);

export const IllusNvmeDriveArray: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" aria-hidden="true">
    <rect x="10" y="14" width="44" height="36" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
    <rect x="16" y="21" width="32" height="14" rx="2.5" fill="#E6F2F1" stroke="#0E6B63" strokeWidth="1.8" />
    <path d="M21 31V25L25 31V25M28 25L30.5 31L33 25M36 31V25H39M36 28H38.5M42 25V31M42 25L44 28L46 25V31" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 42H34M40 42H48" stroke="#0E6B63" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const IllusMultiRuntimeStack: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="20" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
    <circle cx="32" cy="32" r="14" stroke="#0E6B63" strokeWidth="1.8" strokeDasharray="4 3" />
    <path d="M25 27L19.5 32L25 37" stroke="#0F172A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M39 27L44.5 32L39 37" stroke="#0F172A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34.5 24.5L29.5 39.5" stroke="#0E6B63" strokeWidth="2.3" strokeLinecap="round" />
  </svg>
);

/* ---------- 56px Platform Capability SVG Emblems (Platform Architecture Grid) ---------- */

export const ArchIconCloudScale: React.FC = () => (
  <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto" fill="none" aria-hidden="true">
    <circle cx="28" cy="28" r="16" stroke="#0F172A" strokeWidth="2.2" fill="#F8FAFC" />
    <path d="M21 31C21 27.5 23.6 25 27 25C29.8 25 32.1 26.8 32.8 29.2C35.2 29.4 37 31.3 37 33.6C37 36 35 38 32.5 38H22.5C20 38 18 36 18 33.5" stroke="#0E6B63" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M39 14L44 9M44 9H39M44 9V14" stroke="#0E6B63" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArchIconControlPanel: React.FC = () => (
  <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto" fill="none" aria-hidden="true">
    <rect x="8" y="11" width="40" height="34" rx="6" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.2" />
    <path d="M16 21H32M38 21H40" stroke="#0E6B63" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="35" cy="21" r="2.8" fill="#0E6B63" />
    <path d="M16 30H20M26 30H40" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="23" cy="30" r="2.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.2" />
    <path d="M16 39H30M36 39H40" stroke="#0E6B63" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="33" cy="39" r="2.8" fill="#0E6B63" />
  </svg>
);

export const ArchIconWildcardSsl: React.FC = () => (
  <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto" fill="none" aria-hidden="true">
    <path d="M28 8L44 14V26C44 36.2 37.2 44.5 28 48C18.8 44.5 12 36.2 12 26V14L28 8Z" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.2" strokeLinejoin="round" />
    <rect x="22" y="25" width="12" height="11" rx="2" fill="#E6F2F1" stroke="#0E6B63" strokeWidth="2" />
    <path d="M24.5 25V22C24.5 20.1 26.1 18.5 28 18.5C29.9 18.5 31.5 20.1 31.5 22V25" stroke="#0E6B63" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ArchIconServerMigration: React.FC = () => (
  <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto" fill="none" aria-hidden="true">
    <rect x="10" y="11" width="16" height="34" rx="3" fill="#0F172A" />
    <rect x="14" y="16" width="8" height="2" rx="1" fill="#34D399" />
    <rect x="14" y="21" width="8" height="2" rx="1" fill="#94A3B8" />
    <path d="M35 16V33M35 16L31 20M35 16L39 20" stroke="#0E6B63" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M44 34V17M44 34L40 30M44 34L48 30" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="31" y="38" width="17" height="7" rx="3.5" fill="#E6F2F1" stroke="#0E6B63" strokeWidth="1.8" />
  </svg>
);

export const ArchIconEdgeCdn: React.FC = () => (
  <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto" fill="none" aria-hidden="true">
    <circle cx="28" cy="28" r="19" stroke="#CBD5E1" strokeWidth="1.8" strokeDasharray="4 3" />
    <path
      d="M17 35H39C42.9 35 46 31.9 46 28.2C46 24.7 43.3 21.8 39.9 21.4C38.6 15.8 33.6 12 27.6 12C21.6 12 16.7 16 15.5 21.6C12.3 22.1 10 24.9 10 28.2C10 31.9 13.1 35 17 35Z"
      fill="#0F172A"
    />
    <path d="M22 26H34M28 20V32" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ArchIconDdosArmor: React.FC = () => (
  <svg viewBox="0 0 56 56" className="w-14 h-14 mx-auto" fill="none" aria-hidden="true">
    <rect x="10" y="14" width="36" height="28" rx="4" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.2" />
    <path d="M20 28L25.5 33.5L36.5 22.5" stroke="#0E6B63" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
