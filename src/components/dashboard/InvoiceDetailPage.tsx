import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  Printer,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import {
  CancellationStatus,
  CancellationType,
  PlatformInvoice,
  PlatformOrder,
  RefundStatus,
  usePlatform,
} from '../../context/PlatformContext';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';

interface InvoiceDetailPageProps {
  invoice: PlatformInvoice;
  linkedOrder: PlatformOrder | null;
  onBackToBilling: () => void;
  onShowToast: (msg: string) => void;
}

function getInvoiceStatusMeta(status: PlatformInvoice['status']): {
  label: string;
  classes: string;
} {
  switch (status) {
    case 'paid':
      return {
        label: 'PAID',
        classes: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25',
      };
    case 'pending':
      return {
        label: 'PENDING VERIFICATION',
        classes: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25',
      };
    case 'overdue':
      return {
        label: 'OVERDUE',
        classes: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25',
      };
    case 'cancelled':
      return {
        label: 'CANCELLED',
        classes: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    case 'refunded':
      return {
        label: 'REFUNDED',
        classes: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    default:
      return {
        label: 'UNPAID',
        classes: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25',
      };
  }
}

export function getRefundStatusDisplay(status?: RefundStatus): {
  label: string;
  toneClass: string;
} {
  switch (status) {
    case 'requested':
      return {
        label: 'Refund Requested',
        toneClass: 'bg-amber-50 text-[#D97706] border-amber-200',
      };
    case 'approved':
      return {
        label: 'Refund Approved',
        toneClass: 'bg-[#F2FAF8] text-[#0E6B63] border-[#0E6B63]/25',
      };
    case 'processed':
      return {
        label: 'Refunded',
        toneClass: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
      };
    case 'rejected':
      return {
        label: 'Refund Declined',
        toneClass: 'bg-red-50 text-[#DC2626] border-red-200',
      };
    default:
      return {
        label: 'No Refund',
        toneClass: 'bg-slate-50 text-slate-500 border-slate-200',
      };
  }
}

export function getCancellationStatusDisplay(status?: CancellationStatus): {
  label: string;
  toneClass: string;
} {
  switch (status) {
    case 'requested':
      return {
        label: 'Cancellation Requested',
        toneClass: 'bg-amber-50 text-[#D97706] border-amber-200',
      };
    case 'approved':
      return {
        label: 'Cancellation Scheduled',
        toneClass: 'bg-[#F2FAF8] text-[#0E6B63] border-[#0E6B63]/25',
      };
    case 'completed':
      return {
        label: 'Service Cancelled',
        toneClass: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    case 'rejected':
      return {
        label: 'Cancellation Declined',
        toneClass: 'bg-red-50 text-[#DC2626] border-red-200',
      };
    default:
      return {
        label: 'Active',
        toneClass: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
      };
  }
}

export const InvoiceDetailPage: React.FC<InvoiceDetailPageProps> = ({
  invoice,
  linkedOrder,
  onBackToBilling,
  onShowToast,
}) => {
  const { currency, rate, formatPrice } = useCurrency();
  const {
    paymentMethods,
    invoiceTemplateConfig,
    payClientOrderInvoice,
    requestInvoiceRefund,
    requestOrderCancellation,
  } = usePlatform();

  const enabledGateways = useMemo(
    () => paymentMethods.filter((m) => m.enabled),
    [paymentMethods]
  );

  const [selectedGatewayName, setSelectedGatewayName] = useState<string>(() => {
    const matched = enabledGateways.find(
      (g) => g.name.toLowerCase() === (invoice.paymentMethod || '').toLowerCase()
    );
    return matched?.name || enabledGateways[0]?.name || invoice.paymentMethod;
  });
  const [txRefInput, setTxRefInput] = useState(invoice.transactionRef || '');
  const [paymentNoteInput, setPaymentNoteInput] = useState(
    invoice.paymentDetailsNote || ''
  );
  const [paymentError, setPaymentError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Refund request form state
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReasonInput, setRefundReasonInput] = useState('');
  const [refundError, setRefundError] = useState('');

  // Cancellation request form state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelTypeInput, setCancelTypeInput] =
    useState<CancellationType>('end_of_period');
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    const matched = enabledGateways.find(
      (g) => g.name.toLowerCase() === (invoice.paymentMethod || '').toLowerCase()
    );
    setSelectedGatewayName(
      matched?.name || enabledGateways[0]?.name || invoice.paymentMethod
    );
    setTxRefInput(invoice.transactionRef || '');
    setPaymentNoteInput(invoice.paymentDetailsNote || '');
    setPaymentError('');
    setShowRefundForm(false);
    setShowCancelForm(false);
    setRefundError('');
    setCancelError('');
  }, [invoice.id, invoice.paymentMethod, invoice.transactionRef, invoice.paymentDetailsNote, enabledGateways]);

  const activeGateway = useMemo(
    () =>
      enabledGateways.find(
        (g) => g.name.toLowerCase() === selectedGatewayName.toLowerCase()
      ) || enabledGateways[0] || null,
    [enabledGateways, selectedGatewayName]
  );

  const statusMeta = getInvoiceStatusMeta(invoice.status);
  const effectiveRefundStatus: RefundStatus =
    invoice.refundStatus ||
    (invoice.status === 'refunded' ? 'processed' : 'none');
  const effectiveCancelStatus: CancellationStatus =
    linkedOrder?.cancellationStatus ||
    invoice.cancellationStatus ||
    (linkedOrder?.status === 'cancelled' || invoice.status === 'cancelled'
      ? 'completed'
      : 'none');

  const refundMeta = getRefundStatusDisplay(effectiveRefundStatus);
  const cancelMeta = getCancellationStatusDisplay(effectiveCancelStatus);

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            id: 'ITEM-1',
            description: invoice.planName,
            productType: invoice.productType,
            domainOrHost: invoice.domainOrHost,
            billingCycle: invoice.billingCycle,
            quantity: 1,
            unitPriceUsd: invoice.amountUsd,
            lineTotalUsd: invoice.amountUsd,
          },
        ];

  const subtotal = Number(invoice.subtotalUsd ?? invoice.amountUsd);
  const discount = Number(invoice.discountUsd ?? 0);
  const taxPct = Number(invoice.taxRatePercent ?? 0);
  const taxableBase = Math.max(0, subtotal - discount);
  const taxAmount = Number(((taxableBase * taxPct) / 100).toFixed(2));

  const canSubmitPayment =
    invoice.status === 'unpaid' ||
    invoice.status === 'overdue' ||
    invoice.status === 'pending';

  const canRequestRefund =
    invoice.status === 'paid' &&
    (effectiveRefundStatus === 'none' || effectiveRefundStatus === 'rejected');

  const canRequestCancellation =
    Boolean(linkedOrder) &&
    linkedOrder?.status !== 'cancelled' &&
    linkedOrder?.status !== 'refunded' &&
    (effectiveCancelStatus === 'none' || effectiveCancelStatus === 'rejected');

  const handleCopyText = (key: string, value: string, label: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopiedField(key);
        onShowToast(`${label} copied to clipboard`);
        window.setTimeout(() => setCopiedField(''), 1800);
      })
      .catch(() => {});
  };

  const handleDownloadPdf = () => {
    downloadInvoicePdf(invoice, invoiceTemplateConfig, paymentMethods, {
      code: currency.code,
      symbol: currency.symbol,
      rate,
      decimals: currency.decimals,
      spaceAfterSymbol: currency.spaceAfterSymbol,
      formattedTotal: formatPrice(invoice.amountUsd),
    });
    onShowToast(`Downloaded ${invoice.id}.pdf`);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGateway) {
      setPaymentError('Please choose a valid payment method.');
      return;
    }
    if (activeGateway.requiresTransactionId && txRefInput.trim().length < 4) {
      setPaymentError(
        `Please enter your ${activeGateway.name} Transaction ID / Reference (TID) after sending the payment.`
      );
      return;
    }
    setPaymentError('');
    const res = payClientOrderInvoice(invoice.id, activeGateway.name, {
      transactionRef: txRefInput.trim(),
      paymentDetailsNote: paymentNoteInput.trim(),
    });
    if (res && res.status === 'pending') {
      onShowToast(
        `Payment details submitted for ${invoice.id} — Pending Billing Desk verification.`
      );
    } else {
      onShowToast(
        `Invoice ${invoice.id} settled & linked service activated.`
      );
    }
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError('');
    const res = requestInvoiceRefund(invoice.id, {
      reason: refundReasonInput,
      amountUsd: invoice.amountUsd,
    });
    if (!res.ok) {
      setRefundError(res.error || 'Unable to submit refund request.');
      return;
    }
    setShowRefundForm(false);
    setRefundReasonInput('');
    onShowToast(`Refund request submitted for ${invoice.id}.`);
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedOrder) return;
    setCancelError('');
    const res = requestOrderCancellation(linkedOrder.id, {
      type: cancelTypeInput,
      reason: cancelReasonInput,
    });
    if (!res.ok) {
      setCancelError(res.error || 'Unable to submit cancellation request.');
      return;
    }
    setShowCancelForm(false);
    setCancelReasonInput('');
    onShowToast(`Cancellation request submitted for ${linkedOrder.domainOrHost}.`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Sticky/Top Action Bar (hidden when printing) */}
      <div className="print:hidden bg-white border border-[#E2E8F0] rounded-xl p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToBilling}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Invoices</span>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-bold text-[#0F172A]">
                {invoice.id}
              </span>
              {invoice.orderId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{invoice.orderId}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>Currency {currency.code}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] whitespace-nowrap cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Refund & Cancellation Status Overview Strip */}
      {(effectiveRefundStatus !== 'none' || effectiveCancelStatus !== 'none') && (
        <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {effectiveRefundStatus !== 'none' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0F172A] inline-flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  <span>Refund Status</span>
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${refundMeta.toneClass}`}
                >
                  {refundMeta.label}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                {invoice.refundAmountUsd !== undefined && (
                  <p>
                    Amount:{' '}
                    <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                      {formatPrice(invoice.refundAmountUsd)}
                    </span>
                    {invoice.refundRequestedAt && (
                      <span className="text-slate-400">
                        {' '}
                        · Requested {invoice.refundRequestedAt}
                      </span>
                    )}
                  </p>
                )}
                {invoice.refundReason && (
                  <p className="text-slate-600">
                    Reason: <span className="text-[#0F172A]">{invoice.refundReason}</span>
                  </p>
                )}
                {invoice.refundAdminNote && (
                  <p className="text-[11px] text-[#0E6B63] font-medium">
                    Billing Note: {invoice.refundAdminNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {effectiveCancelStatus !== 'none' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0F172A] inline-flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  <span>Cancellation Status</span>
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${cancelMeta.toneClass}`}
                >
                  {cancelMeta.label}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                {(linkedOrder?.cancellationType || invoice.cancellationType) && (
                  <p>
                    Mode:{' '}
                    <span className="font-semibold text-[#0F172A]">
                      {(linkedOrder?.cancellationType || invoice.cancellationType) ===
                      'immediate'
                        ? 'Immediate Termination'
                        : 'End of Billing Period'}
                    </span>
                    {(linkedOrder?.cancellationRequestedAt ||
                      invoice.cancellationRequestedAt) && (
                      <span className="text-slate-400">
                        {' '}
                        ·{' '}
                        {linkedOrder?.cancellationRequestedAt ||
                          invoice.cancellationRequestedAt}
                      </span>
                    )}
                  </p>
                )}
                {(linkedOrder?.cancellationReason || invoice.cancellationReason) && (
                  <p>
                    Reason:{' '}
                    <span className="text-[#0F172A]">
                      {linkedOrder?.cancellationReason || invoice.cancellationReason}
                    </span>
                  </p>
                )}
                {(linkedOrder?.cancellationAdminNote ||
                  invoice.cancellationAdminNote) && (
                  <p className="text-[11px] text-[#0E6B63] font-medium">
                    Admin Note:{' '}
                    {linkedOrder?.cancellationAdminNote ||
                      invoice.cancellationAdminNote}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== UNIFIED INTERNATIONAL INVOICE DOCUMENT SHEET ==================== */}
      <article className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden print:border-slate-300 print:rounded-none">
        {/* Accent Top Bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: invoiceTemplateConfig.accentColor || '#0E6B63' }}
        />

        <div className="p-5 sm:p-8 lg:p-10 space-y-7">
          {/* Header Row: Brand Identity + Invoice Number / Stamp */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Building2
                  className="w-5 h-5 text-[#0E6B63] shrink-0"
                  aria-hidden="true"
                />
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  {invoiceTemplateConfig.companyName || 'CPCloudHost'}
                </h1>
              </div>
              {invoiceTemplateConfig.companyTagline && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {invoiceTemplateConfig.companyTagline}
                </p>
              )}
              <div className="text-xs text-slate-500 space-y-0.5 pt-1 leading-relaxed">
                {invoiceTemplateConfig.companyAddress && (
                  <p>{invoiceTemplateConfig.companyAddress}</p>
                )}
                <p className="font-mono text-[11px]">
                  {invoiceTemplateConfig.companyEmail} ·{' '}
                  {invoiceTemplateConfig.companyWebsite}
                </p>
                {invoiceTemplateConfig.taxVatId && (
                  <p className="font-mono text-[11px]">
                    Tax / VAT ID: {invoiceTemplateConfig.taxVatId}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:text-right space-y-2">
              <p
                className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: invoiceTemplateConfig.accentColor || '#0E6B63' }}
              >
                INVOICE
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-[#0F172A]">
                {invoice.id}
              </p>
              {(invoiceTemplateConfig.showPaidStamp ||
                invoice.status !== 'paid') && (
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold tracking-wide ${statusMeta.classes}`}
                  >
                    {invoice.status === 'paid' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : invoice.status === 'overdue' ? (
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{statusMeta.label}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Billed To & Invoice Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-1.5 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Billed To
              </p>
              <p className="font-display text-base font-bold text-[#0F172A]">
                {invoice.clientName}
              </p>
              <p className="font-mono text-slate-600">{invoice.clientEmail}</p>
              {invoice.orderId && (
                <p className="text-slate-600 pt-1">
                  Order Ref:{' '}
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {invoice.orderId}
                  </span>
                  {invoice.datacenter ? ` · ${invoice.datacenter}` : ''}
                </p>
              )}
              {invoice.transactionRef && (
                <p className="text-[#0E6B63] font-mono font-semibold">
                  TID / Reference: {invoice.transactionRef}
                </p>
              )}
              {invoice.paymentSubmittedAt && (
                <p className="text-[11px] text-slate-500">
                  Payment details submitted: {invoice.paymentSubmittedAt}
                </p>
              )}
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-2 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Invoice Schedule &amp; Method
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Issue Date</span>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                    {invoice.issuedDate}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Payment Due Date</span>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                    {invoice.dueDate}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-semibold text-[#0F172A] text-right">
                    {invoice.paymentMethod || 'Invoice Pending'}
                  </span>
                </div>
                {invoice.paidAt && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Settled At</span>
                    <span className="font-mono font-semibold text-[#16A34A] tabular-nums">
                      {invoice.paidAt}
                    </span>
                  </div>
                )}
                {effectiveRefundStatus !== 'none' && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Refund Status</span>
                    <span className="font-semibold text-[#0F172A]">
                      {refundMeta.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items — Desktop Table & Responsive Mobile Cards */}
          <div>
            {/* Desktop / Tablet View */}
            <div className="hidden md:block border border-[#E2E8F0] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0F172A] text-white text-[11px] font-semibold uppercase tracking-wide">
                    <th className="py-3 px-4">Product / Service Description</th>
                    <th className="py-3 px-4">Domain / Host</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Unit</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-display font-bold text-[#0F172A] block">
                          {item.description}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.productType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0E6B63] break-all">
                        {item.domainOrHost || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.billingCycle}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatPrice(item.unitPriceUsd)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-[#0F172A] whitespace-nowrap">
                        {formatPrice(item.lineTotalUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View */}
            <div className="md:hidden space-y-3">
              <div className="px-3.5 py-2 rounded-lg bg-[#0F172A] text-white text-[11px] font-semibold uppercase tracking-wide flex items-center justify-between">
                <span>Invoice Line Items</span>
                <span>{items.length} item(s)</span>
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-[#E2E8F0] rounded-xl p-4 bg-white space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-[#0F172A]">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.productType} · {item.billingCycle}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-[#0F172A] shrink-0">
                      {formatPrice(item.lineTotalUsd)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-[#0E6B63] break-all">
                      {item.domainOrHost || '—'}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {item.quantity} × {formatPrice(item.unitPriceUsd)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary + Optional Lifecycle Adjustment Record */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              {(effectiveRefundStatus !== 'none' ||
                effectiveCancelStatus !== 'none') && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-1.5 text-xs max-w-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Lifecycle &amp; Adjustment Record
                  </p>
                  {effectiveRefundStatus !== 'none' && (
                    <p className="text-[#0F172A]">
                      <span className="font-semibold">Refund:</span>{' '}
                      {refundMeta.label}
                      {invoice.refundAmountUsd !== undefined
                        ? ` (${formatPrice(invoice.refundAmountUsd)})`
                        : ''}
                    </p>
                  )}
                  {effectiveCancelStatus !== 'none' && (
                    <p className="text-[#0F172A]">
                      <span className="font-semibold">Service Cancellation:</span>{' '}
                      {cancelMeta.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums font-medium text-[#0F172A]">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-[#16A34A]">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums font-semibold">
                    -{formatPrice(discount)}
                  </span>
                </div>
              )}
              {(invoiceTemplateConfig.showTaxColumn || taxPct > 0) && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tax ({taxPct}%)</span>
                  <span className="font-mono tabular-nums font-medium text-[#0F172A]">
                    {formatPrice(taxAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#E2E8F0]">
                <div
                  className="px-4 py-3 rounded-xl text-white flex items-center justify-between gap-3"
                  style={{
                    backgroundColor:
                      invoiceTemplateConfig.accentColor || '#0E6B63',
                  }}
                >
                  <span className="font-display text-sm font-bold">
                    {invoice.status === 'paid'
                      ? 'TOTAL PAID'
                      : invoice.status === 'refunded'
                        ? 'REFUNDED'
                        : 'TOTAL DUE'}
                  </span>
                  <span className="font-mono tabular-nums text-base sm:text-lg font-extrabold">
                    {formatPrice(invoice.amountUsd)}
                  </span>
                </div>
              </div>

              {currency.code !== 'USD' && (
                <p className="text-right text-[11px] text-slate-500 font-mono tabular-nums">
                  Base Accounting Reference: ${invoice.amountUsd.toFixed(2)} USD
                </p>
              )}
            </div>
          </div>

          {/* Payment Instructions Summary Strip inside Invoice Sheet */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-2.5 text-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
              Payment Instructions &amp; Verified Channels
            </p>
            <p className="text-slate-600 leading-relaxed">
              {invoiceTemplateConfig.paymentInstructions}
            </p>
            {invoice.paymentDetailsNote && (
              <p className="text-[#0F172A]">
                <span className="font-semibold">Submitted Payment Note:</span>{' '}
                {invoice.paymentDetailsNote}
              </p>
            )}
            {invoice.notes && (
              <p className="text-slate-500">
                <span className="font-semibold text-slate-700">Note:</span>{' '}
                {invoice.notes}
              </p>
            )}
          </div>

          {/* Footer Note */}
          {invoiceTemplateConfig.footerNote && (
            <p className="text-center text-[11px] text-slate-500 pt-4 border-t border-[#E2E8F0]">
              {invoiceTemplateConfig.footerNote}
            </p>
          )}
        </div>
      </article>

      {/* ==================== POST-ORDER PAYMENT & TID SUBMISSION SECTION ==================== */}
      {canSubmitPayment && (
        <section className="print:hidden bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0E6B63]" aria-hidden="true" />
                <span>
                  {invoice.status === 'pending'
                    ? 'Update Payment Details / Transaction Reference'
                    : 'Submit Payment Details & Complete Invoice'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Transfer the invoice balance using your chosen payment method below, then enter your Transaction ID (TID) and payment details to verify settlement.
              </p>
            </div>
            <span className="font-mono tabular-nums text-base font-extrabold text-[#0E6B63] shrink-0">
              {formatPrice(invoice.amountUsd)}
            </span>
          </div>

          <form onSubmit={handleSubmitPayment} className="space-y-5">
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enabledGateways.map((gw) => {
                  const selected =
                    activeGateway && gw.id === activeGateway.id;
                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => {
                        setSelectedGatewayName(gw.name);
                        setPaymentError('');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#0E6B63] bg-[#F2FAF8] ring-1 ring-[#0E6B63]'
                          : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0F172A]">
                          {gw.name}
                        </span>
                        {selected && (
                          <CheckCircle2
                            className="w-4 h-4 text-[#0E6B63] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {gw.bankOrProviderName} · {gw.currencyHint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeGateway && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold text-[#0F172A]">
                      {activeGateway.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {activeGateway.bankOrProviderName} · {activeGateway.currencyHint}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6B63]">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Verified Account</span>
                  </span>
                </div>

                {(activeGateway.accountTitle ||
                  activeGateway.accountNumber ||
                  activeGateway.ibanOrRouting) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white border border-[#E2E8F0] rounded-lg p-3.5">
                    {activeGateway.accountTitle && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 block">
                          Account Title
                        </span>
                        <span className="font-semibold text-[#0F172A]">
                          {activeGateway.accountTitle}
                        </span>
                      </div>
                    )}
                    {activeGateway.accountNumber && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 block">
                          Account / Wallet Number
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              'acc-num',
                              activeGateway.accountNumber,
                              'Account number'
                            )
                          }
                          className="font-mono font-bold text-[#0E6B63] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{activeGateway.accountNumber}</span>
                          {copiedField === 'acc-num' ? (
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    )}
                    {activeGateway.ibanOrRouting && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 block">
                          IBAN / Routing
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              'iban',
                              activeGateway.ibanOrRouting,
                              'IBAN / routing'
                            )
                          }
                          className="font-mono font-semibold text-[#0F172A] hover:text-[#0E6B63] inline-flex items-center gap-1.5 cursor-pointer break-all text-left"
                        >
                          <span>{activeGateway.ibanOrRouting}</span>
                          <Copy className="w-3 h-3 shrink-0" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeGateway.instructions && (
                  <p className="text-slate-600 leading-relaxed">
                    {activeGateway.instructions}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1.5">
                      Transaction ID / Reference (TID){' '}
                      {activeGateway.requiresTransactionId ? (
                        <span className="text-[#DC2626]">*</span>
                      ) : (
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={txRefInput}
                      onChange={(e) => {
                        setTxRefInput(e.target.value);
                        if (paymentError) setPaymentError('');
                      }}
                      placeholder="e.g. EP-894210554 or Bank Transfer Ref"
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1.5">
                      Sender Account / Payment Note{' '}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentNoteInput}
                      onChange={(e) => setPaymentNoteInput(e.target.value)}
                      placeholder="Sender mobile/account title or transfer timestamp"
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentError && (
              <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {paymentError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                {activeGateway && !activeGateway.autoActivate
                  ? 'After submitting your TID, our billing desk verifies transfer receipt and activates your service.'
                  : 'Submitting payment settles this invoice and triggers instant service activation.'}
              </p>
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>
                  {activeGateway && !activeGateway.autoActivate
                    ? `Submit ${activeGateway.name} Payment Details`
                    : `Pay ${formatPrice(invoice.amountUsd)} Now`}
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ==================== REFUND & CANCELLATION ACTIONS ==================== */}
      {(canRequestRefund || canRequestCancellation) && (
        <section className="print:hidden bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                <span>Billing Adjustments: Refund &amp; Service Cancellation</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Request a refund for eligible paid invoices or schedule service cancellation directly from this invoice.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {canRequestRefund && !showRefundForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundForm(true);
                    setShowCancelForm(false);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                  <span>Request Refund</span>
                </button>
              )}
              {canRequestCancellation && !showCancelForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelForm(true);
                    setShowRefundForm(false);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-[#DC2626] cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Request Cancellation</span>
                </button>
              )}
            </div>
          </div>

          {showRefundForm && (
            <form
              onSubmit={handleRefundSubmit}
              className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-4 sm:p-5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-[#0F172A]">
                  Submit Refund Request ({formatPrice(invoice.amountUsd)})
                </p>
                <button
                  type="button"
                  onClick={() => setShowRefundForm(false)}
                  className="text-slate-500 hover:text-[#0F172A] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Reason for Refund *
                </label>
                <textarea
                  rows={3}
                  required
                  value={refundReasonInput}
                  onChange={(e) => {
                    setRefundReasonInput(e.target.value);
                    setRefundError('');
                  }}
                  placeholder="Describe why you are requesting a refund (e.g. accidental duplicate payment, 30-day guarantee cancellation)..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>
              {refundError && (
                <p className="font-semibold text-[#DC2626]">{refundError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundForm(false)}
                  className="min-h-[38px] px-4 py-2 rounded-lg border border-[#CBD5E1] bg-white font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white font-semibold cursor-pointer"
                >
                  Submit Refund Request
                </button>
              </div>
            </form>
          )}

          {showCancelForm && linkedOrder && (
            <form
              onSubmit={handleCancelSubmit}
              className="border border-red-200 bg-red-50/40 rounded-xl p-4 sm:p-5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-[#0F172A]">
                  Request Service Cancellation ({linkedOrder.domainOrHost})
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelForm(false)}
                  className="text-slate-500 hover:text-[#0F172A] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCancelTypeInput('end_of_period')}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    cancelTypeInput === 'end_of_period'
                      ? 'border-[#0E6B63] bg-white ring-1 ring-[#0E6B63]'
                      : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  <span className="font-bold text-[#0F172A] block">
                    End of Billing Period
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Keep active until {linkedOrder.nextDueDate || 'cycle ends'}, do not auto-renew.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCancelTypeInput('immediate')}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    cancelTypeInput === 'immediate'
                      ? 'border-[#DC2626] bg-white ring-1 ring-[#DC2626]'
                      : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  <span className="font-bold text-[#0F172A] block">
                    Immediate Cancellation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Terminate service promptly once reviewed by Admin.
                  </span>
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReasonInput}
                  onChange={(e) => {
                    setCancelReasonInput(e.target.value);
                    setCancelError('');
                  }}
                  placeholder="Let us know why you are cancelling this service..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>
              {cancelError && (
                <p className="font-semibold text-[#DC2626]">{cancelError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelForm(false)}
                  className="min-h-[38px] px-4 py-2 rounded-lg border border-[#CBD5E1] bg-white font-semibold text-slate-700 cursor-pointer"
                >
                  Keep Service
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  Submit Cancellation Request
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
};
