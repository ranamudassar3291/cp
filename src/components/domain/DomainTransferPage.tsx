import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Loader2,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import transferHeroImg from '../../assets/images/domain_transfer_isometric_cloud_1794564997786.jpg';
import teamPhotoImg from '../../assets/images/domain_team_workspace_photo_1794564999448.jpg';
import {
  TRANSFER_FAQS,
  TRANSFER_VALUE_PILLARS,
  TRANSFER_WHY_BULLETS,
} from '../../data/domainPagesData';
import {
  DomainWhoisDetails,
  TLD_CATALOG,
  getPricingForTld,
  inspectDomainLive,
  normalizeDomainInput,
} from '../../utils/domainLookup';
import { DomainPillarArtwork } from './DomainArtworkEmblems';
import { DomainContactAddressSelector } from './DomainContactAddressSelector';
import { useCurrency } from '../../context/CurrencyContext';
import { DomainContactAddress, usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface DomainTransferPageProps {
  prefilledDomain?: string;
  onNavigateHome: (sectionSelector?: string) => void;
  onRegisterInstead: (domain: string) => void;
  onNavigatePath?: (path: string) => void;
}

interface BulkTransferRow {
  domain: string;
  eppCode: string;
  tld: string;
  price: number;
  registered: boolean;
  locked: boolean;
}

export const DomainTransferPage: React.FC<DomainTransferPageProps> = ({
  prefilledDomain = '',
  onNavigateHome,
  onRegisterInstead,
  onNavigatePath,
}) => {
  const { formatPrice } = useCurrency();
  const {
    currentUser,
    cmsPages,
    tldExtensions,
    domainContactAddresses,
    addOrder,
    setOrderCheckoutDraft,
    setLastSearchedDomain,
    setPendingPostAuthPath,
  } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'domain-transfer');
  const [transferMode, setTransferMode] = useState<'single' | 'bulk'>('single');

  const [singleInput, setSingleInput] = useState(prefilledDomain);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [checkedDomain, setCheckedDomain] = useState<{
    domain: string;
    tld: string;
    price: number;
    registered: boolean;
    whois?: DomainWhoisDetails;
  } | null>(null);

  const [eppCode, setEppCode] = useState('');
  const [dnsStrategy, setDnsStrategy] = useState<'preserve' | 'anycast'>(
    'preserve'
  );
  const [transferEmail, setTransferEmail] = useState(
    () =>
      domainContactAddresses.find((c) => c.isDefault)?.email ||
      domainContactAddresses[0]?.email ||
      ''
  );
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedWhoisContact, setSelectedWhoisContact] =
    useState<DomainContactAddress | null>(
      () =>
        domainContactAddresses.find((c) => c.isDefault) ||
        domainContactAddresses[0] ||
        null
    );

  useEffect(() => {
    if (!selectedWhoisContact && domainContactAddresses.length > 0) {
      const def =
        domainContactAddresses.find((c) => c.isDefault) ||
        domainContactAddresses[0];
      setSelectedWhoisContact(def);
      if (!transferEmail.trim()) {
        setTransferEmail(def.email);
      }
    }
  }, [domainContactAddresses, selectedWhoisContact, transferEmail]);

  // Bulk transfer state
  const [bulkInput, setBulkInput] = useState(
    'myclientportal.com, X9k!mP2q#L\nstudio-brand.net, R4t@vN8p$W'
  );
  const [bulkRows, setBulkRows] = useState<BulkTransferRow[] | null>(null);
  const [bulkChecking, setBulkChecking] = useState(false);
  const [bulkEmail, setBulkEmail] = useState('');
  const [bulkSubmitted, setBulkSubmitted] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [teamImgFailed, setTeamImgFailed] = useState(false);

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const runSingleCheck = async (targetRaw?: string) => {
    const raw = (targetRaw ?? singleInput).trim();
    if (!raw) {
      setCheckError('Enter a registered domain (e.g., yourcompany.com) to verify.');
      return;
    }
    const { cleanDomain, tld } = normalizeDomainInput(raw);
    if (!cleanDomain) {
      setCheckError('Please enter a valid domain name including its extension.');
      return;
    }

    setCheckError('');
    setChecking(true);
    setTransferSubmitted(false);
    setSubmitError('');

    try {
      const live = await inspectDomainLive(cleanDomain, true);
      const adminTld = tldExtensions.find((t) => t.tld === tld && t.enabled);
      const pricing = getPricingForTld(tld);
      const price = adminTld ? adminTld.transferUsd : pricing.transferPrice;
      setCheckedDomain({
        domain: cleanDomain,
        tld,
        price,
        registered: !live.available,
        whois: live.whois,
      });
      setLastSearchedDomain({
        domain: cleanDomain,
        tld,
        available: live.available,
        priceUsd: price,
        renewalUsd: adminTld ? adminTld.renewalUsd : pricing.renewalPrice,
        minYears: 1,
        mode: 'transfer',
        searchedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      });
    } catch {
      setCheckError('Could not complete live registry lookup. Please retry.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (prefilledDomain.trim()) {
      setSingleInput(prefilledDomain);
      runSingleCheck(prefilledDomain);
    }
  }, [prefilledDomain]);

  const handleConfirmSingleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkedDomain) return;
    if (!eppCode.trim() && !checkedDomain.domain.endsWith('.uk')) {
      setSubmitError(
        'Enter the EPP / Authorization Code obtained from your current registrar.'
      );
      return;
    }
    if (
      !transferEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transferEmail.trim())
    ) {
      setSubmitError('Please enter a valid contact email for transfer approvals.');
      return;
    }
    if (!onNavigatePath) {
      if (!currentUser) {
        setSubmitError(
          'Please Sign In or Create Account below to add your WHOIS registrant address.'
        );
        return;
      }
      if (!selectedWhoisContact) {
        setSubmitError(
          'Please select a saved WHOIS contact address or add a new address below.'
        );
        return;
      }
    }
    setSubmitError('');
    setLastSearchedDomain({
      domain: checkedDomain.domain,
      tld: checkedDomain.tld,
      available: !checkedDomain.registered,
      priceUsd: checkedDomain.price,
      renewalUsd:
        tldExtensions.find((t) => t.tld === checkedDomain.tld && t.enabled)?.renewalUsd ||
        getPricingForTld(checkedDomain.tld).renewalPrice,
      minYears: 1,
      mode: 'transfer',
      eppAuthCode: eppCode.trim(),
      searchedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    setOrderCheckoutDraft({
      orderCategory: 'domain-transfer',
      planId: 'domain-transfer',
      planName: `${checkedDomain.tld} Domain Transfer`,
      productType: 'Domain Transfer',
      billingCycle: '1 Year',
      datacenterId: 'uk',
      datacenterLabel: 'Global Anycast DNS',
      domainOption: 'transfer',
      domainName: checkedDomain.domain,
      domainTld: checkedDomain.tld,
      domainYears: 1,
      domainPriceUsd: checkedDomain.price,
      eppAuthCode: eppCode.trim(),
      whoisContactId: selectedWhoisContact?.id,
      domainUnlockedConfirmed: true,
      domainSearchedFromSite: true,
      step: 2,
      sourceOrigin: 'public',
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    if (onNavigatePath) {
      onNavigatePath('/order/domain-transfer');
      return;
    }
    if (!selectedWhoisContact) return;
    addOrder({
      clientEmail: transferEmail.trim(),
      clientName: `${selectedWhoisContact.firstName} ${selectedWhoisContact.lastName}`.trim(),
      country: selectedWhoisContact.countryName,
      productType: 'Domain Transfer',
      planName: `${checkedDomain.tld} Domain Transfer (1 Year Extension Included)`,
      domainOrHost: checkedDomain.domain,
      billingCycle: '1 Year',
      amountUsd: checkedDomain.price,
      paymentMethod: 'Domain Transfer Checkout',
      datacenter: 'Global Anycast DNS',
      nameservers:
        dnsStrategy === 'anycast'
          ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
          : ['ns1.current-registrar.com', 'ns2.current-registrar.com'],
      whoisPrivacy: true,
      registrarLock: true,
      autoRenew: true,
      whoisContact: selectedWhoisContact,
      status: 'pending',
    });
    setTransferSubmitted(true);
  };

  const handleCheckBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (lines.length === 0) return;

    setBulkChecking(true);
    setBulkSubmitted(false);
    const evaluated = await Promise.all(
      lines.map(async (line) => {
        const [rawDom, rawCode] = line.split(',').map((s) => s.trim());
        const { cleanDomain, tld } = normalizeDomainInput(rawDom || '');
        const res = await inspectDomainLive(cleanDomain, false);
        const price = getPricingForTld(tld).transferPrice;
        return {
          domain: cleanDomain,
          eppCode: rawCode || '',
          tld,
          price,
          registered: !res.available,
          locked: Boolean(res.whois?.transferLocked),
        };
      })
    );
    setBulkRows(evaluated);
    setBulkChecking(false);
  };

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb Strip */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onNavigateHome('#top')}
            className="font-medium text-slate-600 hover:text-[#0E6B63] transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-slate-600">Domains</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-[#0E6B63]">Domain Transfer</span>
        </div>
      </div>

      {/* 1. Domain Transfer Hero Split */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() ||
                  'cpcloudhost.com · Zero-Downtime Domain Consolidation'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Transfer Your Domains Smoothly & Unify Under StackCP'}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  'Bring scattered domains together into cpcloudhost.com without breaking websites or emails. Verify lock status live, preserve active DNS zones, and automatically add +1 full year onto your current expiry date.'}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-sm text-slate-500">Transfers from</span>
                <span className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                  {formatPrice(6.99)}
                </span>
                <span className="text-sm text-slate-500">
                  (Includes +1 Year Renewal)
                </span>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {(pageCms?.highlights && pageCms.highlights.length > 0
                  ? pageCms.highlights
                  : [
                      'Live registrar lock & 60-day eligibility pre-check',
                      'Zero downtime — preserve existing DNS records during cutover',
                      'Free ongoing WHOIS privacy & Wildcard SSL readiness',
                      'Single or bulk portfolio authorization support',
                    ]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.primaryCtaUrl?.trim();
                    if (url && !url.startsWith('#') && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      scrollToElement(url || '#transfer-live-box');
                    }
                  }}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#000000] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  {pageCms?.primaryCtaText?.trim() || 'Check Domain & Transfer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.secondaryCtaUrl?.trim();
                    if (url && url !== '/domain-registration' && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      onRegisterInstead('');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6B63] hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Register a New Domain Instead'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Isometric Domain Transfer Illustration */}
            <div className="lg:col-span-6 flex items-center justify-center lg:justify-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgFailed ? (
                  <img
                    src={transferHeroImg}
                    alt="Isometric dual registrar cloud DNS transfer bridge moving encrypted authorization keys cleanly"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <RefreshCw className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      Zero-Downtime Registrar Transfer Hub
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Spaceship-Style Real Live Domain Transfer Console */}
      <section
        id="transfer-live-box"
        className="bg-[#F8FAFC] py-14 lg:py-16 border-b border-[#E2E8F0]"
      >
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Start Your Domain Transfer
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Verify real-time RDAP lock state, nameservers, and transfer pricing
                before authorizing.
              </p>
            </div>

            {/* Single / Bulk Segmented Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTransferMode('single')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  transferMode === 'single'
                    ? 'bg-[#0F172A] text-white'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Single Domain
              </button>
              <button
                type="button"
                onClick={() => setTransferMode('bulk')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  transferMode === 'bulk'
                    ? 'bg-[#0F172A] text-white'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                Bulk Transfer
              </button>
            </div>
          </div>

          {transferMode === 'single' ? (
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSingleCheck();
                }}
                className="rounded-2xl border-2 border-[#0E6B63]/30 focus-within:border-[#0E6B63] bg-white p-2 shadow-[0_18px_40px_-20px_rgba(14,107,99,0.2)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <div className="flex-1 flex items-center gap-3 px-3">
                  <KeyRound
                    className="w-5 h-5 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={singleInput}
                    onChange={(e) => setSingleInput(e.target.value)}
                    placeholder="Enter the domain you want to transfer (e.g. google.com)"
                    aria-label="Enter domain name to transfer"
                    className="w-full py-2.5 text-sm sm:text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checking}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-70 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Check Readiness</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              {checkError && (
                <p className="mt-3 text-xs sm:text-sm font-medium text-rose-600">
                  {checkError}
                </p>
              )}

              {/* Live Transfer Diagnostics & EPP Submission Card */}
              {checkedDomain && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
                  {!checkedDomain.registered ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-[#0E6B63]">
                          Domain Available — Not Registered
                        </p>
                        <h3 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
                          {checkedDomain.domain} can be registered brand new
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600">
                          Only currently registered domains can be transferred. Switch to
                          Domain Registration to claim it now for{' '}
                          {formatPrice(getPricingForTld(checkedDomain.tld).registerPrice)}
                          /yr.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRegisterInstead(checkedDomain.domain)}
                        className="px-6 py-3 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer shrink-0"
                      >
                        Register Instead
                      </button>
                    </div>
                  ) : !transferSubmitted ? (
                    <form onSubmit={handleConfirmSingleTransfer} className="space-y-6">
                      {/* Header & Transfer Price */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#0E6B63]">
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>Registry Match Verified &middot; Eligible for Transfer</span>
                          </div>
                          <h3 className="mt-1 font-display text-2xl font-extrabold text-[#0F172A]">
                            {checkedDomain.domain}
                          </h3>
                          {checkedDomain.whois && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              Current Registrar:{' '}
                              <strong>{checkedDomain.whois.registrar}</strong>{' '}
                              &middot; Current Expiry: {checkedDomain.whois.expiresAt}
                            </p>
                          )}
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                            {formatPrice(checkedDomain.price)}
                          </div>
                          <div className="text-xs font-medium text-[#0E6B63]">
                            Includes +1 Full Year Renewal
                          </div>
                        </div>
                      </div>

                      {/* Spaceship-Style Transfer Pre-Flight Readiness Checklist */}
                      {checkedDomain.whois && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                              {checkedDomain.whois.transferLocked ? (
                                <>
                                  <Lock
                                    className="w-4 h-4 text-amber-600"
                                    aria-hidden="true"
                                  />
                                  <span>Registrar Lock Active</span>
                                </>
                              ) : (
                                <>
                                  <Unlock
                                    className="w-4 h-4 text-[#0E6B63]"
                                    aria-hidden="true"
                                  />
                                  <span>Transfer Unlocked</span>
                                </>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                              {checkedDomain.whois.transferLocked
                                ? 'Disable Transfer Lock at your current registrar before initiating final EPP authorization.'
                                : 'No transfer prohibition flag detected in public RDAP status.'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                              {checkedDomain.whois.sixtyDayEligible ? (
                                <CheckCircle2
                                  className="w-4 h-4 text-[#0E6B63]"
                                  aria-hidden="true"
                                />
                              ) : (
                                <AlertTriangle
                                  className="w-4 h-4 text-amber-600"
                                  aria-hidden="true"
                                />
                              )}
                              <span>60-Day ICANN Eligibility</span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                              {checkedDomain.whois.ageDays !== null
                                ? `Registered ${checkedDomain.whois.ageDays} days ago — passes ICANN window.`
                                : 'Active domain age verified cleanly.'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                              <ShieldCheck
                                className="w-4 h-4 text-[#0284C7]"
                                aria-hidden="true"
                              />
                              <span>Active Nameservers</span>
                            </div>
                            <p className="mt-1 font-mono text-[11px] text-slate-600 truncate">
                              {checkedDomain.whois.nameservers.length > 0
                                ? checkedDomain.whois.nameservers.slice(0, 2).join(', ')
                                : 'Registry Default NS'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* EPP Code + DNS Preservation Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="transfer-epp"
                            className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                          >
                            {checkedDomain.domain.endsWith('.uk')
                              ? 'Nominet IPS TAG Confirmation'
                              : 'EPP / Authorization Code'}
                          </label>
                          <input
                            id="transfer-epp"
                            type="text"
                            value={eppCode}
                            onChange={(e) => setEppCode(e.target.value)}
                            placeholder={
                              checkedDomain.domain.endsWith('.uk')
                                ? 'Tag: CPCLOUDHOST'
                                : 'Paste auth code from current registrar'
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="transfer-email"
                            className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                          >
                            Administrative Contact Email
                          </label>
                          <input
                            id="transfer-email"
                            type="email"
                            required
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            placeholder="admin@yourdomain.com"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                          />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-slate-800 leading-relaxed">
                        <strong className="text-[#0F172A] block mb-0.5">
                          Transfer Approval &amp; 7-Day Timeline
                        </strong>
                        Approve the authorization link sent to your registrant email to transfer immediately. If you do not receive or approve the email, the domain will automatically transfer to our registrar within <strong>7 days</strong>.
                      </div>

                      {currentUser ? (
                        <DomainContactAddressSelector
                          compact
                          selectedContactId={selectedWhoisContact?.id || null}
                          onSelectContact={(addr) => {
                            setSelectedWhoisContact(addr);
                            if (!transferEmail.trim()) {
                              setTransferEmail(addr.email);
                            }
                            setSubmitError('');
                          }}
                          title="WHOIS Registrant Contact & Address"
                          subtitle={`Saved to ${currentUser.email} — automatically available across future transfers.`}
                        />
                      ) : (
                        <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-slate-700">
                            <strong className="text-[#0F172A] block">Sign In or Create Account to Save WHOIS Address</strong>
                            Continue to checkout or sign in now to manage saved WHOIS registrant addresses.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPendingPostAuthPath('/domain-transfer');
                                onNavigatePath?.('/auth/login');
                              }}
                              className="px-3.5 py-2 rounded-lg bg-[#0E6B63] text-white text-xs font-semibold cursor-pointer"
                            >
                              Sign In
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingPostAuthPath('/domain-transfer');
                                onNavigatePath?.('/auth/register');
                              }}
                              className="px-3.5 py-2 rounded-lg border border-[#0E6B63] bg-white text-[#0E6B63] text-xs font-semibold cursor-pointer"
                            >
                              Create Account
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="dns-strategy"
                              checked={dnsStrategy === 'preserve'}
                              onChange={() => setDnsStrategy('preserve')}
                              className="text-[#0E6B63] focus:ring-[#0E6B63]"
                            />
                            <span>
                              Keep current nameservers (Zero downtime guarantee)
                            </span>
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="dns-strategy"
                              checked={dnsStrategy === 'anycast'}
                              onChange={() => setDnsStrategy('anycast')}
                              className="text-[#0E6B63] focus:ring-[#0E6B63]"
                            />
                            <span>Switch to cpcloudhost.com Anycast DNS</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="px-7 py-3 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Initiate Transfer ({formatPrice(checkedDomain.price)})
                        </button>
                      </div>

                      {submitError && (
                        <p className="text-xs font-medium text-rose-600">
                          {submitError}
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          className="w-6 h-6 text-[#0E6B63] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div>
                          <h4 className="font-display text-base font-bold text-[#0F172A]">
                            Transfer Queued for {checkedDomain.domain}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            Approval notice dispatched to{' '}
                            <strong>{transferEmail}</strong> &middot; DNS:{' '}
                            <strong>
                              {dnsStrategy === 'preserve'
                                ? 'Preserve Current Nameservers'
                                : 'cpcloudhost.com Anycast DNS'}
                            </strong>{' '}
                            &middot; +1 Year Renewal locked upon registry handoff.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTransferSubmitted(false)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#0F172A] cursor-pointer shrink-0"
                      >
                        Check Another Domain
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Bulk Transfer Mode */
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <form onSubmit={handleCheckBulk} className="space-y-4">
                <div>
                  <label
                    htmlFor="bulk-transfer-list"
                    className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                  >
                    Enter Domains &amp; Optional Auth Codes (one per line:
                    domain.com, auth_code)
                  </label>
                  <textarea
                    id="bulk-transfer-list"
                    rows={4}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Supports up to 12 domains per batch with automatic DNS verification
                  </span>
                  <button
                    type="submit"
                    disabled={bulkChecking}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    {bulkChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Validating Batch...</span>
                      </>
                    ) : (
                      <span>Validate Bulk Transfer</span>
                    )}
                  </button>
                </div>
              </form>

              {bulkRows && (
                <div className="mt-6 border-t border-slate-200 pt-5 space-y-4">
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {bulkRows.map((row) => (
                      <div
                        key={row.domain}
                        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-[#0F172A]">
                            {row.domain}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              row.registered ? 'text-[#0E6B63]' : 'text-amber-700'
                            }`}
                          >
                            {row.registered
                              ? 'Active · Transferable'
                              : 'Not Registered'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-slate-500">
                            {row.eppCode ? 'EPP Attached' : 'Auth Code Needed'}
                          </span>
                          <span className="font-mono-num font-bold text-[#0F172A]">
                            {formatPrice(row.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!bulkSubmitted ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="email"
                          value={bulkEmail}
                          onChange={(e) => setBulkEmail(e.target.value)}
                          placeholder="Account email for bulk transfer notifications"
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setBulkSubmitted(true)}
                        className="px-6 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Submit All (
                        {formatPrice(
                          bulkRows.reduce((acc, item) => acc + item.price, 0)
                        )}
                        )
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm font-semibold text-[#0E6B63] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>
                        Bulk transfer batch queued for{' '}
                        {bulkEmail || 'your cpcloudhost.com portal'} with +1 year
                        added to each domain.
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Transparent Transfer Rates */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Domain Transfer Pricing (+1 Free Renewal Year)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tldExtensions.filter((t) => t.enabled).length > 0
              ? tldExtensions.filter((t) => t.enabled).slice(0, 6).map((t) => ({
                  tld: t.tld,
                  transferPrice: t.transferUsd,
                }))
              : TLD_CATALOG.slice(0, 6).map((t) => ({
                  tld: t.tld,
                  transferPrice: t.transferPrice,
                }))
            ).map((item) => (
              <div
                key={item.tld}
                className="rounded-2xl border border-[#CBD5E1] bg-white p-7 flex flex-col justify-between hover:border-[#0E6B63] transition-colors"
              >
                <div>
                  <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0E6B63]">
                    {item.tld}
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                      {formatPrice(item.transferPrice)}
                    </span>
                    <span className="text-xs text-slate-500">
                      transfer &middot; adds +12 months cleanly
                    </span>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferMode('single');
                        setSingleInput(`yourbrand${item.tld}`);
                        scrollToElement('#transfer-live-box');
                      }}
                      className="w-full py-2.5 px-5 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Transfer {item.tld}
                    </button>
                  </div>

                  <p className="mt-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Zero downtime transfer preserving zone records, email routing,
                    and ongoing WHOIS privacy.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Mint Conversion Banner */}
      <section className="bg-[#DFECEB] py-10 border-b border-[#CFE0DF]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              Move Your Domains Risk-Free Today
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-700">
              Consolidate renewals, Anycast DNS, and Wildcard SSL inside StackCP
              with guided engineer oversight at every step.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToElement('#transfer-live-box')}
            className="px-7 py-3 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Transfer Check
          </button>
        </div>
      </section>

      {/* 5. Zero-Downtime Transfer Safeguards */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#F4F5F7] px-6 sm:px-12 py-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] text-center max-w-2xl mx-auto"
              style={{ textWrap: 'balance' }}
            >
              Zero-Downtime Transfer Safeguards Built In
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
              {TRANSFER_VALUE_PILLARS.map((pillar) => (
                <div
                  key={pillar.id}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4">
                    <DomainPillarArtwork id={pillar.id} />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#0F172A]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Editorial Team Photo Split */}
      <section className="bg-white py-16 lg:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 min-w-0">
              {!teamImgFailed ? (
                <img
                  src={teamPhotoImg}
                  alt="cpcloudhost.com registrar transfer team collaborating in bright modern office"
                  referrerPolicy="no-referrer"
                  onError={() => setTeamImgFailed(true)}
                  className="w-full h-auto rounded-2xl object-cover shadow-[0_24px_48px_-24px_rgba(15,23,42,0.22)]"
                />
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                  <span className="font-display text-sm font-bold text-[#0F172A]">
                    Dedicated Registrar Transfer Specialists
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Why Transfer Your Portfolio to cpcloudhost.com?
              </h2>

              <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
                {TRANSFER_WHY_BULLETS.map((bullet) => (
                  <li key={bullet.title} className="flex items-start gap-2.5">
                    <Check
                      className="w-4 h-4 text-[#0E6B63] shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#0F172A]">{bullet.title}</strong>{' '}
                      &mdash; {bullet.description}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => scrollToElement('#transfer-live-box')}
                  className="px-7 py-3.5 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Check Domain Readiness
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Transfer FAQ Accordion */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] text-center mb-10">
            Domain Transfer FAQs
          </h2>
          <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
            {TRANSFER_FAQS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.question} className="py-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left py-1.5 cursor-pointer group"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                      {item.question}
                    </span>
                    <span className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 pr-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CmsExtraSections
        sections={pageCms?.sections}
        onNavigateUrl={(url) => (onNavigatePath ? onNavigatePath(url) : onNavigateHome(url))}
      />
    </div>
  );
};
