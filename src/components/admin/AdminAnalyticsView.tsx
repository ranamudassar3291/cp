import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { useCurrency } from '../../context/CurrencyContext';

interface AdminAnalyticsViewProps {
  onShowToast: (msg: string) => void;
}

type DateRangePreset = 'all' | '30d' | '90d' | '365d';

function isWithinRange(dateStr: string, preset: DateRangePreset): boolean {
  if (preset === 'all') return true;
  const parsed = Date.parse(dateStr.replace(' UTC', 'Z'));
  if (Number.isNaN(parsed)) return true;
  const days = preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
  const cutoff = Date.now() - days * 86400000;
  return parsed >= cutoff;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  onShowToast,
}) => {
  const { orders, invoices, users } = usePlatform();
  const { formatPrice } = useCurrency();
  const [range, setRange] = useState<DateRangePreset>('all');

  const scopedOrders = useMemo(
    () => orders.filter((o) => isWithinRange(o.createdAt, range)),
    [orders, range]
  );
  const scopedInvoices = useMemo(
    () => invoices.filter((inv) => isWithinRange(inv.issuedDate, range)),
    [invoices, range]
  );

  const summary = useMemo(() => {
    const grossBilledUsd = scopedInvoices.reduce((sum, inv) => sum + inv.amountUsd, 0);
    const paidCollectedUsd = scopedInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amountUsd, 0);
    const pendingReceivablesUsd = scopedInvoices
      .filter(
        (inv) =>
          inv.status === 'unpaid' ||
          inv.status === 'pending' ||
          inv.status === 'overdue'
      )
      .reduce((sum, inv) => sum + inv.amountUsd, 0);
    const refundedCancelledUsd = scopedInvoices
      .filter((inv) => inv.status === 'refunded' || inv.status === 'cancelled')
      .reduce((sum, inv) => sum + inv.amountUsd, 0);

    const activeServices = scopedOrders.filter((o) => o.status === 'active');
    const estimatedMrrUsd = activeServices.reduce((sum, o) => {
      if (o.billingCycle === 'Monthly' || o.billingCycle === '1 Month') {
        return sum + o.amountUsd;
      }
      if (o.billingCycle === '2 Years') return sum + o.amountUsd / 24;
      if (o.billingCycle === '4 Years') return sum + o.amountUsd / 48;
      if (o.billingCycle === '5-Year') return sum + o.amountUsd / 60;
      return sum + o.amountUsd / 12;
    }, 0);
    const projectedArrUsd = estimatedMrrUsd * 12;

    const paidCount = scopedInvoices.filter((i) => i.status === 'paid').length;
    const paidRate =
      scopedInvoices.length > 0
        ? Math.round((paidCount / scopedInvoices.length) * 100)
        : 0;

    return {
      grossBilledUsd,
      paidCollectedUsd,
      pendingReceivablesUsd,
      refundedCancelledUsd,
      estimatedMrrUsd,
      projectedArrUsd,
      paidCount,
      paidRate,
      totalOrders: scopedOrders.length,
      activeOrders: activeServices.length,
    };
  }, [scopedOrders, scopedInvoices]);

  const byProductType = useMemo(() => {
    const map = new Map<
      string,
      { label: string; ordersCount: number; billedUsd: number; activeCount: number }
    >();
    scopedOrders.forEach((o) => {
      const existing = map.get(o.productType) || {
        label: o.productType,
        ordersCount: 0,
        billedUsd: 0,
        activeCount: 0,
      };
      existing.ordersCount += 1;
      existing.billedUsd += o.amountUsd;
      if (o.status === 'active') existing.activeCount += 1;
      map.set(o.productType, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.billedUsd - a.billedUsd);
  }, [scopedOrders]);

  const byPaymentGateway = useMemo(() => {
    const map = new Map<
      string,
      { gateway: string; count: number; paidUsd: number; pendingUsd: number }
    >();
    scopedInvoices.forEach((inv) => {
      const label = inv.paymentMethod || 'Unassigned';
      const existing = map.get(label) || {
        gateway: label,
        count: 0,
        paidUsd: 0,
        pendingUsd: 0,
      };
      existing.count += 1;
      if (inv.status === 'paid') existing.paidUsd += inv.amountUsd;
      else if (
        inv.status === 'unpaid' ||
        inv.status === 'pending' ||
        inv.status === 'overdue'
      ) {
        existing.pendingUsd += inv.amountUsd;
      }
      map.set(label, existing);
    });
    return Array.from(map.values()).sort(
      (a, b) => b.paidUsd + b.pendingUsd - (a.paidUsd + a.pendingUsd)
    );
  }, [scopedInvoices]);

  const monthlySeries = useMemo(() => {
    const map = new Map<
      string,
      { monthKey: string; paidUsd: number; pendingUsd: number; count: number }
    >();
    scopedInvoices.forEach((inv) => {
      const monthKey = (inv.issuedDate || '2026-04').slice(0, 7);
      const cur = map.get(monthKey) || {
        monthKey,
        paidUsd: 0,
        pendingUsd: 0,
        count: 0,
      };
      cur.count += 1;
      if (inv.status === 'paid') cur.paidUsd += inv.amountUsd;
      else if (inv.status !== 'cancelled' && inv.status !== 'refunded') {
        cur.pendingUsd += inv.amountUsd;
      }
      map.set(monthKey, cur);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );
  }, [scopedInvoices]);

  const topClients = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        name: string;
        ordersCount: number;
        paidUsd: number;
        unpaidUsd: number;
      }
    >();
    scopedInvoices.forEach((inv) => {
      const key = inv.clientEmail.toLowerCase();
      const matchedUser = users.find((u) => u.email.toLowerCase() === key);
      const cur = map.get(key) || {
        email: inv.clientEmail,
        name: matchedUser?.name || inv.clientName,
        ordersCount: 0,
        paidUsd: 0,
        unpaidUsd: 0,
      };
      cur.ordersCount += 1;
      if (inv.status === 'paid') cur.paidUsd += inv.amountUsd;
      else if (
        inv.status === 'unpaid' ||
        inv.status === 'pending' ||
        inv.status === 'overdue'
      ) {
        cur.unpaidUsd += inv.amountUsd;
      }
      map.set(key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.paidUsd - a.paidUsd)
      .slice(0, 8);
  }, [scopedInvoices, users]);

  const maxMonthlyTotal = Math.max(
    1,
    ...monthlySeries.map((m) => m.paidUsd + m.pendingUsd)
  );
  const maxProductBilled = Math.max(
    1,
    ...byProductType.map((p) => p.billedUsd)
  );

  const handleExportCsv = () => {
    const rows = [
      [
        'Invoice ID',
        'Order ID',
        'Client Name',
        'Client Email',
        'Product Type',
        'Plan / Service',
        'Issued Date',
        'Due Date',
        'Status',
        'Payment Method',
        'Amount USD',
      ],
      ...scopedInvoices.map((inv) => [
        inv.id,
        inv.orderId,
        inv.clientName,
        inv.clientEmail,
        inv.productType,
        inv.planName,
        inv.issuedDate,
        inv.dueDate,
        inv.status,
        inv.paymentMethod,
        inv.amountUsd.toFixed(2),
      ]),
    ];
    const csv = rows
      .map((cols) =>
        cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpcloudhost-sales-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Exported ${scopedInvoices.length} invoice records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-[#0E6B63]" aria-hidden="true" />
          <div>
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              Revenue Accounting &amp; Sales Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Live settlement totals across hosting plans, domains, invoices, and regional wallets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: '365d', label: 'This Year' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  range === opt.id
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Accounting KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Collected Paid Revenue</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#16A34A] mt-1.5">
            {formatPrice(summary.paidCollectedUsd)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.paidCount} settled invoices
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Gross Billed Sales</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0F172A] mt-1.5">
            {formatPrice(summary.grossBilledUsd)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {scopedInvoices.length} invoices issued
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Unpaid / Pending</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#D97706] mt-1.5">
            {formatPrice(summary.pendingReceivablesUsd)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting wallet/bank settle</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Estimated MRR</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0E6B63] mt-1.5">
            {formatPrice(summary.estimatedMrrUsd)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.activeOrders} active subscriptions
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Projected ARR</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0F172A] mt-1.5">
            {formatPrice(summary.projectedArrUsd)}
          </p>
          <p className="text-[11px] text-[#0E6B63] mt-1 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            Annualized run-rate
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500">Paid Conversion &amp; Refunds</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#0F172A] mt-1.5">
            {summary.paidRate}%
          </p>
          <p className="text-[11px] text-[#DC2626] mt-1 font-mono tabular-nums">
            Refund/Cancel: {formatPrice(summary.refundedCancelledUsd)}
          </p>
        </div>
      </div>

      {/* Monthly Sales Chart + Breakdown by Product Line */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              Monthly Billed Revenue Breakdown
            </h3>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0E6B63]" />
                Paid
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                Unpaid / Pending
              </span>
            </div>
          </div>

          {monthlySeries.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-500">
              No billing records in the selected date window.
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {monthlySeries.map((row) => {
                const paidPct = (row.paidUsd / maxMonthlyTotal) * 100;
                const pendPct = (row.pendingUsd / maxMonthlyTotal) * 100;
                return (
                  <div key={row.monthKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[#0F172A]">
                        {row.monthKey}{' '}
                        <span className="text-slate-400 font-normal">
                          ({row.count} invoices)
                        </span>
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                        {formatPrice(row.paidUsd + row.pendingUsd)}
                      </span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                      {paidPct > 0 && (
                        <div
                          className="h-full bg-[#0E6B63]"
                          style={{ width: `${Math.max(paidPct, 2)}%` }}
                          title={`Paid: ${formatPrice(row.paidUsd)}`}
                        />
                      )}
                      {pendPct > 0 && (
                        <div
                          className="h-full bg-[#D97706]"
                          style={{ width: `${Math.max(pendPct, 2)}%` }}
                          title={`Pending: ${formatPrice(row.pendingUsd)}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              Sales by Product &amp; Service Line
            </h3>
          </div>

          <div className="space-y-3">
            {byProductType.map((item) => {
              const pct = Math.round((item.billedUsd / maxProductBilled) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">
                      {item.label}{' '}
                      <span className="text-[11px] font-normal text-slate-500">
                        ({item.ordersCount} orders)
                      </span>
                    </span>
                    <span className="font-mono tabular-nums font-bold text-[#0E6B63]">
                      {formatPrice(item.billedUsd)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0E6B63]"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Gateway Share & Top Clients */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              Settlement by Payment Method
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Gateway / Wallet</th>
                  <th className="py-2.5 px-4 text-right">Invoices</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {byPaymentGateway.map((g) => (
                  <tr key={g.gateway}>
                    <td className="py-2.5 px-4 font-semibold text-[#0F172A]">
                      {g.gateway}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {g.count}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#16A34A]">
                      {formatPrice(g.paidUsd)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#D97706]">
                      {formatPrice(g.pendingUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <h3 className="font-display text-sm font-bold text-[#0F172A]">
              Top Clients by Settled Spend
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4 text-right">Invoices</th>
                  <th className="py-2.5 px-4 text-right">Paid Revenue</th>
                  <th className="py-2.5 px-4 text-right">Open Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {topClients.map((c) => (
                  <tr key={c.email}>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-[#0F172A] block">
                        {c.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {c.email}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {c.ordersCount}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-[#16A34A]">
                      {formatPrice(c.paidUsd)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#D97706]">
                      {formatPrice(c.unpaidUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
