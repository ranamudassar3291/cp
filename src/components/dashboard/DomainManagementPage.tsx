import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  LifeBuoy,
  Lock,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react';
import {
  DomainContactAddress,
  DomainDnsRecord,
  PlatformInvoice,
  PlatformOrder,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  evaluateDomainLifecycle,
  generateDeterministicEppCode,
  ICANN_TRANSFER_LOCK_DAYS,
} from '../../utils/domainLifecycle';
import { DomainContactAddressSelector } from '../domain/DomainContactAddressSelector';

interface DomainManagementPageProps {
  domain: PlatformOrder;
  linkedInvoice: PlatformInvoice | null;
  onBackToDomains: () => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenSupportTicket: (domainName: string) => void;
  onShowToast: (msg: string) => void;
}

type DomainConsoleTab = 'overview' | 'dns' | 'transfer' | 'whois';

export const DomainManagementPage: React.FC<DomainManagementPageProps> = ({
  domain,
  linkedInvoice,
  onBackToDomains,
  onOpenInvoice,
  onOpenSupportTicket,
  onShowToast,
}) => {
  const {
    domainContactAddresses,
    updateClientOrderSettings,
    updateDomainTransferLock,
    regenerateDomainEppCode,
    updateDomainDnsRecords,
    updateDomainWhoisContact,
  } = usePlatform();
  const { formatPrice } = useCurrency();

  const lifecycle = useMemo(() => evaluateDomainLifecycle(domain), [domain]);

  const [activeTab, setActiveTab] = useState<DomainConsoleTab>('overview');

  // Nameservers form state
  const currentNs1 = domain.nameservers?.[0] || 'ns1.cpcloudhost.com';
  const currentNs2 = domain.nameservers?.[1] || 'ns2.cpcloudhost.com';
  const isCurrentlyDefaultNs =
    currentNs1.toLowerCase() === 'ns1.cpcloudhost.com' &&
    currentNs2.toLowerCase() === 'ns2.cpcloudhost.com';

  const [nsMode, setNsMode] = useState<'default' | 'custom'>(
    isCurrentlyDefaultNs ? 'default' : 'custom'
  );
  const [ns1, setNs1] = useState(currentNs1);
  const [ns2, setNs2] = useState(currentNs2);
  const [nsError, setNsError] = useState('');

  // DNS Zone Editor state
  const defaultRecords: DomainDnsRecord[] = useMemo(
    () =>
      domain.dnsRecords && domain.dnsRecords.length > 0
        ? domain.dnsRecords
        : [
            {
              id: `DNS-${domain.id}-A`,
              type: 'A',
              name: '@',
              value: '185.199.110.42',
              ttl: 3600,
            },
            {
              id: `DNS-${domain.id}-CNAME`,
              type: 'CNAME',
              name: 'www',
              value: domain.domainOrHost,
              ttl: 3600,
            },
            {
              id: `DNS-${domain.id}-MX`,
              type: 'MX',
              name: '@',
              value: `mail.${domain.domainOrHost}`,
              ttl: 3600,
              priority: 10,
            },
            {
              id: `DNS-${domain.id}-TXT`,
              type: 'TXT',
              name: '@',
              value: 'v=spf1 include:_spf.cpcloudhost.com ~all',
              ttl: 3600,
            },
          ],
    [domain.dnsRecords, domain.id, domain.domainOrHost]
  );

  const [dnsRecords, setDnsRecords] = useState<DomainDnsRecord[]>(defaultRecords);
  const [newRecType, setNewRecType] = useState<DomainDnsRecord['type']>('A');
  const [newRecName, setNewRecName] = useState('');
  const [newRecValue, setNewRecValue] = useState('');
  const [newRecTtl, setNewRecTtl] = useState('3600');
  const [dnsError, setDnsError] = useState('');

  // Transfer & EPP state
  const [revealEpp, setRevealEpp] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // WHOIS Contact state
  const fallbackContact =
    domain.whoisContact ||
    domainContactAddresses.find((c) => c.isDefault) ||
    domainContactAddresses[0] ||
    null;
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    fallbackContact?.id || null
  );
  const [pendingWhoisContact, setPendingWhoisContact] =
    useState<DomainContactAddress | null>(fallbackContact);

  useEffect(() => {
    const nextNs1 = domain.nameservers?.[0] || 'ns1.cpcloudhost.com';
    const nextNs2 = domain.nameservers?.[1] || 'ns2.cpcloudhost.com';
    const isDef =
      nextNs1.toLowerCase() === 'ns1.cpcloudhost.com' &&
      nextNs2.toLowerCase() === 'ns2.cpcloudhost.com';
    setNsMode(isDef ? 'default' : 'custom');
    setNs1(nextNs1);
    setNs2(nextNs2);
    setDnsRecords(defaultRecords);
    setRevealEpp(false);
    setTransferError('');
    setNsError('');
  }, [domain.id, domain.nameservers, defaultRecords]);

  const effectiveEppCode =
    domain.eppCode || generateDeterministicEppCode(domain.id);

  const copyValue = (key: string, val: string, label: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard
      ?.writeText(val)
      .then(() => {
        setCopiedKey(key);
        onShowToast(`${label} copied to clipboard`);
        window.setTimeout(() => setCopiedKey(''), 1800);
      })
      .catch(() => {});
  };

  const handleSaveNameservers = () => {
    setNsError('');
    const finalNs1 =
      nsMode === 'default' ? 'ns1.cpcloudhost.com' : ns1.trim().toLowerCase();
    const finalNs2 =
      nsMode === 'default' ? 'ns2.cpcloudhost.com' : ns2.trim().toLowerCase();
    if (!finalNs1 || !finalNs1.includes('.') || !finalNs2 || !finalNs2.includes('.')) {
      setNsError('Enter valid hostnames for both Nameserver 1 and Nameserver 2.');
      return;
    }
    updateClientOrderSettings(domain.id, { nameservers: [finalNs1, finalNs2] });
    onShowToast(`Nameservers updated for ${domain.domainOrHost}`);
  };

  const handleAddDnsRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setDnsError('');
    const cleanName = newRecName.trim() || '@';
    const cleanVal = newRecValue.trim();
    const ttl = Math.max(60, Number(newRecTtl) || 3600);
    if (!cleanVal) {
      setDnsError('Enter a target IP address, hostname, or TXT record value.');
      return;
    }
    const created: DomainDnsRecord = {
      id: `DNS-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
      type: newRecType,
      name: cleanName,
      value: cleanVal,
      ttl,
      priority: newRecType === 'MX' ? 10 : undefined,
    };
    const nextList = [...dnsRecords, created];
    const res = updateDomainDnsRecords(domain.id, nextList);
    if (!res.ok) {
      setDnsError(res.error || 'Could not update DNS zone.');
      return;
    }
    setDnsRecords(nextList);
    setNewRecName('');
    setNewRecValue('');
    onShowToast(`${created.type} record added for ${domain.domainOrHost}`);
  };

  const handleDeleteDnsRecord = (recId: string) => {
    const nextList = dnsRecords.filter((r) => r.id !== recId);
    const res = updateDomainDnsRecords(domain.id, nextList);
    if (!res.ok) {
      setDnsError(res.error || 'Could not delete DNS record.');
      return;
    }
    setDnsRecords(nextList);
    onShowToast(`DNS record removed from ${domain.domainOrHost}`);
  };

  const handleToggleTransferLock = () => {
    setTransferError('');
    const targetLocked = !lifecycle.effectiveRegistrarLocked;
    const res = updateDomainTransferLock(domain.id, targetLocked);
    if (!res.ok) {
      setTransferError(res.error || 'Unable to change transfer lock.');
      return;
    }
    onShowToast(
      `Domain transfer lock ${targetLocked ? 'enabled (Protected)' : 'disabled (Unlocked for Transfer)'} for ${domain.domainOrHost}`
    );
  };

  const handleRegenerateEpp = () => {
    setTransferError('');
    const res = regenerateDomainEppCode(domain.id);
    if (!res.ok) {
      setTransferError(res.error || 'Unable to regenerate EPP code.');
      return;
    }
    setRevealEpp(true);
    onShowToast(`Generated fresh EPP transfer authorization code for ${domain.domainOrHost}`);
  };

  const handleAssignWhoisContact = (contact: DomainContactAddress) => {
    setSelectedContactId(contact.id);
    setPendingWhoisContact(contact);
    const res = updateDomainWhoisContact(domain.id, contact);
    if (res.ok) {
      onShowToast(
        `WHOIS Registrant updated to ${contact.firstName} ${contact.lastName} (${contact.city}, ${contact.countryName})`
      );
    }
  };

  // Locked Guard Banner when expired
  if (lifecycle.isExpired) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToDomains}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Domains</span>
          </button>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-display text-xl font-bold text-[#0F172A]">
              Domain Management Locked · {domain.domainOrHost}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This domain expired on{' '}
              <span className="font-mono font-bold text-[#DC2626]">
                {lifecycle.dueDateIso}
              </span>{' '}
              (Registered {lifecycle.registeredDateIso}). DNS routing, nameserver updates,
              and EPP transfer exports are automatically locked until the renewal invoice is settled.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {linkedInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoice(linkedInvoice.id)}
                className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Receipt className="w-4 h-4" aria-hidden="true" />
                <span>Renew Domain Now ({formatPrice(linkedInvoice.amountUsd)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenSupportTicket(domain.domainOrHost)}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
              <span>Contact Billing Support</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb + Header Action Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToDomains}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Domains</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenSupportTicket(domain.domainOrHost)}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer whitespace-nowrap"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
              <span>Domain Support</span>
            </button>
            {linkedInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoice(linkedInvoice.id)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  linkedInvoice.status !== 'paid'
                    ? 'bg-[#0E6B63] hover:bg-[#0A534D] text-white'
                    : 'border border-[#E2E8F0] hover:border-[#0E6B63] text-[#0F172A]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {linkedInvoice.status !== 'paid'
                    ? 'Pay Renewal / Activation Invoice'
                    : 'View Domain Invoice'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Main Domain Identity Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/20 flex items-center justify-center text-[#0E6B63] shrink-0">
              <Globe className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-mono text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight break-all">
                  {domain.domainOrHost}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    domain.status === 'active'
                      ? 'text-[#16A34A]'
                      : domain.status === 'pending'
                        ? 'text-[#D97706]'
                        : 'text-[#DC2626]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      domain.status === 'active'
                        ? 'bg-[#16A34A]'
                        : domain.status === 'pending'
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                    }`}
                    aria-hidden="true"
                  />
                  {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {domain.planName} · Order{' '}
                <span className="font-mono text-[#0F172A]">{domain.id}</span> ·{' '}
                {domain.datacenter}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextRenew = !(domain.autoRenew !== false);
                updateClientOrderSettings(domain.id, { autoRenew: nextRenew });
                onShowToast(
                  `Auto-Renew ${nextRenew ? 'enabled' : 'disabled'} for ${domain.domainOrHost}`
                );
              }}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                domain.autoRenew !== false
                  ? 'border-[#0E6B63]/40 bg-[#F2FAF8] text-[#0E6B63]'
                  : 'border-[#E2E8F0] bg-white text-slate-600'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Auto-Renew: {domain.autoRenew !== false ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextPrivacy = !(domain.whoisPrivacy !== false);
                updateClientOrderSettings(domain.id, { whoisPrivacy: nextPrivacy });
                onShowToast(
                  `WHOIS Privacy Protection ${nextPrivacy ? 'enabled' : 'disabled'} for ${domain.domainOrHost}`
                );
              }}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                domain.whoisPrivacy !== false
                  ? 'border-[#16A34A]/35 bg-emerald-50 text-[#16A34A]'
                  : 'border-[#E2E8F0] bg-white text-slate-600'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WHOIS Privacy: {domain.whoisPrivacy !== false ? 'Protected' : 'Public'}</span>
            </button>
          </div>
        </div>

        {/* 4-Column Lifecycle Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Registration Date</span>
              <Calendar className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
            </div>
            <p className="mt-1.5 font-mono-num text-base font-bold text-[#0F172A]">
              {lifecycle.registeredDateIso}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {lifecycle.daysSinceRegistration}{' '}
              {lifecycle.daysSinceRegistration === 1 ? 'day' : 'days'} since registration
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Next Due / Expiration</span>
              <Calendar
                className={`w-3.5 h-3.5 ${
                  lifecycle.daysRemainingUntilDue <= 30 ? 'text-[#D97706]' : 'text-[#0E6B63]'
                }`}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1.5 font-mono-num text-base font-bold text-[#0F172A]">
              {lifecycle.dueDateIso}
            </p>
            <p
              className={`mt-0.5 text-[11px] font-medium ${
                lifecycle.daysRemainingUntilDue <= 30 ? 'text-[#D97706]' : 'text-slate-500'
              }`}
            >
              {lifecycle.daysRemainingUntilDue >= 0
                ? `${lifecycle.daysRemainingUntilDue} days remaining · ${formatPrice(domain.amountUsd)}/${domain.billingCycle}`
                : 'Renewal due immediately'}
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Transfer Lock Status</span>
              {lifecycle.effectiveRegistrarLocked ? (
                <Lock className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
              )}
            </div>
            <p className="mt-1.5 text-sm font-bold text-[#0F172A]">
              {lifecycle.icann60DayLockActive
                ? 'ICANN 60-Day Lock'
                : lifecycle.effectiveRegistrarLocked
                  ? 'Locked (Protected)'
                  : 'Unlocked for Transfer'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {lifecycle.icann60DayLockActive
                ? `Unlocks on ${lifecycle.icannUnlockDateIso} (${lifecycle.daysUntilIcannUnlock}d left)`
                : 'Eligible for unlock & EPP transfer'}
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Nameservers</span>
              <Shield className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
            </div>
            <p className="mt-1.5 font-mono text-xs font-bold text-[#0F172A] truncate">
              {currentNs1}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500 truncate">
              {currentNs2}
            </p>
          </div>
        </div>

        {/* Hostinger-Style Domain Sub-Navigation Tabs */}
        <nav
          aria-label="Domain management sections"
          className="flex items-center gap-1 overflow-x-auto border-t border-[#E2E8F0] pt-3"
        >
          {(
            [
              { id: 'overview', label: 'Domain Overview' },
              { id: 'dns', label: 'DNS & Nameservers' },
              { id: 'transfer', label: 'Transfer Lock & EPP Code' },
              { id: 'whois', label: 'WHOIS Contact & Address' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================== TAB 1: DOMAIN OVERVIEW ========================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Domain Configuration &amp; Lifecycle
              </h2>
              <span className="font-mono text-xs text-slate-500">{domain.id}</span>
            </div>

            <dl className="divide-y divide-[#E2E8F0] text-xs">
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-slate-500">Domain Name</dt>
                <dd className="font-mono font-bold text-[#0F172A]">{domain.domainOrHost}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-slate-500">Registered Date</dt>
                <dd className="font-mono-num font-semibold text-[#0F172A]">
                  {lifecycle.registeredDateIso}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-slate-500">Expiration / Next Due Date</dt>
                <dd className="font-mono-num font-semibold text-[#0F172A]">
                  {lifecycle.dueDateIso} ({lifecycle.daysRemainingUntilDue} days left)
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-slate-500">ICANN 60-Day Lock Window</dt>
                <dd className="font-semibold text-[#0F172A]">
                  {lifecycle.icann60DayLockActive ? (
                    <span className="text-[#D97706]">
                      Locked until {lifecycle.icannUnlockDateIso} ({lifecycle.daysUntilIcannUnlock}d left)
                    </span>
                  ) : (
                    <span className="text-[#16A34A]">
                      60-Day Window Completed ({lifecycle.daysSinceRegistration} days old)
                    </span>
                  )}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-slate-500">Billing Amount &amp; Cycle</dt>
                <dd className="font-mono-num font-bold text-[#0F172A]">
                  {formatPrice(domain.amountUsd)} / {domain.billingCycle}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-slate-500">DNS Zone Records</dt>
                <dd>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dns')}
                    className="font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                  >
                    {dnsRecords.length} active records · Edit DNS Zone
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {/* WHOIS Snapshot Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  Assigned WHOIS Contact
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('whois')}
                  className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                >
                  Change Address
                </button>
              </div>

              {pendingWhoisContact ? (
                <div className="text-xs text-slate-600 space-y-1.5">
                  <p className="font-bold text-[#0F172A]">
                    {pendingWhoisContact.firstName} {pendingWhoisContact.lastName}
                    {pendingWhoisContact.organization
                      ? ` · ${pendingWhoisContact.organization}`
                      : ''}
                  </p>
                  <p>{pendingWhoisContact.addressLine1}</p>
                  <p className="font-medium text-[#0F172A]">
                    {pendingWhoisContact.city}, {pendingWhoisContact.stateProvince},{' '}
                    {pendingWhoisContact.countryName} · {pendingWhoisContact.postalCode}
                  </p>
                  <p className="font-mono text-slate-500">
                    {pendingWhoisContact.email} · {pendingWhoisContact.phone}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 space-y-2">
                  <p>No WHOIS registrant contact assigned to this domain yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('whois')}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0E6B63] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add WHOIS Address</span>
                  </button>
                </div>
              )}
            </div>

            {/* Transfer Security Quick Status */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Transfer Protection &amp; EPP
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lifecycle.icann60DayLockActive
                  ? `Per ICANN policy, ${domain.domainOrHost} is locked until ${lifecycle.icannUnlockDateIso}. After 60 days you can unlock and export your EPP authorization code.`
                  : `${domain.domainOrHost} has cleared the 60-day ICANN lock period. You can toggle the transfer lock and copy your EPP code anytime.`}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('transfer')}
                className="min-h-[38px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                <span>Manage Transfer Lock &amp; EPP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================== TAB 2: DNS & NAMESERVERS ========================== */}
      {activeTab === 'dns' && (
        <div className="space-y-6">
          {/* Nameservers Config */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  Authoritative Nameservers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose CPCloudHost Global Anycast Nameservers or point your domain to custom DNS infrastructure.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#0E6B63]">
                Anycast DNS Included
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  nsMode === 'default'
                    ? 'border-[#0E6B63] bg-[#F2FAF8] ring-1 ring-[#0E6B63]'
                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="domainNsMode"
                    checked={nsMode === 'default'}
                    onChange={() => {
                      setNsMode('default');
                      setNs1('ns1.cpcloudhost.com');
                      setNs2('ns2.cpcloudhost.com');
                      setNsError('');
                    }}
                    className="mt-1 text-[#0E6B63] focus:ring-[#0E6B63]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#0F172A] block">
                      CPCloudHost Anycast Nameservers (Recommended)
                    </span>
                    <span className="text-slate-500 block mt-1">
                      Low-latency global edge DNS with integrated zone editor below.
                    </span>
                    <span className="mt-1.5 block font-mono font-semibold text-[#0E6B63]">
                      ns1.cpcloudhost.com · ns2.cpcloudhost.com
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  nsMode === 'custom'
                    ? 'border-[#0E6B63] bg-[#F2FAF8] ring-1 ring-[#0E6B63]'
                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="domainNsMode"
                    checked={nsMode === 'custom'}
                    onChange={() => {
                      setNsMode('custom');
                      setNsError('');
                    }}
                    className="mt-1 text-[#0E6B63] focus:ring-[#0E6B63]"
                  />
                  <div className="text-xs w-full">
                    <span className="font-bold text-[#0F172A] block">
                      Change to Custom Nameservers
                    </span>
                    <span className="text-slate-500 block mt-1">
                      Delegate DNS resolution to Cloudflare, Route53, or your VPS nameservers.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {nsMode === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Nameserver 1
                  </label>
                  <input
                    type="text"
                    value={ns1}
                    onChange={(e) => setNs1(e.target.value)}
                    placeholder="ns1.example.com"
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Nameserver 2
                  </label>
                  <input
                    type="text"
                    value={ns2}
                    onChange={(e) => setNs2(e.target.value)}
                    placeholder="ns2.example.com"
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>
              </div>
            )}

            {nsError && (
              <p className="text-xs font-semibold text-[#DC2626]">{nsError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNameservers}
                className="min-h-[40px] px-5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
              >
                Save Nameservers
              </button>
            </div>
          </div>

          {/* DNS Records Editor */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                DNS Zone Records Editor
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add or update A, AAAA, CNAME, MX, and TXT records for{' '}
                <span className="font-mono text-[#0F172A]">{domain.domainOrHost}</span>.
              </p>
            </div>

            <form
              onSubmit={handleAddDnsRecord}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"
            >
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Type
                </label>
                <select
                  value={newRecType}
                  onChange={(e) =>
                    setNewRecType(e.target.value as DomainDnsRecord['type'])
                  }
                  className="w-full min-h-[38px] px-2.5 py-1.5 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                  <option value="TXT">TXT</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Host / Name
                </label>
                <input
                  type="text"
                  value={newRecName}
                  onChange={(e) => setNewRecName(e.target.value)}
                  placeholder="@ or sub"
                  className="w-full min-h-[38px] px-3 py-1.5 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Points To / Value
                </label>
                <input
                  type="text"
                  value={newRecValue}
                  onChange={(e) => {
                    setNewRecValue(e.target.value);
                    if (dnsError) setDnsError('');
                  }}
                  placeholder="185.199.110.42 or target"
                  className="w-full min-h-[38px] px-3 py-1.5 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  TTL
                </label>
                <input
                  type="number"
                  min={60}
                  value={newRecTtl}
                  onChange={(e) => setNewRecTtl(e.target.value)}
                  className="w-full min-h-[38px] px-2 py-1.5 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full min-h-[38px] inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Record</span>
                </button>
              </div>
            </form>

            {dnsError && (
              <p className="text-xs font-semibold text-[#DC2626]">{dnsError}</p>
            )}

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Content / Value</th>
                    <th className="py-2.5 px-4">TTL</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {dnsRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0E6B63]">
                        {rec.type}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#0F172A]">
                        {rec.name}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700 break-all">
                        {rec.value}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num text-slate-500">
                        {rec.ttl}s
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDnsRecord(rec.id)}
                          className="text-slate-400 hover:text-[#DC2626] cursor-pointer"
                          aria-label={`Delete ${rec.type} record ${rec.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* ========================== TAB 3: TRANSFER LOCK & EPP CODE (60-DAY POLICY) ========================== */}
      {activeTab === 'transfer' && (
        <div className="space-y-6">
          {/* ICANN 60-Day Registration/Transfer Lock Progress Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                  {lifecycle.icann60DayLockActive ? (
                    <Lock className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                  )}
                  <span>ICANN 60-Day Registration / Transfer Lock</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Domains registered or transferred are subject to a mandatory{' '}
                  <strong>{ICANN_TRANSFER_LOCK_DAYS}-day security lock</strong>. Transfer
                  unlock and EPP Authorization Code export activate automatically after 60 days.
                </p>
              </div>
              <span
                className={`font-mono-num text-xs font-bold whitespace-nowrap ${
                  lifecycle.icann60DayLockActive ? 'text-[#D97706]' : 'text-[#16A34A]'
                }`}
              >
                {Math.min(lifecycle.daysSinceRegistration, ICANN_TRANSFER_LOCK_DAYS)} /{' '}
                {ICANN_TRANSFER_LOCK_DAYS} Days
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    lifecycle.icann60DayLockActive ? 'bg-[#D97706]' : 'bg-[#16A34A]'
                  }`}
                  style={{ width: `${lifecycle.icannProgressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono-num">
                <span>Registered: {lifecycle.registeredDateIso}</span>
                <span>
                  {lifecycle.icann60DayLockActive
                    ? `Eligible to Unlock on ${lifecycle.icannUnlockDateIso} (${lifecycle.daysUntilIcannUnlock} days remaining)`
                    : `Eligible since ${lifecycle.icannUnlockDateIso}`}
                </span>
              </div>
            </div>

            {/* Domain Transfer Lock Toggle Row */}
            <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                  {lifecycle.effectiveRegistrarLocked ? (
                    <Lock className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                  ) : (
                    <Unlock className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  )}
                  <span>
                    Registrar Transfer Lock:{' '}
                    {lifecycle.effectiveRegistrarLocked ? 'LOCKED (ON)' : 'UNLOCKED (OFF)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {lifecycle.icann60DayLockActive
                    ? `Locked automatically by ICANN 60-day rule until ${lifecycle.icannUnlockDateIso}.`
                    : lifecycle.effectiveRegistrarLocked
                      ? 'Transfer lock prevents unauthorized outbound domain transfers. Unlock only when moving registrar.'
                      : 'Domain is unlocked and ready for outbound registrar transfer using your EPP code below.'}
                </p>
              </div>

              <button
                type="button"
                disabled={lifecycle.icann60DayLockActive}
                onClick={handleToggleTransferLock}
                className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  lifecycle.icann60DayLockActive
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : lifecycle.effectiveRegistrarLocked
                      ? 'bg-[#0F172A] hover:bg-[#D97706] text-white cursor-pointer'
                      : 'bg-[#0E6B63] hover:bg-[#0A534D] text-white cursor-pointer'
                }`}
              >
                {lifecycle.icann60DayLockActive ? (
                  <>
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Locked for {lifecycle.daysUntilIcannUnlock}d</span>
                  </>
                ) : lifecycle.effectiveRegistrarLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Unlock Domain Transfer</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Re-Lock Domain</span>
                  </>
                )}
              </button>
            </div>

            {transferError && (
              <p
                role="alert"
                className="text-xs font-semibold text-[#DC2626] flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{transferError}</span>
              </p>
            )}
          </div>

          {/* EPP / Authorization Code Vault */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  <span>EPP / Transfer Authorization Code</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Required by receiving registrars to authorize an outbound transfer once Transfer Lock is turned OFF.
                </p>
              </div>
            </div>

            {lifecycle.icann60DayLockActive ? (
              <div className="border border-amber-200 bg-amber-50/70 rounded-xl p-4 flex items-start gap-3 text-xs">
                <Lock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-bold text-[#0F172A]">
                    EPP Code Locked During 60-Day Period
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Your EPP secret key is safely held in escrow and will automatically unlock
                    for copy/export on{' '}
                    <span className="font-mono font-bold text-[#0F172A]">
                      {lifecycle.icannUnlockDateIso}
                    </span>{' '}
                    ({lifecycle.daysUntilIcannUnlock} days remaining).
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Secret EPP Auth Key
                  </span>
                  <span className="font-mono text-base font-bold text-[#0F172A] tracking-wider">
                    {revealEpp ? effectiveEppCode : '••••-••••-••••-••••'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRevealEpp((prev) => !prev)}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    {revealEpp ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reveal EPP</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyValue('epp', effectiveEppCode, 'EPP Authorization Code')}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copiedKey === 'epp' ? 'Copied' : 'Copy Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateEpp}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================== TAB 4: WHOIS CONTACT & ADDRESS BOOK ========================== */}
      {activeTab === 'whois' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <DomainContactAddressSelector
            selectedContactId={selectedContactId}
            onSelectContact={handleAssignWhoisContact}
            title={`WHOIS Registrant Contact for ${domain.domainOrHost}`}
            subtitle="Select an existing saved address or add a new WHOIS contact profile. Saved profiles are reused automatically across all domain orders."
            onSaveNotice={onShowToast}
          />
        </div>
      )}
    </div>
  );
};
