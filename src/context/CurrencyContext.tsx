import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CurrencyMeta {
  code: string;
  symbol: string;
  name: string;
  decimals: 0 | 2;
  spaceAfterSymbol?: boolean;
}

export interface CountryCurrencyChoice {
  countryCode: string;
  countryName: string;
  currencyCode: string;
}

export const CURRENCY_CATALOG: Record<string, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  PKR: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', decimals: 0, spaceAfterSymbol: true },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2, spaceAfterSymbol: true },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', decimals: 2, spaceAfterSymbol: true },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 0 },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimals: 0 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, spaceAfterSymbol: true },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, spaceAfterSymbol: true },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimals: 0 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, spaceAfterSymbol: true },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimals: 0, spaceAfterSymbol: true },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', decimals: 0 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimals: 2 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 0 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 0 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0 },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimals: 2 },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2, spaceAfterSymbol: true },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 2, spaceAfterSymbol: true },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimals: 2, spaceAfterSymbol: true },
  QAR: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', decimals: 2, spaceAfterSymbol: true },
  KWD: { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', decimals: 2, spaceAfterSymbol: true },
  OMR: { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', decimals: 2, spaceAfterSymbol: true },
  BHD: { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', decimals: 2, spaceAfterSymbol: true },
  JOD: { code: 'JOD', symbol: 'JOD', name: 'Jordanian Dinar', decimals: 2, spaceAfterSymbol: true },
  LKR: { code: 'LKR', symbol: 'LKR', name: 'Sri Lankan Rupee', decimals: 0, spaceAfterSymbol: true },
  NPR: { code: 'NPR', symbol: 'NPR', name: 'Nepalese Rupee', decimals: 0, spaceAfterSymbol: true },
  MAD: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', decimals: 2, spaceAfterSymbol: true },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimals: 0 },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimals: 0 },
  RON: { code: 'RON', symbol: 'RON', name: 'Romanian Leu', decimals: 2, spaceAfterSymbol: true },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimals: 2 },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', decimals: 0 },
  COP: { code: 'COP', symbol: 'COP', name: 'Colombian Peso', decimals: 0, spaceAfterSymbol: true },
  CLP: { code: 'CLP', symbol: 'CLP', name: 'Chilean Peso', decimals: 0, spaceAfterSymbol: true },
  ARS: { code: 'ARS', symbol: 'ARS', name: 'Argentine Peso', decimals: 0, spaceAfterSymbol: true },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', decimals: 2 },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', decimals: 0 },
  KZT: { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', decimals: 0 },
};

// Complete ISO 3166-1 country -> ISO 4217 currency mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', PR: 'USD', GU: 'USD', VI: 'USD', EC: 'USD', SV: 'USD', PA: 'USD', TL: 'USD',
  PK: 'PKR',
  GB: 'GBP', UK: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  AE: 'AED',
  SA: 'SAR',
  IN: 'INR', BT: 'INR',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  SG: 'SGD',
  TR: 'TRY',
  BD: 'BDT',
  MY: 'MYR',
  JP: 'JPY',
  CN: 'CNY',
  HK: 'HKD', MO: 'HKD',
  CH: 'CHF', LI: 'CHF',
  NG: 'NGN',
  ZA: 'ZAR', NA: 'ZAR',
  KE: 'KES',
  EG: 'EGP',
  BR: 'BRL',
  MX: 'MXN',
  ID: 'IDR',
  PH: 'PHP',
  TH: 'THB',
  VN: 'VND',
  KR: 'KRW',
  PL: 'PLN',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  QA: 'QAR',
  KW: 'KWD',
  OM: 'OMR',
  BH: 'BHD',
  JO: 'JOD',
  LK: 'LKR',
  NP: 'NPR',
  MA: 'MAD',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  IL: 'ILS',
  TW: 'TWD',
  CO: 'COP',
  CL: 'CLP',
  AR: 'ARS',
  PE: 'PEN',
  UA: 'UAH',
  KZ: 'KZT',
  // Eurozone
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR',
  SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
  CY: 'EUR', HR: 'EUR', AD: 'EUR', MC: 'EUR', SM: 'EUR', VA: 'EUR',
  ME: 'EUR', XK: 'EUR',
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  PK: 'Pakistan',
  GB: 'United Kingdom',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  IE: 'Ireland',
  CA: 'Canada',
  AU: 'Australia',
  SG: 'Singapore',
  TR: 'Turkey',
  BD: 'Bangladesh',
  MY: 'Malaysia',
  JP: 'Japan',
  CH: 'Switzerland',
  NG: 'Nigeria',
  ZA: 'South Africa',
  KE: 'Kenya',
  EG: 'Egypt',
  BR: 'Brazil',
  ID: 'Indonesia',
  PH: 'Philippines',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  QA: 'Qatar',
  KW: 'Kuwait',
};

