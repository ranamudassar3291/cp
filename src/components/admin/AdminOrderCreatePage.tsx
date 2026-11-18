import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  Globe,
  Loader2,
  Receipt,
  Server,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  computeDefaultNextDueDate,
  ManagedHostingPlanRecord,
  PlatformInvoice,
  PlatformOrder,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';
import { SearchableClientSelect } from './SearchableClientSelect';

interface AdminOrderCreatePageProps {
  onBackToOrders: () => void;
  onOpenOrderInQueue: (orderId: string) => void;
  onOpenModules: () => void;
  onShowToast: (msg: string) => void;
}

const PRODUCT_TYPES: PlatformOrder['productType'][] = [
  'cPanel Hosting',
  'Shared Cloud',
  'Managed WordPress',
  'Windows Hosting',
  'Reseller Hosting',
  'Unmanaged VPS',
  'n8n Hosting',
  'Domain Registration',
  'Domain Transfer',
];

const BILLING_CYCLES: PlatformOrder['billingCycle'][] = [
  'Monthly',
  'Yearly',
  '1 Month',
  '1 Year',
  '2 Years',
  '4 Years',
  '5-Year',
];

const DATACENTERS = [
  'London, UK',
  'Dallas, US',
  'Frankfurt, DE',
  'Singapore, SG',
  'Global Anycast DNS',
];

const CATEGORY_TO_PRODUCT_TYPE: Record<
  ManagedHostingPlanRecord['pageCategory'],
  PlatformOrder['productType']
> = {
  'cpanel-hosting': 'cPanel Hosting',
  'shared-hosting': 'Shared Cloud',
  'wordpress-hosting': 'Managed WordPress',
  'windows-hosting': 'Windows Hosting',
  'reseller-hosting': 'Reseller Hosting',
  'vps-hosting': 'Unmanaged VPS',
  'n8n-hosting': 'n8n Hosting',
  'free-trial': 'Shared Cloud',
};

function computePlanCyclePrice(
  plan: ManagedHostingPlanRecord,
  cycle: PlatformOrder['billingCycle']
): number {
  if (cycle === 'Monthly' || cycle === '1 Month') return plan.monthlyPrice;
  if (cycle === '2 Years') return Number((plan.yearlyPrice * 2).toFixed(2));
  if (cycle === '4 Years') return Number((plan.yearlyPrice * 4).toFixed(2));
  if (cycle === '5-Year') return Number((plan.yearlyPrice * 5).toFixed(2));
  return plan.yearlyPrice;
}

function normalizeCpanelUsernameFromDomain(domain: string): string {
  const clean = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/[^a-z0-9]/g, '');
  let base = clean.replace(/^[0-9]+/, '');
  if (!base) base = `cp${clean || 'acct'}`;
  if (base.length < 4) base = `${base}acct`.slice(0, 8);
  return base.slice(0, 8);
}

