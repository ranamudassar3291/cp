import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  KeyRound,
  RefreshCw,
  Send,
  Server,
  ShieldAlert,
  Terminal,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  deriveServiceControlPanelAccess,
  PlatformOrder,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';

interface ServiceManagementPageProps {
  order: PlatformOrder;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

type ManageSectionTab =
  | 'overview'
  | 'password'
  | 'upgrade'
  | 'renew'
  | 'transfer'
  | 'cancel';

export const ServiceManagementPage: React.FC<ServiceManagementPageProps> = ({
  order,
  onBack,
  onNavigate,
}) => {
  const {
    hostingPlans,
    invoices,
    paymentMethods,
    provisioningModules,
    updateClientOrderSettings,
    changeServiceControlPanelPassword,
    launchControlPanelSso,
    calculateServiceUpgradeProration,
    createServiceUpgradeDowngradeInvoice,
    createServiceOrDomainRenewalInvoice,
    transferOrderToAccountByEmail,
    requestOrderCancellation,
    payClientOrderInvoice,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState<ManageSectionTab>('overview');
  const [revealPassword, setRevealPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    invoiceId?: string;
    ssoUrl?: string;
  } | null>(null);

  // SSO Launch State
  const [launchingSso, setLaunchingSso] = useState(false);

  // Change Password State
  const [newCpPassword, setNewCpPassword] = useState('');
  const [confirmCpPassword, setConfirmCpPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Upgrade / Downgrade State
  const compatiblePlans = useMemo(() => {
    const enabledPlans = hostingPlans.filter((p) => p.enabled);
    const prodLower = order.productType.toLowerCase();
    const categoryFiltered = enabledPlans.filter((p) => {
      if (prodLower.includes('cpanel')) return p.pageCategory === 'cpanel-hosting';
      if (prodLower.includes('wordpress')) return p.pageCategory === 'wordpress-hosting';
      if (prodLower.includes('windows')) return p.pageCategory === 'windows-hosting';
      if (prodLower.includes('vps')) return p.pageCategory === 'vps-hosting';
      if (prodLower.includes('n8n')) return p.pageCategory === 'n8n-hosting';
      if (prodLower.includes('shared')) return p.pageCategory === 'shared-hosting';
      return true;
    });
    return categoryFiltered.length > 0 ? categoryFiltered : enabledPlans;
  }, [hostingPlans, order.productType]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const otherPlan = compatiblePlans.find(
      (p) => p.name.toLowerCase() !== order.planName.toLowerCase()
    );
    return otherPlan?.id || compatiblePlans[0]?.id || '';
  });
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState<
    PlatformOrder['billingCycle']
  >(order.billingCycle);

  // Renewal State
  const [renewalCycle, setRenewalCycle] = useState<PlatformOrder['billingCycle']>(
    order.billingCycle
  );
  const [selectedGateway, setSelectedGateway] = useState<string>(() => {
    const enabled = paymentMethods.filter((m) => m.enabled);
    return enabled[0]?.name || 'Visa / Mastercard';
  });
  const [renewalTxRef, setRenewalTxRef] = useState('');

  // Transfer State
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Cancellation State
  const [cancelType, setCancelType] = useState<'immediate' | 'end_of_period'>(
    order.cancellationType || 'end_of_period'
  );
  const [cancelReason, setCancelReason] = useState(order.cancellationReason || '');

  const cpAccess = useMemo(() => deriveServiceControlPanelAccess(order), [order]);

  const linkedModule = useMemo(
    () => provisioningModules.find((m) => m.id === order.serverModuleId) || null,
    [provisioningModules, order.serverModuleId]
  );

  const serviceInvoices = useMemo(
    () => invoices.filter((inv) => inv.orderId === order.id),
    [invoices, order.id]
  );

  const openUnpaidInvoice = useMemo(
    () =>
      serviceInvoices.find(
        (inv) => inv.status === 'unpaid' || inv.status === 'overdue'
      ) || null,
    [serviceInvoices]
  );

  const prorationPreview = useMemo(() => {
    if (!selectedPlanId) return null;
    return calculateServiceUpgradeProration(
      order.id,
      selectedPlanId,
      upgradeBillingCycle
    );
  }, [
    calculateServiceUpgradeProration,
    order.id,
    selectedPlanId,
    upgradeBillingCycle,
  ]);

  const copyValue = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleLaunchSso = async () => {
    setLaunchingSso(true);
    setBanner(null);
    const res = await launchControlPanelSso(order.id);
    setLaunchingSso(false);
    if (!res.ok) {
      setBanner({
        type: 'error',
        text: res.error || 'Unable to initialize Control Panel Single Sign-On.',
      });
      return;
    }
    const targetUrl = res.url || res.ssoUrl;
    setBanner({
      type: 'success',
      text:
        res.message ||
        `Authenticated Single Sign-On session ready for ${cpAccess.cpUsername}.`,
      ssoUrl: targetUrl,
    });
  };

  const handleGenerateRandomPassword = () => {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let generated = 'Cp!';
    for (let i = 0; i < 13; i += 1) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCpPassword(generated);
    setConfirmCpPassword(generated);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCpPassword.trim().length < 8) {
      setBanner({
        type: 'error',
        text: 'New control panel password must be at least 8 characters long.',
      });
      return;
    }
    if (newCpPassword.trim() !== confirmCpPassword.trim()) {
      setBanner({
        type: 'error',
        text: 'New password and confirmation password do not match.',
      });
      return;
    }
    setSavingPassword(true);
    const res = await changeServiceControlPanelPassword(
      order.id,
      newCpPassword.trim()
    );
    setSavingPassword(false);
    if (!res.ok) {
      setBanner({
        type: 'error',
        text: res.error || 'Could not update control panel password.',
      });
      return;
    }
    setNewCpPassword('');
    setConfirmCpPassword('');
    setRevealPassword(true);
    setBanner({
      type: 'success',
      text: `${res.message || 'Control panel password updated.'} A security confirmation email has been dispatched to ${order.clientEmail}.`,
    });
  };

  const handleCreateUpgradeInvoice = () => {
    if (!selectedPlanId) return;
    const res = createServiceUpgradeDowngradeInvoice({
      orderId: order.id,
      targetPlanId: selectedPlanId,
      targetBillingCycle: upgradeBillingCycle,
    });
    if (!res.ok || !res.invoice) {
      setBanner({
        type: 'error',
        text: res.error || 'Could not generate upgrade/downgrade invoice.',
      });
      return;
    }
    const inv = res.invoice;
    setBanner({
      type: 'success',
      text:
        inv.status === 'paid'
          ? `Plan change applied immediately with prorated credit! Invoice ${inv.id} has been emailed to ${order.clientEmail}.`
          : `Prorated ${prorationPreview?.isDowngrade ? 'Downgrade' : 'Upgrade'} Invoice ${inv.id} (${formatPrice(inv.amountUsd)}) generated and emailed to ${order.clientEmail}. Settle the invoice to activate ${prorationPreview?.targetPlanName}.`,
      invoiceId: inv.id,
    });
  };

  const handleCreateRenewalInvoice = () => {
    const res = createServiceOrDomainRenewalInvoice({
      orderId: order.id,
      billingCycle: renewalCycle,
    });
    if (!res.ok || !res.invoice) {
      setBanner({
        type: 'error',
        text: res.error || 'Could not generate renewal invoice.',
      });
      return;
    }
    setBanner({
      type: 'success',
      text: `Renewal Invoice ${res.invoice.id} (${formatPrice(res.invoice.amountUsd)} · ${renewalCycle}) generated and emailed to ${order.clientEmail}.`,
      invoiceId: res.invoice.id,
    });
  };

  const handleSettleOpenInvoice = (invoiceId: string) => {
    const res = payClientOrderInvoice(invoiceId, selectedGateway, {
      transactionRef: renewalTxRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
    });
    setRenewalTxRef('');
    setBanner({
      type: 'success',
      text:
        res && res.status === 'pending'
          ? `Payment reference submitted for Invoice ${invoiceId}. Pending verification.`
          : `Invoice ${invoiceId} settled! Service billing cycle and due date have been updated.`,
      invoiceId,
    });
  };

  const handleTransferOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferring(true);
    const res = transferOrderToAccountByEmail({
      orderId: order.id,
      targetEmail: transferTargetEmail,
    });
    setTransferring(false);
    if (!res.ok) {
      setBanner({
        type: 'error',
        text: res.error || 'Service transfer could not be completed.',
      });
      return;
    }
    setBanner({
      type: 'success',
      text: `Service ${order.domainOrHost} (${order.id}) and all linked invoices have been transferred to ${transferTargetEmail.trim().toLowerCase()} (${res.targetUserName}) with registration date (${order.createdAt.slice(0, 10)}) and due date (${order.nextDueDate || '—'}) preserved.`,
    });
    setTransferTargetEmail('');
  };

