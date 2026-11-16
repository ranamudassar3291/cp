import { jsPDF } from 'jspdf';
import type {
  InvoiceTemplateConfig,
  PaymentMethodConfig,
  PlatformInvoice,
} from '../context/PlatformContext';

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#0E6B63').replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b];
    }
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b];
    }
  }
  return [14, 107, 99];
}

function formatUsdAmount(amount: number): string {
  return `$${(Number(amount) || 0).toFixed(2)} USD`;
}

function getStatusBadgeStyle(status: PlatformInvoice['status']): {
  label: string;
  text: [number, number, number];
  fill: [number, number, number];
} {
  switch (status) {
    case 'paid':
      return { label: 'PAID', text: [22, 163, 74], fill: [220, 252, 231] };
    case 'pending':
      return {
        label: 'PENDING VERIFICATION',
        text: [180, 83, 9],
        fill: [254, 243, 199],
      };
    case 'overdue':
      return { label: 'OVERDUE', text: [220, 38, 38], fill: [254, 226, 226] };
    case 'cancelled':
      return { label: 'CANCELLED', text: [71, 85, 105], fill: [241, 245, 249] };
    case 'refunded':
      return { label: 'REFUNDED', text: [71, 85, 105], fill: [241, 245, 249] };
    default:
      return { label: 'UNPAID', text: [217, 119, 6], fill: [254, 243, 199] };
  }
}

