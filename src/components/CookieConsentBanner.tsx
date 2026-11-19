import React, { useEffect, useState } from 'react';
import { Cookie, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';

export interface CookieConsentPreferences {
  essential: true;
  analytics: boolean;
  localization: boolean;
  marketing: boolean;
  updatedAt: string;
}

const CONSENT_STORAGE_KEY = 'cpcloud_cookie_consent_v1';
const CONSENT_COOKIE_NAME = 'cpcloud_consent';

const DEFAULT_PREFS: CookieConsentPreferences = {
  essential: true,
  analytics: true,
  localization: true,
  marketing: false,
  updatedAt: '',
};

function writeConsentCookie(prefs: CookieConsentPreferences) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage quota failures
  }
  try {
    const payload = encodeURIComponent(
      JSON.stringify({
        e: 1,
        a: prefs.analytics ? 1 : 0,
        l: prefs.localization ? 1 : 0,
        m: prefs.marketing ? 1 : 0,
        t: prefs.updatedAt,
      })
    );
    document.cookie = `${CONSENT_COOKIE_NAME}=${payload}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore cookie failures
  }
}

function readStoredConsent(): CookieConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
      if (parsed && typeof parsed.updatedAt === 'string' && parsed.updatedAt.length > 0) {
        return {
          essential: true,
          analytics: Boolean(parsed.analytics),
          localization: Boolean(parsed.localization ?? true),
          marketing: Boolean(parsed.marketing),
          updatedAt: parsed.updatedAt,
        };
      }
    }
  } catch {
    // ignore parse failure
  }
  try {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match.split('=')[1] || ''));
      if (parsed && parsed.t) {
        return {
          essential: true,
          analytics: parsed.a === 1,
          localization: parsed.l !== 0,
          marketing: parsed.m === 1,
          updatedAt: String(parsed.t),
        };
      }
    }
  } catch {
    // ignore cookie parse failure
  }
  return null;
}

interface CookieConsentBannerProps {
  hidden?: boolean;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ hidden = false }) => {
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [prefs, setPrefs] = useState<CookieConsentPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const existing = readStoredConsent();
    if (existing) {
      setPrefs(existing);
      setBannerVisible(false);
    } else {
      setBannerVisible(true);
    }

    const handleOpenSettings = () => {
      const current = readStoredConsent();
      if (current) {
        setPrefs(current);
      }
      setModalOpen(true);
    };
    window.addEventListener('cpcloud:open-cookie-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('cpcloud:open-cookie-settings', handleOpenSettings);
    };
  }, []);

  const commitPreferences = (next: Omit<CookieConsentPreferences, 'essential' | 'updatedAt'>) => {
    const finalPrefs: CookieConsentPreferences = {
      essential: true,
      analytics: next.analytics,
      localization: next.localization,
      marketing: next.marketing,
      updatedAt: new Date().toISOString(),
    };
    setPrefs(finalPrefs);
    writeConsentCookie(finalPrefs);
    setBannerVisible(false);
    setModalOpen(false);
  };

  if (hidden) return null;

  return (
    <>
      {bannerVisible && !modalOpen && (
        <aside
          aria-label="Cookie consent notice"
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-[560px] z-40 rounded-2xl bg-[#0F172A] text-white border border-slate-700/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.55)] p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0E6B63]/25 border border-[#10B981]/30 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-white">
                  Cookie &amp; Privacy Preferences
                </p>
                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  GDPR · ePrivacy Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                cpcloudhost.com uses essential cookies for billing, authentication, and security, plus optional cookies for regional currency detection and performance analytics.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    commitPreferences({
                      analytics: true,
                      localization: true,
                      marketing: true,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#10B981] hover:text-[#0F172A] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitPreferences({
                      analytics: false,
                      localization: false,
                      marketing: false,
                    })
                  }
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reject Non-Essential
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Customize</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white text-[#0F172A] border border-[#E2E8F0] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#10B981]" aria-hidden="true" />
                <div>
                  <h2 id="cookie-modal-title" className="font-display text-base font-bold">
                    Cookie &amp; Privacy Settings
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    cpcloudhost.com · Manage how cookies and storage are used
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close cookie preferences"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Strictly Necessary */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0F172A]">Strictly Necessary</h3>
                    <span className="text-[11px] font-semibold text-[#0E6B63]">Always Active</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Required for client portal sign-in, shopping cart persistence, CSRF defense, and domain checkout state.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Strictly Necessary cookies always active"
                  className="mt-1 h-4 w-4 accent-[#0E6B63]"
                />
              </div>

              {/* Currency & Geo Preferences */}
              <label className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-start justify-between gap-4 cursor-pointer hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Currency &amp; Geo Localization</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Remembers your local display currency (USD, PKR, GBP, EUR) and nearest edge datacenter cluster.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.localization}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, localization: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 accent-[#0E6B63] cursor-pointer"
                />
              </label>

              {/* Analytics & Performance */}
              <label className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-start justify-between gap-4 cursor-pointer hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Analytics &amp; Performance</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Helps measure page speed, checkout step drop-offs, and DNS lookup latency cleanly without tracking personal files.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 accent-[#0E6B63] cursor-pointer"
                />
              </label>

              {/* Marketing */}
              <label className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-start justify-between gap-4 cursor-pointer hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Promotional &amp; ReferralAttribution</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Tracks partner promo codes such as STARTFREE and seasonal hosting campaigns.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.marketing}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, marketing: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 accent-[#0E6B63] cursor-pointer"
                />
              </label>
            </div>

            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  commitPreferences({
                    analytics: false,
                    localization: false,
                    marketing: false,
                  })
                }
                className="px-4 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    commitPreferences({
                      analytics: prefs.analytics,
                      localization: prefs.localization,
                      marketing: prefs.marketing,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitPreferences({
                      analytics: true,
                      localization: true,
                      marketing: true,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