  const handleSubmitCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestOrderCancellation(order.id, {
      type: cancelType,
      reason: cancelReason,
    });
    if (!res.ok) {
      setBanner({
        type: 'error',
        text: res.error || 'Could not submit cancellation request.',
      });
      return;
    }
    setBanner({
      type: 'info',
      text: `Cancellation request (${cancelType === 'immediate' ? 'Immediate Cancellation' : `End of Billing Period — ${order.nextDueDate || 'Due Date'}`}) recorded. Your invoice status has been updated and a confirmation email has been sent to ${order.clientEmail}.`,
    });
  };

  const statusBadgeClass =
    order.status === 'active'
      ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25'
      : order.status === 'pending'
        ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25'
        : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25';

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Service Identity */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] transition hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>All Services</span>
            </button>
            <span className="font-mono text-xs text-slate-400">/</span>
            <span className="font-mono text-xs font-semibold text-slate-600">{order.id}</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {order.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLaunchSso}
              disabled={launchingSso}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer"
            >
              <Terminal className="h-4 w-4" aria-hidden="true" />
              <span>
                {launchingSso
                  ? 'Authenticating SSO...'
                  : `Direct Login to ${cpAccess.panelLabel}`}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] transition hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#0E6B63]" aria-hidden="true" />
              <span>Change Password</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upgrade')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] transition hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
            >
              <TrendingUp className="h-3.5 w-3.5 text-[#0E6B63]" aria-hidden="true" />
              <span>Upgrade / Downgrade</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('renew')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] transition hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#0E6B63]" aria-hidden="true" />
              <span>Renew Service</span>
            </button>
          </div>
        </div>

        {/* Service Primary Metrics Grid */}
        <div className="mt-5 grid gap-5 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
              {order.productType} · {order.datacenter}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              {order.planName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#0E6B63]">
                <Globe className="h-4 w-4 text-[#0E6B63]" aria-hidden="true" />
                {order.domainOrHost}
              </span>
              {order.serverIp && (
                <span className="font-mono text-xs text-slate-500">
                  IP: {order.serverIp}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-7">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <p className="text-[11px] font-medium text-slate-500">
                Registration Date
              </p>
              <p className="mt-1 font-mono-num text-sm font-bold text-[#0F172A]">
                {order.createdAt.slice(0, 10)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Provisioned UTC</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <p className="text-[11px] font-medium text-slate-500">
                Next Due Date
              </p>
              <p className="mt-1 font-mono-num text-sm font-bold text-[#0E6B63]">
                {order.nextDueDate || '—'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {order.autoRenew !== false ? 'Auto-Renew Active' : 'Manual Renewal'}
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <p className="text-[11px] font-medium text-slate-500">
                Recurring Billing
              </p>
              <p className="mt-1 font-mono-num text-sm font-bold text-[#0F172A]">
                {formatPrice(order.amountUsd)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {order.billingCycle} Cycle
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <p className="text-[11px] font-medium text-slate-500">
                Server Cluster
              </p>
              <p className="mt-1 truncate text-sm font-bold text-[#0F172A]">
                {linkedModule?.name || cpAccess.panelLabel}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                {order.serverPackageName || 'NVMe Gen4 Node'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status / SSO / Invoice Notification Banner */}
      {banner && (
        <div
          className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 text-sm ${
            banner.type === 'success'
              ? 'border-[#16A34A]/30 bg-[#16A34A]/5 text-[#0F172A]'
              : banner.type === 'error'
                ? 'border-[#DC2626]/30 bg-[#DC2626]/5 text-[#DC2626]'
                : 'border-[#0E6B63]/30 bg-[#F2FAF8] text-[#0F172A]'
          }`}
        >
          <div className="flex items-start gap-3">
            {banner.type === 'error' ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" aria-hidden="true" />
            )}
            <div>
              <p className="font-medium leading-relaxed">{banner.text}</p>
              {banner.ssoUrl && (
                <p className="mt-1 font-mono text-xs text-[#0E6B63] break-all">
                  SSO Endpoint: {banner.ssoUrl}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {banner.ssoUrl && (
              <a
                href={banner.ssoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-3.5 py-2 text-xs font-semibold text-white transition"
              >
                <span>Open Control Panel Session</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
            {banner.invoiceId && (
              <button
                type="button"
                onClick={() => onNavigate(`/dashboard/invoices/${banner.invoiceId}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-3.5 py-2 text-xs font-semibold text-white transition cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Open Invoice {banner.invoiceId}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-3">
        {(
          [
            {
              id: 'overview',
              label: 'Control Panel & Access Details',
              icon: Server,
            },
            {
              id: 'password',
              label: 'Change Password',
              icon: KeyRound,
            },
            {
              id: 'upgrade',
              label: 'Upgrade / Downgrade Plan',
              icon: TrendingUp,
            },
            {
              id: 'renew',
              label: 'Renew Service',
              icon: RefreshCw,
            },
            {
              id: 'transfer',
              label: 'Transfer to Another Account',
              icon: Send,
            },
            {
              id: 'cancel',
              label: 'Cancellation',
              icon: ShieldAlert,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                active
                  ? 'bg-[#0E6B63] text-white shadow-sm'
                  : 'border border-[#E2E8F0] bg-white text-slate-700 hover:border-[#0E6B63] hover:text-[#0E6B63]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & CLIENT LOGIN DETAILS */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Control Panel Login Credentials Card */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
                    Direct Control Plane Credentials
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-bold text-[#0F172A]">
                    Client Control Panel Login Details ({cpAccess.panelLabel})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleLaunchSso}
                  disabled={launchingSso}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer"
                >
                  <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{launchingSso ? 'Connecting...' : 'One-Click Control Panel Login'}</span>
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {/* Control Panel URL */}
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Control Panel Login URL
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyValue('cpUrl', cpAccess.cpUrl)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
                      >
                        {copiedField === 'cpUrl' ? (
                          <Check className="h-3 w-3 text-[#16A34A]" aria-hidden="true" />
                        ) : (
                          <Copy className="h-3 w-3" aria-hidden="true" />
                        )}
                        <span>{copiedField === 'cpUrl' ? 'Copied' : 'Copy URL'}</span>
                      </button>
                      <a
                        href={cpAccess.cpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#0E6B63]/30 bg-[#F2FAF8] px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] hover:bg-[#0E6B63] hover:text-white transition-colors"
                      >
                        <span>Open URL</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-[#0E6B63] break-all">
                    {cpAccess.cpUrl}
                  </p>
                </div>

                {/* Username */}
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Control Panel Username
                    </span>
                    <button
                      type="button"
                      onClick={() => copyValue('cpUser', cpAccess.cpUsername)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
                    >
                      {copiedField === 'cpUser' ? (
                        <Check className="h-3 w-3 text-[#16A34A]" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span>{copiedField === 'cpUser' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="mt-1.5 font-mono text-base font-bold text-[#0F172A]">
                    {cpAccess.cpUsername}
                  </p>
                </div>

                {/* Password */}
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Control Panel Password
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRevealPassword((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0E6B63] cursor-pointer"
                      >
                        {revealPassword ? (
                          <EyeOff className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Eye className="h-3 w-3" aria-hidden="true" />
                        )}
                        <span>{revealPassword ? 'Hide' : 'Show'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyValue('cpPass', cpAccess.cpPassword)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
                      >
                        {copiedField === 'cpPass' ? (
                          <Check className="h-3 w-3 text-[#16A34A]" aria-hidden="true" />
                        ) : (
                          <Copy className="h-3 w-3" aria-hidden="true" />
                        )}
                        <span>{copiedField === 'cpPass' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 font-mono text-base font-bold text-[#0F172A]">
                    {revealPassword ? cpAccess.cpPassword : '••••••••••••••••'}
                  </p>
                </div>

                {/* Server IP & Hostname */}
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Dedicated / Shared Server IPv4
                    </span>
                    <button
                      type="button"
                      onClick={() => copyValue('serverIp', cpAccess.serverIp)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0E6B63] hover:text-[#0E6B63] cursor-pointer"
                    >
                      {copiedField === 'serverIp' ? (
                        <Check className="h-3 w-3 text-[#16A34A]" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span>{copiedField === 'serverIp' ? 'Copied' : 'Copy IP'}</span>
                    </button>
                  </div>
                  <p className="mt-1.5 font-mono text-sm font-bold text-[#0F172A]">
                    {cpAccess.serverIp}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    FTP / SSH / MySQL Host
                  </p>
                </div>

                {/* Nameservers */}
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Authoritative Nameservers
                  </span>
                  <p className="mt-1.5 font-mono text-xs font-semibold text-[#0F172A]">
                    {cpAccess.nameservers[0]}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-[#0F172A]">
                    {cpAccess.nameservers[1]}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">
                    Automatic Billing Renewal
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Automatically generate and settle renewal invoices before{' '}
                    {order.nextDueDate || 'due date'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateClientOrderSettings(order.id, {
                      autoRenew: order.autoRenew === false,
                    })
                  }
                  className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    order.autoRenew !== false
                      ? 'border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]'
                      : 'border-[#CBD5E1] bg-white text-slate-600'
                  }`}
                >
                  {order.autoRenew !== false ? 'Auto-Renew: ON' : 'Auto-Renew: OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Lifecycle Actions & Service Invoices */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
                Upmind Service Lifecycle Controls
              </p>
              <h3 className="mt-0.5 font-display text-base font-bold text-[#0F172A]">
                Manage Package, Security &amp; Ownership
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className="flex flex-col items-start rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left transition hover:border-[#0E6B63] cursor-pointer"
                >
                  <KeyRound className="h-5 w-5 text-[#0E6B63]" aria-hidden="true" />
                  <span className="mt-2.5 text-xs font-bold text-[#0F172A]">
                    Change Password
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Sync new cPanel / StackCP password &amp; email alert
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upgrade')}
                  className="flex flex-col items-start rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left transition hover:border-[#0E6B63] cursor-pointer"
                >
                  <TrendingUp className="h-5 w-5 text-[#0E6B63]" aria-hidden="true" />
                  <span className="mt-2.5 text-xs font-bold text-[#0F172A]">
                    Upgrade / Downgrade
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Prorated calculation &amp; instant invoice
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('renew')}
                  className="flex flex-col items-start rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left transition hover:border-[#0E6B63] cursor-pointer"
                >
                  <RefreshCw className="h-5 w-5 text-[#0E6B63]" aria-hidden="true" />
                  <span className="mt-2.5 text-xs font-bold text-[#0F172A]">
                    Renew Service
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Extend next due date ({order.nextDueDate || '—'})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className="flex flex-col items-start rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left transition hover:border-[#0E6B63] cursor-pointer"
                >
                  <Send className="h-5 w-5 text-[#0E6B63]" aria-hidden="true" />
                  <span className="mt-2.5 text-xs font-bold text-[#0F172A]">
                    Transfer Ownership
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Move service &amp; invoices to another email
                  </span>
                </button>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('cancel')}
                  className="flex w-full items-center justify-between rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/5 px-4 py-3 text-left transition hover:border-[#DC2626]/50 cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#DC2626]">
                      Request Service Cancellation
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Choose Immediate or End of Billing Period ({order.nextDueDate || 'Due Date'})
                    </p>
                  </div>
                  <ShieldAlert className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Linked Invoices Summary */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-[#0F172A]">
                  Billing Statements for {order.domainOrHost}
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  {serviceInvoices.length} total
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {serviceInvoices.slice(0, 4).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#0F172A]">{inv.id}</p>
                      <p className="text-[11px] text-slate-500">
                        {inv.planName} · Due {inv.dueDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-num font-bold text-[#0F172A]">
                        {formatPrice(inv.amountUsd)}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : inv.status === 'cancelled'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-[#D97706]/10 text-[#D97706]'
                        }`}
                      >
                        {inv.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/dashboard/invoices/${inv.id}`)}
                        className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] hover:border-[#0E6B63] cursor-pointer"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
                {serviceInvoices.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No billing invoices recorded for this service yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHANGE CONTROL PANEL PASSWORD */}
      {activeTab === 'password' && (
        <div className="max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
            Control Panel Security · {cpAccess.panelLabel}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
            Change Control Panel Password ({cpAccess.cpUsername})
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Updating this password immediately synchronizes with your{' '}
            {cpAccess.panelLabel} account on {order.domainOrHost} and sends a
            confirmation email to {order.clientEmail}.
          </p>

          <form onSubmit={handleSavePassword} className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  New Control Panel Password
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                >
                  Generate High-Entropy Password
                </button>
              </div>
              <input
                type="text"
                value={newCpPassword}
                onChange={(e) => setNewCpPassword(e.target.value)}
                placeholder="Enter at least 8 characters..."
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 font-mono text-sm text-[#0F172A] focus:border-[#0E6B63] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">
                Confirm New Control Panel Password
              </label>
              <input
                type="text"
                value={confirmCpPassword}
                onChange={(e) => setConfirmCpPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 font-mono text-sm text-[#0F172A] focus:border-[#0E6B63] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <span>
                  {savingPassword
                    ? 'Synchronizing Password...'
                    : 'Update Control Panel Password'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: UPGRADE / DOWNGRADE PLAN WITH PRORATED INVOICE ENGINE */}
      {activeTab === 'upgrade' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-6 lg:col-span-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
                Elastic Package Scaling
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
                Upgrade or Downgrade Hosting Plan
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                We automatically credit your unused days on{' '}
                <span className="font-semibold text-[#0F172A]">{order.planName}</span>{' '}
                and calculate the exact remaining balance due for your new package.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Select Target Hosting Package
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0E6B63] focus:outline-none"
                >
                  {compatiblePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.storage} · {formatPrice(plan.monthlyPrice)}/mo ({formatPrice(plan.yearlyPrice)}/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Target Billing Cycle
                </label>
                <select
                  value={upgradeBillingCycle}
                  onChange={(e) =>
                    setUpgradeBillingCycle(
                      e.target.value as PlatformOrder['billingCycle']
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0E6B63] focus:outline-none"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years</option>
                </select>
              </div>
            </div>

            {order.pendingUpgradeInvoiceId && (
              <div className="rounded-xl border border-[#D97706]/30 bg-[#D97706]/5 p-4 text-xs text-[#0F172A]">
                <p className="font-bold text-[#D97706]">
                  Pending Upgrade Invoice: {order.pendingUpgradeInvoiceId}
                </p>
                <p className="mt-1 text-slate-600">
                  Target Package: {order.pendingUpgradePlanName} ({order.pendingUpgradeBillingCycle}). Pay this invoice to automatically apply the package upgrade.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(`/dashboard/invoices/${order.pendingUpgradeInvoiceId}`)
                    }
                    className="rounded-lg bg-[#D97706] hover:bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    View &amp; Pay Upgrade Invoice
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Proration Calculation Summary Card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
              Live Prorated Billing Breakdown
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
              {prorationPreview?.isDowngrade ? 'Downgrade' : 'Upgrade'} Calculation
            </h3>

            {prorationPreview && prorationPreview.ok ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <span className="text-slate-500">Current Plan</span>
                  <span className="font-semibold text-[#0F172A]">
                    {prorationPreview.currentPlanName} ({formatPrice(prorationPreview.currentPriceUsd)})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <span className="text-slate-500">Remaining Cycle Days</span>
                  <span className="font-mono-num font-semibold text-[#0F172A]">
                    {prorationPreview.remainingDays} / {prorationPreview.totalCycleDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <span className="text-slate-500">Unused Time Credit</span>
                  <span className="font-mono-num font-bold text-[#16A34A]">
                    -{formatPrice(prorationPreview.unusedCreditUsd)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <span className="text-slate-500">
                    New Plan ({prorationPreview.targetPlanName} · {upgradeBillingCycle})
                  </span>
                  <span className="font-mono-num font-semibold text-[#0F172A]">
                    {formatPrice(prorationPreview.newPlanPriceUsd)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#0E6B63]/25 bg-[#F2FAF8] px-4 py-3">
                  <span className="font-bold text-[#0F172A]">
                    Net Prorated Balance Due
                  </span>
                  <span className="font-mono-num text-base font-extrabold text-[#0E6B63]">
                    {formatPrice(prorationPreview.proratedDueUsd)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateUpgradeInvoice}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-4 py-3 text-xs font-semibold text-white transition cursor-pointer"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Generate Prorated {prorationPreview.isDowngrade ? 'Downgrade' : 'Upgrade'} Invoice &amp; Send Email
                  </span>
                </button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">
                Select a target hosting plan to calculate prorated charges.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RENEW SERVICE */}
      {activeTab === 'renew' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-6 lg:col-span-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
                Service Renewal &amp; Due Date Extension
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
                Renew {order.planName} ({order.domainOrHost})
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Current Next Due Date:{' '}
                <span className="font-mono font-bold text-[#0E6B63]">
                  {order.nextDueDate || '—'}
                </span>
                . Generating and paying a renewal invoice automatically extends your
                service due date and sends an instant invoice email.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Renewal Term / Cycle
                </label>
                <select
                  value={renewalCycle}
                  onChange={(e) =>
                    setRenewalCycle(
                      e.target.value as PlatformOrder['billingCycle']
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0E6B63] focus:outline-none"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">1 Year (Yearly)</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCreateRenewalInvoice}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Generate Renewal Invoice &amp; Email Client</span>
              </button>
            </div>
          </div>

          {/* Pay Open Renewal / Service Invoice */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
              Instant Invoice Settlement
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
              {openUnpaidInvoice
                ? `Settle Open Invoice ${openUnpaidInvoice.id}`
                : 'All Service Invoices Paid'}
            </h3>

            {openUnpaidInvoice ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-xl border border-[#D97706]/30 bg-[#D97706]/5 p-3.5 text-[#0F172A]">
                  <p className="font-bold text-[#D97706]">
                    {openUnpaidInvoice.planName} — {formatPrice(openUnpaidInvoice.amountUsd)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Invoice ID: {openUnpaidInvoice.id} · Due: {openUnpaidInvoice.dueDate}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A]">
                    Payment Method
                  </label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A]"
                  >
                    {paymentMethods
                      .filter((m) => m.enabled)
                      .map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.currencyHint})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A]">
                    Transaction Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={renewalTxRef}
                    onChange={(e) => setRenewalTxRef(e.target.value)}
                    placeholder="e.g., TXN-992841"
                    className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-xs text-[#0F172A]"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSettleOpenInvoice(openUnpaidInvoice.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Pay {formatPrice(openUnpaidInvoice.amountUsd)} Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(`/dashboard/invoices/${openUnpaidInvoice.id}`)
                    }
                    className="rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] hover:border-[#0E6B63] cursor-pointer"
                  >
                    Open Full Invoice
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-600">
                There are no unpaid invoices on this service right now. Click{' '}
                <span className="font-semibold text-[#0F172A]">
                  Generate Renewal Invoice
                </span>{' '}
                on the left whenever you want to extend your billing cycle ahead of{' '}
                {order.nextDueDate || 'your due date'}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TRANSFER SERVICE OWNERSHIP BY EMAIL */}
      {activeTab === 'transfer' && (
        <div className="max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E6B63]">
            Account-to-Account Service Ownership Transfer
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
            Transfer {order.domainOrHost} to Another Client Account
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Create or sign up your destination account on CPCloudHost first, then
            paste that account&apos;s email address below. Clicking{' '}
            <span className="font-semibold text-[#0F172A]">Transfer Service</span>{' '}
            immediately moves this service with its{' '}
            <span className="font-semibold text-[#0E6B63]">
              exact Registration Date ({order.createdAt.slice(0, 10)})
            </span>
            ,{' '}
            <span className="font-semibold text-[#0E6B63]">
              exact Next Due Date ({order.nextDueDate || '—'})
            </span>
            , and{' '}
            <span className="font-semibold text-[#0E6B63]">
              all linked invoices ({serviceInvoices.length})
            </span>{' '}
            to the recipient account.
          </p>

          <form onSubmit={handleTransferOwnership} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">
                Destination CPCloudHost Account Email
              </label>
              <input
                type="email"
                required
                value={transferTargetEmail}
                onChange={(e) => setTransferTargetEmail(e.target.value)}
                placeholder="Paste destination account email (e.g., client@acme-studios.co)"
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#0E6B63] focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs text-slate-600">
              <p className="font-semibold text-[#0F172A]">
                What transfers with {order.id}:
              </p>
              <ul className="mt-1.5 space-y-1 text-[11px] text-slate-600">
                <li>
                  • Original Registration Date:{' '}
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {order.createdAt}
                  </span>
                </li>
                <li>
                  • Active Next Due Date:{' '}
                  <span className="font-mono font-semibold text-[#0E6B63]">
                    {order.nextDueDate || '—'}
                  </span>
                </li>
                <li>
                  • Linked Billing Invoices ({serviceInvoices.length} invoice records)
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={transferring}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>
                {transferring
                  ? 'Transferring Ownership...'
                  : 'Transfer Service & Invoices to New Account'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SERVICE CANCELLATION (IMMEDIATE OR DUE DATE) */}
      {activeTab === 'cancel' && (
        <div className="max-w-2xl rounded-xl border border-[#DC2626]/25 bg-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">
            Service Decommissioning &amp; Cancellation
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#0F172A]">
            Cancel {order.planName} ({order.domainOrHost})
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Choose whether to terminate this service immediately or at the end of
            your current billing period ({order.nextDueDate || 'Due Date'}). Your
            linked invoice and administrator queue will update immediately and a
            confirmation email will be sent to {order.clientEmail}.
          </p>

          {order.cancellationStatus && order.cancellationStatus !== 'none' && (
            <div className="mt-4 rounded-xl border border-[#D97706]/30 bg-[#D97706]/5 p-4 text-xs text-[#0F172A]">
              <p className="font-bold uppercase text-[#D97706]">
                Cancellation Status: {order.cancellationStatus}
              </p>
              <p className="mt-1 text-slate-700">
                Mode:{' '}
                {order.cancellationType === 'immediate'
                  ? 'Immediate Cancellation'
                  : `End of Billing Period (${order.nextDueDate || 'Due Date'})`}
              </p>
              {order.cancellationReason && (
                <p className="mt-1 text-slate-600">
                  Reason: {order.cancellationReason}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitCancellation} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setCancelType('immediate')}
                className={`rounded-xl border p-4 text-left transition cursor-pointer ${
                  cancelType === 'immediate'
                    ? 'border-[#DC2626] bg-[#DC2626]/5 text-[#0F172A]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-xs font-bold text-[#DC2626]">
                  Immediate Cancellation
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Cancel service immediately, disable auto-renew, and mark open
                  unpaid invoice cancelled.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCancelType('end_of_period')}
                className={`rounded-xl border p-4 text-left transition cursor-pointer ${
                  cancelType === 'end_of_period'
                    ? 'border-[#D97706] bg-[#D97706]/5 text-[#0F172A]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-xs font-bold text-[#D97706]">
                  On Due Date ({order.nextDueDate || 'End of Billing Period'})
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Keep service active until {order.nextDueDate || 'due date'} and
                  prevent next renewal invoice.
                </p>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tell us why you are cancelling this service (minimum 5 characters)..."
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#DC2626] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] hover:bg-red-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>
                {cancelType === 'immediate'
                  ? 'Confirm Immediate Cancellation'
                  : `Schedule Cancellation on Due Date (${order.nextDueDate || 'End of Cycle'})`}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
