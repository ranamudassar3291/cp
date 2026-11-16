import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { GoogleSignInButton } from './GoogleSignInButton';

export type AuthPolicyTarget =
  | 'terms-conditions'
  | 'privacy-policy'
  | 'order-terms'
  | 'refund-policy'
  | 'abuse-policy';

interface AuthLoginPageProps {
  onNavigateHome: () => void;
  onOpenDashboard: () => void;
  onOpenPolicy: (policy: AuthPolicyTarget) => void;
  onGoToRegister?: () => void;
  onGoToForgotPassword?: () => void;
}

const POLICY_LINKS: { id: AuthPolicyTarget; label: string; href: string }[] = [
  { id: 'terms-conditions', label: 'Terms & Conditions', href: '/terms-conditions' },
  { id: 'privacy-policy', label: 'Privacy Policy', href: '/privacy-policy' },
  { id: 'order-terms', label: 'Order Terms', href: '/order-terms' },
  { id: 'refund-policy', label: 'Refund Policy', href: '/refund-policy' },
  { id: 'abuse-policy', label: 'Abuse Policy', href: '/abuse-policy' },
];

export const AuthLoginPage: React.FC<AuthLoginPageProps> = ({
  onNavigateHome,
  onOpenDashboard,
  onOpenPolicy,
  onGoToRegister,
  onGoToForgotPassword,
}) => {
  const {
    currentUser,
    rememberedIdentifier,
    pendingTwoFactor,
    orders,
    pendingPostAuthPath,
    loginWithCredentials,
    verifyTwoFactorChallenge,
    cancelTwoFactorChallenge,
    logout,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  const [identifier, setIdentifier] = useState(rememberedIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(Boolean(rememberedIdentifier));
  const [showHelpNote, setShowHelpNote] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockCountdown, setLockCountdown] = useState(0);

  useEffect(() => {
    applyPageSeoMetadata({
      title: 'Log In | cpcloudhost.com',
      description:
        'Secure client sign-in portal for cpcloudhost.com cloud hosting, domains, billing, and support.',
      canonicalPath: '/auth/login',
      ogType: 'website',
      jsonLd: null,
    });
  }, []);

  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setLockCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockCountdown]);

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (ord) => ord.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [orders, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || lockCountdown > 0) return;

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Enter your username or email address.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Enter your password.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    window.setTimeout(() => {
      const result = loginWithCredentials(cleanId, cleanPass, rememberLogin, 'client');
      setSubmitting(false);
      if (!result.ok) {
        setPassword('');
        if (result.lockedSeconds && result.lockedSeconds > 0) {
          setLockCountdown(result.lockedSeconds);
        }
        setErrorMessage(
          result.error ?? 'Invalid username, email, or password.'
        );
        return;
      }

      setPassword('');
      if (result.requiresTwoFactor) {
        setTwoFactorCode('');
        setErrorMessage('');
        return;
      }
      setJustSignedIn(true);
      onOpenDashboard();
    }, 240);
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!twoFactorCode.trim()) {
      setErrorMessage('Enter your 6-digit authenticator code or backup recovery code.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);
    const result = await verifyTwoFactorChallenge(twoFactorCode);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(
        result.error ?? 'Invalid authenticator or backup recovery code.'
      );
      return;
    }
    setTwoFactorCode('');
    setJustSignedIn(true);
    onOpenDashboard();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center px-4 py-8 sm:px-6 sm:py-10">
      {/* Centered Brand Wordmark */}
      <div className="auth-fade-up mb-6 sm:mb-7">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="inline-flex items-center gap-2.5 text-[#0F172A] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6B63] rounded"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="30" height="30" rx="7" fill="#0E6B63" />
            <path
              d="M9.2 18.2H20.8C22.1807 18.2 23.3 17.0807 23.3 15.7C23.3 14.4327 22.357 13.3855 21.1329 13.2215C20.7423 10.9367 18.7526 9.2 16.35 9.2C13.6714 9.2 11.5 11.3714 11.5 14.05C11.5 14.191 11.506 14.3307 11.5178 14.4688C9.69915 14.6225 8.3 16.1465 8.3 18C8.3 18.0674 8.30185 18.1343 8.3055 18.2H9.2Z"
              fill="white"
            />
            <rect
              x="8.8"
              y="20.4"
              width="12.4"
              height="1.8"
              rx="0.9"
              fill="#10B981"
            />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight">
            cpcloudhost.com
          </span>
        </a>
      </div>

      {/* Main Clean Centered Card (Hostinger / DreamHost proportions for Laptop & Mobile) */}
      <div className="auth-fade-up-d1 w-full max-w-[432px] bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_12px_36px_-14px_rgba(15,23,42,0.08)] p-6 sm:p-8 lg:p-9">
        {currentUser && justSignedIn ? (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#16A34A] mb-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Authenticated Session Active</span>
              </div>
              <h1
                className="font-display text-2xl font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Signed in as{' '}
                <span className="font-mono text-xs font-medium text-[#0F172A]">
                  {currentUser.email}
                </span>{' '}
                · <span className="capitalize font-semibold">{currentUser.role}</span>
              </p>
            </div>

            <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account ID</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {currentUser.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Active Services &amp; Orders</span>
                <span className="font-mono-num font-bold text-[#0E6B63]">
                  {userOrders.length}
                </span>
              </div>
            </div>

            {userOrders.length > 0 && (
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
                  Your Recent Services
                </div>
                <div className="divide-y divide-[#E2E8F0]">
                  {userOrders.slice(0, 3).map((ord) => (
                    <div
                      key={ord.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A] truncate">
                          {ord.planName}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 truncate">
                          {ord.domainOrHost}
                        </p>
                      </div>
                      <span className="font-mono-num font-semibold text-[#0F172A] shrink-0">
                        {formatPrice(ord.amountUsd)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold shadow-[0_6px_20px_rgba(14,107,99,0.2)] transition-all duration-200 cursor-pointer"
              >
                <span>Open Client Dashboard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="min-h-[42px] py-2.5 px-4 rounded-xl border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                >
                  Storefront
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setJustSignedIn(false);
                  }}
                  className="min-h-[42px] inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#CBD5E1] hover:border-red-300 hover:text-[#DC2626] text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        ) : pendingTwoFactor ? (
          <div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B63] mb-2">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Two-Factor Authentication</span>
              </div>
              <h1
                className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Verify your identity
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Enter the 6-digit code from your authenticator app for{' '}
                <span className="font-mono font-semibold text-[#0F172A]">
                  {pendingTwoFactor.email}
                </span>
                , or enter an 8-character backup recovery code.
              </p>
            </div>

            <form
              onSubmit={handleVerifyTwoFactor}
              noValidate
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="portal-2fa-code"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Authenticator or Backup Code
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="portal-2fa-code"
                    type="text"
                    inputMode="text"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={16}
                    value={twoFactorCode}
                    onChange={(e) => {
                      setTwoFactorCode(e.target.value.toUpperCase());
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="123456 or XXXX-XXXX"
                    className="w-full min-h-[48px] pl-10 pr-4 py-2.5 text-base font-mono font-semibold tracking-widest text-[#0F172A] placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200"
                  />
                </div>
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group w-full min-h-[48px] inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-xl shadow-[0_8px_24px_rgba(14,107,99,0.2)] transition-all duration-200 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  cancelTwoFactorChallenge();
                  setTwoFactorCode('');
                  setErrorMessage('');
                }}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to password login</span>
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Clean Minimal Header */}
            <div className="text-center sm:text-left">
              <h1
                className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Log in
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sign in with your username or email to access your hosting portal.
              </p>
            </div>

            {pendingPostAuthPath && (
              <div className="mt-4 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/25 px-3.5 py-2.5 text-xs text-[#0E6B63] font-medium">
                Sign in to continue your Shared Hosting order payment. Your plan, datacenter, and promo code are saved.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              autoComplete="on"
              className="mt-6 space-y-4 sm:space-y-5"
            >
              {/* Unified Username or Email Field */}
              <div>
                <label
                  htmlFor="portal-login-identifier"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="portal-login-identifier"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={128}
                    disabled={lockCountdown > 0}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter username or email"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 disabled:bg-slate-50 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="portal-login-password"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onGoToForgotPassword) {
                        onGoToForgotPassword();
                      } else {
                        setShowHelpNote((prev) => !prev);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Forgot password?</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="portal-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    maxLength={128}
                    disabled={lockCountdown > 0}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your password"
                    className="w-full min-h-[46px] pl-10 pr-11 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 disabled:bg-slate-50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {showHelpNote && (
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-xs text-slate-600 leading-relaxed">
                  For account recovery, email{' '}
                  <span className="font-mono font-semibold text-[#0F172A]">
                    support@cpcloudhost.com
                  </span>{' '}
                  with your registered email or domain reference.
                </div>
              )}

              {/* Remember Login Tick Box */}
              <div className="pt-0.5">
                <label
                  htmlFor="portal-remember-login"
                  className="inline-flex items-center gap-2.5 cursor-pointer select-none group min-h-[32px]"
                >
                  <input
                    id="portal-remember-login"
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(e) => setRememberLogin(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-[#0E6B63]/40 ${
                      rememberLogin
                        ? 'bg-[#0E6B63] border-[#0E6B63] text-white'
                        : 'bg-white border-[#CBD5E1] group-hover:border-[#0E6B63]'
                    }`}
                  >
                    {rememberLogin && (
                      <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-xs font-medium text-slate-700">
                    Remember login
                  </span>
                </label>
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                >
                  {lockCountdown > 0
                    ? `Too many failed attempts. Retry unlocked in ${lockCountdown}s.`
                    : errorMessage}
                </p>
              )}

              {/* Full-Width Primary Login CTA */}
              <button
                type="submit"
                disabled={submitting || lockCountdown > 0}
                className="group w-full min-h-[48px] inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] active:scale-[0.995] disabled:opacity-65 disabled:cursor-not-allowed rounded-xl shadow-[0_8px_24px_rgba(14,107,99,0.2)] hover:shadow-[0_10px_28px_rgba(14,107,99,0.28)] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : lockCountdown > 0 ? (
                  <span>Locked ({lockCountdown}s)</span>
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 sm:mt-5 space-y-4">
              <GoogleSignInButton
                mode="login"
                onSuccess={() => {
                  setJustSignedIn(true);
                  onOpenDashboard();
                }}
                onError={(msg) => setErrorMessage(msg)}
              />

              {/* Quiet Security Assurance Note & Register Link */}
              <div className="pt-1 flex flex-col items-center gap-2 text-center">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-[#0E6B63] shrink-0"
                    aria-hidden="true"
                  />
                  <span>Protected by TLS 1.3 &amp; session attempt rate limiting</span>
                </div>

                {onGoToRegister && (
                  <p className="text-xs text-slate-600 pt-0.5">
                    Don&apos;t have an account?{' '}
                    <a
                      href="/auth/register"
                      onClick={(e) => {
                        e.preventDefault();
                        onGoToRegister();
                      }}
                      className="font-semibold text-[#0E6B63] hover:text-[#0A534D] hover:underline underline-offset-4"
                    >
                      Register
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clickable Policy Page Links Directly Below Card */}
      <nav
        aria-label="Legal and policy links"
        className="auth-fade-up-d2 mt-6 max-w-[480px] flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500 text-center"
      >
        {POLICY_LINKS.map((policy, idx) => (
          <React.Fragment key={policy.id}>
            <a
              href={policy.href}
              onClick={(e) => {
                e.preventDefault();
                onOpenPolicy(policy.id);
              }}
              className="hover:text-[#0E6B63] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              {policy.label}
            </a>
            {idx < POLICY_LINKS.length - 1 && (
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};
