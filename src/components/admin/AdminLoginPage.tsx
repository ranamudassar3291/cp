import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { applyPageSeoMetadata } from '../../utils/seoManager';

interface AdminLoginPageProps {
  onNavigateHome: () => void;
  onLoginSuccess: () => void;
  onOpenClientDashboard?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onNavigateHome,
  onLoginSuccess,
  onOpenClientDashboard,
}) => {
  const {
    currentUser,
    isAdmin,
    pendingTwoFactor,
    loginWithCredentials,
    verifyTwoFactorChallenge,
    cancelTwoFactorChallenge,
    logout,
  } = usePlatform();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockCountdown, setLockCountdown] = useState(0);

  useEffect(() => {
    applyPageSeoMetadata({
      title: 'Staff Sign In | cpcloudhost.com',
      description: 'Protected staff operations authentication portal.',
      canonicalPath: '/admin/wp',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || lockCountdown > 0) return;

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Enter your administrator username or email.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Enter your password.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    window.setTimeout(() => {
      const result = loginWithCredentials(cleanId, cleanPass, rememberLogin, 'admin');
      setSubmitting(false);
      if (!result.ok) {
        setPassword('');
        if (result.lockedSeconds && result.lockedSeconds > 0) {
          setLockCountdown(result.lockedSeconds);
        }
        setErrorMessage(result.error ?? 'Authentication failed.');
        return;
      }

      setPassword('');
      if (result.requiresTwoFactor) {
        setTwoFactorCode('');
        setErrorMessage('');
        return;
      }
      onLoginSuccess();
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
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      {/* Standalone Wordmark Only (No Header / No Footer / No Register Link) */}
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
            <rect x="8.8" y="20.4" width="12.4" height="1.8" rx="0.9" fill="#10B981" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight">
            cpcloudhost.com
          </span>
        </a>
      </div>

      {/* Main Clean Centered Admin Card */}
      <div className="auth-fade-up-d1 w-full max-w-[424px] bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_12px_36px_-14px_rgba(15,23,42,0.08)] p-6 sm:p-8 lg:p-9">
        {currentUser && isAdmin ? (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B63] mb-2">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Authorized Session Active</span>
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
                </span>
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onLoginSuccess}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold shadow-[0_6px_20px_rgba(14,107,99,0.2)] transition-all duration-200 cursor-pointer"
              >
                <span>Continue to Console</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#CBD5E1] hover:border-red-300 hover:text-[#DC2626] text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : currentUser && !isAdmin ? (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] mb-2">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Access Restricted</span>
              </div>
              <h1
                className="font-display text-xl font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Administrator Clearance Required
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                A standard client session is currently active. Sign out first to
                authenticate with an administrator account.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-[#0F172A] hover:bg-[#0E6B63] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Sign Out &amp; Switch Account</span>
              </button>

              {onOpenClientDashboard && (
                <button
                  type="button"
                  onClick={onOpenClientDashboard}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-xl border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                >
                  Return to Client Dashboard
                </button>
              )}
            </div>
          </div>
        ) : pendingTwoFactor ? (
          <div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B63] mb-2">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Two-Factor Verification</span>
              </div>
              <h1
                className="font-display text-2xl font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Verify your identity
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Enter the 6-digit authenticator code for{' '}
                <span className="font-mono font-semibold text-[#0F172A]">
                  {pendingTwoFactor.email}
                </span>
                .
              </p>
            </div>

            <form
              onSubmit={handleVerifyTwoFactor}
              noValidate
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="admin-wp-2fa-code"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Authenticator or Backup Code
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="admin-wp-2fa-code"
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
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-xl shadow-[0_8px_24px_rgba(14,107,99,0.2)] transition-all duration-200 cursor-pointer"
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
                <span>Back to sign in</span>
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B63] mb-2">
                <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Protected Operations Access</span>
              </div>
              <h1
                className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Admin Login
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Enter your administrator credentials to continue.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              autoComplete="off"
              className="mt-6 space-y-4 sm:space-y-5"
            >
              <div>
                <label
                  htmlFor="admin-wp-identifier"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="admin-wp-identifier"
                    name="admin_identifier"
                    type="text"
                    autoComplete="off"
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

              <div>
                <label
                  htmlFor="admin-wp-password"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="admin-wp-password"
                    name="admin_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="off"
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

              <div className="pt-0.5">
                <label
                  htmlFor="admin-wp-remember"
                  className="inline-flex items-center gap-2.5 cursor-pointer select-none group min-h-[32px]"
                >
                  <input
                    id="admin-wp-remember"
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
                    Keep session active on this device
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

              <button
                type="submit"
                disabled={submitting || lockCountdown > 0}
                className="group w-full min-h-[48px] inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] active:scale-[0.995] disabled:opacity-65 disabled:cursor-not-allowed rounded-xl shadow-[0_8px_24px_rgba(14,107,99,0.2)] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Verifying...</span>
                  </>
                ) : lockCountdown > 0 ? (
                  <span>Locked ({lockCountdown}s)</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>

              <div className="pt-1 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-[#0E6B63] shrink-0"
                    aria-hidden="true"
                  />
                  <span>TLS 1.3 encrypted · Rate-limit protected</span>
                </span>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Subtle return link without footer */}
      <div className="mt-5">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0E6B63] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to cpcloudhost.com</span>
        </a>
      </div>
    </div>
  );
};
