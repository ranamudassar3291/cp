import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Globe, Search, ShieldCheck, XCircle } from 'lucide-react';
import { TLD_PRICES } from '../data/hostingData';
import { useCurrency } from '../context/CurrencyContext';
import { usePlatform } from '../context/PlatformContext';

interface DomainLookupResult {
  domain: string;
  tld: string;
  price: string;
  termLabel: string;
  available: boolean;
}

interface DomainSearchSectionProps {
  onNavigatePath?: (path: string) => void;
}

export const DomainSearchSection: React.FC<DomainSearchSectionProps> = ({
  onNavigatePath,
}) => {
  const { formatPriceString } = useCurrency();
  const { tldExtensions, setOrderCheckoutDraft } = usePlatform();
  const [query, setQuery] = useState('');
  const [activeTld, setActiveTld] = useState('.com');
  const [error, setError] = useState('');
  const [results, setResults] = useState<DomainLookupResult[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const liveTldItems = useMemo(() => {
    const enabled = tldExtensions.filter((t) => t.enabled);
    if (enabled.length === 0) {
      return TLD_PRICES.slice(0, 5).map((t) => ({
        tld: t.tld,
        price: t.price,
        priceUsd: Number(t.price.replace(/[^0-9.]/g, '')) || 12.99,
        transferUsd: Number(t.price.replace(/[^0-9.]/g, '')) || 12.99,
        minYears: (t.tld === '.pk' ? 2 : 1) as 1 | 2,
        termLabel: t.tld === '.pk' ? '2yr' : 'yr',
      }));
    }
    return enabled.slice(0, 5).map((t) => {
      const regUsd = t.minYears === 2 ? t.year2Usd : t.year1Usd;
      return {
        tld: t.tld,
        price: `$${regUsd.toFixed(2)}`,
        priceUsd: regUsd,
        transferUsd: t.transferUsd,
        minYears: t.minYears,
        termLabel: t.minYears === 2 ? '2yr' : 'yr',
      };
    });
  }, [tldExtensions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = query
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    if (!cleaned || cleaned.length < 2) {
      setError('Enter a domain name such as yourbrand.com.');
      setResults([]);
      return;
    }

    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(cleaned)) {
      setError('Use letters, numbers, or hyphens only.');
      setResults([]);
      return;
    }

    setError('');
    setSelectedDomain(null);
    const baseName = cleaned.includes('.') ? cleaned.split('.')[0] : cleaned;
    const requestedTld = cleaned.includes('.')
      ? `.${cleaned.split('.').slice(1).join('.')}`
      : activeTld;

    const hash = baseName
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const orderedTlds = [
      ...liveTldItems.filter((t) => t.tld === requestedTld),
      ...liveTldItems.filter((t) => t.tld !== requestedTld),
    ];

    if (!liveTldItems.some((t) => t.tld === requestedTld)) {
      const adminMatch = tldExtensions.find((t) => t.tld === requestedTld);
      const fallbackUsd = adminMatch
        ? adminMatch.minYears === 2
          ? adminMatch.year2Usd
          : adminMatch.year1Usd
        : requestedTld === '.pk'
        ? 29.99
        : 12.99;
      orderedTlds.unshift({
        tld: requestedTld,
        price: `$${fallbackUsd.toFixed(2)}`,
        priceUsd: fallbackUsd,
        transferUsd: adminMatch?.transferUsd ?? 12.99,
        minYears: adminMatch?.minYears ?? (requestedTld === '.pk' ? 2 : 1),
        termLabel: requestedTld === '.pk' || adminMatch?.minYears === 2 ? '2yr' : 'yr',
      });
    }

    setResults(
      orderedTlds.slice(0, 5).map((entry, index) => ({
        domain: `${baseName}${entry.tld}`,
        tld: entry.tld,
        price: entry.price,
        termLabel: entry.termLabel,
        available: !(index === 0 && hash % 6 === 0),
      }))
    );
  };

  const handleProceedOrder = (res: DomainLookupResult, mode: 'register' | 'transfer') => {
    setSelectedDomain(res.domain);
    const tldRecord = tldExtensions.find((t) => t.tld === res.tld);
    const regUsd = tldRecord
      ? tldRecord.minYears === 2
        ? tldRecord.year2Usd
        : tldRecord.year1Usd
      : Number(res.price.replace(/[^0-9.]/g, '')) || 12.99;
    const transferUsd = tldRecord?.transferUsd ?? regUsd;
    const minYears = tldRecord?.minYears ?? (res.tld === '.pk' ? 2 : 1);

    setOrderCheckoutDraft({
      orderCategory: mode === 'transfer' ? 'domain-transfer' : 'domain-registration',
      planId: mode === 'transfer' ? 'domain-transfer' : 'domain-reg',
      planName: `${res.tld} ${mode === 'transfer' ? 'Domain Transfer' : 'Domain Registration'}`,
      productType: mode === 'transfer' ? 'Domain Transfer' : 'Domain Registration',
      billingCycle: mode === 'register' && minYears === 2 ? '2 Years' : '1 Year',
      datacenterId: 'uk',
      datacenterLabel: 'Global Anycast DNS',
      domainOption: mode,
      domainName: res.domain,
      domainTld: res.tld,
      domainYears: mode === 'transfer' ? 1 : minYears,
      domainPriceUsd: mode === 'transfer' ? transferUsd : regUsd,
      nameserversType: 'default',
      nameservers: ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'],
      whoisPrivacy: true,
      step: 2,
      sourceOrigin: 'public',
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });

    if (onNavigatePath) {
      onNavigatePath(mode === 'transfer' ? '/order/domain-transfer' : '/order/domain-registration');
    }
  };

  return (
    <section
      id="domain-search"
      className="bg-[#0F172A] text-white py-16 lg:py-20 border-b border-slate-800"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <p className="text-xs font-semibold text-[#10B981] mb-2">
            Instant Domain Search &amp; Free WHOIS Privacy
          </p>
          <h2
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
            style={{ textWrap: 'balance' }}
          >
            Find Your Perfect Domain Name
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Register or transfer your domain with cpcloudhost.com and receive
            free WHOIS privacy protection, DNSSEC management, and instant
            Wildcard SSL pairing.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          noValidate
          className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Globe
              className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Enter your domain name (e.g. yourbrand${activeTld})`}
              aria-label="Search domain name"
              className="w-full h-12 sm:h-13 pl-11 pr-4 text-sm sm:text-base text-[#0F172A] bg-white border border-white rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 h-12 sm:h-13 px-7 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981]"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            Search Domain
          </button>
        </form>

        {error && (
          <p className="max-w-3xl mx-auto mt-3 text-xs font-medium text-rose-300">
            {error}
          </p>
        )}

        {/* TLD Pricing Pills (Top 5 Enabled Admin Extensions) */}
        <div className="max-w-3xl mx-auto mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {liveTldItems.map((item) => {
            const selected = activeTld === item.tld;
            return (
              <button
                key={item.tld}
                type="button"
                onClick={() => setActiveTld(item.tld)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selected
                    ? 'bg-[#0E6B63] border-[#10B981] text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white'
                }`}
              >
                <span className="font-display font-bold">{item.tld}</span>
                <span
                  className={`font-mono-num ${
                    selected ? 'text-emerald-200' : 'text-slate-300'
                  }`}
                >
                  {formatPriceString(item.price)}/{item.termLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Instant Availability Feedback (Inline, Direct Order Launch) */}
        {results.length > 0 && (
          <div className="max-w-3xl mx-auto mt-8 pt-6 border-t border-slate-800 space-y-2.5">
            {results.map((res) => {
              const isChosen = selectedDomain === res.domain;
              return (
                <div
                  key={res.domain}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/65"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {res.available ? (
                      <CheckCircle2
                        className="w-5 h-5 text-[#10B981] shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="w-5 h-5 text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-display text-sm sm:text-base font-bold text-white truncate">
                        {res.domain}
                      </div>
                      <div className="text-xs text-slate-300">
                        {res.available ? (
                          <span className="text-[#10B981] font-medium">
                            Available for instant registration · Free WHOIS
                            privacy
                          </span>
                        ) : (
                          <span>Already registered — transfer in (+1 yr extension)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-mono-num text-sm font-bold text-white">
                      {formatPriceString(res.price)}/{res.termLabel}
                    </span>
                    {res.available ? (
                      <button
                        type="button"
                        onClick={() => handleProceedOrder(res, 'register')}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isChosen
                            ? 'bg-[#10B981] text-[#0F172A]'
                            : 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
                        }`}
                      >
                        {isChosen ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Ordering...
                          </>
                        ) : (
                          'Register Domain'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleProceedOrder(res, 'transfer')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-[#0E6B63] border border-slate-600 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      >
                        Transfer Domain
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="max-w-3xl mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck
              className="w-3.5 h-3.5 text-[#10B981]"
              aria-hidden="true"
            />
            Free WHOIS Privacy Included
          </span>
          <span>Instant DNS Propagation</span>
          <span>Zero Transfer Lock-In</span>
        </div>
      </div>
    </section>
  );
};
