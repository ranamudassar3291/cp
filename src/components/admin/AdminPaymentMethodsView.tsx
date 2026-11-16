import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  CreditCard,
  Globe,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  PaymentGatewayKind,
  PaymentMethodConfig,
  usePlatform,
} from '../../context/PlatformContext';

interface AdminPaymentMethodsViewProps {
  onShowToast: (msg: string) => void;
}

function gatewayBadgeLabel(kind: PaymentGatewayKind): string {
  switch (kind) {
    case 'easypaisa':
      return 'Easypaisa';
    case 'jazzcash':
      return 'JazzCash';
    case 'bank_transfer':
      return 'Bank Wire';
    case 'card':
      return 'Card';
    case 'paypal':
      return 'PayPal';
    default:
      return 'Custom';
  }
}

function GatewayIcon({ kind }: { kind: PaymentGatewayKind }) {
  if (kind === 'easypaisa' || kind === 'jazzcash') {
    return <Smartphone className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  if (kind === 'bank_transfer') {
    return <Building2 className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  if (kind === 'paypal') {
    return <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  if (kind === 'card') {
    return <CreditCard className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
  }
  return <Wallet className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />;
}

export const AdminPaymentMethodsView: React.FC<AdminPaymentMethodsViewProps> = ({
  onShowToast,
}) => {
  const {
    paymentMethods,
    savePaymentMethod,
    createPaymentMethod,
    deletePaymentMethod,
    togglePaymentMethod,
  } = usePlatform();

  const [selectedId, setSelectedId] = useState<string>(
    paymentMethods[0]?.id || 'pm-easypaisa'
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const selectedMethod: PaymentMethodConfig | null = useMemo(
    () =>
      paymentMethods.find((m) => m.id === selectedId) ??
      paymentMethods[0] ??
      null,
    [paymentMethods, selectedId]
  );

  // Selected gateway editor fields
  const [editName, setEditName] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);
  const [editTitle, setEditTitle] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editIban, setEditIban] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editCurrencyHint, setEditCurrencyHint] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editRequiresTid, setEditRequiresTid] = useState(true);
  const [editAutoActivate, setEditAutoActivate] = useState(false);

  useEffect(() => {
    if (!selectedMethod) return;
    setEditName(selectedMethod.name);
    setEditEnabled(selectedMethod.enabled);
    setEditTitle(selectedMethod.accountTitle);
    setEditNumber(selectedMethod.accountNumber);
    setEditIban(selectedMethod.ibanOrRouting);
    setEditBankName(selectedMethod.bankOrProviderName);
    setEditCurrencyHint(selectedMethod.currencyHint);
    setEditInstructions(selectedMethod.instructions);
    setEditRequiresTid(selectedMethod.requiresTransactionId);
    setEditAutoActivate(selectedMethod.autoActivate);
  }, [selectedMethod]);

  // Create custom gateway fields
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<PaymentGatewayKind>('custom');
  const [newTitle, setNewTitle] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newIban, setNewIban] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newRequiresTid, setNewRequiresTid] = useState(true);
  const [newAutoActivate, setNewAutoActivate] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleSaveSelected = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;
    const res = savePaymentMethod(selectedMethod.id, {
      name: editName.trim() || selectedMethod.name,
      enabled: editEnabled,
      accountTitle: editTitle.trim(),
      accountNumber: editNumber.trim(),
      ibanOrRouting: editIban.trim(),
      bankOrProviderName: editBankName.trim(),
      currencyHint: editCurrencyHint.trim(),
      instructions: editInstructions.trim(),
      requiresTransactionId: editRequiresTid,
      autoActivate: editAutoActivate,
    });
    if (!res.ok) {
      onShowToast(res.error || 'Could not update payment method.');
      return;
    }
    onShowToast(`${editName.trim() || selectedMethod.name} saved & synced to Client Billing`);
  };

  const handleCreateGateway = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createPaymentMethod({
      name: newName,
      kind: newKind,
      accountTitle: newTitle,
      accountNumber: newNumber,
      ibanOrRouting: newIban,
      bankOrProviderName: newBankName,
      instructions: newInstructions,
      requiresTransactionId: newRequiresTid,
      autoActivate: newAutoActivate,
      enabled: true,
    });
    if (!res.ok || !res.method) {
      setCreateError(res.error || 'Could not add payment method.');
      return;
    }
    setCreateError('');
    setShowCreateForm(false);
    setNewName('');
    setNewTitle('');
    setNewNumber('');
    setNewIban('');
    setNewBankName('');
    setNewInstructions('');
    setSelectedId(res.method.id);
    onShowToast(`${res.method.name} added to active payment methods`);
  };

  const enabledCount = paymentMethods.filter((m) => m.enabled).length;
  const walletCount = paymentMethods.filter(
    (m) => m.kind === 'easypaisa' || m.kind === 'jazzcash' || m.kind === 'bank_transfer'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0F172A]">
            Payment Gateways &amp; Local Wallets
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Configure Easypaisa, JazzCash, Bank Wire IBAN, Card, and PayPal account details. Active methods appear immediately in Client Billing Checkout &amp; PDF Invoices.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block pr-3 border-r border-[#E2E8F0]">
            <span className="text-[11px] font-medium text-slate-500 block">
              Active Gateways
            </span>
            <span className="font-mono text-sm font-bold text-[#0F172A] tabular-nums">
              {enabledCount} / {paymentMethods.length} ({walletCount} Local/Wire)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showCreateForm ? 'Close Form' : 'Add Custom Method'}</span>
          </button>
        </div>
      </div>

      {/* Optional Add Custom Payment Method Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateGateway}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              Add Custom Payment Method / Wallet
            </h3>
            <span className="text-[11px] text-slate-500">
              Synced immediately to Client Checkout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Gateway Display Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. SadaPay / Nayapay / USDT TRC20"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Gateway Category
              </label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as PaymentGatewayKind)}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
              >
                <option value="custom">Custom Wallet / Crypto</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank_transfer">Bank Wire / IBAN</option>
                <option value="card">Credit / Debit Card</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Account Title / Holder Name *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Muhammad Mudassar"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Mobile Wallet / Account Number *
              </label>
              <input
                type="text"
                required
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="03XX-XXXXXXX or Wallet ID"
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                IBAN / Routing / Network
              </label>
              <input
                type="text"
                value={newIban}
                onChange={(e) => setNewIban(e.target.value)}
                placeholder="Optional IBAN or TRC20"
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Bank / Provider Name
              </label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="Provider Name"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Checkout Instructions for Client
            </label>
            <textarea
              rows={2}
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              placeholder="Explain how the client sends payment and submits TID..."
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequiresTid}
                  onChange={(e) => setNewRequiresTid(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Require Transaction ID (TID)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAutoActivate}
                  onChange={(e) => setNewAutoActivate(e.target.checked)}
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Auto-Mark Paid (Skip Manual Verification)</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              {createError && (
                <span className="text-xs font-semibold text-[#DC2626] mr-2">
                  {createError}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
              >
                Save Custom Gateway
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Split Workspace: Gateway Directory (Left) + Account Details Editor & Client Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0F172A]">
              Configured Payment Methods ({paymentMethods.length})
            </span>
            <span className="text-[11px] text-slate-500">Click to edit details</span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {paymentMethods.map((method) => {
              const active = selectedMethod?.id === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedId(method.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    active ? 'bg-[#F2FAF8]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        <GatewayIcon kind={method.kind} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-sm font-bold text-[#0F172A] truncate">
                            {method.name}
                          </p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {gatewayBadgeLabel(method.kind)}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#0E6B63] mt-0.5 truncate">
                          {method.accountNumber || 'No account # set'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {method.accountTitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePaymentMethod(method.id);
                        onShowToast(
                          `${method.name} ${!method.enabled ? 'enabled' : 'disabled'}`
                        );
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        method.enabled
                          ? 'text-[#16A34A] bg-[#16A34A]/10 hover:bg-[#16A34A]/20'
                          : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {method.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Editor & Client Checkout Preview */}
        {selectedMethod && (
          <div className="xl:col-span-7 space-y-5">
            <form
              onSubmit={handleSaveSelected}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0E6B63]">
                    {gatewayBadgeLabel(selectedMethod.kind)} Configuration
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#0F172A] mt-0.5">
                    {selectedMethod.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Last updated: {selectedMethod.updatedAtUtc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedMethod.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = deletePaymentMethod(selectedMethod.id);
                        if (res.ok) {
                          setSelectedId(paymentMethods[0]?.id || 'pm-easypaisa');
                          onShowToast(`${selectedMethod.name} removed`);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC2626] border border-[#DC2626]/30 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save Account Details</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Display Name (Shown to Clients)
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Bank / Wallet Network
                  </label>
                  <input
                    type="text"
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Account Title / Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Muhammad Mudassar"
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {selectedMethod.kind === 'easypaisa' || selectedMethod.kind === 'jazzcash'
                      ? 'Mobile Wallet Number (03XX-XXXXXXX)'
                      : 'Account Number / Receiver ID'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    IBAN / SWIFT / Provider Reference
                  </label>
                  <input
                    type="text"
                    value={editIban}
                    onChange={(e) => setEditIban(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Supported Currency Hint
                  </label>
                  <input
                    type="text"
                    value={editCurrencyHint}
                    onChange={(e) => setEditCurrencyHint(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Client Checkout Instructions
                </label>
                <textarea
                  rows={3}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs leading-relaxed border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editEnabled}
                    onChange={(e) => setEditEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span className="font-semibold text-[#0F172A]">Gateway Active</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRequiresTid}
                    onChange={(e) => setEditRequiresTid(e.target.checked)}
                    className="rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span className="font-semibold text-[#0F172A]">Require TID Input</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAutoActivate}
                    onChange={(e) => setEditAutoActivate(e.target.checked)}
                    className="rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span className="font-semibold text-[#0F172A]">Auto-Mark Paid</span>
                </label>
              </div>
            </form>

            {/* Live Client Billing Preview */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">
                  Client Checkout Preview (How clients see {editName || selectedMethod.name})
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6B63]">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{editAutoActivate ? 'Instant Activation' : 'Manual Admin Verification'}</span>
                </span>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display font-bold text-sm text-[#0F172A]">
                    {editName}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {editCurrencyHint}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Account Title</span>
                    <span className="font-semibold text-[#0F172A]">
                      {editTitle || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Account / Wallet Number</span>
                    <span className="font-mono font-bold text-[#0E6B63]">
                      {editNumber || '—'}
                    </span>
                  </div>
                </div>
                {editIban && (
                  <div className="pt-1">
                    <span className="text-slate-500 text-[11px]">IBAN / Network: </span>
                    <span className="font-mono text-[#0F172A]">{editIban}</span>
                  </div>
                )}
                <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-200/70">
                  {editInstructions}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
