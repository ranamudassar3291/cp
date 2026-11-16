import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Globe,
  KeyRound,
  PauseCircle,
  PlayCircle,
  Search,
  Server,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  OrderBillingPeriod,
  OrderStatus,
  PlatformOrder,
  deriveServiceControlPanelAccess,
  usePlatform,
} from '../../context/PlatformContext';
import { isDomainOrderRecord } from '../../utils/domainLifecycle';
import { SearchableClientSelect } from './SearchableClientSelect';

interface AdminHostingAccountsViewProps {
  onShowToast: (tone: 'success' | 'error' | 'info', message: string) => void;
  onInspectInOrders?: (orderId: string) => void;
}

const HOSTING_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

function getBadgeTone(status: OrderStatus): string {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'suspended') return 'bg-orange-50 text-orange-700 border-orange-200';
  if (status === 'terminated' || status === 'cancelled')
    return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export const AdminHostingAccountsView: React.FC<AdminHostingAccountsViewProps> = ({
  onShowToast,
  onInspectInOrders,
}) => {
  const {
    orders,
    users,
    provisioningModules,
    changeServiceControlPanelPassword,
    launchControlPanelSso,
    adminSuspendService,
    adminUnsuspendService,
    adminTerminateService,
    adminUpdateOrderDetails,
    adminTransferOrderToClient,
    updateOrderStatus,
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Manage drawer/modal state
  const [newCpPass, setNewCpPass] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('Overdue invoice / Policy hold');
  const [terminateReason, setTerminateReason] = useState('Account terminated by Admin');
  const [transferTargetUserId, setTransferTargetUserId] = useState('');

  // Editable service fields inside manager modal
  const [editStatus, setEditStatus] = useState<OrderStatus>('active');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAmountUsd, setEditAmountUsd] = useState('');
  const [editRenewUsd, setEditRenewUsd] = useState('');
  const [editBillingCycle, setEditBillingCycle] =
    useState<OrderBillingPeriod>('Yearly');
  const [editSiteUrl, setEditSiteUrl] = useState('');
  const [editServerIp, setEditServerIp] = useState('');
  const [editServerModuleId, setEditServerModuleId] = useState('');
  const [editComputeOs, setEditComputeOs] = useState('');
  const [editCpUsername, setEditCpUsername] = useState('');

  const hostingAccounts = useMemo(
    () => orders.filter((o) => !isDomainOrderRecord(o)),
    [orders]
  );

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return hostingAccounts.filter((ord) => {
      if (statusFilter !== 'all' && ord.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.clientName.toLowerCase().includes(q) ||
        ord.clientEmail.toLowerCase().includes(q) ||
        ord.domainOrHost.toLowerCase().includes(q) ||
        ord.planName.toLowerCase().includes(q) ||
        ord.productType.toLowerCase().includes(q) ||
        (ord.serverIp || '').toLowerCase().includes(q)
      );
    });
  }, [hostingAccounts, searchQuery, statusFilter]);

  const selectedOrder: PlatformOrder | null = useMemo(
    () => hostingAccounts.find((o) => o.id === selectedId) || null,
    [hostingAccounts, selectedId]
  );

  const openManageModal = (ord: PlatformOrder) => {
    const cp = deriveServiceControlPanelAccess(ord);
    setSelectedId(ord.id);
    setEditStatus(ord.status);
    setEditDueDate(ord.nextDueDate || '');
    setEditAmountUsd(String(ord.amountUsd));
    setEditRenewUsd(
      ord.customRenewPriceUsd !== undefined ? String(ord.customRenewPriceUsd) : ''
    );
    setEditBillingCycle(ord.billingCycle);
    setEditSiteUrl(ord.siteUrl || `https://${ord.domainOrHost}`);
    setEditServerIp(ord.serverIp || cp.serverIp);
    setEditServerModuleId(ord.serverModuleId || '');
    setEditComputeOs(ord.computeOs || '');
    setEditCpUsername(cp.cpUsername);
    setNewCpPass('');
    setTransferTargetUserId('');
  };

  const counts = useMemo(() => {
    return {
      total: hostingAccounts.length,
      active: hostingAccounts.filter((o) => o.status === 'active').length,
      pending: hostingAccounts.filter((o) => o.status === 'pending').length,
      suspended: hostingAccounts.filter((o) => o.status === 'suspended').length,
      terminated: hostingAccounts.filter((o) => o.status === 'terminated').length,
    };
  }, [hostingAccounts]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const parsedAmt = Number(editAmountUsd);
    const parsedRenew =
      editRenewUsd.trim() === '' ? undefined : Number(editRenewUsd);

    const res = adminUpdateOrderDetails(selectedOrder.id, {
      status: editStatus,
      nextDueDate: editDueDate.trim() || undefined,
      amountUsd: Number.isFinite(parsedAmt) ? parsedAmt : selectedOrder.amountUsd,
      customRenewPriceUsd:
        parsedRenew !== undefined && Number.isFinite(parsedRenew)
          ? parsedRenew
          : undefined,
      billingCycle: editBillingCycle,
      siteUrl: editSiteUrl.trim() || undefined,
      serverIp: editServerIp.trim() || undefined,
      serverModuleId: editServerModuleId || undefined,
      computeOs: editComputeOs.trim() || undefined,
      cpUsername: editCpUsername.trim() || undefined,
    });
    if (!res.ok) {
      onShowToast('error', res.error || 'Could not update hosting account.');
      return;
    }
    onShowToast('success', `Saved configuration for ${selectedOrder.domainOrHost}.`);
  };

  const handleDirectLogin = async (ord: PlatformOrder) => {
    setActionBusy(`sso-${ord.id}`);
    const res = await launchControlPanelSso(ord.id);
    setActionBusy(null);
    if (!res.ok) {
      onShowToast('error', res.error || 'SSO launch failed.');
      return;
    }
    onShowToast('success', res.message || `SSO link generated: ${res.url}`);
  };

  const handlePasswordChange = async () => {
    if (!selectedOrder) return;
    if (newCpPass.trim().length < 8) {
      onShowToast('error', 'Enter a password of at least 8 characters.');
      return;
    }
    setActionBusy('passwd');
    const res = await changeServiceControlPanelPassword(
      selectedOrder.id,
      newCpPass.trim()
    );
    setActionBusy(null);
    if (!res.ok) {
      onShowToast('error', res.error || 'Password update failed.');
      return;
    }
    setNewCpPass('');
    onShowToast('success', res.message || 'Control panel password updated.');
  };

  const handleSuspend = async (ord: PlatformOrder) => {
    setActionBusy(`suspend-${ord.id}`);
    const res = await adminSuspendService(ord.id, suspendReason);
    setActionBusy(null);
    if (!res.ok) {
      onShowToast('error', res.error || 'Suspend failed.');
      return;
    }
    setEditStatus('suspended');
    onShowToast('info', res.message || `${ord.domainOrHost} suspended.`);
  };

  const handleUnsuspend = async (ord: PlatformOrder) => {
    setActionBusy(`unsuspend-${ord.id}`);
    const res = await adminUnsuspendService(ord.id);
    setActionBusy(null);
    if (!res.ok) {
      onShowToast('error', res.error || 'Unsuspend failed.');
      return;
    }
    setEditStatus('active');
    onShowToast('success', res.message || `${ord.domainOrHost} activated.`);
  };

  const handleTerminate = async (ord: PlatformOrder) => {
    setActionBusy(`terminate-${ord.id}`);
    const res = await adminTerminateService(ord.id, terminateReason);
    setActionBusy(null);
    if (!res.ok) {
      onShowToast('error', res.error || 'Termination failed.');
      return;
    }
    setEditStatus('terminated');
    onShowToast('info', res.message || `${ord.domainOrHost} terminated.`);
  };

  const handleTransferOwnership = () => {
    if (!selectedOrder || !transferTargetUserId) {
      onShowToast('error', 'Select a destination client first.');
      return;
    }
    const res = adminTransferOrderToClient(selectedOrder.id, transferTargetUserId);
    if (!res.ok) {
      onShowToast('error', res.error || 'Transfer failed.');
      return;
    }
    setTransferTargetUserId('');
    onShowToast(
      'success',
      `Service ${selectedOrder.domainOrHost} transferred cleanly with dates & invoices.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            Client Hosting Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage provisioned cPanel, StackCP, Windows IIS, Reseller WHM, Free Trial, VPS, and n8n hosting containers from one workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Accounts', value: counts.total, tone: 'text-slate-900' },
          { label: 'Active', value: counts.active, tone: 'text-emerald-700' },
          { label: 'Pending', value: counts.pending, tone: 'text-amber-700' },
          { label: 'Suspended', value: counts.suspended, tone: 'text-orange-700' },
          { label: 'Terminated', value: counts.terminated, tone: 'text-red-700' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3.5"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {kpi.label}
            </div>
            <div className={`font-mono text-2xl font-extrabold mt-1 tabular-nums ${kpi.tone}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hostname, client name, email, IP, or plan..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0E6B63]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'active', 'pending', 'suspended', 'terminated', 'cancelled'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Account / Hostname</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Plan &amp; Module</th>
                <th className="py-3 px-4">IP / Username</th>
                <th className="py-3 px-4">Price / Renew</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No hosting accounts match your current filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((ord) => {
                  const cp = deriveServiceControlPanelAccess(ord);
                  const mod = provisioningModules.find(
                    (m) => m.id === ord.serverModuleId
                  );
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {ord.domainOrHost}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{ord.id}</span>
                          {ord.siteUrl && (
                            <span className="inline-flex items-center gap-1 text-[#0E6B63] truncate max-w-[180px]">
                              <Globe className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{ord.siteUrl}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {ord.clientName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.clientEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {ord.planName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.productType} · {mod?.name || ord.datacenter}
                          {ord.computeOs ? ` · ${ord.computeOs}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-slate-900">{cp.serverIp}</div>
                        <div className="text-slate-500">user: {cp.cpUsername}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <div className="font-bold text-slate-900">
                          ${ord.amountUsd.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Renew:{' '}
                          {ord.customRenewPriceUsd !== undefined
                            ? `$${ord.customRenewPriceUsd.toFixed(2)}`
                            : 'Catalog'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-700">
                        {ord.nextDueDate || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-bold capitalize ${getBadgeTone(
                            ord.status
                          )}`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDirectLogin(ord)}
                            disabled={actionBusy === `sso-${ord.id}`}
                            title="Direct Control Panel Login"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>SSO</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openManageModal(ord)}
                            className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Manage
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

      {/* Manage Hosting Account Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  <h2 className="font-display text-lg font-extrabold text-slate-900">
                    {selectedOrder.domainOrHost}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-bold capitalize ${getBadgeTone(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedOrder.id} · {selectedOrder.clientName} ({selectedOrder.clientEmail}) ·{' '}
                  {selectedOrder.planName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onInspectInOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      const oid = selectedOrder.id;
                      setSelectedId(null);
                      onInspectInOrders(oid);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Open in Orders
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Control Plane Bar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectLogin(selectedOrder)}
                    disabled={actionBusy === `sso-${selectedOrder.id}`}
                    className="px-3.5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Direct Control Panel Login</span>
                  </button>

                  {selectedOrder.status !== 'active' && (
                    <button
                      type="button"
                      onClick={() => handleUnsuspend(selectedOrder)}
                      disabled={actionBusy === `unsuspend-${selectedOrder.id}`}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {selectedOrder.status === 'suspended'
                          ? 'Unsuspend Account'
                          : 'Activate Account'}
                      </span>
                    </button>
                  )}

                  {selectedOrder.status !== 'suspended' &&
                    selectedOrder.status !== 'terminated' && (
                      <button
                        type="button"
                        onClick={() => handleSuspend(selectedOrder)}
                        disabled={actionBusy === `suspend-${selectedOrder.id}`}
                        className="px-3.5 py-2 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Suspend</span>
                      </button>
                    )}

                  {selectedOrder.status !== 'terminated' && (
                    <button
                      type="button"
                      onClick={() => handleTerminate(selectedOrder)}
                      disabled={actionBusy === `terminate-${selectedOrder.id}`}
                      className="px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Terminate</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-600">
                  User: <strong>{editCpUsername}</strong> · IP:{' '}
                  <strong>{editServerIp}</strong>
                </div>
              </div>

              {/* Reason Inputs for Suspend / Terminate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Suspension Reason (if suspending)
                  </label>
                  <input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Termination Reason (if terminating)
                  </label>
                  <input
                    type="text"
                    value={terminateReason}
                    onChange={(e) => setTerminateReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Service Configuration Form */}
              <form
                onSubmit={handleSaveDetails}
                className="rounded-xl border border-slate-200 p-5 space-y-4"
              >
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  <span>Account Status, Billing Rate, Server &amp; Site Settings</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Account Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => {
                        const next = e.target.value as OrderStatus;
                        setEditStatus(next);
                        updateOrderStatus(selectedOrder.id, next);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white text-slate-900"
                    >
                      {HOSTING_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={editBillingCycle}
                      onChange={(e) =>
                        setEditBillingCycle(e.target.value as OrderBillingPeriod)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white text-slate-900"
                    >
                      {['1 Month', 'Monthly', '1 Year', 'Yearly', '2 Years', '3 Years'].map(
                        (cy) => (
                          <option key={cy} value={cy}>
                            {cy}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Current Plan Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmountUsd}
                      onChange={(e) => setEditAmountUsd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Custom Renewal Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editRenewUsd}
                      onChange={(e) => setEditRenewUsd(e.target.value)}
                      placeholder="Leave empty for catalog rate"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Site Link / URL
                    </label>
                    <input
                      type="text"
                      value={editSiteUrl}
                      onChange={(e) => setEditSiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Server Node / Module
                    </label>
                    <select
                      value={editServerModuleId}
                      onChange={(e) => setEditServerModuleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white text-slate-900"
                    >
                      <option value="">Manual / Default Cluster</option>
                      {provisioningModules.map((mod) => (
                        <option key={mod.id} value={mod.id}>
                          {mod.name} ({mod.hostname})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Assigned Server IP
                    </label>
                    <input
                      type="text"
                      value={editServerIp}
                      onChange={(e) => setEditServerIp(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      CP Username{' '}
                      {(selectedOrder.productType === 'Unmanaged VPS' ||
                        selectedOrder.productType === 'n8n Hosting') &&
                        '(Locked: root)'}
                    </label>
                    <input
                      type="text"
                      value={editCpUsername}
                      readOnly={
                        selectedOrder.productType === 'Unmanaged VPS' ||
                        selectedOrder.productType === 'n8n Hosting'
                      }
                      onChange={(e) => setEditCpUsername(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono ${
                        selectedOrder.productType === 'Unmanaged VPS' ||
                        selectedOrder.productType === 'n8n Hosting'
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          : 'bg-white text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {(selectedOrder.productType === 'Unmanaged VPS' ||
                  selectedOrder.productType === 'n8n Hosting') && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Compute OS / Application Image
                    </label>
                    <input
                      type="text"
                      value={editComputeOs}
                      onChange={(e) => setEditComputeOs(e.target.value)}
                      placeholder="n8n Docker Stack / Ubuntu 24.04 LTS"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                  >
                    Save Hosting Account Changes
                  </button>
                </div>
              </form>

              {/* Password Reset & Ownership Transfer Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Change CP Password */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    <span>Change Control Panel / Root Password</span>
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCpPass}
                      onChange={(e) => setNewCpPass(e.target.value)}
                      placeholder="New password (min 8 chars)"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={actionBusy === 'passwd'}
                      className="px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Admin Ownership Transfer */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    <span>Transfer Service to Another Client</span>
                  </h4>
                  <SearchableClientSelect
                    users={users}
                    selectedUserId={transferTargetUserId}
                    excludeEmail={selectedOrder.clientEmail}
                    label=""
                    placeholder="Search client by name or email..."
                    onSelect={(u) => setTransferTargetUserId(u.id)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      Preserves due date &amp; invoices
                    </span>
                    <button
                      type="button"
                      onClick={handleTransferOwnership}
                      disabled={!transferTargetUserId}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#0E6B63] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                    >
                      Transfer Service
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
