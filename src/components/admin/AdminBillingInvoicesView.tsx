import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Edit3,
  Palette,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import {
  InvoiceLineItem,
  InvoiceStatus,
  PlatformInvoice,
  PlatformOrder,
  usePlatform,
} from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';

const PRODUCT_TYPE_OPTIONS: InvoiceLineItem['productType'][] = [
  'cPanel Hosting',
  'Shared Cloud',
  'Managed WordPress',
  'Windows Hosting',
  'Reseller Hosting',
  'Unmanaged VPS',
  'n8n Hosting',
  'Domain Registration',
  'Domain Transfer',
  'Custom Service',
  'Setup / Add-on',
];

const BILLING_CYCLE_OPTIONS: InvoiceLineItem['billingCycle'][] = [
  '1 Month',
  '1 Year',
  '2 Years',
  '4 Years',
  'Monthly',
  'Yearly',
  '5-Year',
  'One-Time',
];

const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export function invoiceStatusBadgeStyle(status: InvoiceStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'paid':
      return {
        label: 'PAID',
        className: 'text-[#16A34A] bg-[#16A34A]/10',
      };
    case 'pending':
      return {
        label: 'PENDING',
        className: 'text-[#D97706] bg-[#D97706]/10',
      };
    case 'overdue':
      return {
        label: 'OVERDUE',
        className: 'text-[#DC2626] bg-[#DC2626]/10',
      };
    case 'cancelled':
      return {
        label: 'CANCELLED',
        className: 'text-slate-600 bg-slate-100',
      };
    case 'refunded':
      return {
        label: 'REFUNDED',
        className: 'text-slate-600 bg-slate-100',
      };
    default:
      return {
        label: 'UNPAID',
        className: 'text-[#D97706] bg-[#D97706]/10',
      };
  }
}

interface AdminInvoiceEditorProps {
  invoice: PlatformInvoice | null; // null = create standalone invoice
  defaultClientEmail?: string;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminInvoiceEditor: React.FC<AdminInvoiceEditorProps> = ({
  invoice,
  defaultClientEmail = '',
  onClose,
  onShowToast,
}) => {
  const {
    users,
    paymentMethods,
    invoiceTemplateConfig,
    adminUpdateInvoiceFull,
    adminCreateStandaloneInvoice,
    adminProcessRefund,
  } = usePlatform();
  const { formatPrice, currency, rate } = useCurrency();

  const isCreating = invoice === null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextMonthIso = new Date(Date.now() + 30 * 86400 * 1000)
    .toISOString()
    .slice(0, 10);

  const clientUsers = useMemo(
    () => users.filter((u) => u.role !== 'admin'),
    [users]
  );

  const [clientEmail, setClientEmail] = useState(
    invoice?.clientEmail || defaultClientEmail || clientUsers[0]?.email || ''
  );
  const [issuedDate, setIssuedDate] = useState(
    invoice?.issuedDate || todayIso
  );
  const [dueDate, setDueDate] = useState(invoice?.dueDate || nextMonthIso);
  const [status, setStatus] = useState<InvoiceStatus>(
    invoice?.status || 'unpaid'
  );
  const [paymentMethod, setPaymentMethod] = useState(
    invoice?.paymentMethod || paymentMethods[0]?.name || 'Easypaisa Mobile Wallet'
  );
  const [transactionRef, setTransactionRef] = useState(
    invoice?.transactionRef || ''
  );
  const [taxRatePercent, setTaxRatePercent] = useState<string>(
    String(
      invoice
        ? invoice.taxRatePercent
        : invoiceTemplateConfig.defaultTaxRatePercent || 0
    )
  );
  const [discountUsd, setDiscountUsd] = useState<string>(
    String(invoice?.discountUsd ?? 0)
  );
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (invoice && invoice.items && invoice.items.length > 0) {
      return invoice.items;
    }
    return [
      {
        id: `ITEM-${Date.now()}-1`,
        description: 'cPanel Velocity NVMe Hosting',
        productType: 'cPanel Hosting',
        domainOrHost: 'clientdomain.com',
        billingCycle: 'Yearly',
        quantity: 1,
        unitPriceUsd: 49.0,
        lineTotalUsd: 49.0,
      },
    ];
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [refundDecisionAmount, setRefundDecisionAmount] = useState<string>(
    String(invoice?.refundAmountUsd ?? invoice?.amountUsd ?? 0)
  );
  const [refundAdminNote, setRefundAdminNote] = useState(
    invoice?.refundAdminNote || ''
  );

  useEffect(() => {
    if (invoice) {
      setClientEmail(invoice.clientEmail);
      setIssuedDate(invoice.issuedDate);
      setDueDate(invoice.dueDate);
      setStatus(invoice.status);
      setPaymentMethod(invoice.paymentMethod);
      setTransactionRef(invoice.transactionRef || '');
      setTaxRatePercent(String(invoice.taxRatePercent ?? 0));
      setDiscountUsd(String(invoice.discountUsd ?? 0));
      setNotes(invoice.notes || '');
      setItems(invoice.items);
      setRefundDecisionAmount(
        String(invoice.refundAmountUsd ?? invoice.amountUsd ?? 0)
      );
      setRefundAdminNote(invoice.refundAdminNote || '');
    }
  }, [invoice]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unit = Math.max(0, Number(it.unitPriceUsd) || 0);
      return sum + qty * unit;
    }, 0);
    const disc = Math.max(0, parseFloat(discountUsd) || 0);
    const taxable = Math.max(0, subtotal - disc);
    const taxPct = Math.max(0, parseFloat(taxRatePercent) || 0);
    const taxAmt = (taxable * taxPct) / 100;
    const total = taxable + taxAmt;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(disc.toFixed(2)),
      taxAmount: Number(taxAmt.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [items, discountUsd, taxRatePercent]);

