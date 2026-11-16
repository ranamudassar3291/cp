import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Globe,
  Percent,
  Plus,
  Search,
  Server,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  PromoCodeRecord,
  PromoCodeScope,
  PromoDiscountType,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';

interface AdminPromoCodesViewProps {
  onShowToast: (msg: string) => void;
}

const HOSTING_BILLING_CYCLES = ['1 Month', '1 Year', '2 Years', '4 Years'] as const;

export const AdminPromoCodesView: React.FC<AdminPromoCodesViewProps> = ({
  onShowToast,
}) => {
  const {
    promoCodes,
    hostingPlans,
    tldExtensions,
    createPromoCode,
    savePromoCode,
    deletePromoCode,
    togglePromoCode,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  const [activeScopeTab, setActiveScopeTab] = useState<PromoCodeScope>('hosting');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<PromoCodeScope>('hosting');
  const [discountType, setDiscountType] = useState<PromoDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('20');
  const [applicableItems, setApplicableItems] = useState<string[]>([]);
  const [applicableCycles, setApplicableCycles] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState('0');
  const [expiresAt, setExpiresAt] = useState('2027-12-31');
  const [enabled, setEnabled] = useState(true);

  const stats = useMemo(() => {
    const hostingCount = promoCodes.filter((p) => p.scope === 'hosting').length;
    const domainCount = promoCodes.filter((p) => p.scope === 'domain').length;
    const activeCount = promoCodes.filter((p) => p.enabled).length;
    const totalRedemptions = promoCodes.reduce((sum, p) => sum + p.usedCount, 0);
    return { hostingCount, domainCount, activeCount, totalRedemptions };
  }, [promoCodes]);

  const filteredPromos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return promoCodes.filter((p) => {
      if (p.scope !== activeScopeTab) return false;
      if (!q) return true;
      return (
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.applicableItems.some((item) => item.toLowerCase().includes(q))
      );
    });
  }, [promoCodes, activeScopeTab, searchQuery]);

  const openCreateForm = () => {
    setEditingId(null);
    setCode('');
    setDescription('');
    setScope(activeScopeTab);
    setDiscountType('percent');
    setDiscountValue('20');
    setApplicableItems([]);
    setApplicableCycles([]);
    setMaxUses('0');
    setExpiresAt('2027-12-31');
    setEnabled(true);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (promo: PromoCodeRecord) => {
    setEditingId(promo.id);
    setCode(promo.code);
    setDescription(promo.description);
    setScope(promo.scope);
    setDiscountType(promo.discountType);
    setDiscountValue(String(promo.discountValue));
    setApplicableItems(promo.applicableItems);
    setApplicableCycles(promo.applicableCycles);
    setMaxUses(String(promo.maxUses));
    setExpiresAt(promo.expiresAt);
    setEnabled(promo.enabled);
    setFormError('');
    setShowForm(true);
  };

  const toggleApplicableItem = (itemKey: string) => {
    setApplicableItems((prev) =>
      prev.includes(itemKey) ? prev.filter((x) => x !== itemKey) : [...prev, itemKey]
    );
  };

  const toggleApplicableCycle = (cycle: string) => {
    setApplicableCycles((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericVal = Number(discountValue);
    if (!code.trim() || code.trim().length < 3) {
      setFormError('Enter a promo code of at least 3 characters (e.g. HOST30).');
      return;
    }
    if (Number.isNaN(numericVal) || numericVal <= 0) {
      setFormError('Enter a valid positive discount amount.');
      return;
    }
    if (discountType === 'percent' && numericVal > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (editingId) {
      const res = savePromoCode(editingId, {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        scope,
        discountType,
        discountValue: numericVal,
        applicableItems,
        applicableCycles: scope === 'hosting' ? applicableCycles : [],
        maxUses: Math.max(0, Number(maxUses) || 0),
        expiresAt: expiresAt || '2027-12-31',
        enabled,
      });
      if (!res.ok) {
        setFormError(res.error ?? 'Unable to update promo code.');
        return;
      }
      onShowToast(`Promo code ${code.trim().toUpperCase()} updated`);
    } else {
      const res = createPromoCode({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        scope,
        discountType,
        discountValue: numericVal,
        applicableItems,
        applicableCycles: scope === 'hosting' ? applicableCycles : [],
        maxUses: Math.max(0, Number(maxUses) || 0),
        expiresAt: expiresAt || '2027-12-31',
        enabled,
      });
      if (!res.ok) {
        setFormError(res.error ?? 'Unable to create promo code.');
        return;
      }
      onShowToast(`Promo code ${res.promo?.code} created`);
    }

    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  const resolveItemLabel = (itemId: string, itemScope: PromoCodeScope) => {
    if (itemScope === 'domain') return itemId;
    const plan = hostingPlans.find((p) => p.id === itemId);
    return plan ? plan.name : itemId;
  };

  return (
    <div className="space-y-5">
      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Coupons
          </p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {stats.activeCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            of {promoCodes.length} total rules
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Hosting Promos
          </p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#0E6B63]">
            {stats.hostingCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Shared, cPanel, WP &amp; VPS
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Domain Promos
          </p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {stats.domainCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Applied to selected TLDs
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Redemptions
          </p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#16A34A]">
            {stats.totalRedemptions}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across client checkouts
          </p>
        </div>
      </div>

      {/* Hosting vs Domain Sub-Tabs + Create CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-px">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveScopeTab('hosting')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeScopeTab === 'hosting'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Server className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hosting Promo Codes ({stats.hostingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScopeTab('domain')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeScopeTab === 'domain'
                ? 'border-[#0E6B63] text-[#0E6B63]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Domain Promo Codes ({stats.domainCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="mb-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            Add {activeScopeTab === 'hosting' ? 'Hosting' : 'Domain'} Promo Code
          </span>
        </button>
      </div>

      {/* Create / Edit Promo Code Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#0E6B63]/40 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
              <h3 className="font-display text-sm font-bold text-[#0F172A]">
                {editingId ? 'Edit Promo Code' : 'Create New Promo Code'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
              aria-label="Close promo form"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Promo Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setFormError('');
                }}
                placeholder="HOST30"
                className="w-full px-3 py-2 font-mono font-bold uppercase border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Applies To Category
              </label>
              <select
                value={scope}
                onChange={(e) => {
                  const next = e.target.value as PromoCodeScope;
                  setScope(next);
                  setApplicableItems([]);
                }}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white"
              >
                <option value="hosting">Hosting Plans</option>
                <option value="domain">Domain Registrations</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as PromoDiscountType)
                }
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Discount Value ({discountType === 'percent' ? '%' : 'USD'}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  setFormError('');
                }}
                className="w-full px-3 py-2 font-mono tabular-nums border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Campaign Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 30% discount on Shared Cloud annual plans"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Max Uses (0 = Unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums border border-[#CBD5E1] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
          </div>

          {/* Applicable Hosting Plans OR Applicable TLDs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">
                {scope === 'hosting'
                  ? 'Applicable Hosting Services (leave empty to allow all hosting plans)'
                  : 'Applicable Domain Extensions / TLDs (leave empty to allow all TLDs)'}
              </span>
              {applicableItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setApplicableItems([])}
                  className="text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                >
                  Reset to All
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {scope === 'hosting'
                ? hostingPlans.map((plan) => {
                    const selected = applicableItems.includes(plan.id);
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => toggleApplicableItem(plan.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#0E6B63] border-[#0E6B63] text-white'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {plan.name}{' '}
                        <span className="opacity-75">
                          ({plan.pageCategory.replace('-hosting', '')})
                        </span>
                      </button>
                    );
                  })
                : tldExtensions.map((tld) => {
                    const selected = applicableItems.includes(tld.tld);
                    return (
                      <button
                        key={tld.id}
                        type="button"
                        onClick={() => toggleApplicableItem(tld.tld)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#0E6B63] border-[#0E6B63] text-white'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {tld.tld}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Applicable Billing Periods for Hosting */}
          {scope === 'hosting' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-600">
                  Eligible Billing Periods (leave empty to allow all periods)
                </span>
                {applicableCycles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setApplicableCycles([])}
                    className="text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                  >
                    Allow All Cycles
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HOSTING_BILLING_CYCLES.map((cycle) => {
                  const selected = applicableCycles.includes(cycle);
                  return (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => toggleApplicableCycle(cycle)}
                      className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#0E6B63] border-[#0E6B63] text-white'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {cycle}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-slate-300 text-[#0E6B63]"
              />
              <span>Promo code active on public checkout</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                {editingId ? 'Save Promo Changes' : 'Create Promo Code'}
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-[#DC2626]">{formError}</p>
          )}
        </form>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeScopeTab} promo codes, plans, or TLDs...`}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-mono font-semibold text-[#0F172A]">{filteredPromos.length}</span>{' '}
          {activeScopeTab} coupons
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Promo Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">
                  {activeScopeTab === 'hosting'
                    ? 'Applicable Plans & Cycles'
                    : 'Applicable Domain TLDs'}
                </th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No {activeScopeTab} promo codes configured yet. Click Add Promo Code above to create one.
                  </td>
                </tr>
              ) : (
                filteredPromos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F2FAF8] border border-[#0E6B63]/25 font-mono font-bold text-[#0E6B63]">
                          <Percent className="w-3 h-3" aria-hidden="true" />
                          {promo.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                        {promo.description}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums font-bold text-[#0F172A]">
                      {promo.discountType === 'percent'
                        ? `${promo.discountValue}% OFF`
                        : `${formatPrice(promo.discountValue)} OFF`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {promo.applicableItems.length === 0 ? (
                          <span className="text-[11px] font-medium text-slate-600">
                            {promo.scope === 'hosting'
                              ? 'All Hosting Plans'
                              : 'All Domain TLDs'}
                          </span>
                        ) : (
                          promo.applicableItems.map((item) => (
                            <span
                              key={item}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700"
                            >
                              {resolveItemLabel(item, promo.scope)}
                            </span>
                          ))
                        )}
                      </div>
                      {promo.scope === 'hosting' && promo.applicableCycles.length > 0 && (
                        <p className="text-[10px] text-[#0E6B63] mt-1 font-medium">
                          Cycles: {promo.applicableCycles.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700">
                      {promo.usedCount} /{' '}
                      {promo.maxUses > 0 ? promo.maxUses : '∞'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-600">
                      {promo.expiresAt || 'Never'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          togglePromoCode(promo.id);
                          onShowToast(
                            `Promo ${promo.code} ${promo.enabled ? 'disabled' : 'enabled'}`
                          );
                        }}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer ${
                          promo.enabled ? 'text-[#16A34A]' : 'text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{promo.enabled ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditForm(promo)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deletePromoCode(promo.id);
                          onShowToast(`Deleted promo code ${promo.code}`);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#DC2626] border border-red-200 hover:bg-red-50 rounded cursor-pointer"
                        aria-label={`Delete ${promo.code}`}
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
