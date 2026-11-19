import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  Key,
  Layers,
  Loader2,
  Lock,
  MailCheck,
  MapPin,
  Percent,
  Receipt,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  Terminal,
  UserPlus,
  Wallet,
  Workflow,
  X,
} from 'lucide-react';
import {
  DomainContactAddress,
  ManagedHostingPlanRecord,
  OrderCheckoutDraft,
  PaymentGatewayKind,
  PlatformOrder,
  PromoCodeRecord,
  ServerCustomConfig,
  TldExtensionRecord,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { SHARED_DATACENTERS } from '../../data/sharedHostingData';
import {
  COMPUTE_BACKUP_ADDONS,
  COMPUTE_DATACENTERS,
  ComputeOsTemplate,
  groupComputeTemplatesByName,
  N8N_STACK_CATALOG,
  VPS_OS_CATALOG,
} from '../../data/vpsAndN8nData';
import {
  getPricingForTld,
  inspectDomainLive,
  normalizeDomainInput,
} from '../../utils/domainLookup';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';
import { DomainContactAddressSelector } from '../domain/DomainContactAddressSelector';

export type OrderCategory =
  | 'catalog'
  | 'free-trial'
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'cpanel-hosting'
  | 'reseller-hosting'
  | 'vps-hosting'
  | 'n8n-hosting'
  | 'domain-registration'
  | 'domain-transfer';

type ConcreteOrderCategory = Exclude<OrderCategory, 'catalog'>;

interface ServiceOrderPageProps {
  orderCategory?: OrderCategory;
  onNavigateHome: () => void;
  onBackToSharedHosting: () => void;
  onRequireLogin: () => void;
  onRequireRegister: () => void;
  onOpenDashboard: (subPath?: string) => void;
}

type BillingPeriodOption = '1 Month' | '1 Year' | '2 Years' | '4 Years';

interface DomainCheckCandidate {
  domain: string;
  tld: string;
  minYears: 1 | 2;
  priceUsd: number;
  renewalUsd: number;
  available: boolean;
  popular: boolean;
}

const BILLING_PERIODS: {
  id: BillingPeriodOption;
  label: string;
  sublabel: string;
  badge?: string;
}[] = [
  { id: '1 Month', label: '1 Month', sublabel: 'Standard monthly billing' },
  { id: '1 Year', label: '1 Year', sublabel: 'Annual plan · Save more', badge: 'Popular' },
  { id: '2 Years', label: '2 Years', sublabel: 'Multi-year lock + 10% off', badge: 'Save 10%' },
  { id: '4 Years', label: '4 Years', sublabel: 'Maximum savings + 20% off', badge: 'Best Value · 20%' },
];

const CATEGORY_LABELS: Record<ConcreteOrderCategory, string> = {
  'free-trial': '30-Day Free Hosting Trial',
  'shared-hosting': 'Linux Shared Cloud Hosting',
  'wordpress-hosting': 'WordPress Web Hosting',
  'windows-hosting': 'Windows IIS Web Hosting',
  'cpanel-hosting': 'cPanel NVMe Web Hosting',
  'reseller-hosting': 'White-Label Reseller Hosting',
  'vps-hosting': 'Unmanaged KVM VPS Hosting',
  'n8n-hosting': 'n8n Automation Hosting',
  'domain-registration': 'Domain Registration',
  'domain-transfer': 'Domain Transfer',
};

function getBillingCycleMonthsMultiplier(cycle: BillingPeriodOption): number {
  if (cycle === '1 Year') return 12;
  if (cycle === '2 Years') return 24;
  if (cycle === '4 Years') return 48;
  return 1;
}

function generateStrongServerPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function computePlanCyclePrice(
  plan: ManagedHostingPlanRecord,
  cycle: BillingPeriodOption
): { priceUsd: number; effectiveMonthlyUsd: number; savingsUsd: number } {
  const fullMonthRate = Math.max(0.01, plan.monthlyPrice);
  if (cycle === '1 Month') {
    return {
      priceUsd: Number(fullMonthRate.toFixed(2)),
      effectiveMonthlyUsd: Number(fullMonthRate.toFixed(2)),
      savingsUsd: 0,
    };
  }
  if (cycle === '1 Year') {
    const annual = Number((plan.yearlyPrice || fullMonthRate * 12).toFixed(2));
    const baseline = Number((fullMonthRate * 12).toFixed(2));
    return {
      priceUsd: annual,
      effectiveMonthlyUsd: Number((annual / 12).toFixed(2)),
      savingsUsd: Math.max(0, Number((baseline - annual).toFixed(2))),
    };
  }
  if (cycle === '2 Years') {
    const annualBase = plan.yearlyPrice || fullMonthRate * 12;
    const configuredTwoYr = plan.twoYearPrice && plan.twoYearPrice > 0 ? plan.twoYearPrice : annualBase * 2 * 0.9;
    const twoYear = Number(configuredTwoYr.toFixed(2));
    const baseline = Number((fullMonthRate * 24).toFixed(2));
    return {
      priceUsd: twoYear,
      effectiveMonthlyUsd: Number((twoYear / 24).toFixed(2)),
      savingsUsd: Math.max(0, Number((baseline - twoYear).toFixed(2))),
    };
  }
  const annualBase = plan.yearlyPrice || fullMonthRate * 12;
  const configuredFourYr = plan.fourYearPrice && plan.fourYearPrice > 0 ? plan.fourYearPrice : annualBase * 4 * 0.8;
  const fourYear = Number(configuredFourYr.toFixed(2));
  const baseline = Number((fullMonthRate * 48).toFixed(2));
  return {
    priceUsd: fourYear,
    effectiveMonthlyUsd: Number((fourYear / 48).toFixed(2)),
    savingsUsd: Math.max(0, Number((baseline - fourYear).toFixed(2))),
  };
}

function renderGatewayIcon(kind: PaymentGatewayKind) {
  if (kind === 'easypaisa' || kind === 'jazzcash') {
    return <Smartphone className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  if (kind === 'bank_transfer') {
    return <Building2 className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  if (kind === 'card') {
    return <CreditCard className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  return <Wallet className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
}

function CatalogProductEmblem({ category }: { category: ConcreteOrderCategory }) {
  const regionTag =
    category === 'windows-hosting'
      ? 'UK'
      : category === 'cpanel-hosting'
      ? 'USA'
      : category === 'free-trial'
      ? 'TRIAL'
      : 'GLOBAL';

  return (
    <div className="relative w-20 h-20 mx-auto rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
      {category === 'free-trial' && (
        <Sparkles className="w-9 h-9 text-[#0E6B63]" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'shared-hosting' && (
        <Server className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'wordpress-hosting' && (
        <Layers className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'windows-hosting' && (
        <HardDrive className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'cpanel-hosting' && (
        <ShieldCheck className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'reseller-hosting' && (
        <Building2 className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'vps-hosting' && (
        <Cpu className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {category === 'n8n-hosting' && (
        <Workflow className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      {(category === 'domain-registration' || category === 'domain-transfer') && (
        <Globe className="w-9 h-9 text-slate-400" strokeWidth={1.6} aria-hidden="true" />
      )}
      <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] font-mono text-[10px] font-bold text-[#0E6B63]">
        {regionTag}
      </span>
    </div>
  );
}

export const ServiceOrderPage: React.FC<ServiceOrderPageProps> = ({
  orderCategory = 'catalog',
  onBackToSharedHosting,
  onRequireLogin,
  onRequireRegister,
  onOpenDashboard,
}) => {
  const {
    currentUser,
    hostingPlans,
    tldExtensions,
    paymentMethods,
    invoices,
    invoiceTemplateConfig,
    orderCheckoutDraft,
    lastSearchedDomain,
    domainContactAddresses,
    setOrderCheckoutDraft,
    clearOrderCheckoutDraft,
    setLastSearchedDomain,
    setPendingPostAuthPath,
    validatePromoCode,
    recordPromoCodeUsage,
    addOrder,
    payClientOrderInvoice,
  } = usePlatform();
  const { currency, rate, formatPrice } = useCurrency();

  const hasValidDraftForCategory = Boolean(
    orderCheckoutDraft &&
      orderCheckoutDraft.orderCategory &&
      orderCheckoutDraft.orderCategory !== 'catalog' &&
      (orderCategory === 'catalog' || orderCheckoutDraft.orderCategory === orderCategory)
  );

  // Determine whether we start in Upmind Store Catalog or Focused Single-Item Checkout
  const [viewMode, setViewMode] = useState<'catalog' | 'checkout'>(() => {
    if (orderCategory === 'catalog') {
      return hasValidDraftForCategory && orderCheckoutDraft?.step && orderCheckoutDraft.step > 1
        ? 'checkout'
        : 'catalog';
    }
    return 'checkout';
  });

  // Catalog sidebar filter state (Upmind-style)
  const [catalogCategory, setCatalogCategory] = useState<ConcreteOrderCategory>('shared-hosting');
  const [catalogCategorySearch, setCatalogCategorySearch] = useState('');
  const [catalogProductSearch, setCatalogProductSearch] = useState('');
  const [hostingGroupOpen, setHostingGroupOpen] = useState(true);
  const [domainGroupOpen, setDomainGroupOpen] = useState(true);

  // Active concrete checkout category
  const [activeCategory, setActiveCategory] = useState<ConcreteOrderCategory>(() => {
    if (orderCategory !== 'catalog') return orderCategory;
    if (
      orderCheckoutDraft?.orderCategory &&
      orderCheckoutDraft.orderCategory !== 'catalog'
    ) {
      return orderCheckoutDraft.orderCategory;
    }
    return 'shared-hosting';
  });

  useEffect(() => {
    if (orderCategory === 'catalog') {
      setViewMode('catalog');
    } else {
      setActiveCategory(orderCategory);
      setViewMode('checkout');
    }
  }, [orderCategory]);

  const isWinOnly = activeCategory === 'windows-hosting';
  const isCpanel = activeCategory === 'cpanel-hosting';
  const isFreeTrialMode = activeCategory === 'free-trial';
  const isCompute = activeCategory === 'vps-hosting' || activeCategory === 'n8n-hosting';
  const isN8nCompute = activeCategory === 'n8n-hosting';
  const isDomainOnly =
    activeCategory === 'domain-registration' || activeCategory === 'domain-transfer';

  const categoryPlans = useMemo(() => {
    if (activeCategory === 'free-trial') {
      const trialIds = ['plan-shared-ignite', 'plan-wp-core', 'plan-win-core'];
      return trialIds
        .map((id) => hostingPlans.find((p) => p.id === id && p.enabled))
        .filter((p): p is ManagedHostingPlanRecord => Boolean(p));
    }
    const targetCat = isDomainOnly ? 'shared-hosting' : activeCategory;
    const filtered = hostingPlans.filter((p) => p.pageCategory === targetCat && p.enabled);
    if (filtered.length > 0) return filtered;
    return hostingPlans.filter((p) => p.pageCategory === 'shared-hosting' && p.enabled);
  }, [hostingPlans, activeCategory, isDomainOnly]);

  const enabledTlds = useMemo(
    () => tldExtensions.filter((t) => t.enabled),
    [tldExtensions]
  );

  const enabledGateways = useMemo(
    () =>
      paymentMethods
        .filter((pm) => pm.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [paymentMethods]
  );

  const initialPlan = useMemo(() => {
    if (orderCheckoutDraft?.planId) {
      const byId = categoryPlans.find((p) => p.id === orderCheckoutDraft.planId);
      if (byId) return byId;
      const globalById = hostingPlans.find((p) => p.id === orderCheckoutDraft.planId);
      if (globalById) return globalById;
    }
    return categoryPlans.find((p) => p.popular) ?? categoryPlans[0] ?? hostingPlans[0];
  }, [orderCheckoutDraft, categoryPlans, hostingPlans]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => {
    if (isDomainOnly) return 2;
    if (orderCheckoutDraft?.step) {
      if (orderCheckoutDraft.step === 4 && !currentUser) return 3;
      return orderCheckoutDraft.step;
    }
    return 1;
  });

  useEffect(() => {
    if (isDomainOnly && step === 1) {
      setStep(2);
    }
  }, [isDomainOnly, step]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialPlan?.id || 'plan-shared-velocity'
  );

  useEffect(() => {
    if (orderCheckoutDraft?.planId) {
      setSelectedPlanId(orderCheckoutDraft.planId);
    }
  }, [orderCheckoutDraft?.planId]);

  const [billingCycle, setBillingCycle] = useState<BillingPeriodOption>(() => {
    if (orderCategory === 'free-trial') return '1 Month';
    return orderCheckoutDraft?.billingCycle || (orderCategory === 'vps-hosting' || orderCategory === 'n8n-hosting' ? '1 Month' : '1 Year');
  });

  const [datacenterId, setDatacenterId] = useState<'uk' | 'us' | 'sg' | 'eu'>(() => {
    if (isWinOnly) return 'uk';
    if (isCpanel) return 'us';
    return orderCheckoutDraft?.datacenterId || 'uk';
  });

  useEffect(() => {
    if (isWinOnly && datacenterId !== 'uk') {
      setDatacenterId('uk');
    } else if (isCpanel && datacenterId !== 'us') {
      setDatacenterId('us');
    } else if (!isCompute && datacenterId === 'eu') {
      setDatacenterId('uk');
    }
  }, [isWinOnly, isCpanel, isCompute, datacenterId]);

  // Hostinger-style VPS & n8n Server Configurator state
  const [computeOsTab, setComputeOsTab] = useState<'all' | 'plain-os' | 'os-panel' | 'app-docker'>('all');
  const [selectedOsId, setSelectedOsId] = useState<string>(() => {
    if (orderCheckoutDraft?.serverConfig?.osId) {
      return orderCheckoutDraft.serverConfig.osId;
    }
    return orderCategory === 'n8n-hosting' ? N8N_STACK_CATALOG[0].id : 'ubuntu-cyberpanel';
  });
  const [computeStorageMode, setComputeStorageMode] = useState<'NVMe High-IOPS' | 'SSD High-Capacity'>(
    orderCheckoutDraft?.serverConfig?.storageMode || 'NVMe High-IOPS'
  );
  const [computeHostname, setComputeHostname] = useState<string>(
    orderCheckoutDraft?.serverConfig?.hostname ||
      (orderCategory === 'n8n-hosting'
        ? 'flows01.cpcloudhost.internal'
        : 'node01.cpcloudhost.internal')
  );
  const [computeAuthMode, setComputeAuthMode] = useState<'password' | 'ssh' | 'both'>(
    orderCheckoutDraft?.serverConfig?.authMode || 'both'
  );
  const [computeRootPassword, setComputeRootPassword] = useState<string>(() =>
    generateStrongServerPassword()
  );
  const [showRootPassword, setShowRootPassword] = useState(false);
  const [computeSshKeyLabel, setComputeSshKeyLabel] = useState<string>(
    orderCheckoutDraft?.serverConfig?.sshKeyLabel || ''
  );
  const [computeSshPublicKey, setComputeSshPublicKey] = useState<string>(
    orderCheckoutDraft?.serverConfig?.sshPublicKey || ''
  );
  const [computeBackupAddon, setComputeBackupAddon] = useState<
    'none' | 'weekly-snapshots' | 'daily-backups'
  >(orderCheckoutDraft?.serverConfig?.backupAddon || 'none');
  const [computeDedicatedIpAddon, setComputeDedicatedIpAddon] = useState<boolean>(
    Boolean(orderCheckoutDraft?.serverConfig?.dedicatedIpAddon)
  );
  const [computeFirewallAddon, setComputeFirewallAddon] = useState<boolean>(
    Boolean(orderCheckoutDraft?.serverConfig?.firewallShieldAddon)
  );
  const [computeCustomEnvNote, setComputeCustomEnvNote] = useState<string>(
    orderCheckoutDraft?.serverConfig?.customEnvNote || ''
  );

  // Ensure selected OS / stack belongs to active compute catalog when category switches
  useEffect(() => {
    if (!isCompute) return;
    const catalog = isN8nCompute ? N8N_STACK_CATALOG : VPS_OS_CATALOG;
    const exists = catalog.some((item) => item.id === selectedOsId);
    if (!exists) {
      setSelectedOsId(isN8nCompute ? N8N_STACK_CATALOG[0].id : 'ubuntu-cyberpanel');
    }
    if (isN8nCompute && computeHostname.startsWith('node01.')) {
      setComputeHostname('flows01.cpcloudhost.internal');
    } else if (!isN8nCompute && computeHostname.startsWith('flows01.')) {
      setComputeHostname('node01.cpcloudhost.internal');
    }
  }, [isCompute, isN8nCompute, selectedOsId, computeHostname]);

  // Domain configuration state — auto-inherit draft OR lastSearchedDomain so user never searches twice!
  const [domainOption, setDomainOption] = useState<'register' | 'transfer' | 'existing' | 'later'>(
    () => {
      if (activeCategory === 'domain-transfer') return 'transfer';
      if (activeCategory === 'domain-registration') return 'register';
      if (orderCheckoutDraft?.domainOption) return orderCheckoutDraft.domainOption;
      if (lastSearchedDomain) return lastSearchedDomain.mode;
      return 'register';
    }
  );

  useEffect(() => {
    if (activeCategory === 'domain-transfer') {
      setDomainOption('transfer');
    } else if (activeCategory === 'domain-registration') {
      setDomainOption('register');
    }
  }, [activeCategory]);

  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [searchingDomains, setSearchingDomains] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainCheckCandidate[]>([]);
  const [domainSearchError, setDomainSearchError] = useState('');

  // Control whether the domain search input is hidden because user already searched on site
  const [showDomainSearchBox, setShowDomainSearchBox] = useState<boolean>(() => {
    if (orderCheckoutDraft?.domainOption === 'register' && orderCheckoutDraft.domainName) {
      return false;
    }
    if (lastSearchedDomain?.mode === 'register' && lastSearchedDomain.domain) {
      return false;
    }
    return true;
  });

  // Domain Transfer state
  const [transferDomainInput, setTransferDomainInput] = useState(() => {
    if (orderCheckoutDraft?.domainOption === 'transfer' && orderCheckoutDraft.domainName) {
      return orderCheckoutDraft.domainName;
    }
    if (lastSearchedDomain?.mode === 'transfer' && lastSearchedDomain.domain) {
      return lastSearchedDomain.domain;
    }
    return '';
  });
  const [domainUnlockedChecked, setDomainUnlockedChecked] = useState(
    orderCheckoutDraft?.domainUnlockedConfirmed !== undefined
      ? orderCheckoutDraft.domainUnlockedConfirmed
      : false
  );
  const [eppAuthCode, setEppAuthCode] = useState(
    orderCheckoutDraft?.eppAuthCode || lastSearchedDomain?.eppAuthCode || ''
  );
  const [showEppSecret, setShowEppSecret] = useState(false);
  const [transferStrategy, setTransferStrategy] = useState<'preserve' | 'cloud'>('preserve');

  // Nameservers state
  const [nameserversType, setNameserversType] = useState<'default' | 'custom'>(
    orderCheckoutDraft?.nameserversType || 'default'
  );
  const [customNs1, setCustomNs1] = useState(
    orderCheckoutDraft?.nameservers?.[0] || 'ns1.cpcloudhost.com'
  );
  const [customNs2, setCustomNs2] = useState(
    orderCheckoutDraft?.nameservers?.[1] || 'ns2.cpcloudhost.com'
  );
  const [whoisPrivacyEnabled, setWhoisPrivacyEnabled] = useState(
    orderCheckoutDraft?.whoisPrivacy !== undefined ? orderCheckoutDraft.whoisPrivacy : true
  );
  const [selectedWhoisContact, setSelectedWhoisContact] =
    useState<DomainContactAddress | null>(() => {
      if (orderCheckoutDraft?.whoisContactId) {
        const found = domainContactAddresses.find(
          (c) => c.id === orderCheckoutDraft.whoisContactId
        );
        if (found) return found;
      }
      return (
        domainContactAddresses.find((c) => c.isDefault) ||
        domainContactAddresses[0] ||
        null
      );
    });

  useEffect(() => {
    if (orderCheckoutDraft?.whoisContactId) {
      const matched = domainContactAddresses.find(
        (c) => c.id === orderCheckoutDraft.whoisContactId
      );
      if (matched) {
        setSelectedWhoisContact(matched);
        return;
      }
    }
    if (!selectedWhoisContact && domainContactAddresses.length > 0) {
      setSelectedWhoisContact(
        domainContactAddresses.find((c) => c.isDefault) || domainContactAddresses[0]
      );
    }
  }, [
    orderCheckoutDraft?.whoisContactId,
    domainContactAddresses,
    selectedWhoisContact,
  ]);

  const [selectedNewDomain, setSelectedNewDomain] = useState<DomainCheckCandidate | null>(() => {
    if (
      orderCheckoutDraft?.domainOption === 'register' &&
      orderCheckoutDraft.domainName &&
      orderCheckoutDraft.domainTld
    ) {
      const matchedTld = enabledTlds.find(
        (t) => t.tld.toLowerCase() === orderCheckoutDraft.domainTld?.toLowerCase()
      );
      const fallbackPrice =
        orderCheckoutDraft.domainPriceUsd ||
        (matchedTld
          ? matchedTld.minYears === 2
            ? matchedTld.year2Usd
            : matchedTld.year1Usd
          : 12.99);
      return {
        domain: orderCheckoutDraft.domainName,
        tld: orderCheckoutDraft.domainTld,
        minYears: orderCheckoutDraft.domainYears === 2 ? 2 : 1,
        priceUsd: fallbackPrice,
        renewalUsd: matchedTld?.renewalUsd || fallbackPrice,
        available: true,
        popular: true,
      };
    }
    if (lastSearchedDomain && lastSearchedDomain.mode === 'register' && lastSearchedDomain.available) {
      return {
        domain: lastSearchedDomain.domain,
        tld: lastSearchedDomain.tld,
        minYears: lastSearchedDomain.minYears,
        priceUsd: lastSearchedDomain.priceUsd,
        renewalUsd: lastSearchedDomain.renewalUsd,
        available: true,
        popular: true,
      };
    }
    return null;
  });

  // Sync if draft or lastSearchedDomain updates externally
  useEffect(() => {
    if (
      orderCheckoutDraft?.domainOption === 'register' &&
      orderCheckoutDraft.domainName &&
      orderCheckoutDraft.domainTld
    ) {
      const matchedTld = enabledTlds.find(
        (t) => t.tld.toLowerCase() === orderCheckoutDraft.domainTld?.toLowerCase()
      );
      const priceUsd =
        orderCheckoutDraft.domainPriceUsd ||
        (matchedTld
          ? matchedTld.minYears === 2
            ? matchedTld.year2Usd
            : matchedTld.year1Usd
          : 12.99);
      setSelectedNewDomain({
        domain: orderCheckoutDraft.domainName,
        tld: orderCheckoutDraft.domainTld,
        minYears: orderCheckoutDraft.domainYears === 2 ? 2 : 1,
        priceUsd,
        renewalUsd: matchedTld?.renewalUsd || priceUsd,
        available: true,
        popular: true,
      });
      setShowDomainSearchBox(false);
    } else if (
      !selectedNewDomain &&
      lastSearchedDomain &&
      lastSearchedDomain.mode === 'register' &&
      lastSearchedDomain.available
    ) {
      setSelectedNewDomain({
        domain: lastSearchedDomain.domain,
        tld: lastSearchedDomain.tld,
        minYears: lastSearchedDomain.minYears,
        priceUsd: lastSearchedDomain.priceUsd,
        renewalUsd: lastSearchedDomain.renewalUsd,
        available: true,
        popular: true,
      });
      setShowDomainSearchBox(false);
    }
    if (orderCheckoutDraft?.domainOption === 'transfer' && orderCheckoutDraft.domainName) {
      setDomainOption('transfer');
      setTransferDomainInput(orderCheckoutDraft.domainName);
      if (orderCheckoutDraft.eppAuthCode) {
        setEppAuthCode(orderCheckoutDraft.eppAuthCode);
      }
      if (orderCheckoutDraft.domainUnlockedConfirmed !== undefined) {
        setDomainUnlockedChecked(orderCheckoutDraft.domainUnlockedConfirmed);
      }
    } else if (!transferDomainInput && lastSearchedDomain?.mode === 'transfer' && lastSearchedDomain.domain) {
      setTransferDomainInput(lastSearchedDomain.domain);
      if (lastSearchedDomain.eppAuthCode) {
        setEppAuthCode(lastSearchedDomain.eppAuthCode);
      }
    }
  }, [
    orderCheckoutDraft?.domainName,
    orderCheckoutDraft?.domainTld,
    orderCheckoutDraft?.domainOption,
    orderCheckoutDraft?.eppAuthCode,
    orderCheckoutDraft?.domainUnlockedConfirmed,
    lastSearchedDomain,
  ]);

  const [existingDomainInput, setExistingDomainInput] = useState(
    orderCheckoutDraft?.domainOption === 'existing' ? orderCheckoutDraft.domainName : ''
  );
  const [step2Error, setStep2Error] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState(
    orderCheckoutDraft?.promoCode || (orderCategory === 'free-trial' ? 'STARTFREE' : '')
  );
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeRecord | null>(null);
  const [promoDiscountUsd, setPromoDiscountUsd] = useState(0);
  const [promoError, setPromoError] = useState('');

  // Payment & Completion state
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(
    enabledGateways[0]?.id || ''
  );
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [postOrderGatewayId, setPostOrderGatewayId] = useState<string>('');
  const [postOrderDetailsNote, setPostOrderDetailsNote] = useState('');
  const [postOrderPaymentSubmitted, setPostOrderPaymentSubmitted] = useState(false);
  const [postOrderPaymentError, setPostOrderPaymentError] = useState('');
  const [copiedAccountField, setCopiedAccountField] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<{
    orderId: string;
    invoiceId: string;
    secondaryOrderId?: string;
    secondaryInvoiceId?: string;
    productName: string;
    datacenter: string;
    domainName: string;
    totalPaidUsd: number;
    billingCycle: string;
    isFreeTrial?: boolean;
    hasDomainRegistration?: boolean;
    hasDomainTransfer?: boolean;
    serverConfig?: ServerCustomConfig;
  } | null>(null);

  useEffect(() => {
    if (viewMode === 'catalog') {
      applyPageSeoMetadata({
        title: 'Storefront & Service Catalog | cpcloudhost.com',
        description:
          'Browse cloud hosting, 30-day free trial, managed WordPress, cPanel, Windows IIS, KVM VPS, n8n nodes, and domain services in your local currency.',
        canonicalPath: '/order',
        ogType: 'website',
        jsonLd: null,
      });
      return;
    }

    const titles: Record<ConcreteOrderCategory, string> = {
      'free-trial': 'Start 30-Day Free Hosting Trial ($0.00 Today) | cpcloudhost.com',
      'shared-hosting': 'Order Shared Cloud Hosting | cpcloudhost.com',
      'wordpress-hosting': 'Order Managed WordPress Hosting (UK, US & Singapore) | cpcloudhost.com',
      'windows-hosting': 'Order Windows IIS Web Hosting (UK Datacenter) | cpcloudhost.com',
      'cpanel-hosting': 'Order cPanel NVMe Web Hosting (USA Datacenter) | cpcloudhost.com',
      'reseller-hosting': 'Order White-Label Reseller Hosting | cpcloudhost.com',
      'vps-hosting': 'Configure & Order Unmanaged KVM VPS | cpcloudhost.com',
      'n8n-hosting': 'Configure & Order n8n Automation Node | cpcloudhost.com',
      'domain-registration': 'Register Domain Name | cpcloudhost.com',
      'domain-transfer': 'Transfer Domain & 1-Year Extension | cpcloudhost.com',
    };
    applyPageSeoMetadata({
      title: titles[activeCategory] || 'Order Web Services | cpcloudhost.com',
      description:
        'Enterprise cloud checkout portal with KVM OS & n8n stack provisioning, live domain search, local currency billing, and automated invoicing.',
      canonicalPath: `/order/${activeCategory}`,
      ogType: 'website',
      jsonLd: null,
    });
  }, [activeCategory, viewMode]);

  useEffect(() => {
    if (!selectedGatewayId && enabledGateways.length > 0) {
      setSelectedGatewayId(enabledGateways[0].id);
    }
  }, [enabledGateways, selectedGatewayId]);

  const activePlan = useMemo(
    () =>
      categoryPlans.find((p) => p.id === selectedPlanId) ??
      categoryPlans[0] ??
      hostingPlans[0],
    [categoryPlans, selectedPlanId, hostingPlans]
  );

  const activeDatacenter = useMemo(() => {
    if (isCompute) {
      return (
        COMPUTE_DATACENTERS.find((dc) => dc.id === datacenterId) ?? COMPUTE_DATACENTERS[0]
      );
    }
    if (isWinOnly) {
      return SHARED_DATACENTERS.find((dc) => dc.id === 'uk') ?? SHARED_DATACENTERS[0];
    }
    if (isCpanel) {
      return SHARED_DATACENTERS.find((dc) => dc.id === 'us') ?? SHARED_DATACENTERS[1];
    }
    return (
      SHARED_DATACENTERS.find((dc) => dc.id === datacenterId) ?? SHARED_DATACENTERS[0]
    );
  }, [datacenterId, isCompute, isWinOnly, isCpanel]);

  const activeComputeTemplate: ComputeOsTemplate = useMemo(() => {
    const catalog = isN8nCompute ? N8N_STACK_CATALOG : VPS_OS_CATALOG;
    return catalog.find((item) => item.id === selectedOsId) ?? catalog[0];
  }, [isN8nCompute, selectedOsId]);

  const activeBackupOption = useMemo(
    () =>
      COMPUTE_BACKUP_ADDONS.find((b) => b.id === computeBackupAddon) ??
      COMPUTE_BACKUP_ADDONS[0],
    [computeBackupAddon]
  );

  const hostingPricing = useMemo(
    () =>
      isDomainOnly
        ? { priceUsd: 0, effectiveMonthlyUsd: 0, savingsUsd: 0 }
        : activePlan
        ? computePlanCyclePrice(activePlan, billingCycle)
        : { priceUsd: 0, effectiveMonthlyUsd: 0, savingsUsd: 0 },
    [activePlan, billingCycle, isDomainOnly]
  );

  const computeCycleMonths = useMemo(
    () => getBillingCycleMonthsMultiplier(billingCycle),
    [billingCycle]
  );

  const computeAddonsMonthlyUsd = isCompute
    ? Number(
        (
          activeBackupOption.monthlyPriceUsd +
          (computeDedicatedIpAddon ? 3.0 : 0) +
          (computeFirewallAddon ? 4.0 : 0)
        ).toFixed(2)
      )
    : 0;

  const computeAddonsTotalUsd = isCompute
    ? Number((computeAddonsMonthlyUsd * computeCycleMonths).toFixed(2))
    : 0;

  // Transfer pricing lookup based on domain extension
  const detectedTransferTld = useMemo(() => {
    const raw = transferDomainInput.trim().toLowerCase();
    if (!raw.includes('.')) return null;
    const parts = raw.split('.');
    const ext = '.' + parts.slice(1).join('.');
    const matched =
      enabledTlds.find((t) => t.tld.toLowerCase() === ext.toLowerCase()) ||
      enabledTlds.find((t) => t.tld.toLowerCase() === ('.' + parts[parts.length - 1]).toLowerCase());
    return matched || enabledTlds[0] || null;
  }, [transferDomainInput, enabledTlds]);

  const transferPriceUsd = detectedTransferTld
    ? detectedTransferTld.transferUsd || detectedTransferTld.year1Usd
    : getPricingForTld('.com').transferPrice;

  const isSharedOrCpanelPlan =
    !isDomainOnly &&
    (activeCategory === 'shared-hosting' || activeCategory === 'cpanel-hosting');

  const qualifiesPlanForFreeCom =
    isSharedOrCpanelPlan &&
    (billingCycle === '1 Year' || billingCycle === '2 Years' || billingCycle === '4 Years');

  const isComCandidateSelected =
    qualifiesPlanForFreeCom &&
    domainOption === 'register' &&
    Boolean(selectedNewDomain) &&
    selectedNewDomain!.tld.toLowerCase() === '.com';

  const effectiveRegisterDomainPriceUsd =
    domainOption === 'register' && selectedNewDomain
      ? isComCandidateSelected
        ? 0
        : selectedNewDomain.priceUsd
      : 0;

  const domainPriceUsd =
    isCompute
      ? 0
      : domainOption === 'register' && selectedNewDomain
      ? effectiveRegisterDomainPriceUsd
      : domainOption === 'transfer' && transferDomainInput.trim()
      ? transferPriceUsd
      : 0;

  const grossSubtotalUsd = isDomainOnly
    ? Number(domainPriceUsd.toFixed(2))
    : isCompute
    ? Number((hostingPricing.priceUsd + computeAddonsTotalUsd).toFixed(2))
    : Number((hostingPricing.priceUsd + domainPriceUsd).toFixed(2));

  // Auto-apply & keep STARTFREE synced when checking out in Free Trial mode
  useEffect(() => {
    if (isFreeTrialMode) {
      if (billingCycle !== '1 Month') {
        setBillingCycle('1 Month');
      }
      const res = validatePromoCode({
        code: 'STARTFREE',
        hostingPlanId: activePlan?.id || 'plan-shared-ignite',
        hostingPlanName: activePlan?.name || 'Cloud Ignite',
        hostingCycle: '1 Month',
        hostingSubtotalUsd: hostingPricing.priceUsd,
        domainSubtotalUsd: domainPriceUsd,
      });
      if (res.ok && res.promo) {
        setPromoInput('STARTFREE');
        setAppliedPromo(res.promo);
        setPromoDiscountUsd(res.discountUsd);
        setPromoError('');
      }
    }
  }, [
    isFreeTrialMode,
    activePlan?.id,
    activePlan?.name,
    hostingPricing.priceUsd,
    domainPriceUsd,
    billingCycle,
    validatePromoCode,
  ]);

  const netTotalUsd = Math.max(
    0,
    Number((grossSubtotalUsd - promoDiscountUsd).toFixed(2))
  );

  // Auto-advance to Step 4 if returning authenticated
  useEffect(() => {
    if (currentUser && orderCheckoutDraft?.step === 4 && step !== 4 && !completedOrders) {
      setViewMode('checkout');
      setStep(4);
    }
  }, [currentUser, orderCheckoutDraft, step, completedOrders]);

  const resolveProductType = (cat: ConcreteOrderCategory): PlatformOrder['productType'] => {
    switch (cat) {
      case 'free-trial':
        if (activePlan?.id === 'plan-wp-core') return 'Managed WordPress';
        if (activePlan?.id === 'plan-win-core') return 'Windows Hosting';
        return 'Shared Cloud';
      case 'wordpress-hosting':
        return 'Managed WordPress';
      case 'windows-hosting':
        return 'Windows Hosting';
      case 'cpanel-hosting':
        return 'cPanel Hosting';
      case 'reseller-hosting':
        return 'Reseller Hosting';
      case 'vps-hosting':
        return 'Unmanaged VPS';
      case 'n8n-hosting':
        return 'n8n Hosting';
      case 'domain-registration':
        return 'Domain Registration';
      case 'domain-transfer':
        return 'Domain Transfer';
      default:
        return 'Shared Cloud';
    }
  };

  const buildCurrentServerConfig = (): ServerCustomConfig | undefined => {
    if (!isCompute) return undefined;
    const cleanHost =
      computeHostname.trim().toLowerCase() ||
      (isN8nCompute ? 'flows01.cpcloudhost.internal' : 'node01.cpcloudhost.internal');
    return {
      serverType: isN8nCompute ? 'n8n' : 'vps',
      osCategory: activeComputeTemplate.category,
      osId: activeComputeTemplate.id,
      osName: activeComputeTemplate.name,
      osVersion: activeComputeTemplate.version,
      controlPanelOrStack: activeComputeTemplate.controlPanelOrStack,
      datacenterId: activeDatacenter.id as ServerCustomConfig['datacenterId'],
      datacenterLabel: activeDatacenter.city,
      storageMode: computeStorageMode,
      hostname: cleanHost,
      authMode: computeAuthMode,
      sshKeyLabel: computeSshKeyLabel.trim() || undefined,
      sshPublicKey:
        computeSshPublicKey.trim().length > 0
          ? computeSshPublicKey.trim().slice(0, 68) + (computeSshPublicKey.trim().length > 68 ? '...' : '')
          : undefined,
      rootPasswordConfigured: computeAuthMode !== 'ssh',
      backupAddon: activeBackupOption.id,
      backupAddonLabel: activeBackupOption.name,
      backupAddonMonthlyUsd: activeBackupOption.monthlyPriceUsd,
      dedicatedIpAddon: computeDedicatedIpAddon,
      dedicatedIpMonthlyUsd: computeDedicatedIpAddon ? 3.0 : 0,
      firewallShieldAddon: computeFirewallAddon,
      firewallShieldMonthlyUsd: computeFirewallAddon ? 4.0 : 0,
      customEnvNote: computeCustomEnvNote.trim() || undefined,
    };
  };

  const persistDraft = (nextStep: 1 | 2 | 3 | 4) => {
    const serverCfg = buildCurrentServerConfig();
    const draft: OrderCheckoutDraft = {
      orderCategory: activeCategory,
      planId: activePlan?.id || 'domain-reg',
      planName: isDomainOnly
        ? activeCategory === 'domain-transfer'
          ? 'Domain Transfer'
          : 'Domain Registration'
        : activePlan.name,
      productType: resolveProductType(activeCategory),
      billingCycle,
      datacenterId: activeDatacenter.id,
      datacenterLabel: activeDatacenter.city,
      domainOption: isCompute ? 'later' : domainOption,
      domainName: isCompute
        ? serverCfg?.hostname || computeHostname
        : domainOption === 'register'
        ? selectedNewDomain?.domain || ''
        : domainOption === 'transfer'
        ? transferDomainInput.trim().toLowerCase()
        : domainOption === 'existing'
        ? existingDomainInput.trim().toLowerCase()
        : 'Configure Later',
      domainTld:
        isCompute
          ? undefined
          : domainOption === 'register'
          ? selectedNewDomain?.tld
          : domainOption === 'transfer'
          ? detectedTransferTld?.tld
          : undefined,
      domainYears: !isCompute && domainOption === 'register' ? selectedNewDomain?.minYears : 1,
      domainPriceUsd,
      promoCode: appliedPromo?.code || undefined,
      isFreeTrial: isFreeTrialMode || undefined,
      trialDays: isFreeTrialMode ? 30 : undefined,
      serverConfig: serverCfg,
      nameserversType,
      nameservers:
        nameserversType === 'default'
          ? activeCategory === 'shared-hosting'
            ? ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com']
            : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
          : [customNs1.trim() || 'ns1.cpcloudhost.com', customNs2.trim() || 'ns2.cpcloudhost.com'],
      whoisPrivacy: whoisPrivacyEnabled,
      whoisContactId: selectedWhoisContact?.id,
      eppAuthCode: !isCompute && domainOption === 'transfer' ? eppAuthCode : undefined,
      domainUnlockedConfirmed:
        !isCompute && domainOption === 'transfer' ? domainUnlockedChecked : undefined,
      preselectedFromSite: true,
      domainSearchedFromSite: !isCompute && Boolean(selectedNewDomain || lastSearchedDomain),
      step: nextStep,
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    };
    setOrderCheckoutDraft(draft);
  };

  // Catalog data computation (Upmind-style left category tree + counts)
  const catalogHostingCategories = useMemo(() => {
    const defs: { id: ConcreteOrderCategory; label: string; regionNote: string }[] = [
      { id: 'free-trial', label: '30-Day Free Hosting Trial', regionNote: 'UK · US · Singapore ($0 Today)' },
      { id: 'shared-hosting', label: 'Linux Shared Cloud', regionNote: 'UK · US · Singapore' },
      { id: 'wordpress-hosting', label: 'WordPress Web Hosting', regionNote: 'UK · US · Singapore' },
      { id: 'windows-hosting', label: 'Windows Web Hosting', regionNote: 'London UK IIS 10' },
      { id: 'cpanel-hosting', label: 'cPanel NVMe Hosting', regionNote: 'Dallas USA NVMe' },
      { id: 'reseller-hosting', label: 'WHM Reseller Hosting', regionNote: 'UK · US · Singapore' },
      { id: 'vps-hosting', label: 'KVM VPS Hosting', regionNote: 'UK · US · EU · Singapore' },
      { id: 'n8n-hosting', label: 'n8n Automation Hosting', regionNote: 'UK · US · EU · Singapore' },
    ];
    return defs.map((def) => {
      if (def.id === 'free-trial') {
        const trialIds = ['plan-shared-ignite', 'plan-wp-core', 'plan-win-core'];
        return {
          ...def,
          plans: trialIds
            .map((id) => hostingPlans.find((p) => p.id === id && p.enabled))
            .filter((p): p is ManagedHostingPlanRecord => Boolean(p)),
        };
      }
      return {
        ...def,
        plans: hostingPlans.filter((p) => p.pageCategory === def.id && p.enabled),
      };
    });
  }, [hostingPlans]);

  const catalogDomainCategories = useMemo(
    () => [
      { id: 'domain-registration' as const, label: 'Domain Registration', count: enabledTlds.length },
      { id: 'domain-transfer' as const, label: 'Domain Transfer', count: enabledTlds.length },
    ],
    [enabledTlds.length]
  );

  const filteredHostingCats = useMemo(() => {
    const q = catalogCategorySearch.trim().toLowerCase();
    if (!q) return catalogHostingCategories;
    return catalogHostingCategories.filter(
      (c) => c.label.toLowerCase().includes(q) || c.regionNote.toLowerCase().includes(q)
    );
  }, [catalogHostingCategories, catalogCategorySearch]);

  const filteredDomainCats = useMemo(() => {
    const q = catalogCategorySearch.trim().toLowerCase();
    if (!q) return catalogDomainCategories;
    return catalogDomainCategories.filter((c) => c.label.toLowerCase().includes(q));
  }, [catalogDomainCategories, catalogCategorySearch]);

  const activeCatalogPlans = useMemo(() => {
    const catObj = catalogHostingCategories.find((c) => c.id === catalogCategory);
    const list = catObj ? catObj.plans : [];
    const q = catalogProductSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.audience.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.storage.toLowerCase().includes(q)
    );
  }, [catalogHostingCategories, catalogCategory, catalogProductSearch]);

  const handleSelectPlanFromCatalog = (
    cat: ConcreteOrderCategory,
    plan: ManagedHostingPlanRecord
  ) => {
    setActiveCategory(cat);
    setSelectedPlanId(plan.id);
    if (cat === 'free-trial') {
      setBillingCycle('1 Month');
      setPromoInput('STARTFREE');
    } else if (cat === 'vps-hosting' || cat === 'n8n-hosting') {
      setBillingCycle('1 Month');
      setSelectedOsId(cat === 'n8n-hosting' ? N8N_STACK_CATALOG[0].id : 'ubuntu-cyberpanel');
      setComputeHostname(
        cat === 'n8n-hosting' ? 'flows01.cpcloudhost.internal' : 'node01.cpcloudhost.internal'
      );
    } else {
      setBillingCycle('1 Year');
    }

    if (cat === 'windows-hosting') {
      setDatacenterId('uk');
    } else if (cat === 'cpanel-hosting') {
      setDatacenterId('us');
    }
    if (cat !== 'vps-hosting' && cat !== 'n8n-hosting' && lastSearchedDomain) {
      setDomainOption(lastSearchedDomain.mode);
      if (lastSearchedDomain.mode === 'register' && lastSearchedDomain.available) {
        setSelectedNewDomain({
          domain: lastSearchedDomain.domain,
          tld: lastSearchedDomain.tld,
          minYears: lastSearchedDomain.minYears,
          priceUsd: lastSearchedDomain.priceUsd,
          renewalUsd: lastSearchedDomain.renewalUsd,
          available: true,
          popular: true,
        });
        setShowDomainSearchBox(false);
      } else if (lastSearchedDomain.mode === 'transfer') {
        setTransferDomainInput(lastSearchedDomain.domain);
      }
    } else {
      setDomainOption(
        cat === 'vps-hosting' || cat === 'n8n-hosting' || cat === 'free-trial'
          ? 'later'
          : 'register'
      );
    }
    setCompletedOrders(null);
    setStep(1);
    setViewMode('checkout');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/order/${cat}${window.location.search}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDomainFromCatalog = (
    mode: 'register' | 'transfer',
    candidate?: DomainCheckCandidate,
    transferDomain?: string
  ) => {
    const cat: ConcreteOrderCategory =
      mode === 'transfer' ? 'domain-transfer' : 'domain-registration';
    setActiveCategory(cat);
    setDomainOption(mode);
    if (mode === 'register' && candidate) {
      setSelectedNewDomain(candidate);
      setShowDomainSearchBox(false);
      setLastSearchedDomain({
        domain: candidate.domain,
        tld: candidate.tld,
        available: candidate.available,
        priceUsd: candidate.priceUsd,
        renewalUsd: candidate.renewalUsd,
        minYears: candidate.minYears,
        mode: 'register',
        searchedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      });
    } else if (mode === 'transfer' && transferDomain) {
      setTransferDomainInput(transferDomain);
    }
    setCompletedOrders(null);
    setStep(2);
    setViewMode('checkout');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/order/${cat}${window.location.search}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDomainSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchingDomains) return;
    const raw = domainSearchQuery.trim();
    if (!raw) {
      setDomainSearchError('Enter a domain name or brand keyword to search.');
      return;
    }
    if (enabledTlds.length === 0) {
      setDomainSearchError('No domain extensions are enabled in Admin Domains & TLDs.');
      return;
    }

    setDomainSearchError('');
    setSearchingDomains(true);

    const { baseLabel, tld: typedTld } = normalizeDomainInput(raw);
    const cleanBase = (baseLabel || raw.replace(/[^a-z0-9-]/gi, '').toLowerCase()) || 'mybrand';

    const orderedTlds: TldExtensionRecord[] = [...enabledTlds]
      .sort((a, b) => {
        if (a.tld.toLowerCase() === typedTld.toLowerCase()) return -1;
        if (b.tld.toLowerCase() === typedTld.toLowerCase()) return 1;
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.tld.localeCompare(b.tld);
      })
      .slice(0, 5);

    try {
      const checks = await Promise.all(
        orderedTlds.map(async (ext, idx) => {
          const fullDomain = `${cleanBase}${ext.tld}`;
          const res = await inspectDomainLive(fullDomain, idx === 0);
          const priceUsd = ext.minYears === 2 ? ext.year2Usd : ext.year1Usd;
          return {
            domain: fullDomain,
            tld: ext.tld,
            minYears: ext.minYears,
            priceUsd,
            renewalUsd: ext.renewalUsd,
            available: res.available,
            popular: ext.popular,
          } satisfies DomainCheckCandidate;
        })
      );
      setDomainResults(checks);
      if (checks[0]) {
        setLastSearchedDomain({
          domain: checks[0].domain,
          tld: checks[0].tld,
          available: checks[0].available,
          priceUsd: checks[0].priceUsd,
          renewalUsd: checks[0].renewalUsd,
          minYears: checks[0].minYears,
          mode: checks[0].available ? 'register' : 'transfer',
          searchedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        });
      }
    } catch {
      setDomainSearchError('Unable to complete live DNS/RDAP registry lookup.');
    } finally {
      setSearchingDomains(false);
    }
  };

  const handleContinueFromStep2 = () => {
    setStep2Error('');
    if (isCompute) {
      const cleanHost = computeHostname
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0];
      if (!cleanHost || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(cleanHost)) {
        setStep2Error(
          isN8nCompute
            ? 'Enter a valid webhook subdomain / FQDN (e.g. flows.yourdomain.com or flows01.cpcloudhost.internal).'
            : 'Enter a valid server FQDN hostname (e.g. node01.yourdomain.com or node01.cpcloudhost.internal).'
        );
        return;
      }
      setComputeHostname(cleanHost);

      if (
        (computeAuthMode === 'password' || computeAuthMode === 'both') &&
        computeRootPassword.trim().length < 8
      ) {
        setStep2Error(
          'Root password must be at least 8 characters (use the generator button for an instant high-entropy password).'
        );
        return;
      }
      if (computeAuthMode === 'ssh' && computeSshPublicKey.trim().length < 24) {
        setStep2Error(
          'Please paste your SSH public key (ssh-ed25519 or ssh-rsa) or select Password + SSH authentication.'
        );
        return;
      }

      persistDraft(3);
      setStep(3);
      return;
    }

    if (domainOption === 'register' && !selectedNewDomain) {
      setStep2Error('Please search and select an available domain name above.');
      return;
    }
    if (domainOption === 'transfer') {
      const clean = transferDomainInput.trim().toLowerCase();
      if (!clean || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(clean)) {
        setStep2Error('Enter a valid domain name to transfer (e.g. yourcompany.com).');
        return;
      }
      if (!domainUnlockedChecked) {
        setStep2Error('You must confirm that your domain is unlocked with your current registrar.');
        return;
      }
      if (!eppAuthCode.trim() || eppAuthCode.trim().length < 4) {
        setStep2Error('Enter the valid EPP / Authorization Code from your current registrar.');
        return;
      }
    }
    if (domainOption === 'existing') {
      const clean = existingDomainInput
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
      if (!clean || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(clean)) {
        setStep2Error('Enter a valid existing domain name (e.g. yourcompany.com).');
        return;
      }
      setExistingDomainInput(clean);
    }

    if (domainOption === 'register' || domainOption === 'transfer') {
      if (!currentUser) {
        setStep2Error(
          'Please Sign In or Create Account below to add and save your WHOIS Registrant Contact & Address.'
        );
        return;
      }
      if (!selectedWhoisContact) {
        setStep2Error(
          'Please select or add a WHOIS Registrant Contact & Address below before continuing.'
        );
        return;
      }
    }

    persistDraft(3);
    setStep(3);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoInput.trim().toUpperCase();
    if (!cleanCode) return;
    const res = validatePromoCode({
      code: cleanCode,
      hostingPlanId: activePlan?.id || 'domain-only',
      hostingPlanName: activePlan?.name || 'Domain Service',
      hostingCycle: billingCycle,
      hostingSubtotalUsd: hostingPricing.priceUsd,
      domainTld:
        domainOption === 'register'
          ? selectedNewDomain?.tld
          : domainOption === 'transfer'
          ? detectedTransferTld?.tld
          : undefined,
      domainSubtotalUsd: domainPriceUsd,
    });
    if (!res.ok || !res.promo) {
      setPromoError(res.error || 'Invalid promotional discount code.');
      setAppliedPromo(null);
      setPromoDiscountUsd(0);
      return;
    }
    setPromoError('');
    setAppliedPromo(res.promo);
    setPromoDiscountUsd(res.discountUsd);
  };

  const handleRequireAuthAtStep2 = (authMode: 'login' | 'register') => {
    persistDraft(2);
    setPendingPostAuthPath(`/order/${activeCategory}`);
    if (authMode === 'register') {
      onRequireRegister();
    } else {
      onRequireLogin();
    }
  };

  const handleContinueToPaymentOrAuth = (authMode?: 'login' | 'register') => {
    persistDraft(4);
    if (!currentUser) {
      setPendingPostAuthPath(`/order/${activeCategory}`);
      if (authMode === 'register') {
        onRequireRegister();
      } else {
        onRequireLogin();
      }
      return;
    }
    setStep(4);
  };

  const selectedGateway = useMemo(
    () =>
      enabledGateways.find((g) => g.id === selectedGatewayId) ??
      enabledGateways[0] ??
      null,
    [enabledGateways, selectedGatewayId]
  );

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!selectedGateway) {
      setPaymentError('Please select a payment method.');
      return;
    }
    setPaymentError('');

    const serverCfg = buildCurrentServerConfig();

    const resolvedDomainHost = isCompute
      ? serverCfg?.hostname || computeHostname.trim().toLowerCase()
      : domainOption === 'register' && selectedNewDomain
      ? selectedNewDomain.domain
      : domainOption === 'transfer'
      ? transferDomainInput.trim().toLowerCase()
      : domainOption === 'existing'
      ? existingDomainInput.trim().toLowerCase()
      : `trial-${Date.now().toString(36)}.cpcloudhost.com`;

    const hostingDiscount = appliedPromo?.scope === 'hosting' ? promoDiscountUsd : 0;
    const domainDiscount = appliedPromo?.scope === 'domain' ? promoDiscountUsd : 0;

    const resolvedProductType = resolveProductType(activeCategory);

    let primaryOrderId = '';
    let primaryInvoiceId = '';
    let secondaryOrderId: string | undefined;
    let secondaryInvoiceId: string | undefined;

    if (isDomainOnly) {
      const isTransfer = activeCategory === 'domain-transfer' || domainOption === 'transfer';
      const netAmount = Math.max(0, Number((domainPriceUsd - domainDiscount).toFixed(2)));
      const { order, invoice } = addOrder({
        clientEmail: currentUser.email,
        clientName: currentUser.name,
        country: currentUser.country,
        productType: isTransfer ? 'Domain Transfer' : 'Domain Registration',
        planName: isTransfer
          ? `${detectedTransferTld?.tld || '.com'} Domain Transfer (1 Year Ext Included)`
          : `${selectedNewDomain?.tld || '.com'} Domain Registration`,
        domainOrHost: resolvedDomainHost,
        billingCycle:
          !isTransfer && selectedNewDomain?.minYears === 2 ? '2 Years' : '1 Year',
        amountUsd: netAmount,
        paymentMethod: selectedGateway.name,
        datacenter: 'Global Anycast DNS',
        status: 'pending',
        invoicePaid: false,
        nameservers:
          nameserversType === 'default' || transferStrategy === 'cloud'
            ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
            : [customNs1.trim() || 'ns1.cpcloudhost.com', customNs2.trim() || 'ns2.cpcloudhost.com'],
        whoisPrivacy: whoisPrivacyEnabled,
        whoisContact: selectedWhoisContact || undefined,
        eppCode: isTransfer ? eppAuthCode.trim() : undefined,
        transferStatus: isTransfer ? 'pending_admin' : undefined,
        registrarLock: true,
        autoRenew: true,
        promoCode: appliedPromo?.code,
        discountUsd: domainDiscount || undefined,
        notes: isTransfer
          ? `EPP Auth Code Verified (${eppAuthCode.trim()}). Client confirmed domain unlocked. Strategy: ${
              transferStrategy === 'cloud' ? 'CPCloudHost Anycast' : 'Preserve Current'
            }.`
          : `Domain Registration. Nameservers: ${
              nameserversType === 'default'
                ? 'CPCloudHost Anycast'
                : `Custom (${customNs1}, ${customNs2})`
            }. WHOIS Privacy: ${whoisPrivacyEnabled ? 'Active' : 'Off'}.`,
      });
      primaryOrderId = order.id;
      primaryInvoiceId = invoice?.id || order.id.replace('ORD-', 'INV-');
    } else if (isCompute && serverCfg) {
      const netComputeAmount = Math.max(
        0,
        Number((hostingPricing.priceUsd + computeAddonsTotalUsd - hostingDiscount).toFixed(2))
      );
      const { order: computeOrder, invoice: computeInvoice } = addOrder({
        clientEmail: currentUser.email,
        clientName: currentUser.name,
        country: currentUser.country,
        productType: resolvedProductType,
        planName: activePlan.name,
        domainOrHost: serverCfg.hostname,
        billingCycle,
        amountUsd: netComputeAmount,
        paymentMethod: selectedGateway.name,
        datacenter: activeDatacenter.city,
        status: 'pending',
        invoicePaid: false,
        serverModuleId: activePlan.serverModuleId,
        serverPackageName: activePlan.serverPackageName,
        promoCode: appliedPromo?.scope === 'hosting' ? appliedPromo.code : undefined,
        discountUsd: hostingDiscount || undefined,
        serverConfig: serverCfg,
        notes: `${isN8nCompute ? 'n8n Stack' : 'KVM OS'}: ${serverCfg.osName} (${serverCfg.controlPanelOrStack}) · Storage: ${serverCfg.storageMode} · Auth: ${serverCfg.authMode.toUpperCase()}`,
      });
      primaryOrderId = computeOrder.id;
      primaryInvoiceId = computeInvoice?.id || computeOrder.id.replace('ORD-', 'INV-');
    } else {
      const netHostingAmount = Math.max(
        0,
        Number((hostingPricing.priceUsd - hostingDiscount).toFixed(2))
      );
      const isTrialSettled = isFreeTrialMode && netHostingAmount === 0;
      const defaultHostingNameservers =
        resolvedProductType === 'Shared Cloud'
          ? ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com']
          : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
      const effectiveHostingNameservers =
        nameserversType === 'default'
          ? defaultHostingNameservers
          : [customNs1.trim() || defaultHostingNameservers[0], customNs2.trim() || defaultHostingNameservers[1]];

      const preHostingOrderId = `ORD-${Math.floor(905000 + Math.random() * 94000)}`;
      const preBundledDomainOrderId =
        domainOption === 'register' && selectedNewDomain
          ? `ORD-${Math.floor(905000 + Math.random() * 94000)}`
          : undefined;
      const safeBundledDomainOrderId =
        preBundledDomainOrderId === preHostingOrderId && preBundledDomainOrderId
          ? `${preBundledDomainOrderId}D`
          : preBundledDomainOrderId;

      const { order: hostingOrder, invoice: hostingInvoice } = addOrder({
        customRef: preHostingOrderId,
        linkedFreeDomainOrderId: isComCandidateSelected ? safeBundledDomainOrderId : undefined,
        clientEmail: currentUser.email,
        clientName: currentUser.name,
        country: currentUser.country,
        productType: resolvedProductType,
        planName: activePlan.name,
        domainOrHost: resolvedDomainHost,
        billingCycle,
        amountUsd: netHostingAmount,
        paymentMethod: isTrialSettled ? 'Free Trial Verification ($0.00)' : selectedGateway.name,
        datacenter: activeDatacenter.city,
        status: 'pending',
        invoicePaid: isTrialSettled,
        serverModuleId: activePlan.serverModuleId,
        serverPackageName: activePlan.serverPackageName,
        promoCode: appliedPromo?.scope === 'hosting' ? appliedPromo.code : undefined,
        discountUsd: hostingDiscount || undefined,
        isFreeTrial: isFreeTrialMode || undefined,
        trialDays: isFreeTrialMode ? 30 : undefined,
        nameservers: effectiveHostingNameservers,
        notes: isFreeTrialMode
          ? `30-Day Free Trial activated (${appliedPromo?.code || 'STARTFREE'}). Renewal applies on Day 31.`
          : `Order placed via ${selectedGateway.name}${
              domainOption === 'later' ? ' · Staging container assigned' : ''
            }${
              isComCandidateSelected
                ? ` · Includes Free 1-Year .com Domain (${selectedNewDomain?.domain}) while hosting runs ${billingCycle}`
                : ''
            }`,
      });
      primaryOrderId = hostingOrder.id;
      primaryInvoiceId = hostingInvoice?.id || hostingOrder.id.replace('ORD-', 'INV-');

      if (domainOption === 'register' && selectedNewDomain) {
        const netDomainAmount = isComCandidateSelected
          ? 0
          : Math.max(0, Number((selectedNewDomain.priceUsd - domainDiscount).toFixed(2)));
        const { order: domOrder, invoice: domInv } = addOrder({
          customRef: safeBundledDomainOrderId,
          linkedHostingOrderId: isComCandidateSelected ? hostingOrder.id : undefined,
          clientEmail: currentUser.email,
          clientName: currentUser.name,
          country: currentUser.country,
          productType: 'Domain Registration',
          planName: isComCandidateSelected
            ? '.com Domain Registration (Free 1-Year Promo w/ Hosting)'
            : `${selectedNewDomain.tld} Domain Registration`,
          domainOrHost: selectedNewDomain.domain,
          billingCycle: isComCandidateSelected
            ? '1 Year'
            : selectedNewDomain.minYears === 2
            ? '2 Years'
            : '1 Year',
          amountUsd: netDomainAmount,
          paymentMethod: isComCandidateSelected
            ? `Free 1-Yr Domain Promo (${hostingOrder.id})`
            : selectedGateway.name,
          datacenter: activeDatacenter.city,
          status: 'pending',
          invoicePaid: isComCandidateSelected,
          nameservers: effectiveHostingNameservers,
          whoisPrivacy: whoisPrivacyEnabled,
          whoisContact: selectedWhoisContact || undefined,
          registrarLock: true,
          autoRenew: true,
          promoCode: appliedPromo?.scope === 'domain' ? appliedPromo.code : undefined,
          discountUsd: isComCandidateSelected ? undefined : domainDiscount || undefined,
          notes: isComCandidateSelected
            ? `1-Year Free .com Domain included with ${billingCycle} ${resolvedProductType} order ${hostingOrder.id}. Domain renews after Year 1.`
            : `Bundled with ${resolvedProductType} order ${hostingOrder.id}`,
        });
        secondaryOrderId = domOrder.id;
        secondaryInvoiceId = domInv?.id;
      } else if (domainOption === 'transfer' && transferDomainInput.trim()) {
        const netDomainAmount = Math.max(
          0,
          Number((transferPriceUsd - domainDiscount).toFixed(2))
        );
        const transferNs =
          transferStrategy === 'cloud'
            ? resolvedProductType === 'Shared Cloud'
              ? ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com']
              : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
            : ['ns1.current-registrar.com', 'ns2.current-registrar.com'];
        const { order: transOrder, invoice: transInv } = addOrder({
          clientEmail: currentUser.email,
          clientName: currentUser.name,
          country: currentUser.country,
          productType: 'Domain Transfer',
          planName: `${detectedTransferTld?.tld || '.com'} Domain Transfer (1 Year Included)`,
          domainOrHost: transferDomainInput.trim().toLowerCase(),
          billingCycle: '1 Year',
          amountUsd: netDomainAmount,
          paymentMethod: selectedGateway.name,
          datacenter: activeDatacenter.city,
          status: 'pending',
          invoicePaid: false,
          nameservers: transferNs,
          whoisPrivacy: whoisPrivacyEnabled,
          whoisContact: selectedWhoisContact || undefined,
          eppCode: eppAuthCode.trim(),
          transferStatus: 'pending_admin',
          registrarLock: true,
          autoRenew: true,
          promoCode: appliedPromo?.scope === 'domain' ? appliedPromo.code : undefined,
          discountUsd: domainDiscount || undefined,
          notes: `Bundled transfer with ${resolvedProductType} order ${hostingOrder.id}. EPP Verified: ${eppAuthCode.trim()}`,
        });
        secondaryOrderId = transOrder.id;
        secondaryInvoiceId = transInv?.id;
      }
    }

    if (appliedPromo) {
      recordPromoCodeUsage(appliedPromo.code);
    }

    clearOrderCheckoutDraft();
    setPendingPostAuthPath(null);

    setPostOrderGatewayId(selectedGateway.id);
    setTransactionRef('');
    setPostOrderDetailsNote('');
    setPostOrderPaymentSubmitted(false);
    setPostOrderPaymentError('');

    setCompletedOrders({
      orderId: primaryOrderId,
      invoiceId: primaryInvoiceId,
      secondaryOrderId,
      secondaryInvoiceId,
      productName: isDomainOnly
        ? activeCategory === 'domain-transfer'
          ? 'Domain Transfer'
          : 'Domain Registration'
        : isFreeTrialMode
        ? `${activePlan.name} (30-Day Free Trial)`
        : activePlan.name,
      datacenter: activeDatacenter.city,
      domainName: resolvedDomainHost,
      totalPaidUsd: netTotalUsd,
      billingCycle: isDomainOnly ? '1 Year' : billingCycle,
      isFreeTrial: isFreeTrialMode,
      hasDomainRegistration:
        (isDomainOnly && activeCategory !== 'domain-transfer') ||
        (!isCompute && !isDomainOnly && domainOption === 'register' && Boolean(selectedNewDomain)),
      hasDomainTransfer:
        (isDomainOnly && activeCategory === 'domain-transfer') ||
        (!isCompute && !isDomainOnly && domainOption === 'transfer'),
      serverConfig: serverCfg,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Clean Single-Row Breadcrumb Header (Zero Category Tab Bar) */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (orderCategory === 'catalog' && viewMode === 'checkout' && !completedOrders) {
                  setViewMode('catalog');
                  setCatalogCategory(activeCategory);
                } else {
                  onBackToSharedHosting();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E6B63] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>
                {viewMode === 'catalog'
                  ? 'Back'
                  : orderCategory === 'catalog'
                  ? 'Back to Catalog'
                  : 'Back to Plans'}
              </span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-display text-sm sm:text-base font-bold text-[#0F172A] truncate">
              {viewMode === 'catalog'
                ? 'Enterprise Service Catalog'
                : CATEGORY_LABELS[activeCategory]}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-600 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <Globe className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
              <span>
                {currency.code} ({currency.symbol})
              </span>
            </span>

            {viewMode === 'checkout' && !completedOrders && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('catalog');
                  setCatalogCategory(activeCategory);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/order${window.location.search}`);
                  }
                }}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E6B63] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Browse Catalog</span>
              </button>
            )}

            {currentUser ? (
              <button
                type="button"
                onClick={() => onOpenDashboard('/dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                <span>{currentUser.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'checkout') {
                    persistDraft(step);
                    setPendingPostAuthPath(`/order/${activeCategory}`);
                  } else {
                    setPendingPostAuthPath('/order');
                  }
                  onRequireLogin();
                }}
                className="text-xs font-semibold text-[#0E6B63] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {completedOrders ? (
          /* ======================== POST-ORDER INVOICE & PAYMENT SUBMISSION VIEW ======================== */
          (() => {
            const activePostGateway =
              enabledGateways.find((g) => g.id === postOrderGatewayId) || selectedGateway;
            const handleSubmitPostOrderPayment = (e: React.FormEvent) => {
              e.preventDefault();
              if (!activePostGateway) return;
              if (activePostGateway.requiresTransactionId && transactionRef.trim().length < 4) {
                setPostOrderPaymentError(
                  `Please enter your ${activePostGateway.name} Transaction ID / Reference (at least 4 characters).`
                );
                return;
              }
              setPostOrderPaymentError('');
              const res = payClientOrderInvoice(
                completedOrders.invoiceId,
                activePostGateway.name,
                {
                  transactionRef: transactionRef.trim() || undefined,
                  paymentDetailsNote: postOrderDetailsNote.trim() || undefined,
                }
              );
              if (completedOrders.secondaryInvoiceId) {
                payClientOrderInvoice(
                  completedOrders.secondaryInvoiceId,
                  activePostGateway.name,
                  {
                    transactionRef: transactionRef.trim() || undefined,
                    paymentDetailsNote: postOrderDetailsNote.trim() || undefined,
                  }
                );
              }
              if (!res) {
                setPostOrderPaymentError('Please sign in to submit payment details.');
                return;
              }
              setPostOrderPaymentSubmitted(true);
            };

            return (
              <div className="max-w-3xl mx-auto space-y-5">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/25 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-[#16A34A]" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#16A34A]">
                          Order Completed &amp; Official Invoice Generated
                        </p>
                        <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-0.5">
                          Thank you, {currentUser?.name || 'Client'}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          Your {completedOrders.isFreeTrial ? '30-day free trial for ' : 'order for '}
                          <strong className="text-[#0F172A]">{completedOrders.productName}</strong> is logged for{' '}
                          <strong className="text-[#0F172A]">{completedOrders.datacenter}</strong>.{' '}
                          {completedOrders.totalPaidUsd === 0 && completedOrders.isFreeTrial
                            ? 'Your $0.00 trial evaluation invoice is verified and queued for provisioning.'
                            : 'Submit your payment reference below or open your dedicated invoice page anytime.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenDashboard(`/dashboard/billing/${completedOrders.invoiceId}`)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <Receipt className="w-4 h-4" aria-hidden="true" />
                      <span>View Invoice ({completedOrders.invoiceId})</span>
                    </button>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Order Reference</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {completedOrders.orderId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Generated Invoice Number</span>
                      <span className="font-mono font-semibold text-[#0E6B63]">
                        {completedOrders.invoiceId}
                      </span>
                    </div>
                    {completedOrders.secondaryOrderId && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Bundled Domain Order</span>
                        <span className="font-mono font-semibold text-[#0F172A]">
                          {completedOrders.secondaryOrderId} ({completedOrders.secondaryInvoiceId})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">
                        {completedOrders.serverConfig ? 'Server Hostname / FQDN' : 'Domain / Host Reference'}
                      </span>
                      <span className="font-mono font-semibold text-[#0F172A] truncate">
                        {completedOrders.domainName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Datacenter Region</span>
                      <span className="font-semibold text-[#0F172A]">
                        {completedOrders.datacenter}
                      </span>
                    </div>
                    {completedOrders.serverConfig && (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">OS / Stack Image</span>
                          <span className="font-semibold text-[#0F172A]">
                            {completedOrders.serverConfig.osName} ({completedOrders.serverConfig.osVersion})
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Panel / Runtime</span>
                          <span className="font-semibold text-[#0F172A]">
                            {completedOrders.serverConfig.controlPanelOrStack}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Storage &amp; Root Auth</span>
                          <span className="font-semibold text-[#0F172A]">
                            {completedOrders.serverConfig.storageMode} ·{' '}
                            {completedOrders.serverConfig.authMode.toUpperCase()}
                          </span>
                        </div>
                        {(completedOrders.serverConfig.backupAddon !== 'none' ||
                          completedOrders.serverConfig.dedicatedIpAddon ||
                          completedOrders.serverConfig.firewallShieldAddon) && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Provisioned Add-ons</span>
                            <span className="font-semibold text-[#0E6B63] text-right">
                              {[
                                completedOrders.serverConfig.backupAddon !== 'none'
                                  ? completedOrders.serverConfig.backupAddonLabel
                                  : null,
                                completedOrders.serverConfig.dedicatedIpAddon ? 'Extra Dedicated IPv4' : null,
                                completedOrders.serverConfig.firewallShieldAddon ? 'Managed Firewall Shield' : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {completedOrders.isFreeTrial && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Evaluation Window</span>
                        <span className="font-semibold text-[#16A34A]">
                          30-Day Free Trial (Standard Renewal Applies Day 31)
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                      <span className="font-semibold text-[#0F172A]">
                        {completedOrders.totalPaidUsd === 0 && completedOrders.isFreeTrial
                          ? 'Total Charged Today'
                          : 'Total Invoice Balance Due'}
                      </span>
                      <span className="font-mono tabular-nums text-base font-extrabold text-[#0E6B63]">
                        {formatPrice(completedOrders.totalPaidUsd)}
                      </span>
                    </div>
                  </div>

                  {completedOrders.hasDomainRegistration && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
                        <p className="font-bold">
                          Domain Order Queued for Team Review &amp; WHOIS Verification
                        </p>
                        <p className="text-amber-900">
                          Our registrar team has received your domain order and will review and approve it shortly. Immediately upon admin approval, you will receive an email with your Domain Registration certificate and a <strong>Verify &amp; Manage Domain</strong> link to confirm your WHOIS contact details and unlock DNS management.
                        </p>
                      </div>
                    </div>
                  )}

                  {completedOrders.hasDomainTransfer && (
                    <div className="rounded-xl border border-teal-200 bg-[#F2FAF8] p-4 flex items-start gap-3">
                      <MailCheck className="w-5 h-5 text-[#0E6B63] shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs text-slate-800 space-y-1 leading-relaxed">
                        <p className="font-bold text-[#0F172A]">
                          Inbound Domain Transfer Initiated — Approve Email for Instant Completion
                        </p>
                        <p>
                          Approve the transfer authorization link sent to your current registrant email to complete the move immediately. If you do not receive or approve that email, the domain will automatically transfer to our registrar within <strong>7 days</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post-Order Payment Submission (or $0 Trial Verified Banner) */}
                  {completedOrders.totalPaidUsd === 0 && completedOrders.isFreeTrial ? (
                    <div className="rounded-xl border border-emerald-200 bg-[#F2FAF8] p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>30-Day Free Trial Invoice Verified ($0.00 Due Today)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Promo code <span className="font-mono font-bold text-[#0F172A]">STARTFREE</span> waived 100% of your initial 30-day billing cycle. No manual payment proof is required to evaluate your hosting container.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenDashboard('/dashboard/services')}
                        className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Server className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Manage Active Services</span>
                      </button>
                    </div>
                  ) : postOrderPaymentSubmitted ? (
                    <div className="rounded-xl border border-emerald-200 bg-[#F2FAF8] p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Payment Details Submitted for Invoice {completedOrders.invoiceId}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Your payment reference{' '}
                        {transactionRef.trim() ? (
                          <span className="font-mono font-bold text-[#0F172A]">{transactionRef.trim()}</span>
                        ) : (
                          'has been'
                        )}{' '}
                        logged under <strong>{activePostGateway?.name}</strong>. Billing verification &amp; automated provisioning will proceed shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenDashboard(`/dashboard/billing/${completedOrders.invoiceId}`)}
                        className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Open Dedicated Invoice Page</span>
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmitPostOrderPayment}
                      className="rounded-xl border border-[#CBD5E1] bg-white p-5 space-y-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h2 className="font-display text-sm font-bold text-[#0F172A]">
                            Submit Payment Details for Invoice {completedOrders.invoiceId}
                          </h2>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Transfer the invoice total using the gateway account below and enter your Transaction ID (TID). You can also submit this later from your invoice page.
                          </p>
                        </div>
                        {activePostGateway && (
                          <span className="font-mono text-[11px] font-semibold text-[#0E6B63]">
                            {activePostGateway.currencyHint}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {enabledGateways.map((gw) => {
                          const isSelected = activePostGateway?.id === gw.id;
                          return (
                            <button
                              key={gw.id}
                              type="button"
                              onClick={() => {
                                setPostOrderGatewayId(gw.id);
                                setPostOrderPaymentError('');
                              }}
                              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                  : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 font-bold text-[#0F172A]">
                                  {renderGatewayIcon(gw.kind)}
                                  <span>{gw.name}</span>
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">{gw.bankOrProviderName}</p>
                            </button>
                          );
                        })}
                      </div>

                      {activePostGateway &&
                        (activePostGateway.accountTitle || activePostGateway.accountNumber || activePostGateway.instructions) && (
                          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                            {activePostGateway.accountTitle && (
                              <p className="text-slate-600">
                                Account Title:{' '}
                                <strong className="text-[#0F172A]">{activePostGateway.accountTitle}</strong>
                              </p>
                            )}
                            {activePostGateway.accountNumber && (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-slate-600">
                                  Account / Wallet / IBAN:{' '}
                                  <strong className="text-[#0E6B63] font-mono">
                                    {activePostGateway.accountNumber}
                                  </strong>
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(activePostGateway.accountNumber || '');
                                    setCopiedAccountField(activePostGateway.id);
                                    setTimeout(() => setCopiedAccountField(null), 1800);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white text-[11px] font-semibold text-[#0F172A] hover:border-[#0E6B63] cursor-pointer"
                                >
                                  {copiedAccountField === activePostGateway.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-[#16A34A]" aria-hidden="true" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" aria-hidden="true" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            {activePostGateway.instructions && (
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {activePostGateway.instructions}
                              </p>
                            )}
                          </div>
                        )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                            Transaction ID / Reference (TID){' '}
                            {activePostGateway?.requiresTransactionId ? '*' : '(Optional)'}
                          </label>
                          <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => {
                              setTransactionRef(e.target.value);
                              setPostOrderPaymentError('');
                            }}
                            placeholder="e.g. TRX-98234190 or sender mobile"
                            className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                            Sender / Payment Details Note (Optional)
                          </label>
                          <input
                            type="text"
                            value={postOrderDetailsNote}
                            onChange={(e) => setPostOrderDetailsNote(e.target.value)}
                            placeholder="e.g. Sent from HBL account / sender name"
                            className="w-full min-h-[42px] px-3.5 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                          />
                        </div>
                      </div>

                      {postOrderPaymentError && (
                        <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {postOrderPaymentError}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                          type="submit"
                          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>Submit Payment Proof</span>
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => {
                        const targetInv =
                          invoices.find(
                            (i) =>
                              i.id === completedOrders.invoiceId ||
                              i.id === completedOrders.secondaryInvoiceId
                          ) || invoices[0];
                        if (targetInv) {
                          downloadInvoicePdf(
                            targetInv,
                            invoiceTemplateConfig,
                            paymentMethods,
                            {
                              code: currency.code,
                              symbol: currency.symbol,
                              rate,
                              decimals: currency.decimals,
                              spaceAfterSymbol: currency.spaceAfterSymbol,
                              formattedTotal: formatPrice(targetInv.amountUsd),
                            }
                          );
                        }
                      }}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-[#0F172A] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                      <span>Download PDF Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDashboard(`/dashboard/billing/${completedOrders.invoiceId}`)}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#0E6B63] bg-[#F2FAF8] hover:bg-[#E2ECE9] text-[#0E6B63] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <Receipt className="w-4 h-4" aria-hidden="true" />
                      <span>Open Invoice &amp; Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDashboard('/dashboard/services')}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                    >
                      <span>My Services</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        ) : viewMode === 'catalog' ? (
          /* ======================== UPMIND ENTERPRISE CATALOG VIEW ======================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT SIDEBAR: CATEGORIES (Upmind-Style) */}
            <aside className="lg:col-span-3 space-y-4">
              <div className="border-b border-[#E2E8F0] pb-2.5">
                <h2 className="text-xs font-bold tracking-wider uppercase text-[#0F172A]">
                  Categories
                </h2>
              </div>

              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={catalogCategorySearch}
                  onChange={(e) => setCatalogCategorySearch(e.target.value)}
                  placeholder="Category search"
                  className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <nav aria-label="Service categories" className="space-y-3 text-sm">
                {/* Hosting Category Group */}
                <div>
                  <button
                    type="button"
                    onClick={() => setHostingGroupOpen(!hostingGroupOpen)}
                    className="w-full flex items-center justify-between py-1.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-[#0F172A] cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {hostingGroupOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Hosting</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                      {filteredHostingCats.reduce((acc, c) => acc + c.plans.length, 0)}
                    </span>
                  </button>

                  {hostingGroupOpen && (
                    <ul className="mt-1 space-y-0.5 pl-2">
                      {filteredHostingCats.map((cat) => {
                        const isSelected = catalogCategory === cat.id;
                        return (
                          <li key={cat.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogCategory(cat.id);
                                setCatalogProductSearch('');
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E6F4F2] text-[#0E6B63] font-bold'
                                  : 'text-slate-700 hover:bg-slate-100 font-medium'
                              }`}
                            >
                              <span className="truncate">{cat.label}</span>
                              <span
                                className={`font-mono tabular-nums text-[11px] shrink-0 ${
                                  isSelected ? 'text-[#0E6B63]' : 'text-slate-400'
                                }`}
                              >
                                {cat.plans.length}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Domains Category Group */}
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setDomainGroupOpen(!domainGroupOpen)}
                    className="w-full flex items-center justify-between py-1.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-[#0F172A] cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {domainGroupOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Domains</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                      {filteredDomainCats.length}
                    </span>
                  </button>

                  {domainGroupOpen && (
                    <ul className="mt-1 space-y-0.5 pl-2">
                      {filteredDomainCats.map((cat) => {
                        const isSelected = catalogCategory === cat.id;
                        return (
                          <li key={cat.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogCategory(cat.id);
                                setCatalogProductSearch('');
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E6F4F2] text-[#0E6B63] font-bold'
                                  : 'text-slate-700 hover:bg-slate-100 font-medium'
                              }`}
                            >
                              <span className="truncate">{cat.label}</span>
                              <span
                                className={`font-mono tabular-nums text-[11px] shrink-0 ${
                                  isSelected ? 'text-[#0E6B63]' : 'text-slate-400'
                                }`}
                              >
                                {cat.count}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </nav>
            </aside>

            {/* RIGHT MAIN AREA: SELECTED CATEGORY PRODUCTS (Upmind-Style) */}
            <main className="lg:col-span-9 space-y-6">
              <div className="border-b border-[#E2E8F0] pb-2.5 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#0F172A]">
                  {CATEGORY_LABELS[catalogCategory]}
                </h1>
                <span className="text-xs text-slate-500">
                  Showing prices in <strong className="text-[#0F172A]">{currency.code}</strong>
                </span>
              </div>

              {catalogCategory !== 'domain-registration' &&
              catalogCategory !== 'domain-transfer' ? (
                <>
                  {/* Product Search Input */}
                  <div className="relative">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={catalogProductSearch}
                      onChange={(e) => setCatalogProductSearch(e.target.value)}
                      placeholder="Product search"
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>

                  {/* 3-Column Clean Product Grid (Only Plans in Selected Category) */}
                  {activeCatalogPlans.length === 0 ? (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        No matching plans in {CATEGORY_LABELS[catalogCategory]}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCatalogProductSearch('')}
                        className="mt-3 text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                      >
                        Clear search filter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeCatalogPlans.map((plan) => (
                        <article
                          key={plan.id}
                          className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between hover:border-[#0E6B63]/60 transition-colors"
                        >
                          <div>
                            <div className="py-4">
                              <CatalogProductEmblem category={catalogCategory} />
                            </div>

                            <h3 className="font-display text-base font-bold text-[#0F172A] mt-2">
                              {plan.name}
                            </h3>
                            <p className="font-mono tabular-nums text-xs font-semibold text-slate-600 mt-1">
                              From {formatPrice(plan.monthlyPrice)} a month
                            </p>
                            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                              {plan.audience} · {plan.storage} · {plan.backups}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectPlanFromCatalog(catalogCategory, plan)}
                            className="mt-5 w-full min-h-[40px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add to cart</span>
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : catalogCategory === 'domain-registration' ? (
                /* Domain Registration inside Catalog */
                <div className="space-y-5">
                  {lastSearchedDomain && lastSearchedDomain.mode === 'register' && lastSearchedDomain.available && (
                    <div className="bg-white border border-[#0E6B63] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#0E6B63]">
                          Already Searched on Site · Ready to Register
                        </p>
                        <p className="font-mono text-lg font-bold text-[#0F172A] mt-0.5">
                          {lastSearchedDomain.domain}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lastSearchedDomain.minYears === 2 ? '2 Years Term' : '1 Year Term'} · Renews at{' '}
                          {formatPrice(lastSearchedDomain.renewalUsd)}/yr
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-mono tabular-nums text-lg font-extrabold text-[#0F172A]">
                          {formatPrice(lastSearchedDomain.priceUsd)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectDomainFromCatalog('register', {
                              domain: lastSearchedDomain.domain,
                              tld: lastSearchedDomain.tld,
                              minYears: lastSearchedDomain.minYears,
                              priceUsd: lastSearchedDomain.priceUsd,
                              renewalUsd: lastSearchedDomain.renewalUsd,
                              available: true,
                              popular: true,
                            })
                          }
                          className="min-h-[40px] inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Add to cart</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleDomainSearch} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        value={domainSearchQuery}
                        onChange={(e) => {
                          setDomainSearchQuery(e.target.value);
                          setDomainSearchError('');
                        }}
                        placeholder="Search domain name (e.g. yourbrand.com)"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searchingDomains}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-[#0F172A] hover:bg-[#0E6B63] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      {searchingDomains ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Search Domain</span>
                      )}
                    </button>
                  </form>

                  {domainSearchError && (
                    <p className="text-xs font-semibold text-[#DC2626]">{domainSearchError}</p>
                  )}

                  {domainResults.length > 0 && (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden">
                      {domainResults.map((item) => (
                        <div
                          key={item.domain}
                          className="px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-[#0F172A]">
                                {item.domain}
                              </span>
                              <span
                                className={`text-[11px] font-semibold ${
                                  item.available ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                }`}
                              >
                                {item.available ? 'Available' : 'Registered'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.minYears === 2 ? '2-Year Mandatory Term' : '1-Year Term'} · Renews at{' '}
                              {formatPrice(item.renewalUsd)}/yr
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono tabular-nums text-sm font-extrabold text-[#0F172A]">
                              {formatPrice(item.priceUsd)}
                            </span>
                            {item.available ? (
                              <button
                                type="button"
                                onClick={() => handleSelectDomainFromCatalog('register', item)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Add to cart</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectDomainFromCatalog('transfer', undefined, item.domain)
                                }
                                className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:border-[#0E6B63] cursor-pointer"
                              >
                                Transfer Instead
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enabled TLD Pricing Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enabledTlds.slice(0, 6).map((tld) => {
                      const priceUsd = tld.minYears === 2 ? tld.year2Usd : tld.year1Usd;
                      return (
                        <div
                          key={tld.id}
                          className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-display text-lg font-extrabold text-[#0F172A]">
                                {tld.tld}
                              </span>
                              <span className="font-mono tabular-nums text-sm font-bold text-[#0E6B63]">
                                {formatPrice(priceUsd)}/{tld.minYears === 2 ? '2yr' : 'yr'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                              {tld.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDomainSearchQuery(`yourbrand${tld.tld}`);
                            }}
                            className="mt-4 w-full py-2 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] hover:text-[#0E6B63] cursor-pointer transition-colors"
                          >
                            Search {tld.tld}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Domain Transfer inside Catalog */
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                      Transfer Existing Domain
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Includes +1 year automatic renewal extension and zero-downtime DNS migration.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={transferDomainInput}
                      onChange={(e) => setTransferDomainInput(e.target.value)}
                      placeholder="Enter domain to transfer (e.g. mycompany.com)"
                      className="flex-1 min-h-[44px] px-4 py-2 text-sm font-mono bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectDomainFromCatalog(
                          'transfer',
                          undefined,
                          transferDomainInput.trim()
                        )
                      }
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                      <span>Continue Transfer</span>
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        ) : (
          /* ======================== FOCUSED ENTERPRISE CHECKOUT VIEW ======================== */
          <>
            {/* Progress Stepper */}
            <nav aria-label="Checkout progress" className="mb-8">
              <ol
                className={`grid gap-3 ${
                  isDomainOnly ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                {!isDomainOnly && (
                  <li>
                    <button
                      type="button"
                      disabled={step === 1}
                      onClick={() => setStep(1)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                        step === 1
                          ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                          : step > 1
                          ? 'bg-white border-[#E2E8F0] hover:border-[#0E6B63] cursor-pointer'
                          : 'bg-white/60 border-[#E2E8F0] opacity-70'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          step === 1
                            ? 'bg-[#0E6B63] text-white'
                            : step > 1
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {step > 1 ? <Check className="w-3.5 h-3.5" /> : 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] truncate">
                          Billing Period
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Cycle &amp; Datacenter
                        </div>
                      </div>
                    </button>
                  </li>
                )}

                <li>
                  <button
                    type="button"
                    disabled={step === 2}
                    onClick={() => setStep(2)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                      step === 2
                        ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                        : step > 2
                        ? 'bg-white border-[#E2E8F0] hover:border-[#0E6B63] cursor-pointer'
                        : 'bg-white/60 border-[#E2E8F0] opacity-70'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        step === 2
                          ? 'bg-[#0E6B63] text-white'
                          : step > 2
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step > 2 ? <Check className="w-3.5 h-3.5" /> : isDomainOnly ? 1 : 2}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        {isDomainOnly
                          ? 'Domain & DNS'
                          : isCompute
                          ? 'Server & OS Setup'
                          : 'Domain Name'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {isCompute
                          ? 'OS, Panel & SSH Auth'
                          : domainOption === 'transfer'
                          ? 'EPP & Unlock'
                          : 'Domain & Nameservers'}
                      </div>
                    </div>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    disabled={step < 3}
                    onClick={() => setStep(3)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                      step === 3
                        ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                        : step > 3
                        ? 'bg-white border-[#E2E8F0] hover:border-[#0E6B63] cursor-pointer'
                        : 'bg-white/60 border-[#E2E8F0] opacity-70'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        step === 3
                          ? 'bg-[#0E6B63] text-white'
                          : step > 3
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step > 3 ? <Check className="w-3.5 h-3.5" /> : isDomainOnly ? 2 : 3}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        Review &amp; Promo
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Verify &amp; discounts
                      </div>
                    </div>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    disabled={step < 4}
                    onClick={() => {
                      if (currentUser && step >= 3) setStep(4);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                      step === 4
                        ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                        : 'bg-white/60 border-[#E2E8F0] opacity-70'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        step === 4 ? 'bg-[#0E6B63] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDomainOnly ? 3 : 4}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">Payment</div>
                      <div className="text-[11px] text-slate-500 truncate">Complete order</div>
                    </div>
                  </button>
                </li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
              {/* LEFT MAIN WORKSPACE (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                    {/* ==================== STEP 1: SELECTED PLAN + BILLING PERIOD ==================== */}
                {!isDomainOnly && step === 1 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-[#0E6B63]">
                        Step 1 of 4 · {isCompute ? 'Compute Hardware & Region' : 'Plan & Datacenter Configuration'}
                      </p>
                      <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                        {isFreeTrialMode
                          ? `Start 30-Day Free Trial — ${activePlan.name}`
                          : `Configure ${activePlan.name}`}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        {isFreeTrialMode
                          ? 'Evaluate full NVMe cloud resources for 30 days with $0.00 charged today. Standard renewal begins Day 31.'
                          : isCompute
                          ? 'Choose your KVM hardware tier, billing duration, regional datacenter, and NVMe/SSD storage architecture.'
                          : `Select your billing cycle and server node for ${activePlan.name}. Multi-year cycles lock discounted pricing.`}
                      </p>
                    </div>

                    {/* Focused Single Selected Plan Card */}
                    <div className="p-4 sm:p-5 rounded-xl border border-[#0E6B63]/35 bg-[#F4FAF9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#0E6B63] font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Selected Plan · {CATEGORY_LABELS[activeCategory]}</span>
                        </div>
                        <h2 className="font-display text-lg font-extrabold text-[#0F172A] mt-1">
                          {activePlan.name}
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {activePlan.storage} · {activePlan.bandwidth} · {activePlan.ssl} · {activePlan.backups}
                        </p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <span className="font-mono tabular-nums text-base font-extrabold text-[#0F172A]">
                          {isFreeTrialMode ? '$0.00 today' : `${formatPrice(activePlan.monthlyPrice)}/mo`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (orderCategory === 'catalog') {
                              setViewMode('catalog');
                              setCatalogCategory(activeCategory);
                            } else {
                              onBackToSharedHosting();
                            }
                          }}
                          className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Change Plan
                        </button>
                      </div>
                    </div>

                    {/* Tier Quick-Switcher for Free Trial Plans and Compute Hardware Tiers */}
                    {(isCompute || isFreeTrialMode) && categoryPlans.length > 1 && (
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                          {isFreeTrialMode
                            ? 'Switch 30-Day Free Trial Tier'
                            : isN8nCompute
                            ? 'Switch n8n Dedicated Compute Tier'
                            : 'Switch KVM Hardware Tier'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {categoryPlans.map((tier) => {
                            const selected = tier.id === activePlan.id;
                            return (
                              <button
                                key={tier.id}
                                type="button"
                                onClick={() => setSelectedPlanId(tier.id)}
                                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                                  selected
                                    ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="text-xs font-bold text-[#0F172A] truncate">
                                  {tier.name}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {tier.storage}
                                </div>
                                <div className="font-mono tabular-nums text-xs font-bold text-[#0E6B63] mt-1.5">
                                  {isFreeTrialMode
                                    ? `$0.00 · then ${formatPrice(tier.monthlyPrice)}/mo`
                                    : `${formatPrice(tier.monthlyPrice)}/mo`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Billing Period Selector */}
                    {isFreeTrialMode ? (
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                          Trial Evaluation Period
                        </label>
                        <div className="p-4 rounded-xl border border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                              <span className="font-display text-base font-bold text-[#0F172A]">
                                30-Day Free Trial (1 Month Cycle · $0.00 Due Today)
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              Promo <span className="font-mono font-bold text-[#0F172A]">STARTFREE</span> automatically waives your first 30 days. Standard renewal at {formatPrice(activePlan.monthlyPrice)}/mo applies on Day 31 unless cancelled.
                            </p>
                          </div>
                          <span className="font-mono tabular-nums text-2xl font-extrabold text-[#16A34A] shrink-0">
                            {formatPrice(0)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                          Select Billing Period
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {BILLING_PERIODS.map((period) => {
                            const calc = computePlanCyclePrice(activePlan, period.id);
                            const isSelected = billingCycle === period.id;
                            const hasFreeComWithPeriod =
                              isSharedOrCpanelPlan &&
                              (period.id === '1 Year' || period.id === '2 Years' || period.id === '4 Years');
                            return (
                              <button
                                key={period.id}
                                type="button"
                                onClick={() => setBillingCycle(period.id)}
                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-display text-base font-bold text-[#0F172A]">
                                    {period.label}
                                  </span>
                                  {period.badge && (
                                    <span
                                      className={`text-[11px] font-bold ${
                                        isSelected ? 'text-[#0E6B63]' : 'text-slate-500'
                                      }`}
                                    >
                                      {period.badge}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="font-mono tabular-nums text-xl font-extrabold text-[#0F172A]">
                                    {formatPrice(calc.priceUsd)}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    ({formatPrice(calc.effectiveMonthlyUsd)}/mo avg)
                                  </span>
                                </div>

                                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">{period.sublabel}</span>
                                  {calc.savingsUsd > 0 && (
                                    <span className="font-mono font-semibold text-[#16A34A]">
                                      Save {formatPrice(calc.savingsUsd)}
                                    </span>
                                  )}
                                </div>
                                {hasFreeComWithPeriod && (
                                  <p className="mt-1.5 text-[11px] font-semibold text-[#0E6B63]">
                                    + 1 Free .com Domain (Year 1 only · Hosting runs {period.label})
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {isSharedOrCpanelPlan && (
                          <p className="mt-2.5 text-xs text-[#0E6B63] font-medium">
                            Includes 1 Free .com Domain (1 Year only) on 1Y, 2Y &amp; 4Y plans — hosting remains active for your full selected cycle while the free .com domain covers Year 1.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Datacenter Location Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-[#0F172A]">
                          Datacenter Location
                        </label>
                        {isWinOnly && (
                          <span className="text-[11px] font-semibold text-[#0E6B63]">
                            Strict UK Cluster (London)
                          </span>
                        )}
                        {isCpanel && (
                          <span className="text-[11px] font-semibold text-blue-700">
                            Strict USA Cluster (Dallas NVMe)
                          </span>
                        )}
                        {activeCategory === 'wordpress-hosting' && (
                          <span className="text-[11px] font-semibold text-[#0E6B63]">
                            3 Multi-Region WordPress Nodes (UK · USA · Singapore)
                          </span>
                        )}
                        {isCompute && (
                          <span className="text-[11px] font-semibold text-[#0E6B63]">
                            4 Low-Latency KVM Compute Hubs
                          </span>
                        )}
                      </div>

                      {isCompute ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {COMPUTE_DATACENTERS.map((dc) => {
                            const isSelected = activeDatacenter.id === dc.id;
                            return (
                              <button
                                key={dc.id}
                                type="button"
                                onClick={() => setDatacenterId(dc.id)}
                                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <MapPin
                                    className={`w-4 h-4 shrink-0 ${
                                      isSelected ? 'text-[#0E6B63]' : 'text-slate-400'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-[#0F172A] truncate">
                                      {dc.city}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate">
                                      {dc.clusterLabel}
                                    </div>
                                  </div>
                                </div>
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0E6B63] shrink-0">
                                  {dc.flagCode}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {SHARED_DATACENTERS.map((dc) => {
                            const isLockedOut =
                              (isWinOnly && dc.id !== 'uk') || (isCpanel && dc.id !== 'us');
                            const isSelected = activeDatacenter.id === dc.id;

                            if (isLockedOut) return null;

                            return (
                              <button
                                key={dc.id}
                                type="button"
                                onClick={() => setDatacenterId(dc.id)}
                                className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                }`}
                              >
                                <MapPin
                                  className={`w-4 h-4 shrink-0 ${
                                    isSelected ? 'text-[#0E6B63]' : 'text-slate-400'
                                  }`}
                                  aria-hidden="true"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#0F172A] truncate">
                                    {dc.city}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {dc.latencyLabel}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Storage Architecture Picker for VPS / n8n */}
                    {isCompute && (
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                          Storage Architecture Mode
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(
                            [
                              {
                                id: 'NVMe High-IOPS' as const,
                                desc: 'PCIe Gen4 NVMe RAID-10 · Maximum database & queue throughput',
                              },
                              {
                                id: 'SSD High-Capacity' as const,
                                desc: 'Enterprise SATA/SAS SSD array · Balanced capacity & snapshots',
                              },
                            ] as const
                          ).map((mode) => {
                            const selected = computeStorageMode === mode.id;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setComputeStorageMode(mode.id)}
                                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                  selected
                                    ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                                    <HardDrive className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                                    {mode.id}
                                  </span>
                                  {selected && (
                                    <CheckCircle2 className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{mode.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          persistDraft(2);
                          setStep(2);
                        }}
                        className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>
                          {isCompute ? 'Continue to OS & Server Config' : 'Continue to Domain'}
                        </span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== STEP 2: SERVER CONFIGURATOR (VPS/n8n) OR DOMAIN SETUP ==================== */}
                {step === 2 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6">
                    {isCompute ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-[#0E6B63]">
                            Step 2 of 4 · Hostinger-Style Server &amp; OS Setup
                          </p>
                          <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                            {isN8nCompute
                              ? 'Configure Your n8n Automation Stack'
                              : 'Select Operating System, Control Panel & Root Auth'}
                          </h1>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            {isN8nCompute
                              ? 'Pick your containerized n8n + Postgres stack, webhook subdomain, SSH credentials, and automated snapshot schedule. No domain purchase required.'
                              : 'Deploy a clean Linux distribution, pre-installed hosting panel, or Docker stack with dedicated root authentication. Domain registration is skipped for unmanaged compute.'}
                          </p>
                        </div>

                        {/* OS / Panel / n8n Stack Selector */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="block text-xs font-semibold text-[#0F172A]">
                              {isN8nCompute
                                ? 'Select n8n Orchestration Image'
                                : 'Select OS / Control Panel / App Image'}
                            </label>
                            <span className="font-mono text-[11px] text-[#0E6B63] font-semibold">
                              Selected: {activeComputeTemplate.name} ({activeComputeTemplate.version})
                            </span>
                          </div>

                          {!isN8nCompute && (
                            <div className="flex flex-wrap gap-2">
                              {(
                                [
                                  { id: 'all' as const, label: 'All Images' },
                                  { id: 'plain-os' as const, label: 'Plain OS' },
                                  { id: 'os-panel' as const, label: 'Control Panel' },
                                  { id: 'app-docker' as const, label: 'Docker & Apps' },
                                ] as const
                              ).map((tab) => {
                                const active = computeOsTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setComputeOsTab(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                                      active
                                        ? 'border-[#0E6B63] bg-[#F4FAF9] text-[#0E6B63]'
                                        : 'border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                                  >
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {groupComputeTemplatesByName(
                              isN8nCompute
                                ? N8N_STACK_CATALOG
                                : computeOsTab === 'all'
                                  ? VPS_OS_CATALOG
                                  : VPS_OS_CATALOG.filter((tpl) => tpl.category === computeOsTab)
                            ).map((family) => {
                              const activeVersion =
                                family.versions.find((v) => v.id === activeComputeTemplate.id) ??
                                family.versions[0];
                              const isFamilySelected = family.versions.some(
                                (v) => v.id === activeComputeTemplate.id
                              );
                              return (
                                <div
                                  key={family.familyKey}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedOsId(activeVersion.id);
                                    setStep2Error('');
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setSelectedOsId(activeVersion.id);
                                      setStep2Error('');
                                    }
                                  }}
                                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isFamilySelected
                                      ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                      : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono text-xs font-extrabold shrink-0 ${
                                          isFamilySelected
                                            ? 'bg-[#0E6B63] text-white border-[#0E6B63]'
                                            : 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]'
                                        }`}
                                      >
                                        {family.badgeText}
                                      </div>
                                      <span className="text-sm font-bold text-[#0F172A] truncate">
                                        {family.name}
                                      </span>
                                    </div>
                                    {isFamilySelected && (
                                      <CheckCircle2
                                        className="w-4 h-4 text-[#0E6B63] shrink-0"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </div>

                                  <div
                                    className="mt-2.5 flex items-center justify-between gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[11px] font-medium text-slate-500">
                                      Version
                                    </span>
                                    <select
                                      aria-label={`${family.name} version`}
                                      value={activeVersion.id}
                                      onChange={(e) => {
                                        setSelectedOsId(e.target.value);
                                        setStep2Error('');
                                      }}
                                      className="max-w-[190px] w-full px-2.5 py-1.5 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white text-[#0F172A] focus:outline-none focus:border-[#0E6B63] cursor-pointer"
                                    >
                                      {family.versions.map((ver) => (
                                        <option key={ver.id} value={ver.id}>
                                          {ver.version}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hostname / Webhook FQDN */}
                        <div className="border-t border-[#E2E8F0] pt-5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="block text-xs font-semibold text-[#0F172A]">
                              {isN8nCompute
                                ? 'Webhook Endpoint Hostname / FQDN'
                                : 'Server Hostname (FQDN)'}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const suffix = Math.floor(10 + Math.random() * 89);
                                setComputeHostname(
                                  isN8nCompute
                                    ? `flows${suffix}.cpcloudhost.internal`
                                    : `node${suffix}.cpcloudhost.internal`
                                );
                                setStep2Error('');
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" aria-hidden="true" />
                              <span>Suggest Hostname</span>
                            </button>
                          </div>
                          <div className="relative">
                            <Terminal
                              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                              aria-hidden="true"
                            />
                            <input
                              type="text"
                              value={computeHostname}
                              onChange={(e) => {
                                setComputeHostname(e.target.value);
                                setStep2Error('');
                              }}
                              placeholder={
                                isN8nCompute
                                  ? 'flows.yourdomain.com or flows01.cpcloudhost.internal'
                                  : 'node01.yourdomain.com or node01.cpcloudhost.internal'
                              }
                              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm font-mono bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Used for reverse DNS (rDNS), automated TLS provisioning, and cloud-init system identity.
                          </p>
                        </div>

                        {/* Root Access Authentication Mode */}
                        <div className="border-t border-[#E2E8F0] pt-5 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                              Root / SSH Access Authentication
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {(
                                [
                                  { id: 'both' as const, label: 'Password + SSH Key', hint: 'Recommended flexibility' },
                                  { id: 'password' as const, label: 'Root Password Only', hint: 'Instant console login' },
                                  { id: 'ssh' as const, label: 'SSH Key Only (Hardened)', hint: 'Passwordless root' },
                                ] as const
                              ).map((mode) => {
                                const active = computeAuthMode === mode.id;
                                return (
                                  <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => {
                                      setComputeAuthMode(mode.id);
                                      setStep2Error('');
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                                      active
                                        ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                        : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="text-xs font-bold text-[#0F172A]">{mode.label}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{mode.hint}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {(computeAuthMode === 'password' || computeAuthMode === 'both') && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <label className="block text-xs font-semibold text-[#0F172A]">
                                  Root Password (Min 8 Characters)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setComputeRootPassword(generateStrongServerPassword());
                                    setShowRootPassword(true);
                                    setStep2Error('');
                                  }}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                  <span>Generate Strong Password</span>
                                </button>
                              </div>
                              <div className="relative">
                                <Lock
                                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                  aria-hidden="true"
                                />
                                <input
                                  type={showRootPassword ? 'text' : 'password'}
                                  value={computeRootPassword}
                                  onChange={(e) => {
                                    setComputeRootPassword(e.target.value);
                                    setStep2Error('');
                                  }}
                                  placeholder="Enter strong root password"
                                  className="w-full min-h-[44px] pl-10 pr-12 py-2 text-xs sm:text-sm font-mono bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowRootPassword((prev) => !prev)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                                  aria-label={showRootPassword ? 'Hide root password' : 'Show root password'}
                                >
                                  {showRootPassword ? (
                                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                                  ) : (
                                    <Eye className="w-4 h-4" aria-hidden="true" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {(computeAuthMode === 'ssh' || computeAuthMode === 'both') && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                                  SSH Key Label {computeAuthMode === 'ssh' ? '*' : '(Optional)'}
                                </label>
                                <div className="relative">
                                  <Key
                                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    aria-hidden="true"
                                  />
                                  <input
                                    type="text"
                                    value={computeSshKeyLabel}
                                    onChange={(e) => setComputeSshKeyLabel(e.target.value)}
                                    placeholder="e.g. Ops-MacBook-Pro"
                                    className="w-full min-h-[42px] pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                                  />
                                </div>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                                  SSH Public Key {computeAuthMode === 'ssh' ? '*' : '(Optional)'}
                                </label>
                                <textarea
                                  rows={2}
                                  value={computeSshPublicKey}
                                  onChange={(e) => {
                                    setComputeSshPublicKey(e.target.value);
                                    setStep2Error('');
                                  }}
                                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... dev@workstation"
                                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Backups & Optional Compute Add-ons */}
                        <div className="border-t border-[#E2E8F0] pt-5 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                              Automated Backups &amp; Snapshots Schedule
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {COMPUTE_BACKUP_ADDONS.map((opt) => {
                                const active = computeBackupAddon === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setComputeBackupAddon(opt.id)}
                                    className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                      active
                                        ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                        : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-bold text-[#0F172A]">{opt.name}</span>
                                      <span className="font-mono tabular-nums text-xs font-bold text-[#0E6B63]">
                                        {opt.monthlyPriceUsd === 0
                                          ? 'Included'
                                          : `+${formatPrice(opt.monthlyPriceUsd)}/mo`}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                      {opt.description}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label
                              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                computeDedicatedIpAddon
                                  ? 'border-[#0E6B63] bg-[#F4FAF9]'
                                  : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={computeDedicatedIpAddon}
                                onChange={(e) => setComputeDedicatedIpAddon(e.target.checked)}
                                className="mt-0.5 rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-bold text-[#0F172A]">Extra Dedicated IPv4</span>
                                  <span className="font-mono font-bold text-[#0E6B63]">
                                    +{formatPrice(3)}/mo
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Assign a secondary clean static IPv4 address for outbound mail or ingress isolation.
                                </p>
                              </div>
                            </label>

                            <label
                              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                computeFirewallAddon
                                  ? 'border-[#0E6B63] bg-[#F4FAF9]'
                                  : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={computeFirewallAddon}
                                onChange={(e) => setComputeFirewallAddon(e.target.checked)}
                                className="mt-0.5 rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-bold text-[#0F172A]">Managed Firewall Shield</span>
                                  <span className="font-mono font-bold text-[#0E6B63]">
                                    +{formatPrice(4)}/mo
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Edge L3/L4 port filtering, fail2ban telemetry, and automated malware quarantine.
                                </p>
                              </div>
                            </label>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                              Custom Initialization / Env Ports Note (Optional)
                            </label>
                            <input
                              type="text"
                              value={computeCustomEnvNote}
                              onChange={(e) => setComputeCustomEnvNote(e.target.value)}
                              placeholder={
                                isN8nCompute
                                  ? 'e.g. EXECUTIONS_MODE=queue · Open port 5678 & webhook TLS'
                                  : 'e.g. Open ports 80/443/22 · Mount /var/lib/docker on NVMe'
                              }
                              className="w-full min-h-[42px] px-3.5 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-[#0E6B63]">
                            {isDomainOnly ? 'Step 1 of 3' : 'Step 2 of 4'} · Domain &amp; DNS Setup
                          </p>
                          <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                            {isDomainOnly
                              ? activeCategory === 'domain-transfer'
                                ? 'Transfer Your Domain to CPCloudHost'
                                : 'Confirm Your Domain & Nameservers'
                              : 'Connect or Register Domain'}
                          </h1>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            {isDomainOnly
                              ? 'Includes Anycast nameservers and free WHOIS privacy protection.'
                              : 'Pair your cloud service with your domain, transfer an existing domain, or assign a staging hostname.'}
                          </p>
                        </div>

                        {/* Domain Option Tabs (Hosting Orders) */}
                        {!isDomainOnly && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { id: 'register' as const, label: 'Register New' },
                              { id: 'transfer' as const, label: 'Transfer In' },
                              { id: 'existing' as const, label: 'Use Existing' },
                              { id: 'later' as const, label: 'Add Later' },
                            ].map((opt) => {
                              const active = domainOption === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setDomainOption(opt.id);
                                    setStep2Error('');
                                  }}
                                  className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                                    active
                                      ? 'border-[#0E6B63] bg-[#F4FAF9] text-[#0E6B63] font-bold ring-1 ring-[#0E6B63]'
                                      : 'border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <span className="text-xs">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                    {/* ================= REGISTER NEW DOMAIN WORKFLOW ================= */}
                    {domainOption === 'register' && (
                      <div className="space-y-4">
                        {qualifiesPlanForFreeCom && (
                          <div className="p-3.5 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/30 text-xs text-[#0F172A]">
                            <strong>Free 1-Year .com Domain Promo Active:</strong> Your <strong>{billingCycle}</strong> hosting order includes <strong>1 Free .com Domain for Year 1</strong> ($0.00 today · renews annually after Year 1 while hosting stays active for {billingCycle}).
                          </div>
                        )}

                        {selectedNewDomain && (
                          <div className="p-4 sm:p-5 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start gap-3">
                              <CheckCircle2
                                className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <div>
                                <span className="text-[11px] font-semibold text-[#0E6B63] block">
                                  {isComCandidateSelected
                                    ? `Free 1-Year .com Promo Qualified · Available`
                                    : `Domain Locked from Your Search · Available`}
                                </span>
                                <span className="font-bold text-[#0F172A] block font-mono text-base mt-0.5">
                                  {selectedNewDomain.domain}
                                </span>
                                <span className="text-slate-600">
                                  {isComCandidateSelected
                                    ? `1 Year Free w/ ${billingCycle} Hosting · Renews at ${formatPrice(selectedNewDomain.renewalUsd)}/yr`
                                    : `${selectedNewDomain.minYears === 2 ? '2-Year Term' : '1-Year Term'} · Renews at ${formatPrice(selectedNewDomain.renewalUsd)}/yr`}
                                </span>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                              <span className="font-mono tabular-nums font-bold text-lg text-[#0E6B63]">
                                {isComCandidateSelected ? (
                                  <>
                                    {formatPrice(0)}{' '}
                                    <span className="text-xs line-through text-slate-400 font-normal">
                                      {formatPrice(selectedNewDomain.priceUsd)}
                                    </span>
                                  </>
                                ) : (
                                  formatPrice(selectedNewDomain.priceUsd)
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowDomainSearchBox((prev) => !prev)}
                                className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                              >
                                {showDomainSearchBox
                                  ? 'Hide domain search'
                                  : 'Search a different domain'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Domain Search Box (Shown only if no domain selected yet OR user explicitly wants to change it) */}
                        {(!selectedNewDomain || showDomainSearchBox) && (
                          <>
                            <form
                              onSubmit={handleDomainSearch}
                              className="flex flex-col sm:flex-row gap-2.5"
                            >
                              <div className="relative flex-1">
                                <Search
                                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                  aria-hidden="true"
                                />
                                <input
                                  type="text"
                                  value={domainSearchQuery}
                                  onChange={(e) => {
                                    setDomainSearchQuery(e.target.value);
                                    setDomainSearchError('');
                                  }}
                                  placeholder="Search domain (e.g. yourbrand.com or acmestudio)"
                                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={searchingDomains}
                                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#0E6B63] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                              >
                                {searchingDomains ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                    <span>Checking Registry...</span>
                                  </>
                                ) : (
                                  <span>Search Availability</span>
                                )}
                              </button>
                            </form>

                            {domainSearchError && (
                              <p className="text-xs font-semibold text-[#DC2626]">
                                {domainSearchError}
                              </p>
                            )}

                            {domainResults.length > 0 && (
                              <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden">
                                <div className="px-4 py-2 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  Recommended Domain Extensions
                                </div>
                                {domainResults.map((item) => {
                                  const isChosen = selectedNewDomain?.domain === item.domain;
                                  return (
                                    <div
                                      key={item.domain}
                                      className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs ${
                                        isChosen ? 'bg-[#F4FAF9]' : 'bg-white'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm font-bold text-[#0F172A]">
                                            {item.domain}
                                          </span>
                                          <span
                                            className={`text-[11px] font-bold ${
                                              item.available ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                            }`}
                                          >
                                            {item.available ? 'Available' : 'Registered'}
                                          </span>
                                          {item.minYears === 2 && (
                                            <span className="text-[11px] font-semibold text-amber-700">
                                              · 2-Year Mandatory Term
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          Renewal: {formatPrice(item.renewalUsd)}/yr · Free WHOIS Privacy &amp; Anycast DNS
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <span className="font-mono tabular-nums text-sm font-extrabold text-[#0F172A]">
                                          {qualifiesPlanForFreeCom && item.tld.toLowerCase() === '.com' ? (
                                            <span className="text-[#16A34A]">
                                              {formatPrice(0)} · Free Year 1
                                            </span>
                                          ) : (
                                            formatPrice(item.priceUsd)
                                          )}
                                        </span>
                                        {item.available ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedNewDomain(item);
                                              setShowDomainSearchBox(false);
                                              setStep2Error('');
                                              setLastSearchedDomain({
                                                domain: item.domain,
                                                tld: item.tld,
                                                available: true,
                                                priceUsd: item.priceUsd,
                                                renewalUsd: item.renewalUsd,
                                                minYears: item.minYears,
                                                mode: 'register',
                                                searchedAtUtc:
                                                  new Date().toISOString().replace('T', ' ').slice(0, 16) +
                                                  ' UTC',
                                              });
                                            }}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                              isChosen
                                                ? 'bg-[#16A34A] text-white'
                                                : 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
                                            }`}
                                          >
                                            {isChosen ? 'Selected' : 'Select Domain'}
                                          </button>
                                        ) : (
                                          <span className="text-[11px] font-semibold text-slate-400">
                                            Taken
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}

                        {/* ================= NAMESERVERS & DNS ROUTING ================= */}
                        <div className="mt-4 border border-[#CBD5E1] rounded-2xl p-5 bg-[#F8FAFC] space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                              <h3 className="font-display text-sm font-bold text-[#0F172A]">
                                Nameserver &amp; DNS Routing
                              </h3>
                            </div>
                            <span className="text-[11px] font-semibold text-[#0E6B63]">
                              DDoS Anycast Shield Included
                            </span>
                          </div>

                          <div className="space-y-3">
                            <label
                              className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                nameserversType === 'default'
                                  ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                                  : 'bg-white/70 border-[#E2E8F0] hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="nsOption"
                                  checked={nameserversType === 'default'}
                                  onChange={() => setNameserversType('default')}
                                  className="mt-1 text-[#0E6B63] focus:ring-[#0E6B63]"
                                />
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-[#0F172A] block">
                                    {activeCategory === 'shared-hosting'
                                      ? 'Use StackCP Cloud Nameservers (Default for Shared Hosting)'
                                      : 'Use CPCloudHost Anycast Cloud Nameservers (Recommended)'}
                                  </span>
                                  <p className="text-[11px] text-slate-500">
                                    Instant DNS propagation and automatic DNS zone synchronization for web and email.
                                  </p>
                                  <div className="pt-1 flex flex-wrap gap-3 text-[11px] font-mono text-[#0E6B63]">
                                    {activeCategory === 'shared-hosting' ? (
                                      <>
                                        <span>ns1.stackdns.com</span>
                                        <span>ns2.stackdns.com</span>
                                        <span>ns3.stackdns.com</span>
                                        <span>ns4.stackdns.com</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>ns1.cpcloudhost.com</span>
                                        <span>ns2.cpcloudhost.com</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </label>

                            <label
                              className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                nameserversType === 'custom'
                                  ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                                  : 'bg-white/70 border-[#E2E8F0] hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="nsOption"
                                  checked={nameserversType === 'custom'}
                                  onChange={() => setNameserversType('custom')}
                                  className="mt-1 text-[#0E6B63] focus:ring-[#0E6B63]"
                                />
                                <div className="space-y-1 w-full">
                                  <span className="text-xs font-bold text-[#0F172A] block">
                                    Use Custom External Nameservers
                                  </span>
                                  <p className="text-[11px] text-slate-500">
                                    Point your registered domain to external nameservers (e.g. Cloudflare, Route53, or private VPS).
                                  </p>

                                  {nameserversType === 'custom' && (
                                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                          Nameserver 1
                                        </label>
                                        <input
                                          type="text"
                                          value={customNs1}
                                          onChange={(e) => setCustomNs1(e.target.value)}
                                          placeholder="ns1.externalhost.com"
                                          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                          Nameserver 2
                                        </label>
                                        <input
                                          type="text"
                                          value={customNs2}
                                          onChange={(e) => setCustomNs2(e.target.value)}
                                          placeholder="ns2.externalhost.com"
                                          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </label>
                          </div>

                          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                                <div>
                                  <span className="font-bold text-[#0F172A] block">
                                    Free WHOIS Privacy Protection
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Mask your personal contact details from public registries and spammers.
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setWhoisPrivacyEnabled(!whoisPrivacyEnabled)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  whoisPrivacyEnabled
                                    ? 'bg-[#E6F4F2] text-[#0E6B63]'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {whoisPrivacyEnabled ? 'Included (Active)' : 'Disabled'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {currentUser ? (
                          <DomainContactAddressSelector
                            selectedContactId={selectedWhoisContact?.id || null}
                            onSelectContact={(addr) => {
                              setSelectedWhoisContact(addr);
                              setStep2Error('');
                            }}
                            title="WHOIS Registrant Contact & Address"
                            subtitle={`Saved to ${currentUser.email}. Select a saved address below or click Add Address to save your registrant details permanently to your account.`}
                          />
                        ) : (
                          <div className="border border-[#CBD5E1] rounded-xl bg-[#F8FAFC] p-5 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-[#0F172A]">
                                  Sign In or Create Account to Add WHOIS Registrant Address
                                </h3>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  WHOIS registrant contact addresses are saved securely to your verified client account so you can reuse them on renewals and future orders. Sign in or create an account and you will return directly to this step.
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleRequireAuthAtStep2('login')}
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                              >
                                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Sign In to Continue</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequireAuthAtStep2('register')}
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#0E6B63] bg-white hover:bg-[#F2FAF8] text-[#0E6B63] text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                              >
                                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Create Account</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ================= DOMAIN TRANSFER WORKFLOW ================= */}
                    {domainOption === 'transfer' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                            Domain Name to Transfer
                          </label>
                          <div className="relative">
                            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={transferDomainInput}
                              onChange={(e) => {
                                setTransferDomainInput(e.target.value);
                                setStep2Error('');
                              }}
                              placeholder="e.g. mycompany.com or brandportal.net"
                              className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                            />
                          </div>
                          {detectedTransferTld && (
                            <div className="mt-2 flex items-center justify-between text-xs p-3 bg-[#F2FAF8] border border-[#0E6B63]/20 rounded-xl">
                              <span className="text-slate-600">
                                Transfer Rate for <strong>{detectedTransferTld.tld}</strong> (includes 1-year automatic extension):
                              </span>
                              <span className="font-mono font-bold text-[#0E6B63]">
                                {formatPrice(transferPriceUsd)}
                              </span>
                            </div>
                          )}
                        </div>

                        <label className="flex items-start gap-3 p-3.5 bg-white border border-[#CBD5E1] rounded-xl cursor-pointer">
                          <input
                            type="checkbox"
                            checked={domainUnlockedChecked}
                            onChange={(e) => setDomainUnlockedChecked(e.target.checked)}
                            className="mt-0.5 rounded text-[#0E6B63] focus:ring-[#0E6B63]"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-[#0F172A] block">
                              I confirm my domain is UNLOCKED at current registrar
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Verify in your existing registrar dashboard that Registrar Lock / Transfer Lock is disabled and domain is at least 60 days old.
                            </span>
                          </div>
                        </label>

                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                            EPP / Authorization Code
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type={showEppSecret ? 'text' : 'password'}
                              value={eppAuthCode}
                              onChange={(e) => {
                                setEppAuthCode(e.target.value);
                                setStep2Error('');
                              }}
                              placeholder="Enter secret transfer authorization code"
                              className="w-full min-h-[46px] pl-10 pr-16 py-2.5 text-sm font-mono bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEppSecret(!showEppSecret)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                            >
                              {showEppSecret ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-2 text-xs">
                          <span className="font-bold text-[#0F172A] block">
                            Nameserver Strategy During Transfer:
                          </span>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="transferNs"
                                checked={transferStrategy === 'preserve'}
                                onChange={() => setTransferStrategy('preserve')}
                                className="text-[#0E6B63] focus:ring-[#0E6B63]"
                              />
                              <span>Keep existing nameservers (Recommended — Zero website downtime)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="transferNs"
                                checked={transferStrategy === 'cloud'}
                                onChange={() => setTransferStrategy('cloud')}
                                className="text-[#0E6B63] focus:ring-[#0E6B63]"
                              />
                              <span>
                                Switch to CPCloudHost Anycast Nameservers (ns1.cpcloudhost.com, ns2.cpcloudhost.com)
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-3 text-xs text-slate-800">
                          <Clock className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5" aria-hidden="true" />
                          <div className="leading-relaxed">
                            <span className="font-bold text-[#0F172A] block mb-0.5">
                              Transfer Approval &amp; Timeline
                            </span>
                            After placing your transfer order with your EPP code, approve the verification link sent to your registrant email to transfer immediately. If the email is not received or approved, your domain transfers automatically to our registrar within <strong>7 days</strong>.
                          </div>
                        </div>

                        {currentUser ? (
                          <DomainContactAddressSelector
                            selectedContactId={selectedWhoisContact?.id || null}
                            onSelectContact={(addr) => {
                              setSelectedWhoisContact(addr);
                              setStep2Error('');
                            }}
                            title="WHOIS Registrant Contact & Address"
                            subtitle={`Saved to ${currentUser.email}. Your WHOIS address stays saved automatically across all future transfers and domain orders.`}
                          />
                        ) : (
                          <div className="border border-[#CBD5E1] rounded-xl bg-[#F8FAFC] p-5 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-[#0F172A]">
                                  Sign In or Create Account to Add WHOIS Registrant Address
                                </h3>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  Sign in or register first so your WHOIS registrant contact details save directly to your account before completing this domain transfer.
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleRequireAuthAtStep2('login')}
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                              >
                                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Sign In to Continue</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequireAuthAtStep2('register')}
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#0E6B63] bg-white hover:bg-[#F2FAF8] text-[#0E6B63] text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
                              >
                                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Create Account</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ================= USE EXISTING DOMAIN ================= */}
                    {domainOption === 'existing' && (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-[#0F172A]">
                          Enter Your Existing Domain Name
                        </label>
                        <div className="relative">
                          <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={existingDomainInput}
                            onChange={(e) => {
                              setExistingDomainInput(e.target.value);
                              setStep2Error('');
                            }}
                            placeholder="yourcompany.com"
                            className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          After order activation, update your registrar nameservers to{' '}
                          <span className="font-mono font-semibold text-[#0F172A]">
                            ns1.cpcloudhost.com
                          </span>{' '}
                          and{' '}
                          <span className="font-mono font-semibold text-[#0F172A]">
                            ns2.cpcloudhost.com
                          </span>
                          .
                        </p>
                      </div>
                    )}

                    {/* ================= ADD DOMAIN LATER ================= */}
                    {domainOption === 'later' && (
                      <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs text-slate-600 leading-relaxed">
                        <strong className="text-[#0F172A] block mb-1">
                          Proceed with Temporary Cloud Staging Hostname
                        </strong>
                        We will provision your cloud container on a sandbox URL. You can map or register your custom domain at any time directly from the Client Dashboard.
                      </div>
                    )}
                      </>
                    )}

                    {step2Error && (
                      <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                        {step2Error}
                      </p>
                    )}

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                      {!isDomainOnly && (
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Back</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleContinueFromStep2}
                        className="ml-auto min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>Continue to Review</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== STEP 3: CHECKOUT REVIEW & PROMO CODE ==================== */}
                {step === 3 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-[#0E6B63]">
                        {isDomainOnly ? 'Step 2 of 3' : 'Step 3 of 4'} · Order Summary &amp; Verification
                      </p>
                      <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                        Review Configuration &amp; Apply Promo Code
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Verify your items, datacenter node, renewal terms, and apply active discount codes.
                      </p>
                    </div>

                    <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden text-xs">
                      {!isDomainOnly && (
                        <div className="p-4 flex items-center justify-between gap-4 bg-white">
                          <div>
                            <div className="font-display text-sm font-bold text-[#0F172A]">
                              {activePlan.name} — {CATEGORY_LABELS[activeCategory]}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              Term: <strong>{billingCycle}</strong> · Node:{' '}
                              <strong>{activeDatacenter.city}</strong>
                              {isCompute ? ` · Storage: ${computeStorageMode}` : ''}
                            </div>
                            <div className="text-[#0E6B63] font-semibold mt-1">
                              {isFreeTrialMode
                                ? `30-Day Free Trial ($0.00 today) · Renews Day 31 at ${formatPrice(activePlan.monthlyPrice)}/mo`
                                : `Renews at ${formatPrice(activePlan.yearlyPrice || activePlan.monthlyPrice * 12)} / year on expiration`}
                            </div>
                          </div>
                          <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                            {formatPrice(hostingPricing.priceUsd)}
                          </div>
                        </div>
                      )}

                      {isCompute ? (
                        <>
                          <div className="p-4 flex items-start justify-between gap-4 bg-white">
                            <div className="space-y-1">
                              <div className="font-semibold text-[#0F172A]">
                                {isN8nCompute ? 'n8n Stack Template:' : 'OS & Control Panel:'}{' '}
                                {activeComputeTemplate.name} ({activeComputeTemplate.version})
                              </div>
                              <div className="text-slate-500">
                                Panel / Runtime: <strong className="text-[#0F172A]">{activeComputeTemplate.controlPanelOrStack}</strong>
                              </div>
                              <div className="text-slate-500">
                                Hostname: <span className="font-mono font-semibold text-[#0E6B63]">{computeHostname}</span> · Root Auth:{' '}
                                <strong className="text-[#0F172A]">
                                  {computeAuthMode === 'both'
                                    ? 'Root Password + SSH Key'
                                    : computeAuthMode === 'ssh'
                                    ? 'SSH Key Only'
                                    : 'Root Password'}
                                </strong>
                                {computeSshKeyLabel.trim() ? ` (${computeSshKeyLabel.trim()})` : ''}
                              </div>
                              {computeCustomEnvNote.trim() && (
                                <div className="text-[11px] text-slate-500 font-mono">
                                  Init Note: {computeCustomEnvNote.trim()}
                                </div>
                              )}
                            </div>
                            <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0E6B63] shrink-0">
                              Included
                            </div>
                          </div>

                          {activeBackupOption.id !== 'none' && (
                            <div className="p-4 flex items-center justify-between gap-4 bg-white">
                              <div>
                                <div className="font-semibold text-[#0F172A]">
                                  Backup Schedule: {activeBackupOption.name}
                                </div>
                                <div className="text-slate-500 mt-0.5">
                                  {formatPrice(activeBackupOption.monthlyPriceUsd)}/mo × {computeCycleMonths} mo
                                </div>
                              </div>
                              <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                                {formatPrice(activeBackupOption.monthlyPriceUsd * computeCycleMonths)}
                              </div>
                            </div>
                          )}

                          {computeDedicatedIpAddon && (
                            <div className="p-4 flex items-center justify-between gap-4 bg-white">
                              <div>
                                <div className="font-semibold text-[#0F172A]">Extra Dedicated IPv4 Address</div>
                                <div className="text-slate-500 mt-0.5">
                                  {formatPrice(3)}/mo × {computeCycleMonths} mo
                                </div>
                              </div>
                              <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                                {formatPrice(3 * computeCycleMonths)}
                              </div>
                            </div>
                          )}

                          {computeFirewallAddon && (
                            <div className="p-4 flex items-center justify-between gap-4 bg-white">
                              <div>
                                <div className="font-semibold text-[#0F172A]">Managed Firewall Shield</div>
                                <div className="text-slate-500 mt-0.5">
                                  {formatPrice(4)}/mo × {computeCycleMonths} mo
                                </div>
                              </div>
                              <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                                {formatPrice(4 * computeCycleMonths)}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-4 flex items-center justify-between gap-4 bg-white">
                          <div>
                            <div className="font-semibold text-[#0F172A]">
                              {domainOption === 'register' && selectedNewDomain
                                ? `Domain Registration: ${selectedNewDomain.domain}`
                                : domainOption === 'transfer'
                                ? `Domain Transfer: ${transferDomainInput}`
                                : domainOption === 'existing'
                                ? `Existing Domain: ${existingDomainInput}`
                                : 'Temporary Staging Hostname'}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              {domainOption === 'register' && selectedNewDomain
                                ? `${isComCandidateSelected ? '1 Year Free (.com Promo)' : selectedNewDomain.minYears === 2 ? '2 Years Term' : '1 Year Term'} · Nameservers: ${
                                    nameserversType === 'default'
                                      ? activeCategory === 'shared-hosting'
                                        ? 'ns1..ns4.stackdns.com'
                                        : 'CPCloudHost Anycast'
                                      : 'Custom'
                                  } · WHOIS Privacy Included`
                                : domainOption === 'transfer'
                                ? `Includes 1-Year Extension · Nameservers: ${
                                    transferStrategy === 'cloud' ? 'CPCloudHost Anycast' : 'Preserved'
                                  } · EPP Verified`
                                : domainOption === 'existing'
                                ? 'Nameserver configuration post-provisioning'
                                : 'Standard development subdomain provided'}
                            </div>
                            {(domainOption === 'register' || domainOption === 'transfer') && (
                              <div className="space-y-1 mt-1">
                                <div className="text-[#0E6B63] font-semibold">
                                  Renewal Rate:{' '}
                                  {formatPrice(
                                    selectedNewDomain?.renewalUsd ||
                                      detectedTransferTld?.renewalUsd ||
                                      getPricingForTld('.com').renewalPrice
                                  )}{' '}
                                  / year {isComCandidateSelected ? `(Free Year 1 · Hosting runs ${billingCycle})` : ''}
                                </div>
                                {selectedWhoisContact && (
                                  <div className="text-slate-600">
                                    WHOIS Registrant:{' '}
                                    <strong className="text-[#0F172A]">
                                      {selectedWhoisContact.firstName}{' '}
                                      {selectedWhoisContact.lastName}
                                    </strong>{' '}
                                    · {selectedWhoisContact.city},{' '}
                                    {selectedWhoisContact.stateProvince},{' '}
                                    {selectedWhoisContact.countryName}
                                  </div>
                                )}
                                {domainOption === 'transfer' && (
                                  <div className="text-[11px] text-slate-600">
                                    Transfer ETA: Approve registrant email link for immediate transfer, or completes automatically within <strong>7 days</strong>.
                                  </div>
                                )}
                                {domainOption === 'register' && (
                                  <div className="text-[11px] text-slate-600">
                                    Activation: Team reviews order &rarr; approval email + WHOIS verification link unlocks Domain Management.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                            {isComCandidateSelected
                              ? `${formatPrice(0)} (Free 1-Yr)`
                              : domainPriceUsd > 0
                              ? formatPrice(domainPriceUsd)
                              : 'Included'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                        <Tag className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                        <span>Promotional Discount Code</span>
                      </div>

                      {appliedPromo ? (
                        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#16A34A]/40 text-xs">
                          <div className="flex items-center gap-2">
                            <Percent className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                            <span className="font-mono font-bold text-[#0F172A]">
                              {appliedPromo.code}
                            </span>
                            <span className="text-slate-600">({appliedPromo.description})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono tabular-nums font-bold text-[#16A34A]">
                              -{formatPrice(promoDiscountUsd)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedPromo(null);
                                setPromoDiscountUsd(0);
                                setPromoInput('');
                              }}
                              className="text-slate-400 hover:text-[#DC2626] cursor-pointer"
                              aria-label="Remove promo code"
                            >
                              <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyPromo} className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value.toUpperCase());
                              setPromoError('');
                            }}
                            placeholder="Enter promo code (e.g. WELCOME10)"
                            className="flex-1 min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-mono uppercase bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                          />
                          <button
                            type="submit"
                            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                          >
                            Apply Code
                          </button>
                        </form>
                      )}

                      {promoError && (
                        <p className="text-xs font-semibold text-[#DC2626]">{promoError}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContinueToPaymentOrAuth('login')}
                        className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== STEP 4: PAYMENT METHOD & COMPLETE ORDER ==================== */}
                {step === 4 && (
                  <form
                    onSubmit={handleCompleteOrder}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#0E6B63]">
                        {isDomainOnly ? 'Step 3 of 3' : 'Step 4 of 4'} · Payment &amp; Submission
                      </p>
                      <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                        {isFreeTrialMode && netTotalUsd === 0
                          ? 'Verify & Activate 30-Day Free Trial ($0.00)'
                          : 'Select Payment Gateway & Complete Order'}
                      </h1>
                    </div>

                    {!currentUser ? (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-3">
                        <p className="text-sm font-bold text-[#0F172A]">
                          Sign in or create account to complete payment
                        </p>
                        <p className="text-xs text-slate-600">
                          Your configuration, datacenter node ({activeDatacenter.city}), and applied promotions are preserved.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleContinueToPaymentOrAuth('login')}
                            className="px-5 py-2.5 rounded-xl bg-[#0E6B63] text-white text-xs font-semibold cursor-pointer"
                          >
                            Sign In to Account
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContinueToPaymentOrAuth('register')}
                            className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] text-xs font-semibold cursor-pointer"
                          >
                            Create New Account
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Billing Account</span>
                            <span className="font-bold text-[#0F172A]">{currentUser.name}</span> ·{' '}
                            <span className="font-mono text-[#0E6B63]">{currentUser.email}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#16A34A] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Verified Session
                          </span>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-[#0F172A]">
                            Choose Payment Gateway
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {enabledGateways.map((gw) => {
                              const isSelected = selectedGateway?.id === gw.id;
                              return (
                                <button
                                  key={gw.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedGatewayId(gw.id);
                                    setPaymentError('');
                                  }}
                                  className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                      : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {renderGatewayIcon(gw.kind)}
                                      <span className="text-xs font-bold text-[#0F172A]">
                                        {gw.name}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2
                                        className="w-4 h-4 text-[#0E6B63] shrink-0"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    {gw.bankOrProviderName} · {gw.currencyHint}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedGateway && (
                          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-[#0F172A]">
                                Selected Gateway: {selectedGateway.name}
                              </span>
                              <span className="font-mono text-[11px] text-[#0E6B63]">
                                {selectedGateway.currencyHint}
                              </span>
                            </div>

                            {selectedGateway.instructions && (
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {selectedGateway.instructions}
                              </p>
                            )}

                            <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] text-[11px] text-slate-600 leading-relaxed">
                              {isFreeTrialMode && netTotalUsd === 0 ? (
                                <>
                                  <strong className="text-[#16A34A]">$0.00 Trial Verification:</strong>{' '}
                                  Your selected gateway is recorded solely as a future renewal preference on Day 31. Zero charges are applied today.
                                </>
                              ) : (
                                <>
                                  <strong className="text-[#0F172A]">Invoice First Workflow:</strong>{' '}
                                  No transaction reference or TID is required right now. Click{' '}
                                  <strong>Complete Order &amp; Generate Invoice</strong> below to generate your official invoice, then submit your payment reference or settle directly on your invoice page.
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {paymentError && (
                          <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                            {paymentError}
                          </p>
                        )}

                        <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Back</span>
                          </button>
                          <button
                            type="submit"
                            className="min-h-[46px] inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold shadow-[0_6px_20px_rgba(14,107,99,0.22)] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                          >
                            <span>
                              {isFreeTrialMode && netTotalUsd === 0
                                ? 'Activate 30-Day Free Trial ($0.00)'
                                : 'Complete Order & Generate Invoice'}
                            </span>
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>

              {/* RIGHT STICKY SIDEBAR (4 Cols) */}
              <aside className="lg:col-span-4 lg:sticky lg:top-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5">
                <div className="border-b border-[#E2E8F0] pb-3.5">
                  <h2 className="font-display text-base font-bold text-[#0F172A]">Order Summary</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time billing breakdown in {currency.code}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {!isDomainOnly && (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-[#0F172A] block">
                            {activePlan.name}
                          </span>
                          <span className="text-slate-500">
                            {isFreeTrialMode ? '30-Day Trial Evaluation' : `${billingCycle} Billing Cycle`}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                          {formatPrice(hostingPricing.priceUsd)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#0E6B63] font-medium mt-0.5">
                        {isFreeTrialMode
                          ? `Renews Day 31 at ${formatPrice(activePlan.monthlyPrice)}/mo`
                          : `Renews at ${formatPrice(activePlan.yearlyPrice || activePlan.monthlyPrice * 12)} / year`}
                      </p>
                    </div>
                  )}

                  {!isDomainOnly && (
                    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                        Datacenter Node
                      </span>
                      <span className="font-semibold text-[#0F172A]">{activeDatacenter.city}</span>
                    </div>
                  )}

                  {isCompute ? (
                    <div className="space-y-2.5 pt-1 border-t border-[#E2E8F0]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-semibold text-[#0F172A] block">
                            OS / Stack Image
                          </span>
                          <span className="text-[11px] text-[#0E6B63] font-semibold block truncate">
                            {activeComputeTemplate.name} ({activeComputeTemplate.version})
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {activeComputeTemplate.controlPanelOrStack}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#0E6B63] shrink-0">
                          Included
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-semibold text-[#0F172A] block">
                            Storage &amp; Hostname
                          </span>
                          <span className="font-mono text-[11px] text-slate-600 truncate block">
                            {computeHostname}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {computeStorageMode} · Auth: {computeAuthMode.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {activeBackupOption.id !== 'none' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600 truncate">{activeBackupOption.name}</span>
                          <span className="font-mono tabular-nums font-bold text-[#0F172A] shrink-0">
                            {formatPrice(activeBackupOption.monthlyPriceUsd * computeCycleMonths)}
                          </span>
                        </div>
                      )}

                      {computeDedicatedIpAddon && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600">Extra Dedicated IPv4</span>
                          <span className="font-mono tabular-nums font-bold text-[#0F172A] shrink-0">
                            {formatPrice(3 * computeCycleMonths)}
                          </span>
                        </div>
                      )}

                      {computeFirewallAddon && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600">Managed Firewall Shield</span>
                          <span className="font-mono tabular-nums font-bold text-[#0F172A] shrink-0">
                            {formatPrice(4 * computeCycleMonths)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#0F172A] block">
                          {domainOption === 'register'
                            ? 'Domain Registration'
                            : domainOption === 'transfer'
                            ? 'Domain Transfer'
                            : domainOption === 'existing'
                            ? 'Existing Domain'
                            : 'Staging Hostname'}
                        </span>
                        <span className="font-mono text-[11px] text-[#0E6B63] truncate block">
                          {domainOption === 'register'
                            ? selectedNewDomain?.domain || 'Select a domain'
                            : domainOption === 'transfer'
                            ? transferDomainInput.trim() || 'Enter transfer domain'
                            : domainOption === 'existing'
                            ? existingDomainInput.trim() || 'Custom domain'
                            : 'Temporary container'}
                        </span>
                        {(domainOption === 'register' || domainOption === 'transfer') && (
                          <span className="text-[10px] text-slate-500 block">
                            Renewal:{' '}
                            {formatPrice(
                              selectedNewDomain?.renewalUsd ||
                                detectedTransferTld?.renewalUsd ||
                                getPricingForTld('.com').renewalPrice
                            )}
                            /yr
                          </span>
                        )}
                      </div>
                      <span className="font-mono tabular-nums font-bold text-[#0F172A] shrink-0">
                        {isComCandidateSelected
                          ? `${formatPrice(0)} (Free 1-Yr)`
                          : domainPriceUsd > 0
                          ? formatPrice(domainPriceUsd)
                          : formatPrice(0, { compactZero: true })}
                      </span>
                    </div>
                  )}

                  {appliedPromo && promoDiscountUsd > 0 && (
                    <div className="flex items-center justify-between gap-3 text-[#16A34A] font-semibold">
                      <span>Promo ({appliedPromo.code})</span>
                      <span className="font-mono tabular-nums">
                        -{formatPrice(promoDiscountUsd)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E2E8F0] pt-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-600">Total Due Today</span>
                    <span className="font-mono tabular-nums text-2xl font-extrabold text-[#0F172A]">
                      {formatPrice(netTotalUsd)}
                    </span>
                  </div>
                  {hostingPricing.savingsUsd + promoDiscountUsd > 0 && (
                    <p className="text-[11px] font-semibold text-[#16A34A] text-right">
                      Total Savings: {formatPrice(hostingPricing.savingsUsd + promoDiscountUsd)}
                    </p>
                  )}
                </div>

                <div className="border-t border-[#E2E8F0] pt-4 space-y-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0E6B63] shrink-0" aria-hidden="true" />
                    <span>
                      {isCompute
                        ? 'Full Root Access & Edge DDoS Protection'
                        : 'Free WHOIS Privacy & Wildcard SSL'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-[#0E6B63] shrink-0" aria-hidden="true" />
                    <span>99.99% Cloud SLA · Instant Provisioning</span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
