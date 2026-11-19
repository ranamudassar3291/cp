import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  KeyRound,
  Loader2,
  MailCheck,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  computeDefaultNextDueDate,
  OrderStatus,
  PlatformInvoice,
  PlatformOrder,
  TldExtensionRecord,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { evaluateDomainLifecycle } from '../../utils/domainLifecycle';
import { inspectDomainLive } from '../../utils/domainLookup';
import { SearchableClientSelect } from './SearchableClientSelect';
import { QuickAddClientModal } from './QuickAddClientModal';

interface AdminDomainsViewProps {
  onShowToast: (msg: string) => void;
}

const DOMAIN_STATUS_OPTIONS: OrderStatus[] = [
  'active',
  'pending',
  'suspended',
  'expired',
  'transferred',
  'cancelled',
  'refunded',
];

function domainStatusStyle(status: OrderStatus): string {
  switch (status) {
    case 'active':
      return 'text-[#16A34A] bg-[#16A34A]/10';
    case 'pending':
      return 'text-[#D97706] bg-[#D97706]/10';
    case 'suspended':
    case 'expired':
      return 'text-[#DC2626] bg-[#DC2626]/10';
    case 'transferred':
      return 'text-[#0E6B63] bg-[#0E6B63]/10';
    default:
      return 'text-slate-600 bg-slate-100';
  }
}

