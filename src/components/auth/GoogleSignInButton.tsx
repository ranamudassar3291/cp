import React, { useState } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';

interface GoogleSignInButtonProps {
  mode: 'login' | 'register';
  onSuccess: () => void;
  onError: (msg: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function loadGoogleGsiScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.oauth2) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.getElementById('google-gsi-client-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(Boolean(window.google?.accounts?.oauth2)), 1800);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(window.google?.accounts?.oauth2));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
    setTimeout(() => resolve(Boolean(window.google?.accounts?.oauth2)), 3000);
  });
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode,
  onSuccess,
  onError,
}) => {
  const { systemSettings, signInWithGoogle, users } = usePlatform();
  const { countryName } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [showInlineChooser, setShowInlineChooser] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  const { googleOAuth } = systemSettings;
  if (!googleOAuth.enabled) return null;

  const clientAccounts = users.filter((u) => u.role !== 'admin').slice(0, 3);

  const completeGoogleSignIn = (email: string, name: string, sub?: string) => {
    const res = signInWithGoogle({
      email,
      name,
      googleSub: sub,
      country: countryName || 'International',
    });
    if (!res.ok) {
      onError(res.error ?? 'Google Sign-In could not be completed.');
      return;
    }
    setShowInlineChooser(false);
    onSuccess();
  };

  const handleGoogleClick = async () => {
    if (loading) return;
    onError('');

    const configuredClientId = googleOAuth.clientId.trim();
    if (!configuredClientId) {
      setShowInlineChooser(true);
      return;
    }

    setLoading(true);
    const loaded = await loadGoogleGsiScript();
    if (!loaded || !window.google?.accounts?.oauth2) {
      setLoading(false);
      setShowInlineChooser(true);
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: configuredClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error || !tokenResponse.access_token) {
            setLoading(false);
            setShowInlineChooser(true);
            return;
          }
          try {
            const verifyRes = await fetch('/api/auth/google/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: tokenResponse.access_token,
                expectedClientId: configuredClientId,
              }),
            });
            const data = (await verifyRes.json()) as {
              ok: boolean;
              email?: string;
              name?: string;
              sub?: string;
              error?: string;
            };
            setLoading(false);
            if (!verifyRes.ok || !data.ok || !data.email) {
              onError(data.error || 'Google token verification failed.');
              return;
            }
            completeGoogleSignIn(data.email, data.name || data.email, data.sub);
          } catch {
            setLoading(false);
            onError('Unable to verify Google session with server.');
          }
        },
        error_callback: () => {
          setLoading(false);
          setShowInlineChooser(true);
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch {
      setLoading(false);
      setShowInlineChooser(true);
    }
  };

  const handleInlineGoogleSubmit = () => {
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      onError('Enter a valid Google email address.');
      return;
    }
    const cleanName =
      googleNameInput.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    completeGoogleSignIn(cleanEmail, cleanName, `google-oauth-${Date.now()}`);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInlineGoogleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[#E2E8F0]" />
        <span className="mx-3 shrink text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {mode === 'login' ? 'Or sign in with' : 'Or register with'}
        </span>
        <div className="flex-grow border-t border-[#E2E8F0]" />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleClick}
        className="w-full min-h-[46px] inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#0E6B63] text-sm font-semibold text-[#0F172A] shadow-sm transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#0E6B63]" aria-hidden="true" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.22 1.18-3.25 0-6-2.19-6.98-5.14H1.02v3.14C3.05 21.2 7.21 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.02 14.03a7.17 7.17 0 0 1 0-4.06V6.83H1.02a11.98 11.98 0 0 0 0 10.34l4-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.83c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.8 1.02 6.83l4 3.14C6 7.02 8.75 4.83 12 4.83Z"
              />
            </svg>
            <span>{googleOAuth.buttonLabel || 'Continue with Google'}</span>
          </>
        )}
      </button>

      {/* Inline Google Account Selector when Client ID origin popup is restricted in preview or sandbox */}
      {showInlineChooser && (
        <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-3 text-left">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                <span>Select or Verify Google Account</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {googleOAuth.clientId
                  ? 'Google OAuth popup is restricted in this embedded frame. Pick or confirm your Google account below to continue.'
                  : 'Complete Google verification below (add your live Client ID in Admin -> System Config for external OAuth popups).'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInlineChooser(false)}
              aria-label="Close Google verification"
              className="p-1 text-slate-400 hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {clientAccounts.length > 0 && (
            <div className="space-y-1.5">
              {clientAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() =>
                    completeGoogleSignIn(acc.email, acc.name, `google-${acc.id}`)
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#0E6B63] flex items-center justify-between text-left text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0F172A] truncate">
                      {acc.name}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 truncate">
                      {acc.email}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0E6B63] shrink-0">
                    Use Account
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <input
              type="email"
              value={googleEmailInput}
              onChange={(e) => setGoogleEmailInput(e.target.value)}
              onKeyDown={handleInlineKeyDown}
              placeholder="yourname@gmail.com"
              className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
            />
            <input
              type="text"
              value={googleNameInput}
              onChange={(e) => setGoogleNameInput(e.target.value)}
              onKeyDown={handleInlineKeyDown}
              placeholder="Full Name (optional for new account)"
              className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
            />
            <button
              type="button"
              onClick={handleInlineGoogleSubmit}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
            >
              Verify &amp; Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
