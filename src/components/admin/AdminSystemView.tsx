import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface AdminSystemViewProps {
  onShowToast: (msg: string) => void;
}

export const AdminSystemView: React.FC<AdminSystemViewProps> = ({
  onShowToast,
}) => {
  const { systemSettings, saveSystemIntegrationSettings, currentUser } =
    usePlatform();

  const [subTab, setSubTab] = useState<'smtp' | 'google'>('smtp');

  // StackMail SMTP Form State
  const [smtpEnabled, setSmtpEnabled] = useState(systemSettings.smtp.enabled);
  const [providerLabel, setProviderLabel] = useState(
    systemSettings.smtp.providerLabel
  );
  const [host, setHost] = useState(systemSettings.smtp.host);
  const [port, setPort] = useState(String(systemSettings.smtp.port));
  const [encryption, setEncryption] = useState<'ssl' | 'tls' | 'none'>(
    systemSettings.smtp.encryption
  );
  const [username, setUsername] = useState(systemSettings.smtp.username);
  const [password, setPassword] = useState(systemSettings.smtp.password);
  const [showSmtpPw, setShowSmtpPw] = useState(false);
  const [fromName, setFromName] = useState(systemSettings.smtp.fromName);
  const [fromEmail, setFromEmail] = useState(systemSettings.smtp.fromEmail);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState(currentUser?.email ?? '');
  const [sendingTest, setSendingTest] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    ok: boolean;
    message: string;
    messageId?: string;
    response?: string;
    verifiedAtUtc?: string;
  } | null>(null);

  // Google OAuth Form State
  const [googleEnabled, setGoogleEnabled] = useState(
    systemSettings.googleOAuth.enabled
  );
  const [googleClientId, setGoogleClientId] = useState(
    systemSettings.googleOAuth.clientId
  );
  const [googleApiKey, setGoogleApiKey] = useState(
    systemSettings.googleOAuth.apiKey
  );
  const [googleClientSecret, setGoogleClientSecret] = useState(
    systemSettings.googleOAuth.clientSecret
  );
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [googleButtonLabel, setGoogleButtonLabel] = useState(
    systemSettings.googleOAuth.buttonLabel || 'Continue with Google'
  );
  const [googleAutoRegister, setGoogleAutoRegister] = useState(
    systemSettings.googleOAuth.allowAutoRegister
  );
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://cpcloudhost.com';

  const applyStackMailPreset = (mode: 'ssl' | 'tls') => {
    setProviderLabel('StackMail SMTP');
    setHost('smtp.stackmail.com');
    setPort(mode === 'ssl' ? '465' : '587');
    setEncryption(mode);
    setSmtpEnabled(true);
    onShowToast(
      `Loaded StackMail ${mode === 'ssl' ? 'SSL (465)' : 'STARTTLS (587)'} preset`
    );
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemIntegrationSettings({
      smtp: {
        enabled: smtpEnabled,
        providerLabel: providerLabel.trim() || 'StackMail SMTP',
        host: host.trim() || 'smtp.stackmail.com',
        port: parseInt(port, 10) || 465,
        encryption,
        username: username.trim(),
        password,
        fromName: fromName.trim() || 'CPCloudHost',
        fromEmail: fromEmail.trim() || username.trim() || 'support@cpcloudhost.com',
      },
    });
    onShowToast('StackMail SMTP settings saved');
  };

  const handleSendRealTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTo = testRecipient.trim();
    if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
      setSmtpTestResult({
        ok: false,
        message: 'Enter a valid recipient email address for the test delivery.',
      });
      return;
    }
    if (!host.trim() || !username.trim() || !password) {
      setSmtpTestResult({
        ok: false,
        message:
          'Enter your StackMail SMTP Host, Email Username, and Password before sending a live verification email.',
      });
      return;
    }

    setSendingTest(true);
    setSmtpTestResult(null);

    const parsedPort = parseInt(port, 10) || 465;

    try {
      const response = await fetch('/api/system/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: parsedPort,
          encryption,
          username: username.trim(),
          password,
          fromName: fromName.trim() || 'CPCloudHost',
          fromEmail: fromEmail.trim() || username.trim(),
          testTo: cleanTo,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        messageId?: string;
        response?: string;
        verifiedAtUtc?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok || !payload.ok) {
        const errText =
          payload.error || `SMTP handshake error (${payload.code || response.status})`;
        setSmtpTestResult({
          ok: false,
          message: errText,
        });
        saveSystemIntegrationSettings({
          smtp: {
            enabled: smtpEnabled,
            providerLabel: providerLabel.trim(),
            host: host.trim(),
            port: parsedPort,
            encryption,
            username: username.trim(),
            password,
            fromName: fromName.trim(),
            fromEmail: fromEmail.trim(),
            lastTestStatus: 'error',
            lastTestMessage: errText,
            lastVerifiedAtUtc: new Date().toISOString(),
          },
        });
        return;
      }

      setSmtpTestResult({
        ok: true,
        message: `Test verification email delivered to ${cleanTo}`,
        messageId: payload.messageId,
        response: payload.response,
        verifiedAtUtc: payload.verifiedAtUtc,
      });

      saveSystemIntegrationSettings({
        smtp: {
          enabled: true,
          providerLabel: providerLabel.trim() || 'StackMail SMTP',
          host: host.trim(),
          port: parsedPort,
          encryption,
          username: username.trim(),
          password,
          fromName: fromName.trim() || 'CPCloudHost',
          fromEmail: fromEmail.trim() || username.trim(),
          lastTestStatus: 'verified',
          lastTestMessage: `Verified delivery (${payload.messageId || 'SMTP 250 OK'})`,
          lastVerifiedAtUtc: payload.verifiedAtUtc || new Date().toISOString(),
        },
      });
      setSmtpEnabled(true);
      onShowToast('StackMail SMTP verified & test email sent');
    } catch (err) {
      setSmtpTestResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Network error communicating with backend mail relay.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveGoogleOAuth = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemIntegrationSettings({
      googleOAuth: {
        enabled: googleEnabled,
        clientId: googleClientId.trim(),
        apiKey: googleApiKey.trim(),
        clientSecret: googleClientSecret.trim(),
        buttonLabel: googleButtonLabel.trim() || 'Continue with Google',
        allowAutoRegister: googleAutoRegister,
      },
    });
    onShowToast(
      `Google Sign-In ${googleEnabled ? 'enabled & synced to /auth/login and /auth/register' : 'disabled'}`
    );
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-px">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('smtp')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'smtp'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Email Sending (StackMail SMTP)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('google')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'google'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Google Sign-In Config</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: STACKMAIL SMTP & REAL EMAIL TEST ==================== */}
      {subTab === 'smtp' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveSmtp}
            className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  StackMail Outgoing SMTP Configuration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure live SMTP credentials for transactional billing notices, tickets, and email verification.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyStackMailPreset('ssl')}
                  className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  StackMail SSL (465)
                </button>
                <button
                  type="button"
                  onClick={() => applyStackMailPreset('tls')}
                  className="px-3 py-1.5 text-[11px] font-semibold text-slate-700 border border-[#CBD5E1] hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  StackMail TLS (587)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={providerLabel}
                  onChange={(e) => setProviderLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.stackmail.com"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SMTP Port *
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Encryption Mode
                </label>
                <select
                  value={encryption}
                  onChange={(e) => {
                    const next = e.target.value as 'ssl' | 'tls' | 'none';
                    setEncryption(next);
                    if (next === 'ssl') setPort('465');
                    else if (next === 'tls') setPort('587');
                  }}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                >
                  <option value="ssl">SSL / TLS (Implicit Port 465)</option>
                  <option value="tls">STARTTLS (Port 587)</option>
                  <option value="none">None (Port 25)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mailbox / SMTP Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="support@cpcloudhost.com"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mailbox Password *
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="StackMail mailbox password"
                    className="w-full pr-10 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPw((v) => !v)}
                    aria-label={showSmtpPw ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                  >
                    {showSmtpPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sender From Name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="CPCloudHost"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sender From Email
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="support@cpcloudhost.com"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpEnabled}
                  onChange={(e) => setSmtpEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Enable Live StackMail Outbound Email</span>
              </label>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
              >
                Save SMTP Configuration
              </button>
            </div>
          </form>

          {/* Live Verification Test Card */}
          <form
            onSubmit={handleSendRealTestEmail}
            className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-[#0F172A]">
                Live StackMail SMTP Verification Test
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatches a real verification message through your SMTP server and returns live Message-ID &amp; handshake status.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Test Recipient Email *
              </label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2.5 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] disabled:opacity-60 rounded-lg cursor-pointer"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Sending Real Test Email via {host}...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Send Test Verification Email</span>
                </>
              )}
            </button>

            {smtpTestResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  smtpTestResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                    : 'bg-red-50 border-red-200 text-[#DC2626]'
                }`}
              >
                <div className="flex items-start gap-2 font-semibold">
                  {smtpTestResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{smtpTestResult.message}</span>
                </div>
                {smtpTestResult.messageId && (
                  <p className="font-mono text-[11px] pl-6">
                    Message-ID: {smtpTestResult.messageId}
                  </p>
                )}
                {smtpTestResult.response && (
                  <p className="font-mono text-[11px] pl-6">
                    SMTP Response: {smtpTestResult.response}
                  </p>
                )}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0F172A]">
                  Verification Status
                </span>
                <span
                  className={`font-mono font-bold uppercase ${
                    systemSettings.smtp.lastTestStatus === 'verified'
                      ? 'text-[#16A34A]'
                      : systemSettings.smtp.lastTestStatus === 'error'
                      ? 'text-[#DC2626]'
                      : 'text-slate-500'
                  }`}
                >
                  {systemSettings.smtp.lastTestStatus || 'untested'}
                </span>
              </div>
              {systemSettings.smtp.lastTestMessage && (
                <p className="font-mono text-[11px] text-slate-500 break-all">
                  {systemSettings.smtp.lastTestMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB 2: GOOGLE SIGN-IN OAUTH CONFIG ==================== */}
      {subTab === 'google' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveGoogleOAuth}
            className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Sign in with Google Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your Google OAuth 2.0 Client ID and API Key to enable one-click Google login &amp; registration on <span className="font-mono">/auth/login</span> and <span className="font-mono">/auth/register</span>.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Google OAuth 2.0 Client ID
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Google Cloud API Key
                </label>
                <input
                  type="text"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  OAuth Client Secret (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showGoogleSecret ? 'text' : 'password'}
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    placeholder="GOCSPX-..."
                    className="w-full pr-10 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleSecret((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                  >
                    {showGoogleSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Button Label on Client Auth Pages
                </label>
                <input
                  type="text"
                  value={googleButtonLabel}
                  onChange={(e) => setGoogleButtonLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleEnabled}
                  onChange={(e) => setGoogleEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Show &amp; Enable &quot;Continue with Google&quot; on /auth/login &amp; /auth/register</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleAutoRegister}
                  onChange={(e) => setGoogleAutoRegister(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Automatically provision client account on first Google Sign-In</span>
              </label>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
              >
                Save Google Sign-In Settings
              </button>
            </div>
          </form>

          {/* Right Authorized Origin & Button Preview Card */}
          <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-[#0F172A]">
                Google Cloud Console Origin &amp; Live Button Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add this Authorized JavaScript Origin in Google Cloud Credentials.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#0F172A] truncate">
                {originUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(originUrl).catch(() => {});
                  setCopiedOrigin(true);
                  window.setTimeout(() => setCopiedOrigin(false), 1800);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] bg-white border border-[#CBD5E1] rounded cursor-pointer shrink-0"
              >
                {copiedOrigin ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Origin</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-500">
                Storefront Auth Card Preview
              </p>
              <div className="p-5 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] text-sm font-semibold text-[#0F172A] shadow-sm"
                >
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
                  <span>{googleButtonLabel || 'Continue with Google'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Admin portal access (<span className="font-mono">/admin/wp</span>) remains restricted to authorized administrator password &amp; 2FA credentials only.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
