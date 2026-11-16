import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileText,
  Globe,
  Lock,
  Mail,
  Receipt,
  RefreshCw,
  Scale,
  Send,
  ShieldAlert,
} from 'lucide-react';
import {
  LEGAL_POLICIES,
  LEGAL_POLICY_ORDER,
  LegalPolicyId,
} from '../../data/legalPoliciesData';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface LegalPolicyPageProps {
  activePolicy: LegalPolicyId;
  onSelectPolicy: (policy: LegalPolicyId, selector?: string) => void;
  onNavigateHome: (selector?: string) => void;
  onNavigatePath?: (path: string) => void;
}

const POLICY_ICONS: Record<LegalPolicyId, React.ElementType> = {
  'terms-conditions': Scale,
  'privacy-policy': Lock,
  'order-terms': Receipt,
  'refund-policy': RefreshCw,
  'abuse-policy': ShieldAlert,
};

const ABUSE_CATEGORIES = [
  {
    value: 'phishing',
    label: 'Phishing / Brand Impersonation',
    sla: 'P0 Critical (< 2 Hours)',
  },
  {
    value: 'malware',
    label: 'Malware / Ransomware / Botnet C2',
    sla: 'P0 Critical (< 2 Hours)',
  },
  {
    value: 'ddos',
    label: 'DDoS / Outbound Network Flood',
    sla: 'P0 Critical (< 2 Hours)',
  },
  {
    value: 'spam',
    label: 'Spam / Unsolicited Bulk Email',
    sla: 'P1 High (< 12 Hours)',
  },
  {
    value: 'dmca',
    label: 'DMCA / Copyright / Trademark Infringement',
    sla: 'P2 Legal Review (24–48 Hours)',
  },
  {
    value: 'bruteforce',
    label: 'Port Scanning / SSH & RDP Brute-Force',
    sla: 'P1 High (< 12 Hours)',
  },
  {
    value: 'csam',
    label: 'CSAM / Severe Illegal Content (Emergency)',
    sla: 'Immediate Drop (< 1 Hour)',
  },
  {
    value: 'other',
    label: 'Other Security or Network Violation',
    sla: 'P1 High (< 12 Hours)',
  },
];

interface AbuseReceipt {
  ticketId: string;
  categoryLabel: string;
  slaTarget: string;
  targetResource: string;
  reporterEmail: string;
  country: string;
  submittedAtUtc: string;
}

