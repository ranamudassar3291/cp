import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Headphones,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  Loader2,
  Lock,
  LogOut,
  MailCheck,
  MapPin,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  Minimize2,
  Monitor,
  Paperclip,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Unlock,
  UserCheck,
  X,
} from 'lucide-react';
import {
  CURRENCY_CATALOG,
  POPULAR_COUNTRIES,
  useCurrency,
} from '../../context/CurrencyContext';
import {
  CancellationType,
  LoginActivityRecord,
  LoginActivityStatus,
  PlatformInvoice,
  PlatformOrder,
  SupportTicketRecord,
  TicketAttachment,
  TicketDepartment,
  TicketPriority,
  TicketStatus,
  usePlatform,
} from '../../context/PlatformContext';
import type { TicketAiTriageResult } from '../../types/liveChat';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';
import {
  InvoiceDetailPage,
  getCancellationStatusDisplay,
  getRefundStatusDisplay,
} from './InvoiceDetailPage';
import { DomainManagementPage } from './DomainManagementPage';
import { evaluateDomainLifecycle } from '../../utils/domainLifecycle';
import {
  buildOtpAuthUri,
  generateBase32Secret,
  generateTotpCode,
  getTotpSecondsRemaining,
} from '../../utils/totpSecurity';

export type DashboardSection =
  | 'overview'
  | 'services'
  | 'domains'
  | 'billing'
  | 'tickets'
  | 'account';

interface ClientDashboardPageProps {
  initialRoutePath?: string;
  onSyncRoutePath?: (path: string) => void;
  onNavigateHome: () => void;
  onOpenKnowledgeBase: () => void;
  onSignedOut: () => void;
  onReturnToAdminClient?: (clientUserId: string) => void;
  onOrderSharedHosting?: () => void;
  onNavigateOrderCategory?: (
    category:
      | 'free-trial'
      | 'shared-hosting'
      | 'wordpress-hosting'
      | 'windows-hosting'
      | 'cpanel-hosting'
      | 'reseller-hosting'
      | 'vps-hosting'
      | 'n8n-hosting'
      | 'domain-registration'
      | 'domain-transfer'
  ) => void;
}

const SIDEBAR_ITEMS: {
  id: DashboardSection;
  label: string;
  path: string;
  icon: React.FC<{ className?: string; 'aria-hidden'?: boolean }>;
}[] = [
  { id: 'overview', label: 'Overview', path: '/dashboard', icon: LayoutGrid },
  { id: 'services', label: 'Services', path: '/dashboard/services', icon: Server },
  { id: 'domains', label: 'Domains', path: '/dashboard/domains', icon: Globe },
  { id: 'billing', label: 'Billing & Invoices', path: '/dashboard/billing', icon: Receipt },
  { id: 'tickets', label: 'Support Tickets', path: '/dashboard/tickets', icon: LifeBuoy },
  { id: 'account', label: 'Account & Security', path: '/dashboard/account', icon: ShieldCheck },
];

const TICKET_DEPARTMENTS: {
  id: TicketDepartment;
  description: string;
}[] = [
  {
    id: 'Migration Site',
    description: 'Zero-downtime cPanel, WordPress, or VPS site transfers',
  },
  {
    id: 'Technical Support',
    description: 'PHP, LiteSpeed, DNS, SSL, email routing & server health',
  },
  {
    id: 'Billing',
    description: 'Invoices, multi-currency payments, Switch Credits & renewals',
  },
  {
    id: 'Account',
    description: 'KYC verification, ownership transfer, 2FA & security',
  },
  {
    id: 'Support',
    description: 'General hosting guidance, plan upgrades & pre-sales',
  },
  {
    id: 'Abuse',
    description: 'Report spamming, phishing, malware, DMCA or AUP compliance notices',
  },
];

const QUICK_ORDER_CATALOG: {
  id: string;
  productType: PlatformOrder['productType'];
  planName: string;
  monthlyUsd: number;
  yearlyUsd: number;
  specs: string;
}[] = [
  {
    id: 'shared-velocity',
    productType: 'Shared Cloud',
    planName: 'Cloud Velocity NVMe',
    monthlyUsd: 4.99,
    yearlyUsd: 47.88,
    specs: 'Unlimited Websites · NVMe Storage · Free SSL & Daily Backups',
  },
  {
    id: 'cpanel-turbo',
    productType: 'cPanel Hosting',
    planName: 'cPanel Turbo Pro',
    monthlyUsd: 16.99,
    yearlyUsd: 179.88,
    specs: 'LiteSpeed Enterprise · Node.js / Python · 1 Free .com Domain',
  },
  {
    id: 'wp-scale',
    productType: 'Managed WordPress',
    planName: 'WP Scale Edge',
    monthlyUsd: 11.99,
    yearlyUsd: 119.88,
    specs: 'StackCache + Redis Object Cache · One-Click Staging',
  },
  {
    id: 'kvm-vps-8',
    productType: 'Unmanaged VPS',
    planName: 'KVM NVMe Compute 8 vCPU',
    monthlyUsd: 39.99,
    yearlyUsd: 429.0,
    specs: '8 Dedicated vCPU · 16 GB ECC RAM · 200 GB Gen4 NVMe · Root SSH',
  },
  {
    id: 'n8n-pro',
    productType: 'n8n Hosting',
    planName: 'n8n Automation Pro 8 vCPU',
    monthlyUsd: 49.99,
    yearlyUsd: 529.0,
    specs: 'Docker + PostgreSQL + Redis Queue + Auto TLS Webhooks',
  },
  {
    id: 'domain-com',
    productType: 'Domain Registration',
    planName: '.com Domain + DNSSEC',
    monthlyUsd: 14.99,
    yearlyUsd: 14.99,
    specs: 'Global Anycast DNS · Free WHOIS Privacy · Registrar Lock',
  },
];

const DATACENTER_OPTIONS = [
  'London, UK (Tier-4)',
  'Frankfurt, DE',
  'Dallas, USA',
  'Singapore, SG',
];

