import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Globe,
  Loader2,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import domainHeroImg from '../../assets/images/domain_hero_isometric_cloud_1794564997814.jpg';
import teamPhotoImg from '../../assets/images/domain_team_workspace_photo_1794564999448.jpg';
import {
  REGISTRATION_FAQS,
  REGISTRATION_VALUE_PILLARS,
  REGISTRATION_WHY_BULLETS,
} from '../../data/domainPagesData';
import {
  DomainSearchResult,
  DomainWhoisDetails,
  TLD_CATALOG,
  inspectDomainLive,
  runFullDomainSearch,
} from '../../utils/domainLookup';
import { DomainPillarArtwork } from './DomainArtworkEmblems';
import { DomainContactAddressSelector } from './DomainContactAddressSelector';
import { useCurrency } from '../../context/CurrencyContext';
import { DomainContactAddress, usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface DomainRegistrationPageProps {
  initialQuery?: string;
  onNavigateHome: (sectionSelector?: string) => void;
  onTransferDomain: (domain: string) => void;
  onNavigatePath?: (path: string) => void;
}

export const DomainRegistrationPage: React.FC<DomainRegistrationPageProps> = ({
  initialQuery = '',
  onNavigateHome,
  onTransferDomain,
  onNavigatePath,
}) => {
  const { formatPrice, countryName } = useCurrency();
  const {
    currentUser,
    addOrder,
    cmsPages,
    tldExtensions,
    domainContactAddresses,
    setOrderCheckoutDraft,
    setLastSearchedDomain,
    setPendingPostAuthPath,
  } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'domain-registration');
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState<{
    primary: DomainSearchResult;
    extensions: DomainSearchResult[];
    suggestions: DomainSearchResult[];
  } | null>(null);

  const [expandedWhoisDomain, setExpandedWhoisDomain] = useState<string | null>(
    null
  );
  const [whoisCache, setWhoisCache] = useState<Record<string, DomainWhoisDetails>>(
    {}
  );
  const [loadingWhoisDomain, setLoadingWhoisDomain] = useState<string | null>(
    null
  );

  const [registerTarget, setRegisterTarget] = useState<DomainSearchResult | null>(
    null
  );
  const [registrantEmail, setRegistrantEmail] = useState('');
  const [enablePrivacy, setEnablePrivacy] = useState(true);
  const [enableFreeHosting, setEnableFreeHosting] = useState(true);
  const [registerFormError, setRegisterFormError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [selectedWhoisContact, setSelectedWhoisContact] =
    useState<DomainContactAddress | null>(
      () =>
        domainContactAddresses.find((c) => c.isDefault) ||
        domainContactAddresses[0] ||
        null
    );

  useEffect(() => {
    if (!selectedWhoisContact && domainContactAddresses.length > 0) {
      setSelectedWhoisContact(
        domainContactAddresses.find((c) => c.isDefault) || domainContactAddresses[0]
      );
    }
  }, [domainContactAddresses, selectedWhoisContact]);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [teamImgFailed, setTeamImgFailed] = useState(false);

  const scrollToElement = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePerformSearch = async (overrideQuery?: string) => {
    const raw = (overrideQuery ?? queryInput).trim();
    if (!raw) {
      setSearchError('Enter a domain or brand name (e.g., acmestudio.com) to search.');
      return;
    }
    setSearchError('');
    setSearching(true);
    setExpandedWhoisDomain(null);
    setRegisterTarget(null);
    setRegistrationComplete(false);

    try {
      const data = await runFullDomainSearch(raw);
      const mapAdminPrice = (item: DomainSearchResult): DomainSearchResult => {
        const tldRec = tldExtensions.find((t) => t.tld === item.tld && t.enabled);
        if (!tldRec) return item;
        const regUsd = tldRec.minYears === 2 ? tldRec.year2Usd : tldRec.year1Usd;
        return {
          ...item,
          price: regUsd,
          renewalPrice: tldRec.renewalUsd,
          minYears: tldRec.minYears,
        };
      };
      const mappedPrimary = mapAdminPrice(data.primary);
      setResults({
        primary: mappedPrimary,
        extensions: data.extensions.slice(0, 5).map(mapAdminPrice),
        suggestions: data.suggestions.slice(0, 5).map(mapAdminPrice),
      });
      setLastSearchedDomain({
        domain: mappedPrimary.domain,
        tld: mappedPrimary.tld,
        available: mappedPrimary.available,
        priceUsd: mappedPrimary.price,
        renewalUsd: mappedPrimary.renewalPrice,
        minYears: mappedPrimary.minYears === 2 ? 2 : 1,
        mode: mappedPrimary.available ? 'register' : 'transfer',
        searchedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      });
      if (data.primary.whois) {
        setWhoisCache((prev) => ({
          ...prev,
          [data.primary.domain]: data.primary.whois!,
        }));
      }
    } catch {
      setSearchError('Unable to reach live registry lookup. Please retry in a moment.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery.trim()) {
      setQueryInput(initialQuery);
      void handlePerformSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleToggleWhois = async (item: DomainSearchResult) => {
    if (expandedWhoisDomain === item.domain) {
      setExpandedWhoisDomain(null);
      return;
    }
    setExpandedWhoisDomain(item.domain);

    if (whoisCache[item.domain]?.source === 'RDAP + DNS') {
      return;
    }
    setLoadingWhoisDomain(item.domain);
    const live = await inspectDomainLive(item.domain, true);
    if (live.whois) {
      setWhoisCache((prev) => ({ ...prev, [item.domain]: live.whois! }));
    }
    setLoadingWhoisDomain(null);
  };

  const handleSelectTldChip = (tld: string) => {
    const slug = queryInput.trim().split('.')[0] || 'yourbrand';
    const next = `${slug}${tld}`;
    setQueryInput(next);
    scrollToElement('#domain-live-search');
    handlePerformSearch(next);
  };

  const handleStartRegistration = (item: DomainSearchResult) => {
    setRegisterTarget(item);
    setRegistrationComplete(false);
    setRegisterFormError('');
    setLastSearchedDomain({
      domain: item.domain,
      tld: item.tld,
      available: item.available,
      priceUsd: item.price,
      renewalUsd: item.renewalPrice,
      minYears: item.minYears === 2 ? 2 : 1,
      mode: 'register',
      searchedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    setOrderCheckoutDraft({
      orderCategory: 'domain-registration',
      planId: 'domain-reg',
      planName: `${item.tld} Domain Registration`,
      productType: 'Domain Registration',
      billingCycle: item.minYears === 2 ? '2 Years' : '1 Year',
      datacenterId: 'uk',
      datacenterLabel: 'Global Anycast DNS',
      domainOption: 'register',
      domainName: item.domain,
      domainTld: item.tld,
      domainYears: (item.minYears === 2 ? 2 : 1) as 1 | 2,
      domainPriceUsd: item.price,
      whoisContactId: selectedWhoisContact?.id,
      domainSearchedFromSite: true,
      step: 2,
      sourceOrigin: 'public',
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    if (onNavigatePath) {
      onNavigatePath('/order/domain-registration');
      return;
    }
    setTimeout(() => {
      scrollToElement('#domain-register-checkout');
    }, 60);
  };

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setRegisterFormError(
        'Please Sign In or Create Account below to add your WHOIS Contact & Address.'
      );
      return;
    }
    const cleaned = (registrantEmail.trim() || selectedWhoisContact?.email || '').trim();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setRegisterFormError(
        'Please enter a valid registrant email address to lock your domain.'
      );
      return;
    }
    if (!selectedWhoisContact) {
      setRegisterFormError(
        'Please add and select your WHOIS Contact & Address details below.'
      );
      return;
    }
    setRegisterFormError('');
    if (registerTarget) {
      addOrder({
        clientEmail: cleaned,
        clientName: `${selectedWhoisContact.firstName} ${selectedWhoisContact.lastName}`.trim(),
        country: selectedWhoisContact.countryName || countryName || 'International',
        productType: 'Domain Registration',
        planName: `Domain Registration${enablePrivacy ? ' + WHOIS Privacy' : ''}`,
        domainOrHost: registerTarget.domain,
        billingCycle: registerTarget.minYears === 2 ? '2 Years' : '1 Year',
        amountUsd: registerTarget.price,
        datacenter: 'Global Anycast DNS',
        paymentMethod: 'Domain Checkout',
        whoisPrivacy: enablePrivacy,
        registrarLock: true,
        autoRenew: true,
        whoisContact: selectedWhoisContact,
        status: 'pending',
      });
    }
    setRegistrationComplete(true);
  };

  const renderWhoisDrawer = (domain: string, fallbackWhois?: DomainWhoisDetails) => {
    const info = whoisCache[domain] || fallbackWhois;
    if (expandedWhoisDomain !== domain) return null;

    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs text-slate-700">
        {loadingWhoisDomain === domain ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E6B63]" />
            <span>Querying live RDAP &amp; nameserver registry records...</span>
          </div>
        ) : info ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="block text-[11px] text-slate-500">Registrar</span>
              <span className="font-semibold text-[#0F172A]">{info.registrar}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">Registered On</span>
              <span className="font-semibold text-[#0F172A]">{info.createdAt}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">Expires On</span>
              <span className="font-semibold text-[#0F172A]">{info.expiresAt}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">Nameservers</span>
              <span className="font-mono text-[11px] text-[#0F172A]">
                {info.nameservers.length > 0
                  ? info.nameservers.slice(0, 3).join(', ')
                  : 'Registry Delegated'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">EPP / Lock Status</span>
              <span className="font-mono text-[11px] text-[#0F172A]">
                {info.statuses.slice(0, 2).join(', ')}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">Verification Source</span>
              <span className="font-semibold text-[#0E6B63]">{info.source}</span>
            </div>
          </div>
        ) : (
          <p className="text-slate-600">
            Active DNS delegation verified in public root zone.
          </p>
        )}
      </div>
    );
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
          <span className="font-semibold text-[#0E6B63]">
            Domain Registration
          </span>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] overflow-x-clip">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {pageCms?.heroBadge?.trim() ||
                  'cpcloudhost.com · Accredited Domain & Anycast DNS'}
              </p>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() ||
                  'Secure Your Brand Domain — Fast, Transparent & Managed'}
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {pageCms?.heroSubtitle?.trim() ||
                  'Register, configure, or consolidate domains effortlessly inside StackCP at cpcloudhost.com. Launch live DNS records, custom email forwarding, and Wildcard SSL certificates in minutes from one unified portal.'}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-sm text-slate-500">From</span>
                <span className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                  {formatPrice(6.99)}/yr
                </span>
                <span className="text-sm text-slate-500">(.co.uk)</span>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {(pageCms?.highlights && pageCms.highlights.length > 0
                  ? pageCms.highlights
                  : [
                      'Live availability & real-time WHOIS / RDAP lookup',
                      'Seamless inbound transfers (adds +1 year automatically)',
                      'Complimentary Anycast DNS, SSL & email forwarding',
                      '24/7 UK, EU & USA domain engineering support',
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
                      scrollToElement(url || '#domain-live-search');
                    }
                  }}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-[#000000] hover:bg-[#0E6B63] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  {pageCms?.primaryCtaText?.trim() || 'Search Domains'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = pageCms?.secondaryCtaUrl?.trim();
                    if (url && url !== '/domain-transfer' && onNavigatePath) {
                      onNavigatePath(url);
                    } else {
                      onTransferDomain('');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6B63] hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                  <span>{pageCms?.secondaryCtaText?.trim() || 'Transfer Existing Domain'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Isometric Studio Illustration */}
            <div className="lg:col-span-6 flex items-center justify-center lg:justify-end min-w-0">
              <div className="w-full max-w-[540px]">
                {!heroImgFailed ? (
                  <img
                    src={domainHeroImg}
                    alt="Isometric cloud DNS platform displaying domain registration cards, globe emblem, and SSL shield"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <Globe className="w-10 h-10 text-[#0284C7]" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-[#0F172A]">
                      cpcloudhost.com Domain Registry &amp; Anycast DNS
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hostinger-Style Real Live Domain Search Console */}
      <section
        id="domain-live-search"
        className="bg-[#F8FAFC] py-14 lg:py-16 border-b border-[#E2E8F0]"
      >
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Find Your Perfect Domain in Real Time
            </h2>
            <p className="mt-2.5 text-sm text-slate-600">
              Check live registry availability, compare alternative extensions, inspect
              WHOIS records, or transfer your existing domain.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformSearch();
            }}
            className="mt-7 rounded-2xl border-2 border-[#0E6B63]/30 focus-within:border-[#0E6B63] bg-white p-2 shadow-[0_18px_40px_-20px_rgba(14,107,99,0.2)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Type your desired domain or keyword (e.g. cloudpeak.com)"
                aria-label="Enter domain name to check live availability"
                className="w-full py-2.5 text-sm sm:text-base text-[#0F172A] placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-70 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Checking Registry...</span>
                </>
              ) : (
                <>
                  <span>Search Availability</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Quick TLD Shortcut Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(tldExtensions.filter((t) => t.enabled).length > 0
              ? tldExtensions.filter((t) => t.enabled).slice(0, 6).map((t) => ({
                  tld: t.tld,
                  registerPrice: t.minYears === 2 ? t.year2Usd : t.year1Usd,
                }))
              : TLD_CATALOG.slice(0, 6)
            ).map((item) => (
              <button
                key={item.tld}
                type="button"
                onClick={() => handleSelectTldChip(item.tld)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                <span>{item.tld}</span>{' '}
                <span className="font-mono-num text-[#0E6B63]">
                  {formatPrice(item.registerPrice)}
                </span>
              </button>
            ))}
          </div>

          {searchError && (
            <p className="mt-4 text-center text-xs sm:text-sm font-medium text-rose-600">
              {searchError}
            </p>
          )}

          {/* Live Domain Lookup Results */}
          {results && (
            <div className="mt-8 space-y-6">
              {/* Primary Domain Highlight Card */}
              <div
                className={`rounded-2xl border-2 p-6 bg-white shadow-sm ${
                  results.primary.available
                    ? 'border-[#0E6B63]'
                    : 'border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide ${
                          results.primary.available
                            ? 'text-[#0E6B63]'
                            : 'text-amber-700'
                        }`}
                      >
                        {results.primary.available ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>Available Now &middot; Exact Match</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" aria-hidden="true" />
                            <span>Already Registered &middot; Live RDAP/DNS</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] break-all">
                      {results.primary.domain}
                    </h3>

                    {!results.primary.available && results.primary.whois && (
                      <p className="mt-1 text-xs text-slate-500">
                        Registrar: <strong>{results.primary.whois.registrar}</strong>{' '}
                        &middot; Expires: {results.primary.whois.expiresAt}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {results.primary.available ? (
                      <>
                        <div className="text-right mr-1">
                          <div className="font-mono-num font-display text-2xl font-extrabold text-[#0F172A]">
                            {formatPrice(results.primary.price)}
                            <span className="text-xs font-normal text-slate-500">
                              /yr
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Renews {formatPrice(results.primary.renewalPrice)}/yr
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartRegistration(results.primary)}
                          className="px-6 py-3 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                          Register Domain
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleWhois(results.primary)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-300 bg-white hover:border-[#0F172A] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                        >
                          <span>WHOIS Info</span>
                          {expandedWhoisDomain === results.primary.domain ? (
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onTransferDomain(results.primary.domain)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Transfer Domain</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {renderWhoisDrawer(results.primary.domain, results.primary.whois)}
              </div>

              {/* Inline Registration Confirmation Card */}
              {registerTarget && (
                <div
                  id="domain-register-checkout"
                  className="rounded-2xl border-2 border-[#0E6B63] bg-white p-6"
                >
                  {!registrationComplete ? (
                    <form
                      onSubmit={handleConfirmRegistration}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
                    >
                      <div className="lg:col-span-5">
                        <p className="text-xs font-semibold text-[#0E6B63]">
                          Instant Registration Reservation &middot; cpcloudhost.com
                        </p>
                        <h4 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
                          {registerTarget.domain}
                        </h4>
                        <p className="mt-1 text-xs text-slate-600">
                          1-Year Registration + StackCP Anycast DNS + Wildcard SSL
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between text-sm">
                          <span className="text-slate-600">Total First Year:</span>
                          <span className="font-mono-num font-display text-xl font-extrabold text-[#0E6B63]">
                            {formatPrice(registerTarget.price)}
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-7 space-y-3.5">
                        <div>
                          <label
                            htmlFor="reg-email"
                            className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                          >
                            Registrant Email for StackCP Ownership &amp; DNS Access
                          </label>
                          <input
                            id="reg-email"
                            type="email"
                            required
                            value={registrantEmail}
                            onChange={(e) => setRegistrantEmail(e.target.value)}
                            placeholder="owner@company.com"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#0F172A] focus:outline-none focus:border-[#0E6B63]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enablePrivacy}
                              onChange={(e) => setEnablePrivacy(e.target.checked)}
                              className="rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                            />
                            <span>Include Free WHOIS Privacy Protection</span>
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enableFreeHosting}
                              onChange={(e) => setEnableFreeHosting(e.target.checked)}
                              className="rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                            />
                            <span>Attach Complimentary Basic Cloud Hosting</span>
                          </label>
                        </div>

                        {currentUser ? (
                          <DomainContactAddressSelector
                            compact
                            selectedContactId={selectedWhoisContact?.id || null}
                            onSelectContact={(addr) => {
                              setSelectedWhoisContact(addr);
                              if (!registrantEmail.trim()) {
                                setRegistrantEmail(addr.email);
                              }
                              setRegisterFormError('');
                            }}
                            title="WHOIS Contact & Address"
                            subtitle={`Saved to ${currentUser.email} — reused automatically for future domains.`}
                          />
                        ) : (
                          <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-700">
                              <strong className="text-[#0F172A] block">Sign In or Create Account to Add WHOIS Address</strong>
                              Registrant addresses save securely to your account after authentication.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingPostAuthPath('/domain-registration');
                                  onNavigatePath?.('/auth/login');
                                }}
                                className="px-3.5 py-2 rounded-lg bg-[#0E6B63] text-white text-xs font-semibold cursor-pointer"
                              >
                                Sign In
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingPostAuthPath('/domain-registration');
                                  onNavigatePath?.('/auth/register');
                                }}
                                className="px-3.5 py-2 rounded-lg border border-[#0E6B63] bg-white text-[#0E6B63] text-xs font-semibold cursor-pointer"
                              >
                                Create Account
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-1">
                          {registerFormError ? (
                            <span className="text-xs font-medium text-rose-600">
                              {registerFormError}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Team reviews order &rarr; approval &amp; WHOIS verify email sent
                            </span>
                          )}
                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Complete Registration
                          </button>
                        </div>
                      </div>
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
                            {registerTarget.domain} Reserved for {registrantEmail}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                            WHOIS Privacy:{' '}
                            <strong>{enablePrivacy ? 'Enabled' : 'Standard'}</strong>{' '}
                            &middot; DNS Zone queued on StackCP Anycast nameservers.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegisterTarget(null)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#0F172A] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Other Extensions + Brand Suggestions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Extension Alternatives */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200">
                    <h4 className="font-display text-sm font-bold text-[#0F172A]">
                      Alternative Extensions
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {results.extensions.map((extItem) => (
                      <div key={extItem.domain} className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-display text-sm font-bold text-[#0F172A] truncate">
                              {extItem.domain}
                            </div>
                            <div
                              className={`text-[11px] font-medium ${
                                extItem.available ? 'text-[#0E6B63]' : 'text-slate-500'
                              }`}
                            >
                              {extItem.available ? 'Available' : 'Registered'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono-num text-xs font-bold text-[#0F172A]">
                              {formatPrice(extItem.price)}/yr
                            </span>
                            {extItem.available ? (
                              <button
                                type="button"
                                onClick={() => handleStartRegistration(extItem)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Register
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleWhois(extItem)}
                                  className="px-2.5 py-1.5 rounded-full border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 cursor-pointer"
                                >
                                  WHOIS
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onTransferDomain(extItem.domain)}
                                  className="px-3 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#0E6B63] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Transfer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {renderWhoisDrawer(extItem.domain, extItem.whois)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Available Domain Ideas */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-slate-200">
                    <h4 className="font-display text-sm font-bold text-[#0F172A]">
                      Smart Brand Suggestions
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {results.suggestions.map((sug) => (
                      <div key={sug.domain} className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-display text-sm font-bold text-[#0F172A] truncate">
                              {sug.domain}
                            </div>
                            <div
                              className={`text-[11px] font-medium ${
                                sug.available ? 'text-[#0E6B63]' : 'text-slate-500'
                              }`}
                            >
                              {sug.available ? 'Available' : 'Registered'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono-num text-xs font-bold text-[#0F172A]">
                              {formatPrice(sug.price)}/yr
                            </span>
                            {sug.available ? (
                              <button
                                type="button"
                                onClick={() => handleStartRegistration(sug)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Register
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleWhois(sug)}
                                  className="px-2.5 py-1.5 rounded-full border border-slate-200 hover:border-slate-400 text-[11px] font-semibold text-slate-700 cursor-pointer"
                                >
                                  WHOIS
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onTransferDomain(sug.domain)}
                                  className="px-3 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#0E6B63] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Transfer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {renderWhoisDrawer(sug.domain, sug.whois)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Popular Extensions & Pricing 6-Card Grid */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Popular Domain Extensions &amp; Transparent Pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tldExtensions.filter((t) => t.enabled).length > 0
              ? tldExtensions.filter((t) => t.enabled).slice(0, 6)
              : TLD_CATALOG.slice(0, 6).map((c) => ({
                  id: c.tld,
                  tld: c.tld,
                  description: c.description,
                  minYears: 1 as const,
                  year1Usd: c.registerPrice,
                  year2Usd: c.registerPrice * 2,
                  renewalUsd: c.renewalPrice,
                  transferUsd: c.transferPrice,
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
                      {formatPrice(item.minYears === 2 ? item.year2Usd : item.year1Usd)}
                    </span>
                    <span className="text-xs text-slate-500">
                      /{item.minYears === 2 ? '2yr' : 'yr'} &middot; Renews {formatPrice(item.renewalUsd)}/yr
                    </span>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => handleSelectTldChip(item.tld)}
                      className="w-full py-2.5 px-5 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Search Now
                    </button>
                  </div>

                  <p className="mt-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
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
              Claim Your Ideal Domain Name Today
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-700">
              Every domain includes complimentary starter hosting, full DNS control,
              email forwarding, Wildcard SSL, and global CDN.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToElement('#domain-live-search')}
            className="px-7 py-3 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Search For A Domain
          </button>
        </div>
      </section>

      {/* 5. Best Value Domains: Included Free */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-[#F4F5F7] px-6 sm:px-12 py-14">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] text-center max-w-2xl mx-auto"
              style={{ textWrap: 'balance' }}
            >
              Built-In Domain Features: Included With Every Registration
            </h2>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
              {REGISTRATION_VALUE_PILLARS.map((pillar) => (
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

      {/* 6. Why Register With cpcloudhost.com */}
      <section className="bg-white py-16 lg:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 min-w-0">
              {!teamImgFailed ? (
                <img
                  src={teamPhotoImg}
                  alt="cpcloudhost.com engineering and domain support specialists standing together in bright studio"
                  referrerPolicy="no-referrer"
                  onError={() => setTeamImgFailed(true)}
                  className="w-full h-auto rounded-2xl object-cover shadow-[0_24px_48px_-24px_rgba(15,23,42,0.22)]"
                />
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-[#0E6B63]" aria-hidden="true" />
                  <span className="font-display text-sm font-bold text-[#0F172A]">
                    24/7 Domain &amp; DNS Engineering Team
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Why Register Your Domains With cpcloudhost.com?
              </h2>

              <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
                {REGISTRATION_WHY_BULLETS.map((bullet) => (
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
                  onClick={() => scrollToElement('#domain-live-search')}
                  className="px-7 py-3.5 rounded-full bg-[#000000] hover:bg-[#0E6B63] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Search Your Domain
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] text-center mb-10">
            Domain Registration FAQs
          </h2>
          <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
            {REGISTRATION_FAQS.map((item, idx) => {
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
