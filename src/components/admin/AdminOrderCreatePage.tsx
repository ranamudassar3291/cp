import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  UserCheck,
  UserPlus,
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
import { inspectDomainLive } from '../../utils/domainLookup';
import { SearchableClientSelect } from './SearchableClientSelect';
import { QuickAddClientModal } from './QuickAddClientModal';

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
};

function computePlanCyclePrice(
  plan: ManagedHostingPlanRecord,
  cycle: PlatformOrder['billingCycle']
): number {
  if (cycle === 'Monthly' || cycle === '1 Month') return plan.monthlyPrice;
  if (cycle === '2 Years') {
    return plan.twoYearPrice ?? Number((plan.yearlyPrice * 2 * 0.9).toFixed(2));
  }
  if (cycle === '4 Years') {
    return plan.fourYearPrice ?? Number((plan.yearlyPrice * 4 * 0.8).toFixed(2));
  }
  if (cycle === '5-Year') return Number((plan.yearlyPrice * 5).toFixed(2));
  return plan.yearlyPrice;
}

function generateRandomCpanelUsernameFromDomain(domain: string): string {
  const clean = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/[^a-z0-9]/g, '');
  let base = clean.replace(/^[0-9]+/, '').slice(0, 5);
  if (!base) base = 'cpusr';
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `${base}${suffix}`.slice(0, 8);
}

function generateStrongControlPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  let out =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 10; i += 1) {
    out += all[Math.floor(Math.random() * all.length)];
  }
  return out
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
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
    tldExtensions,
    provisioningModules,
    paymentMethods,
    invoiceTemplateConfig,
    systemSettings,
    addOrder,
    approveOrderWithServer,
    approveSharedHostingOrder,
    approveDomainRegistrationAndSendVerify,
    adminStartDomainTransfer,
  } = usePlatform();
  const { formatPrice, currency, rate, getCurrencyRate } = useCurrency();
  const pkrRate = useMemo(() => {
    const r = getCurrencyRate('PKR');
    return Number.isFinite(r) && r > 0 ? r : 278.5;
  }, [getCurrencyRate]);

  const toPkrString = (usdVal: number) =>
    Math.round(Math.max(0, usdVal) * pkrRate).toString();

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

  // Client & Quick Add Modal
  const [clientEmail, setClientEmail] = useState(firstClient?.email ?? '');
  const [clientName, setClientName] = useState(firstClient?.name ?? '');
  const [clientCountry, setClientCountry] = useState(
    firstClient?.country ?? 'Pakistan'
  );
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);

  // Package & Domain
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    firstPlan?.id ?? 'custom'
  );
  const [productType, setProductType] = useState<PlatformOrder['productType']>(
    firstPlan ? CATEGORY_TO_PRODUCT_TYPE[firstPlan.pageCategory] : 'cPanel Hosting'
  );
  const [planName, setPlanName] = useState(firstPlan?.name ?? 'Custom Hosting Service');
  const [domainOrHost, setDomainOrHost] = useState('');
  const [eppCodeInput, setEppCodeInput] = useState('');
  const [datacenter, setDatacenter] = useState('London, UK');

  // Domain live availability lookup
  const [domainCheckLoading, setDomainCheckLoading] = useState(false);
  const [domainCheckResult, setDomainCheckResult] = useState<{
    domain: string;
    available: boolean;
    registrar?: string;
  } | null>(null);

  // Pricing & Dates (Primary input PKR auto-detected, synced to USD)
  const [billingCycle, setBillingCycle] =
    useState<PlatformOrder['billingCycle']>('Yearly');
  const initialUsd = firstPlan ? firstPlan.yearlyPrice : 0;
  const [amountPkr, setAmountPkr] = useState(() =>
    Math.round(initialUsd * (getCurrencyRate('PKR') || 278.5)).toString()
  );
  const [startDate, setStartDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState(computeDefaultNextDueDate(todayIso, 'Yearly'));
  const [manualDueLocked, setManualDueLocked] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  // Server & Credentials Provisioning
  const [serverModuleId, setServerModuleId] = useState(defaultMod?.id ?? '');
  const [serverPackageName, setServerPackageName] = useState(
    firstPlan?.serverPackageName || defaultMod?.packages?.[0] || ''
  );
  const [cpanelUsername, setCpanelUsername] = useState('');
  const [controlPassword, setControlPassword] = useState(() =>
    generateStrongControlPassword()
  );
  const [showControlPassword, setShowControlPassword] = useState(false);
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

  const parsedPkrNumber = parseFloat(amountPkr);
  const amountUsdComputed =
    Number.isFinite(parsedPkrNumber) && parsedPkrNumber >= 0
      ? Number((parsedPkrNumber / pkrRate).toFixed(2))
      : 0;

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

  const detectDomainPriceUsd = (
    domainStr: string,
    type: PlatformOrder['productType'],
    cycle: PlatformOrder['billingCycle']
  ): number | null => {
    const clean = domainStr.trim().toLowerCase();
    if (!clean.includes('.')) return null;
    const sorted = [...tldExtensions].sort((a, b) => b.tld.length - a.tld.length);
    const matched = sorted.find((t) => clean.endsWith(t.tld.toLowerCase()));
    if (!matched) return null;
    if (type === 'Domain Transfer') return matched.transferUsd;
    if (cycle === '2 Years') return matched.year2Usd;
    if (cycle === '4 Years') return Number((matched.year1Usd + matched.renewalUsd * 3).toFixed(2));
    if (cycle === '5-Year') return Number((matched.year1Usd + matched.renewalUsd * 4).toFixed(2));
    return matched.year1Usd;
  };

  const handlePlanChange = (nextPlanId: string) => {
    setSelectedPlanId(nextPlanId);
    if (nextPlanId === 'custom') return;
    const plan = hostingPlans.find((p) => p.id === nextPlanId);
    if (!plan) return;
    const nextType = CATEGORY_TO_PRODUCT_TYPE[plan.pageCategory];
    setProductType(nextType);
    setPlanName(plan.name);
    setAmountPkr(toPkrString(computePlanCyclePrice(plan, billingCycle)));
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
    if (productType === 'Domain Registration' || productType === 'Domain Transfer') {
      const domUsd = detectDomainPriceUsd(domainOrHost, productType, nextCycle);
      if (domUsd !== null) setAmountPkr(toPkrString(domUsd));
    } else if (selectedPlanObj) {
      setAmountPkr(toPkrString(computePlanCyclePrice(selectedPlanObj, nextCycle)));
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
    setDomainCheckResult(null);
    if (val.includes('.')) {
      if (productType === 'Shared Cloud') {
        setCpanelUsername(
          val.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
        );
      } else if (!cpanelUsername) {
        setCpanelUsername(generateRandomCpanelUsernameFromDomain(val));
      }
      if (productType === 'Domain Registration' || productType === 'Domain Transfer') {
        const domUsd = detectDomainPriceUsd(val, productType, billingCycle);
        if (domUsd !== null) {
          setAmountPkr(toPkrString(domUsd));
        }
      }
    }
  };

  const handleCheckDomainAvailability = async () => {
    const cleanDomain = domainOrHost
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setFormError('Enter a valid domain name (e.g. brand.com) before checking availability.');
      return;
    }
    setFormError('');
    setDomainCheckLoading(true);
    try {
      const res = await inspectDomainLive(cleanDomain, true);
      setDomainCheckResult({
        domain: cleanDomain,
        available: res.available,
        registrar: res.whois?.registrar,
      });
    } catch {
      setDomainCheckResult({ domain: cleanDomain, available: true });
    } finally {
      setDomainCheckLoading(false);
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

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Select a client by name/email or create a new client first.');
      return;
    }
    if (!cleanDomain) {
      setFormError('Enter the domain name or node hostname for this order.');
      return;
    }
    if (!Number.isFinite(parsedPkrNumber) || parsedPkrNumber < 0) {
      setFormError('Enter a valid non-negative PKR order price.');
      return;
    }

    const derivedUser =
      productType === 'Shared Cloud'
        ? cleanDomain
        : cpanelUsername.trim() || generateRandomCpanelUsernameFromDomain(cleanDomain);
    const defaultPassword =
      productType === 'Shared Cloud' ? '' : controlPassword.trim() || generateStrongControlPassword();

    if (productType !== 'Shared Cloud' && !controlPassword.trim()) {
      setControlPassword(defaultPassword);
    }

    const { order, invoice } = addOrder({
      clientEmail: cleanEmail,
      clientName: clientName.trim() || undefined,
      country: clientCountry || 'Pakistan',
      productType,
      planName: planName.trim() || productType,
      domainOrHost: cleanDomain,
      billingCycle,
      amountUsd: amountUsdComputed,
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
      eppCode:
        productType === 'Domain Transfer' ? eppCodeInput.trim() || undefined : undefined,
      transferStatus: productType === 'Domain Transfer' ? 'pending_admin' : undefined,
      notes:
        notes.trim() ||
        `Pending order created (${Math.round(parsedPkrNumber).toLocaleString()} PKR) with unpaid invoice; awaiting admin approval.`,
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

    const targetOrder = createdRecord.order;

    // 1. Shared Cloud -> StackCP Approval
    if (targetOrder.productType === 'Shared Cloud') {
      const cleanPass = controlPassword.trim();
      if (!cleanPass) {
        setApproveError('Enter a StackCP password before approving Shared Cloud hosting.');
        return;
      }
      const res = approveSharedHostingOrder({
        orderId: targetOrder.id,
        password: cleanPass,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        setApproveError(res.error || 'Could not approve Shared Cloud order.');
        return;
      }
      setCreatedRecord({
        order: {
          ...targetOrder,
          status: 'active',
          invoicePaid: invoiceTemplateConfig.autoMarkPaidOnApproval !== false,
          controlPanelUrl: 'https://stackcp.com',
          cpanelUsername: targetOrder.domainOrHost,
          controlPanelPassword: cleanPass,
          nameservers: [
            'ns1.stackdns.com',
            'ns2.stackdns.com',
            'ns3.stackdns.com',
            'ns4.stackdns.com',
          ],
        },
        invoice: res.invoice ?? createdRecord.invoice,
        approved: true,
        whmMessage: 'StackCP credentials issued & 4 StackDNS nameservers attached.',
      });
      onShowToast(`Shared Cloud ${targetOrder.id} approved · StackCP email dispatched`);
      return;
    }

    // 2. Domain Registration
    if (targetOrder.productType === 'Domain Registration') {
      const res = approveDomainRegistrationAndSendVerify(targetOrder.id);
      if (!res.ok) {
        setApproveError(res.error || 'Could not approve domain registration.');
        return;
      }
      setCreatedRecord({
        order: { ...targetOrder, status: 'active', invoicePaid: true },
        invoice: createdRecord.invoice
          ? { ...createdRecord.invoice, status: 'paid' }
          : null,
        approved: true,
        whmMessage: 'Domain registration approved & WHOIS verification emailed.',
      });
      onShowToast(`Domain ${targetOrder.domainOrHost} approved & verification sent`);
      return;
    }

    // 3. Domain Transfer
    if (targetOrder.productType === 'Domain Transfer') {
      const res = adminStartDomainTransfer(targetOrder.id);
      if (!res.ok) {
        setApproveError(res.error || 'Could not initiate domain transfer.');
        return;
      }
      setCreatedRecord({
        order: { ...targetOrder, transferStatus: 'in_progress' },
        invoice: createdRecord.invoice,
        approved: true,
        whmMessage: '7-day registrar transfer started & instruction email dispatched.',
      });
      onShowToast(`Transfer initiated for ${targetOrder.domainOrHost}`);
      return;
    }

    // 4. cPanel Hosting / VPS / Reseller / WordPress / Windows
    const targetModId = serverModuleId || targetOrder.serverModuleId || '';
    const mod = provisioningModules.find((m) => m.id === targetModId) ?? null;

    if (!mod && runLiveWhmOnApprove) {
      setApproveError('Select a WHM server module first.');
      return;
    }

    let whmMessage = '';
    let provisionedUser =
      cpanelUsername.trim() ||
      targetOrder.cpanelUsername ||
      generateRandomCpanelUsernameFromDomain(targetOrder.domainOrHost);
    const provisionedPass =
      controlPassword.trim() || generateStrongControlPassword();
    let provisionedIp = serverIp.trim() || targetOrder.serverIp || '';

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
            domain: targetOrder.domainOrHost,
            acctUsername: provisionedUser,
            cpanelUsername: provisionedUser,
            password: provisionedPass,
            plan: serverPackageName.trim() || mod.packages[0] || 'default',
            contactEmail: targetOrder.clientEmail,
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
      orderId: targetOrder.id,
      serverModuleId: targetModId,
      serverPackageName: serverPackageName.trim() || undefined,
      serverIp: provisionedIp || undefined,
      cpanelUsername: provisionedUser,
      controlPanelPassword: provisionedPass,
      controlPanelUrl: mod?.hostname
        ? `https://${mod.hostname}:${targetOrder.productType === 'Reseller Hosting' ? 2087 : 2083}`
        : `https://${targetOrder.domainOrHost}:2083`,
      nameservers: mod?.nameservers?.filter(Boolean).length ? mod.nameservers : undefined,
      notes: approvalNote,
    });

    if (!approvalRes.ok) {
      setApproveError(approvalRes.error || 'Could not approve order.');
      return;
    }

    const finalizedOrder: PlatformOrder = {
      ...targetOrder,
      status: 'active',
      invoicePaid: invoiceTemplateConfig.autoMarkPaidOnApproval !== false,
      serverModuleId: targetModId || targetOrder.serverModuleId,
      serverPackageName: serverPackageName.trim() || targetOrder.serverPackageName,
      serverIp: provisionedIp || targetOrder.serverIp,
      cpanelUsername: provisionedUser,
      controlPanelPassword: provisionedPass,
      notes: approvalNote || targetOrder.notes,
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
    setEppCodeInput('');
    setDomainCheckResult(null);
    setCpanelUsername('');
    setControlPassword(generateStrongControlPassword());
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
              <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-end gap-2.5">
                <div className="flex-1">
                  <SearchableClientSelect
                    label="Search Client (Name or Email) *"
                    users={users}
                    valueEmail={clientEmail}
                    onChange={(sel) => {
                      setClientEmail(sel.email);
                      setClientName(sel.name);
                      setClientCountry(sel.country || 'Pakistan');
                      setFormError('');
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddClient(true)}
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0E6B63]/40 bg-[#F2FAF8] hover:bg-[#0E6B63] hover:text-white text-[#0E6B63] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>+ Add Client</span>
                </button>
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
                          {p.name} — {Math.round(p.yearlyPrice * pkrRate).toLocaleString()} PKR/yr
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
                  onChange={(e) => {
                    const nextType = e.target.value as PlatformOrder['productType'];
                    setProductType(nextType);
                    if (
                      nextType === 'Domain Registration' ||
                      nextType === 'Domain Transfer'
                    ) {
                      setSelectedPlanId('custom');
                      setPlanName(nextType);
                      const domUsd = detectDomainPriceUsd(
                        domainOrHost,
                        nextType,
                        billingCycle
                      );
                      if (domUsd !== null) setAmountPkr(toPkrString(domUsd));
                    }
                  }}
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
                  Domain / Node Hostname *
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={domainOrHost}
                    onChange={(e) => handleDomainInputChange(e.target.value)}
                    placeholder="example.com or node01.domain.com"
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                  <button
                    type="button"
                    onClick={handleCheckDomainAvailability}
                    disabled={domainCheckLoading}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#0E6B63]/40 bg-[#F2FAF8] hover:bg-[#0E6B63] hover:text-white text-[#0E6B63] text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    {domainCheckLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Check</span>
                  </button>
                </div>
                {domainCheckResult && (
                  <p
                    className={`mt-1.5 text-[11px] font-medium flex items-center gap-1.5 ${
                      domainCheckResult.available ? 'text-[#16A34A]' : 'text-[#D97706]'
                    }`}
                  >
                    {domainCheckResult.available ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          <strong className="font-mono">{domainCheckResult.domain}</strong> is Available for registration.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          <strong className="font-mono">{domainCheckResult.domain}</strong> is Already Registered
                          {domainCheckResult.registrar ? ` (${domainCheckResult.registrar})` : ''} — still permitted to add in admin.
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>

              {productType === 'Domain Transfer' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    EPP / Authorization Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={eppCodeInput}
                    onChange={(e) => setEppCodeInput(e.target.value)}
                    placeholder="Enter registrar EPP transfer key"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Billing Period, Price (PKR Auto-Detected) & Manual Dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  3. Billing Period, Auto-Detected PKR Price &amp; Dates
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
                  Auto Price (PKR) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={amountPkr}
                  onChange={(e) => setAmountPkr(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
                <span className="block mt-1 font-mono text-[10px] text-slate-500">
                  USD Sync: ${amountUsdComputed.toFixed(2)} USD (1 USD = {pkrRate.toFixed(1)} PKR)
                </span>
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
                  Panel Username (Auto-Random if blank)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={cpanelUsername}
                    onChange={(e) => setCpanelUsername(e.target.value)}
                    placeholder="Auto from domain"
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCpanelUsername(
                        generateRandomCpanelUsernameFromDomain(domainOrHost || 'cpuser')
                      )
                    }
                    title="Regenerate random username"
                    className="px-2.5 py-2 border border-[#CBD5E1] rounded-lg text-slate-500 hover:text-[#0E6B63] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Panel Password (StackCP / cPanel)
                </label>
                <div className="relative">
                  <input
                    type={showControlPassword ? 'text' : 'password'}
                    value={controlPassword}
                    onChange={(e) => setControlPassword(e.target.value)}
                    placeholder="Strong password"
                    className="w-full pl-3 pr-16 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowControlPassword((v) => !v)}
                      aria-label={showControlPassword ? 'Hide password' : 'Show password'}
                      className="p-1 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                    >
                      {showControlPassword ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setControlPassword(generateStrongControlPassword())}
                      title="Generate random strong password"
                      className="p-1 text-slate-400 hover:text-[#0E6B63] cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
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
                  <div className="text-right">
                    <span className="font-mono tabular-nums text-lg font-extrabold text-[#0F172A] block">
                      PKR {Math.round(parsedPkrNumber || 0).toLocaleString()}
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      ${amountUsdComputed.toFixed(2)} USD
                    </span>
                  </div>
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
                  {createdRecord.order.productType === 'Shared Cloud' ? (
                    <div className="p-3.5 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/25 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                          <span>StackCP Shared Approval</span>
                        </span>
                        <a
                          href="https://stackcp.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#0E6B63] hover:underline"
                        >
                          <span>stackcp.com</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">StackCP Username</span>
                        <span className="font-mono font-bold text-[#0F172A]">
                          {createdRecord.order.domainOrHost}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                          Set StackCP Password *
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type={showControlPassword ? 'text' : 'password'}
                            value={controlPassword}
                            onChange={(e) => setControlPassword(e.target.value)}
                            placeholder="Enter StackCP password"
                            className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setShowControlPassword((v) => !v)}
                            className="px-2 py-1.5 border border-[#CBD5E1] bg-white rounded-lg text-slate-500 cursor-pointer"
                          >
                            {showControlPassword ? (
                              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500">
                        NS: ns1.stackdns.com, ns2.stackdns.com, ns3.stackdns.com, ns4.stackdns.com
                      </p>
                    </div>
                  ) : createdRecord.order.productType !== 'Domain Registration' &&
                    createdRecord.order.productType !== 'Domain Transfer' ? (
                    <>
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
                              User <span className="font-mono">{cpanelUsername || createdRecord.order.cpanelUsername}</span> on{' '}
                              {selectedServerModule.hostname}
                            </span>
                          </label>
                        )}
                    </>
                  ) : null}

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
                        <span>Provisioning &amp; Dispatching Mail...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {createdRecord.order.productType === 'Shared Cloud'
                            ? 'Approve StackCP, Send Credentials & Mark Paid'
                            : createdRecord.order.productType === 'Domain Registration'
                            ? 'Approve Domain, Verify & Mark Paid'
                            : createdRecord.order.productType === 'Domain Transfer'
                            ? 'Approve & Start 7-Day Transfer'
                            : 'Approve, Provision cPanel & Mark Paid'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <strong className="block">Order Processed &amp; Confirmation Emailed</strong>
                      {createdRecord.whmMessage && (
                        <span className="text-[11px] block mt-0.5">
                          {createdRecord.whmMessage}
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

      <QuickAddClientModal
        open={showQuickAddClient}
        onClose={() => setShowQuickAddClient(false)}
        onCreated={(user) => {
          setClientEmail(user.email);
          setClientName(user.name);
          setClientCountry(user.country || 'Pakistan');
          onShowToast(`Client ${user.name} created and selected`);
        }}
      />
    </div>
  );
};
