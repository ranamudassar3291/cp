import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe2,
  Lock,
  MailCheck,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';

interface DomainVerifyPageProps {
  onNavigateDomains: () => void;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export const DomainVerifyPage: React.FC<DomainVerifyPageProps> = ({
  onNavigateDomains,
  onNavigateHome,
  onNavigateLogin,
}) => {
  const { orders, currentUser, verifyDomainContactByToken } = usePlatform();

  const { initialOrderId, initialToken } = useMemo(() => {
    if (typeof window === 'undefined') return { initialOrderId: '', initialToken: '' };
    const params = new URLSearchParams(window.location.search || '');
    return {
      initialOrderId: params.get('orderId') || '',
      initialToken: params.get('token') || '',
    };
  }, []);

  const [manualOrderId, setManualOrderId] = useState(initialOrderId);
  const [manualToken, setManualToken] = useState(initialToken);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [justVerified, setJustVerified] = useState(false);

  const activeOrderId = (initialOrderId || manualOrderId).trim();
  const activeToken = (initialToken || manualToken).trim();

  const matchedOrder = useMemo(
    () => orders.find((o) => o.id === activeOrderId) ?? null,
    [orders, activeOrderId]
  );

  const isPendingAdminApproval =
    matchedOrder?.status === 'pending' &&
    matchedOrder?.domainVerificationStatus === 'pending_admin_approval';
  const isAlreadyVerified =
    matchedOrder?.domainVerificationStatus === 'verified' ||
    justVerified ||
    (matchedOrder?.status === 'active' && !matchedOrder?.domainVerificationStatus);
  const tokenValid =
    Boolean(matchedOrder) &&
    (!matchedOrder?.domainVerificationToken ||
      activeToken.toLowerCase() === matchedOrder.domainVerificationToken.toLowerCase());

  const handleApproveVerify = () => {
    if (!activeOrderId) {
      setFeedback({ type: 'error', text: 'Missing domain order reference.' });
      return;
    }
    const res = verifyDomainContactByToken(activeOrderId, activeToken);
    if (!res.ok) {
      setFeedback({
        type: 'error',
        text: res.error || 'Unable to verify domain contact details.',
      });
      return;
    }
    setJustVerified(true);
    setFeedback({
      type: 'success',
      text: `Registrant contact details verified for ${res.order?.domainOrHost}. Full domain management is now unlocked.`,
    });
  };

  const whois = matchedOrder?.whoisContact;

  return (
    <section className="py-14 lg:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0] min-h-[75vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          {/* Header Banner */}
          <div className="px-6 py-6 bg-[#0F172A] text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0E6B63] border border-emerald-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  ICANN Registrant Verification · cpcloudhost.com
                </p>
                <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Verify Domain Contact Details
                </h1>
              </div>
            </div>
            {matchedOrder && (
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200">
                {matchedOrder.id}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {!matchedOrder ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold text-sm mb-1">
                      Verification Reference Required
                    </p>
                    <p>
                      Open the verification link from your Domain Contact Verification email, or enter your Domain Order ID and verification token below.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Domain Order ID
                    </label>
                    <input
                      type="text"
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      placeholder="ORD-905123"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6B63]/20 focus:border-[#0E6B63]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Verification Token
                    </label>
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="VRF-XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0E6B63]/20 focus:border-[#0E6B63]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateDomains}
                    className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0"
                  >
                    Go to My Domains
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 whitespace-nowrap shrink-0"
                  >
                    Return Home
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Domain Summary Box */}
                <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                      <Globe2 className="w-5 h-5 text-[#0E6B63]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Registered Domain Name
                      </p>
                      <p className="text-lg font-bold font-mono text-slate-900">
                        {matchedOrder.domainOrHost}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Verification State
                    </p>
                    <p
                      className={`text-xs font-bold mt-0.5 ${
                        isAlreadyVerified
                          ? 'text-emerald-700'
                          : isPendingAdminApproval
                            ? 'text-amber-700'
                            : 'text-[#0E6B63]'
                      }`}
                    >
                      {isAlreadyVerified
                        ? 'Verified · Management Unlocked'
                        : isPendingAdminApproval
                          ? 'Awaiting Admin Approval'
                          : 'Ready for Your Approval'}
                    </p>
                  </div>
                </div>

                {/* WHOIS Registrant Details */}
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <UserCheck className="w-4 h-4 text-[#0E6B63]" />
                      Registrant WHOIS Contact Information
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      WHOIS Privacy: {matchedOrder.whoisPrivacy !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">
                        Registrant Full Name
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {whois
                          ? `${whois.firstName} ${whois.lastName}`
                          : matchedOrder.clientName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">
                        Organization / Company
                      </p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {whois?.organization || 'Individual / Personal Registrant'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">
                        Registrant Email
                      </p>
                      <p className="text-sm font-mono text-slate-900 mt-0.5">
                        {whois?.email || matchedOrder.clientEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">
                        Telephone
                      </p>
                      <p className="text-sm font-mono text-slate-900 mt-0.5">
                        {whois?.phone || 'Verified on Account'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">
                        Registered Street & Postal Address
                      </p>
                      <p className="text-sm text-slate-800 mt-0.5">
                        {whois
                          ? `${whois.addressLine1}${whois.addressLine2 ? `, ${whois.addressLine2}` : ''}, ${whois.city}, ${whois.stateProvince} ${whois.postalCode}, ${whois.countryName}`
                          : `${matchedOrder.country} (Default Account Profile)`}
                      </p>
                    </div>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                {/* Conditional Status / Action Panel */}
                {isPendingAdminApproval ? (
                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold text-sm mb-1">
                        Pending Registrar Admin Review
                      </p>
                      <p>
                        Our operations team is currently reviewing your domain registration order ({matchedOrder.id}). Once approved by an administrator, this verification link activates automatically so you can confirm your WHOIS details and manage your domain.
                      </p>
                    </div>
                  </div>
                ) : !tokenValid ? (
                  <div className="p-5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-900 leading-relaxed">
                      <p className="font-bold text-sm mb-1">
                        Invalid Verification Token
                      </p>
                      <p>
                        The verification token in this URL does not match {matchedOrder.domainOrHost}. Please click the exact verification button inside your domain verification email.
                      </p>
                    </div>
                  </div>
                ) : isAlreadyVerified ? (
                  <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-4">
                    <div className="flex items-start gap-3">
                      <MailCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-950">
                          WHOIS Contact Approved & Domain Management Unlocked
                        </p>
                        <p className="text-xs text-emerald-900 mt-1">
                          {matchedOrder.domainOrHost} is active and verified
                          {matchedOrder.domainContactVerifiedAt
                            ? ` (${matchedOrder.domainContactVerifiedAt})`
                            : ''}. You can now manage DNS zone records, nameservers, WHOIS privacy, and EPP settings.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={currentUser ? onNavigateDomains : onNavigateLogin}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#09534D] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        {currentUser ? 'Manage Domain Now' : 'Sign In to Manage Domain'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={onNavigateHome}
                        className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-xs font-semibold text-emerald-900 whitespace-nowrap shrink-0"
                      >
                        Back to cpcloudhost.com
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Confirm Registrant Accuracy & Activate Domain Controls
                      </p>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        By clicking <strong>Approve & Verify Contact Details</strong> below, you confirm that the WHOIS registrant name, email, phone, and address above are accurate per ICANN policy. Your domain DNS and nameserver management panel will unlock immediately.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleApproveVerify}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0E6B63] hover:bg-[#09534D] text-white text-xs font-bold transition-colors shadow-sm whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Verify Contact Details
                      </button>
                      <button
                        type="button"
                        onClick={onNavigateHome}
                        className="px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