export const LegalPolicyPage: React.FC<LegalPolicyPageProps> = ({
  activePolicy,
  onSelectPolicy,
  onNavigateHome,
  onNavigatePath,
}) => {
  const { formatPriceString, countryName } = useCurrency();
  const { submitAbuseComplaint, cmsPages } = usePlatform();
  const doc = LEGAL_POLICIES[activePolicy];
  const pageCms = cmsPages.find((p) => p.id === activePolicy);
  const PolicyIcon = POLICY_ICONS[activePolicy];

  // Interactive International Abuse Complaint Form State
  const [reporterName, setReporterName] = useState('');
  const [organization, setOrganization] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterCountry, setReporterCountry] = useState(countryName || '');
  const [abuseCategory, setAbuseCategory] = useState('phishing');
  const [targetResource, setTargetResource] = useState('');
  const [incidentUtc, setIncidentUtc] = useState('');
  const [evidenceDetails, setEvidenceDetails] = useState('');
  const [legalDeclaration, setLegalDeclaration] = useState(false);
  const [formError, setFormError] = useState('');
  const [abuseReceipt, setAbuseReceipt] = useState<AbuseReceipt | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  useEffect(() => {
    if (!reporterCountry && countryName) {
      setReporterCountry(countryName);
    }
  }, [countryName, reporterCountry]);

  useEffect(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://cpcloudhost.com';

    const localizedDescription = formatPriceString(
      pageCms?.seoDescription?.trim() || doc.seoDescription
    );
    applyPageSeoMetadata({
      title: pageCms?.seoTitle?.trim() || doc.seoTitle,
      description: localizedDescription,
      keywords: [
        'cpcloudhost.com legal',
        doc.shortLabel.toLowerCase(),
        'web hosting terms and conditions',
        'international hosting privacy policy',
        'hosting refund policy',
        'report network abuse',
      ],
      ogType: 'website',
      canonicalPath: `/${doc.id}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageCms?.heroTitle?.trim() || doc.title,
        description: localizedDescription,
        url: `${origin}/${doc.id}`,
        dateModified: '2026-11-01',
        publisher: {
          '@type': 'Organization',
          name: 'cpcloudhost.com',
          email: doc.contactEmail,
          url: origin,
        },
      },
    });
  }, [doc, pageCms, formatPriceString]);

  const scrollToClause = (clauseId: string) => {
    const el = document.getElementById(clauseId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAbuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = reporterEmail.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail);

    if (!reporterName.trim()) {
      setFormError('Please provide your full name or authorized officer name.');
      return;
    }
    if (!emailValid) {
      setFormError('Please enter a valid contact email address for case updates.');
      return;
    }
    if (!targetResource.trim()) {
      setFormError(
        'Please specify the offending domain name, exact URL, or IPv4/IPv6 address.'
      );
      return;
    }
    if (evidenceDetails.trim().length < 20) {
      setFormError(
        'Please include technical evidence, timestamps, log headers, or DMCA details (minimum 20 characters).'
      );
      return;
    }
    if (!legalDeclaration) {
      setFormError(
        'Please confirm the good-faith accuracy declaration before submitting your complaint.'
      );
      return;
    }

    const catObj =
      ABUSE_CATEGORIES.find((c) => c.value === abuseCategory) ??
      ABUSE_CATEGORIES[0];

    const seed =
      (cleanEmail + targetResource.trim() + Date.now().toString()).split('').reduce(
        (acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 900000,
        100000
      ) + 100000;

    const record = submitAbuseComplaint({
      ticketId: `ABUSE-2026-${String(seed).slice(0, 6)}`,
      category: catObj.value,
      categoryLabel: catObj.label,
      slaTarget: catObj.sla,
      targetResource: targetResource.trim(),
      reporterName: reporterName.trim(),
      organization: organization.trim(),
      reporterEmail: cleanEmail,
      country: reporterCountry.trim() || 'International',
      incidentUtc: incidentUtc.trim(),
      evidenceDetails: evidenceDetails.trim(),
    });

    setAbuseReceipt({
      ticketId: record.ticketId,
      categoryLabel: record.categoryLabel,
      slaTarget: record.slaTarget,
      targetResource: record.targetResource,
      reporterEmail: record.reporterEmail,
      country: record.country,
      submittedAtUtc: record.submittedAtUtc,
    });
  };

  const handleCopyTicket = () => {
    if (!abuseReceipt || typeof navigator === 'undefined') return;
    navigator.clipboard
      ?.writeText(
        `Ticket: ${abuseReceipt.ticketId} | Target: ${abuseReceipt.targetResource} | Category: ${abuseReceipt.categoryLabel}`
      )
      .then(() => {
        setCopiedTicket(true);
        setTimeout(() => setCopiedTicket(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb & Legal Hub Header */}
      <section className="bg-gradient-to-b from-[#F2FAF8] via-[#F8FAFC] to-white border-b border-[#E2E8F0] pt-8 pb-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-600 mb-6"
          >
            <button
              type="button"
              onClick={() => onNavigateHome('#top')}
              className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
            >
              Home
            </button>
            <ChevronRight
              className="w-3.5 h-3.5 text-slate-400"
              aria-hidden="true"
            />
            <span className="text-slate-600">Legal &amp; Compliance</span>
            <ChevronRight
              className="w-3.5 h-3.5 text-slate-400"
              aria-hidden="true"
            />
            <span className="text-[#0F172A] font-semibold">
              {doc.shortLabel}
            </span>
          </nav>

          {/* 5-Policy Navigation Switcher */}
          <div
            role="tablist"
            aria-label="Legal policies navigation"
            className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#E2E8F0] rounded-xl mb-8"
          >
            {LEGAL_POLICY_ORDER.map((policyId) => {
              const item = LEGAL_POLICIES[policyId];
              const Icon = POLICY_ICONS[policyId];
              const isSelected = activePolicy === policyId;

              return (
                <button
                  key={policyId}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectPolicy(policyId, '#top')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E6B63] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2.5">
                <span className="font-semibold text-[#0E6B63]">
                  {pageCms?.heroBadge?.trim() || 'cpcloudhost.com Legal Framework'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{doc.jurisdictionBadge}</span>
              </div>

              <h1
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] leading-[1.14]"
                style={{ textWrap: 'balance' }}
              >
                {pageCms?.heroTitle?.trim() || doc.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 mt-3.5 leading-relaxed max-w-3xl">
                {formatPriceString(pageCms?.heroSubtitle?.trim() || doc.subtitle)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>
                  Effective Date:{' '}
                  <strong className="text-[#0F172A] font-semibold">
                    {doc.effectiveDate}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Last Revised:{' '}
                  <strong className="text-[#0F172A] font-semibold">
                    {doc.lastUpdated}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Official Desk:{' '}
                  <a
                    href={`mailto:${doc.contactEmail}`}
                    className="font-mono font-semibold text-[#0E6B63] hover:underline"
                  >
                    {doc.contactEmail}
                  </a>
                </span>
              </div>
            </div>

            {activePolicy === 'abuse-policy' && (
              <div className="lg:col-span-4 lg:flex lg:justify-end">
                <button
                  type="button"
                  onClick={() => scrollToClause('abuse-complaint-form')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  <span>File Abuse Complaint Now</span>
                </button>
              </div>
            )}
          </div>

          {/* 4-Column Executive Summary Matrix */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {doc.summaryPoints.map((pt) => (
              <div
                key={pt.label}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4"
              >
                <p className="text-xs text-slate-500">{pt.label}</p>
                <p className="font-display text-sm font-bold text-[#0F172A] mt-1">
                  {formatPriceString(pt.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Body: Sticky Clause Index + Full Legal Prose */}
      <section className="py-12 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sticky Sidebar Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <PolicyIcon
                  className="w-4 h-4 text-[#0E6B63] shrink-0"
                  aria-hidden="true"
                />
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  Document Contents
                </h2>
              </div>

              <nav aria-label="Clause navigation" className="space-y-1">
                {doc.clauses.map((clause) => (
                  <button
                    key={clause.id}
                    type="button"
                    onClick={() => scrollToClause(clause.id)}
                    className="w-full text-left flex items-baseline gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-600 hover:bg-white hover:text-[#0E6B63] transition-colors cursor-pointer"
                  >
                    <span className="font-mono font-semibold text-[#0E6B63] tabular-nums shrink-0">
                      {clause.number}
                    </span>
                    <span className="font-medium leading-snug">
                      {clause.title}
                    </span>
                  </button>
                ))}
                {activePolicy === 'abuse-policy' && (
                  <button
                    type="button"
                    onClick={() => scrollToClause('abuse-complaint-form')}
                    className="w-full text-left flex items-baseline gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-[#0E6B63] bg-white border border-[#E2E8F0] hover:border-[#0E6B63] transition-colors cursor-pointer mt-2"
                  >
                    <span className="font-mono tabular-nums shrink-0">06.</span>
                    <span>Submit Official Abuse Complaint</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Direct Regulatory / Legal Desk Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0E6B63]">
                <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>International Legal &amp; Trust Desk</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For formal Data Subject Access Requests (DSAR), subpoenas,
                corporate VAT invoicing, or urgent security escalations, contact
                our dedicated compliance inbox directly.
              </p>
              <a
                href={`mailto:${doc.contactEmail}`}
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#0F172A] hover:text-[#0E6B63] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                <span>{doc.contactEmail}</span>
              </a>

              {activePolicy !== 'abuse-policy' && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectPolicy('abuse-policy', '#top')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                  >
                    <span>Need to report spam, phishing, or DMCA?</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Primary Legal Document Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Structured Comparison / Jurisdiction Matrix Table */}
            {doc.matrixHeading && doc.matrixHeaders && doc.matrixRows && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-2">
                  <FileText
                    className="w-4 h-4 text-[#0E6B63] shrink-0"
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                    {doc.matrixHeading}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]/60 text-xs font-semibold text-[#0F172A]">
                        <th className="py-3 px-4">{doc.matrixHeaders[0]}</th>
                        <th className="py-3 px-4">{doc.matrixHeaders[1]}</th>
                        <th className="py-3 px-4">{doc.matrixHeaders[2]}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs sm:text-sm text-slate-600">
                      {doc.matrixRows.map((row) => (
                        <tr key={row.col1} className="align-top">
                          <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                            {formatPriceString(row.col1)}
                          </td>
                          <td className="py-3.5 px-4 leading-relaxed">
                            {formatPriceString(row.col2)}
                          </td>
                          <td className="py-3.5 px-4 leading-relaxed">
                            {formatPriceString(row.col3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Legal Clauses */}
            <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl bg-white">
              {doc.clauses.map((clause) => (
                <article
                  key={clause.id}
                  id={clause.id}
                  className="p-6 sm:p-8 scroll-mt-24"
                >
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] flex items-baseline gap-2.5">
                    <span className="font-mono text-[#0E6B63] tabular-nums shrink-0">
                      {clause.number}
                    </span>
                    <span>{clause.title}</span>
                  </h2>

                  <div className="mt-3.5 space-y-3 text-sm sm:text-[15px] text-slate-600 leading-[1.7]">
                    {clause.paragraphs.map((p, idx) => (
                      <p key={idx}>{formatPriceString(p)}</p>
                    ))}
                  </div>

                  {clause.bullets && clause.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2.5 pl-1">
                      {clause.bullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed"
                        >
                          <CheckCircle2
                            className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{formatPriceString(bullet)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>

            {/* Interactive International Abuse Complaint Form (Exclusively on Abuse Policy Page) */}
            {activePolicy === 'abuse-policy' && (
              <section
                id="abuse-complaint-form"
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 sm:p-8 scroll-mt-24"
              >
                <div className="mb-6">
                  <p className="text-xs font-semibold text-[#0E6B63] mb-1.5">
                    Official International Trust &amp; Safety Portal
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
                    Submit an Official Network Abuse or DMCA Complaint
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Use this form if a domain, website, email sender, or VPS IP
                    operating on cpcloudhost.com infrastructure is involved in
                    phishing, malware, spam, DDoS attacks, unauthorized scraping,
                    or copyright infringement.
                  </p>
                </div>

                {abuseReceipt ? (
                  <div className="bg-white border border-[#0E6B63]/40 rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          className="w-6 h-6 text-[#0E6B63] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#0F172A]">
                            Official Abuse Complaint Logged
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            Your report has been queued directly with our 24/7
                            Trust &amp; Safety response desk. Confirmation details
                            have been dispatched to{' '}
                            <strong className="text-[#0F172A]">
                              {abuseReceipt.reporterEmail}
                            </strong>
                            .
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500">Case Reference ID</span>
                        <p className="font-mono font-bold text-[#0E6B63] text-sm mt-0.5">
                          {abuseReceipt.ticketId}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">
                          Assigned Escalation SLA
                        </span>
                        <p className="font-semibold text-[#0F172A] text-sm mt-0.5">
                          {abuseReceipt.slaTarget}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Target Resource</span>
                        <p className="font-mono text-[#0F172A] mt-0.5 break-all">
                          {abuseReceipt.targetResource}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">
                          Category &amp; Timestamp
                        </span>
                        <p className="text-[#0F172A] mt-0.5">
                          {abuseReceipt.categoryLabel} · {abuseReceipt.submittedAtUtc}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={handleCopyTicket}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedTicket ? (
                          <Check className="w-3.5 h-3.5 text-[#0E6B63]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedTicket
                            ? 'Copied Reference'
                            : 'Copy Case Reference'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAbuseReceipt(null);
                          setTargetResource('');
                          setEvidenceDetails('');
                          setIncidentUtc('');
                          setLegalDeclaration(false);
                        }}
                        className="px-4 py-2 text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                      >
                        File Another Report
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleAbuseSubmit}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-5"
                    noValidate
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="abuse-name"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Complainant Full Name *
                        </label>
                        <input
                          id="abuse-name"
                          type="text"
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins / Security Officer"
                          className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="abuse-org"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Organization / CERT / Legal Agency (Optional)
                        </label>
                        <input
                          id="abuse-org"
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. Brand Security / National CERT"
                          className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="abuse-email"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Official Contact Email *
                        </label>
                        <input
                          id="abuse-email"
                          type="email"
                          value={reporterEmail}
                          onChange={(e) => setReporterEmail(e.target.value)}
                          placeholder="security@company.com"
                          className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="abuse-country"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Country / Legal Jurisdiction *
                        </label>
                        <input
                          id="abuse-country"
                          type="text"
                          value={reporterCountry}
                          onChange={(e) => setReporterCountry(e.target.value)}
                          placeholder="e.g. United Kingdom, United States, Pakistan"
                          className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="abuse-category"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Violation Category *
                        </label>
                        <select
                          id="abuse-category"
                          value={abuseCategory}
                          onChange={(e) => setAbuseCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63] cursor-pointer"
                        >
                          {ABUSE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="abuse-time"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Incident Timestamp (UTC Preferred)
                        </label>
                        <input
                          id="abuse-time"
                          type="text"
                          value={incidentUtc}
                          onChange={(e) => setIncidentUtc(e.target.value)}
                          placeholder="e.g. 2026-11-13 14:22:05 UTC"
                          className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="abuse-target"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Offending Domain, Exact URL, or IP Address *
                      </label>
                      <input
                        id="abuse-target"
                        type="text"
                        value={targetResource}
                        onChange={(e) => setTargetResource(e.target.value)}
                        placeholder="https://example-offending-url.com/login or 185.x.x.x"
                        className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="abuse-evidence"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Technical Logs, SMTP Headers, or DMCA Statutory Statement *
                      </label>
                      <textarea
                        id="abuse-evidence"
                        rows={5}
                        value={evidenceDetails}
                        onChange={(e) => setEvidenceDetails(e.target.value)}
                        placeholder="Paste raw firewall logs, email headers, phishing target details, or copyright work URLs..."
                        className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={legalDeclaration}
                        onChange={(e) => setLegalDeclaration(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#0E6B63] focus:ring-[#0E6B63]"
                      />
                      <span>
                        I state in good faith that the information in this complaint
                        is accurate and complete, and (for IP/copyright claims)
                        that I am the rights owner or authorized to act on their
                        behalf.
                      </span>
                    </label>

                    {formError && (
                      <p
                        role="alert"
                        className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5"
                      >
                        {formError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <span className="text-xs text-slate-500">
                        Direct PGP/CERT escalation:{' '}
                        <strong className="font-mono text-[#0F172A]">
                          abuse@cpcloudhost.com
                        </strong>
                      </span>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg shadow-[0_4px_14px_rgba(14,107,99,0.22)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>Submit Official Abuse Complaint</span>
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}
          </div>
        </div>
      </section>

      <CmsExtraSections
        sections={pageCms?.sections}
        onNavigateUrl={(url) => (onNavigatePath ? onNavigatePath(url) : onNavigateHome(url))}
      />
    </div>
  );
};
