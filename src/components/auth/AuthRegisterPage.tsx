import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { AuthPolicyTarget } from './AuthLoginPage';
import { GoogleSignInButton } from './GoogleSignInButton';

interface AuthRegisterPageProps {
  onNavigateHome: () => void;
  onGoToLogin: () => void;
  onOpenDashboard?: () => void;
  onOpenPolicy: (policy: AuthPolicyTarget) => void;
}

interface CountryDialOption {
  iso: string;
  name: string;
  dial: string;
}

const DIAL_CODES: CountryDialOption[] = [
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'PK', name: 'Pakistan', dial: '+92' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'DE', name: 'Germany', dial: '+49' },
  { iso: 'FR', name: 'France', dial: '+33' },
  { iso: 'NL', name: 'Netherlands', dial: '+31' },
  { iso: 'SG', name: 'Singapore', dial: '+65' },
  { iso: 'IN', name: 'India', dial: '+91' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { iso: 'TR', name: 'Turkey', dial: '+90' },
  { iso: 'MY', name: 'Malaysia', dial: '+60' },
  { iso: 'ES', name: 'Spain', dial: '+34' },
  { iso: 'IT', name: 'Italy', dial: '+39' },
  { iso: 'CH', name: 'Switzerland', dial: '+41' },
  { iso: 'SE', name: 'Sweden', dial: '+46' },
  { iso: 'JP', name: 'Japan', dial: '+81' },
  { iso: 'BR', name: 'Brazil', dial: '+55' },
  { iso: 'ZA', name: 'South Africa', dial: '+27' },
  { iso: 'NG', name: 'Nigeria', dial: '+234' },
  { iso: 'EG', name: 'Egypt', dial: '+20' },
  { iso: 'INTL', name: 'Other Region', dial: '+' },
];

const DISCOVERY_SOURCES = [
  'Google / Bing Search Engine',
  'YouTube or Tech Review Video',
  'Developer Community (GitHub, Reddit, Stack Overflow)',
  'Friend, Colleague, or Agency Referral',
  'Social Media (LinkedIn, X / Twitter)',
  'Hosting Comparison or Trustpilot Review',
  'Cloud Partner / Reseller Network',
  'Other',
];

const POLICY_LINKS: { id: AuthPolicyTarget; label: string; href: string }[] = [
  { id: 'terms-conditions', label: 'Terms & Conditions', href: '/terms-conditions' },
  { id: 'privacy-policy', label: 'Privacy Policy', href: '/privacy-policy' },
  { id: 'order-terms', label: 'Order Terms', href: '/order-terms' },
  { id: 'refund-policy', label: 'Refund Policy', href: '/refund-policy' },
  { id: 'abuse-policy', label: 'Abuse Policy', href: '/abuse-policy' },
];

interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  percent: number;
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  barColor: string;
  textColor: string;
  isAcceptable: boolean;
  rules: {
    minLength: boolean;
    mixedCase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

function evaluatePasswordStrength(pw: string): PasswordStrengthResult {
  const minLength = pw.length >= 8;
  const mixedCase = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  if (!pw) {
    return {
      score: 0,
      percent: 0,
      label: 'Empty',
      barColor: 'bg-slate-200',
      textColor: 'text-slate-500',
      isAcceptable: false,
      rules: { minLength, mixedCase, hasNumber, hasSymbol },
    };
  }

  let raw = 0;
  if (minLength) raw += 1;
  if (mixedCase) raw += 1;
  if (hasNumber) raw += 1;
  if (hasSymbol) raw += 1;
  if (pw.length >= 12 && raw >= 3) raw = 4;
  if (!minLength && raw > 1) raw = 1;

  const score = Math.min(4, Math.max(1, raw)) as 1 | 2 | 3 | 4;

  if (score === 1) {
    return {
      score: 1,
      percent: 25,
      label: 'Weak',
      barColor: 'bg-[#DC2626]',
      textColor: 'text-[#DC2626]',
      isAcceptable: false,
      rules: { minLength, mixedCase, hasNumber, hasSymbol },
    };
  }
  if (score === 2) {
    return {
      score: 2,
      percent: 50,
      label: 'Fair',
      barColor: 'bg-[#D97706]',
      textColor: 'text-[#D97706]',
      isAcceptable: false,
      rules: { minLength, mixedCase, hasNumber, hasSymbol },
    };
  }
  if (score === 3) {
    return {
      score: 3,
      percent: 75,
      label: 'Good',
      barColor: 'bg-[#0E6B63]',
      textColor: 'text-[#0E6B63]',
      isAcceptable: true,
      rules: { minLength, mixedCase, hasNumber, hasSymbol },
    };
  }
  return {
    score: 4,
    percent: 100,
    label: 'Strong',
    barColor: 'bg-[#16A34A]',
    textColor: 'text-[#16A34A]',
    isAcceptable: true,
    rules: { minLength, mixedCase, hasNumber, hasSymbol },
  };
}

function generateSecurePassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*?-_';
  const all = upper + lower + digits + symbols;

  const getRandIndex = (max: number): number => {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  };

  const chars = [
    upper[getRandIndex(upper.length)],
    lower[getRandIndex(lower.length)],
    digits[getRandIndex(digits.length)],
    symbols[getRandIndex(symbols.length)],
  ];

  while (chars.length < length) {
    chars.push(all[getRandIndex(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = getRandIndex(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
}

export const AuthRegisterPage: React.FC<AuthRegisterPageProps> = ({
  onNavigateHome,
  onGoToLogin,
  onOpenDashboard,
  onOpenPolicy,
}) => {
  const { registerClientAccount, users, pendingPostAuthPath } = usePlatform();
  const { countryCode, countryName } = useCurrency();

  const initialDialOption = useMemo(() => {
    return (
      DIAL_CODES.find((d) => d.iso === countryCode) ?? DIAL_CODES[0]
    );
  }, [countryCode]);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEditedManually, setUsernameEditedManually] = useState(false);
  const [email, setEmail] = useState('');
  const [dialIso, setDialIso] = useState(initialDialOption.iso);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [otherSourceDetail, setOtherSourceDetail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [registeredAccount, setRegisteredAccount] = useState<{
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    applyPageSeoMetadata({
      title: 'Create Account | cpcloudhost.com',
      description:
        'Register an international client hosting account on cpcloudhost.com with verified phone security and strong password protection.',
      canonicalPath: '/auth/register',
      ogType: 'website',
      jsonLd: null,
    });
  }, []);

  useEffect(() => {
    if (!phoneLocal && DIAL_CODES.some((d) => d.iso === countryCode)) {
      setDialIso(countryCode);
    }
  }, [countryCode, phoneLocal]);

  const activeDialObj = useMemo(
    () => DIAL_CODES.find((d) => d.iso === dialIso) ?? DIAL_CODES[0],
    [dialIso]
  );

  const strength = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );

  const usernameStatus = useMemo(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) return { state: 'idle' as const, label: '' };
    if (!/^[a-z0-9._-]{3,32}$/.test(clean)) {
      return {
        state: 'invalid' as const,
        label: '3–32 chars (a-z, 0-9, ., _, -)',
      };
    }
    const taken = users.some(
      (u) => (u.username || u.email.split('@')[0]).toLowerCase() === clean
    );
    return taken
      ? { state: 'taken' as const, label: 'Username already taken' }
      : { state: 'available' as const, label: 'Username available' };
  }, [username, users]);

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword(16);
    setPassword(generated);
    setShowPassword(true);
    setFormError('');
    setCopiedPw(false);
  };

  const handleCopyPassword = () => {
    if (!password || typeof navigator === 'undefined') return;
    navigator.clipboard
      ?.writeText(password)
      .then(() => {
        setCopiedPw(true);
        window.setTimeout(() => setCopiedPw(false), 2000);
      })
      .catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const digitsOnly = phoneLocal.replace(/[^\d]/g, '');
    const resolvedSource =
      referralSource === 'Other' && otherSourceDetail.trim()
        ? `Other: ${otherSourceDetail.trim()}`
        : referralSource.trim();

    if (cleanName.length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
      setFormError(
        'Choose a valid username (3–32 characters using letters, numbers, dots, underscores, or hyphens).'
      );
      return;
    }
    if (usernameStatus.state === 'taken') {
      setFormError('That username is already taken. Please choose a different one.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setFormError(
        'Please enter a valid international phone number (7 to 15 digits).'
      );
      return;
    }
    if (!resolvedSource) {
      setFormError('Please select how you found cpcloudhost.com.');
      return;
    }
    if (!strength.isAcceptable) {
      setFormError(
        'Please choose a stronger password (Good or Strong: 8+ characters with mixed case and numbers or symbols).'
      );
      return;
    }

    const fullPhone =
      activeDialObj.dial === '+'
        ? `+${digitsOnly}`
        : `${activeDialObj.dial} ${phoneLocal.trim()}`;

    setFormError('');
    setSubmitting(true);

    window.setTimeout(() => {
      const result = registerClientAccount({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: fullPhone,
        country: activeDialObj.iso !== 'INTL' ? activeDialObj.name : countryName || 'International',
        referralSource: resolvedSource,
        password,
        autoSignIn: Boolean(pendingPostAuthPath),
      });

      setSubmitting(false);
      if (!result.ok || !result.account) {
        setFormError(result.error ?? 'Unable to complete registration.');
        return;
      }
      setPassword('');
      if (pendingPostAuthPath && onOpenDashboard) {
        onOpenDashboard();
        return;
      }
      setRegisteredAccount(result.account);
    }, 260);
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

      {/* Main Centered Clean Registration Card */}
      <div className="auth-fade-up-d1 w-full max-w-[468px] bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_12px_36px_-14px_rgba(15,23,42,0.08)] p-6 sm:p-8 lg:p-9">
        {registeredAccount ? (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#16A34A] mb-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Account Registered Successfully</span>
              </div>
              <h1
                className="font-display text-2xl font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Welcome, {registeredAccount.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Your international hosting account is ready. Sign in on the portal
                using your email or username and chosen password.
              </p>
            </div>

            <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Account ID</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {registeredAccount.id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Username</span>
                <span className="font-mono font-semibold text-[#0E6B63]">
                  {registeredAccount.username}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Email</span>
                <span className="font-mono text-[#0F172A] truncate">
                  {registeredAccount.email}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Verified Phone</span>
                <span className="font-mono text-[#0F172A]">
                  {registeredAccount.phone}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href="/auth/login"
                onClick={(e) => {
                  e.preventDefault();
                  onGoToLogin();
                }}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold shadow-[0_6px_20px_rgba(14,107,99,0.2)] transition-all duration-200 cursor-pointer"
              >
                <span>Proceed to Log In</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateHome();
                }}
                className="w-full min-h-[42px] inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                Return to Website
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center sm:text-left">
              <h1
                className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Create your account
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Register for global cloud hosting, domains, and instant provisioning.
              </p>
            </div>

            {pendingPostAuthPath && (
              <div className="mt-4 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/25 px-3.5 py-2.5 text-xs text-[#0E6B63] font-medium">
                Create your account to return straight to your Shared Hosting order payment. Your plan &amp; promo code are saved.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-6 space-y-4"
            >
              {/* Full Name (Required) */}
              <div>
                <label
                  htmlFor="reg-full-name"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="reg-full-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Enter your full name"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email Address (Required) */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={120}
                    value={email}
                    onChange={(e) => {
                      const nextEmail = e.target.value;
                      setEmail(nextEmail);
                      if (!usernameEditedManually) {
                        const prefix = nextEmail
                          .split('@')[0]
                          .replace(/[^a-zA-Z0-9._-]/g, '')
                          .toLowerCase()
                          .slice(0, 32);
                        setUsername(prefix);
                      }
                      if (formError) setFormError('');
                    }}
                    placeholder="you@company.com"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Username (Plain identifier without @ — auto-derived from email or customizable) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="reg-username"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Username <span className="text-[#DC2626]">*</span>
                  </label>
                  {usernameStatus.state !== 'idle' && (
                    <span
                      className={`text-[11px] font-semibold ${
                        usernameStatus.state === 'available'
                          ? 'text-[#16A34A]'
                          : usernameStatus.state === 'taken'
                          ? 'text-[#DC2626]'
                          : 'text-[#D97706]'
                      }`}
                    >
                      {usernameStatus.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <UserCheck className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={32}
                    value={username}
                    onChange={(e) => {
                      const next = e.target.value
                        .replace(/[@\s]+/g, '')
                        .replace(/[^a-zA-Z0-9._-]/g, '')
                        .toLowerCase();
                      setUsername(next);
                      setUsernameEditedManually(next.length > 0);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. alex.morgan"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Auto-filled from your email or set your own plain username (without @).
                </p>
              </div>

              {/* International Phone Number (Required) */}
              <div>
                <label
                  htmlFor="reg-phone-number"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Phone Number <span className="text-[#DC2626]">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label="Country dial code"
                    value={dialIso}
                    onChange={(e) => setDialIso(e.target.value)}
                    className="w-[122px] sm:w-[134px] shrink-0 min-h-[46px] px-2.5 py-2.5 text-xs sm:text-sm font-mono font-medium text-[#0F172A] bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 cursor-pointer"
                  >
                    {DIAL_CODES.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.iso} ({c.dial})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Phone className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <input
                      id="reg-phone-number"
                      name="tel"
                      type="tel"
                      required
                      autoComplete="tel-national"
                      maxLength={20}
                      value={phoneLocal}
                      onChange={(e) => {
                        setPhoneLocal(e.target.value);
                        if (formError) setFormError('');
                      }}
                      placeholder="300 1234567"
                      className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200 font-mono-num"
                    />
                  </div>
                </div>
              </div>

              {/* International Discovery Question (Required) */}
              <div>
                <label
                  htmlFor="reg-referral-source"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  How did you find cpcloudhost.com?{' '}
                  <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Globe className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <select
                    id="reg-referral-source"
                    required
                    value={referralSource}
                    onChange={(e) => {
                      setReferralSource(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className={`w-full min-h-[46px] pl-10 pr-4 py-2.5 text-base sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200 cursor-pointer ${
                      referralSource ? 'text-[#0F172A]' : 'text-slate-400'
                    }`}
                  >
                    <option value="" disabled>
                      Select how you discovered us
                    </option>
                    {DISCOVERY_SOURCES.map((source) => (
                      <option
                        key={source}
                        value={source}
                        className="text-[#0F172A]"
                      >
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                {referralSource === 'Other' && (
                  <input
                    type="text"
                    value={otherSourceDetail}
                    onChange={(e) => setOtherSourceDetail(e.target.value)}
                    placeholder="Optional: tell us where you heard about us"
                    maxLength={80}
                    className="mt-2 w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                  />
                )}
              </div>

              {/* Password Field + Generate Password Option + Live Strength Meter */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    Password <span className="text-[#DC2626]">*</span>
                  </label>

                  <div className="flex items-center gap-3">
                    {password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#0E6B63] transition-colors cursor-pointer"
                      >
                        {copiedPw ? (
                          <>
                            <Check className="w-3 h-3 text-[#16A34A]" aria-hidden="true" />
                            <span className="text-[#16A34A]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Generate password</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    id="reg-password"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    maxLength={128}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Create a strong password"
                    className="w-full min-h-[46px] pl-10 pr-11 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63] focus:ring-4 focus:ring-[#0E6B63]/10 transition-all duration-200 font-mono"
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

                {/* Live Password Security Meter */}
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Password Security
                    </span>
                    <span className={`font-mono-num font-bold ${strength.textColor}`}>
                      {strength.score === 0
                        ? 'Enter password'
                        : `${strength.label} (${strength.percent}%)`}
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-4 gap-1.5"
                    aria-hidden="true"
                  >
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1.5 rounded-full transition-colors duration-200 ${
                          strength.score >= seg
                            ? strength.barColor
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        strength.rules.minLength ? 'text-[#16A34A] font-medium' : 'text-slate-500'
                      }`}
                    >
                      <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>8+ characters</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        strength.rules.mixedCase ? 'text-[#16A34A] font-medium' : 'text-slate-500'
                      }`}
                    >
                      <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>Upper &amp; lowercase</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        strength.rules.hasNumber ? 'text-[#16A34A] font-medium' : 'text-slate-500'
                      }`}
                    >
                      <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>At least 1 number</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        strength.rules.hasSymbol ? 'text-[#16A34A] font-medium' : 'text-slate-500'
                      }`}
                    >
                      <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>Special symbol (!@#$)</span>
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                >
                  {formError}
                </p>
              )}

              {/* Primary Register Button */}
              <button
                type="submit"
                disabled={submitting || !strength.isAcceptable}
                className="group w-full min-h-[48px] inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] active:scale-[0.995] disabled:opacity-55 disabled:cursor-not-allowed rounded-xl shadow-[0_8px_24px_rgba(14,107,99,0.2)] hover:shadow-[0_10px_28px_rgba(14,107,99,0.28)] transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>

              <GoogleSignInButton
                mode="register"
                onSuccess={() => {
                  if (onOpenDashboard) onOpenDashboard();
                  else onNavigateHome();
                }}
                onError={(msg) => setFormError(msg)}
              />

              {/* Quiet Security & Existing Account Link */}
              <div className="pt-1 flex flex-col items-center gap-2 text-center">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-[#0E6B63] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {strength.isAcceptable
                      ? 'Password meets international security standards'
                      : 'Minimum Good (75%) password strength required to register'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pt-1">
                  Already have an account?{' '}
                  <a
                    href="/auth/login"
                    onClick={(e) => {
                      e.preventDefault();
                      onGoToLogin();
                    }}
                    className="font-semibold text-[#0E6B63] hover:text-[#0A534D] hover:underline underline-offset-4"
                  >
                    Log in
                  </a>
                </p>
              </div>
            </form>
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