function getDefaultDueDate(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export const AdminDomainsView: React.FC<AdminDomainsViewProps> = ({
  onShowToast,
}) => {
  const {
    orders,
    users,
    tldExtensions,
    provisioningModules,
    addOrder,
    adminUpdateOrderDetails,
    approveDomainRegistrationAndSendVerify,
    resendDomainVerificationEmail,
    adminApplyNameserverChange,
    adminStartDomainTransfer,
    adminCompleteDomainTransfer,
    saveTldExtension,
    createTldExtension,
    deleteTldExtension,
  } = usePlatform();
  const { formatPrice, getCurrencyRate } = useCurrency();
  const pkrRate = useMemo(() => {
    const r = getCurrencyRate('PKR');
    return Number.isFinite(r) && r > 0 ? r : 278.5;
  }, [getCurrencyRate]);

  const toPkrString = (usdVal: number) =>
    Math.round(Math.max(0, usdVal) * pkrRate).toString();

  const [subTab, setSubTab] = useState<'domains' | 'nameservers' | 'transfers' | 'tlds'>(
    'domains'
  );

  // Registered / Ordered Domains State
  const [domainSearch, setDomainSearch] = useState('');
  const [domainStatusFilter, setDomainStatusFilter] = useState<'all' | OrderStatus>('all');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const firstClientUser = users.find((u) => u.role !== 'admin');
  const [newDomainClientEmail, setNewDomainClientEmail] = useState(
    firstClientUser?.email ?? ''
  );
  const [newDomainClientName, setNewDomainClientName] = useState(
    firstClientUser?.name ?? ''
  );
  const [newDomainClientCountry, setNewDomainClientCountry] = useState(
    firstClientUser?.country ?? 'Pakistan'
  );
  const [newDomainHost, setNewDomainHost] = useState('');
  const [newDomainType, setNewDomainType] = useState<
    'Domain Registration' | 'Domain Transfer'
  >('Domain Registration');
  const [newDomainYears, setNewDomainYears] = useState<1 | 2 | 5>(1);
  const [newDomainPricePkr, setNewDomainPricePkr] = useState(() =>
    Math.round(9.99 * (getCurrencyRate('PKR') || 278.5)).toString()
  );
  const [newDomainEppCode, setNewDomainEppCode] = useState('');
  const [newDomainNameserversText, setNewDomainNameserversText] = useState(
    'ns1.cpcloudhost.com, ns2.cpcloudhost.com'
  );
  const [domainCheckLoading, setDomainCheckLoading] = useState(false);
  const [domainCheckResult, setDomainCheckResult] = useState<{
    domain: string;
    available: boolean;
    registrar?: string;
  } | null>(null);
  const [newDomainStartDate, setNewDomainStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newDomainDueDate, setNewDomainDueDate] = useState(getDefaultDueDate(1));
  const [newDomainServerId, setNewDomainServerId] = useState(
    provisioningModules[0]?.id ?? ''
  );
  const [newDomainNotes, setNewDomainNotes] = useState('');
  const [createdDomainRecord, setCreatedDomainRecord] = useState<{
    order: PlatformOrder;
    invoice: PlatformInvoice | null;
    approved: boolean;
  } | null>(null);
  const [addDomainError, setAddDomainError] = useState('');

  // Inline domain editor state
  const [editingDomainOrder, setEditingDomainOrder] = useState<PlatformOrder | null>(
    null
  );
  const [editOrdStatus, setEditOrdStatus] = useState<OrderStatus>('active');
  const [editOrdCreatedAt, setEditOrdCreatedAt] = useState('');
  const [editOrdDueDate, setEditOrdDueDate] = useState('');
  const [editOrdAmount, setEditOrdAmount] = useState('');
  const [editOrdNsText, setEditOrdNsText] = useState(
    'ns1.cpcloudhost.com, ns2.cpcloudhost.com'
  );

  // TLD Extensions State
  const [tldSearch, setTldSearch] = useState('');
  const [showAddTld, setShowAddTld] = useState(false);
  const [editingTld, setEditingTld] = useState<TldExtensionRecord | null>(null);

  // Add/Edit TLD form fields
  const [tldCode, setTldCode] = useState('');
  const [tldDesc, setTldDesc] = useState('');
  const [tldMinYears, setTldMinYears] = useState<1 | 2>(1);
  const [tldYear1, setTldYear1] = useState('12.99');
  const [tldYear2, setTldYear2] = useState('25.98');
  const [tldRenewal, setTldRenewal] = useState('16.99');
  const [tldTransfer, setTldTransfer] = useState('12.99');
  const [tldPopular, setTldPopular] = useState(false);
  const [tldEnabled, setTldEnabled] = useState(true);
  const [tldRegistrarId, setTldRegistrarId] = useState('');
  const [tldFormError, setTldFormError] = useState('');

  const parsedNewDomainPkr = parseFloat(newDomainPricePkr);
  const newDomainUsdComputed =
    Number.isFinite(parsedNewDomainPkr) && parsedNewDomainPkr >= 0
      ? Number((parsedNewDomainPkr / pkrRate).toFixed(2))
      : 0;

  const domainOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.productType === 'Domain Registration' ||
          o.productType === 'Domain Transfer'
      ),
    [orders]
  );

  const filteredDomainOrders = useMemo(() => {
    const q = domainSearch.trim().toLowerCase();
    return domainOrders.filter((ord) => {
      if (domainStatusFilter !== 'all' && ord.status !== domainStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ord.domainOrHost.toLowerCase().includes(q) ||
        ord.clientEmail.toLowerCase().includes(q) ||
        ord.clientName.toLowerCase().includes(q) ||
        ord.id.toLowerCase().includes(q)
      );
    });
  }, [domainOrders, domainSearch, domainStatusFilter]);

  const transferOrders = useMemo(
    () => domainOrders.filter((o) => o.productType === 'Domain Transfer'),
    [domainOrders]
  );

  const filteredTlds = useMemo(() => {
    const q = tldSearch.trim().toLowerCase();
    return tldExtensions.filter((t) => {
      if (!q) return true;
      return (
        t.tld.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [tldExtensions, tldSearch]);

  const pendingNameserverOrders = useMemo(
    () =>
      domainOrders.filter(
        (o) =>
          o.nameserverUpdateStatus === 'pending_update' &&
          Array.isArray(o.pendingNameservers) &&
          o.pendingNameservers.length >= 2
      ),
    [domainOrders]
  );

  const domainMetrics = useMemo(() => {
    return {
      total: domainOrders.length,
      active: domainOrders.filter((d) => d.status === 'active').length,
      pending: domainOrders.filter((d) => d.status === 'pending').length,
      nsRequests: pendingNameserverOrders.length,
      transfers: transferOrders.length,
      enabledTlds: tldExtensions.filter((t) => t.enabled).length,
    };
  }, [domainOrders, pendingNameserverOrders.length, transferOrders.length, tldExtensions]);

  const detectTldForDomain = (domainInput: string): TldExtensionRecord | undefined => {
    const clean = domainInput.trim().toLowerCase();
    if (!clean.includes('.')) return undefined;
    const sorted = [...tldExtensions].sort((a, b) => b.tld.length - a.tld.length);
    return sorted.find((t) => clean.endsWith(t.tld.toLowerCase()));
  };

  const getCycleForYears = (yrs: 1 | 2 | 5): PlatformOrder['billingCycle'] => {
    if (yrs === 2) return '2 Years';
    if (yrs === 5) return '5-Year';
    return '1 Year';
  };

  const handleDomainHostChange = (val: string) => {
    setNewDomainHost(val);
    setDomainCheckResult(null);
    const matched = detectTldForDomain(val);
    if (matched) {
      const yrs: 1 | 2 | 5 = matched.minYears === 2 ? 2 : 1;
      setNewDomainYears(yrs);
      setNewDomainDueDate(
        computeDefaultNextDueDate(newDomainStartDate, getCycleForYears(yrs))
      );
      if (matched.registrarModuleId) {
        setNewDomainServerId(matched.registrarModuleId);
      }
      if (newDomainType === 'Domain Transfer') {
        setNewDomainPricePkr(toPkrString(matched.transferUsd));
      } else {
        setNewDomainPricePkr(
          toPkrString(yrs === 2 ? matched.year2Usd : matched.year1Usd)
        );
      }
    }
  };

  const handleYearsChange = (yrs: 1 | 2 | 5) => {
    setNewDomainYears(yrs);
    setNewDomainDueDate(
      computeDefaultNextDueDate(newDomainStartDate, getCycleForYears(yrs))
    );
    const matched = detectTldForDomain(newDomainHost);
    if (matched) {
      if (newDomainType === 'Domain Transfer') {
        setNewDomainPricePkr(toPkrString(matched.transferUsd));
      } else if (yrs === 5) {
        setNewDomainPricePkr(
          toPkrString(matched.year1Usd + matched.renewalUsd * 4)
        );
      } else {
        setNewDomainPricePkr(
          toPkrString(yrs === 2 ? matched.year2Usd : matched.year1Usd)
        );
      }
    }
  };

  const handleCheckDomainAvailability = async () => {
    const cleanDomain = newDomainHost
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setAddDomainError('Enter a domain name with extension first (e.g. brand.com).');
      return;
    }
    setAddDomainError('');
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

  const handleAddDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newDomainClientEmail.trim().toLowerCase();
    const cleanDomain = newDomainHost
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAddDomainError('Select a client by name/email or add a new client first.');
      return;
    }
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setAddDomainError('Paste or enter a valid domain name (e.g. brandname.com or company.pk).');
      return;
    }
    if (!Number.isFinite(parsedNewDomainPkr) || parsedNewDomainPkr < 0) {
      setAddDomainError('Enter a valid non-negative PKR price.');
      return;
    }

    const matchedTld = detectTldForDomain(cleanDomain);
    if (
      matchedTld?.minYears === 2 &&
      newDomainYears < 2 &&
      newDomainType === 'Domain Registration'
    ) {
      setAddDomainError(`${matchedTld.tld} requires a minimum 2-year registration term.`);
      return;
    }

    const parsedNs = newDomainNameserversText
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 4);

    const cycle = getCycleForYears(newDomainYears);
    const clientUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const { order, invoice } = addOrder({
      clientEmail: cleanEmail,
      clientName: newDomainClientName.trim() || clientUser?.name,
      country: newDomainClientCountry || clientUser?.country || 'Pakistan',
      productType: newDomainType,
      planName: `${newDomainType} (${newDomainYears}-Yr${matchedTld ? ` ${matchedTld.tld}` : ''})`,
      domainOrHost: cleanDomain,
      billingCycle: cycle,
      amountUsd: newDomainUsdComputed,
      status: 'pending',
      createdAt: newDomainStartDate || undefined,
      nextDueDate:
        newDomainDueDate || computeDefaultNextDueDate(newDomainStartDate, cycle),
      serverModuleId: newDomainServerId || undefined,
      paymentMethod: 'Invoice Pending',
      invoicePaid: false,
      nameservers:
        parsedNs.length >= 2 ? parsedNs : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'],
      eppCode:
        newDomainType === 'Domain Transfer'
          ? newDomainEppCode.trim() || undefined
          : undefined,
      transferStatus:
        newDomainType === 'Domain Transfer' ? 'pending_admin' : undefined,
      notes:
        newDomainNotes.trim() ||
        `Pending ${newDomainType} (${Math.round(parsedNewDomainPkr).toLocaleString()} PKR) added with unpaid invoice; awaiting admin approval.`,
      generateInvoice: true,
    });

    setAddDomainError('');
    setCreatedDomainRecord({
      order,
      invoice,
      approved: false,
    });
    onShowToast(
      `Pending domain ${order.domainOrHost} & unpaid invoice ${invoice?.id || ''} added`
    );
  };

  const openEditDomainModal = (ord: PlatformOrder) => {
    setEditingDomainOrder(ord);
    setEditOrdStatus(ord.status);
    setEditOrdCreatedAt(ord.createdAt.slice(0, 10));
    setEditOrdDueDate((ord.nextDueDate || getDefaultDueDate(1)).slice(0, 10));
    setEditOrdAmount(ord.amountUsd.toFixed(2));
    setEditOrdNsText(
      (ord.nameservers && ord.nameservers.length > 0
        ? ord.nameservers
        : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
      ).join(', ')
    );
  };

  const handleSaveDomainEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomainOrder) return;
    const amt = parseFloat(editOrdAmount);
    const nsList = editOrdNsText
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 4);
    adminUpdateOrderDetails(editingDomainOrder.id, {
      status: editOrdStatus,
      createdAt: editOrdCreatedAt || editingDomainOrder.createdAt,
      nextDueDate: editOrdDueDate || editingDomainOrder.nextDueDate,
      amountUsd: Number.isFinite(amt) && amt >= 0 ? amt : editingDomainOrder.amountUsd,
      nameservers:
        nsList.length >= 2 ? nsList : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'],
    });
    onShowToast(`Updated domain ${editingDomainOrder.domainOrHost}`);
    setEditingDomainOrder(null);
  };

  const openTldEditor = (rec?: TldExtensionRecord) => {
    setTldFormError('');
    if (rec) {
      setEditingTld(rec);
      setShowAddTld(false);
      setTldCode(rec.tld);
      setTldDesc(rec.description);
      setTldMinYears(rec.minYears);
      setTldYear1(rec.year1Usd.toFixed(2));
      setTldYear2(rec.year2Usd.toFixed(2));
      setTldRenewal(rec.renewalUsd.toFixed(2));
      setTldTransfer(rec.transferUsd.toFixed(2));
      setTldPopular(rec.popular);
      setTldEnabled(rec.enabled);
      setTldRegistrarId(rec.registrarModuleId || '');
    } else {
      setEditingTld(null);
      setShowAddTld(true);
      setTldCode('.tech');
      setTldDesc('Modern technology domain with free WHOIS privacy & Anycast DNS.');
      setTldMinYears(1);
      setTldYear1('14.99');
      setTldYear2('29.98');
      setTldRenewal('19.99');
      setTldTransfer('14.99');
      setTldPopular(false);
      setTldEnabled(true);
      setTldRegistrarId('');
    }
  };

  const handleSaveTldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y1 = parseFloat(tldYear1);
    const y2 = parseFloat(tldYear2);
    const ren = parseFloat(tldRenewal);
    const trn = parseFloat(tldTransfer);

    if ([y1, y2, ren, trn].some((n) => !Number.isFinite(n) || n < 0)) {
      setTldFormError('All pricing fields must be valid non-negative numbers.');
      return;
    }

    if (editingTld) {
      const res = saveTldExtension(editingTld.id, {
        tld: tldCode.trim(),
        description: tldDesc.trim(),
        minYears: tldMinYears,
        year1Usd: y1,
        year2Usd: y2,
        renewalUsd: ren,
        transferUsd: trn,
        popular: tldPopular,
        enabled: tldEnabled,
        registrarModuleId: tldRegistrarId || undefined,
      });
      if (!res.ok) {
        setTldFormError(res.error || 'Failed to update TLD.');
        return;
      }
      onShowToast(`Saved ${tldCode} pricing & storefront sync`);
      setEditingTld(null);
      return;
    }

    const res = createTldExtension({
      tld: tldCode.trim(),
      description: tldDesc.trim(),
      minYears: tldMinYears,
      year1Usd: y1,
      year2Usd: y2,
      renewalUsd: ren,
      transferUsd: trn,
      popular: tldPopular,
      enabled: tldEnabled,
      registrarModuleId: tldRegistrarId || undefined,
    });
    if (!res.ok || !res.record) {
      setTldFormError(res.error || 'Unable to add TLD extension.');
      return;
    }
    onShowToast(`Added TLD extension ${res.record.tld}`);
    setShowAddTld(false);
  };

  return (
    <div className="space-y-5">
      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Total Domains</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0F172A] mt-1">
            {domainMetrics.total}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Active</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#16A34A] mt-1">
            {domainMetrics.active}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Pending Review</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#D97706] mt-1">
            {domainMetrics.pending}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">NS Requests</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0E6B63] mt-1">
            {domainMetrics.nsRequests}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Domain Transfers</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0F172A] mt-1">
            {domainMetrics.transfers}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Live TLD Extensions</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0E6B63] mt-1">
            {domainMetrics.enabledTlds} / {tldExtensions.length}
          </p>
        </div>
      </div>

      {/* Always-Visible Sub-Tabs + Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-px">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setSubTab('domains');
              setShowAddDomain(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'domains'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>All Domains ({domainOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('nameservers');
              setShowAddDomain(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'nameservers'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Nameserver Notify ({pendingNameserverOrders.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('transfers');
              setShowAddDomain(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'transfers'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Domain Transfers ({transferOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('tlds');
              setShowAddDomain(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'tlds'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>TLD Pricing ({tldExtensions.length})</span>
          </button>
        </div>

        <div className="pb-2">
          {subTab === 'tlds' ? (
            <button
              type="button"
              onClick={() => (showAddTld ? setShowAddTld(false) : openTldEditor())}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddTld ? 'Close Add TLD' : 'Add TLD'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSubTab('domains');
                setShowAddDomain((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddDomain ? 'Close Add Domain' : 'Add Domain'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== TAB 1: REGISTERED & ORDERED DOMAINS ==================== */}
      {subTab === 'domains' && (
        <div className="space-y-4">
          {showAddDomain ? (
            <div className="space-y-5">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDomain(false);
                      setCreatedDomainRecord(null);
                    }}
                    className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Back to Domains</span>
                  </button>
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0F172A]">
                      Add &amp; Provision Client Domain
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select or add client, check domain availability (even if already registered), auto-detect PKR pricing, and create a pending order + unpaid invoice.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handleAddDomainSubmit}
                  className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-end gap-2.5">
                      <div className="flex-1">
                        <SearchableClientSelect
                          label="Search Client (Name or Email) *"
                          users={users}
                          valueEmail={newDomainClientEmail}
                          onChange={(sel) => {
                            setNewDomainClientEmail(sel.email);
                            setNewDomainClientName(sel.name);
                            setNewDomainClientCountry(sel.country || 'Pakistan');
                            setAddDomainError('');
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

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Domain Name *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDomainHost}
                          onChange={(e) => handleDomainHostChange(e.target.value)}
                          placeholder="e.g. acme.com or brand.pk"
                          className="flex-1 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                        <button
                          type="button"
                          onClick={handleCheckDomainAvailability}
                          disabled={domainCheckLoading}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0E6B63]/40 bg-[#F2FAF8] hover:bg-[#0E6B63] hover:text-white text-[#0E6B63] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60"
                        >
                          {domainCheckLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Search className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>Check Availability</span>
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
                                {domainCheckResult.registrar ? ` (${domainCheckResult.registrar})` : ''} — still permitted to add in admin panel.
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Domain Action / Package
                      </label>
                      <select
                        value={newDomainType}
                        onChange={(e) => {
                          const nextType = e.target.value as
                            | 'Domain Registration'
                            | 'Domain Transfer';
                          setNewDomainType(nextType);
                          const matched = detectTldForDomain(newDomainHost);
                          if (matched) {
                            if (nextType === 'Domain Transfer') {
                              setNewDomainPricePkr(toPkrString(matched.transferUsd));
                            } else {
                              setNewDomainPricePkr(
                                toPkrString(
                                  newDomainYears === 2 ? matched.year2Usd : matched.year1Usd
                                )
                              );
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                      >
                        <option value="Domain Registration">Domain Registration</option>
                        <option value="Domain Transfer">Domain Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Billing Period
                      </label>
                      <select
                        value={newDomainYears}
                        onChange={(e) =>
                          handleYearsChange(Number(e.target.value) as 1 | 2 | 5)
                        }
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                      >
                        <option value={1}>1 Year</option>
                        <option value={2}>2 Years (Required for .pk / .ai)</option>
                        <option value={5}>5 Years</option>
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
                        value={newDomainPricePkr}
                        onChange={(e) => setNewDomainPricePkr(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-semibold border border-[#CBD5E1] rounded-lg"
                      />
                      <span className="block mt-1 font-mono text-[10px] text-slate-500">
                        USD Sync: ${newDomainUsdComputed.toFixed(2)} USD (1 USD = {pkrRate.toFixed(1)} PKR)
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Server / Registrar Module
                      </label>
                      <select
                        value={newDomainServerId}
                        onChange={(e) => setNewDomainServerId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                      >
                        <option value="">Default Anycast DNS</option>
                        {provisioningModules.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.name} ({mod.moduleType.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nameservers (Comma-separated, 2 or 4 NS)
                      </label>
                      <input
                        type="text"
                        value={newDomainNameserversText}
                        onChange={(e) => setNewDomainNameserversText(e.target.value)}
                        placeholder="ns1.cpcloudhost.com, ns2.cpcloudhost.com"
                        className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                      />
                    </div>

                    {newDomainType === 'Domain Transfer' && (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          EPP / Authorization Code (Transfer Key)
                        </label>
                        <input
                          type="text"
                          value={newDomainEppCode}
                          onChange={(e) => setNewDomainEppCode(e.target.value)}
                          placeholder="Paste EPP code provided by current registrar"
                          className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Registration Date (Manual)
                      </label>
                      <input
                        type="date"
                        value={newDomainStartDate}
                        onChange={(e) => {
                          const nextStart = e.target.value;
                          setNewDomainStartDate(nextStart);
                          if (nextStart) {
                            setNewDomainDueDate(
                              computeDefaultNextDueDate(
                                nextStart,
                                getCycleForYears(newDomainYears)
                              )
                            );
                          }
                        }}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Next Due / Expiry Date (Manual)
                      </label>
                      <input
                        type="date"
                        value={newDomainDueDate}
                        onChange={(e) => setNewDomainDueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Domain Order Details / Notes
                      </label>
                      <textarea
                        rows={2}
                        value={newDomainNotes}
                        onChange={(e) => setNewDomainNotes(e.target.value)}
                        placeholder="Optional EPP auth note or custom DNS guidance..."
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                      />
                    </div>
                  </div>

                  {addDomainError && (
                    <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {addDomainError}
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Creates a <strong>Pending</strong> domain order &amp; <strong>Unpaid</strong> invoice on the client account.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Add Domain &amp; Generate Invoice
                    </button>
                  </div>
                </form>

                {/* Post-Add Instant Approve Panel */}
                <div className="xl:col-span-4">
                  {!createdDomainRecord ? (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 text-xs">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0E6B63]">
                        Domain Provisioning Preview
                      </p>
                      <h3 className="font-display text-base font-bold text-[#0F172A]">
                        {newDomainHost.trim() || 'your-domain.com'}
                      </h3>
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Client</span>
                          <span className="font-semibold text-[#0F172A] truncate">
                            {newDomainClientEmail || 'Not selected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Term</span>
                          <span className="font-medium text-[#0F172A]">{newDomainYears} Year(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Due Date</span>
                          <span className="font-mono font-semibold text-[#0F172A]">{newDomainDueDate}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 items-baseline">
                          <span className="text-slate-600 font-semibold">Invoice Amount</span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-[#0F172A] block">
                              PKR {Math.round(parsedNewDomainPkr || 0).toLocaleString()}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              ${newDomainUsdComputed.toFixed(2)} USD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-[#0E6B63] rounded-xl p-5 space-y-4 text-xs">
                      <div>
                        <span
                          className={`inline-block font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            createdDomainRecord.approved
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : 'bg-amber-50 text-[#D97706]'
                          }`}
                        >
                          {createdDomainRecord.approved ? 'PROCESSED' : 'PENDING · UNPAID'}
                        </span>
                        <h3 className="font-display text-base font-bold text-[#0F172A] mt-1">
                          {createdDomainRecord.order.domainOrHost}
                        </h3>
                        <p className="font-mono text-[11px] text-[#0E6B63]">
                          {createdDomainRecord.order.id}
                          {createdDomainRecord.invoice ? ` · ${createdDomainRecord.invoice.id}` : ''}
                        </p>
                      </div>

                      {!createdDomainRecord.approved ? (
                        <button
                          type="button"
                          onClick={() => {
                            const res =
                              createdDomainRecord.order.productType === 'Domain Transfer'
                                ? adminStartDomainTransfer(createdDomainRecord.order.id)
                                : approveDomainRegistrationAndSendVerify(
                                    createdDomainRecord.order.id
                                  );
                            if (!res.ok) {
                              onShowToast(res.error || 'Could not approve domain');
                              return;
                            }
                            setCreatedDomainRecord((prev) =>
                              prev ? { ...prev, approved: true } : prev
                            );
                            onShowToast(
                              createdDomainRecord.order.productType === 'Domain Transfer'
                                ? `Started 7-day transfer for ${createdDomainRecord.order.domainOrHost}`
                                : `Approved ${createdDomainRecord.order.domainOrHost} · Invoice marked PAID & verify email sent`
                            );
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          <span>
                            {createdDomainRecord.order.productType === 'Domain Transfer'
                              ? 'Approve & Start 7-Day Transfer'
                              : 'Approve Domain, Mark Paid & Verify'}
                          </span>
                        </button>
                      ) : (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" aria-hidden="true" />
                          <span>
                            {createdDomainRecord.order.productType === 'Domain Transfer'
                              ? '7-Day Transfer Initiated & Emailed'
                              : 'Domain Active, Invoice Paid & Verify Sent'}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNewDomainHost('');
                            setNewDomainEppCode('');
                            setDomainCheckResult(null);
                            setNewDomainNotes('');
                            setCreatedDomainRecord(null);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] font-semibold text-[#0F172A] cursor-pointer"
                        >
                          + Add Another Domain
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddDomain(false);
                            setCreatedDomainRecord(null);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#0E6B63] hover:bg-[#F2FAF8] cursor-pointer"
                        >
                          Return to Domains List
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>

          {/* Pending Nameserver Update Requests Queue */}
          {pendingNameserverOrders.length > 0 && (
            <div className="bg-white border border-amber-300 rounded-xl p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-sm font-bold text-[#0F172A]">
                      Client Nameserver Update Queue ({pendingNameserverOrders.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Clients see a 1–3 hour propagation notice. Click Update &amp; Notify Client to push live DNS delegation and send confirmation email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {pendingNameserverOrders.map((ord) => (
                  <div
                    key={`nsq-${ord.id}`}
                    className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[#0F172A]">
                          {ord.domainOrHost}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {ord.id}
                        </span>
                        <span className="text-slate-600">
                          · {ord.clientName} ({ord.clientEmail})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
                        <span className="text-slate-500">
                          Current: {(ord.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']).join(', ')}
                        </span>
                        <span className="font-semibold text-[#0E6B63]">
                          Requested: {ord.pendingNameservers?.[0]}, {ord.pendingNameservers?.[1]}
                        </span>
                        {ord.nameserverRequestedAt && (
                          <span className="text-slate-400">
                            Submitted: {ord.nameserverRequestedAt}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminApplyNameserverChange(ord.id);
                        if (!res.ok) {
                          onShowToast(res.error || 'Failed to apply nameserver change');
                          return;
                        }
                        onShowToast(
                          `Updated nameservers for ${ord.domainOrHost} & emailed confirmation to ${ord.clientEmail}`
                        );
                      }}
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Update &amp; Notify Client</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                placeholder="Search domain name, client email, or order ID..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', ...DOMAIN_STATUS_OPTIONS] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDomainStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    domainStatusFilter === st
                      ? 'bg-white text-[#0F172A] shadow-sm'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Registered / Ordered Domains Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Domain &amp; Order ID</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reg Date / Due Date</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {filteredDomainOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        No domains match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDomainOrders.map((ord) => {
                      const verifyLink =
                        typeof window !== 'undefined' && ord.domainVerificationToken
                          ? `${window.location.origin}/verify-domain?orderId=${encodeURIComponent(ord.id)}&token=${encodeURIComponent(ord.domainVerificationToken)}`
                          : '';
                      const isPendingRegApproval = ord.status === 'pending';
                      const isPendingClientVerify =
                        ord.domainVerificationStatus === 'pending_contact_verification';

                      return (
                        <tr key={ord.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#0F172A] block">
                              {ord.domainOrHost}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 block">
                              {ord.id}
                            </span>
                            {isPendingRegApproval ? (
                              <span className="text-[11px] font-semibold text-[#D97706] block mt-0.5">
                                Pending Admin Review
                              </span>
                            ) : isPendingClientVerify ? (
                              <span className="text-[11px] font-semibold text-[#0E6B63] inline-flex items-center gap-1.5 mt-0.5">
                                <span>WHOIS Verify Sent</span>
                                {verifyLink && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(verifyLink).catch(() => {});
                                      onShowToast(`Copied verification link for ${ord.domainOrHost}`);
                                    }}
                                    className="inline-flex items-center gap-0.5 text-slate-500 hover:text-[#0E6B63] underline cursor-pointer"
                                    title="Copy client WHOIS verification link"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Link</span>
                                  </button>
                                )}
                              </span>
                            ) : ord.domainVerificationStatus === 'verified' ? (
                              <span className="text-[11px] font-semibold text-[#16A34A] inline-flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                <span>WHOIS Verified</span>
                              </span>
                            ) : null}
                            {ord.nameserverUpdateStatus === 'pending_update' &&
                              ord.pendingNameservers && (
                                <span className="block font-mono text-[11px] text-[#D97706] mt-0.5">
                                  NS Request: {ord.pendingNameservers.join(', ')}
                                </span>
                              )}
                            {Array.isArray(ord.nameservers) && ord.nameservers.length > 0 && (
                              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                                NS: {ord.nameservers.join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#0F172A] block">
                              {ord.clientName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {ord.clientEmail}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            <span className="block font-medium">{ord.productType}</span>
                            <span className="text-[11px] text-slate-500">{ord.planName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            <div>Reg: {ord.createdAt.slice(0, 10)}</div>
                            <div className="text-[#0E6B63] font-semibold">
                              Due: {(ord.nextDueDate || '—').slice(0, 10)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A] whitespace-nowrap">
                            {formatPrice(ord.amountUsd)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <select
                              aria-label={`Change status for ${ord.domainOrHost}`}
                              value={ord.status}
                              onChange={(e) => {
                                const nextSt = e.target.value as OrderStatus;
                                if (
                                  nextSt === 'active' &&
                                  ord.status === 'pending'
                                ) {
                                  const res =
                                    ord.productType === 'Domain Transfer'
                                      ? adminCompleteDomainTransfer(ord.id)
                                      : approveDomainRegistrationAndSendVerify(ord.id);
                                  if (res.ok) {
                                    onShowToast(
                                      `Approved ${ord.domainOrHost} · Invoice marked PAID & email sent`
                                    );
                                    return;
                                  }
                                }
                                adminUpdateOrderDetails(ord.id, { status: nextSt });
                                onShowToast(
                                  `${ord.domainOrHost} status updated to ${nextSt.toUpperCase()}`
                                );
                              }}
                              className={`px-2 py-1 rounded text-[11px] font-semibold border border-transparent focus:border-[#0E6B63] cursor-pointer ${domainStatusStyle(
                                ord.status
                              )}`}
                            >
                              {DOMAIN_STATUS_OPTIONS.map((st) => (
                                <option
                                  key={st}
                                  value={st}
                                  className="bg-white text-[#0F172A]"
                                >
                                  {st.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {ord.productType === 'Domain Transfer' &&
                              ord.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => setSubTab('transfers')}
                                  className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/40 bg-[#F2FAF8] hover:bg-[#0E6B63] hover:text-white rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  Manage Transfer
                                </button>
                              ) : (
                                (isPendingRegApproval || isPendingClientVerify) && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (isPendingRegApproval) {
                                        const res = approveDomainRegistrationAndSendVerify(ord.id);
                                        if (!res.ok) {
                                          onShowToast(res.error || 'Could not dispatch verification');
                                          return;
                                        }
                                        onShowToast(
                                          `Approved ${ord.domainOrHost} & sent WHOIS verification link to ${ord.clientEmail}`
                                        );
                                        return;
                                      }
                                      const resent = await resendDomainVerificationEmail(ord.id);
                                      if (!resent.ok) {
                                        onShowToast(resent.error || 'Could not resend verification email');
                                        return;
                                      }
                                      onShowToast(
                                        resent.emailSent
                                          ? `WHOIS verification email resent to ${ord.clientEmail}`
                                          : `Verification link refreshed for ${ord.domainOrHost} (enable SMTP for inbox email)`
                                      );
                                    }}
                                    className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <MailCheck className="w-3 h-3" aria-hidden="true" />
                                    <span>
                                      {isPendingRegApproval ? 'Approve' : 'Resend Verify'}
                                    </span>
                                  </button>
                                )
                              )}
                              {ord.nameserverUpdateStatus === 'pending_update' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = adminApplyNameserverChange(ord.id);
                                    if (res.ok) {
                                      onShowToast(
                                        `Applied nameservers & notified ${ord.clientEmail}`
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 text-[11px] font-semibold text-[#D97706] border border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  Update NS &amp; Notify
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditDomainModal(ord)}
                                className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Edit Dates &amp; DNS
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inline Domain Inspector / Edit Form */}
          {editingDomainOrder && (
            <form
              onSubmit={handleSaveDomainEdit}
              className="bg-white border border-[#0E6B63] rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="font-mono text-xs font-bold text-[#0E6B63]">
                    {editingDomainOrder.id}
                  </p>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    Edit Domain: {editingDomainOrder.domainOrHost}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDomainOrder(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Domain Status
                  </label>
                  <select
                    value={editOrdStatus}
                    onChange={(e) => setEditOrdStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    {DOMAIN_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Registration / Start Date
                  </label>
                  <input
                    type="date"
                    value={editOrdCreatedAt}
                    onChange={(e) => setEditOrdCreatedAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Next Due / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editOrdDueDate}
                    onChange={(e) => setEditOrdDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Renewal / Billed Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOrdAmount}
                    onChange={(e) => setEditOrdAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Authoritative Nameservers (2 or 4 comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editOrdNsText}
                    onChange={(e) => setEditOrdNsText(e.target.value)}
                    placeholder="ns1.stackdns.com, ns2.stackdns.com, ns3.stackdns.com, ns4.stackdns.com"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDomainOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                >
                  Save Domain Changes
                </button>
              </div>
            </form>
          )}
            </>
          )}
        </div>
      )}

      {/* ==================== TAB 2: NAMESERVER REQUESTS & NOTIFY ==================== */}
      {subTab === 'nameservers' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  Nameserver Change Requests &amp; Client Notify Desk
                </h2>
                <p className="text-xs text-slate-500">
                  Review custom or StackDNS nameservers submitted by clients, apply delegation live, and dispatch confirmation emails.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-semibold text-[#D97706]">
              {pendingNameserverOrders.length} Pending Request(s)
            </span>
          </div>

          {pendingNameserverOrders.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" aria-hidden="true" />
              <p className="font-semibold text-[#0F172A]">
                All nameserver change requests are synced and up to date
              </p>
              <p className="text-slate-500 max-w-md mx-auto">
                When a client requests custom or StackDNS nameservers from their portal, it appears here for one-click push and client notification.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {pendingNameserverOrders.map((ord) => (
                <div
                  key={`ns-tab-${ord.id}`}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0F172A]">
                        {ord.domainOrHost}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{ord.id}</span>
                      <span className="text-slate-600">
                        · {ord.clientName} ({ord.clientEmail})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-mono">
                      <span className="text-slate-500">
                        Current: {(ord.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']).join(', ')}
                      </span>
                      <span className="font-semibold text-[#0E6B63]">
                        Requested: {(ord.pendingNameservers || []).join(', ')}
                      </span>
                      {ord.nameserverRequestedAt && (
                        <span className="text-slate-400">
                          Requested: {ord.nameserverRequestedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const res = adminApplyNameserverChange(ord.id);
                      if (!res.ok) {
                        onShowToast(res.error || 'Failed to apply nameserver change');
                        return;
                      }
                      onShowToast(
                        `Updated nameservers for ${ord.domainOrHost} & emailed confirmation to ${ord.clientEmail}`
                      );
                    }}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Apply NS &amp; Notify Client</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: DOMAIN TRANSFERS (7-DAY WORKFLOW) ==================== */}
      {subTab === 'transfers' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <ArrowLeftRight className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  Incoming Domain Transfers &amp; 7-Day Approval Desk
                </h2>
                <p className="text-xs text-slate-500">
                  Verify EPP authorization codes, initiate the 7-day transfer window, accept client-notified approvals, or Allow Manage once 7+ days elapse.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-semibold text-[#0E6B63]">
              {transferOrders.length} Transfer Order(s)
            </span>
          </div>

          {transferOrders.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs">
              <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
              <p className="font-semibold text-[#0F172A]">No domain transfer orders yet</p>
              <p className="text-slate-500 max-w-md mx-auto">
                Transfers ordered from the storefront or added via Add Domain appear here with their EPP code and daily 7-day countdown.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {transferOrders.map((ord) => {
                const lc = evaluateDomainLifecycle(ord);
                const tStatus = lc.transferStatus;
                return (
                  <div
                    key={`trn-${ord.id}`}
                    className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-[#0F172A]">
                          {ord.domainOrHost}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">{ord.id}</span>
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            tStatus === 'completed'
                              ? 'text-[#16A34A]'
                              : tStatus === 'client_notified'
                                ? 'text-[#0E6B63]'
                                : 'text-[#D97706]'
                          }`}
                        >
                          {tStatus === 'pending_admin'
                            ? 'Awaiting Admin Start'
                            : tStatus === 'in_progress'
                              ? `In Progress · Day ${lc.transferDaysElapsed} of 7 (${lc.transferDaysRemaining}d left)`
                              : tStatus === 'client_notified'
                                ? 'Client Confirmed Registrar Approval'
                                : 'Transfer Completed & Active'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-600">
                        <span>
                          Client: <strong className="text-[#0F172A]">{ord.clientName}</strong> ({ord.clientEmail})
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[#0F172A]">
                          <KeyRound className="w-3 h-3 text-[#0E6B63]" aria-hidden="true" />
                          EPP: <strong>{ord.eppCode || 'Not Provided'}</strong>
                        </span>
                        <span className="font-mono">
                          NS: {(ord.nameservers || []).join(', ') || 'ns1.cpcloudhost.com, ns2.cpcloudhost.com'}
                        </span>
                      </div>

                      {ord.transferStartedAt && (
                        <p className="text-[11px] font-mono text-slate-500">
                          Started: {ord.transferStartedAt} · {formatPrice(ord.amountUsd)}
                          {ord.transferClientNotifiedAt
                            ? ` · Client Notified: ${ord.transferClientNotifiedAt}`
                            : ''}
                          {ord.transferCompletedAt
                            ? ` · Completed: ${ord.transferCompletedAt}`
                            : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {tStatus === 'pending_admin' && ord.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminStartDomainTransfer(ord.id);
                            if (res.ok) {
                              onShowToast(
                                `Started 7-day transfer for ${ord.domainOrHost} & emailed ${ord.clientEmail}`
                              );
                            } else {
                              onShowToast(res.error || 'Could not start transfer');
                            }
                          }}
                          className="min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Approve &amp; Start 7-Day Transfer</span>
                        </button>
                      )}

                      {tStatus === 'client_notified' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminCompleteDomainTransfer(ord.id, false);
                            if (res.ok) {
                              onShowToast(
                                `Accepted transfer for ${ord.domainOrHost} · Success email sent & Manage unlocked`
                              );
                            } else {
                              onShowToast(res.error || 'Could not complete transfer');
                            }
                          }}
                          className="min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Accept &amp; Complete Transfer</span>
                        </button>
                      )}

                      {tStatus === 'in_progress' && lc.transferCanAdminAllowManage && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminCompleteDomainTransfer(ord.id, true);
                            if (res.ok) {
                              onShowToast(
                                `7+ days elapsed — Manage unlocked & transfer completed for ${ord.domainOrHost}`
                              );
                            }
                          }}
                          className="min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Allow Manage (7+ Days Elapsed)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSubTab('domains');
                          openEditDomainModal(ord);
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:border-[#0E6B63] cursor-pointer"
                      >
                        Edit Dates &amp; DNS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: TLD EXTENSIONS & PRICING ==================== */}
      {subTab === 'tlds' && (
        <div className="space-y-4">
          {(showAddTld || editingTld) && (
            <form
              onSubmit={handleSaveTldSubmit}
              className="bg-white border border-[#0E6B63] rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    {editingTld
                      ? `Edit TLD Extension: ${editingTld.tld}`
                      : 'Add New TLD Extension'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set 1-Year, 2-Year (e.g., .pk PKNIC minimum 2-year term), Renewal, and Transfer prices. Changes sync live with storefront search.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTld(null);
                    setShowAddTld(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    TLD Extension *
                  </label>
                  <input
                    type="text"
                    value={tldCode}
                    onChange={(e) => setTldCode(e.target.value)}
                    placeholder=".com or .pk"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Minimum Term
                  </label>
                  <select
                    value={tldMinYears}
                    onChange={(e) =>
                      setTldMinYears(Number(e.target.value) as 1 | 2)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value={1}>1 Year Minimum</option>
                    <option value={2}>2 Years Minimum (PKNIC / .ai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    1-Year Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tldYear1}
                    onChange={(e) => setTldYear1(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    2-Year / 2nd-Yr Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tldYear2}
                    onChange={(e) => setTldYear2(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Annual Renewal Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tldRenewal}
                    onChange={(e) => setTldRenewal(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Domain Transfer Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tldTransfer}
                    onChange={(e) => setTldTransfer(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Registrar Module (Optional)
                  </label>
                  <select
                    value={tldRegistrarId}
                    onChange={(e) => setTldRegistrarId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="">Default Internal Registry</option>
                    {provisioningModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-4 pb-1.5">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tldPopular}
                      onChange={(e) => setTldPopular(e.target.checked)}
                      className="rounded border-slate-300 text-[#0E6B63]"
                    />
                    <span>Popular TLD</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tldEnabled}
                      onChange={(e) => setTldEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-[#0E6B63]"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Storefront Description
                </label>
                <input
                  type="text"
                  value={tldDesc}
                  onChange={(e) => setTldDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>

              {tldFormError && (
                <p className="text-xs font-semibold text-[#DC2626]">{tldFormError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTld(null);
                    setShowAddTld(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                >
                  {editingTld ? 'Save TLD Pricing' : 'Create TLD Extension'}
                </button>
              </div>
            </form>
          )}

          {/* TLD Filter */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={tldSearch}
                onChange={(e) => setTldSearch(e.target.value)}
                placeholder="Search extension (.com, .pk, .co.uk)..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Storefront domain lookup &amp; popular TLD pills pull directly from this table
            </span>
          </div>

          {/* TLD Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Extension</th>
                    <th className="py-3 px-4">Min Term</th>
                    <th className="py-3 px-4 text-right">1-Year</th>
                    <th className="py-3 px-4 text-right">2-Year</th>
                    <th className="py-3 px-4 text-right">Renewal</th>
                    <th className="py-3 px-4 text-right">Transfer</th>
                    <th className="py-3 px-4">Visibility</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {filteredTlds.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-[#0E6B63]">
                            {t.tld}
                          </span>
                          {t.popular && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#D97706]">
                              <Sparkles className="w-3 h-3" aria-hidden="true" />
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                          {t.description}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                        {t.minYears === 2 ? '2 Years (PKNIC/Min)' : '1 Year'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A] whitespace-nowrap">
                        {formatPrice(t.year1Usd)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0E6B63] whitespace-nowrap">
                        {formatPrice(t.year2Usd)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {formatPrice(t.renewalUsd)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {formatPrice(t.transferUsd)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            saveTldExtension(t.id, { enabled: !t.enabled });
                            onShowToast(
                              `${t.tld} ${!t.enabled ? 'enabled' : 'disabled'} on storefront`
                            );
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                            t.enabled
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          <span>{t.enabled ? 'Enabled' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openTldEditor(t)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded-lg cursor-pointer"
                        >
                          Edit Prices
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = deleteTldExtension(t.id);
                            if (res.ok) onShowToast(`Removed ${t.tld}`);
                            else onShowToast(res.error || 'Cannot delete');
                          }}
                          aria-label={`Delete ${t.tld}`}
                          className="p-1.5 text-slate-400 hover:text-[#DC2626] border border-transparent hover:border-red-200 rounded-lg cursor-pointer inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <QuickAddClientModal
        open={showQuickAddClient}
        onClose={() => setShowQuickAddClient(false)}
        onCreated={(user) => {
          setNewDomainClientEmail(user.email);
          setNewDomainClientName(user.name);
          setNewDomainClientCountry(user.country || 'Pakistan');
          onShowToast(`Client ${user.name} created and selected`);
        }}
      />
    </div>
  );
};