function StatusIndicator({
  tone,
  label,
}: {
  tone: 'emerald' | 'amber' | 'red' | 'teal' | 'slate';
  label: string;
}) {
  const styles = {
    emerald: 'text-[#16A34A] bg-[#16A34A]/10',
    amber: 'text-[#D97706] bg-[#D97706]/10',
    red: 'text-[#DC2626] bg-[#DC2626]/10',
    teal: 'text-[#0E6B63] bg-[#0E6B63]/10',
    slate: 'text-slate-600 bg-slate-100',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      {tone === 'emerald' ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : tone === 'amber' ? (
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : tone === 'red' ? (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : tone === 'teal' ? (
        <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}

function formatOrderTone(status: PlatformOrder['status']): 'emerald' | 'amber' | 'red' | 'slate' {
  if (status === 'active') return 'emerald';
  if (status === 'pending') return 'amber';
  if (status === 'suspended') return 'red';
  return 'slate';
}

function formatTicketStatusTone(status: TicketStatus): 'teal' | 'amber' | 'emerald' {
  if (status === 'resolved') return 'emerald';
  if (status === 'pending') return 'amber';
  return 'teal';
}

function formatTicketStatusLabel(status: TicketStatus): string {
  if (status === 'resolved') return 'Resolved';
  if (status === 'pending') return 'Pending';
  return 'Open';
}

function generateClientApiToken(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'cph_live_';
  for (let i = 0; i < 32; i += 1) {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      token += alphabet[arr[0] % alphabet.length];
    } else {
      token += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return token;
}

function parseDashboardSubRoute(path?: string): {
  section: DashboardSection;
  ticketSubView: 'list' | 'new' | 'detail';
  ticketId: string | null;
  billingSubView: 'list' | 'detail';
  invoiceId: string | null;
  domainSubView: 'list' | 'detail';
  domainId: string | null;
} {
  const normalized = (path || '/dashboard').replace(/\/+$/, '');
  if (normalized === '/dashboard/services') {
    return {
      section: 'services',
      ticketSubView: 'list',
      ticketId: null,
      billingSubView: 'list',
      invoiceId: null,
      domainSubView: 'list',
      domainId: null,
    };
  }
  if (normalized.startsWith('/dashboard/domains/')) {
    const id = normalized.slice('/dashboard/domains/'.length).trim();
    if (id) {
      return {
        section: 'domains',
        ticketSubView: 'list',
        ticketId: null,
        billingSubView: 'list',
        invoiceId: null,
        domainSubView: 'detail',
        domainId: id,
      };
    }
  }
  if (normalized === '/dashboard/domains') {
    return {
      section: 'domains',
      ticketSubView: 'list',
      ticketId: null,
      billingSubView: 'list',
      invoiceId: null,
      domainSubView: 'list',
      domainId: null,
    };
  }
  if (normalized.startsWith('/dashboard/billing/')) {
    const id = normalized.slice('/dashboard/billing/'.length).trim();
    if (id) {
      return {
        section: 'billing',
        ticketSubView: 'list',
        ticketId: null,
        billingSubView: 'detail',
        invoiceId: id,
        domainSubView: 'list',
        domainId: null,
      };
    }
  }
  if (normalized === '/dashboard/billing') {
    return {
      section: 'billing',
      ticketSubView: 'list',
      ticketId: null,
      billingSubView: 'list',
      invoiceId: null,
      domainSubView: 'list',
      domainId: null,
    };
  }
  if (normalized === '/dashboard/account') {
    return {
      section: 'account',
      ticketSubView: 'list',
      ticketId: null,
      billingSubView: 'list',
      invoiceId: null,
      domainSubView: 'list',
      domainId: null,
    };
  }
  if (normalized === '/dashboard/tickets/new') {
    return {
      section: 'tickets',
      ticketSubView: 'new',
      ticketId: null,
      billingSubView: 'list',
      invoiceId: null,
      domainSubView: 'list',
      domainId: null,
    };
  }
  if (normalized.startsWith('/dashboard/tickets/')) {
    const id = normalized.replace('/dashboard/tickets/', '').trim();
    if (id) {
      return {
        section: 'tickets',
        ticketSubView: 'detail',
        ticketId: id,
        billingSubView: 'list',
        invoiceId: null,
        domainSubView: 'list',
        domainId: null,
      };
    }
  }
  if (normalized === '/dashboard/tickets') {
    return {
      section: 'tickets',
      ticketSubView: 'list',
      ticketId: null,
      billingSubView: 'list',
      invoiceId: null,
      domainSubView: 'list',
      domainId: null,
    };
  }
  return {
    section: 'overview',
    ticketSubView: 'list',
    ticketId: null,
    billingSubView: 'list',
    invoiceId: null,
    domainSubView: 'list',
    domainId: null,
  };
}

function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readSingleFileAsAttachment(file: File): Promise<TicketAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read file content.'));
        return;
      }
      resolve({
        id: `ATT-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function formatLoginLogStatusTone(status: LoginActivityStatus): 'emerald' | 'amber' | 'red' {
  if (status === 'success') return 'emerald';
  if (status === 'blocked') return 'red';
  return 'amber';
}

function formatLoginLogStatusLabel(status: LoginActivityStatus): string {
  if (status === 'success') return 'Verified';
  if (status === 'blocked') return 'Blocked';
  return 'Warning';
}

export const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({
  initialRoutePath,
  onSyncRoutePath,
  onNavigateHome,
  onOpenKnowledgeBase,
  onSignedOut,
  onReturnToAdminClient,
  onOrderSharedHosting,
  onNavigateOrderCategory,
}) => {
  const {
    currentUser,
    adminImpersonation,
    activeSupportPin,
    users,
    orders,
    invoices,
    tickets,
    loginActivityLogs,
    paymentMethods,
    provisioningModules,
    invoiceTemplateConfig,
    logout,
    exitClientImpersonation,
    addOrder,
    updateClientProfile,
    changePassword,
    updateClientOrderSettings,
    requestOrderCancellation,
    clientNotifyDomainTransferApproved,
    resendDomainVerificationEmail,
    createSupportTicket,
    replySupportTicket,
    resolveSupportTicket,
    reopenSupportTicket,
    rotateSupportPin,
    clearMyLoginLogs,
    enableTwoFactorAuth,
    disableTwoFactorAuth,
    regenerateTwoFactorBackupCodes,
  } = usePlatform();
  const {
    countryCode,
    currency,
    rate,
    detectionSource,
    isDetecting,
    formatPrice,
    setManualCountry,
    resetToAutoIp,
  } = useCurrency();

  const initialParsed = useMemo(
    () => parseDashboardSubRoute(initialRoutePath),
    [initialRoutePath]
  );

  const [section, setSection] = useState<DashboardSection>(initialParsed.section);
  const [ticketSubView, setTicketSubView] = useState<'list' | 'new' | 'detail'>(
    initialParsed.ticketSubView
  );
  const [viewedTicketId, setViewedTicketId] = useState<string | null>(
    initialParsed.ticketId
  );
  const [billingSubView, setBillingSubView] = useState<'list' | 'detail'>(
    initialParsed.billingSubView
  );
  const [viewedInvoiceId, setViewedInvoiceId] = useState<string | null>(
    initialParsed.invoiceId
  );
  const [domainSubView, setDomainSubView] = useState<'list' | 'detail'>(
    initialParsed.domainSubView
  );
  const [viewedDomainId, setViewedDomainId] = useState<string | null>(
    initialParsed.domainId
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Support PIN reveal (Permanent, no expiration timer)
  const [revealSupportPin, setRevealSupportPin] = useState(false);

  // Services filters & drawer
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<
    'all' | PlatformOrder['status']
  >('all');
  const [managedServiceId, setManagedServiceId] = useState<string | null>(null);
  const [revealManagedPassword, setRevealManagedPassword] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState('');
  const [ssoLaunchUrl, setSsoLaunchUrl] = useState('');
  const [showSvcCancelForm, setShowSvcCancelForm] = useState(false);
  const [svcCancelType, setSvcCancelType] =
    useState<CancellationType>('end_of_period');
  const [svcCancelReason, setSvcCancelReason] = useState('');
  const [svcCancelError, setSvcCancelError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    setRevealManagedPassword(false);
    setSsoError('');
    setSsoLaunchUrl('');
    setSsoLoading(false);
  }, [managedServiceId]);

  const handleDirectCpanelSsoLogin = async (svc: PlatformOrder) => {
    setSsoError('');
    setSsoLaunchUrl('');
    const whmMod =
      provisioningModules.find(
        (m) => m.id === svc.serverModuleId && m.moduleType === 'whm'
      ) ??
      provisioningModules.find(
        (m) => m.moduleType === 'whm' && m.enabled && m.apiToken.trim()
      );
    const targetUser = (svc.cpanelUsername || '').trim();
    if (!whmMod || !whmMod.hostname || !whmMod.apiToken.trim()) {
      setSsoError(
        'Direct SSO session requires an active WHM server module API token. Use the cPanel URL and credentials above.'
      );
      return;
    }
    if (!targetUser) {
      setSsoError('cPanel account username is not assigned yet for this service.');
      return;
    }
    setSsoLoading(true);
    try {
      const res = await fetch('/api/modules/whm/sso-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: whmMod.hostname,
          port: whmMod.port,
          useSsl: whmMod.useSsl,
          username: whmMod.username,
          apiToken: whmMod.apiToken,
          ignoreSslErrors: whmMod.ignoreSslErrors,
          acctUsername: targetUser,
          cpanelUsername: targetUser,
          service: svc.productType === 'Reseller Hosting' ? 'whostmgrd' : 'cpaneld',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        ssoUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.ssoUrl) {
        setSsoError(
          data.error || 'Could not generate WHM single sign-on session URL.'
        );
        return;
      }
      setSsoLaunchUrl(data.ssoUrl);
      const anchor = document.createElement('a');
      anchor.href = data.ssoUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
      showToast(`Direct cPanel SSO session ready for ${targetUser}`);
    } catch (err) {
      setSsoError(
        err instanceof Error ? err.message : 'Unable to reach WHM SSO endpoint.'
      );
    } finally {
      setSsoLoading(false);
    }
  };

  // Domains search & filter
  const [domainSearch, setDomainSearch] = useState('');
  const [domainStatusFilter, setDomainStatusFilter] = useState<
    'all' | 'active' | 'pending' | 'expired'
  >('all');

  // Billing filters & dedicated invoice view state
  const enabledPaymentMethods = useMemo(
    () => paymentMethods.filter((m) => m.enabled),
    [paymentMethods]
  );
  const [billingFilter, setBillingFilter] = useState<
    'all' | 'unpaid' | 'paid' | 'refunded' | 'cancelled'
  >('all');
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>(
    () =>
      paymentMethods.find((m) => m.enabled)?.name || 'Easypaisa Mobile Wallet'
  );

  // Support tickets filters, attachments & dedicated pages (NO POPUPS)
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | TicketStatus>('all');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [replyAttachmentError, setReplyAttachmentError] = useState('');
  const [expandedAttachmentId, setExpandedAttachmentId] = useState<string | null>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDept, setNewTicketDept] =
    useState<TicketDepartment>('Technical Support');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('Normal');
  const [newTicketService, setNewTicketService] = useState('');
  const [newTicketBody, setNewTicketBody] = useState('');
  const [newTicketAttachments, setNewTicketAttachments] = useState<TicketAttachment[]>([]);
  const [newTicketError, setNewTicketError] = useState('');
  const [aiTriageResult, setAiTriageResult] = useState<TicketAiTriageResult | null>(null);
  const [aiTriageLoading, setAiTriageLoading] = useState(false);
  const [aiTriageError, setAiTriageError] = useState('');
  const [aiSelfResolvedNotice, setAiSelfResolvedNotice] = useState('');
  const [detailAiTriage, setDetailAiTriage] = useState<TicketAiTriageResult | null>(null);
  const [detailAiLoading, setDetailAiLoading] = useState(false);
  const [detailAiError, setDetailAiError] = useState('');

  // Login Activity Logs filters
  const [loginLogFilter, setLoginLogFilter] = useState<
    'all' | 'success' | 'alerts' | 'security'
  >('all');
  const [loginLogSearch, setLoginLogSearch] = useState('');

  // Quick service order modal
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [quickCatalogId, setQuickCatalogId] = useState(QUICK_ORDER_CATALOG[0].id);
  const [quickDomainInput, setQuickDomainInput] = useState('');
  const [quickCycle, setQuickCycle] = useState<'Monthly' | 'Yearly'>('Yearly');
  const [quickDatacenter, setQuickDatacenter] = useState(DATACENTER_OPTIONS[0]);
  const [quickOrderError, setQuickOrderError] = useState('');

  // Account & Real 2FA state
  const activeAccountRecord = useMemo(
    () =>
      users.find(
        (u) => currentUser && u.email.toLowerCase() === currentUser.email.toLowerCase()
      ) ?? null,
    [users, currentUser]
  );

  const [profileName, setProfileName] = useState(currentUser?.name ?? '');
  const [profileCompany, setProfileCompany] = useState(activeAccountRecord?.company ?? '');
  const [profilePhone, setProfilePhone] = useState(activeAccountRecord?.phone ?? '');
  const [profileCountry, setProfileCountry] = useState(
    activeAccountRecord?.country ?? currentUser?.country ?? ''
  );
  const [profileError, setProfileError] = useState('');

  // Account Password Change state
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdChangeError, setPwdChangeError] = useState('');
  const [pwdChangeSuccess, setPwdChangeSuccess] = useState('');

  // Real TOTP 2FA enrollment state
  const [setup2faActive, setSetup2faActive] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrDataUrl, setSetupQrDataUrl] = useState('');
  const [setupLivePreviewCode, setSetupLivePreviewCode] = useState('');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(getTotpSecondsRemaining(30));
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [disable2faPromptOpen, setDisable2faPromptOpen] = useState(false);
  const [disable2faConfirmInput, setDisable2faConfirmInput] = useState('');
  const [revealedBackupCodes, setRevealedBackupCodes] = useState(false);

  const [apiToken, setApiToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const existing = window.localStorage.getItem('cpcloud_client_api_token_v1');
      if (existing) return existing;
      const generated = generateClientApiToken();
      window.localStorage.setItem('cpcloud_client_api_token_v1', generated);
      return generated;
    } catch {
      return 'cph_live_7kM9pQ2xL4vR8nW5tY3bZ6cH1jF0dS';
    }
  });
  const [revealApiToken, setRevealApiToken] = useState(false);

  // Route sync helper
  const navigateWithinDashboard = (
    nextSection: DashboardSection,
    sub: 'list' | 'new' | 'detail' = 'list',
    ticketId: string | null = null,
    invoiceId: string | null = null,
    domainId: string | null = null
  ) => {
    setSection(nextSection);
    setTicketSubView(nextSection === 'tickets' ? sub : 'list');
    setViewedTicketId(nextSection === 'tickets' ? ticketId : null);
    setBillingSubView(
      nextSection === 'billing' && invoiceId ? 'detail' : 'list'
    );
    setViewedInvoiceId(nextSection === 'billing' ? invoiceId : null);
    setDomainSubView(
      nextSection === 'domains' && domainId ? 'detail' : 'list'
    );
    setViewedDomainId(nextSection === 'domains' ? domainId : null);
    setSidebarOpen(false);

    if (onSyncRoutePath) {
      if (nextSection === 'tickets') {
        if (sub === 'new') {
          onSyncRoutePath('/dashboard/tickets/new');
        } else if (sub === 'detail' && ticketId) {
          onSyncRoutePath(`/dashboard/tickets/${ticketId}`);
        } else {
          onSyncRoutePath('/dashboard/tickets');
        }
      } else if (nextSection === 'billing' && invoiceId) {
        onSyncRoutePath(`/dashboard/billing/${invoiceId}`);
      } else if (nextSection === 'domains' && domainId) {
        onSyncRoutePath(`/dashboard/domains/${domainId}`);
      } else {
        const target =
          SIDEBAR_ITEMS.find((i) => i.id === nextSection)?.path ?? '/dashboard';
        onSyncRoutePath(target);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInvoicePage = (invoiceOrOrderId: string) => {
    const matched = invoices.find(
      (inv) => inv.id === invoiceOrOrderId || inv.orderId === invoiceOrOrderId
    );
    const resolvedId = matched?.id || invoiceOrOrderId;
    navigateWithinDashboard('billing', 'detail', null, resolvedId, null);
  };

  const handleOpenDomainManagePage = (domId: string) => {
    navigateWithinDashboard('domains', 'detail', null, null, domId);
  };

  const handleGoToOrderCategory = (
    category:
      | 'shared-hosting'
      | 'wordpress-hosting'
      | 'windows-hosting'
      | 'cpanel-hosting'
      | 'domain-registration'
      | 'domain-transfer'
  ) => {
    if (onNavigateOrderCategory) {
      onNavigateOrderCategory(category);
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.assign(`/order/${category}`);
    }
  };

  useEffect(() => {
    const parsed = parseDashboardSubRoute(initialRoutePath);
    setSection(parsed.section);
    setTicketSubView(parsed.ticketSubView);
    setViewedTicketId(parsed.ticketId);
    setBillingSubView(parsed.billingSubView);
    setViewedInvoiceId(parsed.invoiceId);
    setDomainSubView(parsed.domainSubView);
    setViewedDomainId(parsed.domainId);
  }, [initialRoutePath]);

  useEffect(() => {
    const canonical =
      section === 'tickets' && ticketSubView === 'new'
        ? '/dashboard/tickets/new'
        : section === 'tickets' && ticketSubView === 'detail' && viewedTicketId
        ? `/dashboard/tickets/${viewedTicketId}`
        : section === 'billing' && billingSubView === 'detail' && viewedInvoiceId
        ? `/dashboard/billing/${viewedInvoiceId}`
        : section === 'domains' && domainSubView === 'detail' && viewedDomainId
        ? `/dashboard/domains/${viewedDomainId}`
        : SIDEBAR_ITEMS.find((i) => i.id === section)?.path ?? '/dashboard';

    applyPageSeoMetadata({
      title: 'Client Portal Dashboard | cpcloudhost.com',
      description:
        'Manage cloud hosting, cPanel, VPS, n8n nodes, domain DNS, invoices, real-time support tickets, Support PIN, and 2FA security on cpcloudhost.com.',
      canonicalPath: canonical,
      ogType: 'website',
      jsonLd: null,
    });
  }, [
    section,
    ticketSubView,
    viewedTicketId,
    billingSubView,
    viewedInvoiceId,
    domainSubView,
    viewedDomainId,
  ]);

  useEffect(() => {
    setProfileName(currentUser?.name ?? '');
    setProfileCompany(activeAccountRecord?.company ?? '');
    setProfilePhone(activeAccountRecord?.phone ?? '');
    setProfileCountry(activeAccountRecord?.country ?? currentUser?.country ?? '');
  }, [currentUser, activeAccountRecord]);

  // Real TOTP QR generation + 30s live code tick during 2FA enrollment
  useEffect(() => {
    if (!setup2faActive || !setupSecret || !currentUser) return;

    const uri = buildOtpAuthUri(currentUser.email, setupSecret, 'cpcloudhost.com');
    QRCode.toDataURL(uri, {
      width: 184,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => setSetupQrDataUrl(url))
      .catch(() => setSetupQrDataUrl(''));

    const refreshTotp = async () => {
      setTotpSecondsLeft(getTotpSecondsRemaining(30));
      const code = await generateTotpCode(setupSecret, Date.now(), 30);
      setSetupLivePreviewCode(code);
    };
    refreshTotp();
    const timer = window.setInterval(refreshTotp, 1000);
    return () => window.clearInterval(timer);
  }, [setup2faActive, setupSecret, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3400);
  };

  const handleCopy = (key: string, value: string, label: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopiedKey(key);
        showToast(`${label} copied to clipboard`);
        window.setTimeout(() => setCopiedKey(''), 1800);
      })
      .catch(() => {});
  };

  // All orders belonging to the signed-in client
  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (o) => o.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [orders, currentUser]);

  const myHostingServices = useMemo(
    () =>
      myOrders.filter(
        (o) =>
          o.productType !== 'Domain Registration' &&
          o.productType !== 'Domain Transfer'
      ),
    [myOrders]
  );

  const myDomains = useMemo(
    () =>
      myOrders.filter(
        (o) =>
          o.productType === 'Domain Registration' ||
          o.productType === 'Domain Transfer' ||
          Boolean(o.nameservers?.length)
      ),
    [myOrders]
  );

  const myTickets = useMemo(() => {
    if (!currentUser) return [];
    return tickets.filter(
      (t) => t.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [tickets, currentUser]);

  const myInvoices = useMemo<PlatformInvoice[]>(() => {
    if (!currentUser) return [];
    return invoices.filter(
      (inv) => inv.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [invoices, currentUser]);

  const unpaidOrders = useMemo(
    () =>
      myInvoices.filter(
        (inv) => inv.status === 'unpaid' || inv.status === 'overdue'
      ),
    [myInvoices]
  );

  const unpaidTotalUsd = useMemo(
    () => unpaidOrders.reduce((sum, inv) => sum + inv.amountUsd, 0),
    [unpaidOrders]
  );

  const activeServicesCount = useMemo(
    () => myHostingServices.filter((s) => s.status === 'active').length,
    [myHostingServices]
  );

  const openOrPendingTicketsCount = useMemo(
    () => myTickets.filter((t) => t.status !== 'resolved').length,
    [myTickets]
  );

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    return myHostingServices.filter((svc) => {
      if (serviceStatusFilter !== 'all' && svc.status !== serviceStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        svc.planName.toLowerCase().includes(q) ||
        svc.domainOrHost.toLowerCase().includes(q) ||
        svc.productType.toLowerCase().includes(q) ||
        svc.datacenter.toLowerCase().includes(q) ||
        svc.id.toLowerCase().includes(q)
      );
    });
  }, [myHostingServices, serviceSearch, serviceStatusFilter]);

  const filteredDomains = useMemo(() => {
    const q = domainSearch.trim().toLowerCase();
    return myDomains.filter((dom) => {
      const lifecycle = evaluateDomainLifecycle(dom);
      const effectiveStatus = lifecycle.isExpired ? 'expired' : dom.status;
      if (domainStatusFilter !== 'all' && effectiveStatus !== domainStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        dom.domainOrHost.toLowerCase().includes(q) ||
        dom.planName.toLowerCase().includes(q) ||
        dom.id.toLowerCase().includes(q)
      );
    });
  }, [myDomains, domainSearch, domainStatusFilter]);

  const filteredInvoices = useMemo(() => {
    return myInvoices.filter((inv) => {
      if (billingFilter === 'paid') return inv.status === 'paid';
      if (billingFilter === 'unpaid') {
        return (
          inv.status === 'unpaid' ||
          inv.status === 'overdue' ||
          inv.status === 'pending'
        );
      }
      if (billingFilter === 'refunded') {
        return (
          inv.status === 'refunded' ||
          (inv.refundStatus !== undefined && inv.refundStatus !== 'none')
        );
      }
      if (billingFilter === 'cancelled') {
        return (
          inv.status === 'cancelled' ||
          (inv.cancellationStatus !== undefined &&
            inv.cancellationStatus !== 'none')
        );
      }
      return true;
    });
  }, [myInvoices, billingFilter]);

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();
    return myTickets.filter((tkt) => {
      if (ticketFilter !== 'all' && tkt.status !== ticketFilter) return false;
      if (!q) return true;
      return (
        tkt.id.toLowerCase().includes(q) ||
        tkt.subject.toLowerCase().includes(q) ||
        tkt.department.toLowerCase().includes(q) ||
        (tkt.relatedService ?? '').toLowerCase().includes(q)
      );
    });
  }, [myTickets, ticketFilter, ticketSearch]);

  const viewedTicket = useMemo(
    () => myTickets.find((t) => t.id === viewedTicketId) ?? null,
    [myTickets, viewedTicketId]
  );

  const myLoginLogs = useMemo<LoginActivityRecord[]>(() => {
    if (!currentUser) return [];
    return loginActivityLogs.filter(
      (log) => log.userEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [loginActivityLogs, currentUser]);

  const filteredLoginLogs = useMemo(() => {
    const q = loginLogSearch.trim().toLowerCase();
    return myLoginLogs.filter((log) => {
      if (loginLogFilter === 'success' && log.status !== 'success') return false;
      if (loginLogFilter === 'alerts' && log.status === 'success') return false;
      if (
        loginLogFilter === 'security' &&
        !log.eventType.includes('2FA') &&
        !log.eventType.includes('PIN') &&
        !log.eventType.includes('Two-Factor')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        log.eventType.toLowerCase().includes(q) ||
        log.deviceSummary.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        log.locationLabel.toLowerCase().includes(q) ||
        log.authMethod.toLowerCase().includes(q)
      );
    });
  }, [myLoginLogs, loginLogFilter, loginLogSearch]);

  const managedService = useMemo(
    () => myOrders.find((o) => o.id === managedServiceId) ?? null,
    [myOrders, managedServiceId]
  );

  const isServiceLockedByBilling = useCallback(
    (svc: PlatformOrder): boolean => {
      if (svc.status === 'suspended') return true;
      const linkedInv = myInvoices.find((inv) => inv.orderId === svc.id);
      if (linkedInv && linkedInv.status === 'overdue') return true;
      const todayUtc = new Date().toISOString().slice(0, 10);
      if (
        svc.invoicePaid === false &&
        linkedInv &&
        linkedInv.status !== 'paid' &&
        linkedInv.dueDate <= todayUtc
      ) {
        return true;
      }
      if (
        svc.invoicePaid === false &&
        svc.nextDueDate &&
        svc.nextDueDate <= todayUtc
      ) {
        return true;
      }
      return false;
    },
    [myInvoices]
  );

  const handleChangeAccountPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeError('');
    setPwdChangeSuccess('');
    if (!currentPwdInput.trim()) {
      setPwdChangeError('Enter your current account password.');
      return;
    }
    if (newPwdInput.length < 8) {
      setPwdChangeError('New password must be at least 8 characters long.');
      return;
    }
    if (newPwdInput !== confirmPwdInput) {
      setPwdChangeError('New password and confirmation do not match.');
      return;
    }
    const res = changePassword(currentPwdInput, newPwdInput);
    if (!res.ok) {
      setPwdChangeError(res.error ?? 'Unable to update password.');
      return;
    }
    setCurrentPwdInput('');
    setNewPwdInput('');
    setConfirmPwdInput('');
    setPwdChangeSuccess('Password updated successfully. Use your new password on your next sign-in.');
    showToast('Account password updated');
  };

  const viewedDomain = useMemo<PlatformOrder | null>(() => {
    if (!viewedDomainId) return null;
    const targetLower = viewedDomainId.toLowerCase();
    return (
      myDomains.find(
        (d) =>
          d.id.toLowerCase() === targetLower ||
          d.domainOrHost.toLowerCase() === targetLower
      ) ?? null
    );
  }, [myDomains, viewedDomainId]);

  const viewedDomainLinkedInvoice = useMemo<PlatformInvoice | null>(() => {
    if (!viewedDomain) return null;
    return myInvoices.find((inv) => inv.orderId === viewedDomain.id) ?? null;
  }, [myInvoices, viewedDomain]);

  const viewedInvoice = useMemo<PlatformInvoice | null>(() => {
    if (!viewedInvoiceId) return null;
    const targetLower = viewedInvoiceId.toLowerCase();
    return (
      myInvoices.find(
        (inv) =>
          inv.id.toLowerCase() === targetLower ||
          inv.orderId.toLowerCase() === targetLower
      ) ?? null
    );
  }, [myInvoices, viewedInvoiceId]);

  const viewedInvoiceLinkedOrder = useMemo<PlatformOrder | null>(() => {
    if (!viewedInvoice?.orderId) return null;
    return myOrders.find((ord) => ord.id === viewedInvoice.orderId) ?? null;
  }, [myOrders, viewedInvoice]);

  useEffect(() => {
    setShowSvcCancelForm(false);
    setSvcCancelReason('');
    setSvcCancelError('');
  }, [managedServiceId]);

  useEffect(() => {
    if (
      enabledPaymentMethods.length > 0 &&
      !enabledPaymentMethods.some((m) => m.name === selectedPayMethod)
    ) {
      setSelectedPayMethod(enabledPaymentMethods[0].name);
    }
  }, [enabledPaymentMethods, selectedPayMethod]);

  const currencyChoices = POPULAR_COUNTRIES.some(
    (c) => c.currencyCode === currency.code
  )
    ? POPULAR_COUNTRIES
    : [
        {
          countryCode,
          countryName: currency.name,
          currencyCode: currency.code,
        },
        ...POPULAR_COUNTRIES,
      ];

  const sectionTitle =
    section === 'tickets' && ticketSubView === 'new'
      ? 'Create New Ticket'
      : section === 'tickets' && ticketSubView === 'detail' && viewedTicket
      ? viewedTicket.id
      : section === 'domains' && domainSubView === 'detail' && viewedDomain
      ? viewedDomain.domainOrHost
      : SIDEBAR_ITEMS.find((item) => item.id === section)?.label ?? 'Overview';

  const initials = (currentUser?.name ?? 'CP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const handleOpenQuickOrder = (presetId?: string) => {
    if (presetId) setQuickCatalogId(presetId);
    setQuickDomainInput('');
    setQuickOrderError('');
    setShowQuickOrderModal(true);
  };

  const handlePlaceQuickOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const item =
      QUICK_ORDER_CATALOG.find((c) => c.id === quickCatalogId) ??
      QUICK_ORDER_CATALOG[0];
    const cleanHost = quickDomainInput.trim().toLowerCase();
    if (!cleanHost || !cleanHost.includes('.')) {
      setQuickOrderError('Enter a valid domain or node hostname (e.g. app.yourcompany.com).');
      return;
    }

    const cycle: PlatformOrder['billingCycle'] =
      item.productType === 'Domain Registration' ? 'Yearly' : quickCycle;
    const amountUsd = cycle === 'Yearly' ? item.yearlyUsd : item.monthlyUsd;

    const { order: created, invoice: createdInvoice } = addOrder({
      clientEmail: currentUser.email,
      clientName: currentUser.name,
      country: currentUser.country,
      productType: item.productType,
      planName: item.planName,
      domainOrHost: cleanHost,
      billingCycle: cycle,
      amountUsd,
      paymentMethod: 'Account Invoice (Unpaid)',
      datacenter:
        item.productType === 'Domain Registration'
          ? 'Global Anycast DNS'
          : quickDatacenter,
      status: 'pending',
    });

    setShowQuickOrderModal(false);
    setQuickOrderError('');
    handleOpenInvoicePage(createdInvoice?.id || created.id);
    showToast(`Order ${created.id} created — settle invoice to activate service.`);
  };

  const handleAttachFiles = async (
    fileList: FileList | null,
    target: 'new' | 'reply'
  ) => {
    if (!fileList || fileList.length === 0) return;
    const current = target === 'new' ? newTicketAttachments : replyAttachments;
    const setError = target === 'new' ? setNewTicketError : setReplyAttachmentError;
    const setList =
      target === 'new' ? setNewTicketAttachments : setReplyAttachments;

    const remainingSlots = Math.max(0, 5 - current.length);
    if (remainingSlots === 0) {
      setError('Maximum 5 attachments allowed per message.');
      return;
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots);
    const maxBytes = 10 * 1024 * 1024; // 10 MB per file
    const oversized = selectedFiles.find((f) => f.size > maxBytes);
    if (oversized) {
      setError(
        `File "${oversized.name}" exceeds the 10 MB limit (${formatAttachmentSize(oversized.size)}).`
      );
      return;
    }

    try {
      const encoded = await Promise.all(selectedFiles.map(readSingleFileAsAttachment));
      setError('');
      setList((prev) => [...prev, ...encoded].slice(0, 5));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to attach the selected file.'
      );
    }
  };

  const handleOpenCreateTicketPage = (preselectedService?: string) => {
    setNewTicketSubject('');
    setNewTicketDept('Technical Support');
    setNewTicketPriority('Normal');
    setNewTicketService(preselectedService ?? '');
    setNewTicketBody('');
    setNewTicketAttachments([]);
    setNewTicketError('');
    setAiTriageResult(null);
    setAiTriageError('');
    setAiSelfResolvedNotice('');
    navigateWithinDashboard('tickets', 'new', null);
  };

  const handleFinalizeCreateTicket = () => {
    if (!newTicketSubject.trim() || newTicketSubject.trim().length < 4) {
      setNewTicketError('Please enter a descriptive ticket subject (minimum 4 characters).');
      return;
    }
    if (!newTicketBody.trim() || newTicketBody.trim().length < 10) {
      setNewTicketError('Please describe your issue or request in detail (minimum 10 characters).');
      return;
    }

    const created = createSupportTicket({
      subject: newTicketSubject,
      department: newTicketDept,
      priority: newTicketPriority,
      relatedService: newTicketService || undefined,
      message: newTicketBody,
      attachments: newTicketAttachments,
    });
    if (created) {
      setNewTicketError('');
      setNewTicketAttachments([]);
      setTicketReplyText('');
      setReplyAttachments([]);
      setReplyAttachmentError('');
      setAiTriageResult(null);
      setAiTriageError('');
      setDetailAiTriage(null);
      setDetailAiError('');
      navigateWithinDashboard('tickets', 'detail', created.id);
      showToast(
        `Ticket ${created.id} created (${created.department}) — confirmation email dispatched.`
      );
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || newTicketSubject.trim().length < 4) {
      setNewTicketError('Please enter a descriptive ticket subject (minimum 4 characters).');
      return;
    }
    if (!newTicketBody.trim() || newTicketBody.trim().length < 10) {
      setNewTicketError('Please describe your issue or request in detail (minimum 10 characters).');
      return;
    }

    setNewTicketError('');
    setAiTriageError('');
    setAiSelfResolvedNotice('');
    setAiTriageLoading(true);
    try {
      const res = await fetch('/api/ai/ticket-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: newTicketDept,
          priority: newTicketPriority,
          relatedService: newTicketService || undefined,
          subject: newTicketSubject.trim(),
          description: newTicketBody.trim(),
          attachments: newTicketAttachments,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        triage?: TicketAiTriageResult;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.triage) {
        setAiTriageError(
          data.error ||
            'AI diagnostics could not analyze right now — click "I Need Additional Support" below to submit your ticket directly.'
        );
        return;
      }
      setAiTriageResult(data.triage);
    } catch (err) {
      setAiTriageError(
        err instanceof Error
          ? `${err.message} — click "I Need Additional Support" below to create your support ticket directly.`
          : 'Network error contacting AI diagnostics.'
      );
    } finally {
      setAiTriageLoading(false);
    }
  };

  const handleAiTriageIssueResolved = () => {
    const resolvedTitle = newTicketSubject.trim() || 'your issue';
    setAiTriageResult(null);
    setAiTriageError('');
    setNewTicketSubject('');
    setNewTicketBody('');
    setNewTicketAttachments([]);
    setAiSelfResolvedNotice(
      `Glad we solved "${resolvedTitle}" right away! No support ticket was needed — reopen this page anytime if you need help.`
    );
    showToast('Marked as Issue Resolved via AI Troubleshooting');
  };

  const handleRunDetailAiTriage = async () => {
    if (!viewedTicket || detailAiLoading) return;
    setDetailAiLoading(true);
    setDetailAiError('');
    try {
      const combinedTranscript = viewedTicket.messages
        .map((m) => `${m.authorName} (${m.authorRole}): ${m.body}`)
        .join('\n\n');
      const latestAtts = viewedTicket.messages
        .flatMap((m) => m.attachments || [])
        .slice(-5);

      const res = await fetch('/api/ai/ticket-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: viewedTicket.department,
          priority: viewedTicket.priority,
          relatedService: viewedTicket.relatedService,
          subject: viewedTicket.subject,
          description: combinedTranscript,
          attachments: latestAtts,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        triage?: TicketAiTriageResult;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.triage) {
        setDetailAiError(data.error || 'Could not generate AI troubleshooting steps.');
        return;
      }
      setDetailAiTriage(data.triage);
    } catch (err) {
      setDetailAiError(
        err instanceof Error ? err.message : 'Unable to reach AI troubleshooter.'
      );
    } finally {
      setDetailAiLoading(false);
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewedTicket) return;
    if (!ticketReplyText.trim() && replyAttachments.length === 0) return;
    replySupportTicket(viewedTicket.id, ticketReplyText, replyAttachments);
    setTicketReplyText('');
    setReplyAttachments([]);
    setReplyAttachmentError('');
    showToast(`Reply sent on ${viewedTicket.id} — status updated to Open`);
  };

  const handleExportLoginLogsCsv = () => {
    if (!currentUser || myLoginLogs.length === 0) return;
    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const header = [
      'Log ID',
      'Timestamp (UTC)',
      'Event',
      'Status',
      'Auth Method',
      'Device / Browser',
      'IP Address',
      'Location',
    ].join(',');
    const rows = myLoginLogs.map((log) =>
      [
        escapeCsv(log.id),
        escapeCsv(log.timestampUtc),
        escapeCsv(log.eventType),
        escapeCsv(formatLoginLogStatusLabel(log.status)),
        escapeCsv(log.authMethod),
        escapeCsv(log.deviceSummary),
        escapeCsv(log.ipAddress),
        escapeCsv(log.locationLabel),
      ].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cpcloudhost-login-activity-${currentUser.username}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Login activity CSV exported');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateClientProfile({
      name: profileName,
      company: profileCompany,
      phone: profilePhone,
      country: profileCountry,
    });
    if (!res.ok) {
      setProfileError(res.error ?? 'Unable to save profile.');
      return;
    }
    setProfileError('');
    showToast('Account and billing profile saved');
  };

  const handleStartTwoFactorSetup = () => {
    const freshSecret = generateBase32Secret(32);
    setSetupSecret(freshSecret);
    setVerifyCodeInput('');
    setTwoFactorError('');
    setSetup2faActive(true);
  };

  const handleConfirmTwoFactorSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupSecret || twoFactorBusy) return;
    setTwoFactorBusy(true);
    const result = await enableTwoFactorAuth(setupSecret, verifyCodeInput);
    setTwoFactorBusy(false);
    if (!result.ok) {
      setTwoFactorError(
        result.error ?? 'Invalid 6-digit verification code. Try again.'
      );
      return;
    }
    setSetup2faActive(false);
    setSetupSecret('');
    setVerifyCodeInput('');
    setTwoFactorError('');
    setRevealedBackupCodes(true);
    showToast('Two-Factor Authentication (TOTP) activated for your account.');
  };

  const handleDisableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorBusy) return;
    setTwoFactorBusy(true);
    const res = await disableTwoFactorAuth(disable2faConfirmInput);
    setTwoFactorBusy(false);
    if (!res.ok) {
      setTwoFactorError(res.error ?? 'Verification failed.');
      return;
    }
    setDisable2faPromptOpen(false);
    setDisable2faConfirmInput('');
    setTwoFactorError('');
    showToast('Two-Factor Authentication disabled.');
  };

  const handleDownloadBackupCodes = (codes: string[]) => {
    if (!currentUser || !codes.length) return;
    const content = [
      'cpcloudhost.com — Two-Factor Authentication Recovery Codes',
      `Account: ${currentUser.email} (${currentUser.id})`,
      `Generated: ${new Date().toISOString()}`,
      '',
      'Store these single-use recovery codes securely. Each code works once:',
      ...codes.map((c, idx) => `${idx + 1}. ${c}`),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cpcloudhost-2fa-recovery-${currentUser.username}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const is2faEnabled = Boolean(activeAccountRecord?.twoFactorEnabled);
  const backupCodes = activeAccountRecord?.twoFactorBackupCodes ?? [];

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans antialiased">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Fixed Enterprise Sidebar (Upmind-style 264px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Wordmark Header */}
        <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
            className="inline-flex items-center gap-2.5 text-[#0F172A] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6B63] rounded"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect width="30" height="30" rx="7" fill="#0E6B63" />
              <path
                d="M9.2 18.2H20.8C22.1807 18.2 23.3 17.0807 23.3 15.7C23.3 14.4327 22.357 13.3855 21.1329 13.2215C20.7423 10.9367 18.7526 9.2 16.35 9.2C13.6714 9.2 11.5 11.3714 11.5 14.05C11.5 14.191 11.506 14.3307 11.5178 14.4688C9.69915 14.6225 8.3 16.1465 8.3 18C8.3 18.0674 8.30185 18.1343 8.3055 18.2H9.2Z"
                fill="white"
              />
              <rect x="8.8" y="20.4" width="12.4" height="1.8" rx="0.9" fill="#10B981" />
            </svg>
            <span className="font-display text-[17px] font-bold tracking-tight">
              cpcloudhost.com
            </span>
          </a>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Workspace Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <nav aria-label="Client portal navigation" className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              const badgeCount =
                item.id === 'services'
                  ? myHostingServices.length
                  : item.id === 'domains'
                  ? myDomains.length
                  : item.id === 'billing'
                  ? unpaidOrders.length
                  : item.id === 'tickets'
                  ? openOrPendingTicketsCount
                  : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateWithinDashboard(item.id, 'list', null)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#F2FAF8] text-[#0E6B63] font-semibold'
                      : 'text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#0E6B63]' : 'text-slate-400'
                      }`}
                      aria-hidden={true}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badgeCount > 0 && (
                    <span
                      className={`font-mono-num text-xs font-semibold ${
                        item.id === 'billing' && unpaidOrders.length > 0
                          ? 'text-[#D97706]'
                          : isActive
                          ? 'text-[#0E6B63]'
                          : 'text-slate-400'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Compact Sidebar Support PIN Card (Permanent · Never Expires) */}
          {activeSupportPin && (
            <div className="mx-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
                  <Headphones className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                  <span>Support PIN</span>
                </span>
                <span className="text-[11px] font-semibold text-[#0E6B63]">
                  Permanent
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
                <span className="font-mono-num text-sm font-bold tracking-[0.18em] text-[#0F172A]">
                  {revealSupportPin ? activeSupportPin.pin : '••••••'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={revealSupportPin ? 'Hide Support PIN' : 'Show Support PIN'}
                    onClick={() => setRevealSupportPin((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                  >
                    {revealSupportPin ? (
                      <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Copy Support PIN"
                    onClick={() =>
                      handleCopy('sidebar-pin', activeSupportPin.pin, 'Support PIN')
                    }
                    className="p-1 text-slate-400 hover:text-[#0E6B63] cursor-pointer"
                  >
                    {copiedKey === 'sidebar-pin' ? (
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Regenerate Support PIN"
                    onClick={() => {
                      rotateSupportPin();
                      setRevealSupportPin(true);
                      showToast('New permanent Support PIN generated');
                    }}
                    className="p-1 text-slate-400 hover:text-[#0E6B63] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Portal Resources & Role Navigation */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-1">
            <p className="px-3.5 pb-1 text-xs font-medium text-slate-400">
              Platform Shortcuts
            </p>

            <a
              href="/knowledge-base"
              onClick={(e) => {
                e.preventDefault();
                setSidebarOpen(false);
                onOpenKnowledgeBase();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[13.5px] font-medium text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>Knowledge Base</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            </a>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setSidebarOpen(false);
                onNavigateHome();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[13.5px] font-medium text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>Public Storefront</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Bottom Client Identity & Sign Out */}
        <div className="p-3.5 border-t border-[#E2E8F0] space-y-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigateWithinDashboard('account')}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0E6B63] text-white font-display text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0F172A] truncate">
                {currentUser.name}
              </p>
              <p className="font-mono text-[11px] text-slate-500 truncate">
                {currentUser.username} · <span className="capitalize">{currentUser.role}</span>
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              onSignedOut();
            }}
            className="w-full min-h-[38px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-red-300 hover:text-[#DC2626] text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {adminImpersonation && (
          <div className="bg-[#0F172A] text-white px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
            <span className="font-medium text-slate-200">
              Admin Portal Session: Signed in to Client Dashboard as{' '}
              <strong className="font-semibold text-white">
                {currentUser.name}
              </strong>{' '}
              ({currentUser.email})
            </span>
            <button
              type="button"
              onClick={() => {
                const returnedClientId = exitClientImpersonation();
                if (returnedClientId && onReturnToAdminClient) {
                  onReturnToAdminClient(returnedClientId);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0E6B63] hover:bg-[#0A534D] text-white font-semibold whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Return to Admin Profile</span>
            </button>
          </div>
        )}

        {/* Contextual Workspace Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <button
                type="button"
                onClick={() => navigateWithinDashboard('overview')}
                className="text-slate-500 hover:text-[#0E6B63] hidden sm:inline whitespace-nowrap cursor-pointer"
              >
                Client Portal
              </button>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              {section === 'tickets' && ticketSubView !== 'list' && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                    className="text-slate-500 hover:text-[#0E6B63] whitespace-nowrap cursor-pointer"
                  >
                    Support Tickets
                  </button>
                  <span className="text-slate-300" aria-hidden="true">
                    /
                  </span>
                </>
              )}
              <h1 className="font-display font-bold text-[#0F172A] tracking-tight truncate">
                {sectionTitle}
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Currency Selector */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={currencyMenuOpen}
                onClick={() => setCurrencyMenuOpen((prev) => !prev)}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63]/50 text-xs font-semibold text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                <span className="font-mono">{currency.code}</span>
              </button>

              {currencyMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_18px_40px_-12px_rgba(15,23,42,0.16)] p-1.5 z-50">
                  <div className="max-h-64 overflow-y-auto space-y-0.5">
                    {currencyChoices.map((choice) => {
                      const meta = CURRENCY_CATALOG[choice.currencyCode];
                      const active = currency.code === choice.currencyCode;
                      return (
                        <button
                          key={`${choice.countryCode}-${choice.currencyCode}`}
                          type="button"
                          onClick={() => {
                            setManualCountry(choice.countryCode);
                            setCurrencyMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer ${
                            active
                              ? 'bg-[#F2FAF8] text-[#0E6B63] font-semibold'
                              : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span className="truncate">
                            <span className="font-mono font-bold mr-2">
                              {choice.currencyCode}
                            </span>
                            {meta?.name ?? choice.countryName}
                          </span>
                          {active && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                  {detectionSource === 'manual' && (
                    <button
                      type="button"
                      disabled={isDetecting}
                      onClick={() => {
                        resetToAutoIp();
                        setCurrencyMenuOpen(false);
                      }}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0E6B63] border-t border-slate-100 hover:bg-[#F2FAF8] rounded-lg cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>Auto-Detect IP Currency</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Primary Order Action */}
            <button
              type="button"
              onClick={() => {
                if (onOrderSharedHosting) {
                  onOrderSharedHosting();
                } else {
                  handleOpenQuickOrder();
                }
              }}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(14,107,99,0.2)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Order Hosting</span>
            </button>
          </div>
        </header>

        {/* Live Action Notification Toast */}
        {toastMessage && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div
              role="status"
              className="max-w-[1280px] mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/25 text-xs sm:text-sm font-medium text-[#0E6B63]"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{toastMessage}</span>
              </span>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setToastMessage('')}
                className="text-[#0E6B63] hover:text-[#0A534D] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Main Scrollable Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="max-w-[1280px] mx-auto space-y-6">
            {/* ============================ OVERVIEW ============================ */}
            {section === 'overview' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2
                      className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-[#0F172A]"
                      style={{ textWrap: 'balance' }}
                    >
                      Welcome back, {currentUser.name}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      Account <span className="font-mono text-[#0F172A]">{currentUser.id}</span> ·{' '}
                      <span className="font-mono text-[#0F172A]">{currentUser.email}</span> · Region:{' '}
                      {currentUser.country}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateTicketPage()}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                      <span>New Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoToOrderCategory('domain-registration')}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                      <span>Register Domain</span>
                    </button>
                  </div>
                </div>

                {/* Unpaid Invoice Callout */}
                {unpaidOrders.length > 0 && (
                  <div className="bg-white border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-display text-sm font-bold text-[#0F172A]">
                          {unpaidOrders.length} Unpaid{' '}
                          {unpaidOrders.length === 1 ? 'Invoice' : 'Invoices'} Due
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Total balance of{' '}
                          <span className="font-mono-num font-bold text-[#0F172A]">
                            {formatPrice(unpaidTotalUsd)}
                          </span>{' '}
                          awaiting settlement to activate or renew queued services.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenInvoicePage(unpaidOrders[0].id)}
                      className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Pay Invoice Now
                    </button>
                  </div>
                )}

                {/* 4-Column KPI Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('services')}
                    className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Active Services
                      </span>
                      <Server className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    </div>
                    <p className="mt-2 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {activeServicesCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {myHostingServices.length} total cloud &amp; server plans
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('domains')}
                    className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Managed Domains
                      </span>
                      <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    </div>
                    <p className="mt-2 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {myDomains.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Anycast DNS &amp; Registrar Lock
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('billing')}
                    className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Balance Due
                      </span>
                      <Receipt
                        className={`w-4 h-4 ${
                          unpaidOrders.length > 0 ? 'text-[#D97706]' : 'text-[#16A34A]'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-2 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {formatPrice(unpaidTotalUsd)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {unpaidOrders.length > 0
                        ? `${unpaidOrders.length} open invoice`
                        : 'All invoices paid in full'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                    className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Open &amp; Pending Tickets
                      </span>
                      <LifeBuoy className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    </div>
                    <p className="mt-2 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {openOrPendingTicketsCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {myTickets.length} total support requests
                    </p>
                  </button>
                </div>

                {/* Primary 2-Column Portal Workspace Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Your Cloud Services & Domain Portfolio */}
                  <div className="lg:col-span-7 space-y-6">
                    <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold text-[#0F172A]">
                          Your Hosting &amp; Cloud Services
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigateWithinDashboard('services')}
                          className="text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] whitespace-nowrap cursor-pointer"
                        >
                          View all
                        </button>
                      </div>

                      {myHostingServices.length === 0 ? (
                        <div className="p-8 text-center">
                          <Server className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[#0F172A]">
                            No active hosting or compute services yet
                          </p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            Launch shared cloud hosting, managed WordPress, cPanel, or an unmanaged KVM VPS node in under 60 seconds.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (onOrderSharedHosting) onOrderSharedHosting();
                              else handleOpenQuickOrder();
                            }}
                            className="mt-4 min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                            <span>Deploy First Service</span>
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E2E8F0]">
                          {myHostingServices.slice(0, 5).map((svc) => (
                            <div
                              key={svc.id}
                              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <p className="font-display text-sm font-bold text-[#0F172A] truncate">
                                    {svc.planName}
                                  </p>
                                  <StatusIndicator
                                    tone={formatOrderTone(svc.status)}
                                    label={svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}
                                  />
                                  {svc.cancellationStatus && svc.cancellationStatus !== 'none' && (
                                    <span className="text-[11px] font-semibold text-[#D97706]">
                                      {getCancellationStatusDisplay(svc.cancellationStatus).label}
                                    </span>
                                  )}
                                  {svc.refundStatus && svc.refundStatus !== 'none' && (
                                    <span className="text-[11px] font-semibold text-[#0E6B63]">
                                      {getRefundStatusDisplay(svc.refundStatus).label}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-slate-500 truncate">
                                  <span className="font-mono text-[#0F172A]">
                                    {svc.domainOrHost}
                                  </span>{' '}
                                  · {svc.datacenter} · {svc.billingCycle}
                                </p>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                <span className="font-mono-num text-sm font-semibold text-[#0F172A]">
                                  {formatPrice(svc.amountUsd)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setManagedServiceId(svc.id)}
                                  className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] hover:text-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                                >
                                  Manage
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                        <h3 className="font-display text-base font-bold text-[#0F172A]">
                          Your Domain Portfolio
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigateWithinDashboard('domains')}
                          className="text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] whitespace-nowrap cursor-pointer"
                        >
                          Manage all domains
                        </button>
                      </div>

                      {myDomains.length === 0 ? (
                        <div className="p-8 text-center">
                          <Globe className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[#0F172A]">
                            No domains registered or transferred yet
                          </p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            Search and register your domain name with Anycast DNS and WHOIS privacy included.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleGoToOrderCategory('domain-registration')}
                            className="mt-4 min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                          >
                            <Globe className="w-4 h-4" aria-hidden="true" />
                            <span>Register Domain</span>
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E2E8F0]">
                          {myDomains.slice(0, 4).map((dom) => {
                            const lc = evaluateDomainLifecycle(dom);
                            const linkedInv = myInvoices.find((inv) => inv.orderId === dom.id);
                            const displayStatus = lc.isExpired ? 'expired' : dom.status;
                            const isManageDisabled = lc.isExpired || lc.isManageLocked;
                            const verifyPath = `/verify-domain?orderId=${encodeURIComponent(dom.id)}&token=${encodeURIComponent(dom.domainVerificationToken || '')}`;

                            return (
                              <div
                                key={dom.id}
                                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <p className="font-mono text-sm font-bold text-[#0F172A] truncate">
                                      {dom.domainOrHost}
                                    </p>
                                    <StatusIndicator
                                      tone={
                                        lc.isPendingContactVerification
                                          ? 'amber'
                                          : formatOrderTone(displayStatus)
                                      }
                                      label={
                                        lc.isTransferOrder && dom.status === 'pending'
                                          ? lc.transferStatus === 'client_notified'
                                            ? `Notified (Day ${lc.transferDaysElapsed}/7)`
                                            : lc.transferStatus === 'in_progress'
                                              ? `Transferring (${lc.transferDaysRemaining}d left)`
                                              : 'Transfer Pending Review'
                                          : lc.isPendingAdminApproval
                                            ? 'Pending Review'
                                            : lc.isPendingContactVerification
                                              ? 'Verify WHOIS'
                                              : displayStatus.charAt(0).toUpperCase() +
                                                displayStatus.slice(1)
                                      }
                                    />
                                    <span className="text-[11px] font-medium text-slate-500">
                                      {lc.isTransferOrder && dom.status === 'pending'
                                        ? `7-Day Window (Day ${lc.transferDaysElapsed}/7)`
                                        : lc.icann60DayLockActive
                                          ? `60d ICANN Lock (${lc.daysUntilIcannUnlock}d left)`
                                          : lc.effectiveRegistrarLocked
                                            ? 'Transfer Locked'
                                            : 'Unlocked'}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500 font-mono-num truncate">
                                    Registered: {lc.registeredDateIso} · Due: {lc.dueDateIso}
                                  </p>
                                  {dom.nameserverUpdateStatus === 'pending_update' && dom.pendingNameservers && (
                                    <p className="mt-1 text-[11px] font-mono text-[#D97706] truncate">
                                      NS queued (1–3h): {dom.pendingNameservers.join(', ')}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
                                  {lc.isTransferOrder &&
                                    dom.status === 'pending' &&
                                    lc.transferStatus === 'in_progress' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const r = clientNotifyDomainTransferApproved(dom.id);
                                          if (r.ok) {
                                            showToast(`Admin notified of registrar approval for ${dom.domainOrHost}`);
                                          }
                                        }}
                                        className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Approve at Registrar · Notify Admin</span>
                                      </button>
                                    )}
                                  {lc.isExpired && linkedInv && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInvoicePage(linkedInv.id)}
                                      className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                                    >
                                      <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                      <span>Renew Now</span>
                                    </button>
                                  )}
                                  {lc.isPendingContactVerification && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (typeof window !== 'undefined') {
                                            window.history.pushState({}, '', verifyPath);
                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                          }
                                        }}
                                        className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Verify WHOIS</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const r = await resendDomainVerificationEmail(dom.id);
                                          if (!r.ok) {
                                            showToast(r.error || 'Could not resend verification email');
                                            return;
                                          }
                                          showToast(
                                            r.emailSent
                                              ? `Verification email resent to ${dom.clientEmail}`
                                              : 'Verification link refreshed — configure SMTP to email inbox'
                                          );
                                        }}
                                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-[#0F172A] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        <MailCheck className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                        <span>Resend Verify Email</span>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isManageDisabled}
                                    onClick={() => handleOpenDomainManagePage(dom.id)}
                                    className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                                      isManageDisabled
                                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'border-[#E2E8F0] bg-white hover:border-[#0E6B63] hover:text-[#0E6B63] text-[#0F172A] cursor-pointer'
                                    }`}
                                  >
                                    {isManageDisabled ? (
                                      <>
                                        <Lock className="w-3 h-3" aria-hidden="true" />
                                        <span>
                                          {lc.isTransferOrder && dom.status === 'pending'
                                            ? lc.transferStatus === 'client_notified'
                                              ? 'Awaiting Admin Accept'
                                              : `Locked (${lc.transferDaysRemaining}d)`
                                            : lc.isPendingAdminApproval
                                              ? 'Pending Review'
                                              : 'Manage Locked'}
                                        </span>
                                      </>
                                    ) : (
                                      <span>Manage</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Right: Support & Account Readiness */}
                  <div className="lg:col-span-5 space-y-6">
                    <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                        <h3 className="font-display text-base font-bold text-[#0F172A]">
                          Recent Support Tickets
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                          className="text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] cursor-pointer"
                        >
                          View all
                        </button>
                      </div>

                      {myTickets.length === 0 ? (
                        <div className="p-6 text-center">
                          <LifeBuoy className="w-7 h-7 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[#0F172A]">
                            No support requests yet
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Our 24/7 engineering team responds within 15 minutes.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenCreateTicketPage()}
                            className="mt-3 min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0E6B63] cursor-pointer"
                          >
                            Create Support Ticket
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E2E8F0]">
                          {myTickets.slice(0, 3).map((tkt) => (
                            <div
                              key={tkt.id}
                              className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-[#0E6B63]">
                                    {tkt.id}
                                  </span>
                                  <StatusIndicator
                                    tone={formatTicketStatusTone(tkt.status)}
                                    label={formatTicketStatusLabel(tkt.status)}
                                  />
                                </div>
                                <p className="mt-1 text-sm font-semibold text-[#0F172A] truncate">
                                  {tkt.subject}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {tkt.department}
                                  {tkt.relatedService ? ` · ${tkt.relatedService}` : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  navigateWithinDashboard('tickets', 'detail', tkt.id)
                                }
                                className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] hover:text-[#0E6B63] text-xs font-semibold text-[#0F172A] shrink-0 cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-bold text-[#0F172A]">
                          Security &amp; Verification Posture
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigateWithinDashboard('account')}
                          className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                      <div className="mt-3 divide-y divide-[#E2E8F0] text-xs">
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-slate-600">Two-Factor Auth (TOTP)</span>
                          <StatusIndicator
                            tone={is2faEnabled ? 'emerald' : 'amber'}
                            label={is2faEnabled ? 'Enabled' : 'Not Configured'}
                          />
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-slate-600">Support Verification PIN</span>
                          <span className="font-mono-num font-bold text-[#0F172A]">
                            {activeSupportPin ? `${activeSupportPin.pin} · Permanent` : 'Ready'}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-slate-600">Login Activity Audit</span>
                          <button
                            type="button"
                            onClick={() => navigateWithinDashboard('account')}
                            className="font-mono-num font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                          >
                            {myLoginLogs.length} events recorded
                          </button>
                        </div>
                        <div className="py-2.5 flex items-center justify-between">
                          <span className="text-slate-600">Last Sign In</span>
                          <span className="font-mono text-slate-700">
                            {currentUser.signedInAt}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}

            {/* ============================ SERVICES ============================ */}
            {section === 'services' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Search plan, hostname, datacenter, or ID..."
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                      {(['all', 'active', 'pending', 'suspended', 'cancelled', 'refunded'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setServiceStatusFilter(tab)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize whitespace-nowrap transition-colors cursor-pointer ${
                            serviceStatusFilter === tab
                              ? 'bg-white text-[#0F172A] shadow-sm'
                              : 'text-slate-600 hover:text-[#0F172A]'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {onOrderSharedHosting && (
                      <button
                        type="button"
                        onClick={onOrderSharedHosting}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Order Hosting</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  {filteredServices.length === 0 ? (
                    <div className="p-10 text-center">
                      <Server className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-sm font-semibold text-[#0F172A]">
                        No matching hosting or VPS services
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Adjust your search filter or deploy a new cloud plan.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOrderSharedHosting) onOrderSharedHosting();
                          else handleOpenQuickOrder();
                        }}
                        className="mt-4 min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Order Hosting</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-500">
                            <th className="py-3 px-4">Service &amp; Plan</th>
                            <th className="py-3 px-4">Hostname / IP</th>
                            <th className="py-3 px-4">Datacenter</th>
                            <th className="py-3 px-4">Renewal</th>
                            <th className="py-3 px-4 text-right">Price</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-sm">
                          {filteredServices.map((svc) => (
                            <tr
                              key={svc.id}
                              className="hover:bg-[#F8FAFC] transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <p className="font-display font-semibold text-[#0F172A]">
                                  {svc.planName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {svc.productType} · <span className="font-mono">{svc.id}</span>
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-mono text-xs font-medium text-[#0F172A]">
                                  {svc.domainOrHost}
                                </p>
                                {svc.serverIp && (
                                  <p className="font-mono text-[11px] text-slate-500">
                                    {svc.serverIp}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-600">
                                {svc.datacenter}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-mono-num text-xs text-[#0F172A]">
                                  {svc.nextDueDate ?? 'Auto-scheduled'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Auto-renew: {svc.autoRenew !== false ? 'On' : 'Off'}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-[#0F172A]">
                                {formatPrice(svc.amountUsd)}
                                <span className="block text-[11px] font-normal text-slate-500">
                                  {svc.billingCycle}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 space-y-1">
                                <StatusIndicator
                                  tone={
                                    isServiceLockedByBilling(svc)
                                      ? 'red'
                                      : formatOrderTone(svc.status)
                                  }
                                  label={
                                    isServiceLockedByBilling(svc)
                                      ? 'Locked · Due Unpaid'
                                      : svc.status.charAt(0).toUpperCase() + svc.status.slice(1)
                                  }
                                />
                                {svc.cancellationStatus && svc.cancellationStatus !== 'none' && (
                                  <p className="text-[11px] font-semibold text-[#D97706]">
                                    {getCancellationStatusDisplay(svc.cancellationStatus).label}
                                  </p>
                                )}
                                {svc.refundStatus && svc.refundStatus !== 'none' && (
                                  <p className="text-[11px] font-semibold text-[#0E6B63]">
                                    {getRefundStatusDisplay(svc.refundStatus).label}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                                {(() => {
                                  const linkedInv = myInvoices.find(
                                    (inv) => inv.orderId === svc.id
                                  );
                                  const locked = isServiceLockedByBilling(svc);
                                  return (
                                    <>
                                      {locked && linkedInv && linkedInv.status !== 'paid' && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInvoicePage(linkedInv.id)}
                                          className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                                        >
                                          <Lock className="w-3 h-3" aria-hidden="true" />
                                          <span>Pay to Unlock</span>
                                        </button>
                                      )}
                                      {linkedInv && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenInvoicePage(linkedInv.id)}
                                            className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                                          >
                                            <span>View Invoice</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              downloadInvoicePdf(
                                                linkedInv,
                                                invoiceTemplateConfig,
                                                paymentMethods,
                                                {
                                                  code: currency.code,
                                                  symbol: currency.symbol,
                                                  rate,
                                                  decimals: currency.decimals,
                                                  spaceAfterSymbol: currency.spaceAfterSymbol,
                                                  formattedTotal: formatPrice(linkedInv.amountUsd),
                                                }
                                              );
                                              showToast(`Downloaded ${linkedInv.id}.pdf`);
                                            }}
                                            title={`Download ${linkedInv.id}.pdf`}
                                            className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                                          >
                                            <Download className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                            <span>PDF</span>
                                          </button>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                                <button
                                  type="button"
                                  onClick={() => setManagedServiceId(svc.id)}
                                  className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] hover:text-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                                >
                                  {isServiceLockedByBilling(svc) ? 'View Lock' : 'Manage'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================ DOMAINS (DEDICATED HOSTINGER-STYLE DETAIL + PROFESSIONAL PORTFOLIO) ============================ */}
            {section === 'domains' && domainSubView === 'detail' && viewedDomain && (
              <DomainManagementPage
                domain={viewedDomain}
                linkedInvoice={viewedDomainLinkedInvoice}
                onBackToDomains={() => navigateWithinDashboard('domains', 'list', null, null, null)}
                onOpenInvoice={(invId) => handleOpenInvoicePage(invId)}
                onOpenSupportTicket={(host) => handleOpenCreateTicketPage(host)}
                onShowToast={showToast}
              />
            )}

            {section === 'domains' && domainSubView === 'detail' && !viewedDomain && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
                <Globe className="w-9 h-9 text-slate-300 mx-auto" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                  Domain Not Found
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The requested domain ({viewedDomainId}) could not be found under your client account.
                </p>
                <button
                  type="button"
                  onClick={() => navigateWithinDashboard('domains', 'list', null, null, null)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] text-white text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Return to Domains</span>
                </button>
              </div>
            )}

            {section === 'domains' && domainSubView === 'list' && (
              <div className="space-y-5">
                {/* Domain Portfolio Summary Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <span className="text-xs font-medium text-slate-500">Total Domains</span>
                    <p className="mt-1 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {myDomains.length}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Registered &amp; transferred
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <span className="text-xs font-medium text-slate-500">Active &amp; Healthy</span>
                    <p className="mt-1 font-mono-num text-2xl font-bold text-[#16A34A]">
                      {
                        myDomains.filter((d) => {
                          const lc = evaluateDomainLifecycle(d);
                          return !lc.isExpired && d.status === 'active';
                        }).length
                      }
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      DNS &amp; Anycast routed
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <span className="text-xs font-medium text-slate-500">
                      60-Day ICANN Lock
                    </span>
                    <p className="mt-1 font-mono-num text-2xl font-bold text-[#0E6B63]">
                      {
                        myDomains.filter((d) => evaluateDomainLifecycle(d).icann60DayLockActive)
                          .length
                      }
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Protected transfer window
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                    <span className="text-xs font-medium text-slate-500">
                      Expired / Due Renewal
                    </span>
                    <p className="mt-1 font-mono-num text-2xl font-bold text-[#DC2626]">
                      {
                        myDomains.filter((d) => evaluateDomainLifecycle(d).isExpired)
                          .length
                      }
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Manage locked until renewed
                    </p>
                  </div>
                </div>

                {/* Search + Filter + Register/Transfer Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        placeholder="Search domain name, TLD, or order ID..."
                        className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'active', label: 'Active' },
                          { id: 'pending', label: 'Pending' },
                          { id: 'expired', label: 'Expired' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setDomainStatusFilter(f.id)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                            domainStatusFilter === f.id
                              ? 'bg-[#0F172A] text-white'
                              : 'bg-white border border-[#E2E8F0] text-slate-600 hover:border-[#0E6B63]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleGoToOrderCategory('domain-transfer')}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-[#0F172A] text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                      <span>Transfer Domain</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoToOrderCategory('domain-registration')}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Register New Domain</span>
                    </button>
                  </div>
                </div>

                {/* Professional Domains Portfolio Table */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  {filteredDomains.length === 0 ? (
                    <div className="p-10 text-center">
                      <Globe className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-sm font-semibold text-[#0F172A]">
                        No matching domains found under this account
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Register a .com, .pk, .io, .co.uk, or .cloud domain with Free WHOIS privacy and Anycast DNS.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleGoToOrderCategory('domain-registration')}
                        className="mt-4 min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Globe className="w-4 h-4" aria-hidden="true" />
                        <span>Register Domain</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-500">
                            <th className="py-3 px-4">Domain Name</th>
                            <th className="py-3 px-4">Registration Date</th>
                            <th className="py-3 px-4">Due / Expiry Date</th>
                            <th className="py-3 px-4">Transfer &amp; 60d Lock</th>
                            <th className="py-3 px-4">Auto-Renew</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-sm">
                          {filteredDomains.map((dom) => {
                            const lc = evaluateDomainLifecycle(dom);
                            const linkedInv = myInvoices.find(
                              (inv) => inv.orderId === dom.id
                            );
                            const displayStatus = lc.isExpired ? 'expired' : dom.status;
                            const isManageDisabled = lc.isExpired || lc.isManageLocked;
                            const verifyPath = `/verify-domain?orderId=${encodeURIComponent(dom.id)}&token=${encodeURIComponent(dom.domainVerificationToken || '')}`;

                            return (
                              <tr
                                key={dom.id}
                                className="hover:bg-[#F8FAFC] transition-colors"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                        lc.isExpired
                                          ? 'bg-red-50 text-[#DC2626]'
                                          : 'bg-[#F2FAF8] text-[#0E6B63]'
                                      }`}
                                    >
                                      <Globe className="w-4 h-4" aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-mono text-sm font-bold text-[#0F172A] truncate">
                                        {dom.domainOrHost}
                                      </p>
                                      <p className="text-[11px] text-slate-500 truncate">
                                        {dom.planName} ·{' '}
                                        <span className="font-mono">{dom.id}</span>
                                      </p>
                                      {dom.nameserverUpdateStatus === 'pending_update' && dom.pendingNameservers && (
                                        <p className="text-[11px] font-mono text-[#D97706] truncate">
                                          NS queued (1–3h): {dom.pendingNameservers.join(', ')}
                                        </p>
                                      )}
                                      {lc.isTransferOrder && dom.status === 'pending' && (
                                        <p className="text-[11px] text-[#0E6B63] font-medium">
                                          7-Day Transfer · Day {lc.transferDaysElapsed}/7 ({lc.transferDaysRemaining}d remaining)
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <p className="font-mono-num text-xs font-semibold text-[#0F172A]">
                                    {lc.registeredDateIso}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono-num">
                                    {lc.daysSinceRegistration}d active
                                  </p>
                                </td>

                                <td className="py-3.5 px-4">
                                  <p
                                    className={`font-mono-num text-xs font-semibold ${
                                      lc.isExpired
                                        ? 'text-[#DC2626]'
                                        : lc.daysRemainingUntilDue <= 30
                                          ? 'text-[#D97706]'
                                          : 'text-[#0F172A]'
                                    }`}
                                  >
                                    {lc.dueDateIso}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono-num">
                                    {lc.isExpired
                                      ? `Expired ${Math.abs(lc.daysRemainingUntilDue)}d ago`
                                      : `${lc.daysRemainingUntilDue}d remaining`}
                                  </p>
                                </td>

                                <td className="py-3.5 px-4 text-xs">
                                  {lc.isTransferOrder && dom.status === 'pending' ? (
                                    <div>
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#D97706]">
                                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                        Day {lc.transferDaysElapsed} of 7
                                      </span>
                                      <span className="block text-[11px] text-slate-500">
                                        {lc.transferStatus === 'client_notified'
                                          ? 'Registrar approval notified'
                                          : lc.transferStatus === 'in_progress'
                                            ? `${lc.transferDaysRemaining}d until auto-unlock`
                                            : 'Awaiting transfer start'}
                                      </span>
                                    </div>
                                  ) : lc.icann60DayLockActive ? (
                                    <div>
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#D97706]">
                                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                        60d ICANN Lock
                                      </span>
                                      <span className="block text-[11px] text-slate-500 font-mono-num">
                                        Unlocks {lc.icannUnlockDateIso}
                                      </span>
                                    </div>
                                  ) : lc.effectiveRegistrarLocked ? (
                                    <div>
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A]">
                                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                        Locked (Eligible)
                                      </span>
                                      <span className="block text-[11px] text-slate-500">
                                        EPP &amp; Unlock Ready
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#D97706]">
                                        <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                                        Unlocked
                                      </span>
                                      <span className="block text-[11px] text-slate-500">
                                        Transfer Ready
                                      </span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    type="button"
                                    disabled={isManageDisabled}
                                    onClick={() => {
                                      const nextAutoRenew = !(dom.autoRenew !== false);
                                      updateClientOrderSettings(dom.id, {
                                        autoRenew: nextAutoRenew,
                                      });
                                      showToast(
                                        `Auto-renew ${
                                          nextAutoRenew ? 'enabled' : 'disabled'
                                        } for ${dom.domainOrHost}`
                                      );
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                      isManageDisabled
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : dom.autoRenew !== false
                                          ? 'bg-[#E6F4F2] text-[#0E6B63] cursor-pointer'
                                          : 'bg-slate-100 text-slate-600 cursor-pointer'
                                    }`}
                                  >
                                    {dom.autoRenew !== false ? 'Auto ON' : 'OFF'}
                                  </button>
                                </td>

                                <td className="py-3.5 px-4">
                                  <StatusIndicator
                                    tone={
                                      lc.isPendingContactVerification
                                        ? 'amber'
                                        : formatOrderTone(displayStatus)
                                    }
                                    label={
                                      lc.isTransferOrder && dom.status === 'pending'
                                        ? lc.transferStatus === 'client_notified'
                                          ? 'Admin Accepting'
                                          : lc.transferStatus === 'in_progress'
                                            ? `In Progress (${lc.transferDaysRemaining}d)`
                                            : 'Pending Review'
                                        : lc.isPendingAdminApproval
                                          ? 'Pending Review'
                                          : lc.isPendingContactVerification
                                            ? 'Verify WHOIS'
                                            : displayStatus.charAt(0).toUpperCase() +
                                              displayStatus.slice(1)
                                    }
                                  />
                                </td>

                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-2">
                                    {lc.isTransferOrder &&
                                      dom.status === 'pending' &&
                                      lc.transferStatus === 'in_progress' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const r = clientNotifyDomainTransferApproved(dom.id);
                                            if (r.ok) {
                                              showToast(
                                                `Registrar approval notified to admin for ${dom.domainOrHost}`
                                              );
                                            }
                                          }}
                                          className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                          <span>Approve at Registrar · Notify Admin</span>
                                        </button>
                                      )}

                                    {lc.isExpired && linkedInv && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenInvoicePage(linkedInv.id)}
                                        className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                                      >
                                        <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                        <span>Renew Now</span>
                                      </button>
                                    )}

                                    {lc.isPendingContactVerification && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (typeof window !== 'undefined') {
                                              window.history.pushState({}, '', verifyPath);
                                              window.dispatchEvent(new PopStateEvent('popstate'));
                                            }
                                          }}
                                          className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                        >
                                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                          <span>Verify WHOIS</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const r = await resendDomainVerificationEmail(dom.id);
                                            if (!r.ok) {
                                              showToast(r.error || 'Could not resend verification email');
                                              return;
                                            }
                                            showToast(
                                              r.emailSent
                                                ? `Verification email resent to ${dom.clientEmail}`
                                                : 'Verification link refreshed — configure SMTP to email inbox'
                                            );
                                          }}
                                          className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-[#0F172A] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                                        >
                                          <MailCheck className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                          <span>Resend Verify Email</span>
                                        </button>
                                      </>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isManageDisabled}
                                      onClick={() => handleOpenDomainManagePage(dom.id)}
                                      title={
                                        lc.isTransferOrder && dom.status === 'pending'
                                          ? 'Domain transfer completes once registrar approval is accepted or 7 days elapse'
                                          : lc.isPendingAdminApproval
                                            ? 'Our team is reviewing your domain registration order'
                                            : lc.isPendingContactVerification
                                              ? 'Verify WHOIS contact details to unlock domain management'
                                              : isManageDisabled
                                                ? 'Domain management is locked because this domain expired or requires renewal'
                                                : `Open domain console for ${dom.domainOrHost}`
                                      }
                                      className={`min-h-[34px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                                        isManageDisabled
                                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : 'border-[#E2E8F0] bg-white hover:border-[#0E6B63] hover:text-[#0E6B63] text-[#0F172A] cursor-pointer'
                                      }`}
                                    >
                                      {isManageDisabled ? (
                                        <>
                                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                          <span>
                                            {lc.isTransferOrder && dom.status === 'pending'
                                              ? lc.transferStatus === 'client_notified'
                                                ? 'Awaiting Accept'
                                                : `Locked (${lc.transferDaysRemaining}d left)`
                                              : lc.isPendingAdminApproval
                                                ? 'Pending Review'
                                                : 'Manage Locked'}
                                          </span>
                                        </>
                                      ) : (
                                        <span>Manage</span>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================ BILLING & INVOICES ============================ */}
            {section === 'billing' && billingSubView === 'detail' && viewedInvoice && (
              <InvoiceDetailPage
                invoice={viewedInvoice}
                linkedOrder={viewedInvoiceLinkedOrder}
                onBackToBilling={() => navigateWithinDashboard('billing', 'list', null, null)}
                onShowToast={showToast}
              />
            )}

            {section === 'billing' && billingSubView === 'detail' && !viewedInvoice && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
                <Receipt className="w-9 h-9 text-slate-300 mx-auto" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                  Invoice Not Found
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The requested invoice ({viewedInvoiceId}) could not be found under your client account.
                </p>
                <button
                  type="button"
                  onClick={() => navigateWithinDashboard('billing', 'list', null, null)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] text-white text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Return to Billing &amp; Invoices</span>
                </button>
              </div>
            )}

            {section === 'billing' && billingSubView === 'list' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="text-xs font-medium text-slate-500">
                      Unpaid Balance Due
                    </span>
                    <p className="mt-1.5 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {formatPrice(unpaidTotalUsd)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {unpaidOrders.length} open{' '}
                      {unpaidOrders.length === 1 ? 'invoice' : 'invoices'}
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="text-xs font-medium text-slate-500">
                      Total Lifetime Billed
                    </span>
                    <p className="mt-1.5 font-mono-num text-2xl font-bold text-[#0F172A]">
                      {formatPrice(
                        myInvoices.reduce((sum, inv) => sum + inv.amountUsd, 0)
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Across {myInvoices.length} issued invoices
                    </p>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                    <span className="text-xs font-medium text-slate-500">
                      Active Checkout Gateway
                    </span>
                    <p className="mt-1.5 font-mono text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                      <span className="truncate">{selectedPayMethod}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {enabledPaymentMethods.length} active channels · Currency {currency.code}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">
                    Invoices &amp; Transactions
                  </h2>

                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['all', 'unpaid', 'paid', 'refunded', 'cancelled'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setBillingFilter(tab)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize whitespace-nowrap cursor-pointer ${
                          billingFilter === tab
                            ? 'bg-white text-[#0F172A] shadow-sm'
                            : 'text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  {filteredInvoices.length === 0 ? (
                    <div className="p-10 text-center">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-sm font-semibold text-[#0F172A]">
                        No invoices match this filter
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards View */}
                      <div className="md:hidden divide-y divide-[#E2E8F0]">
                        {filteredInvoices.map((inv) => {
                          const linkedOrd = inv.orderId
                            ? myOrders.find((o) => o.id === inv.orderId)
                            : undefined;
                          const effectiveRefund =
                            inv.refundStatus ||
                            (inv.status === 'refunded' ? 'processed' : 'none');
                          const effectiveCancel =
                            linkedOrd?.cancellationStatus ||
                            inv.cancellationStatus ||
                            (inv.status === 'cancelled' ? 'completed' : 'none');
                          const statusMeta: {
                            label: string;
                            tone: 'emerald' | 'amber' | 'red' | 'slate';
                          } =
                            inv.status === 'paid'
                              ? { label: 'Paid', tone: 'emerald' }
                              : inv.status === 'pending'
                                ? { label: 'Pending Review', tone: 'amber' }
                                : inv.status === 'overdue'
                                  ? { label: 'Overdue', tone: 'red' }
                                  : inv.status === 'cancelled'
                                    ? { label: 'Cancelled', tone: 'slate' }
                                    : inv.status === 'refunded'
                                      ? { label: 'Refunded', tone: 'slate' }
                                      : { label: 'Unpaid', tone: 'amber' };
                          const needsAction =
                            inv.status === 'unpaid' ||
                            inv.status === 'overdue' ||
                            inv.status === 'pending';

                          return (
                            <div key={inv.id} className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-mono text-xs font-bold text-[#0F172A]">
                                    {inv.id}
                                  </p>
                                  <p className="font-display text-sm font-bold text-[#0F172A] truncate mt-0.5">
                                    {inv.planName}
                                  </p>
                                  <p className="font-mono text-[11px] text-slate-500 truncate">
                                    {inv.domainOrHost} · {inv.billingCycle}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-mono-num text-sm font-bold text-[#0F172A]">
                                    {formatPrice(inv.amountUsd)}
                                  </p>
                                  <div className="mt-1">
                                    <StatusIndicator
                                      tone={statusMeta.tone}
                                      label={statusMeta.label}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                                <span>
                                  Issued {inv.issuedDate} · Due {inv.dueDate}
                                </span>
                                <span>{inv.paymentMethod}</span>
                              </div>

                              {(effectiveRefund !== 'none' ||
                                effectiveCancel !== 'none') && (
                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                  {effectiveRefund !== 'none' && (
                                    <span
                                      className={`px-2 py-0.5 rounded border font-semibold ${
                                        getRefundStatusDisplay(effectiveRefund).toneClass
                                      }`}
                                    >
                                      {getRefundStatusDisplay(effectiveRefund).label}
                                    </span>
                                  )}
                                  {effectiveCancel !== 'none' && (
                                    <span
                                      className={`px-2 py-0.5 rounded border font-semibold ${
                                        getCancellationStatusDisplay(effectiveCancel)
                                          .toneClass
                                      }`}
                                    >
                                      {
                                        getCancellationStatusDisplay(effectiveCancel)
                                          .label
                                      }
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoicePage(inv.id)}
                                  className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                  <span>View Invoice</span>
                                </button>
                                {needsAction && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInvoicePage(inv.id)}
                                    className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    <span>
                                      {inv.status === 'pending' ? 'Submit TID' : 'Pay Now'}
                                    </span>
                                  </button>
                                )}
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
                                    showToast(`Downloaded ${inv.id}.pdf`);
                                  }}
                                  className="min-h-[40px] inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-500">
                              <th className="py-3 px-4">Invoice</th>
                              <th className="py-3 px-4">Service / Description</th>
                              <th className="py-3 px-4">Payment Method</th>
                              <th className="py-3 px-4">Start / Due</th>
                              <th className="py-3 px-4 text-right">Amount</th>
                              <th className="py-3 px-4">Status &amp; Lifecycle</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E8F0] text-sm">
                            {filteredInvoices.map((inv) => {
                              const linkedOrd = inv.orderId
                                ? myOrders.find((o) => o.id === inv.orderId)
                                : undefined;
                              const effectiveRefund =
                                inv.refundStatus ||
                                (inv.status === 'refunded' ? 'processed' : 'none');
                              const effectiveCancel =
                                linkedOrd?.cancellationStatus ||
                                inv.cancellationStatus ||
                                (inv.status === 'cancelled' ? 'completed' : 'none');
                              const statusMeta: {
                                label: string;
                                tone: 'emerald' | 'amber' | 'red' | 'slate';
                              } =
                                inv.status === 'paid'
                                  ? { label: 'Paid', tone: 'emerald' }
                                  : inv.status === 'pending'
                                    ? { label: 'Pending Review', tone: 'amber' }
                                    : inv.status === 'overdue'
                                      ? { label: 'Overdue', tone: 'red' }
                                      : inv.status === 'cancelled'
                                        ? { label: 'Cancelled', tone: 'slate' }
                                        : inv.status === 'refunded'
                                          ? { label: 'Refunded', tone: 'slate' }
                                          : { label: 'Unpaid', tone: 'amber' };
                              const needsAction =
                                inv.status === 'unpaid' ||
                                inv.status === 'overdue' ||
                                inv.status === 'pending';
                              return (
                                <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#0F172A] whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInvoicePage(inv.id)}
                                      className="text-left hover:text-[#0E6B63] hover:underline cursor-pointer"
                                    >
                                      {inv.id}
                                    </button>
                                    {inv.autoGeneratedTrigger === 'order_approved' && (
                                      <span className="block mt-0.5 font-sans text-[10px] font-semibold text-[#0E6B63]">
                                        Auto-Generated
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <p className="font-display font-semibold text-[#0F172A]">
                                      {inv.planName}
                                      {inv.items && inv.items.length > 1 && (
                                        <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                          +{inv.items.length - 1} items
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-500 font-mono">
                                      {inv.domainOrHost} · {inv.billingCycle}
                                    </p>
                                  </td>
                                  <td className="py-3.5 px-4 text-xs text-slate-600">
                                    <span className="block">{inv.paymentMethod}</span>
                                    {inv.transactionRef && (
                                      <span className="font-mono text-[11px] text-[#0E6B63]">
                                        TID: {inv.transactionRef}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                                    <div>{inv.issuedDate}</div>
                                    <div className="text-[11px] text-slate-400">
                                      Due {inv.dueDate}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-[#0F172A] whitespace-nowrap">
                                    {formatPrice(inv.amountUsd)}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                                    <StatusIndicator
                                      tone={statusMeta.tone}
                                      label={statusMeta.label}
                                    />
                                    {effectiveRefund !== 'none' && (
                                      <p className="text-[11px] font-semibold text-[#0E6B63]">
                                        {getRefundStatusDisplay(effectiveRefund).label}
                                      </p>
                                    )}
                                    {effectiveCancel !== 'none' && (
                                      <p className="text-[11px] font-semibold text-[#D97706]">
                                        {
                                          getCancellationStatusDisplay(
                                            effectiveCancel
                                          ).label
                                        }
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInvoicePage(inv.id)}
                                      className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                      <span>View Invoice</span>
                                    </button>
                                    {needsAction && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenInvoicePage(inv.id)}
                                        className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold transition-colors cursor-pointer"
                                      >
                                        <span>
                                          {inv.status === 'pending'
                                            ? 'Pay / Update TID'
                                            : 'Pay Now'}
                                        </span>
                                      </button>
                                    )}
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
                                        showToast(`Downloaded ${inv.id}.pdf`);
                                      }}
                                      className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                      <span>PDF</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ============================ SUPPORT TICKETS (DEDICATED MULTI-PAGE UX, NO POPUPS) ============================ */}
            {section === 'tickets' && ticketSubView === 'list' && (
              <div className="space-y-5">
                {/* Support Header & Live Support PIN Verification Strip */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-tight text-[#0F172A]">
                      Support Tickets &amp; Priority Engineering Desk
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Select a ticket number to view full conversation history, or create a request linked to any service.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {activeSupportPin && (
                      <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                        <Headphones className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
                        <div className="text-xs">
                          <span className="text-slate-500">Support PIN: </span>
                          <span className="font-mono-num font-bold text-[#0F172A] tracking-wider">
                            {activeSupportPin.pin}
                          </span>
                          <span className="text-[#0E6B63] font-medium ml-1.5">
                            · No Expiry
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label="Copy Support PIN"
                          onClick={() =>
                            handleCopy('tkt-pin', activeSupportPin.pin, 'Support PIN')
                          }
                          className="text-slate-400 hover:text-[#0E6B63] cursor-pointer"
                        >
                          {copiedKey === 'tkt-pin' ? (
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(new Event('cpcloudhost:open-live-chat'))
                      }
                      className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-[#0F172A] text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                      <span>Open Live Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateTicketPage()}
                      className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(14,107,99,0.2)] whitespace-nowrap cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                      <span>Create New Ticket</span>
                    </button>
                  </div>
                </div>

                {/* Search & Real-Time Status Filters (Open, Pending, Resolved) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Search ticket number, subject, department, or domain..."
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                    {(['all', 'open', 'pending', 'resolved'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setTicketFilter(tab)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md capitalize whitespace-nowrap transition-colors cursor-pointer ${
                          ticketFilter === tab
                            ? 'bg-white text-[#0F172A] shadow-sm'
                            : 'text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tickets Directory Table with Ticket Number & Dedicated View Button */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center">
                      <LifeBuoy className="w-9 h-9 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="font-display text-base font-bold text-[#0F172A]">
                        No support tickets found
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                        Need help with a site migration, DNS config, billing, or server optimization? Open a new ticket on our dedicated request page.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateTicketPage()}
                        className="mt-4 min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                      >
                        <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                        <span>Create New Ticket</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-500">
                            <th className="py-3.5 px-4">Ticket #</th>
                            <th className="py-3.5 px-4">Subject &amp; Service</th>
                            <th className="py-3.5 px-4">Department</th>
                            <th className="py-3.5 px-4">Priority</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4">Last Updated</th>
                            <th className="py-3.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-sm">
                          {filteredTickets.map((tkt) => (
                            <tr
                              key={tkt.id}
                              className="hover:bg-[#F8FAFC] transition-colors"
                            >
                              <td className="py-4 px-4 font-mono text-xs font-bold text-[#0E6B63] whitespace-nowrap">
                                {tkt.id}
                              </td>
                              <td className="py-4 px-4 min-w-[240px]">
                                <p className="font-display font-semibold text-[#0F172A]">
                                  {tkt.subject}
                                </p>
                                {(() => {
                                  const attachmentCount = tkt.messages.reduce(
                                    (sum, m) => sum + (m.attachments?.length ?? 0),
                                    0
                                  );
                                  return (
                                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                                      {tkt.relatedService ? (
                                        <span className="font-mono text-[#0F172A]">
                                          {tkt.relatedService}
                                        </span>
                                      ) : (
                                        <span>General Account</span>
                                      )}
                                      <span>·</span>
                                      <span>
                                        {tkt.messages.length}{' '}
                                        {tkt.messages.length === 1 ? 'message' : 'messages'}
                                      </span>
                                      {attachmentCount > 0 && (
                                        <>
                                          <span>·</span>
                                          <span className="inline-flex items-center gap-1 text-[#0E6B63] font-medium">
                                            <Paperclip className="w-3 h-3" aria-hidden="true" />
                                            {attachmentCount}
                                          </span>
                                        </>
                                      )}
                                    </p>
                                  );
                                })()}
                              </td>
                              <td className="py-4 px-4 text-xs font-medium text-[#0F172A] whitespace-nowrap">
                                {tkt.department}
                              </td>
                              <td className="py-4 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                                {tkt.priority}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <StatusIndicator
                                  tone={formatTicketStatusTone(tkt.status)}
                                  label={formatTicketStatusLabel(tkt.status)}
                                />
                              </td>
                              <td className="py-4 px-4 font-mono-num text-xs text-slate-500 whitespace-nowrap">
                                {tkt.updatedAtUtc}
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateWithinDashboard('tickets', 'detail', tkt.id)
                                  }
                                  className="min-h-[34px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] hover:text-[#0E6B63] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                                >
                                  <span>View</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================ DEDICATED CREATE TICKET PAGE (/dashboard/tickets/new — NO POPUP) ============================ */}
            {section === 'tickets' && ticketSubView === 'new' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0E6B63] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Back to Support Tickets</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <form
                    onSubmit={handleCreateTicketSubmit}
                    className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 space-y-6"
                  >
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                        Submit a Support Request
                      </h2>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Choose the exact department and affected service so the right engineer picks up your ticket immediately.
                      </p>
                    </div>

                    {/* 5 Department Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-2.5">
                        Select Department <span className="text-[#DC2626]">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {TICKET_DEPARTMENTS.map((dept) => {
                          const selected = newTicketDept === dept.id;
                          return (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => setNewTicketDept(dept.id)}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#0E6B63] bg-[#F2FAF8]'
                                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                              }`}
                            >
                              <p
                                className={`font-display text-sm font-bold ${
                                  selected ? 'text-[#0E6B63]' : 'text-[#0F172A]'
                                }`}
                              >
                                {dept.id}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 leading-snug">
                                {dept.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="new-tkt-service"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Affected Service / Domain
                        </label>
                        <select
                          id="new-tkt-service"
                          value={newTicketService}
                          onChange={(e) => setNewTicketService(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#0E6B63]"
                        >
                          <option value="">General Account / No Specific Service</option>
                          {myOrders.map((ord) => (
                            <option key={ord.id} value={ord.domainOrHost}>
                              {ord.planName} — {ord.domainOrHost} ({ord.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="new-tkt-priority"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Priority Level
                        </label>
                        <select
                          id="new-tkt-priority"
                          value={newTicketPriority}
                          onChange={(e) =>
                            setNewTicketPriority(e.target.value as TicketPriority)
                          }
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#0E6B63]"
                        >
                          <option value="Normal">Normal (Standard SLA)</option>
                          <option value="High">High (Production Impact)</option>
                          <option value="Urgent">Urgent (Service Offline)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="new-tkt-subject"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Subject <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="new-tkt-subject"
                        type="text"
                        required
                        value={newTicketSubject}
                        onChange={(e) => {
                          setNewTicketSubject(e.target.value);
                          if (newTicketError) setNewTicketError('');
                        }}
                        placeholder="e.g. Migrate cPanel account from previous host with zero downtime"
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-tkt-body"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Detailed Description <span className="text-[#DC2626]">*</span>
                      </label>
                      <textarea
                        id="new-tkt-body"
                        rows={6}
                        required
                        value={newTicketBody}
                        onChange={(e) => {
                          setNewTicketBody(e.target.value);
                          if (newTicketError) setNewTicketError('');
                        }}
                        placeholder="Include error logs, domain names, IPv4 addresses, or source host credentials if requesting a migration..."
                        className="w-full px-3.5 py-3 text-sm leading-relaxed border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    {/* Attach Files or Screenshots */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="new-tkt-files"
                          className="block text-xs font-semibold text-[#0F172A]"
                        >
                          Attach Images or Files (Optional)
                        </label>
                        <span className="text-[11px] font-mono-num text-slate-400">
                          {newTicketAttachments.length}/5 files · Max 10 MB each
                        </span>
                      </div>

                      <label
                        htmlFor="new-tkt-files"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleAttachFiles(e.dataTransfer.files, 'new');
                        }}
                        className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0E6B63] bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0E6B63] shrink-0">
                            <Paperclip className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="font-semibold text-[#0F172A]">
                              Drop screenshots, error logs, or PDFs here
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Supports PNG, JPG, WebP, GIF, PDF, TXT, LOG, CSV, JSON, ZIP
                            </p>
                          </div>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] shrink-0">
                          Choose File
                        </span>
                        <input
                          id="new-tkt-files"
                          type="file"
                          multiple
                          accept="image/*,.pdf,.txt,.log,.csv,.json,.zip,.conf,.md"
                          onChange={(e) => {
                            handleAttachFiles(e.target.files, 'new');
                            e.target.value = '';
                          }}
                          className="sr-only"
                        />
                      </label>

                      {newTicketAttachments.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {newTicketAttachments.map((att) => {
                            const isImg = att.mimeType.startsWith('image/');
                            return (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] bg-white"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {isImg ? (
                                    <img
                                      src={att.dataUrl}
                                      alt={att.name}
                                      className="w-10 h-10 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                                    />
                                  ) : (
                                    <span className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0E6B63] shrink-0">
                                      <FileText className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#0F172A] truncate">
                                      {att.name}
                                    </p>
                                    <p className="font-mono-num text-[11px] text-slate-400">
                                      {formatAttachmentSize(att.sizeBytes)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Remove ${att.name}`}
                                  onClick={() =>
                                    setNewTicketAttachments((prev) =>
                                      prev.filter((item) => item.id !== att.id)
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                                >
                                  <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {aiSelfResolvedNotice && (
                      <div className="rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/5 p-4 flex items-start gap-3">
                        <CheckCircle2
                          className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="text-xs text-[#0F172A] space-y-2">
                          <p className="font-semibold">{aiSelfResolvedNotice}</p>
                          <button
                            type="button"
                            onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                            className="font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                          >
                            Return to Support Tickets
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Instant Error Diagnosis & Two-Button Resolution Panel */}
                    {(aiTriageResult || aiTriageError) && (
                      <div className="rounded-xl border border-[#0E6B63]/35 bg-[#F2FAF8] p-5 space-y-4">
                        <div className="flex items-start gap-2.5">
                          <Bot
                            className="w-5 h-5 text-[#0E6B63] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <div>
                            <h3 className="font-display text-sm font-bold text-[#0F172A]">
                              AI Troubleshooting Analysis &amp; Recommended Fix
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {aiTriageResult
                                ? aiTriageResult.summary
                                : aiTriageError}
                            </p>
                          </div>
                        </div>

                        {aiTriageResult && aiTriageResult.steps.length > 0 && (
                          <ol className="space-y-2 bg-white border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#0F172A] leading-relaxed">
                            {aiTriageResult.steps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="font-mono font-bold text-[#0E6B63] shrink-0">
                                  {idx + 1}.
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#0E6B63]/15">
                          <span className="text-xs font-medium text-slate-600">
                            Did these steps fix your problem?
                          </span>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={handleAiTriageIssueResolved}
                              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#16A34A]/40 bg-white hover:bg-[#16A34A]/10 text-[#16A34A] text-xs font-semibold whitespace-nowrap cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                              <span>Issue Resolved</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleFinalizeCreateTicket}
                              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>I Need Additional Support</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {newTicketError && (
                      <p
                        role="alert"
                        className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                      >
                        {newTicketError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                        className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={aiTriageLoading}
                        className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                      >
                        {aiTriageLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            <span>Analyzing Issue with AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                            <span>
                              {aiTriageResult
                                ? 'Re-Run AI Diagnosis'
                                : 'Get AI Troubleshooting & Create Ticket'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Right Sidebar: Support PIN & SLA Verification */}
                  <aside className="lg:col-span-4 space-y-5">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                      <h3 className="font-display text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                        <span>Verified Support PIN</span>
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Your permanent 6-digit Support PIN is attached automatically to verify account ownership and never expires unless you regenerate it.
                      </p>
                      {activeSupportPin && (
                        <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex items-center justify-between">
                          <span className="font-mono-num text-lg font-bold tracking-[0.22em] text-[#0E6B63]">
                            {activeSupportPin.pin}
                          </span>
                          <span className="text-xs font-semibold text-[#0E6B63]">
                            Active · Permanent
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2.5 text-xs text-slate-600">
                      <h3 className="font-display text-sm font-bold text-[#0F172A]">
                        Response SLA Targets
                      </h3>
                      <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
                        <span>Technical Support</span>
                        <span className="font-mono-num font-semibold text-[#0F172A]">
                          &lt; 15 mins
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
                        <span>Migration Site</span>
                        <span className="font-mono-num font-semibold text-[#0F172A]">
                          &lt; 30 mins
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span>Billing &amp; Account</span>
                        <span className="font-mono-num font-semibold text-[#0F172A]">
                          &lt; 60 mins
                        </span>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {/* ============================ DEDICATED SINGLE TICKET VIEW PAGE (/dashboard/tickets/:id — NO POPUP) ============================ */}
            {section === 'tickets' && ticketSubView === 'detail' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0E6B63] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Back to Support Tickets</span>
                  </button>

                  {viewedTicket && (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        disabled={detailAiLoading}
                        onClick={() => void handleRunDetailAiTriage()}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#0E6B63]/30 bg-[#F2FAF8] hover:bg-[#0E6B63]/10 text-[#0E6B63] text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        {detailAiLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>AI Error Fix Assistant</span>
                      </button>

                      {viewedTicket.status !== 'resolved' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              resolveSupportTicket(viewedTicket.id);
                              showToast(`Ticket ${viewedTicket.id} marked as Issue Resolved`);
                            }}
                            className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/5 hover:bg-[#16A34A]/10 text-[#16A34A] text-xs font-semibold whitespace-nowrap cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span>Issue Resolved</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('ticket-detail-reply');
                              el?.focus();
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                          >
                            <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>I Need Additional Support</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            reopenSupportTicket(viewedTicket.id);
                            showToast(`Ticket ${viewedTicket.id} reopened for additional support`);
                          }}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>I Need Additional Support (Reopen)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!viewedTicket ? (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
                    <p className="font-display text-base font-bold text-[#0F172A]">
                      Ticket not found
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateWithinDashboard('tickets', 'list', null)}
                      className="mt-3 text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                    >
                      Return to ticket directory
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Conversation Thread & Live Reply Box */}
                    <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-[#E2E8F0]">
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          <span className="font-mono font-bold text-[#0E6B63]">
                            {viewedTicket.id}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-medium text-slate-600">
                            {viewedTicket.department}
                          </span>
                          <StatusIndicator
                            tone={formatTicketStatusTone(viewedTicket.status)}
                            label={formatTicketStatusLabel(viewedTicket.status)}
                          />
                        </div>
                        <h2
                          className="mt-2 font-display text-xl font-bold tracking-tight text-[#0F172A]"
                          style={{ textWrap: 'balance' }}
                        >
                          {viewedTicket.subject}
                        </h2>
                      </div>

                      <div className="p-6 space-y-4 bg-[#F8FAFC]">
                        {viewedTicket.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl border p-5 ${
                              msg.authorRole === 'support'
                                ? 'bg-white border-[#0E6B63]/30'
                                : 'bg-white border-[#E2E8F0]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-display font-bold text-[#0F172A]">
                                {msg.authorRole === 'support' ? 'Support cpcloudhost' : msg.authorName}
                                {msg.authorRole === 'support' && (
                                  <span className="ml-2 font-sans font-semibold text-[#0E6B63]">
                                    Support Staff
                                  </span>
                                )}
                              </span>
                              <span className="font-mono-num text-[11px] text-slate-400">
                                {msg.timestampUtc}
                              </span>
                            </div>
                            <p className="mt-2.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {msg.body}
                            </p>

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] space-y-2.5">
                                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                                  <Paperclip className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                  <span>
                                    {msg.attachments.length}{' '}
                                    {msg.attachments.length === 1 ? 'Attachment' : 'Attachments'}
                                  </span>
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {msg.attachments.map((att) => {
                                    const isImg = att.mimeType.startsWith('image/');
                                    const isExpanded = expandedAttachmentId === att.id;
                                    return (
                                      <div
                                        key={att.id}
                                        className={`rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2.5 ${
                                          isExpanded ? 'sm:col-span-2' : ''
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0E6B63] shrink-0">
                                              {isImg ? (
                                                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                                              ) : (
                                                <FileText className="w-4 h-4" aria-hidden="true" />
                                              )}
                                            </span>
                                            <div className="min-w-0">
                                              <p className="text-xs font-semibold text-[#0F172A] truncate">
                                                {att.name}
                                              </p>
                                              <p className="font-mono-num text-[11px] text-slate-400">
                                                {formatAttachmentSize(att.sizeBytes)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {isImg && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedAttachmentId((prev) =>
                                                    prev === att.id ? null : att.id
                                                  )
                                                }
                                                className="px-2 py-1 rounded-md border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-[11px] font-semibold text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"
                                              >
                                                {isExpanded ? (
                                                  <>
                                                    <Minimize2 className="w-3 h-3" aria-hidden="true" />
                                                    <span>Shrink</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Maximize2 className="w-3 h-3" aria-hidden="true" />
                                                    <span>Preview</span>
                                                  </>
                                                )}
                                              </button>
                                            )}
                                            <a
                                              href={att.dataUrl}
                                              download={att.name}
                                              className="px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-[11px] font-semibold text-[#0E6B63] inline-flex items-center gap-1"
                                            >
                                              <Download className="w-3 h-3" aria-hidden="true" />
                                              <span>Save</span>
                                            </a>
                                          </div>
                                        </div>

                                        {isImg && (
                                          <img
                                            src={att.dataUrl}
                                            alt={att.name}
                                            className={`w-full rounded-lg border border-[#E2E8F0] bg-white object-contain ${
                                              isExpanded ? 'max-h-[460px]' : 'max-h-36 object-cover'
                                            }`}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {(detailAiTriage || detailAiError) && (
                          <div className="rounded-xl border border-[#0E6B63]/35 bg-[#F2FAF8] p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <Bot className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                  <p className="font-display text-xs font-bold text-[#0F172A]">
                                    AI Troubleshooting Suggestions
                                  </p>
                                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                    {detailAiTriage ? detailAiTriage.summary : detailAiError}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailAiTriage(null);
                                  setDetailAiError('');
                                }}
                                aria-label="Dismiss AI suggestions"
                                className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
                              >
                                <X className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                            {detailAiTriage && detailAiTriage.steps.length > 0 && (
                              <ol className="space-y-1.5 bg-white border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#0F172A]">
                                {detailAiTriage.steps.map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="font-mono font-bold text-[#0E6B63] shrink-0">
                                      {idx + 1}.
                                    </span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        )}

                        {viewedTicket.status === 'open' && (
                          <p className="text-xs text-slate-500 font-medium px-1">
                            Ticket is currently <strong className="text-[#0E6B63]">Open</strong> in our engineering queue — staff updates also trigger instant email notifications.
                          </p>
                        )}
                      </div>

                      {viewedTicket.status !== 'resolved' ? (
                        <form
                          onSubmit={handleReplySubmit}
                          className="p-6 border-t border-[#E2E8F0] bg-white space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor="ticket-detail-reply"
                              className="block text-xs font-semibold text-[#0F172A]"
                            >
                              Add Reply
                            </label>
                            <label
                              htmlFor="reply-ticket-files"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] cursor-pointer"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                              <span>Attach Image / File ({replyAttachments.length}/5 · 10 MB)</span>
                              <input
                                id="reply-ticket-files"
                                type="file"
                                multiple
                                accept="image/*,.pdf,.txt,.log,.csv,.json,.zip,.conf,.md"
                                onChange={(e) => {
                                  handleAttachFiles(e.target.files, 'reply');
                                  e.target.value = '';
                                }}
                                className="sr-only"
                              />
                            </label>
                          </div>

                          <textarea
                            id="ticket-detail-reply"
                            rows={4}
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            placeholder="Write your reply or attach screenshots / log files for our support team..."
                            className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                          />

                          {replyAttachmentError && (
                            <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                              {replyAttachmentError}
                            </p>
                          )}

                          {replyAttachments.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {replyAttachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {att.mimeType.startsWith('image/') ? (
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-8 h-8 rounded object-cover border border-[#E2E8F0] shrink-0"
                                      />
                                    ) : (
                                      <FileText className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                                        {att.name}
                                      </p>
                                      <p className="font-mono-num text-[10px] text-slate-400">
                                        {formatAttachmentSize(att.sizeBytes)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${att.name}`}
                                    onClick={() =>
                                      setReplyAttachments((prev) =>
                                        prev.filter((item) => item.id !== att.id)
                                      )
                                    }
                                    className="p-1 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                              Posting a reply updates ticket status to Open for priority staff response.
                            </span>
                            <button
                              type="submit"
                              disabled={!ticketReplyText.trim() && replyAttachments.length === 0}
                              className="min-h-[40px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-50 text-white text-xs font-semibold shrink-0 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Send Reply</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-5 border-t border-[#E2E8F0] bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                          <span>
                            This ticket is marked <strong>Resolved</strong>. Need further assistance on this request?
                          </span>
                          <button
                            type="button"
                            onClick={() => reopenSupportTicket(viewedTicket.id)}
                            className="font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                          >
                            Reopen Ticket
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Ticket Details Sidebar (Upmind-style metadata rail) */}
                    <aside className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                      <h3 className="font-display text-sm font-bold text-[#0F172A]">
                        Ticket Metadata
                      </h3>
                      <div className="divide-y divide-[#E2E8F0] text-xs">
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Ticket Number</span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            {viewedTicket.id}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Status</span>
                          <StatusIndicator
                            tone={formatTicketStatusTone(viewedTicket.status)}
                            label={formatTicketStatusLabel(viewedTicket.status)}
                          />
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Department</span>
                          <span className="font-semibold text-[#0F172A]">
                            {viewedTicket.department}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Priority</span>
                          <span className="font-semibold text-[#0F172A]">
                            {viewedTicket.priority}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Linked Service</span>
                          <span className="font-mono font-semibold text-[#0E6B63] truncate">
                            {viewedTicket.relatedService || 'General Account'}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Support PIN</span>
                          <span className="font-mono-num font-bold text-[#0F172A]">
                            {viewedTicket.supportPinUsed || activeSupportPin?.pin || '—'}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Attachments</span>
                          <span className="font-mono-num font-semibold text-[#0F172A]">
                            {viewedTicket.messages.reduce(
                              (sum, m) => sum + (m.attachments?.length ?? 0),
                              0
                            )}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Created</span>
                          <span className="font-mono-num text-slate-600">
                            {viewedTicket.createdAtUtc}
                          </span>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-3">
                          <span className="text-slate-500">Last Updated</span>
                          <span className="font-mono-num text-slate-600">
                            {viewedTicket.updatedAtUtc}
                          </span>
                        </div>
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            )}

            {/* ============================ ACCOUNT, SUPPORT PIN & REAL 2FA SECURITY ============================ */}
            {section === 'account' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Account Profile + Real Two-Factor Authentication Setup */}
                <div className="lg:col-span-7 space-y-6">
                  <form
                    onSubmit={handleSaveProfile}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4"
                  >
                    <div>
                      <h2 className="font-display text-lg font-bold tracking-tight text-[#0F172A]">
                        Account &amp; Billing Profile
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Details appear on VAT/tax invoices and domain WHOIS registration records.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Username
                        </label>
                        <div className="relative">
                          <UserCheck
                            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            disabled
                            value={currentUser.username}
                            className="w-full min-h-[42px] pl-9 pr-3.5 py-2 text-sm font-mono bg-[#F8FAFC] text-slate-600 border border-[#E2E8F0] rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          disabled
                          value={currentUser.email}
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono bg-[#F8FAFC] text-slate-600 border border-[#E2E8F0] rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          value={profileCompany}
                          onChange={(e) => setProfileCompany(e.target.value)}
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+44 20 7946 0000"
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono-num border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Country / Jurisdiction
                        </label>
                        <input
                          type="text"
                          value={profileCountry}
                          onChange={(e) => setProfileCountry(e.target.value)}
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                    </div>

                    {profileError && (
                      <p className="text-xs font-semibold text-[#DC2626]">{profileError}</p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </form>

                  {/* Self-Service Account Password Change Card */}
                  <form
                    onSubmit={handleChangeAccountPassword}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4"
                  >
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                        <span>Change Account Password</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Update your cpcloudhost.com client portal login password directly from your verified session.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPwd ? 'text' : 'password'}
                            value={currentPwdInput}
                            onChange={(e) => {
                              setCurrentPwdInput(e.target.value);
                              setPwdChangeError('');
                              setPwdChangeSuccess('');
                            }}
                            placeholder="Enter current password"
                            className="w-full min-h-[42px] pl-3.5 pr-9 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPwd((p) => !p)}
                            aria-label="Toggle current password visibility"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                          >
                            {showCurrentPwd ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          New Password (8+ chars)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? 'text' : 'password'}
                            value={newPwdInput}
                            onChange={(e) => {
                              setNewPwdInput(e.target.value);
                              setPwdChangeError('');
                              setPwdChangeSuccess('');
                            }}
                            placeholder="Enter new password"
                            className="w-full min-h-[42px] pl-3.5 pr-9 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd((p) => !p)}
                            aria-label="Toggle new password visibility"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                          >
                            {showNewPwd ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={confirmPwdInput}
                          onChange={(e) => {
                            setConfirmPwdInput(e.target.value);
                            setPwdChangeError('');
                            setPwdChangeSuccess('');
                          }}
                          placeholder="Confirm new password"
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>
                    </div>

                    {pwdChangeError && (
                      <p role="alert" className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                        {pwdChangeError}
                      </p>
                    )}

                    {pwdChangeSuccess && (
                      <p className="text-xs font-semibold text-[#16A34A] bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
                        {pwdChangeSuccess}
                      </p>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#0E6B63] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>

                  {/* Real RFC-6238 Two-Factor Authentication Card */}
                  <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-display text-lg font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                            <span>Two-Factor Authentication (TOTP)</span>
                          </h3>
                          <StatusIndicator
                            tone={is2faEnabled ? 'emerald' : 'amber'}
                            label={is2faEnabled ? 'Active' : 'Disabled'}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Require a time-based 6-digit code from Google Authenticator, Authy, or 1Password every time you sign in on /auth/login.
                        </p>
                      </div>

                      {!is2faEnabled && !setup2faActive && (
                        <button
                          type="button"
                          onClick={handleStartTwoFactorSetup}
                          className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" aria-hidden="true" />
                          <span>Set Up 2FA</span>
                        </button>
                      )}
                    </div>

                    {/* Step-by-Step Real QR + Secret Enrollment */}
                    {setup2faActive && (
                      <form
                        onSubmit={handleConfirmTwoFactorSetup}
                        className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-5 space-y-5"
                      >
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shrink-0 mx-auto sm:mx-0">
                            {setupQrDataUrl ? (
                              <img
                                src={setupQrDataUrl}
                                alt="Authenticator 2FA QR Code"
                                className="w-40 h-40 block"
                              />
                            ) : (
                              <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                                Generating QR...
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <p className="font-display text-sm font-bold text-[#0F172A]">
                                1. Scan QR code in your Authenticator app
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                Open Google Authenticator, Authy, or Apple Passwords and scan the QR code, or copy the Base32 secret key manually:
                              </p>
                            </div>

                            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2">
                              <span className="font-mono text-xs font-semibold text-[#0F172A] truncate flex-1">
                                {setupSecret}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy('2fa-secret', setupSecret, '2FA Setup Secret')
                                }
                                className="text-xs font-semibold text-[#0E6B63] hover:underline shrink-0 cursor-pointer"
                              >
                                Copy Key
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2">
                              <span>
                                Current TOTP Preview ({totpSecondsLeft}s):{' '}
                                <strong className="font-mono-num text-[#0E6B63]">
                                  {setupLivePreviewCode}
                                </strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setVerifyCodeInput(setupLivePreviewCode)}
                                className="font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                              >
                                Fill Current Code
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                          <label
                            htmlFor="verify-totp-input"
                            className="block text-xs font-semibold text-[#0F172A]"
                          >
                            2. Enter the 6-digit verification code to activate 2FA
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              id="verify-totp-input"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              required
                              value={verifyCodeInput}
                              onChange={(e) => {
                                setVerifyCodeInput(e.target.value.replace(/\D/g, ''));
                                if (twoFactorError) setTwoFactorError('');
                              }}
                              placeholder="6-digit code (e.g. 482910)"
                              className="flex-1 min-h-[42px] px-3.5 py-2 text-sm font-mono font-semibold tracking-widest bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                            />
                            <button
                              type="submit"
                              disabled={twoFactorBusy || verifyCodeInput.length !== 6}
                              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                            >
                              Verify &amp; Enable 2FA
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSetup2faActive(false);
                                setSetupSecret('');
                                setTwoFactorError('');
                              }}
                              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                          {twoFactorError && (
                            <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                              {twoFactorError}
                            </p>
                          )}
                        </div>
                      </form>
                    )}

                    {/* Enrolled 2FA Management: Recovery Codes + Verified Disable */}
                    {is2faEnabled && (
                      <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-slate-600">
                            <span className="font-semibold text-[#0F172A]">
                              Single-Use Recovery Codes:
                            </span>{' '}
                            <span className="font-mono-num">
                              {backupCodes.length} remaining
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRevealedBackupCodes((prev) => !prev)}
                              className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#0E6B63] cursor-pointer"
                            >
                              {revealedBackupCodes ? 'Hide Codes' : 'View Backup Codes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadBackupCodes(backupCodes)}
                              className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#0E6B63] cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Download .txt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                regenerateTwoFactorBackupCodes();
                                setRevealedBackupCodes(true);
                                showToast('8 fresh backup recovery codes generated');
                              }}
                              className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0E6B63] hover:border-[#0E6B63] cursor-pointer"
                            >
                              Regenerate
                            </button>
                          </div>
                        </div>

                        {revealedBackupCodes && backupCodes.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                            {backupCodes.map((code) => (
                              <div
                                key={code}
                                className="font-mono text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-center"
                              >
                                {code}
                              </div>
                            ))}
                          </div>
                        )}

                        {!disable2faPromptOpen ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDisable2faPromptOpen(true);
                              setTwoFactorError('');
                              setDisable2faConfirmInput('');
                            }}
                            className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                          >
                            Disable Two-Factor Authentication
                          </button>
                        ) : (
                          <form
                            onSubmit={handleDisableTwoFactor}
                            className="border border-red-200 bg-red-50/40 rounded-xl p-4 space-y-3"
                          >
                            <p className="text-xs font-semibold text-[#0F172A]">
                              Enter your 6-digit authenticator code or account password to disable 2FA:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="password"
                                required
                                value={disable2faConfirmInput}
                                onChange={(e) => {
                                  setDisable2faConfirmInput(e.target.value);
                                  if (twoFactorError) setTwoFactorError('');
                                }}
                                placeholder="6-digit code or password"
                                className="flex-1 min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                              />
                              <button
                                type="submit"
                                disabled={twoFactorBusy}
                                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                              >
                                Confirm Disable
                              </button>
                              <button
                                type="button"
                                onClick={() => setDisable2faPromptOpen(false)}
                                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                            {twoFactorError && (
                              <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                                {twoFactorError}
                              </p>
                            )}
                          </form>
                        )}
                      </div>
                    )}
                  </section>
                </div>

                {/* Right: Support PIN Card + Client API Token */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Dedicated Permanent Support PIN Panel */}
                  <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                          <span>Support Verification PIN</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Your permanent 6-digit PIN verifies ownership with cpcloudhost.com support engineers. It never expires automatically and updates only when you manually regenerate it.
                        </p>
                      </div>
                    </div>

                    {activeSupportPin && (
                      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-num text-2xl font-bold tracking-[0.22em] text-[#0F172A]">
                            {activeSupportPin.pin}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-[#0E6B63]/10 text-[11px] font-semibold text-[#0E6B63]">
                            No Time Expiry
                          </span>
                        </div>
                        <p className="font-mono-num text-[11px] text-slate-500">
                          Active since {activeSupportPin.createdAtUtc}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy('acct-pin', activeSupportPin.pin, 'Support PIN')
                            }
                            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy PIN</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              rotateSupportPin();
                              showToast('New permanent Support PIN generated');
                            }}
                            className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Regenerate PIN</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Client API Token Panel */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                        <span>Client API Token</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = generateClientApiToken();
                          setApiToken(fresh);
                          setRevealApiToken(true);
                          try {
                            window.localStorage.setItem('cpcloud_client_api_token_v1', fresh);
                          } catch {
                            // ignore
                          }
                          showToast('New Client API token generated');
                        }}
                        className="text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] cursor-pointer"
                      >
                        Rotate Token
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Use this bearer token for DNS automation, Terraform, and CI webhooks.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type={revealApiToken ? 'text' : 'password'}
                        readOnly
                        value={apiToken}
                        className="flex-1 min-h-[40px] px-3 py-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A]"
                      />
                      <button
                        type="button"
                        aria-label={revealApiToken ? 'Hide token' : 'Reveal token'}
                        onClick={() => setRevealApiToken((prev) => !prev)}
                        className="min-h-[40px] px-3 border border-[#E2E8F0] rounded-lg text-slate-600 hover:text-[#0F172A] cursor-pointer"
                      >
                        {revealApiToken ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy('api', apiToken, 'API token')}
                        className="min-h-[40px] px-3 border border-[#E2E8F0] rounded-lg text-slate-600 hover:text-[#0E6B63] cursor-pointer"
                      >
                        {copiedKey === 'api' ? (
                          <Check className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full-Width Login & Security Activity Logs */}
                <section className="lg:col-span-12 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-[#E2E8F0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                        <span>Login &amp; Security Activity Logs</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Complete audit trail of sign-ins, failed password attempts, 2FA challenges, and Support PIN changes for{' '}
                        <span className="font-mono text-[#0F172A]">{currentUser.email}</span>.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {myLoginLogs.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleExportLoginLogsCsv}
                            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              clearMyLoginLogs();
                              showToast('Login activity logs cleared');
                            }}
                            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-red-300 hover:text-[#DC2626] text-xs font-semibold text-slate-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Clear Logs</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search
                        className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        value={loginLogSearch}
                        onChange={(e) => setLoginLogSearch(e.target.value)}
                        placeholder="Search event, IP address, browser, or location..."
                        className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
                      {[
                        { id: 'all', label: 'All Events' },
                        { id: 'success', label: 'Verified' },
                        { id: 'alerts', label: 'Warnings & Blocked' },
                        { id: 'security', label: '2FA & PIN' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setLoginLogFilter(
                              tab.id as 'all' | 'success' | 'alerts' | 'security'
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                            loginLogFilter === tab.id
                              ? 'bg-white text-[#0F172A] shadow-sm'
                              : 'text-slate-600 hover:text-[#0F172A]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredLoginLogs.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-500">
                      No login or security activity matches the selected filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-500">
                            <th className="py-3 px-4">Timestamp (UTC)</th>
                            <th className="py-3 px-4">Event</th>
                            <th className="py-3 px-4">Outcome</th>
                            <th className="py-3 px-4">Auth Method</th>
                            <th className="py-3 px-4">Device / Browser</th>
                            <th className="py-3 px-4">IP Address &amp; Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-xs">
                          {filteredLoginLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                              <td className="py-3.5 px-4 font-mono-num text-slate-600 whitespace-nowrap">
                                {log.timestampUtc}
                              </td>
                              <td className="py-3.5 px-4 font-display font-semibold text-[#0F172A] whitespace-nowrap">
                                {log.eventType}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <StatusIndicator
                                  tone={formatLoginLogStatusTone(log.status)}
                                  label={formatLoginLogStatusLabel(log.status)}
                                />
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                {log.authMethod}
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5">
                                  <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                  <span>{log.deviceSummary}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="font-mono-num font-semibold text-[#0F172A]">
                                  {log.ipAddress}
                                </div>
                                <div className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                                  <span>{log.locationLabel}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ============================ SERVICE INSPECTOR MODAL ============================ */}
      {managedService && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-slate-500">{managedService.id}</p>
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  {managedService.planName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManagedServiceId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Primary Host / Domain</span>
                  <p className="font-mono font-semibold text-[#0F172A] mt-0.5">
                    {managedService.domainOrHost}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Status</span>
                  <div className="mt-0.5">
                    <StatusIndicator
                      tone={formatOrderTone(managedService.status)}
                      label={
                        managedService.status.charAt(0).toUpperCase() +
                        managedService.status.slice(1)
                      }
                    />
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Node IPv4</span>
                  <p className="font-mono font-semibold text-[#0F172A] mt-0.5">
                    {managedService.serverIp ?? '185.199.110.42'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Datacenter</span>
                  <p className="font-semibold text-[#0F172A] mt-0.5">
                    {managedService.datacenter}
                  </p>
                </div>
              </div>

              {isServiceLockedByBilling(managedService) ? (
                <div className="border border-red-200 rounded-xl bg-red-50/70 p-4 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-[#0F172A]">
                        Control Panel Access Locked — Invoice Settlement Required
                      </p>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        Direct control panel URL, SSH/FTP credentials, and container actions are temporarily locked because the invoice for this billing due date is unpaid or overdue. Settle your open invoice to automatically unlock instant access.
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const dueInv = myInvoices.find(
                      (inv) => inv.orderId === managedService.id && inv.status !== 'paid'
                    );
                    return dueInv ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManagedServiceId(null);
                          handleOpenInvoicePage(dueInv.id);
                        }}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Pay Invoice {dueInv.id} ({formatPrice(dueInv.amountUsd)}) to Unlock</span>
                      </button>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div className="border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-4 space-y-3 text-xs">
                  <p className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                    <span>
                      {managedService.productType === 'Shared Cloud'
                        ? 'StackCP Control Panel Access'
                        : managedService.productType === 'Unmanaged VPS' ||
                            managedService.productType === 'n8n Hosting'
                          ? 'SSH Root Access'
                          : 'Direct Control Panel Access'}
                    </span>
                  </p>

                  {managedService.productType === 'Unmanaged VPS' ||
                  managedService.productType === 'n8n Hosting' ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">SSH Command</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              'endpoint',
                              `ssh root@${managedService.serverIp ?? managedService.domainOrHost}`,
                              'SSH command'
                            )
                          }
                          className="font-mono text-[#0E6B63] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>
                            {`ssh root@${managedService.serverIp ?? managedService.domainOrHost}`}
                          </span>
                          <Copy className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Portal Username</span>
                        <span className="font-mono font-semibold text-[#0F172A]">
                          {managedService.cpanelUsername || 'root'}
                        </span>
                      </div>
                    </>
                  ) : managedService.productType === 'Shared Cloud' ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Control Panel Link</span>
                        <a
                          href={managedService.controlPanelUrl || 'https://stackcp.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-[#0E6B63] hover:underline inline-flex items-center gap-1"
                        >
                          <span>stackcp.com</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">StackCP Username</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              'username',
                              managedService.cpanelUsername || managedService.domainOrHost,
                              'StackCP Username'
                            )
                          }
                          className="font-mono font-semibold text-[#0F172A] hover:text-[#0E6B63] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{managedService.cpanelUsername || managedService.domainOrHost}</span>
                          <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">StackCP Password</span>
                        {managedService.controlPanelPassword ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#0F172A]">
                              {revealManagedPassword
                                ? managedService.controlPanelPassword
                                : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRevealManagedPassword((v) => !v)}
                              className="text-slate-500 hover:text-[#0F172A] cursor-pointer"
                              aria-label={revealManagedPassword ? 'Hide password' : 'Show password'}
                            >
                              {revealManagedPassword ? (
                                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  'cp-password',
                                  managedService.controlPanelPassword || '',
                                  'StackCP Password'
                                )
                              }
                              className="text-[#0E6B63] hover:text-[#0A534D] cursor-pointer"
                              aria-label="Copy password"
                            >
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Issued on approval
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                        <span className="text-slate-500 block">StackDNS Nameservers (4)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px] font-semibold text-[#0F172A]">
                          {(managedService.nameservers && managedService.nameservers.length >= 2
                            ? managedService.nameservers
                            : [
                                'ns1.stackdns.com',
                                'ns2.stackdns.com',
                                'ns3.stackdns.com',
                                'ns4.stackdns.com',
                              ]
                          ).map((ns) => (
                            <span key={ns} className="truncate">
                              {ns}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">cPanel Endpoint</span>
                        <a
                          href={
                            managedService.controlPanelUrl ||
                            `https://${managedService.serverIp ?? managedService.domainOrHost}:2083`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[#0E6B63] hover:underline inline-flex items-center gap-1"
                        >
                          <span>
                            {managedService.controlPanelUrl ||
                              `https://${managedService.serverIp ?? managedService.domainOrHost}:2083`}
                          </span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">cPanel Username</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              'username',
                              managedService.cpanelUsername || currentUser.username,
                              'cPanel Username'
                            )
                          }
                          className="font-mono font-semibold text-[#0F172A] hover:text-[#0E6B63] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{managedService.cpanelUsername || currentUser.username}</span>
                          <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        </button>
                      </div>

                      {managedService.controlPanelPassword && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">cPanel Password</span>
                          <div className="inline-flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#0F172A]">
                              {revealManagedPassword
                                ? managedService.controlPanelPassword
                                : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRevealManagedPassword((v) => !v)}
                              className="text-slate-500 hover:text-[#0F172A] cursor-pointer"
                              aria-label={revealManagedPassword ? 'Hide password' : 'Show password'}
                            >
                              {revealManagedPassword ? (
                                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  'cp-password',
                                  managedService.controlPanelPassword || '',
                                  'cPanel Password'
                                )
                              }
                              className="text-[#0E6B63] hover:text-[#0A534D] cursor-pointer"
                              aria-label="Copy password"
                            >
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">Nameservers</span>
                        <span className="font-mono text-[#0F172A] text-right">
                          {(managedService.nameservers && managedService.nameservers.length > 0
                            ? managedService.nameservers
                            : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
                          ).join(', ')}
                        </span>
                      </div>

                      {(managedService.productType === 'cPanel Hosting' ||
                        managedService.productType === 'Reseller Hosting') &&
                        managedService.status === 'active' && (
                          <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={ssoLoading}
                                onClick={() => void handleDirectCpanelSsoLogin(managedService)}
                                className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                              >
                                {ssoLoading ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                    <span>Generating SSO Session...</span>
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Direct Login to cPanel (SSO)</span>
                                  </>
                                )}
                              </button>

                              {ssoLaunchUrl && (
                                <a
                                  href={ssoLaunchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0E6B63] text-[#0E6B63] hover:bg-[#F2FAF8] text-xs font-semibold whitespace-nowrap"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Open cPanel Now</span>
                                </a>
                              )}
                            </div>
                            {ssoError && (
                              <p className="text-[11px] font-medium text-[#D97706]">
                                {ssoError}
                              </p>
                            )}
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {(managedService.cancellationStatus &&
                managedService.cancellationStatus !== 'none') ||
              (managedService.refundStatus &&
                managedService.refundStatus !== 'none') ? (
                <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-3.5 space-y-1.5 text-xs">
                  {managedService.cancellationStatus &&
                    managedService.cancellationStatus !== 'none' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#0F172A]">
                          Cancellation Status:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                            getCancellationStatusDisplay(
                              managedService.cancellationStatus
                            ).toneClass
                          }`}
                        >
                          {
                            getCancellationStatusDisplay(
                              managedService.cancellationStatus
                            ).label
                          }
                        </span>
                      </div>
                    )}
                  {managedService.cancellationReason && (
                    <p className="text-slate-600 text-[11px]">
                      Reason: {managedService.cancellationReason}
                    </p>
                  )}
                  {managedService.refundStatus &&
                    managedService.refundStatus !== 'none' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="font-semibold text-[#0F172A]">
                          Refund Status:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                            getRefundStatusDisplay(managedService.refundStatus)
                              .toneClass
                          }`}
                        >
                          {getRefundStatusDisplay(managedService.refundStatus).label}
                        </span>
                      </div>
                    )}
                </div>
              ) : null}

              {showSvcCancelForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSvcCancelError('');
                    const res = requestOrderCancellation(managedService.id, {
                      type: svcCancelType,
                      reason: svcCancelReason,
                    });
                    if (!res.ok) {
                      setSvcCancelError(res.error || 'Could not submit cancellation request.');
                      return;
                    }
                    setShowSvcCancelForm(false);
                    setSvcCancelReason('');
                    showToast(`Cancellation request submitted for ${managedService.domainOrHost}`);
                  }}
                  className="border border-red-200 bg-red-50/40 rounded-xl p-4 space-y-3 text-xs"
                >
                  <p className="font-display font-bold text-[#0F172A]">
                    Request Service Cancellation
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSvcCancelType('end_of_period')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                        svcCancelType === 'end_of_period'
                          ? 'border-[#0E6B63] bg-white ring-1 ring-[#0E6B63]'
                          : 'border-[#E2E8F0] bg-white'
                      }`}
                    >
                      <span className="font-semibold text-[#0F172A] block">
                        End of Billing Period
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cancel on renewal date
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvcCancelType('immediate')}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                        svcCancelType === 'immediate'
                          ? 'border-[#DC2626] bg-white ring-1 ring-[#DC2626]'
                          : 'border-[#E2E8F0] bg-white'
                      }`}
                    >
                      <span className="font-semibold text-[#0F172A] block">
                        Immediate
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Terminate immediately upon review
                      </span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={svcCancelReason}
                    onChange={(e) => {
                      setSvcCancelReason(e.target.value);
                      setSvcCancelError('');
                    }}
                    placeholder="Enter cancellation reason..."
                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                  {svcCancelError && (
                    <p className="text-[11px] font-semibold text-[#DC2626]">
                      {svcCancelError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSvcCancelForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white font-semibold text-slate-600 cursor-pointer"
                    >
                      Keep Service
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold cursor-pointer"
                    >
                      Submit Cancellation
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    const nextRenew = !(managedService.autoRenew !== false);
                    updateClientOrderSettings(managedService.id, { autoRenew: nextRenew });
                    showToast(
                      `Auto-renewal ${nextRenew ? 'enabled' : 'disabled'} for ${managedService.domainOrHost}`
                    );
                  }}
                  className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  Auto-Renew: {managedService.autoRenew !== false ? 'ON' : 'OFF'}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const host = managedService.domainOrHost;
                      setManagedServiceId(null);
                      handleOpenCreateTicketPage(host);
                    }}
                    className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                  >
                    Open Support Ticket
                  </button>

                  {(() => {
                    const svcInv = myInvoices.find((inv) => inv.orderId === managedService.id);
                    return svcInv ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManagedServiceId(null);
                          handleOpenInvoicePage(svcInv.id);
                        }}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0E6B63]/35 bg-[#F2FAF8] text-[#0E6B63] hover:bg-[#0E6B63] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>View Invoice</span>
                      </button>
                    ) : null;
                  })()}
                  {managedService.status !== 'cancelled' &&
                    (!managedService.cancellationStatus ||
                      managedService.cancellationStatus === 'none' ||
                      managedService.cancellationStatus === 'rejected') && (
                      <button
                        type="button"
                        onClick={() => setShowSvcCancelForm((v) => !v)}
                        className="min-h-[38px] px-3.5 py-2 rounded-lg border border-red-200 text-[#DC2626] hover:bg-red-50 text-xs font-semibold cursor-pointer"
                      >
                        Request Cancellation
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================ DEDICATED DOMAIN & INVOICE PAGES RENDERED ABOVE (NO POPUP MODALS) ============================ */}

      {/* ============================ QUICK SERVICE ORDER MODAL ============================ */}
      {showQuickOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <form
            onSubmit={handlePlaceQuickOrder}
            className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0F172A]">
                Deploy New Service
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickOrderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Select Plan
                </label>
                <select
                  value={quickCatalogId}
                  onChange={(e) => setQuickCatalogId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-xs sm:text-sm border border-[#CBD5E1] rounded-xl bg-white"
                >
                  {QUICK_ORDER_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.planName} ({item.productType}) —{' '}
                      {formatPrice(
                        quickCycle === 'Yearly' ? item.yearlyUsd : item.monthlyUsd
                      )}
                      /{quickCycle === 'Yearly' ? 'yr' : 'mo'}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  {QUICK_ORDER_CATALOG.find((c) => c.id === quickCatalogId)?.specs}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Domain or Node Hostname
                </label>
                <input
                  type="text"
                  required
                  value={quickDomainInput}
                  onChange={(e) => {
                    setQuickDomainInput(e.target.value);
                    if (quickOrderError) setQuickOrderError('');
                  }}
                  placeholder="yourbrand.com"
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Billing Cycle
                  </label>
                  <select
                    value={quickCycle}
                    onChange={(e) =>
                      setQuickCycle(e.target.value as 'Monthly' | 'Yearly')
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-white"
                  >
                    <option value="Yearly">Yearly (Save up to 20%)</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Datacenter Region
                  </label>
                  <select
                    value={quickDatacenter}
                    onChange={(e) => setQuickDatacenter(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-white"
                  >
                    {DATACENTER_OPTIONS.map((dc) => (
                      <option key={dc} value={dc}>
                        {dc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {quickOrderError && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {quickOrderError}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowQuickOrderModal(false);
                    onNavigateHome();
                  }}
                  className="text-xs font-semibold text-[#0E6B63] hover:underline"
                >
                  Browse Full Catalog
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickOrderModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold cursor-pointer"
                  >
                    Create Order
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
