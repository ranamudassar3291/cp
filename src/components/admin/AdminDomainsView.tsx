import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  OrderStatus,
  PlatformOrder,
  TldExtensionRecord,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';

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
    saveTldExtension,
    createTldExtension,
    deleteTldExtension,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  const [subTab, setSubTab] = useState<'domains' | 'tlds'>('domains');

  // Registered / Ordered Domains State
  const [domainSearch, setDomainSearch] = useState('');
  const [domainStatusFilter, setDomainStatusFilter] = useState<'all' | OrderStatus>('all');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainClientEmail, setNewDomainClientEmail] = useState(
    users.find((u) => u.role === 'client')?.email ?? ''
  );
  const [newDomainHost, setNewDomainHost] = useState('');
  const [newDomainType, setNewDomainType] = useState<
    'Domain Registration' | 'Domain Transfer'
  >('Domain Registration');
  const [newDomainYears, setNewDomainYears] = useState<1 | 2>(1);
  const [newDomainPriceUsd, setNewDomainPriceUsd] = useState('9.99');
  const [newDomainStatus, setNewDomainStatus] = useState<OrderStatus>('active');
  const [newDomainStartDate, setNewDomainStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newDomainDueDate, setNewDomainDueDate] = useState(getDefaultDueDate(1));
  const [addDomainError, setAddDomainError] = useState('');

  // Inline domain editor state
  const [editingDomainOrder, setEditingDomainOrder] = useState<PlatformOrder | null>(
    null
  );
  const [editOrdStatus, setEditOrdStatus] = useState<OrderStatus>('active');
  const [editOrdCreatedAt, setEditOrdCreatedAt] = useState('');
  const [editOrdDueDate, setEditOrdDueDate] = useState('');
  const [editOrdAmount, setEditOrdAmount] = useState('');
  const [editOrdNs1, setEditOrdNs1] = useState('ns1.cpcloudhost.com');
  const [editOrdNs2, setEditOrdNs2] = useState('ns2.cpcloudhost.com');

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

  const domainMetrics = useMemo(() => {
    return {
      total: domainOrders.length,
      active: domainOrders.filter((d) => d.status === 'active').length,
      pending: domainOrders.filter((d) => d.status === 'pending').length,
      expiredOrSuspended: domainOrders.filter(
        (d) => d.status === 'expired' || d.status === 'suspended'
      ).length,
      enabledTlds: tldExtensions.filter((t) => t.enabled).length,
    };
  }, [domainOrders, tldExtensions]);

  const detectTldForDomain = (domainInput: string): TldExtensionRecord | undefined => {
    const clean = domainInput.trim().toLowerCase();
    if (!clean.includes('.')) return undefined;
    const sorted = [...tldExtensions].sort((a, b) => b.tld.length - a.tld.length);
    return sorted.find((t) => clean.endsWith(t.tld.toLowerCase()));
  };

  const handleDomainHostChange = (val: string) => {
    setNewDomainHost(val);
    const matched = detectTldForDomain(val);
    if (matched) {
      const yrs = matched.minYears;
      setNewDomainYears(yrs);
      setNewDomainDueDate(getDefaultDueDate(yrs));
      if (newDomainType === 'Domain Transfer') {
        setNewDomainPriceUsd(matched.transferUsd.toFixed(2));
      } else {
        setNewDomainPriceUsd(
          (yrs === 2 ? matched.year2Usd : matched.year1Usd).toFixed(2)
        );
      }
    }
  };

  const handleYearsChange = (yrs: 1 | 2) => {
    setNewDomainYears(yrs);
    setNewDomainDueDate(getDefaultDueDate(yrs));
    const matched = detectTldForDomain(newDomainHost);
    if (matched) {
      if (newDomainType === 'Domain Transfer') {
        setNewDomainPriceUsd(matched.transferUsd.toFixed(2));
      } else {
        setNewDomainPriceUsd(
          (yrs === 2 ? matched.year2Usd : matched.year1Usd).toFixed(2)
        );
      }
    }
  };

  const handleAddDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newDomainClientEmail.trim().toLowerCase();
    const cleanDomain = newDomainHost.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const price = parseFloat(newDomainPriceUsd);

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAddDomainError('Select or enter a valid client email.');
      return;
    }
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setAddDomainError('Enter a valid domain name (e.g. brandname.com or company.pk).');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setAddDomainError('Enter a valid registration price.');
      return;
    }

    const matchedTld = detectTldForDomain(cleanDomain);
    if (matchedTld?.minYears === 2 && newDomainYears < 2 && newDomainType === 'Domain Registration') {
      setAddDomainError(`${matchedTld.tld} requires a minimum 2-year registration term.`);
      return;
    }

    const clientUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const { order, invoice } = addOrder({
      clientEmail: cleanEmail,
      clientName: clientUser?.name,
      country: clientUser?.country || 'Pakistan',
      productType: newDomainType,
      planName: `${newDomainType} (${newDomainYears}-Yr${matchedTld ? ` ${matchedTld.tld}` : ''})`,
      domainOrHost: cleanDomain,
      billingCycle: 'Yearly',
      amountUsd: price,
      status: newDomainStatus,
      createdAt: newDomainStartDate || undefined,
      nextDueDate: newDomainDueDate || undefined,
      paymentMethod: newDomainStatus === 'active' ? 'Admin Domain Provision' : 'Awaiting Payment',
      invoicePaid: newDomainStatus === 'active',
      generateInvoice: true,
    });

    setAddDomainError('');
    setNewDomainHost('');
    setShowAddDomain(false);
    onShowToast(
      `Domain ${order.domainOrHost} added${invoice ? ` & invoice ${invoice.id} created` : ''}`
    );
  };

  const openEditDomainModal = (ord: PlatformOrder) => {
    setEditingDomainOrder(ord);
    setEditOrdStatus(ord.status);
    setEditOrdCreatedAt(ord.createdAt.slice(0, 10));
    setEditOrdDueDate((ord.nextDueDate || getDefaultDueDate(1)).slice(0, 10));
    setEditOrdAmount(ord.amountUsd.toFixed(2));
    setEditOrdNs1(ord.nameservers?.[0] || 'ns1.cpcloudhost.com');
    setEditOrdNs2(ord.nameservers?.[1] || 'ns2.cpcloudhost.com');
  };

  const handleSaveDomainEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomainOrder) return;
    const amt = parseFloat(editOrdAmount);
    adminUpdateOrderDetails(editingDomainOrder.id, {
      status: editOrdStatus,
      createdAt: editOrdCreatedAt || editingDomainOrder.createdAt,
      nextDueDate: editOrdDueDate || editingDomainOrder.nextDueDate,
      amountUsd: Number.isFinite(amt) && amt >= 0 ? amt : editingDomainOrder.amountUsd,
      nameservers: [
        editOrdNs1.trim() || 'ns1.cpcloudhost.com',
        editOrdNs2.trim() || 'ns2.cpcloudhost.com',
      ],
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
          <p className="text-[11px] font-medium text-slate-500">Pending Approval</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#D97706] mt-1">
            {domainMetrics.pending}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Expired / Suspended</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#DC2626] mt-1">
            {domainMetrics.expiredOrSuspended}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 col-span-2 lg:col-span-1">
          <p className="text-[11px] font-medium text-slate-500">Live TLD Extensions</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0E6B63] mt-1">
            {domainMetrics.enabledTlds} / {tldExtensions.length}
          </p>
        </div>
      </div>

      {/* Sub-Tabs + Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-px">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('domains')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'domains'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Registered &amp; Ordered Domains ({domainOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('tlds')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'tlds'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>TLD Extensions &amp; Pricing ({tldExtensions.length})</span>
          </button>
        </div>

        <div className="pb-2">
          {subTab === 'domains' ? (
            <button
              type="button"
              onClick={() => setShowAddDomain((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddDomain ? 'Close Add Domain' : 'Add Domain'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (showAddTld ? setShowAddTld(false) : openTldEditor())}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddTld ? 'Close Add TLD' : 'Add TLD'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== TAB 1: REGISTERED & ORDERED DOMAINS ==================== */}
      {subTab === 'domains' && (
        <div className="space-y-4">
          {showAddDomain && (
            <form
              onSubmit={handleAddDomainSubmit}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    Register or Provision New Domain Order
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Auto-calculates TLD pricing (including 2-year minimum for .pk / .com.pk) and generates an invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDomain(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    list="admin-domain-client-emails"
                    value={newDomainClientEmail}
                    onChange={(e) => setNewDomainClientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                  <datalist id="admin-domain-client-emails">
                    {users.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Domain Name *
                  </label>
                  <input
                    type="text"
                    value={newDomainHost}
                    onChange={(e) => handleDomainHostChange(e.target.value)}
                    placeholder="e.g. acme.com or brand.pk"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Order Action
                  </label>
                  <select
                    value={newDomainType}
                    onChange={(e) =>
                      setNewDomainType(
                        e.target.value as 'Domain Registration' | 'Domain Transfer'
                      )
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Domain Registration">Domain Registration</option>
                    <option value="Domain Transfer">Domain Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Term &amp; Period
                  </label>
                  <select
                    value={newDomainYears}
                    onChange={(e) =>
                      handleYearsChange(Number(e.target.value) as 1 | 2)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value={1}>1 Year Registration</option>
                    <option value={2}>2 Years (Required for .pk / .ai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDomainPriceUsd}
                    onChange={(e) => setNewDomainPriceUsd(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newDomainStatus}
                    onChange={(e) => setNewDomainStatus(e.target.value as OrderStatus)}
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
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={newDomainStartDate}
                    onChange={(e) => setNewDomainStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Next Due / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newDomainDueDate}
                    onChange={(e) => setNewDomainDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              {addDomainError && (
                <p className="text-xs font-semibold text-[#DC2626]">{addDomainError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDomain(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Add Domain &amp; Generate Invoice
                </button>
              </div>
            </form>
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
                    filteredDomainOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#0F172A] block">
                            {ord.domainOrHost}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {ord.id}
                          </span>
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
                          <button
                            type="button"
                            onClick={() => openEditDomainModal(ord)}
                            className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Edit Dates &amp; DNS
                          </button>
                        </td>
                      </tr>
                    ))
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
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Primary Nameserver (NS1)
                  </label>
                  <input
                    type="text"
                    value={editOrdNs1}
                    onChange={(e) => setEditOrdNs1(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Secondary Nameserver (NS2)
                  </label>
                  <input
                    type="text"
                    value={editOrdNs2}
                    onChange={(e) => setEditOrdNs2(e.target.value)}
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
    </div>
  );
};