  const handleUpdateItem = (
    idx: number,
    patch: Partial<InvoiceLineItem>
  ) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        const qty = Math.max(1, Number(next.quantity) || 1);
        const unit = Math.max(0, Number(next.unitPriceUsd) || 0);
        return {
          ...next,
          quantity: qty,
          unitPriceUsd: unit,
          lineTotalUsd: Number((qty * unit).toFixed(2)),
        };
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `ITEM-${Date.now()}-${prev.length + 1}`,
        description: 'Domain / Hosting Add-on Item',
        productType: 'Custom Service',
        domainOrHost: prev[0]?.domainOrHost || 'cpcloudhost.com',
        billingCycle: 'Yearly',
        quantity: 1,
        unitPriceUsd: 15.0,
        lineTotalUsd: 15.0,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      setErrorMsg('An invoice must contain at least one product or service item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTax = Math.max(0, parseFloat(taxRatePercent) || 0);
    const parsedDisc = Math.max(0, parseFloat(discountUsd) || 0);

    if (isCreating) {
      const res = adminCreateStandaloneInvoice({
        clientEmail,
        issuedDate,
        dueDate,
        status,
        paymentMethod,
        transactionRef,
        taxRatePercent: parsedTax,
        discountUsd: parsedDisc,
        notes,
        items,
      });
      if (!res.ok || !res.invoice) {
        setErrorMsg(res.error || 'Could not create invoice.');
        return;
      }
      onShowToast(`Invoice ${res.invoice.id} created for ${res.invoice.clientName}`);
      onClose();
      return;
    }

    const res = adminUpdateInvoiceFull(invoice.id, {
      issuedDate,
      dueDate,
      status,
      paymentMethod,
      transactionRef,
      taxRatePercent: parsedTax,
      discountUsd: parsedDisc,
      notes,
      items,
    });
    if (!res.ok) {
      setErrorMsg(res.error || 'Could not save invoice updates.');
      return;
    }
    onShowToast(`Invoice ${invoice.id} saved & synced to Client Billing`);
    onClose();
  };

