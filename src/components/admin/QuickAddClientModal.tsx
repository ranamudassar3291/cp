import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw, UserPlus, X } from 'lucide-react';
import { ManagedUserAccount, usePlatform } from '../../context/PlatformContext';
import { POPULAR_COUNTRIES } from '../../context/CurrencyContext';

interface QuickAddClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: ManagedUserAccount) => void;
}

function generateStrongClientPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = upper + lower + digits + symbols;
  let out =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 8; i += 1) {
    out += all[Math.floor(Math.random() * all.length)];
  }
  return out
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export const QuickAddClientModal: React.FC<QuickAddClientModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { createUserAccount } = usePlatform();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generateStrongClientPassword());
  const [country, setCountry] = useState('Pakistan');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = createUserAccount({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      country: country.trim() || 'Pakistan',
      company: 'Client Account',
      role: 'client',
    });

    if (!res.ok || !res.user) {
      setError(res.error || 'Could not create client account.');
      return;
    }

    onCreated(res.user);
    setName('');
    setEmail('');
    setPassword(generateStrongClientPassword());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              Quick Add Client Account
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick add client modal"
            className="p-1 text-slate-400 hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Ayesha Khan"
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
              Client Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="client@company.com"
              className="w-full px-3 py-2 font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#0F172A]">
                Portal Password *
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateStrongClientPassword())}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                <span>Generate Strong</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Min 6 characters"
                className="w-full pl-3 pr-9 py-2 font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
            >
              {POPULAR_COUNTRIES.map((c) => (
                <option key={c.countryCode} value={c.countryName}>
                  {c.countryName}
                </option>
              ))}
              {!POPULAR_COUNTRIES.some((c) => c.countryName === country) && (
                <option value={country}>{country}</option>
              )}
            </select>
          </div>

          {error && (
            <p
              role="alert"
              className="text-[11px] font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}
        </div>

        <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-600 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Create &amp; Select Client</span>
          </button>
        </div>
      </form>
    </div>
  );
};