// Baseline spot FX fallback rates (relative to 1.00 USD) used strictly until live Google/mid-market feed resolves
const BASELINE_USD_RATES: Record<string, number> = {
  USD: 1,
  PKR: 278.5,
  GBP: 0.785,
  EUR: 0.925,
  AED: 3.6725,
  SAR: 3.75,
  INR: 84.4,
  CAD: 1.39,
  AUD: 1.53,
  NZD: 1.67,
  SGD: 1.34,
  TRY: 34.4,
  BDT: 119.5,
  MYR: 4.42,
  JPY: 154.2,
  CNY: 7.22,
  HKD: 7.78,
  CHF: 0.88,
  NGN: 1655,
  ZAR: 18.0,
  KES: 129.0,
  EGP: 49.3,
  BRL: 5.75,
  MXN: 20.3,
  IDR: 15750,
  PHP: 58.6,
  THB: 34.6,
  VND: 25350,
  KRW: 1395,
  PLN: 4.05,
  SEK: 10.85,
  NOK: 11.05,
  DKK: 6.91,
  QAR: 3.64,
  KWD: 0.307,
  OMR: 0.385,
  BHD: 0.376,
  JOD: 0.709,
  LKR: 293,
  NPR: 135,
  MAD: 9.9,
  CZK: 23.6,
  HUF: 382,
  RON: 4.61,
  ILS: 3.74,
  TWD: 32.4,
  COP: 4410,
  CLP: 970,
  ARS: 995,
  PEN: 3.78,
  UAH: 41.3,
  KZT: 495,
};

export const POPULAR_COUNTRIES: CountryCurrencyChoice[] = [
  { countryCode: 'US', countryName: 'United States', currencyCode: 'USD' },
  { countryCode: 'PK', countryName: 'Pakistan', currencyCode: 'PKR' },
  { countryCode: 'GB', countryName: 'United Kingdom', currencyCode: 'GBP' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', currencyCode: 'AED' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', currencyCode: 'SAR' },
  { countryCode: 'IN', countryName: 'India', currencyCode: 'INR' },
  { countryCode: 'DE', countryName: 'Europe (Eurozone)', currencyCode: 'EUR' },
  { countryCode: 'CA', countryName: 'Canada', currencyCode: 'CAD' },
  { countryCode: 'AU', countryName: 'Australia', currencyCode: 'AUD' },
  { countryCode: 'SG', countryName: 'Singapore', currencyCode: 'SGD' },
  { countryCode: 'TR', countryName: 'Turkey', currencyCode: 'TRY' },
  { countryCode: 'BD', countryName: 'Bangladesh', currencyCode: 'BDT' },
  { countryCode: 'MY', countryName: 'Malaysia', currencyCode: 'MYR' },
  { countryCode: 'NG', countryName: 'Nigeria', currencyCode: 'NGN' },
  { countryCode: 'ZA', countryName: 'South Africa', currencyCode: 'ZAR' },
  { countryCode: 'JP', countryName: 'Japan', currencyCode: 'JPY' },
];

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Karachi': 'PK',
  'Europe/London': 'GB',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Dhaka': 'BD',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Europe/Istanbul': 'TR',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Bangkok': 'TH',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Amsterdam': 'NL',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Dublin': 'IE',
  'Europe/Zurich': 'CH',
  'Europe/Warsaw': 'PL',
  'Europe/Stockholm': 'SE',
  'Africa/Lagos': 'NG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Nairobi': 'KE',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
};