export function downloadInvoicePdf(
  invoice: PlatformInvoice,
  template: InvoiceTemplateConfig,
  paymentMethods: PaymentMethodConfig[] = [],
  currencyHint?: { code: string; formattedTotal?: string }
): void {
  const formatOption = template.paperSize === 'Letter' ? 'letter' : 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: formatOption,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const accent = hexToRgb(template.accentColor);
  const darkInk: [number, number, number] = [15, 23, 42];
  const mutedInk: [number, number, number] = [100, 116, 139];
  const borderColor: [number, number, number] = [226, 232, 240];

  // Top Accent Stripe
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 4, 'F');

  let y = 16;

  // Company Header (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(template.companyName || 'CPCloudHost', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
  if (template.companyTagline) {
    doc.text(template.companyTagline, margin, y + 5.5);
  }
  const addressLines = doc.splitTextToSize(
    [
      template.companyAddress,
      `${template.companyEmail}  ·  ${template.companyWebsite}`,
      template.taxVatId ? `Tax / VAT ID: ${template.taxVatId}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    98
  );
  doc.text(addressLines, margin, y + 11.5);

  // Invoice Title & Meta (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(invoice.id, pageWidth - margin, y + 6.5, { align: 'right' });

  // Status Stamp Pill
  const badge = getStatusBadgeStyle(invoice.status);
  if (template.showPaidStamp || invoice.status !== 'paid') {
    const badgeWidth = Math.max(28, badge.label.length * 2.15 + 8);
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = y + 9.5;
    doc.setFillColor(badge.fill[0], badge.fill[1], badge.fill[2]);
    doc.roundedRect(badgeX, badgeY, badgeWidth, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(badge.text[0], badge.text[1], badge.text[2]);
    doc.text(badge.label, badgeX + badgeWidth / 2, badgeY + 4.7, {
      align: 'center',
    });
  }

  y = 47;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, y, pageWidth - margin, y);

  // Billed To & Invoice Schedule Box
  y += 7;
  const colHalf = (contentWidth - 8) / 2;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, colHalf, 36, 2, 2, 'FD');
  doc.roundedRect(margin + colHalf + 8, y, colHalf, 36, 2, 2, 'FD');

  // Left Box: Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
  doc.text('BILLED TO', margin + 4.5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(invoice.clientName, margin + 4.5, y + 12.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(invoice.clientEmail, margin + 4.5, y + 17.5);
  if (invoice.orderId) {
    doc.text(
      `Order Ref: ${invoice.orderId}${invoice.datacenter ? ` · ${invoice.datacenter}` : ''}`,
      margin + 4.5,
      y + 22.8
    );
  }
  if (invoice.transactionRef) {
    doc.setFont('courier', 'bold');
    doc.text(`TID / Ref: ${invoice.transactionRef}`, margin + 4.5, y + 28);
  }
  if (invoice.autoGeneratedTrigger === 'order_approved') {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(
      `Auto-generated on order approval${invoice.autoGeneratedAt ? ` (${invoice.autoGeneratedAt})` : ''}`,
      margin + 4.5,
      y + 33
    );
  }

  // Right Box: Dates & Payment Method
  const rightX = margin + colHalf + 12.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
  doc.text('INVOICE SCHEDULE & METHOD', rightX, y + 6);

  const metaRows: [string, string][] = [
    ['Start / Issue Date:', invoice.issuedDate],
    ['Payment Due Date:', invoice.dueDate],
    ['Payment Method:', invoice.paymentMethod || 'Invoice Pending'],
    ...(invoice.paidAt ? [['Settled At:', invoice.paidAt] as [string, string]] : []),
  ];

  metaRows.forEach(([k, v], idx) => {
    const rowY = y + 12.2 + idx * 5.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
    doc.text(k, rightX, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(v, margin + contentWidth - 4.5, rowY, { align: 'right' });
  });

  // Line Items Table Header
  y += 44;
  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.rect(margin, y, contentWidth, 8.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('PRODUCT / SERVICE DESCRIPTION', margin + 3.5, y + 5.6);
  doc.text('DOMAIN / HOST', margin + 84, y + 5.6);
  doc.text('CYCLE', margin + 122, y + 5.6);
  doc.text('QTY', margin + 141, y + 5.6, { align: 'right' });
  doc.text('UNIT', margin + 158, y + 5.6, { align: 'right' });
  doc.text('TOTAL', pageWidth - margin - 3.5, y + 5.6, { align: 'right' });

  y += 8.5;

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

  items.forEach((item, index) => {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 20;
    }

    const descLines = doc.splitTextToSize(
      `${item.description} (${item.productType})`,
      76
    );
    const rowHeight = Math.max(10, descLines.length * 4.5 + 4.5);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(descLines, margin + 3.5, y + 5.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    const hostLines = doc.splitTextToSize(item.domainOrHost || '—', 35);
    doc.text(hostLines, margin + 84, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(71, 85, 105);
    doc.text(item.billingCycle, margin + 122, y + 5.5);
    doc.text(String(item.quantity), margin + 141, y + 5.5, { align: 'right' });
    doc.text(`$${item.unitPriceUsd.toFixed(2)}`, margin + 158, y + 5.5, {
      align: 'right',
    });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(`$${item.lineTotalUsd.toFixed(2)}`, pageWidth - margin - 3.5, y + 5.5, {
      align: 'right',
    });

    y += rowHeight;
  });

  // Totals Summary Block (Right)
  y += 8;
  const summaryWidth = 74;
  const summaryX = pageWidth - margin - summaryWidth;
  const subtotal = Number(invoice.subtotalUsd ?? invoice.amountUsd);
  const discount = Number(invoice.discountUsd ?? 0);
  const taxPct = Number(invoice.taxRatePercent ?? 0);
  const taxableBase = Math.max(0, subtotal - discount);
  const taxAmount = Number(((taxableBase * taxPct) / 100).toFixed(2));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(formatUsdAmount(subtotal), pageWidth - margin, y, { align: 'right' });

  if (discount > 0) {
    y += 5.5;
    doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
    doc.text('Discount:', summaryX, y);
    doc.setTextColor(22, 163, 74);
    doc.text(`-${formatUsdAmount(discount)}`, pageWidth - margin, y, {
      align: 'right',
    });
  }

  if (template.showTaxColumn || taxPct > 0) {
    y += 5.5;
    doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
    doc.text(`Tax (${taxPct}%):`, summaryX, y);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(formatUsdAmount(taxAmount), pageWidth - margin, y, { align: 'right' });
  }

  y += 4;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(summaryX, y, pageWidth - margin, y);

  y += 6.5;
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(summaryX - 2, y - 4.8, summaryWidth + 2, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.status === 'paid' ? 'TOTAL PAID:' : 'TOTAL DUE:', summaryX + 2, y + 1.8);
  doc.text(formatUsdAmount(invoice.amountUsd), pageWidth - margin - 2, y + 1.8, {
    align: 'right',
  });

  if (
    currencyHint &&
    currencyHint.code !== 'USD' &&
    currencyHint.formattedTotal
  ) {
    y += 8.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
    doc.text(
      `Local Currency Equivalent (${currencyHint.code}): ${currencyHint.formattedTotal}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );
  }

  // Payment Channels & Instructions Section
  y += 14;
  if (y < pageHeight - 48) {
    const activeManualChannels = paymentMethods
      .filter((m) => m.enabled && (m.kind === 'easypaisa' || m.kind === 'jazzcash' || m.kind === 'bank_transfer'))
      .slice(0, 3);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    const boxHeight = activeManualChannels.length > 0 ? 34 : 22;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text('PAYMENT INSTRUCTIONS & VERIFIED CHANNELS', margin + 4.5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const instrLines = doc.splitTextToSize(
      invoice.notes
        ? `${template.paymentInstructions}  |  Note: ${invoice.notes}`
        : template.paymentInstructions,
      contentWidth - 9
    );
    doc.text(instrLines.slice(0, 2), margin + 4.5, y + 11.2);

    if (activeManualChannels.length > 0) {
      activeManualChannels.forEach((gw, idx) => {
        const lineY = y + 20.5 + idx * 4.2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text(`${gw.name}:`, margin + 4.5, lineY);
        doc.setFont('courier', 'normal');
        doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
        doc.text(
          `${gw.accountTitle} · ${gw.accountNumber}${gw.ibanOrRouting ? ` (${gw.ibanOrRouting})` : ''}`,
          margin + 46,
          lineY
        );
      });
    }
  }

  // Footer
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, pageHeight - 17, pageWidth - margin, pageHeight - 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(mutedInk[0], mutedInk[1], mutedInk[2]);
  const footerLines = doc.splitTextToSize(template.footerNote, contentWidth);
  doc.text(footerLines.slice(0, 2), pageWidth / 2, pageHeight - 12, {
    align: 'center',
  });

  doc.save(`${invoice.id}.pdf`);
}