  const handleDownloadCurrentDraft = () => {
    const selectedUser = users.find(
      (u) => u.email.toLowerCase() === clientEmail.toLowerCase()
    );
    const previewInv: PlatformInvoice = {
      id: invoice?.id || `${invoiceTemplateConfig.invoicePrefix}DRAFT`,
      orderId: invoice?.orderId || '',
      clientEmail: clientEmail.toLowerCase(),
      clientName: invoice?.clientName || selectedUser?.name || 'Client',
      productType:
        (items[0]?.productType as PlatformOrder['productType']) || 'cPanel Hosting',
      planName: items[0]?.description || 'Hosting Service',
      domainOrHost: items[0]?.domainOrHost || '—',
      billingCycle:
        (items[0]?.billingCycle as PlatformOrder['billingCycle']) || 'Yearly',
      items,
      subtotalUsd: totals.subtotal,
      taxRatePercent: Math.max(0, parseFloat(taxRatePercent) || 0),
      discountUsd: totals.discount,
      amountUsd: totals.total,
      issuedDate,
      dueDate,
      status,
      paymentMethod,
      transactionRef: transactionRef || undefined,
      paidAt: invoice?.paidAt,
      notes: notes || undefined,
    };
    downloadInvoicePdf(previewInv, invoiceTemplateConfig, paymentMethods, {
      code: currency.code,
      symbol: currency.symbol,
      rate,
      decimals: currency.decimals,
      spaceAfterSymbol: currency.spaceAfterSymbol,
      formattedTotal: formatPrice(previewInv.amountUsd),
    });
    onShowToast(`Downloaded ${previewInv.id}.pdf`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-6"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#0F172A]">
              {isCreating
                ? 'Create Standalone Multi-Item Invoice'
                : `Edit Invoice ${invoice.id}`}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              {isCreating
                ? 'Select client, set start/due dates, and add product line items'
                : `${invoice.clientName} (${invoice.clientEmail})${invoice.orderId ? ` · Order ${invoice.orderId}` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCurrentDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isCreating ? 'Issue Invoice' : 'Save Invoice Changes'}</span>
          </button>
        </div>
      </div>

      {/* Invoice Dates, Status & Payment Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isCreating && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Client Account *
            </label>
            <select
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Invoice Start / Issue Date
          </label>
          <input
            type="date"
            required
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Payment Due Date
          </label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Invoice Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
            className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white"
          >
            {INVOICE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Payment Method / Gateway
          </label>
          <input
            type="text"
            list="admin-payment-methods-list"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="Easypaisa Mobile Wallet / JazzCash / Visa"
            className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
          />
          <datalist id="admin-payment-methods-list">
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.name} />
            ))}
            <option value="Invoice Pending" />
            <option value="Admin Staff Settlement" />
          </datalist>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Transaction ID / TID Reference
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. EP-882941029 / Bank RRN"
            className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
          />
        </div>
      </div>

      {/* Product Line Items Editor + Add Item */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-sm font-bold text-[#0F172A]">
              Product &amp; Service Line Items ({items.length})
            </h4>
            <p className="text-[11px] text-slate-500">
              Edit product description, category, domain/host, cycle, quantity, and USD unit price, or add new items.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/40 bg-[#F2FAF8] hover:bg-[#0E6B63] hover:text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500">
                  LINE ITEM #{idx + 1}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#0F172A] tabular-nums">
                    Line Total: ${item.lineTotalUsd.toFixed(2)} USD
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Product / Plan Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateItem(idx, { description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Product Category
                  </label>
                  <select
                    value={item.productType}
                    onChange={(e) =>
                      handleUpdateItem(idx, {
                        productType: e.target.value as InvoiceLineItem['productType'],
                      })
                    }
                    className="w-full px-2.5 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                  >
                    {PRODUCT_TYPE_OPTIONS.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Domain / Hostname
                  </label>
                  <input
                    type="text"
                    value={item.domainOrHost}
                    onChange={(e) =>
                      handleUpdateItem(idx, { domainOrHost: e.target.value })
                    }
                    className="w-full px-2.5 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cycle &amp; Qty
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={item.billingCycle}
                      onChange={(e) =>
                        handleUpdateItem(idx, {
                          billingCycle: e.target.value as InvoiceLineItem['billingCycle'],
                        })
                      }
                      className="w-2/3 px-2 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                    >
                      {BILLING_CYCLE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(idx, {
                          quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-1/3 px-2 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Unit Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPriceUsd}
                    onChange={(e) =>
                      handleUpdateItem(idx, {
                        unitPriceUsd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount, Tax, Notes & Live Calculated Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-[#E2E8F0]">
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Discount Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountUsd}
                onChange={(e) => setDiscountUsd(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tax / VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Invoice Notes / Billing Memo (Appears on PDF)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment instructions, migration discount note, or PO number..."
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal ({items.length} items)</span>
            <span className="font-mono tabular-nums font-semibold">
              ${totals.subtotal.toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Discount</span>
            <span className="font-mono tabular-nums text-[#16A34A]">
              -${totals.discount.toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax ({parseFloat(taxRatePercent) || 0}%)</span>
            <span className="font-mono tabular-nums">
              ${totals.taxAmount.toFixed(2)} USD
            </span>
          </div>
          <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-sm font-bold text-[#0F172A]">
            <span>Final Invoice Total</span>
            <span className="font-mono tabular-nums text-base text-[#0E6B63]">
              ${totals.total.toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {!isCreating && invoice && (
        <div className="border-t border-[#E2E8F0] pt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-sm font-bold text-[#0F172A]">
                Refund &amp; Cancellation Management
              </h4>
              <p className="text-[11px] text-slate-500">
                Review client refund requests, payment notes, and cancellation status linked to this invoice.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
                Refund Status:{' '}
                <strong className="uppercase text-[#0E6B63]">
                  {invoice.refundStatus || 'none'}
                </strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
                Cancellation:{' '}
                <strong className="uppercase text-slate-700">
                  {invoice.cancellationStatus || 'none'}
                </strong>
              </span>
            </div>
          </div>

          {(invoice.paymentSubmittedAt || invoice.paymentDetailsNote) && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
              <p className="font-semibold text-[#0F172A]">Client Payment Submission Details</p>
              {invoice.paymentSubmittedAt && (
                <p className="text-slate-600 font-mono text-[11px]">
                  Submitted At: {invoice.paymentSubmittedAt}
                </p>
              )}
              {invoice.paymentDetailsNote && (
                <p className="text-slate-600">Note: {invoice.paymentDetailsNote}</p>
              )}
            </div>
          )}

          {invoice.refundReason && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
              <p className="font-semibold text-[#0F172A]">
                Client Refund Reason
                {invoice.refundRequestedAt ? ` (${invoice.refundRequestedAt})` : ''}
              </p>
              <p className="text-slate-700">{invoice.refundReason}</p>
            </div>
          )}

          {invoice.cancellationReason && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
              <p className="font-semibold text-[#0F172A]">
                Linked Service Cancellation Reason
              </p>
              <p className="text-slate-700">{invoice.cancellationReason}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Refund Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={refundDecisionAmount}
                onChange={(e) => setRefundDecisionAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Billing Admin Refund Memo
              </label>
              <input
                type="text"
                value={refundAdminNote}
                onChange={(e) => setRefundAdminNote(e.target.value)}
                placeholder="Reason or payout reference note..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div className="sm:col-span-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const res = adminProcessRefund(invoice.id, 'approved', {
                    refundAmountUsd: parseFloat(refundDecisionAmount) || invoice.amountUsd,
                    note: refundAdminNote,
                  });
                  if (res.ok) {
                    onShowToast(`Refund approved for ${invoice.id}`);
                  }
                }}
                className="px-3 py-2 text-[11px] font-semibold rounded-lg border border-[#0E6B63] text-[#0E6B63] bg-white hover:bg-[#F2FAF8] cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = adminProcessRefund(invoice.id, 'processed', {
                    refundAmountUsd: parseFloat(refundDecisionAmount) || invoice.amountUsd,
                    note: refundAdminNote,
                  });
                  if (res.ok) {
                    setStatus('refunded');
                    onShowToast(`Refund processed & invoice ${invoice.id} marked REFUNDED`);
                  }
                }}
                className="px-3 py-2 text-[11px] font-semibold rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white cursor-pointer"
              >
                Process Refund
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = adminProcessRefund(invoice.id, 'rejected', {
                    note: refundAdminNote,
                  });
                  if (res.ok) {
                    onShowToast(`Refund request declined for ${invoice.id}`);
                  }
                }}
                className="px-3 py-2 text-[11px] font-semibold rounded-lg border border-red-200 text-[#DC2626] bg-white hover:bg-red-50 cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs font-semibold text-[#DC2626]">{errorMsg}</p>
      )}
    </form>
  );
};

interface AdminBillingInvoicesViewProps {
  mode: 'invoices' | 'template';
  onShowToast: (msg: string) => void;
}

export const AdminBillingInvoicesView: React.FC<AdminBillingInvoicesViewProps> = ({
  mode,
  onShowToast,
}) => {
  const {
    invoices,
    paymentMethods,
    invoiceTemplateConfig,
    saveInvoiceTemplateConfig,
    adminUpdateInvoiceStatus,
    adminProcessRefund,
  } = usePlatform();
  const { formatPrice, currency, rate } = useCurrency();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | InvoiceStatus | 'refund_requests'
  >('all');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const editingInvoice = useMemo(
    () => invoices.find((i) => i.id === editingInvoiceId) ?? null,
    [invoices, editingInvoiceId]
  );

  const pendingRefundCount = useMemo(
    () =>
      invoices.filter(
        (i) => i.refundStatus === 'requested' || i.refundStatus === 'approved'
      ).length,
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter === 'refund_requests') {
        if (inv.refundStatus !== 'requested' && inv.refundStatus !== 'approved') {
          return false;
        }
      } else if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientEmail.toLowerCase().includes(q) ||
        inv.planName.toLowerCase().includes(q) ||
        inv.domainOrHost.toLowerCase().includes(q) ||
        (inv.transactionRef || '').toLowerCase().includes(q)
      );
    });
  }, [invoices, statusFilter, search]);

  // Template configurator draft
  const [tplDraft, setTplDraft] = useState(invoiceTemplateConfig);
  useEffect(() => {
    setTplDraft(invoiceTemplateConfig);
  }, [invoiceTemplateConfig]);

  if (mode === 'template') {
    const sampleInvoice = invoices[0] || {
      id: `${tplDraft.invoicePrefix}2026-9901`,
      orderId: 'ORD-2026-9901',
      clientEmail: 'client@acme-studios.co',
      clientName: 'Hannah Thornton',
      productType: 'cPanel Hosting' as const,
      planName: 'cPanel Velocity NVMe',
      domainOrHost: 'acme-studios.co',
      billingCycle: 'Yearly' as const,
      items: [
        {
          id: 'ITEM-1',
          description: 'cPanel Velocity NVMe Hosting',
          productType: 'cPanel Hosting' as const,
          domainOrHost: 'acme-studios.co',
          billingCycle: 'Yearly' as const,
          quantity: 1,
          unitPriceUsd: 94.8,
          lineTotalUsd: 94.8,
        },
      ],
      subtotalUsd: 94.8,
      taxRatePercent: tplDraft.defaultTaxRatePercent,
      discountUsd: 0,
      amountUsd: Number(
        (94.8 * (1 + (tplDraft.defaultTaxRatePercent || 0) / 100)).toFixed(2)
      ),
      issuedDate: '2026-04-01',
      dueDate: '2026-05-01',
      status: 'paid' as const,
      paymentMethod: 'Easypaisa Mobile Wallet',
      transactionRef: 'EP-894210554',
      paidAt: '2026-04-01 10:12 UTC',
    };

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Config Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveInvoiceTemplateConfig(tplDraft);
            onShowToast('Invoice branding & PDF template settings saved');
          }}
          className="xl:col-span-6 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#0F172A] inline-flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                <span>Invoice Template &amp; PDF Branding</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Applied to every downloadable PDF invoice across Admin &amp; Client Portal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                downloadInvoicePdf(sampleInvoice, tplDraft, paymentMethods, {
                  code: currency.code,
                  symbol: currency.symbol,
                  rate,
                  decimals: currency.decimals,
                  spaceAfterSymbol: currency.spaceAfterSymbol,
                  formattedTotal: formatPrice(sampleInvoice.amountUsd),
                });
                onShowToast(`Generated sample ${sampleInvoice.id}.pdf`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Test PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Company / Brand Name
              </label>
              <input
                type="text"
                required
                value={tplDraft.companyName}
                onChange={(e) =>
                  setTplDraft((p) => ({ ...p, companyName: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tax / VAT Registration ID
              </label>
              <input
                type="text"
                value={tplDraft.taxVatId}
                onChange={(e) =>
                  setTplDraft((p) => ({ ...p, taxVatId: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Billing Contact Email
              </label>
              <input
                type="email"
                value={tplDraft.companyEmail}
                onChange={(e) =>
                  setTplDraft((p) => ({ ...p, companyEmail: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Company Website URL
              </label>
              <input
                type="text"
                value={tplDraft.companyWebsite}
                onChange={(e) =>
                  setTplDraft((p) => ({ ...p, companyWebsite: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={tplDraft.companyTagline}
              onChange={(e) =>
                setTplDraft((p) => ({ ...p, companyTagline: e.target.value }))
              }
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Registered Business Address
            </label>
            <input
              type="text"
              value={tplDraft.companyAddress}
              onChange={(e) =>
                setTplDraft((p) => ({ ...p, companyAddress: e.target.value }))
              }
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={tplDraft.invoicePrefix}
                onChange={(e) =>
                  setTplDraft((p) => ({ ...p, invoicePrefix: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Paper Format
              </label>
              <select
                value={tplDraft.paperSize}
                onChange={(e) =>
                  setTplDraft((p) => ({
                    ...p,
                    paperSize: e.target.value as 'A4' | 'Letter',
                  }))
                }
                className="w-full px-2.5 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
              >
                <option value="A4">A4 (International)</option>
                <option value="Letter">US Letter</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Default Tax %
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={tplDraft.defaultTaxRatePercent}
                onChange={(e) =>
                  setTplDraft((p) => ({
                    ...p,
                    defaultTaxRatePercent: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Accent Color
              </label>
              <input
                type="color"
                value={tplDraft.accentColor}
                onChange={(e) =>
                  setTplDraft((p) => ({ ...p, accentColor: e.target.value }))
                }
                className="w-full h-[34px] p-0.5 border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Default Payment Instructions Block
            </label>
            <textarea
              rows={2}
              value={tplDraft.paymentInstructions}
              onChange={(e) =>
                setTplDraft((p) => ({ ...p, paymentInstructions: e.target.value }))
              }
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Footer Legal / Late Policy Note
            </label>
            <input
              type="text"
              value={tplDraft.footerNote}
              onChange={(e) =>
                setTplDraft((p) => ({ ...p, footerNote: e.target.value }))
              }
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
            />
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2.5 text-xs">
            <p className="font-semibold text-[#0F172A]">
              Automated Order-Approval Invoice Triggers
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tplDraft.autoGenerateOnApproval !== false}
                onChange={(e) =>
                  setTplDraft((p) => ({
                    ...p,
                    autoGenerateOnApproval: e.target.checked,
                  }))
                }
                className="mt-0.5 rounded border-slate-300 text-[#0E6B63]"
              />
              <span className="text-slate-700">
                <strong className="text-[#0F172A]">Auto-generate invoice upon order approval</strong>
                <span className="block text-[11px] text-slate-500">
                  Creates or finalizes an official numbered PDF invoice whenever an admin approves an order.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tplDraft.autoMarkPaidOnApproval !== false}
                onChange={(e) =>
                  setTplDraft((p) => ({
                    ...p,
                    autoMarkPaidOnApproval: e.target.checked,
                  }))
                }
                className="mt-0.5 rounded border-slate-300 text-[#0E6B63]"
              />
              <span className="text-slate-700">
                <strong className="text-[#0F172A]">Auto-mark generated invoice as PAID on approval</strong>
                <span className="block text-[11px] text-slate-500">
                  Stamps the invoice PAID with settlement timestamp immediately upon order approval.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tplDraft.autoSendInvoiceEmailOnApproval !== false}
                onChange={(e) =>
                  setTplDraft((p) => ({
                    ...p,
                    autoSendInvoiceEmailOnApproval: e.target.checked,
                  }))
                }
                className="mt-0.5 rounded border-slate-300 text-[#0E6B63]"
              />
              <span className="text-slate-700">
                <strong className="text-[#0F172A]">Dispatch invoice email via StackMail SMTP when enabled</strong>
                <span className="block text-[11px] text-slate-500">
                  Sends automated invoice notification to the client email if SMTP relay is configured.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tplDraft.showPaidStamp}
                  onChange={(e) =>
                    setTplDraft((p) => ({ ...p, showPaidStamp: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Show Status Stamp</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tplDraft.showTaxColumn}
                  onChange={(e) =>
                    setTplDraft((p) => ({ ...p, showTaxColumn: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-[#0E6B63]"
                />
                <span>Show Tax Summary Row</span>
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Save Template</span>
            </button>
          </div>
        </form>

        {/* Right Live Visual Invoice Sheet Preview */}
        <div className="xl:col-span-6 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          <div
            className="h-2 w-full"
            style={{ backgroundColor: tplDraft.accentColor || '#0E6B63' }}
          />
          <div className="p-6 space-y-5 text-xs">
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h4 className="font-display text-lg font-bold text-[#0F172A]">
                  {tplDraft.companyName}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {tplDraft.companyTagline}
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {tplDraft.companyAddress}
                </p>
                <p className="font-mono text-[11px] text-slate-500">
                  {tplDraft.companyEmail} · VAT: {tplDraft.taxVatId}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-display text-xl font-bold"
                  style={{ color: tplDraft.accentColor || '#0E6B63' }}
                >
                  INVOICE
                </p>
                <p className="font-mono font-bold text-[#0F172A] mt-0.5">
                  {sampleInvoice.id}
                </p>
                {tplDraft.showPaidStamp && (
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded bg-emerald-100 text-[#16A34A] font-bold text-[10px]">
                    PAID
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Billed To
                </span>
                <p className="font-bold text-[#0F172A] mt-0.5">
                  {sampleInvoice.clientName}
                </p>
                <p className="font-mono text-[11px] text-slate-500">
                  {sampleInvoice.clientEmail}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p>
                  <span className="text-slate-500">Start Date: </span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {sampleInvoice.issuedDate}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Due Date: </span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {sampleInvoice.dueDate}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Paper: </span>
                  <span className="font-mono text-[#0F172A]">
                    {tplDraft.paperSize}
                  </span>
                </p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0F172A] text-white text-[10px] uppercase">
                  <th className="py-2 px-3">Product / Description</th>
                  <th className="py-2 px-3">Domain</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sampleInvoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                      {it.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#0E6B63]">
                      {it.domainOrHost}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                      ${it.lineTotalUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-right">
                {tplDraft.showTaxColumn && (
                  <p className="text-slate-500">
                    Tax ({tplDraft.defaultTaxRatePercent}%):{' '}
                    <span className="font-mono text-[#0F172A]">
                      $
                      {(
                        (94.8 * (tplDraft.defaultTaxRatePercent || 0)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </p>
                )}
                <div
                  className="px-3 py-2 rounded text-white font-bold flex justify-between"
                  style={{ backgroundColor: tplDraft.accentColor || '#0E6B63' }}
                >
                  <span>Total</span>
                  <span className="font-mono tabular-nums">
                    $
                    {(
                      94.8 *
                      (1 + (tplDraft.defaultTaxRatePercent || 0) / 100)
                    ).toFixed(2)}{' '}
                    USD
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-[11px] text-slate-600">
              <p className="font-semibold text-[#0F172A] mb-0.5">
                Payment Instructions
              </p>
              <p>{tplDraft.paymentInstructions}</p>
            </div>

            <p className="text-[11px] text-center text-slate-400 border-t border-[#E2E8F0] pt-3">
              {tplDraft.footerNote}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invoices Ledger or Full Editor
  if (creatingNew || editingInvoice) {
    return (
      <AdminInvoiceEditor
        invoice={creatingNew ? null : editingInvoice}
        onClose={() => {
          setCreatingNew(false);
          setEditingInvoiceId(null);
        }}
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Invoice #, client, domain, product, or Transaction ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                'all',
                'unpaid',
                'pending',
                'overdue',
                'paid',
                'refund_requests',
                'cancelled',
                'refunded',
              ] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md capitalize transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {st === 'refund_requests'
                  ? `Refund Requests (${pendingRefundCount})`
                  : st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCreatingNew(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Items &amp; Product Details</th>
                <th className="py-3 px-4">Start / Due</th>
                <th className="py-3 px-4">Gateway / TID</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No invoices match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const st = invoiceStatusBadgeStyle(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F172A] whitespace-nowrap">
                        <span className="block">{inv.id}</span>
                        {inv.autoGeneratedTrigger === 'order_approved' && (
                          <span className="inline-block mt-0.5 font-sans text-[10px] font-semibold text-[#0E6B63] bg-[#F2FAF8] px-1.5 py-0.5 rounded">
                            Auto on Approval
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#0F172A] block">
                          {inv.clientName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {inv.clientEmail}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#0F172A] block">
                          {inv.planName}
                          {inv.items.length > 1 && (
                            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              +{inv.items.length - 1} items
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[11px] text-[#0E6B63]">
                          {inv.domainOrHost}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                        <div>Start: {inv.issuedDate}</div>
                        <div>Due: {inv.dueDate}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <span className="block font-medium text-[#0F172A]">
                          {inv.paymentMethod}
                        </span>
                        {inv.transactionRef && (
                          <span className="font-mono text-[#0E6B63]">
                            TID: {inv.transactionRef}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A] tabular-nums whitespace-nowrap">
                        {formatPrice(inv.amountUsd)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${st.className}`}
                        >
                          {st.label}
                        </span>
                        {inv.refundStatus && inv.refundStatus !== 'none' && (
                          <span
                            className={`block mt-1 text-[10px] font-semibold ${
                              inv.refundStatus === 'processed'
                                ? 'text-[#16A34A]'
                                : inv.refundStatus === 'rejected'
                                  ? 'text-[#DC2626]'
                                  : 'text-[#D97706]'
                            }`}
                          >
                            Refund: {inv.refundStatus.toUpperCase()}
                          </span>
                        )}
                        {inv.cancellationStatus && inv.cancellationStatus !== 'none' && (
                          <span className="block mt-0.5 text-[10px] font-semibold text-slate-600">
                            Cancel: {inv.cancellationStatus.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingInvoiceId(inv.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            downloadInvoicePdf(
                              inv,
                              invoiceTemplateConfig,
                              paymentMethods,
                              {
                                code: currency.code,
                                symbol: currency.symbol,
                                rate,
                                decimals: currency.decimals,
                                spaceAfterSymbol: currency.spaceAfterSymbol,
                                formattedTotal: formatPrice(inv.amountUsd),
                              }
                            );
                            onShowToast(`Downloaded ${inv.id}.pdf`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0F172A] border border-slate-200 hover:border-[#0E6B63] rounded cursor-pointer"
                        >
                          <Download className="w-3 h-3" aria-hidden="true" />
                          <span>PDF</span>
                        </button>
                        {(inv.refundStatus === 'requested' || inv.refundStatus === 'approved') && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminProcessRefund(inv.id, 'processed', {
                                refundAmountUsd: inv.refundAmountUsd ?? inv.amountUsd,
                              });
                              if (res.ok) {
                                onShowToast(`Refund processed for ${inv.id}`);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded cursor-pointer"
                          >
                            Process Refund
                          </button>
                        )}
                        {inv.status !== 'paid' && inv.status !== 'refunded' && (
                          <button
                            type="button"
                            onClick={() => {
                              adminUpdateInvoiceStatus(
                                inv.id,
                                'paid',
                                inv.paymentMethod || 'Admin Verified'
                              );
                              onShowToast(`Invoice ${inv.id} marked PAID`);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#16A34A] border border-[#16A34A]/30 hover:bg-[#16A34A]/10 rounded cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
