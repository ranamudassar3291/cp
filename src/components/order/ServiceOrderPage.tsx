import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MapPin,
  Percent,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import {
  ManagedHostingPlanRecord,
  OrderCheckoutDraft,
  PaymentGatewayKind,
  PlatformOrder,
  PromoCodeRecord,
  TldExtensionRecord,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { SHARED_DATACENTERS } from '../../data/sharedHostingData';
import { inspectDomainLive, normalizeDomainInput } from '../../utils/domainLookup';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';

export type OrderCategory =
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'cpanel-hosting'
  | 'domain-registration'
  | 'domain-transfer';

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
    const twoYear = Number((annualBase * 2 * 0.9).toFixed(2));
    const baseline = Number((fullMonthRate * 24).toFixed(2));
    return {
      priceUsd: twoYear,
      effectiveMonthlyUsd: Number((twoYear / 24).toFixed(2)),
      savingsUsd: Math.max(0, Number((baseline - twoYear).toFixed(2))),
    };
  }
  const annualBase = plan.yearlyPrice || fullMonthRate * 12;
  const fourYear = Number((annualBase * 4 * 0.8).toFixed(2));
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

export const ServiceOrderPage: React.FC<ServiceOrderPageProps> = ({
  orderCategory = 'shared-hosting',
  onNavigateHome,
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
    setOrderCheckoutDraft,
    clearOrderCheckoutDraft,
    setPendingPostAuthPath,
    validatePromoCode,
    recordPromoCodeUsage,
    addOrder,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  // Active Category (from prop or draft)
  const [activeCategory, setActiveCategory] = useState<OrderCategory>(() => {
    return orderCheckoutDraft?.orderCategory || orderCategory;
  });

  useEffect(() => {
    if (orderCategory && orderCategory !== activeCategory && !orderCheckoutDraft?.orderCategory) {
      setActiveCategory(orderCategory);
    }
  }, [orderCategory]);

  const isWpOrWin = activeCategory === 'wordpress-hosting' || activeCategory === 'windows-hosting';
  const isCpanel = activeCategory === 'cpanel-hosting';
  const isDomainOnly = activeCategory === 'domain-registration' || activeCategory === 'domain-transfer';

  const categoryPlans = useMemo(() => {
    const targetCat = isWpOrWin ? activeCategory : isCpanel ? 'cpanel-hosting' : 'shared-hosting';
    const filtered = hostingPlans.filter((p) => p.pageCategory === targetCat && p.enabled);
    if (filtered.length > 0) return filtered;
    return hostingPlans.filter((p) => p.pageCategory === 'shared-hosting' && p.enabled);
  }, [hostingPlans, activeCategory, isWpOrWin, isCpanel]);

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
    }
    return categoryPlans.find((p) => p.popular) ?? categoryPlans[0] ?? hostingPlans[0];
  }, [orderCheckoutDraft, categoryPlans, hostingPlans]);

  // Stepper steps:
  // For Hosting: 1 (Billing Period) -> 2 (Domain & Nameservers) -> 3 (Review & Promo) -> 4 (Payment)
  // For Domain-Only: 2 (Domain & Nameservers) -> 3 (Review & Promo) -> 4 (Payment)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => {
    if (isDomainOnly) return 2;
    if (orderCheckoutDraft?.step) {
      if (orderCheckoutDraft.step === 4 && !currentUser) return 3;
      return orderCheckoutDraft.step;
    }
    return 1;
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialPlan?.id || 'plan-shared-velocity'
  );
  const [billingCycle, setBillingCycle] = useState<BillingPeriodOption>(
    orderCheckoutDraft?.billingCycle || '1 Year'
  );

  // Datacenter location logic:
  // Strict UK for WordPress & Windows
  // Strict USA for cPanel
  // UK/US/SG for Shared Cloud
  const [datacenterId, setDatacenterId] = useState<'uk' | 'us' | 'sg'>(() => {
    if (isWpOrWin) return 'uk';
    if (isCpanel) return 'us';
    return orderCheckoutDraft?.datacenterId || 'uk';
  });

  useEffect(() => {
    if (isWpOrWin && datacenterId !== 'uk') {
      setDatacenterId('uk');
    } else if (isCpanel && datacenterId !== 'us') {
      setDatacenterId('us');
    }
  }, [isWpOrWin, isCpanel, datacenterId]);

  // Domain configuration state
  const [domainOption, setDomainOption] = useState<'register' | 'transfer' | 'existing' | 'later'>(() => {
    if (activeCategory === 'domain-transfer') return 'transfer';
    if (activeCategory === 'domain-registration') return 'register';
    return orderCheckoutDraft?.domainOption || 'register';
  });

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

  // Domain Transfer state
  const [transferDomainInput, setTransferDomainInput] = useState(
    orderCheckoutDraft?.domainOption === 'transfer' ? orderCheckoutDraft.domainName : ''
  );
  const [domainUnlockedChecked, setDomainUnlockedChecked] = useState(
    orderCheckoutDraft?.domainUnlockedConfirmed !== undefined
      ? orderCheckoutDraft.domainUnlockedConfirmed
      : false
  );
  const [eppAuthCode, setEppAuthCode] = useState(
    orderCheckoutDraft?.eppAuthCode || ''
  );
  const [showEppSecret, setShowEppSecret] = useState(false);
  const [transferStrategy, setTransferStrategy] = useState<'preserve' | 'cloud'>('preserve');

  // Hostinger-style Nameservers state
  const [nameserversType, setNameserversType] = useState<'default' | 'custom'>(
    orderCheckoutDraft?.nameserversType || 'default'
  );
  const [customNs1, setCustomNs1] = useState(
    orderCheckoutDraft?.nameservers?.[0] || 'ns1.cpcloudhost.com'
  );
  const [customNs2, setCustomNs2] = useState(
    orderCheckoutDraft?.nameservers?.[1] || 'ns2.cpcloudhost.com'
  );
  const [showExtraNs, setShowExtraNs] = useState(false);
  const [customNs3, setCustomNs3] = useState('');
  const [customNs4, setCustomNs4] = useState('');
  const [whoisPrivacyEnabled, setWhoisPrivacyEnabled] = useState(
    orderCheckoutDraft?.whoisPrivacy !== undefined ? orderCheckoutDraft.whoisPrivacy : true
  );

  const [selectedNewDomain, setSelectedNewDomain] = useState<DomainCheckCandidate | null>(() => {
    if (
      orderCheckoutDraft?.domainOption === 'register' &&
      orderCheckoutDraft.domainName &&
      orderCheckoutDraft.domainTld
    ) {
      return {
        domain: orderCheckoutDraft.domainName,
        tld: orderCheckoutDraft.domainTld,
        minYears: orderCheckoutDraft.domainYears === 2 ? 2 : 1,
        priceUsd: orderCheckoutDraft.domainPriceUsd || 0,
        renewalUsd: orderCheckoutDraft.domainPriceUsd || 0,
        available: true,
        popular: true,
      };
    }
    return null;
  });

  const [existingDomainInput, setExistingDomainInput] = useState(
    orderCheckoutDraft?.domainOption === 'existing' ? orderCheckoutDraft.domainName : ''
  );
  const [step2Error, setStep2Error] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState(orderCheckoutDraft?.promoCode || '');
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeRecord | null>(null);
  const [promoDiscountUsd, setPromoDiscountUsd] = useState(0);
  const [promoError, setPromoError] = useState('');

  // Payment & Completion state
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(
    enabledGateways[0]?.id || ''
  );
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentError, setPaymentError] = useState('');
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
  } | null>(null);

  useEffect(() => {
    const titles: Record<OrderCategory, string> = {
      'shared-hosting': 'Order Shared Cloud Hosting | cpcloudhost.com',
      'wordpress-hosting': 'Order Managed WordPress Hosting (UK Datacenter) | cpcloudhost.com',
      'windows-hosting': 'Order Windows IIS Web Hosting (UK Datacenter) | cpcloudhost.com',
      'cpanel-hosting': 'Order cPanel NVMe Web Hosting (USA Datacenter) | cpcloudhost.com',
      'domain-registration': 'Register Domain Name | cpcloudhost.com',
      'domain-transfer': 'Transfer Domain & 1-Year Extension | cpcloudhost.com',
    };
    applyPageSeoMetadata({
      title: titles[activeCategory] || 'Order Web Services | cpcloudhost.com',
      description:
        'International checkout portal with live domain search, Hostinger-style Anycast nameservers, local payments (EasyPaisa/JazzCash), and automated invoicing.',
      canonicalPath: `/order/${activeCategory}`,
      ogType: 'website',
      jsonLd: null,
    });
  }, [activeCategory]);

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
    if (isWpOrWin) {
      return SHARED_DATACENTERS.find((dc) => dc.id === 'uk') ?? SHARED_DATACENTERS[0];
    }
    if (isCpanel) {
      return SHARED_DATACENTERS.find((dc) => dc.id === 'us') ?? SHARED_DATACENTERS[1];
    }
    return (
      SHARED_DATACENTERS.find((dc) => dc.id === datacenterId) ??
      SHARED_DATACENTERS[0]
    );
  }, [datacenterId, isWpOrWin, isCpanel]);

  const hostingPricing = useMemo(
    () =>
      isDomainOnly
        ? { priceUsd: 0, effectiveMonthlyUsd: 0, savingsUsd: 0 }
        : activePlan
        ? computePlanCyclePrice(activePlan, billingCycle)
        : { priceUsd: 0, effectiveMonthlyUsd: 0, savingsUsd: 0 },
    [activePlan, billingCycle, isDomainOnly]
  );

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
    : 11.99;

  const domainPriceUsd =
    domainOption === 'register' && selectedNewDomain
      ? selectedNewDomain.priceUsd
      : domainOption === 'transfer' && transferDomainInput.trim()
      ? transferPriceUsd
      : 0;

  const grossSubtotalUsd = isDomainOnly
    ? Number(domainPriceUsd.toFixed(2))
    : Number((hostingPricing.priceUsd + domainPriceUsd).toFixed(2));

  const netTotalUsd = Math.max(
    0,
    Number((grossSubtotalUsd - promoDiscountUsd).toFixed(2))
  );

  // Auto-advance to Step 4 if returning authenticated
  useEffect(() => {
    if (currentUser && orderCheckoutDraft?.step === 4 && step !== 4 && !completedOrders) {
      setStep(4);
    }
  }, [currentUser, orderCheckoutDraft, step, completedOrders]);

  const persistDraft = (nextStep: 1 | 2 | 3 | 4) => {
    const draft: OrderCheckoutDraft = {
      orderCategory: activeCategory,
      planId: activePlan?.id || 'domain-reg',
      planName: isDomainOnly
        ? activeCategory === 'domain-transfer'
          ? 'Domain Transfer'
          : 'Domain Registration'
        : activePlan.name,
      productType:
        activeCategory === 'wordpress-hosting'
          ? 'Managed WordPress'
          : activeCategory === 'windows-hosting'
          ? 'Windows Hosting'
          : activeCategory === 'cpanel-hosting'
          ? 'cPanel Hosting'
          : activeCategory === 'domain-registration'
          ? 'Domain Registration'
          : activeCategory === 'domain-transfer'
          ? 'Domain Transfer'
          : 'Shared Cloud',
      billingCycle,
      datacenterId: activeDatacenter.id,
      datacenterLabel: activeDatacenter.city,
      domainOption,
      domainName:
        domainOption === 'register'
          ? selectedNewDomain?.domain || ''
          : domainOption === 'transfer'
          ? transferDomainInput.trim().toLowerCase()
          : domainOption === 'existing'
          ? existingDomainInput.trim().toLowerCase()
          : 'Configure Later',
      domainTld:
        domainOption === 'register'
          ? selectedNewDomain?.tld
          : domainOption === 'transfer'
          ? detectedTransferTld?.tld
          : undefined,
      domainYears: domainOption === 'register' ? selectedNewDomain?.minYears : 1,
      domainPriceUsd,
      promoCode: appliedPromo?.code || undefined,
      nameserversType,
      nameservers:
        nameserversType === 'default'
          ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
          : [customNs1.trim() || 'ns1.cpcloudhost.com', customNs2.trim() || 'ns2.cpcloudhost.com'],
      whoisPrivacy: whoisPrivacyEnabled,
      eppAuthCode: domainOption === 'transfer' ? eppAuthCode : undefined,
      domainUnlockedConfirmed: domainOption === 'transfer' ? domainUnlockedChecked : undefined,
      step: nextStep,
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    };
    setOrderCheckoutDraft(draft);
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

    // Prioritize typed TLD first, then popular, then catalog order — strictly TOP 5
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
    } catch {
      setDomainSearchError('Unable to complete live DNS/RDAP registry lookup.');
    } finally {
      setSearchingDomains(false);
    }
  };

  const handleContinueFromStep2 = () => {
    setStep2Error('');
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
    if (selectedGateway.requiresTransactionId && transactionRef.trim().length < 4) {
      setPaymentError(
        `Enter your ${selectedGateway.name} Transaction ID / Reference to submit your order.`
      );
      return;
    }
    setPaymentError('');

    const resolvedDomainHost =
      domainOption === 'register' && selectedNewDomain
        ? selectedNewDomain.domain
        : domainOption === 'transfer'
        ? transferDomainInput.trim().toLowerCase()
        : domainOption === 'existing'
        ? existingDomainInput.trim().toLowerCase()
        : `pending-${Date.now().toString(36)}.cpcloudhost.com`;

    const hostingDiscount = appliedPromo?.scope === 'hosting' ? promoDiscountUsd : 0;
    const domainDiscount = appliedPromo?.scope === 'domain' ? promoDiscountUsd : 0;

    const resolvedProductType: PlatformOrder['productType'] =
      activeCategory === 'wordpress-hosting'
        ? 'Managed WordPress'
        : activeCategory === 'windows-hosting'
        ? 'Windows Hosting'
        : activeCategory === 'cpanel-hosting'
        ? 'cPanel Hosting'
        : 'Shared Cloud';

    let primaryOrderId = '';
    let primaryInvoiceId = '';
    let secondaryOrderId: string | undefined;
    let secondaryInvoiceId: string | undefined;

    // Case 1: Standalone Domain-Only Order
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
        registrarLock: true,
        autoRenew: true,
        promoCode: appliedPromo?.code,
        discountUsd: domainDiscount || undefined,
        transactionRef: transactionRef.trim() || undefined,
        notes: isTransfer
          ? `EPP Auth Code Verified (${eppAuthCode.trim()}). Client confirmed domain unlocked. Strategy: ${
              transferStrategy === 'cloud' ? 'CPCloudHost Anycast' : 'Preserve Current'
            }.`
          : `Hostinger-style Domain Registration. Nameservers: ${
              nameserversType === 'default'
                ? 'CPCloudHost Anycast'
                : `Custom (${customNs1}, ${customNs2})`
            }. WHOIS Privacy: ${whoisPrivacyEnabled ? 'Active' : 'Off'}.`,
      });
      primaryOrderId = order.id;
      primaryInvoiceId = invoice?.id || order.id.replace('ORD-', 'INV-');
    } else {
      // Case 2: Hosting Order (with optional Domain Registration or Transfer bundled)
      const netHostingAmount = Math.max(
        0,
        Number((hostingPricing.priceUsd - hostingDiscount).toFixed(2))
      );
      const { order: hostingOrder, invoice: hostingInvoice } = addOrder({
        clientEmail: currentUser.email,
        clientName: currentUser.name,
        country: currentUser.country,
        productType: resolvedProductType,
        planName: activePlan.name,
        domainOrHost: resolvedDomainHost,
        billingCycle,
        amountUsd: netHostingAmount,
        paymentMethod: selectedGateway.name,
        datacenter: activeDatacenter.city,
        status: 'pending',
        invoicePaid: false,
        serverModuleId: activePlan.serverModuleId,
        serverPackageName: activePlan.serverPackageName,
        promoCode: appliedPromo?.scope === 'hosting' ? appliedPromo.code : undefined,
        discountUsd: hostingDiscount || undefined,
        transactionRef: transactionRef.trim() || undefined,
        nameservers:
          nameserversType === 'default'
            ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
            : [customNs1.trim() || 'ns1.cpcloudhost.com', customNs2.trim() || 'ns2.cpcloudhost.com'],
        notes: `Order via ${selectedGateway.name}${
          domainOption === 'later' ? ' · Staging container assigned' : ''
        }${transactionRef.trim() ? ` · TID: ${transactionRef.trim()}` : ''}`,
      });
      primaryOrderId = hostingOrder.id;
      primaryInvoiceId = hostingInvoice?.id || hostingOrder.id.replace('ORD-', 'INV-');

      // Create bundled domain registration order if registered
      if (domainOption === 'register' && selectedNewDomain) {
        const netDomainAmount = Math.max(
          0,
          Number((selectedNewDomain.priceUsd - domainDiscount).toFixed(2))
        );
        const { order: domOrder, invoice: domInv } = addOrder({
          clientEmail: currentUser.email,
          clientName: currentUser.name,
          country: currentUser.country,
          productType: 'Domain Registration',
          planName: `${selectedNewDomain.tld} Domain Registration`,
          domainOrHost: selectedNewDomain.domain,
          billingCycle: selectedNewDomain.minYears === 2 ? '2 Years' : '1 Year',
          amountUsd: netDomainAmount,
          paymentMethod: selectedGateway.name,
          datacenter: activeDatacenter.city,
          status: 'pending',
          invoicePaid: false,
          nameservers:
            nameserversType === 'default'
              ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
              : [customNs1.trim() || 'ns1.cpcloudhost.com', customNs2.trim() || 'ns2.cpcloudhost.com'],
          whoisPrivacy: whoisPrivacyEnabled,
          registrarLock: true,
          autoRenew: true,
          promoCode: appliedPromo?.scope === 'domain' ? appliedPromo.code : undefined,
          discountUsd: domainDiscount || undefined,
          transactionRef: transactionRef.trim() || undefined,
          notes: `Bundled with ${resolvedProductType} order ${hostingOrder.id}`,
        });
        secondaryOrderId = domOrder.id;
        secondaryInvoiceId = domInv?.id;
      } else if (domainOption === 'transfer' && transferDomainInput.trim()) {
        const netDomainAmount = Math.max(
          0,
          Number((transferPriceUsd - domainDiscount).toFixed(2))
        );
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
          nameservers:
            transferStrategy === 'cloud'
              ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
              : ['ns1.current-registrar.com', 'ns2.current-registrar.com'],
          whoisPrivacy: whoisPrivacyEnabled,
          promoCode: appliedPromo?.scope === 'domain' ? appliedPromo.code : undefined,
          discountUsd: domainDiscount || undefined,
          transactionRef: transactionRef.trim() || undefined,
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

    setCompletedOrders({
      orderId: primaryOrderId,
      invoiceId: primaryInvoiceId,
      secondaryOrderId,
      secondaryInvoiceId,
      productName: isDomainOnly
        ? activeCategory === 'domain-transfer'
          ? 'Domain Transfer'
          : 'Domain Registration'
        : activePlan.name,
      datacenter: activeDatacenter.city,
      domainName: resolvedDomainHost,
      totalPaidUsd: netTotalUsd,
      billingCycle: isDomainOnly ? '1 Year' : billingCycle,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Compact Header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToSharedHosting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E6B63] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Plans</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-display text-sm sm:text-base font-bold text-[#0F172A] truncate">
              {activeCategory === 'wordpress-hosting'
                ? 'Managed WordPress Hosting Order'
                : activeCategory === 'windows-hosting'
                ? 'Windows IIS Hosting Order (UK Datacenter)'
                : activeCategory === 'cpanel-hosting'
                ? 'cPanel Web Hosting Order (USA Datacenter)'
                : activeCategory === 'domain-registration'
                ? 'Domain Registration Portal'
                : activeCategory === 'domain-transfer'
                ? 'Domain Transfer Portal'
                : 'Shared Cloud Hosting Order'}
            </span>
          </div>

          <div className="flex items-center gap-3">
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
                  persistDraft(step);
                  setPendingPostAuthPath(`/order/${activeCategory}`);
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

      {/* Top Category Switcher Tabs */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 text-xs font-semibold no-scrollbar">
            {[
              { id: 'shared-hosting' as const, label: 'Shared Cloud' },
              { id: 'wordpress-hosting' as const, label: 'WordPress (UK)' },
              { id: 'windows-hosting' as const, label: 'Windows IIS (UK)' },
              { id: 'cpanel-hosting' as const, label: 'cPanel (USA)' },
              { id: 'domain-registration' as const, label: 'Register Domain' },
              { id: 'domain-transfer' as const, label: 'Transfer Domain' },
            ].map((tab) => {
              const isSelected = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(tab.id);
                    if (tab.id === 'domain-registration' || tab.id === 'domain-transfer') {
                      setStep(2);
                      setDomainOption(tab.id === 'domain-transfer' ? 'transfer' : 'register');
                    } else {
                      setStep(1);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E6B63] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {completedOrders ? (
          /* ======================== ORDER CONFIRMATION VIEW ======================== */
          <div className="max-w-2xl mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/25 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#16A34A]">
                  Order Submitted &amp; Automated Invoice Generated
                </p>
                <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-0.5">
                  Thank you, {currentUser?.name || 'Client'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Your order for <strong className="text-[#0F172A]">{completedOrders.productName}</strong> has been logged in our queue for{' '}
                  <strong className="text-[#0F172A]">{completedOrders.datacenter}</strong>.
                  Settle your invoice via your chosen payment method to activate automated provisioning.
                </p>
              </div>
            </div>

            <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Order Reference</span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {completedOrders.orderId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Generated Invoice Number</span>
                <span className="font-mono font-semibold text-[#0E6B63]">
                  {completedOrders.invoiceId}
                </span>
              </div>
              {completedOrders.secondaryOrderId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bundled Domain Order</span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {completedOrders.secondaryOrderId} ({completedOrders.secondaryInvoiceId})
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Domain / Host Reference</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {completedOrders.domainName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Datacenter Region</span>
                <span className="font-semibold text-[#0F172A]">
                  {completedOrders.datacenter}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A]">Total Amount Due</span>
                <span className="font-mono tabular-nums text-base font-extrabold text-[#0E6B63]">
                  {formatPrice(completedOrders.totalPaidUsd)}
                </span>
              </div>
            </div>

            {/* Payment Method Notice */}
            {selectedGateway && (
              <div className="rounded-xl border border-[#CBD5E1] bg-white p-4 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-[#0F172A]">
                  <span>Payment Instructions ({selectedGateway.name})</span>
                  <span className="text-[#0E6B63] font-mono text-[11px]">{selectedGateway.currencyHint}</span>
                </div>
                {(selectedGateway.accountTitle || selectedGateway.accountNumber) && (
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                    {selectedGateway.accountTitle && (
                      <p className="text-slate-600">
                        Title: <strong className="text-[#0F172A]">{selectedGateway.accountTitle}</strong>
                      </p>
                    )}
                    {selectedGateway.accountNumber && (
                      <p className="text-slate-600">
                        Account / Wallet:{' '}
                        <strong className="text-[#0E6B63] font-mono">{selectedGateway.accountNumber}</strong>
                      </p>
                    )}
                  </div>
                )}
                {transactionRef && (
                  <p className="text-slate-500 text-[11px]">
                    Recorded Transaction ID: <span className="font-mono text-[#0F172A]">{transactionRef}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {/* Direct PDF Invoice Download */}
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
                      { code: 'USD', formattedTotal: formatPrice(targetInv.amountUsd) }
                    );
                  }
                }}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#0E6B63] bg-[#F2FAF8] hover:bg-[#E2ECE9] text-[#0E6B63] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download PDF Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDashboard('/dashboard/services')}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
              >
                <span>View My Services</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Stepper */}
            <nav aria-label="Checkout progress" className="mb-8">
              <ol className={`grid gap-3 ${isDomainOnly ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
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
                        <div className="text-xs font-bold text-[#0F172A] truncate">Billing Period</div>
                        <div className="text-[11px] text-slate-500 truncate">Cycle &amp; Datacenter</div>
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
                        {isDomainOnly ? 'Domain & DNS' : 'Domain Name'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {domainOption === 'transfer' ? 'EPP & Unlock' : 'Search & Nameservers'}
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
                      <div className="text-xs font-bold text-[#0F172A] truncate">Review &amp; Promo</div>
                      <div className="text-[11px] text-slate-500 truncate">Verify &amp; discounts</div>
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
                {/* ==================== STEP 1: BILLING PERIOD & DATACENTER ==================== */}
                {!isDomainOnly && step === 1 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-[#0E6B63]">
                        Step 1 of 4 · Plan &amp; Datacenter Configuration
                      </p>
                      <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                        Choose Your Billing Period
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Configure billing cycle on <strong className="text-[#0F172A]">{activePlan.name}</strong>. Multi-year cycles receive locked discount rates.
                      </p>
                    </div>

                    {/* Plan Switcher Grid */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                        {activeCategory === 'wordpress-hosting'
                          ? 'Select Managed WordPress Tier'
                          : activeCategory === 'windows-hosting'
                          ? 'Select Windows IIS Cloud Tier'
                          : activeCategory === 'cpanel-hosting'
                          ? 'Select cPanel Web Hosting Tier'
                          : 'Select Shared Cloud Tier'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {categoryPlans.map((plan) => {
                          const isSelected = plan.id === activePlan.id;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => setSelectedPlanId(plan.id)}
                              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'border-[#0E6B63] bg-[#F4FAF9] ring-1 ring-[#0E6B63]'
                                  : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-sm font-bold text-[#0F172A]">
                                  {plan.name}
                                </span>
                                {isSelected && (
                                  <CheckCircle2
                                    className="w-4 h-4 text-[#0E6B63] shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                              <p className="font-mono tabular-nums text-xs font-semibold text-[#0E6B63] mt-1">
                                From {formatPrice(plan.monthlyPrice)}/mo
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {plan.storage} · {plan.backups}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Billing Period Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                        Select Billing Period
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {BILLING_PERIODS.map((period) => {
                          const calc = computePlanCyclePrice(activePlan, period.id);
                          const isSelected = billingCycle === period.id;
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
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isSelected
                                        ? 'bg-[#0E6B63] text-white'
                                        : 'bg-[#F2FAF8] text-[#0E6B63]'
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
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Datacenter Location Selector with Strict Enforcements */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-[#0F172A]">
                          Datacenter Location
                        </label>
                        {isWpOrWin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2FAF8] text-[#0E6B63] border border-[#0E6B63]/20">
                            Strict UK Location Only (London Cluster)
                          </span>
                        )}
                        {isCpanel && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Strict USA Location Only (Dallas NVMe)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {SHARED_DATACENTERS.map((dc) => {
                          const isLockedOut = (isWpOrWin && dc.id !== 'uk') || (isCpanel && dc.id !== 'us');
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
                    </div>

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          persistDraft(2);
                          setStep(2);
                        }}
                        className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>Continue to Domain</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== STEP 2: DOMAIN & HOSTINGER NAMESERVERS ==================== */}
                {step === 2 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-[#0E6B63]">
                        {isDomainOnly ? 'Step 1 of 3' : 'Step 2 of 4'} · Domain &amp; DNS Setup
                      </p>
                      <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mt-1">
                        {isDomainOnly
                          ? activeCategory === 'domain-transfer'
                            ? 'Transfer Your Domain to CPCloudHost'
                            : 'Register a New Domain Name'
                          : 'Connect or Register Domain'}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        {isDomainOnly
                          ? 'Includes 1-year automatic extension on transfers and Hostinger-style Anycast nameservers with free WHOIS privacy.'
                          : 'Pair your cloud hosting container with a brand new domain, transfer an existing domain, or attach one later.'}
                      </p>
                    </div>

                    {/* Domain Option Tabs */}
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

                        {/* Top 5 Suggestion Results from Admin TLD Console */}
                        {domainResults.length > 0 && (
                          <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden">
                            <div className="px-4 py-2 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              Top 5 Recommended Domain Extensions
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
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          item.available
                                            ? 'bg-emerald-50 text-[#16A34A]'
                                            : 'bg-red-50 text-[#DC2626]'
                                        }`}
                                      >
                                        {item.available ? 'Available' : 'Registered'}
                                      </span>
                                      {item.minYears === 2 && (
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-[10px] font-semibold text-amber-700 border border-amber-200">
                                          2-Year Mandatory Term (.pk)
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Renewal: {formatPrice(item.renewalUsd)}/yr · Free WHOIS Privacy &amp; Anycast DNS
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="font-mono tabular-nums text-sm font-extrabold text-[#0F172A]">
                                      {formatPrice(item.priceUsd)}
                                    </span>
                                    {item.available ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedNewDomain(item);
                                          setStep2Error('');
                                        }}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                                          isChosen
                                            ? 'bg-[#16A34A] text-white'
                                            : 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
                                        }`}
                                      >
                                        {isChosen ? 'Selected ✓' : 'Select Domain'}
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

                        {/* Selected Domain Card */}
                        {selectedNewDomain && (
                          <div className="p-4 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/30 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" aria-hidden="true" />
                              <div>
                                <span className="font-bold text-[#0F172A] block font-mono text-sm">
                                  {selectedNewDomain.domain}
                                </span>
                                <span className="text-slate-600">
                                  {selectedNewDomain.minYears === 2 ? '2-Year Term' : '1-Year Term'} · Renews at {formatPrice(selectedNewDomain.renewalUsd)}/yr
                                </span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-base text-[#0E6B63]">
                              {formatPrice(selectedNewDomain.priceUsd)}
                            </span>
                          </div>
                        )}

                        {/* ================= HOSTINGER-TYPE NAMESERVERS SECTION ================= */}
                        <div className="mt-4 border border-[#CBD5E1] rounded-2xl p-5 bg-[#F8FAFC] space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                              <h3 className="font-display text-sm font-bold text-[#0F172A]">
                                Nameserver &amp; DNS Routing (Hostinger Standard)
                              </h3>
                            </div>
                            <span className="text-[10px] font-bold text-[#0E6B63] bg-[#E6F4F2] px-2 py-0.5 rounded">
                              DDoS Anycast Shield
                            </span>
                          </div>

                          <div className="space-y-3">
                            {/* Option 1: CPCloudHost Default Nameservers */}
                            <label className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                              nameserversType === 'default'
                                ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                                : 'bg-white/70 border-[#E2E8F0] hover:border-slate-300'
                            }`}>
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
                                    Use CPCloudHost Anycast Cloud Nameservers (Recommended)
                                  </span>
                                  <p className="text-[11px] text-slate-500">
                                    Instant DNS propagation (&lt; 10ms) and automatic DNS zone synchronization for web and email.
                                  </p>
                                  <div className="pt-1.5 flex flex-wrap gap-2 text-[11px] font-mono text-[#0E6B63]">
                                    <span className="bg-[#F2FAF8] px-2 py-0.5 rounded border border-[#0E6B63]/20">
                                      ns1.cpcloudhost.com
                                    </span>
                                    <span className="bg-[#F2FAF8] px-2 py-0.5 rounded border border-[#0E6B63]/20">
                                      ns2.cpcloudhost.com
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>

                            {/* Option 2: Custom Nameservers */}
                            <label className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                              nameserversType === 'custom'
                                ? 'bg-white border-[#0E6B63] ring-1 ring-[#0E6B63]'
                                : 'bg-white/70 border-[#E2E8F0] hover:border-slate-300'
                            }`}>
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

                          {/* Free Included Value Addons (Hostinger-Style) */}
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
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                                  whoisPrivacyEnabled
                                    ? 'bg-[#E6F4F2] text-[#0E6B63]'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {whoisPrivacyEnabled ? 'Included (Active)' : 'Disabled'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                              <span className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#16A34A]" /> Cloud Edge Anycast DNS Included
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#16A34A]" /> 2 Free Email Forwarders Included
                              </span>
                            </div>
                          </div>
                        </div>
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

                        {/* Unlock Checkbox */}
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

                        {/* EPP / Auth Code Input */}
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
                          <p className="text-[11px] text-slate-500 mt-1">
                            Obtain your secret EPP transfer code from your current registrar (GoDaddy, Namecheap, Google, etc.).
                          </p>
                        </div>

                        {/* Transfer Nameserver Strategy */}
                        <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-2 text-xs">
                          <span className="font-bold text-[#0F172A] block">Nameserver Strategy During Transfer:</span>
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
                              <span>Switch to CPCloudHost Anycast Nameservers (ns1.cpcloudhost.com, ns2.cpcloudhost.com)</span>
                            </label>
                          </div>
                        </div>
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
                          <span className="font-mono font-semibold text-[#0F172A]">ns1.cpcloudhost.com</span> and{' '}
                          <span className="font-mono font-semibold text-[#0F172A]">ns2.cpcloudhost.com</span>.
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

                    {/* Detailed Line Items with Product Renewals */}
                    <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden text-xs">
                      {!isDomainOnly && (
                        <div className="p-4 flex items-center justify-between gap-4 bg-white">
                          <div>
                            <div className="font-display text-sm font-bold text-[#0F172A]">
                              {activePlan.name} — {activeCategory === 'wordpress-hosting' ? 'Managed WordPress' : activeCategory === 'windows-hosting' ? 'Windows IIS Cloud' : activeCategory === 'cpanel-hosting' ? 'cPanel NVMe Hosting' : 'Shared Cloud'}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              Term: <strong>{billingCycle}</strong> · Node: <strong>{activeDatacenter.city}</strong>
                            </div>
                            <div className="text-[#0E6B63] font-semibold mt-1">
                              Renews at {formatPrice(activePlan.yearlyPrice || activePlan.monthlyPrice * 12)} / year on expiration
                            </div>
                          </div>
                          <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                            {formatPrice(hostingPricing.priceUsd)}
                          </div>
                        </div>
                      )}

                      {/* Domain Line Item */}
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
                              ? `${selectedNewDomain.minYears === 2 ? '2 Years' : '1 Year'} Term · Nameservers: ${nameserversType === 'default' ? 'CPCloudHost Anycast' : 'Custom'} · WHOIS Privacy Included`
                              : domainOption === 'transfer'
                              ? `Includes 1-Year Extension · Nameservers: ${transferStrategy === 'cloud' ? 'CPCloudHost Anycast' : 'Preserved'} · EPP Verified`
                              : domainOption === 'existing'
                              ? 'Nameserver configuration post-provisioning'
                              : 'Standard development subdomain provided'}
                          </div>
                          {(domainOption === 'register' || domainOption === 'transfer') && (
                            <div className="text-[#0E6B63] font-semibold mt-1">
                              Renewal Rate: {formatPrice(selectedNewDomain?.renewalUsd || detectedTransferTld?.renewalUsd || 14.99)} / year
                            </div>
                          )}
                        </div>
                        <div className="text-right font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                          {domainPriceUsd > 0 ? formatPrice(domainPriceUsd) : 'Included'}
                        </div>
                      </div>
                    </div>

                    {/* Promo Code Input */}
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
                            <span className="text-slate-600">
                              ({appliedPromo.description})
                            </span>
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
                        <p className="text-xs font-semibold text-[#DC2626]">
                          {promoError}
                        </p>
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
                        Select Payment Gateway &amp; Complete Order
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
                        {/* Signed-In Summary */}
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

                        {/* Payment Method Selector */}
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

                        {/* Selected Gateway Details */}
                        {selectedGateway && (
                          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-[#0F172A]">
                                {selectedGateway.name} Instructions
                              </span>
                              <span className="font-mono text-[11px] text-[#0E6B63]">
                                {selectedGateway.currencyHint}
                              </span>
                            </div>

                            {(selectedGateway.accountTitle || selectedGateway.accountNumber) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white border border-[#E2E8F0] rounded-lg p-3">
                                {selectedGateway.accountTitle && (
                                  <div>
                                    <span className="text-[10px] uppercase text-slate-500 block">
                                      Account Title
                                    </span>
                                    <span className="font-semibold text-[#0F172A]">
                                      {selectedGateway.accountTitle}
                                    </span>
                                  </div>
                                )}
                                {selectedGateway.accountNumber && (
                                  <div>
                                    <span className="text-[10px] uppercase text-slate-500 block">
                                      Account / Wallet Number
                                    </span>
                                    <span className="font-mono font-bold text-[#0E6B63]">
                                      {selectedGateway.accountNumber}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                                Transaction Reference / ID {selectedGateway.requiresTransactionId ? '(Required)' : '(Optional)'}
                              </label>
                              <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => {
                                  setTransactionRef(e.target.value);
                                  setPaymentError('');
                                }}
                                placeholder="e.g. TRX-98234190 or sender mobile number"
                                className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                              />
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
                            <span>Complete Order &amp; Generate Invoice</span>
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
                  <h2 className="font-display text-base font-bold text-[#0F172A]">
                    Order Summary
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time billing breakdown &amp; renewal terms
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
                            {billingCycle} Billing Cycle
                          </span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                          {formatPrice(hostingPricing.priceUsd)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#0E6B63] font-medium mt-0.5">
                        Renews at {formatPrice(activePlan.yearlyPrice || activePlan.monthlyPrice * 12)} / year
                      </p>
                    </div>
                  )}

                  {/* Datacenter Location Badge */}
                  {!isDomainOnly && (
                    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                        Datacenter Node
                      </span>
                      <span className="font-semibold text-[#0F172A]">
                        {activeDatacenter.city}
                      </span>
                    </div>
                  )}

                  {/* Domain Row */}
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
                          ? selectedNewDomain?.domain || 'Search & select domain'
                          : domainOption === 'transfer'
                          ? transferDomainInput.trim() || 'Enter transfer domain'
                          : domainOption === 'existing'
                          ? existingDomainInput.trim() || 'Custom domain'
                          : 'Temporary container'}
                      </span>
                      {(domainOption === 'register' || domainOption === 'transfer') && (
                        <span className="text-[10px] text-slate-500 block">
                          Renewal: {formatPrice(selectedNewDomain?.renewalUsd || detectedTransferTld?.renewalUsd || 14.99)}/yr
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums font-bold text-[#0F172A] shrink-0">
                      {domainPriceUsd > 0 ? formatPrice(domainPriceUsd) : '$0.00'}
                    </span>
                  </div>

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
                    <span className="text-xs font-semibold text-slate-600">
                      Total Due Today
                    </span>
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
                    <span>Free WHOIS Privacy &amp; Wildcard SSL</span>
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