const GEO_CACHE_KEY = 'cpcloud_geo_cache_v1';
const FX_CACHE_KEY = 'cpcloud_fx_cache_v1';
const MANUAL_OVERRIDE_KEY = 'cpcloud_currency_manual_country';
const FX_TTL_MS = 30 * 60 * 1000; // 30 minutes
const GEO_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function inferInitialCountryFromLocale(): string {
  if (typeof window === 'undefined') return 'US';

  // Check URL query param first (helpful for testing/deep linking e.g. ?country=PK)
  try {
    const params = new URLSearchParams(window.location.search);
    const paramCountry = params.get('country')?.trim().toUpperCase();
    if (paramCountry && paramCountry.length === 2) {
      return paramCountry;
    }
    const paramCurr = params.get('currency')?.trim().toUpperCase();
    if (paramCurr && CURRENCY_CATALOG[paramCurr]) {
      const matched = Object.entries(COUNTRY_TO_CURRENCY).find(
        ([, c]) => c === paramCurr
      );
      if (matched) return matched[0];
    }
  } catch {
    // ignore URL parse error
  }

  try {
    const manual = window.localStorage.getItem(MANUAL_OVERRIDE_KEY);
    if (manual && manual.length === 2) {
      return manual.toUpperCase();
    }

    const cachedGeoRaw = window.localStorage.getItem(GEO_CACHE_KEY);
    if (cachedGeoRaw) {
      const parsed = JSON.parse(cachedGeoRaw) as {
        countryCode: string;
        ts: number;
      };
      if (
        parsed?.countryCode &&
        Date.now() - (parsed.ts || 0) < GEO_TTL_MS
      ) {
        return parsed.countryCode.toUpperCase();
      }
    }
  } catch {
    // ignore storage access issues
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
    const lang = navigator.language || '';
    const region = lang.split('-')[1]?.toUpperCase();
    if (region && COUNTRY_TO_CURRENCY[region]) {
      return region;
    }
  } catch {
    // ignore
  }

  return 'US';
}

function getCountryDisplayName(code: string): string {
  const upper = code.toUpperCase();
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  try {
    if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
      const dn = new Intl.DisplayNames(['en'], { type: 'region' });
      const name = dn.of(upper);
      if (name) return name;
    }
  } catch {
    // ignore unsupported environments
  }
  return upper;
}

function getCurrencyMetaForCountry(
  countryCode: string,
  apiSuggestedCurrency?: string
): CurrencyMeta {
  const mappedFromCountry = COUNTRY_TO_CURRENCY[countryCode.toUpperCase()];
  if (mappedFromCountry && CURRENCY_CATALOG[mappedFromCountry]) {
    return CURRENCY_CATALOG[mappedFromCountry];
  }

  if (apiSuggestedCurrency && /^[A-Z]{3}$/.test(apiSuggestedCurrency.toUpperCase())) {
    const upper = apiSuggestedCurrency.toUpperCase();
    if (CURRENCY_CATALOG[upper]) {
      return CURRENCY_CATALOG[upper];
    }
    return {
      code: upper,
      symbol: upper,
      name: upper,
      decimals: 2,
      spaceAfterSymbol: true,
    };
  }

  return CURRENCY_CATALOG.USD;
}