export const AdminOrderCreatePage: React.FC<AdminOrderCreatePageProps> = ({
  onBackToOrders,
  onOpenOrderInQueue,
  onOpenModules,
  onShowToast,
}) => {
  const {
    users,
    hostingPlans,
    provisioningModules,
    paymentMethods,
    invoiceTemplateConfig,
    systemSettings,
    addOrder,
    approveOrderWithServer,
  } = usePlatform();
  const { formatPrice, currency, rate } = useCurrency();

  const todayIso = new Date().toISOString().slice(0, 10);
  const firstClient = users.find((u) => u.role !== 'admin');
  const firstPlan =
    hostingPlans.find((p) => p.enabled && p.pageCategory === 'cpanel-hosting') ??
    hostingPlans.find((p) => p.enabled) ??
    hostingPlans[0];
  const defaultMod =
    provisioningModules.find((m) => m.id === firstPlan?.serverModuleId && m.enabled) ??
    provisioningModules.find((m) => m.enabled) ??
    provisioningModules[0];

  // Client
  const [clientEmail, setClientEmail] = useState(firstClient?.email ?? '');
  const [clientName, setClientName] = useState(firstClient?.name ?? '');
  const [clientCountry, setClientCountry] = useState(
    firstClient?.country ?? 'Pakistan'
  );

  // Package & Domain
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    firstPlan?.id ?? 'custom'
  );
  const [productType, setProductType] = useState<PlatformOrder['productType']>(
    firstPlan ? CATEGORY_TO_PRODUCT_TYPE[firstPlan.pageCategory] : 'cPanel Hosting'
  );
  const [planName, setPlanName] = useState(firstPlan?.name ?? 'Custom Hosting Service');
  const [domainOrHost, setDomainOrHost] = useState('');
  const [datacenter, setDatacenter] = useState('London, UK');

  // Pricing & Dates
  const [billingCycle, setBillingCycle] =
    useState<PlatformOrder['billingCycle']>('Yearly');
  const [amountUsd, setAmountUsd] = useState(
    firstPlan ? firstPlan.yearlyPrice.toFixed(2) : '0.00'
  );
  const [startDate, setStartDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState(computeDefaultNextDueDate(todayIso, 'Yearly'));
  const [manualDueLocked, setManualDueLocked] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  // Server & WHM Provisioning
  const [serverModuleId, setServerModuleId] = useState(defaultMod?.id ?? '');
  const [serverPackageName, setServerPackageName] = useState(
    firstPlan?.serverPackageName || defaultMod?.packages?.[0] || ''
  );
  const [cpanelUsername, setCpanelUsername] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [runLiveWhmOnApprove, setRunLiveWhmOnApprove] = useState(
    Boolean(defaultMod?.moduleType === 'whm' && defaultMod.apiToken.trim())
  );
  const [notes, setNotes] = useState('');

  // Status / Creation Result
  const [formError, setFormError] = useState('');
  const [createdRecord, setCreatedRecord] = useState<{
    order: PlatformOrder;
    invoice: PlatformInvoice | null;
    approved: boolean;
    whmMessage?: string;
  } | null>(null);
  const [approvingNow, setApprovingNow] = useState(false);
  const [approveError, setApproveError] = useState('');

  const selectedServerModule = useMemo(
    () => provisioningModules.find((m) => m.id === serverModuleId) ?? null,
    [provisioningModules, serverModuleId]
  );

  const selectedPlanObj = useMemo(
    () => hostingPlans.find((p) => p.id === selectedPlanId) ?? null,
    [hostingPlans, selectedPlanId]
  );

  const groupedPlans = useMemo(() => {
    const groups = new Map<string, ManagedHostingPlanRecord[]>();
    hostingPlans
      .filter((p) => p.enabled)
      .forEach((p) => {
        const list = groups.get(p.pageCategory) || [];
        list.push(p);
        groups.set(p.pageCategory, list);
      });
    return Array.from(groups.entries());
  }, [hostingPlans]);

  const handlePlanChange = (nextPlanId: string) => {
    setSelectedPlanId(nextPlanId);
    if (nextPlanId === 'custom') return;
    const plan = hostingPlans.find((p) => p.id === nextPlanId);
    if (!plan) return;
    setProductType(CATEGORY_TO_PRODUCT_TYPE[plan.pageCategory]);
    setPlanName(plan.name);
    setAmountUsd(computePlanCyclePrice(plan, billingCycle).toFixed(2));
    if (plan.serverModuleId) {
      setServerModuleId(plan.serverModuleId);
      const matchedMod = provisioningModules.find((m) => m.id === plan.serverModuleId);
      if (matchedMod) {
        setRunLiveWhmOnApprove(
          matchedMod.moduleType === 'whm' && Boolean(matchedMod.apiToken.trim())
        );
      }
    }
    if (plan.serverPackageName) {
      setServerPackageName(plan.serverPackageName);
    }
  };

  const handleBillingCycleChange = (nextCycle: PlatformOrder['billingCycle']) => {
    setBillingCycle(nextCycle);
    if (selectedPlanObj) {
      setAmountUsd(computePlanCyclePrice(selectedPlanObj, nextCycle).toFixed(2));
    }
    if (!manualDueLocked) {
      setDueDate(computeDefaultNextDueDate(startDate, nextCycle));
    }
  };

  const handleStartDateChange = (nextStart: string) => {
    setStartDate(nextStart);
    if (!manualDueLocked && nextStart) {
      setDueDate(computeDefaultNextDueDate(nextStart, billingCycle));
    }
  };

  const handleDomainInputChange = (val: string) => {
    setDomainOrHost(val);
    if (!cpanelUsername && val.includes('.')) {
      setCpanelUsername(normalizeCpanelUsernameFromDomain(val));
    }
  };

  const handleCreatePendingOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setApproveError('');

    const cleanEmail = clientEmail.trim().toLowerCase();
    const cleanDomain = domainOrHost
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];
    const parsedPrice = parseFloat(amountUsd);

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Select a client by name/email or enter a valid client email.');
      return;
    }
    if (!cleanDomain) {
      setFormError('Paste or enter the domain name or node hostname for this order.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError('Enter a valid non-negative USD order price.');
      return;
    }

    const derivedUser =
      cpanelUsername.trim() || normalizeCpanelUsernameFromDomain(cleanDomain);

    const { order, invoice } = addOrder({
      clientEmail: cleanEmail,
      clientName: clientName.trim() || undefined,
      country: clientCountry || 'International',
      productType,
      planName: planName.trim() || productType,
      domainOrHost: cleanDomain,
      billingCycle,
      amountUsd: parsedPrice,
      datacenter,
      paymentMethod: 'Invoice Pending',
      status: 'pending',
      invoicePaid: false,
      createdAt: startDate || todayIso,
      nextDueDate: dueDate || computeDefaultNextDueDate(startDate || todayIso, billingCycle),
      autoRenew,
      serverModuleId: serverModuleId || undefined,
      serverPackageName: serverPackageName.trim() || undefined,
      serverIp: serverIp.trim() || undefined,
      cpanelUsername: derivedUser,
      notes:
        notes.trim() ||
        `Pending order created with unpaid invoice; ready for server approval.`,
      generateInvoice: true,
    });

    setCreatedRecord({
      order,
      invoice,
      approved: false,
    });
    onShowToast(
      `Pending order ${order.id} & unpaid invoice ${invoice?.id || ''} added to client account`
    );
  };

  const handleApproveCreatedOrder = async () => {
    if (!createdRecord || approvingNow) return;
    setApproveError('');

    const targetModId = serverModuleId || createdRecord.order.serverModuleId || '';
    const mod = provisioningModules.find((m) => m.id === targetModId) ?? null;

    if (!mod && runLiveWhmOnApprove) {
      setApproveError('Select a WHM server module first.');
      return;
    }

    let whmMessage = '';
    let provisionedUser =
      cpanelUsername.trim() ||
      createdRecord.order.cpanelUsername ||
      normalizeCpanelUsernameFromDomain(createdRecord.order.domainOrHost);
    let provisionedIp = serverIp.trim() || createdRecord.order.serverIp || '';

    if (
      mod &&
      mod.moduleType === 'whm' &&
      runLiveWhmOnApprove &&
      mod.apiToken.trim()
    ) {
      setApprovingNow(true);
      try {
        const res = await fetch('/api/modules/whm/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostname: mod.hostname,
            port: mod.port,
            useSsl: mod.useSsl,
            username: mod.username,
            apiToken: mod.apiToken,
            ignoreSslErrors: mod.ignoreSslErrors,
            domain: createdRecord.order.domainOrHost,
            acctUsername: provisionedUser,
            cpanelUsername: provisionedUser,
            plan: serverPackageName.trim() || mod.packages[0] || 'default',
            contactEmail: createdRecord.order.clientEmail,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          reason?: string;
          message?: string;
          error?: string;
          ip?: string;
          acctUsername?: string;
        };
        if (!res.ok || !data.ok) {
          setApprovingNow(false);
          setApproveError(
            data.error ||
              data.message ||
              data.reason ||
              'WHM cPanel creation failed. Verify server package name, domain, and WHM API token.'
          );
          return;
        }
        whmMessage = data.reason || data.message || 'cPanel account provisioned on WHM.';
        if (data.acctUsername) provisionedUser = data.acctUsername;
        if (data.ip && !provisionedIp) provisionedIp = data.ip;
      } catch (err) {
        setApprovingNow(false);
        setApproveError(
          err instanceof Error ? `WHM request failed: ${err.message}` : 'WHM request failed.'
        );
        return;
      }
      setApprovingNow(false);
    }

    const approvalNote = whmMessage
      ? `${notes.trim() ? `${notes.trim()} · ` : ''}WHM Live: ${whmMessage}`
      : notes.trim() || undefined;

    const approvalRes = approveOrderWithServer({
      orderId: createdRecord.order.id,
      serverModuleId: targetModId,
      serverPackageName: serverPackageName.trim() || undefined,
      serverIp: provisionedIp || undefined,
      cpanelUsername: provisionedUser,
      notes: approvalNote,
    });

    if (!approvalRes.ok) {
      setApproveError(approvalRes.error || 'Could not approve order.');
      return;
    }

    const finalizedOrder: PlatformOrder = {
      ...createdRecord.order,
      status: 'active',
      invoicePaid: invoiceTemplateConfig.autoMarkPaidOnApproval !== false,
      serverModuleId: targetModId || createdRecord.order.serverModuleId,
      serverPackageName: serverPackageName.trim() || createdRecord.order.serverPackageName,
      serverIp: provisionedIp || createdRecord.order.serverIp,
      cpanelUsername: provisionedUser,
      notes: approvalNote || createdRecord.order.notes,
    };

    setCreatedRecord({
      order: finalizedOrder,
      invoice: approvalRes.invoice ?? createdRecord.invoice,
      approved: true,
      whmMessage,
    });

    if (
      approvalRes.invoice &&
      systemSettings.smtp.enabled &&
      systemSettings.smtp.host.trim() &&
      systemSettings.smtp.username.trim() &&
      systemSettings.smtp.password &&
      invoiceTemplateConfig.autoSendInvoiceEmailOnApproval !== false
    ) {
      void fetch('/api/system/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: systemSettings.smtp,
          toEmail: finalizedOrder.clientEmail,
          clientName: finalizedOrder.clientName,
          invoiceId: approvalRes.invoice.id,
          orderId: finalizedOrder.id,
          planName: finalizedOrder.planName,
          domainOrHost: finalizedOrder.domainOrHost,
          amountFormatted: formatPrice(approvalRes.invoice.amountUsd),
          statusLabel: approvalRes.invoice.status.toUpperCase(),
          issuedDate: approvalRes.invoice.issuedDate,
          dueDate: approvalRes.invoice.dueDate,
          datacenter: finalizedOrder.datacenter,
          companyName: invoiceTemplateConfig.companyName,
        }),
      }).catch(() => undefined);
    }

    onShowToast(
      `Order ${finalizedOrder.id} ACTIVE · Invoice ${approvalRes.invoice?.id || ''} PAID`
    );
  };

  const handleResetForNewOrder = () => {
    setDomainOrHost('');
    setCpanelUsername('');
    setServerIp('');
    setNotes('');
    setCreatedRecord(null);
    setApproveError('');
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Top Page Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBackToOrders}
            className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Orders</span>
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-[#0F172A]">
              Add &amp; Provision Client Order
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Search client by name/email, configure package, domain, price, dates, and server — generate pending order + unpaid invoice, then approve to auto-create cPanel &amp; mark paid.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Order Builder Form */}
        <form
          onSubmit={handleCreatePendingOrder}
          className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-6"
        >
          {/* 1. Client Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserCheck className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-[#0F172A]">
                1. Client Account
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
              <div className="sm:col-span-2">
                <SearchableClientSelect
                  label="Search Client (Name or Email) *"
                  users={users}
                  valueEmail={clientEmail}
                  onChange={(sel) => {
                    setClientEmail(sel.email);
                    setClientName(sel.name);
                    setClientCountry(sel.country || 'International');
                    setFormError('');
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client display name"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Client Country
                </label>
                <input
                  type="text"
                  value={clientCountry}
                  onChange={(e) => setClientCountry(e.target.value)}
                  placeholder="Pakistan / United Kingdom / USA"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>
            </div>
          </div>

          {/* 2. Package & Domain */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
              <h2 className="font-display text-sm font-bold text-[#0F172A]">
                2. Package &amp; Target Domain / Hostname
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Package
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
                >
                  {groupedPlans.map(([cat, list]) => (
                    <optgroup key={cat} label={cat.toUpperCase()}>
                      {list.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.monthlyPrice}/mo · ${p.yearlyPrice}/yr
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="custom">Custom / Manual Service</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Product Category
                </label>
                <select
                  value={productType}
                  onChange={(e) =>
                    setProductType(e.target.value as PlatformOrder['productType'])
                  }
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
                >
                  {PRODUCT_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Plan Display Name *
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. cPanel Velocity"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Domain / Node Hostname (Paste Here) *
                </label>
                <input
                  type="text"
                  value={domainOrHost}
                  onChange={(e) => handleDomainInputChange(e.target.value)}
                  placeholder="example.com or node01.domain.com"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>
            </div>
          </div>

          {/* 3. Billing Period, Price & Manual Dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  3. Billing Period, Price &amp; Dates
                </h2>
              </div>
              {manualDueLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setManualDueLocked(false);
                    setDueDate(computeDefaultNextDueDate(startDate, billingCycle));
                  }}
                  className="text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                >
                  Reset Due Date to Auto-Calc
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Billing Period
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) =>
                    handleBillingCycleChange(
                      e.target.value as PlatformOrder['billingCycle']
                    )
                  }
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
                >
                  {BILLING_CYCLES.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Order Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Order Start Date (Manual)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Next Due Date (Auto / Manual)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setManualDueLocked(true);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>
            </div>
          </div>

          {/* 4. Server Assignment & Provisioning Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  4. Server Selection &amp; Order Details
                </h2>
              </div>
              {provisioningModules.length === 0 && (
                <button
                  type="button"
                  onClick={onOpenModules}
                  className="text-[11px] font-semibold text-[#D97706] hover:underline cursor-pointer"
                >
                  Configure WHM Server Module &rarr;
                </button>
              )}
            </div>

            {provisioningModules.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  No server modules are configured yet. Add your real WHM server in{' '}
                  <button
                    type="button"
                    onClick={onOpenModules}
                    className="font-bold underline cursor-pointer"
                  >
                    Module Config (WHM)
                  </button>{' '}
                  to auto-provision cPanel accounts on approval.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Server Module
                </label>
                <select
                  value={serverModuleId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setServerModuleId(nextId);
                    const nextMod = provisioningModules.find((m) => m.id === nextId);
                    if (nextMod) {
                      if (nextMod.packages.length > 0) {
                        setServerPackageName(nextMod.packages[0]);
                      }
                      setRunLiveWhmOnApprove(
                        nextMod.moduleType === 'whm' && Boolean(nextMod.apiToken.trim())
                      );
                    } else {
                      setRunLiveWhmOnApprove(false);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
                >
                  <option value="">Manual / No Server Assigned</option>
                  {provisioningModules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.moduleType.toUpperCase()} · {mod.hostname})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Server Package (WHM Package)
                </label>
                <input
                  type="text"
                  list="create-order-whm-pkgs"
                  value={serverPackageName}
                  onChange={(e) => setServerPackageName(e.target.value)}
                  placeholder="e.g. cpcloud_velocity"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
                <datalist id="create-order-whm-pkgs">
                  {(selectedServerModule?.packages ?? []).map((pkg) => (
                    <option key={pkg} value={pkg} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Datacenter Location
                </label>
                <select
                  value={datacenter}
                  onChange={(e) => setDatacenter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
                >
                  {DATACENTERS.map((dc) => (
                    <option key={dc} value={dc}>
                      {dc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  cPanel Username (Auto if blank)
                </label>
                <input
                  type="text"
                  value={cpanelUsername}
                  onChange={(e) => setCpanelUsername(e.target.value)}
                  placeholder="Auto from domain"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Server IP (Auto from WHM if blank)
                </label>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  placeholder="Optional static IP"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div className="flex items-end pb-1.5">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span>Auto-Renew &amp; Due-Date Billing Enabled</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Order Details / Provisioning Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional provisioning instructions, nameserver guidance, or custom specs..."
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Creates a <strong>Pending</strong> order &amp; <strong>Unpaid</strong> invoice on the client account. Approve anytime on the right.
            </span>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Receipt className="w-4 h-4" aria-hidden="true" />
              <span>Add Order &amp; Generate Invoice</span>
            </button>
          </div>
        </form>

        {/* Right Live Order Summary & Instant Approval / WHM Provisioning Panel */}
        <div className="xl:col-span-4 space-y-5">
          {!createdRecord ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0E6B63]">
                  Order Summary Preview
                </p>
                <h3 className="font-display text-base font-bold text-[#0F172A] mt-0.5">
                  {planName || 'New Client Order'}
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Client</span>
                  <span className="font-semibold text-[#0F172A] text-right truncate">
                    {clientEmail || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-[#0F172A]">{productType}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Domain / Host</span>
                  <span className="font-mono text-[#0E6B63] truncate">
                    {domainOrHost || '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Billing Period</span>
                  <span className="font-medium text-[#0F172A]">{billingCycle}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-mono text-slate-700">{startDate}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Next Due Date</span>
                  <span className="font-mono font-semibold text-[#0F172A]">{dueDate}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Server Node</span>
                  <span className="font-medium text-[#0F172A] text-right truncate">
                    {selectedServerModule ? selectedServerModule.name : 'Manual / Unassigned'}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-slate-600 font-semibold">Invoice Total</span>
                  <span className="font-mono tabular-nums text-lg font-extrabold text-[#0F172A]">
                    {formatPrice(parseFloat(amountUsd) || 0)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-slate-600 leading-relaxed">
                Clicking <strong>Add Order &amp; Generate Invoice</strong> places a{' '}
                <span className="font-semibold text-[#D97706]">PENDING</span> order and{' '}
                <span className="font-semibold text-[#D97706]">UNPAID</span> invoice in the client portal, then unlocks instant one-click approval &amp; WHM provisioning right here.
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-[#0E6B63] rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span
                    className={`inline-block font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      createdRecord.approved
                        ? 'bg-[#16A34A]/10 text-[#16A34A]'
                        : 'bg-amber-50 text-[#D97706]'
                    }`}
                  >
                    {createdRecord.approved ? 'ACTIVE · PAID' : 'PENDING · UNPAID'}
                  </span>
                  <h3 className="font-display text-base font-bold text-[#0F172A] mt-1">
                    {createdRecord.order.id}
                  </h3>
                  {createdRecord.invoice && (
                    <p className="font-mono text-xs text-[#0E6B63]">
                      Invoice {createdRecord.invoice.id}
                    </p>
                  )}
                </div>
                <Cpu className="w-5 h-5 text-[#0E6B63] shrink-0" aria-hidden="true" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Client</span>
                  <span className="font-semibold text-[#0F172A] truncate">
                    {createdRecord.order.clientEmail}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Domain</span>
                  <span className="font-mono text-[#0E6B63]">
                    {createdRecord.order.domainOrHost}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {formatPrice(createdRecord.order.amountUsd)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {createdRecord.order.nextDueDate}
                  </span>
                </div>
                {createdRecord.order.cpanelUsername && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">cPanel User</span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {createdRecord.order.cpanelUsername}
                    </span>
                  </div>
                )}
                {createdRecord.order.serverIp && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Server IP</span>
                    <span className="font-mono text-[#0F172A]">
                      {createdRecord.order.serverIp}
                    </span>
                  </div>
                )}
              </div>

              {!createdRecord.approved ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                      Confirm Provisioning Server
                    </label>
                    <select
                      value={serverModuleId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setServerModuleId(nextId);
                        const nextMod = provisioningModules.find(
                          (m) => m.id === nextId
                        );
                        if (nextMod) {
                          if (nextMod.packages.length > 0 && !serverPackageName) {
                            setServerPackageName(nextMod.packages[0]);
                          }
                          setRunLiveWhmOnApprove(
                            nextMod.moduleType === 'whm' &&
                              Boolean(nextMod.apiToken.trim())
                          );
                        } else {
                          setRunLiveWhmOnApprove(false);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      <option value="">Manual / Local Activation</option>
                      {provisioningModules.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.name} ({mod.moduleType.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedServerModule?.moduleType === 'whm' &&
                    Boolean(selectedServerModule.apiToken.trim()) && (
                      <label className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F2FAF8] border border-[#0E6B63]/20 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={runLiveWhmOnApprove}
                          onChange={(e) => setRunLiveWhmOnApprove(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#0E6B63]"
                        />
                        <span>
                          <strong className="text-[#0F172A] block">
                            Auto-create cPanel account via WHM API
                          </strong>
                          Calls <span className="font-mono">createacct</span> on{' '}
                          {selectedServerModule.hostname}
                        </span>
                      </label>
                    )}

                  {approveError && (
                    <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {approveError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={approvingNow}
                    onClick={handleApproveCreatedOrder}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                  >
                    {approvingNow ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Provisioning cPanel &amp; Activating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>Approve, Provision cPanel &amp; Mark Paid</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <strong className="block">Order Active &amp; Invoice Paid</strong>
                      {createdRecord.whmMessage && (
                        <span className="text-[11px] block mt-0.5">
                          WHM: {createdRecord.whmMessage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {createdRecord.invoice && (
                      <button
                        type="button"
                        onClick={() => {
                          downloadInvoicePdf(
                            createdRecord.invoice!,
                            invoiceTemplateConfig,
                            paymentMethods,
                            {
                              code: currency.code,
                              symbol: currency.symbol,
                              rate,
                              decimals: currency.decimals,
                              spaceAfterSymbol: currency.spaceAfterSymbol,
                              formattedTotal: formatPrice(createdRecord.invoice!.amountUsd),
                            }
                          );
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Download Invoice PDF</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenOrderInQueue(createdRecord.order.id)}
                      className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                    >
                      Inspect Order in Queue
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForNewOrder}
                      className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#0E6B63] hover:bg-[#F2FAF8] cursor-pointer"
                    >
                      + Create Another Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