interface CurrencyContextValue {
  countryCode: string;
  countryName: string;
  currency: CurrencyMeta;
  rate: number;
  detectionSource: 'ip' | 'manual' | 'locale';
  fxSource: 'live' | 'baseline';
  isDetecting: boolean;
  getCurrencyRate: (currencyCode: string) => number;
  convertUsd: (usdAmount: number) => number;
  formatPrice: (
    usdAmount: number,
    options?: { forceDecimals?: number; compactZero?: boolean }
  ) => string;
  formatPriceString: (usdPriceText: string) => string;
  setManualCountry: (countryCode: string) => void;
  resetToAutoIp: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [countryCode, setCountryCode] = useState<string>(
    inferInitialCountryFromLocale
  );
  const [countryName, setCountryName] = useState<string>(
    () => getCountryDisplayName(inferInitialCountryFromLocale())
  );
  const [apiCurrencyHint, setApiCurrencyHint] = useState<string | undefined>(
    undefined
  );
  const [ratesMap, setRatesMap] = useState<Record<string, number>>(() => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(FX_CACHE_KEY)
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as {
          rates: Record<string, number>;
          ts: number;
        };
        if (parsed?.rates?.USD === 1 && Date.now() - parsed.ts < FX_TTL_MS) {
          return { ...BASELINE_USD_RATES, ...parsed.rates };
        }
      }
    } catch {
      // ignore
    }
    return BASELINE_USD_RATES;
  });
  const [detectionSource, setDetectionSource] = useState<
    'ip' | 'manual' | 'locale'
  >(() => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.localStorage.getItem(MANUAL_OVERRIDE_KEY)
      ) {
        return 'manual';
      }
    } catch {
      // ignore
    }
    return 'locale';
  });
  const [fxSource, setFxSource] = useState<'live' | 'baseline'>('baseline');
  const [isDetecting, setIsDetecting] = useState(false);

  const detectVisitorIpCountry = useCallback(async () => {
    if (typeof window === 'undefined') return;
    // Skip IP overwrite if URL explicitly specified a country or user manually selected
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('country') || params.get('currency')) return;
      if (window.localStorage.getItem(MANUAL_OVERRIDE_KEY)) return;
    } catch {
      // continue
    }

    setIsDetecting(true);

    const tryProviders = async (): Promise<{
      countryCode: string;
      countryName?: string;
      currency?: string;
    } | null> => {
      // 1. ipapi.co
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3200);
        const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          const d = await res.json();
          if (d?.country_code && typeof d.country_code === 'string') {
            return {
              countryCode: d.country_code.toUpperCase(),
              countryName: d.country_name,
              currency: d.currency,
            };
          }
        }
      } catch {
        // try next provider
      }

      // 2. get.geojs.io
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3200);
        const res = await fetch('https://get.geojs.io/v1/ip/country.json', {
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const d = await res.json();
          if (d?.country && typeof d.country === 'string') {
            return {
              countryCode: d.country.toUpperCase(),
              countryName: d.name,
            };
          }
        }
      } catch {
        // try next provider
      }

      // 3. ipwho.is
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3200);
        const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          const d = await res.json();
          if (d?.success !== false && d?.country_code) {
            return {
              countryCode: String(d.country_code).toUpperCase(),
              countryName: d.country,
              currency: d.currency?.code,
            };
          }
        }
      } catch {
        // ignore all failed
      }

      return null;
    };

    const detected = await tryProviders();
    if (detected?.countryCode) {
      setCountryCode(detected.countryCode);
      setCountryName(
        detected.countryName || getCountryDisplayName(detected.countryCode)
      );
      if (detected.currency) {
        setApiCurrencyHint(detected.currency.toUpperCase());
      }
      setDetectionSource('ip');
      try {
        window.localStorage.setItem(
          GEO_CACHE_KEY,
          JSON.stringify({
            countryCode: detected.countryCode,
            countryName: detected.countryName,
            currency: detected.currency,
            ts: Date.now(),
          })
        );
      } catch {
        // ignore
      }
    }

    setIsDetecting(false);
  }, []);

  const fetchLiveGoogleFxRates = useCallback(async () => {
    // 1. Open ExchangeRate API (mid-market Google Finance spot parity, 160+ ISO currencies)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.rates && typeof data.rates === 'object' && data.rates.EUR) {
          const merged = { ...BASELINE_USD_RATES, ...data.rates, USD: 1 };
          setRatesMap(merged);
          setFxSource('live');
          try {
            window.localStorage.setItem(
              FX_CACHE_KEY,
              JSON.stringify({ rates: data.rates, ts: Date.now() })
            );
          } catch {
            // ignore
          }
          return;
        }
      }
    } catch {
      // try CDN fallback
    }

    // 2. jsDelivr Currency API mirror
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
        { signal: ctrl.signal }
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.usd && typeof data.usd === 'object') {
          const upperRates: Record<string, number> = { USD: 1 };
          for (const [k, v] of Object.entries(data.usd)) {
            if (typeof v === 'number' && v > 0) {
              upperRates[k.toUpperCase()] = v;
            }
          }
          setRatesMap((prev) => ({ ...prev, ...upperRates }));
          setFxSource('live');
        }
      }
    } catch {
      // keep baseline spot rates gracefully
    }
  }, []);

  useEffect(() => {
    void detectVisitorIpCountry();
    void fetchLiveGoogleFxRates();
  }, [detectVisitorIpCountry, fetchLiveGoogleFxRates]);

  const currency = useMemo(
    () => getCurrencyMetaForCountry(countryCode, apiCurrencyHint),
    [countryCode, apiCurrencyHint]
  );

  const rate = useMemo(() => {
    const r = ratesMap[currency.code];
    return typeof r === 'number' && r > 0 ? r : 1;
  }, [ratesMap, currency.code]);

  const getCurrencyRate = useCallback(
    (currencyCode: string) => {
      const upper = currencyCode.trim().toUpperCase();
      const val = ratesMap[upper] ?? BASELINE_USD_RATES[upper];
      return typeof val === 'number' && val > 0 ? val : 1;
    },
    [ratesMap]
  );

  const convertUsd = useCallback(
    (usdAmount: number) => {
      if (!Number.isFinite(usdAmount)) return 0;
      return usdAmount * rate;
    },
    [rate]
  );

  const formatPrice = useCallback(
    (
      usdAmount: number,
      options?: { forceDecimals?: number; compactZero?: boolean }
    ) => {
      const converted = usdAmount * rate;
      const decimals =
        options?.forceDecimals !== undefined
          ? options.forceDecimals
          : options?.compactZero && usdAmount === 0
          ? 0
          : currency.decimals;

      const rounded =
        decimals === 0
          ? Math.round(converted)
          : Number(converted.toFixed(decimals));

      const formattedNumber = rounded.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      const sep = currency.spaceAfterSymbol ? ' ' : '';
      return `${currency.symbol}${sep}${formattedNumber}`;
    },
    [rate, currency]
  );

  const formatPriceString = useCallback(
    (usdPriceText: string) => {
      if (!usdPriceText || !usdPriceText.includes('$')) {
        return usdPriceText;
      }
      return usdPriceText.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, (_, numStr) => {
        const numeric = parseFloat(String(numStr).replace(/,/g, ''));
        if (!Number.isFinite(numeric)) return `$${numStr}`;
        return formatPrice(numeric, {
          compactZero: !String(numStr).includes('.'),
        });
      });
    },
    [formatPrice]
  );

  const setManualCountry = useCallback((nextCountryCode: string) => {
    const upper = nextCountryCode.toUpperCase();
    setCountryCode(upper);
    setCountryName(getCountryDisplayName(upper));
    setApiCurrencyHint(COUNTRY_TO_CURRENCY[upper]);
    setDetectionSource('manual');
    try {
      window.localStorage.setItem(MANUAL_OVERRIDE_KEY, upper);
    } catch {
      // ignore
    }
  }, []);

  const resetToAutoIp = useCallback(() => {
    try {
      window.localStorage.removeItem(MANUAL_OVERRIDE_KEY);
      window.localStorage.removeItem(GEO_CACHE_KEY);
    } catch {
      // ignore
    }
    const fallbackCountry = inferInitialCountryFromLocale();
    setCountryCode(fallbackCountry);
    setCountryName(getCountryDisplayName(fallbackCountry));
    setApiCurrencyHint(undefined);
    setDetectionSource('locale');
    void detectVisitorIpCountry();
  }, [detectVisitorIpCountry]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      countryCode,
      countryName,
      currency,
      rate,
      detectionSource,
      fxSource,
      isDetecting,
      getCurrencyRate,
      convertUsd,
      formatPrice,
      formatPriceString,
      setManualCountry,
      resetToAutoIp,
    }),
    [
      countryCode,
      countryName,
      currency,
      rate,
      detectionSource,
      fxSource,
      isDetecting,
      getCurrencyRate,
      convertUsd,
      formatPrice,
      formatPriceString,
      setManualCountry,
      resetToAutoIp,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
