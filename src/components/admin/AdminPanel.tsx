import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FileWarning,
  Globe,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  Menu,
  Minimize2,
  Paperclip,
  Plus,
  Receipt,
  RotateCcw,
  Save,
  Search,
  Send,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import {
  AbuseComplaintRecord,
  AbuseStatus,
  CmsFaqItem,
  CmsPageCategory,
  CmsPageRecord,
  CmsSectionItem,
  OrderStatus,
  PlatformInvoice,
  PlatformOrder,
  SupportTicketRecord,
  TicketAttachment,
  TicketDepartment,
  TicketPriority,
  TicketStatus,
  UserAccountStatus,
  UserRole,
  usePlatform,
} from '../../context/PlatformContext';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';
import { useCurrency } from '../../context/CurrencyContext';
import { applyPageSeoMetadata } from '../../utils/seoManager';
import { AdminClientManageView } from './AdminClientManageView';
import { AdminPaymentMethodsView } from './AdminPaymentMethodsView';
import { AdminEmailTemplatesView } from './AdminEmailTemplatesView';
import { AdminBillingInvoicesView } from './AdminBillingInvoicesView';
import { AdminDomainsView } from './AdminDomainsView';
import { AdminHostingPlansView } from './AdminHostingPlansView';
import { AdminModulesView } from './AdminModulesView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminSystemView } from './AdminSystemView';
import { AdminPromoCodesView } from './AdminPromoCodesView';

interface AdminPanelProps {
  initialRoutePath?: string;
  onSyncRoutePath?: (nextPath: string) => void;
  onNavigateHome: () => void;
  onPreviewPublicPath: (path: string) => void;
  onOpenDashboard: () => void;
  onSignedOut: () => void;
}

type AdminSection =
  | 'overview'
  | 'analytics'
  | 'tickets'
  | 'cms'
  | 'users'
  | 'orders'
  | 'promos'
  | 'domains'
  | 'plans'
  | 'modules'
  | 'payments'
  | 'emails'
  | 'system'
  | 'abuse'
  | 'activity';

const ADMIN_NAV_ITEMS: {
  id: AdminSection;
  label: string;
  path: string;
  icon: React.FC<{ className?: string; 'aria-hidden'?: boolean }>;
}[] = [
  { id: 'overview', label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { id: 'analytics', label: 'Sales Analytics', path: '/admin/analytics', icon: BarChart3 },
  { id: 'orders', label: 'Orders & Billing', path: '/admin/orders', icon: ShoppingBag },
  { id: 'promos', label: 'Promo Codes', path: '/admin/promos', icon: Tag },
  { id: 'domains', label: 'Domains & TLDs', path: '/admin/domains', icon: Globe },
  { id: 'plans', label: 'Hosting Plans', path: '/admin/plans', icon: Server },
  { id: 'modules', label: 'Module Config (WHM)', path: '/admin/modules', icon: Cpu },
  { id: 'tickets', label: 'Support Tickets', path: '/admin/tickets', icon: LifeBuoy },
  { id: 'users', label: 'Users & Clients', path: '/admin/users', icon: Users },
  { id: 'cms', label: 'Website CMS', path: '/admin/cms', icon: FileText },
  { id: 'payments', label: 'Payment Methods', path: '/admin/payments', icon: Wallet },
  { id: 'emails', label: 'Email Templates', path: '/admin/emails', icon: Mail },
  { id: 'system', label: 'System Config', path: '/admin/system', icon: Settings },
  { id: 'abuse', label: 'Abuse Moderation', path: '/admin/abuse', icon: ShieldAlert },
  { id: 'activity', label: 'Login Activity', path: '/admin/activity', icon: Activity },
];

const TICKET_DEPARTMENTS: TicketDepartment[] = [
  'Migration Site',
  'Technical Support',
  'Billing',
  'Account',
  'Support',
];

const ORDER_PRODUCT_TYPES: PlatformOrder['productType'][] = [
  'cPanel Hosting',
  'Shared Cloud',
  'Managed WordPress',
  'Windows Hosting',
  'Unmanaged VPS',
  'n8n Hosting',
  'Domain Registration',
  'Domain Transfer',
];

const MAX_ATTACHMENT_COUNT = 4;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES =
  'image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/zip,.log,.txt,.json';

function parseAdminRoute(rawPath?: string): {
  section: AdminSection;
  ticketId: string | null;
  cmsPageId: string | null;
  cmsCreatingNew: boolean;
  managingUserId: string | null;
} {
  const clean = (rawPath || '/admin').replace(/\/+$/, '') || '/admin';
  const parts = clean.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const sub = (parts[0] || '').toLowerCase();

  if (sub === 'tickets') {
    return {
      section: 'tickets',
      ticketId: parts[1] ? decodeURIComponent(parts[1]) : null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'cms') {
    if (parts[1] === 'new') {
      return {
        section: 'cms',
        ticketId: null,
        cmsPageId: null,
        cmsCreatingNew: true,
        managingUserId: null,
      };
    }
    return {
      section: 'cms',
      ticketId: null,
      cmsPageId: parts[1] ? decodeURIComponent(parts[1]) : null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'users') {
    return {
      section: 'users',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: parts[1] ? decodeURIComponent(parts[1]) : null,
    };
  }
  if (sub === 'orders' || sub === 'invoices') {
    return {
      section: 'orders',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'promos') {
    return {
      section: 'promos',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'analytics') {
    return {
      section: 'analytics',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'domains') {
    return {
      section: 'domains',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'plans') {
    return {
      section: 'plans',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'modules') {
    return {
      section: 'modules',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'system') {
    return {
      section: 'system',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'payments') {
    return {
      section: 'payments',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'emails') {
    return {
      section: 'emails',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'abuse') {
    return {
      section: 'abuse',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  if (sub === 'activity') {
    return {
      section: 'activity',
      ticketId: null,
      cmsPageId: null,
      cmsCreatingNew: false,
      managingUserId: null,
    };
  }
  return {
    section: 'overview',
    ticketId: null,
    cmsPageId: null,
    cmsCreatingNew: false,
    managingUserId: null,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readFilesAsAttachments(
  files: FileList | File[],
  existingCount: number
): Promise<{ accepted: TicketAttachment[]; warnings: string[] }> {
  const list = Array.from(files);
  const warnings: string[] = [];
  const remaining = Math.max(0, MAX_ATTACHMENT_COUNT - existingCount);
  if (list.length > remaining) {
    warnings.push(`Up to ${MAX_ATTACHMENT_COUNT} attachments allowed per message.`);
  }
  const slice = list.slice(0, remaining);

  const promises = slice.map(
    (file) =>
      new Promise<TicketAttachment | null>((resolve) => {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          warnings.push(`${file.name} exceeds the 2 MB limit.`);
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            dataUrl: typeof reader.result === 'string' ? reader.result : '',
          });
        };
        reader.onerror = () => {
          warnings.push(`Could not read ${file.name}.`);
          resolve(null);
        };
        reader.readAsDataURL(file);
      })
  );

  return Promise.all(promises).then((items) => ({
    accepted: items.filter((i): i is TicketAttachment => Boolean(i && i.dataUrl)),
    warnings,
  }));
}

function StatusTextBadge({
  tone,
  label,
}: {
  tone: 'emerald' | 'amber' | 'red' | 'slate' | 'teal';
  label: string;
}) {
  const colorMap = {
    emerald: 'text-[#16A34A] bg-[#16A34A]/10',
    amber: 'text-[#D97706] bg-[#D97706]/10',
    red: 'text-[#DC2626] bg-[#DC2626]/10',
    teal: 'text-[#0E6B63] bg-[#0E6B63]/10',
    slate: 'text-slate-600 bg-slate-100',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${colorMap[tone]}`}
    >
      {label}
    </span>
  );
}

function getTicketStatusMeta(status: TicketStatus): {
  label: string;
  tone: 'emerald' | 'amber' | 'teal';
} {
  if (status === 'resolved') return { label: 'Resolved', tone: 'emerald' };
  if (status === 'pending') return { label: 'Pending', tone: 'amber' };
  return { label: 'Open', tone: 'teal' };
}

function getOrderTone(
  status: OrderStatus
): 'emerald' | 'amber' | 'red' | 'slate' | 'teal' {
  if (status === 'active') return 'emerald';
  if (status === 'pending') return 'amber';
  if (status === 'suspended' || status === 'expired') return 'red';
  if (status === 'transferred') return 'teal';
  return 'slate';
}

function getUserTone(
  status: UserAccountStatus
): 'emerald' | 'amber' | 'red' | 'slate' {
  if (status === 'active') return 'emerald';
  if (status === 'pending_kyc') return 'amber';
  if (status === 'cancelled') return 'slate';
  return 'red';
}

function getAbuseTone(status: AbuseStatus): 'emerald' | 'amber' | 'red' | 'slate' {
  if (status === 'open') return 'red';
  if (status === 'investigating') return 'amber';
  if (status === 'resolved') return 'emerald';
  if (status === 'suspended_target') return 'red';
  return 'slate';
}

function formatAbuseLabel(status: AbuseStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'investigating':
      return 'Investigating';
    case 'suspended_target':
      return 'Suspended';
    case 'resolved':
      return 'Resolved';
    case 'dismissed':
      return 'Dismissed';
  }
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  initialRoutePath = '/admin',
  onSyncRoutePath,
  onNavigateHome,
  onPreviewPublicPath,
  onOpenDashboard,
  onSignedOut,
}) => {
  const {
    currentUser,
    isAdmin,
    users,
    orders,
    invoices,
    paymentMethods,
    invoiceTemplateConfig,
    systemSettings,
    tickets,
    abuseComplaints,
    loginActivityLogs,
    cmsPages,
    cmsSiteSettings,
    provisioningModules,
    hostingPlans,
    logout,
    createUserAccount,
    updateUserStatus,
    updateUserRole,
    toggleUserKyc,
    adminResetUserSupportPin,
    addOrder,
    updateOrderStatus,
    approveOrderWithServer,
    generateInvoiceForOrder,
    adminUpdateOrderDetails,
    replyTicketAsAdmin,
    updateTicketByAdmin,
    saveCmsPage,
    createCmsPage,
    deleteCmsPage,
    resetSystemCmsPage,
    updateCmsSiteSettings,
    moderateAbuseComplaint,
  } = usePlatform();
  const { formatPrice, currency } = useCurrency();

  const initialParsed = useMemo(() => parseAdminRoute(initialRoutePath), [initialRoutePath]);
  const [activeSection, setActiveSection] = useState<AdminSection>(initialParsed.section);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialParsed.ticketId);
  const [editingCmsId, setEditingCmsId] = useState<string | null>(initialParsed.cmsPageId);
  const [creatingNewCms, setCreatingNewCms] = useState<boolean>(initialParsed.cmsCreatingNew);
  const [managingUserId, setManagingUserId] = useState<string | null>(
    initialParsed.managingUserId
  );
  const [ordersBillingSubTab, setOrdersBillingSubTab] = useState<
    'orders' | 'invoices' | 'template'
  >(() =>
    (initialRoutePath || '').includes('/admin/invoices') ? 'invoices' : 'orders'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Sync external URL changes (e.g. browser back/forward)
  useEffect(() => {
    const parsed = parseAdminRoute(initialRoutePath);
    setActiveSection(parsed.section);
    setActiveTicketId(parsed.ticketId);
    setEditingCmsId(parsed.cmsPageId);
    setCreatingNewCms(parsed.cmsCreatingNew);
    setManagingUserId(parsed.managingUserId);
  }, [initialRoutePath]);

  const navigateAdmin = (
    section: AdminSection,
    opts?: {
      ticketId?: string | null;
      cmsPageId?: string | null;
      newCms?: boolean;
      userId?: string | null;
    }
  ) => {
    setActiveSection(section);
    setActiveTicketId(opts?.ticketId ?? null);
    setEditingCmsId(opts?.cmsPageId ?? null);
    setCreatingNewCms(Boolean(opts?.newCms));
    setManagingUserId(opts?.userId ?? null);
    setSidebarOpen(false);

    let nextPath = '/admin';
    if (section === 'tickets') {
      nextPath = opts?.ticketId
        ? `/admin/tickets/${encodeURIComponent(opts.ticketId)}`
        : '/admin/tickets';
    } else if (section === 'cms') {
      if (opts?.newCms) nextPath = '/admin/cms/new';
      else if (opts?.cmsPageId) {
        nextPath = `/admin/cms/${encodeURIComponent(opts.cmsPageId)}`;
      } else {
        nextPath = '/admin/cms';
      }
    } else if (section === 'users') {
      nextPath = opts?.userId
        ? `/admin/users/${encodeURIComponent(opts.userId)}`
        : '/admin/users';
    } else if (section !== 'overview') {
      nextPath = `/admin/${section}`;
    }
    onSyncRoutePath?.(nextPath);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  useEffect(() => {
    applyPageSeoMetadata({
      title: 'Admin Console | cpcloudhost.com',
      description:
        'Operations workspace for support tickets, website CMS management, client accounts, orders, and security auditing.',
      canonicalPath: '/admin',
      ogType: 'website',
      jsonLd: null,
    });
  }, []);

  // =========================================================================
  // SUPPORT TICKET DESK STATE
  // =========================================================================
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [ticketDeptFilter, setTicketDeptFilter] = useState<'all' | TicketDepartment>('all');
  const [staffReplyBody, setStaffReplyBody] = useState('');
  const [staffReplyStatus, setStaffReplyStatus] = useState<TicketStatus>('pending');
  const [staffAttachments, setStaffAttachments] = useState<TicketAttachment[]>([]);
  const [staffAttachWarning, setStaffAttachWarning] = useState('');
  const [staffReplyError, setStaffReplyError] = useState('');
  const [expandedImageIds, setExpandedImageIds] = useState<Record<string, boolean>>({});
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSupportTicket: SupportTicketRecord | null = useMemo(() => {
    if (!activeTicketId) return null;
    return tickets.find((t) => t.id === activeTicketId) ?? null;
  }, [tickets, activeTicketId]);

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();
    return tickets.filter((t) => {
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
      if (ticketDeptFilter !== 'all' && t.department !== ticketDeptFilter) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.clientEmail.toLowerCase().includes(q) ||
        (t.relatedService || '').toLowerCase().includes(q) ||
        (t.supportPinUsed || '').toLowerCase().includes(q)
      );
    });
  }, [tickets, ticketSearch, ticketStatusFilter, ticketDeptFilter]);

  const handleStaffAttachFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setStaffAttachWarning('');
    const { accepted, warnings } = await readFilesAsAttachments(
      fileList,
      staffAttachments.length
    );
    if (accepted.length > 0) {
      setStaffAttachments((prev) => [...prev, ...accepted].slice(0, MAX_ATTACHMENT_COUNT));
    }
    if (warnings.length > 0) {
      setStaffAttachWarning(warnings.join(' '));
    }
  };

  const handleStaffReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupportTicket) return;
    const res = replyTicketAsAdmin(
      selectedSupportTicket.id,
      staffReplyBody,
      staffAttachments,
      staffReplyStatus
    );
    if (!res.ok) {
      setStaffReplyError(res.error ?? 'Unable to dispatch staff reply.');
      return;
    }
    setStaffReplyBody('');
    setStaffAttachments([]);
    setStaffAttachWarning('');
    setStaffReplyError('');
    showToast(`Reply sent to ${selectedSupportTicket.id} (${staffReplyStatus})`);
  };

  // =========================================================================
  // WEBSITE CMS STATE
  // =========================================================================
  const [cmsSearch, setCmsSearch] = useState('');
  const [cmsCategoryFilter, setCmsCategoryFilter] = useState<'all' | CmsPageCategory>('all');

  // Global Site Settings local draft state
  const [siteAnnouncementEnabled, setSiteAnnouncementEnabled] = useState(
    cmsSiteSettings.announcementEnabled
  );
  const [siteAnnouncementText, setSiteAnnouncementText] = useState(
    cmsSiteSettings.announcementText
  );
  const [siteAnnouncementCtaText, setSiteAnnouncementCtaText] = useState(
    cmsSiteSettings.announcementCtaText
  );
  const [siteAnnouncementCtaUrl, setSiteAnnouncementCtaUrl] = useState(
    cmsSiteSettings.announcementCtaUrl
  );
  const [siteSupportEmail, setSiteSupportEmail] = useState(cmsSiteSettings.supportEmail);
  const [siteFooterTagline, setSiteFooterTagline] = useState(
    cmsSiteSettings.footerTagline
  );
  const [siteFooterCopyright, setSiteFooterCopyright] = useState(
    cmsSiteSettings.footerCopyright
  );

  useEffect(() => {
    setSiteAnnouncementEnabled(cmsSiteSettings.announcementEnabled);
    setSiteAnnouncementText(cmsSiteSettings.announcementText);
    setSiteAnnouncementCtaText(cmsSiteSettings.announcementCtaText);
    setSiteAnnouncementCtaUrl(cmsSiteSettings.announcementCtaUrl);
    setSiteSupportEmail(cmsSiteSettings.supportEmail);
    setSiteFooterTagline(cmsSiteSettings.footerTagline);
    setSiteFooterCopyright(cmsSiteSettings.footerCopyright);
  }, [cmsSiteSettings]);

  // Page Editor Form Draft
  const activeEditingCmsPage: CmsPageRecord | null = useMemo(() => {
    if (!editingCmsId) return null;
    return cmsPages.find((p) => p.id === editingCmsId) ?? null;
  }, [cmsPages, editingCmsId]);

  const [draftNavTitle, setDraftNavTitle] = useState('');
  const [draftSlug, setDraftSlug] = useState('');
  const [draftCategory, setDraftCategory] = useState<CmsPageCategory>('Custom Page');
  const [draftStatus, setDraftStatus] = useState<'published' | 'draft'>('published');
  const [draftSeoTitle, setDraftSeoTitle] = useState('');
  const [draftSeoDescription, setDraftSeoDescription] = useState('');
  const [draftHeroBadge, setDraftHeroBadge] = useState('');
  const [draftHeroTitle, setDraftHeroTitle] = useState('');
  const [draftHeroSubtitle, setDraftHeroSubtitle] = useState('');
  const [draftPrimaryCtaText, setDraftPrimaryCtaText] = useState('');
  const [draftPrimaryCtaUrl, setDraftPrimaryCtaUrl] = useState('');
  const [draftSecondaryCtaText, setDraftSecondaryCtaText] = useState('');
  const [draftSecondaryCtaUrl, setDraftSecondaryCtaUrl] = useState('');
  const [draftHighlights, setDraftHighlights] = useState<string[]>([]);
  const [draftSections, setDraftSections] = useState<CmsSectionItem[]>([]);
  const [draftFaqItems, setDraftFaqItems] = useState<CmsFaqItem[]>([]);
  const [draftShowInHeader, setDraftShowInHeader] = useState(false);
  const [draftShowInFooter, setDraftShowInFooter] = useState(true);
  const [cmsEditorError, setCmsEditorError] = useState('');

  useEffect(() => {
    if (creatingNewCms) {
      setDraftNavTitle('');
      setDraftSlug('/');
      setDraftCategory('Custom Page');
      setDraftStatus('published');
      setDraftSeoTitle('');
      setDraftSeoDescription('');
      setDraftHeroBadge('cpcloudhost.com');
      setDraftHeroTitle('');
      setDraftHeroSubtitle('');
      setDraftPrimaryCtaText('Explore Hosting Plans');
      setDraftPrimaryCtaUrl('/shared-hosting');
      setDraftSecondaryCtaText('Contact Support');
      setDraftSecondaryCtaUrl('/auth/login');
      setDraftHighlights([
        '99.99% Uptime SLA Guarantee',
        'NVMe Cloud Clusters & Free Wildcard SSL',
      ]);
      setDraftSections([
        {
          id: `sec-${Date.now()}`,
          heading: 'Engineered for Production Workloads',
          body: 'Add custom copy, pricing summaries, SLA guarantees, or technical walkthroughs that publish directly onto your website.',
          ctaText: 'Start Free Trial',
          ctaUrl: '/free-trial',
        },
      ]);
      setDraftFaqItems([]);
      setDraftShowInHeader(true);
      setDraftShowInFooter(true);
      setCmsEditorError('');
      return;
    }

    if (activeEditingCmsPage) {
      setDraftNavTitle(activeEditingCmsPage.navTitle);
      setDraftSlug(activeEditingCmsPage.slug);
      setDraftCategory(activeEditingCmsPage.category);
      setDraftStatus(activeEditingCmsPage.status);
      setDraftSeoTitle(activeEditingCmsPage.seoTitle);
      setDraftSeoDescription(activeEditingCmsPage.seoDescription);
      setDraftHeroBadge(activeEditingCmsPage.heroBadge);
      setDraftHeroTitle(activeEditingCmsPage.heroTitle);
      setDraftHeroSubtitle(activeEditingCmsPage.heroSubtitle);
      setDraftPrimaryCtaText(activeEditingCmsPage.primaryCtaText);
      setDraftPrimaryCtaUrl(activeEditingCmsPage.primaryCtaUrl);
      setDraftSecondaryCtaText(activeEditingCmsPage.secondaryCtaText);
      setDraftSecondaryCtaUrl(activeEditingCmsPage.secondaryCtaUrl);
      setDraftHighlights([...activeEditingCmsPage.highlights]);
      setDraftSections(activeEditingCmsPage.sections.map((s) => ({ ...s })));
      setDraftFaqItems((activeEditingCmsPage.faqItems ?? []).map((f) => ({ ...f })));
      setDraftShowInHeader(Boolean(activeEditingCmsPage.showInHeaderMenu));
      setDraftShowInFooter(Boolean(activeEditingCmsPage.showInFooter));
      setCmsEditorError('');
    }
  }, [creatingNewCms, activeEditingCmsPage]);

  const filteredCmsPages = useMemo(() => {
    const q = cmsSearch.trim().toLowerCase();
    return cmsPages.filter((p) => {
      if (cmsCategoryFilter !== 'all' && p.category !== cmsCategoryFilter) return false;
      if (!q) return true;
      return (
        p.navTitle.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.heroTitle.toLowerCase().includes(q)
      );
    });
  }, [cmsPages, cmsSearch, cmsCategoryFilter]);

  const handleSaveGlobalSiteSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCmsSiteSettings({
      announcementEnabled: siteAnnouncementEnabled,
      announcementText: siteAnnouncementText.trim(),
      announcementCtaText: siteAnnouncementCtaText.trim(),
      announcementCtaUrl: siteAnnouncementCtaUrl.trim() || '/shared-hosting',
      supportEmail: siteSupportEmail.trim() || 'support@cpcloudhost.com',
      footerTagline: siteFooterTagline.trim(),
      footerCopyright: siteFooterCopyright.trim(),
    });
    showToast('Global site settings published live');
  };

  const handleSaveCmsEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftNavTitle.trim()) {
      setCmsEditorError('Enter a Page Title.');
      return;
    }
    if (!draftHeroTitle.trim()) {
      setCmsEditorError('Enter a Hero H1 Headline.');
      return;
    }

    const cleanHighlights = draftHighlights.map((h) => h.trim()).filter(Boolean);
    const cleanSections = draftSections
      .filter((s) => s.heading.trim() || s.body.trim())
      .map((s) => ({
        ...s,
        heading: s.heading.trim(),
        body: s.body.trim(),
        ctaText: s.ctaText?.trim() || undefined,
        ctaUrl: s.ctaUrl?.trim() || undefined,
      }));
    const cleanFaqs = draftFaqItems
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({
        question: f.question.trim(),
        answer: f.answer.trim(),
      }));

    if (creatingNewCms) {
      const res = createCmsPage({
        navTitle: draftNavTitle.trim(),
        slug: draftSlug.trim() || draftNavTitle.trim(),
        category: draftCategory,
        status: draftStatus,
        seoTitle: draftSeoTitle.trim() || `${draftNavTitle.trim()} | cpcloudhost.com`,
        seoDescription:
          draftSeoDescription.trim() ||
          draftHeroSubtitle.trim() ||
          'Cloud hosting & domain solutions at cpcloudhost.com.',
        heroBadge: draftHeroBadge.trim(),
        heroTitle: draftHeroTitle.trim(),
        heroSubtitle: draftHeroSubtitle.trim(),
        primaryCtaText: draftPrimaryCtaText.trim(),
        primaryCtaUrl: draftPrimaryCtaUrl.trim(),
        secondaryCtaText: draftSecondaryCtaText.trim(),
        secondaryCtaUrl: draftSecondaryCtaUrl.trim(),
        highlights: cleanHighlights,
        sections: cleanSections,
        faqItems: cleanFaqs.length > 0 ? cleanFaqs : undefined,
        showInHeaderMenu: draftShowInHeader,
        showInFooter: draftShowInFooter,
      });
      if (!res.ok || !res.page) {
        setCmsEditorError(res.error ?? 'Unable to create page.');
        return;
      }
      setCmsEditorError('');
      showToast(`Page created at ${res.page.slug}`);
      navigateAdmin('cms', { cmsPageId: res.page.id });
      return;
    }

    if (activeEditingCmsPage) {
      const res = saveCmsPage(activeEditingCmsPage.id, {
        navTitle: draftNavTitle.trim(),
        slug: activeEditingCmsPage.isSystemPage ? activeEditingCmsPage.slug : draftSlug,
        category: activeEditingCmsPage.isSystemPage
          ? activeEditingCmsPage.category
          : draftCategory,
        status: draftStatus,
        seoTitle: draftSeoTitle.trim() || `${draftNavTitle.trim()} | cpcloudhost.com`,
        seoDescription: draftSeoDescription.trim(),
        heroBadge: draftHeroBadge.trim(),
        heroTitle: draftHeroTitle.trim(),
        heroSubtitle: draftHeroSubtitle.trim(),
        primaryCtaText: draftPrimaryCtaText.trim(),
        primaryCtaUrl: draftPrimaryCtaUrl.trim(),
        secondaryCtaText: draftSecondaryCtaText.trim(),
        secondaryCtaUrl: draftSecondaryCtaUrl.trim(),
        highlights: cleanHighlights,
        sections: cleanSections,
        faqItems:
          activeEditingCmsPage.id === 'home' || cleanFaqs.length > 0
            ? cleanFaqs
            : undefined,
        showInHeaderMenu: draftShowInHeader,
        showInFooter: draftShowInFooter,
      });
      if (!res.ok) {
        setCmsEditorError(res.error ?? 'Failed to save page content.');
        return;
      }
      setCmsEditorError('');
      showToast(`Saved live updates for ${activeEditingCmsPage.navTitle}`);
    }
  };

  // =========================================================================
  // USERS, ORDERS, ABUSE & ACTIVITY STATE
  // =========================================================================
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserAccountStatus>('all');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserCountry, setNewUserCountry] = useState('United Kingdom');
  const [newUserRole, setNewUserRole] = useState<UserRole>('client');
  const [createUserError, setCreateUserError] = useState('');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderMode, setEditingOrderMode] = useState(false);
  const [editOrderPlan, setEditOrderPlan] = useState('');
  const [editOrderDomain, setEditOrderDomain] = useState('');
  const [editOrderCycle, setEditOrderCycle] = useState<PlatformOrder['billingCycle']>('Yearly');
  const [editOrderAmountUsd, setEditOrderAmountUsd] = useState('');
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('active');
  const [editOrderDatacenter, setEditOrderDatacenter] = useState('');
  const [editOrderCreatedAt, setEditOrderCreatedAt] = useState('');
  const [editOrderDueDate, setEditOrderDueDate] = useState('');
  const [editOrderServerIp, setEditOrderServerIp] = useState('');
  const [editOrderModuleId, setEditOrderModuleId] = useState('');
  const [editOrderPackage, setEditOrderPackage] = useState('');
  const [editOrderAutoRenew, setEditOrderAutoRenew] = useState(true);
  const [editOrderNotes, setEditOrderNotes] = useState('');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrderEmail, setNewOrderEmail] = useState('tariq@lahorecommerce.pk');
  const [newOrderType, setNewOrderType] =
    useState<PlatformOrder['productType']>('cPanel Hosting');
  const [newOrderPlan, setNewOrderPlan] = useState('cPanel Velocity');
  const [newOrderDomain, setNewOrderDomain] = useState('');
  const [newOrderCycle, setNewOrderCycle] =
    useState<PlatformOrder['billingCycle']>('Yearly');
  const [newOrderAmountUsd, setNewOrderAmountUsd] = useState('239.88');
  const [newOrderDatacenter, setNewOrderDatacenter] = useState('London, UK');
  const [newOrderInitialStatus, setNewOrderInitialStatus] = useState<'pending' | 'active'>('pending');
  const [createOrderError, setCreateOrderError] = useState('');

  // Approve & Provision Server Modal state
  const [approvingOrder, setApprovingOrder] = useState<PlatformOrder | null>(null);
  const [approveModuleId, setApproveModuleId] = useState('');
  const [approvePackageName, setApprovePackageName] = useState('');
  const [approveServerIp, setApproveServerIp] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [approveLiveWhm, setApproveLiveWhm] = useState(false);
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [lastApprovedInvoiceNotice, setLastApprovedInvoiceNotice] = useState<{
    orderId: string;
    invoice: PlatformInvoice;
    createdNew: boolean;
    serverName: string;
  } | null>(null);

  const [abuseSearch, setAbuseSearch] = useState('');
  const [abuseFilter, setAbuseFilter] = useState<'all' | AbuseStatus>('all');
  const [selectedAbuseId, setSelectedAbuseId] = useState<string>(
    abuseComplaints[0]?.ticketId ?? ''
  );
  const [modStatus, setModStatus] = useState<AbuseStatus>('investigating');
  const [modNotes, setModNotes] = useState('');
  const [modSuspendOrders, setModSuspendOrders] = useState(false);

  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'success' | 'warning' | 'blocked'>('all');

  const selectedAbuseTicket: AbuseComplaintRecord | null = useMemo(() => {
    return (
      abuseComplaints.find((c) => c.ticketId === selectedAbuseId) ??
      abuseComplaints[0] ??
      null
    );
  }, [abuseComplaints, selectedAbuseId]);

  useEffect(() => {
    if (selectedAbuseTicket) {
      setModStatus(selectedAbuseTicket.status);
      setModNotes(selectedAbuseTicket.moderatorNotes);
      setModSuspendOrders(false);
    }
  }, [selectedAbuseTicket]);

  const metrics = useMemo(() => {
    const activeOrderRevenue = orders
      .filter((o) => o.status === 'active' || o.status === 'pending')
      .reduce((sum, o) => sum + o.amountUsd, 0);
    const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
    const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;
    const openAbuseCount = abuseComplaints.filter(
      (a) => a.status === 'open' || a.status === 'investigating'
    ).length;
    const publishedPagesCount = cmsPages.filter((p) => p.status === 'published').length;
    const activeUsersCount = users.filter((u) => u.status === 'active').length;
    return {
      activeOrderRevenue,
      pendingOrdersCount,
      openTicketsCount,
      openAbuseCount,
      publishedPagesCount,
      activeUsersCount,
    };
  }, [orders, tickets, abuseComplaints, cmsPages, users]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        u.company.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.clientEmail.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.domainOrHost.toLowerCase().includes(q) ||
        o.planName.toLowerCase().includes(q) ||
        o.productType.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredAbuse = useMemo(() => {
    const q = abuseSearch.trim().toLowerCase();
    return abuseComplaints.filter((a) => {
      if (abuseFilter !== 'all' && a.status !== abuseFilter) return false;
      if (!q) return true;
      return (
        a.ticketId.toLowerCase().includes(q) ||
        a.targetResource.toLowerCase().includes(q) ||
        a.reporterEmail.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.organization.toLowerCase().includes(q)
      );
    });
  }, [abuseComplaints, abuseSearch, abuseFilter]);

  const filteredActivity = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    return loginActivityLogs.filter((log) => {
      if (activityFilter !== 'all' && log.status !== activityFilter) return false;
      if (!q) return true;
      return (
        log.userEmail.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.eventType.toLowerCase().includes(q) ||
        log.authMethod.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q)
      );
    });
  }, [loginActivityLogs, activitySearch, activityFilter]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (selectedOrder) {
      setEditingOrderMode(false);
      setEditOrderPlan(selectedOrder.planName);
      setEditOrderDomain(selectedOrder.domainOrHost);
      setEditOrderCycle(selectedOrder.billingCycle);
      setEditOrderAmountUsd(selectedOrder.amountUsd.toFixed(2));
      setEditOrderStatus(selectedOrder.status);
      setEditOrderDatacenter(selectedOrder.datacenter);
      setEditOrderCreatedAt(selectedOrder.createdAt.slice(0, 10));
      setEditOrderDueDate((selectedOrder.nextDueDate || '').slice(0, 10));
      setEditOrderServerIp(selectedOrder.serverIp || '');
      setEditOrderModuleId(selectedOrder.serverModuleId || '');
      setEditOrderPackage(selectedOrder.serverPackageName || '');
      setEditOrderAutoRenew(selectedOrder.autoRenew ?? true);
      setEditOrderNotes(selectedOrder.notes || '');
    }
  }, [selectedOrder]);

  const handleSaveSelectedOrderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const amt = parseFloat(editOrderAmountUsd);
    const res = adminUpdateOrderDetails(selectedOrder.id, {
      planName: editOrderPlan.trim() || selectedOrder.planName,
      domainOrHost: editOrderDomain.trim() || selectedOrder.domainOrHost,
      billingCycle: editOrderCycle,
      amountUsd: Number.isFinite(amt) && amt >= 0 ? amt : selectedOrder.amountUsd,
      status: editOrderStatus,
      datacenter: editOrderDatacenter.trim() || selectedOrder.datacenter,
      createdAt: editOrderCreatedAt || selectedOrder.createdAt,
      nextDueDate: editOrderDueDate || selectedOrder.nextDueDate,
      serverIp: editOrderServerIp.trim() || undefined,
      serverModuleId: editOrderModuleId || undefined,
      serverPackageName: editOrderPackage.trim() || undefined,
      autoRenew: editOrderAutoRenew,
      notes: editOrderNotes.trim(),
    });
    if (res.ok) {
      setEditingOrderMode(false);
      showToast(`Updated order ${selectedOrder.id}`);
    } else {
      showToast(res.error || 'Could not update order');
    }
  };

  const openApproveModal = (ord: PlatformOrder) => {
    const matchedPlan = hostingPlans.find(
      (p) => p.name.toLowerCase() === ord.planName.toLowerCase()
    );
    const defaultMod =
      provisioningModules.find(
        (m) =>
          m.id === (ord.serverModuleId || matchedPlan?.serverModuleId) && m.enabled
      ) ??
      provisioningModules.find((m) => m.enabled) ??
      provisioningModules[0];

    const defaultPkg =
      ord.serverPackageName ||
      matchedPlan?.serverPackageName ||
      defaultMod?.packages?.[0] ||
      '';

    setApprovingOrder(ord);
    setApproveModuleId(defaultMod?.id || '');
    setApprovePackageName(defaultPkg);
    setApproveServerIp(ord.serverIp || '');
    setApproveNotes('');
    setApproveLiveWhm(
      Boolean(defaultMod?.moduleType === 'whm' && defaultMod.apiToken.trim())
    );
    setApproveError('');
  };

  const handleConfirmApproveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingOrder || approveSubmitting) return;
    if (!approveModuleId) {
      setApproveError('Select a provisioning server module before approving.');
      return;
    }

    const selectedMod = provisioningModules.find((m) => m.id === approveModuleId);
    let extraNote = approveNotes.trim();

    if (
      approveLiveWhm &&
      selectedMod &&
      selectedMod.moduleType === 'whm' &&
      selectedMod.apiToken.trim()
    ) {
      setApproveSubmitting(true);
      setApproveError('');
      try {
        const cleanUser = approvingOrder.domainOrHost
          .replace(/[^a-z0-9]/gi, '')
          .toLowerCase()
          .slice(0, 8) || 'cpuser01';
        const res = await fetch('/api/modules/whm/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostname: selectedMod.hostname,
            port: selectedMod.port,
            useSsl: selectedMod.useSsl,
            username: selectedMod.username,
            apiToken: selectedMod.apiToken,
            ignoreSslErrors: selectedMod.ignoreSslErrors,
            domain: approvingOrder.domainOrHost,
            cpanelUsername: cleanUser,
            plan: approvePackageName.trim() || selectedMod.packages[0] || 'default',
            contactEmail: approvingOrder.clientEmail,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          setApproveSubmitting(false);
          setApproveError(
            data.error ||
              data.message ||
              'WHM live provisioning failed. Uncheck live WHM sync to approve locally or check WHM credentials.'
          );
          return;
        }
        extraNote = `${extraNote ? `${extraNote} · ` : ''}WHM Live: ${data.message || 'Account created'}`;
      } catch (err) {
        setApproveSubmitting(false);
        setApproveError(
          err instanceof Error
            ? `WHM request failed: ${err.message}`
            : 'WHM request failed.'
        );
        return;
      }
      setApproveSubmitting(false);
    }

    const result = approveOrderWithServer({
      orderId: approvingOrder.id,
      serverModuleId: approveModuleId,
      serverPackageName: approvePackageName.trim(),
      serverIp: approveServerIp.trim(),
      notes: extraNote || undefined,
    });

    if (!result.ok) {
      setApproveError(result.error ?? 'Could not approve order.');
      return;
    }

    const approvedOrderSnapshot = approvingOrder;
    const serverLabel = selectedMod?.name || 'selected server';
    setApprovingOrder(null);

    if (result.invoice) {
      setLastApprovedInvoiceNotice({
        orderId: approvedOrderSnapshot.id,
        invoice: result.invoice,
        createdNew: Boolean(result.invoiceWasCreated),
        serverName: serverLabel,
      });

      if (
        systemSettings.smtp.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password &&
        invoiceTemplateConfig.autoSendInvoiceEmailOnApproval !== false
      ) {
        void fetch('/api/system/send-invoice-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp: systemSettings.smtp,
            toEmail: approvedOrderSnapshot.clientEmail,
            clientName: approvedOrderSnapshot.clientName,
            invoiceId: result.invoice.id,
            orderId: approvedOrderSnapshot.id,
            planName: approvedOrderSnapshot.planName,
            domainOrHost: approvedOrderSnapshot.domainOrHost,
            amountFormatted: formatPrice(result.invoice.amountUsd),
            statusLabel: result.invoice.status.toUpperCase(),
            issuedDate: result.invoice.issuedDate,
            dueDate: result.invoice.dueDate,
            datacenter: approvedOrderSnapshot.datacenter,
            companyName: invoiceTemplateConfig.companyName,
          }),
        }).catch(() => undefined);
      }

      showToast(
        `Order ${approvedOrderSnapshot.id} approved · Invoice ${result.invoice.id} ${
          result.invoiceWasCreated ? 'auto-generated' : 'marked PAID'
        }`
      );
    } else {
      showToast(
        `Order ${approvedOrderSnapshot.id} approved & provisioned on ${serverLabel}`
      );
    }
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createUserAccount({
      name: newUserName,
      email: newUserEmail,
      company: newUserCompany,
      country: newUserCountry,
      role: newUserRole,
    });
    if (!res.ok) {
      setCreateUserError(res.error ?? 'Unable to create account.');
      return;
    }
    setCreateUserError('');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserCompany('');
    setShowCreateUser(false);
    showToast('Client account provisioned');
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newOrderAmountUsd);
    if (!newOrderEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrderEmail.trim())) {
      setCreateOrderError('Enter a valid client email address.');
      return;
    }
    if (!newOrderDomain.trim()) {
      setCreateOrderError('Enter target hostname or domain name.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setCreateOrderError('Enter a valid non-negative USD base amount.');
      return;
    }

    const createdRes = addOrder({
      clientEmail: newOrderEmail.trim(),
      productType: newOrderType,
      planName: newOrderPlan.trim() || newOrderType,
      domainOrHost: newOrderDomain.trim(),
      billingCycle: newOrderCycle,
      amountUsd: parsedAmount,
      datacenter: newOrderDatacenter,
      paymentMethod:
        newOrderInitialStatus === 'pending'
          ? 'Pending Approval'
          : 'Admin Manual Provision',
      status: newOrderInitialStatus,
      generateInvoice: newOrderInitialStatus === 'active',
    });
    setCreateOrderError('');
    setNewOrderDomain('');
    setShowCreateOrder(false);
    showToast(
      newOrderInitialStatus === 'pending'
        ? `Order ${createdRes.order.id} queued (invoice auto-generates upon approval)`
        : `Order ${createdRes.order.id} provisioned with invoice ${createdRes.invoice?.id || ''}`
    );
  };

  const handleModerationSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbuseTicket) return;
    moderateAbuseComplaint(
      selectedAbuseTicket.ticketId,
      modStatus,
      modNotes,
      modSuspendOrders
    );
    showToast(
      `Abuse case ${selectedAbuseTicket.ticketId} saved (${formatAbuseLabel(modStatus)})`
    );
  };

  // Defense-in-depth RBAC guard (primary gate is /admin/wp)
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-[#DC2626] mx-auto mb-3" aria-hidden="true" />
          <h1 className="font-display text-xl font-bold text-[#0F172A]">
            Administrator Clearance Required
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Sign in via the dedicated administrator portal to open this workspace.
          </p>
          <button
            type="button"
            onClick={onSignedOut}
            className="mt-5 px-5 py-2.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
          >
            Go to Admin Sign In
          </button>
        </div>
      </div>
    );
  }

  const initials = currentUser.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const activeManagedUser = useMemo(() => {
    if (!managingUserId) return null;
    return users.find((u) => u.id === managingUserId) ?? null;
  }, [users, managingUserId]);

  const breadcrumbTrail = (() => {
    if (activeSection === 'tickets') {
      return selectedSupportTicket
        ? ['Support Tickets', selectedSupportTicket.id]
        : ['Support Tickets'];
    }
    if (activeSection === 'cms') {
      if (creatingNewCms) return ['Website CMS', 'Create New Page'];
      if (activeEditingCmsPage) return ['Website CMS', activeEditingCmsPage.navTitle];
      return ['Website CMS'];
    }
    if (activeSection === 'users') {
      return activeManagedUser
        ? ['Users & Clients', activeManagedUser.name]
        : ['Users & Clients'];
    }
    const found = ADMIN_NAV_ITEMS.find((i) => i.id === activeSection);
    return [found?.label || 'Overview'];
  })();

  const ticketClientRecord = selectedSupportTicket
    ? users.find(
        (u) => u.email.toLowerCase() === selectedSupportTicket.clientEmail.toLowerCase()
      )
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col lg:flex-row">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Fixed Upmind Sidebar Rail (264px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] bg-[#0F172A] text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col min-h-0 flex-1 overflow-y-auto">
          {/* Brand Wordmark */}
          <div className="flex items-center justify-between gap-2 px-2 pb-4 mb-4 border-b border-slate-800">
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigateAdmin('overview');
              }}
              className="inline-flex items-center gap-2.5 text-white whitespace-nowrap"
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
              <span className="font-display text-base font-bold tracking-tight">
                cpcloudhost.com
              </span>
            </a>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Admin workspace navigation" className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const badgeCount =
                item.id === 'tickets'
                  ? metrics.openTicketsCount
                  : item.id === 'cms'
                  ? cmsPages.length
                  : item.id === 'users'
                  ? users.length
                  : item.id === 'orders'
                  ? orders.length
                  : item.id === 'abuse'
                  ? metrics.openAbuseCount
                  : null;

              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateAdmin(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0E6B63] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                      aria-hidden={true}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badgeCount !== null && (
                    <span
                      className={`font-mono-num text-[11px] font-semibold ${
                        isActive
                          ? 'text-emerald-100'
                          : item.id === 'tickets' && metrics.openTicketsCount > 0
                          ? 'text-amber-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Connected Workspace Shortcuts */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-1">
            <p className="px-3 pb-1 text-[11px] font-medium text-slate-500">
              Connected Views
            </p>
            <button
              type="button"
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>Client Dashboard</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>Public Website</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Bottom Operator Identity & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0E6B63] text-white font-display text-xs font-bold flex items-center justify-center shrink-0">
              {initials || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              onSignedOut();
            }}
            className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-300 border border-slate-700 hover:border-red-500/60 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Standalone Operations Viewport (No Site Header / No Site Footer) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean Contextual SaaS Top Toolbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
              <button
                type="button"
                onClick={() => navigateAdmin('overview')}
                className="text-slate-500 hover:text-[#0E6B63] font-medium whitespace-nowrap cursor-pointer"
              >
                Admin
              </button>
              {breadcrumbTrail.map((crumb, idx) => (
                <React.Fragment key={`${crumb}-${idx}`}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span
                    className={`truncate ${
                      idx === breadcrumbTrail.length - 1
                        ? 'font-display font-bold text-[#0F172A]'
                        : 'text-slate-500 font-medium'
                    }`}
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right Contextual Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {toastMsg && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{toastMsg}</span>
              </span>
            )}

            <span className="hidden sm:inline-block text-xs font-mono text-slate-500">
              {currency.code}
            </span>

            {activeSection === 'cms' && !creatingNewCms && !editingCmsId && (
              <button
                type="button"
                onClick={() => navigateAdmin('cms', { newCms: true })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Create New Page</span>
              </button>
            )}

            {activeSection === 'users' && !activeManagedUser && (
              <button
                type="button"
                onClick={() => setShowCreateUser((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{showCreateUser ? 'Close Form' : 'New Client Account'}</span>
              </button>
            )}

            {activeSection === 'orders' && ordersBillingSubTab === 'orders' && (
              <button
                type="button"
                onClick={() => setShowCreateOrder((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{showCreateOrder ? 'Close Form' : 'Provision Order'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1440px] w-full">
          {/* Mobile toast banner */}
          {toastMsg && (
            <div className="md:hidden flex items-center gap-2 text-xs font-semibold text-[#16A34A] bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* ==================== OVERVIEW SECTION ==================== */}
          {activeSection === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => navigateAdmin('tickets')}
                  className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Active Support Tickets</span>
                    <LifeBuoy className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  </div>
                  <p className="font-mono font-bold text-2xl text-[#0F172A] tabular-nums mt-2">
                    {metrics.openTicketsCount}{' '}
                    <span className="text-sm font-normal text-slate-400">
                      / {tickets.length}
                    </span>
                  </p>
                  <p className="text-xs text-[#0E6B63] font-medium mt-1">
                    Open &amp; pending client requests
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateAdmin('cms')}
                  className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Website CMS Pages</span>
                    <Globe className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  </div>
                  <p className="font-mono font-bold text-2xl text-[#0F172A] tabular-nums mt-2">
                    {metrics.publishedPagesCount}{' '}
                    <span className="text-sm font-normal text-slate-400">
                      / {cmsPages.length}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Published pages live on storefront
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateAdmin('users')}
                  className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Active Client Accounts</span>
                    <Users className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  </div>
                  <p className="font-mono font-bold text-2xl text-[#0F172A] tabular-nums mt-2">
                    {metrics.activeUsersCount}{' '}
                    <span className="text-sm font-normal text-slate-400">
                      / {users.length}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Clients, Resellers &amp; Support PINs
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateAdmin('orders')}
                  className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/50 rounded-xl p-5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Order Revenue Volume</span>
                    <CreditCard className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                  </div>
                  <p className="font-mono font-bold text-2xl text-[#0F172A] tabular-nums mt-2">
                    {formatPrice(metrics.activeOrderRevenue)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {metrics.pendingOrdersCount} pending provisioning
                  </p>
                </button>
              </div>

              {/* Dual Live Connected Queues */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Support Tickets Queue */}
                <div className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                    <h2 className="font-display text-sm font-bold text-[#0F172A]">
                      Recent Support Tickets (Live with Client Dashboard)
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateAdmin('tickets')}
                      className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                    >
                      Open Ticket Desk
                    </button>
                  </div>
                  <div className="divide-y divide-[#E2E8F0]">
                    {tickets.slice(0, 5).map((tkt) => {
                      const st = getTicketStatusMeta(tkt.status);
                      return (
                        <div
                          key={tkt.id}
                          className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F8FAFC]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-[#0E6B63]">
                                {tkt.id}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-600 font-medium">
                                {tkt.department}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 truncate">
                                {tkt.clientName}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-[#0F172A] truncate mt-0.5">
                              {tkt.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusTextBadge tone={st.tone} label={st.label} />
                            <button
                              type="button"
                              onClick={() => navigateAdmin('tickets', { ticketId: tkt.id })}
                              className="px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Website CMS Pages */}
                <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                    <h2 className="font-display text-sm font-bold text-[#0F172A]">
                      Website Pages Quick Editor
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateAdmin('cms')}
                      className="text-xs font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                    >
                      Manage All Pages
                    </button>
                  </div>
                  <div className="divide-y divide-[#E2E8F0]">
                    {cmsPages.slice(0, 6).map((pg) => (
                      <div
                        key={pg.id}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#F8FAFC]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0F172A] truncate">
                            {pg.navTitle}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500 truncate">
                            {pg.slug}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateAdmin('cms', { cmsPageId: pg.id })}
                          className="px-3 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg shrink-0 cursor-pointer"
                        >
                          Edit Content
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== SUPPORT TICKETS DESK ==================== */}
          {activeSection === 'tickets' && !selectedSupportTicket && (
            <div className="space-y-5">
              {/* Ticket Queue KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-xs text-slate-500">All Tickets</p>
                  <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
                    {tickets.length}
                  </p>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-xs text-slate-500">Open (Awaiting Staff)</p>
                  <p className="font-mono text-2xl font-bold text-[#0E6B63] tabular-nums mt-1">
                    {tickets.filter((t) => t.status === 'open').length}
                  </p>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-xs text-slate-500">Pending Client Reply</p>
                  <p className="font-mono text-2xl font-bold text-[#D97706] tabular-nums mt-1">
                    {tickets.filter((t) => t.status === 'pending').length}
                  </p>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <p className="text-xs text-slate-500">Resolved</p>
                  <p className="font-mono text-2xl font-bold text-[#16A34A] tabular-nums mt-1">
                    {tickets.filter((t) => t.status === 'resolved').length}
                  </p>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search Ticket #, client name, email, Support PIN, or service..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter by department"
                    value={ticketDeptFilter}
                    onChange={(e) =>
                      setTicketDeptFilter(e.target.value as 'all' | TicketDepartment)
                    }
                    className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {TICKET_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['all', 'open', 'pending', 'resolved'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTicketStatusFilter(st)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                          ticketStatusFilter === st
                            ? 'bg-white text-[#0F172A] shadow-sm'
                            : 'text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tickets Directory Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                        <th className="py-3 px-4">Ticket #</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Subject &amp; Service</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Updated</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs">
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            No support tickets match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((tkt) => {
                          const st = getTicketStatusMeta(tkt.status);
                          const attachmentTotal = tkt.messages.reduce(
                            (acc, m) => acc + (m.attachments?.length ?? 0),
                            0
                          );
                          return (
                            <tr
                              key={tkt.id}
                              onClick={() =>
                                navigateAdmin('tickets', { ticketId: tkt.id })
                              }
                              className="hover:bg-[#F8FAFC] cursor-pointer"
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-[#0E6B63] whitespace-nowrap">
                                {tkt.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-[#0F172A] block">
                                  {tkt.clientName}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {tkt.clientEmail}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 max-w-[300px]">
                                <span className="font-semibold text-[#0F172A] block truncate">
                                  {tkt.subject}
                                </span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>{tkt.relatedService || 'General Account'}</span>
                                  {attachmentTotal > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[#0E6B63] font-medium">
                                      <Paperclip className="w-3 h-3" aria-hidden="true" />
                                      <span>{attachmentTotal}</span>
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                                {tkt.department}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-[#0F172A] whitespace-nowrap">
                                {tkt.priority}
                              </td>
                              <td className="py-3.5 px-4">
                                <StatusTextBadge tone={st.tone} label={st.label} />
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {tkt.updatedAtUtc}
                              </td>
                              <td
                                className="py-3.5 px-4 text-right whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateAdmin('tickets', { ticketId: tkt.id })
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors cursor-pointer"
                                >
                                  <span>View</span>
                                </button>
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
          )}

          {/* ==================== DEDICATED TICKET DETAIL VIEW (/admin/tickets/:id) ==================== */}
          {activeSection === 'tickets' && selectedSupportTicket && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigateAdmin('tickets')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E6B63] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Back to Support Tickets</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>{selectedSupportTicket.id}</span>
                  <span>·</span>
                  <span>Updated {selectedSupportTicket.updatedAtUtc}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Conversation Thread & Staff Composer */}
                <div className="xl:col-span-8 space-y-5">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                          <span className="font-mono font-bold text-[#0E6B63]">
                            {selectedSupportTicket.id}
                          </span>
                          <span>·</span>
                          <span>{selectedSupportTicket.department}</span>
                          <span>·</span>
                          <span>{selectedSupportTicket.priority} Priority</span>
                        </div>
                        <h1 className="font-display text-xl font-bold text-[#0F172A]">
                          {selectedSupportTicket.subject}
                        </h1>
                      </div>
                      <StatusTextBadge
                        tone={getTicketStatusMeta(selectedSupportTicket.status).tone}
                        label={getTicketStatusMeta(selectedSupportTicket.status).label}
                      />
                    </div>

                    {/* Messages */}
                    <div className="mt-5 space-y-4">
                      {selectedSupportTicket.messages.map((msg) => {
                        const isStaff = msg.authorRole === 'support';
                        return (
                          <div
                            key={msg.id}
                            className={`rounded-xl border p-4 sm:p-5 ${
                              isStaff
                                ? 'bg-[#F2FAF8]/70 border-[#0E6B63]/25'
                                : 'bg-[#F8FAFC] border-[#E2E8F0]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2.5 border-b border-slate-200/70">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#0F172A]">
                                  {msg.authorName}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span
                                  className={`font-medium ${
                                    isStaff ? 'text-[#0E6B63]' : 'text-slate-600'
                                  }`}
                                >
                                  {isStaff ? 'Official Support Staff' : 'Client'}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">
                                {msg.timestampUtc}
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-[#0F172A] leading-relaxed whitespace-pre-line">
                              {msg.body}
                            </p>

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {msg.attachments.map((att) => {
                                  const isImg = att.mimeType.startsWith('image/');
                                  const isZoomed = Boolean(expandedImageIds[att.id]);
                                  return (
                                    <div
                                      key={att.id}
                                      className="bg-white border border-[#E2E8F0] rounded-xl p-2.5 space-y-2"
                                    >
                                      {isImg ? (
                                        <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                          <img
                                            src={att.dataUrl}
                                            alt={att.name}
                                            className={`w-full object-contain transition-all ${
                                              isZoomed ? 'max-h-[460px]' : 'max-h-40'
                                            }`}
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2.5 py-2 px-2 bg-slate-50 rounded-lg">
                                          <FileText
                                            className="w-4 h-4 text-[#0E6B63] shrink-0"
                                            aria-hidden="true"
                                          />
                                          <span className="text-xs font-medium text-[#0F172A] truncate">
                                            {att.name}
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                        <span className="truncate font-mono">
                                          {att.name} ({formatFileSize(att.sizeBytes)})
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {isImg && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedImageIds((prev) => ({
                                                  ...prev,
                                                  [att.id]: !prev[att.id],
                                                }))
                                              }
                                              className="p-1 text-slate-500 hover:text-[#0E6B63] cursor-pointer"
                                              aria-label={isZoomed ? 'Collapse image' : 'Expand image'}
                                            >
                                              {isZoomed ? (
                                                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                                              ) : (
                                                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                                              )}
                                            </button>
                                          )}
                                          <a
                                            href={att.dataUrl}
                                            download={att.name}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#E2E8F0] hover:border-[#0E6B63] text-[#0F172A] font-semibold"
                                          >
                                            <Download className="w-3 h-3" aria-hidden="true" />
                                            <span>Save</span>
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff Reply Composer */}
                  <form
                    onSubmit={handleStaffReplySubmit}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-sm font-bold text-[#0F172A]">
                        Post Official Support Staff Response
                      </h2>

                      <select
                        aria-label="Ticket status after reply"
                        value={staffReplyStatus}
                        onChange={(e) =>
                          setStaffReplyStatus(e.target.value as TicketStatus)
                        }
                        className="px-3 py-1.5 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                      >
                        <option value="pending">Set Status: Pending Client</option>
                        <option value="open">Keep Status: Open</option>
                        <option value="resolved">Set Status: Resolved</option>
                      </select>
                    </div>

                    <textarea
                      rows={4}
                      value={staffReplyBody}
                      onChange={(e) => {
                        setStaffReplyBody(e.target.value);
                        if (staffReplyError) setStaffReplyError('');
                      }}
                      placeholder="Write technical resolution notes or instructions for the client (updates Client Dashboard immediately)..."
                      className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                    />

                    {/* File & Screenshot Upload */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        void handleStaffAttachFiles(e.dataTransfer.files);
                      }}
                      className="border border-dashed border-[#CBD5E1] rounded-xl p-4 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="text-xs text-slate-600">
                        <p className="font-semibold text-[#0F172A]">
                          Attach screenshot, log file, or PDF report
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Up to 4 files (max 2 MB each) · Drag &amp; drop or choose file
                        </p>
                      </div>
                      <input
                        ref={replyFileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_ATTACHMENT_TYPES}
                        onChange={(e) => {
                          void handleStaffAttachFiles(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => replyFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                        <span>Attach Files / Images</span>
                      </button>
                    </div>

                    {staffAttachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {staffAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {att.mimeType.startsWith('image/') ? (
                                <ImageIcon className="w-4 h-4 text-[#0E6B63] shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#0E6B63] shrink-0" />
                              )}
                              <span className="truncate font-medium text-[#0F172A]">
                                {att.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setStaffAttachments((prev) =>
                                  prev.filter((item) => item.id !== att.id)
                                )
                              }
                              className="p-1 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                              aria-label={`Remove ${att.name}`}
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(staffAttachWarning || staffReplyError) && (
                      <p className="text-xs font-semibold text-[#DC2626]">
                        {staffReplyError || staffAttachWarning}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>Send Staff Response</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Governance Controls */}
                <aside className="xl:col-span-4 space-y-5">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                    <h2 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                      Ticket Routing &amp; SLA Controls
                    </h2>

                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="admin-ticket-status"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Live Ticket Status
                        </label>
                        <select
                          id="admin-ticket-status"
                          value={selectedSupportTicket.status}
                          onChange={(e) => {
                            const val = e.target.value as TicketStatus;
                            updateTicketByAdmin(selectedSupportTicket.id, { status: val });
                            showToast(`Ticket status changed to ${val}`);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="admin-ticket-dept"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Department
                        </label>
                        <select
                          id="admin-ticket-dept"
                          value={selectedSupportTicket.department}
                          onChange={(e) => {
                            const val = e.target.value as TicketDepartment;
                            updateTicketByAdmin(selectedSupportTicket.id, { department: val });
                            showToast(`Assigned to ${val}`);
                          }}
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                        >
                          {TICKET_DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="admin-ticket-priority"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Priority Level
                        </label>
                        <select
                          id="admin-ticket-priority"
                          value={selectedSupportTicket.priority}
                          onChange={(e) => {
                            const val = e.target.value as TicketPriority;
                            updateTicketByAdmin(selectedSupportTicket.id, { priority: val });
                            showToast(`Priority set to ${val}`);
                          }}
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3 text-xs">
                    <h2 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                      Client Verification Profile
                    </h2>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Client Name</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedSupportTicket.clientName}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Client Email</span>
                      <span className="font-mono text-[#0F172A] truncate">
                        {selectedSupportTicket.clientEmail}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Target Service</span>
                      <span className="font-mono text-[#0E6B63]">
                        {selectedSupportTicket.relatedService || 'General Account'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Support PIN Used</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {selectedSupportTicket.supportPinUsed || '—'}
                      </span>
                    </div>
                    {ticketClientRecord?.supportPin?.pin && (
                      <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Current Permanent PIN</span>
                        <span className="font-mono font-bold text-[#16A34A]">
                          {ticketClientRecord.supportPin.pin}
                        </span>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ==================== WEBSITE CMS DIRECTORY ==================== */}
          {activeSection === 'cms' && !creatingNewCms && !activeEditingCmsPage && (
            <div className="space-y-6">
              {/* Global Site Settings Panel */}
              <form
                onSubmit={handleSaveGlobalSiteSettings}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="font-display text-sm font-bold text-[#0F172A]">
                      Global Site Announcement &amp; Footer Settings
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Changes publish immediately to the live header banner and website footer.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={siteAnnouncementEnabled}
                      onChange={(e) => setSiteAnnouncementEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-[#0E6B63]"
                    />
                    <span>Show Top Announcement Bar</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Announcement Banner Message
                    </label>
                    <input
                      type="text"
                      value={siteAnnouncementText}
                      onChange={(e) => setSiteAnnouncementText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CTA Label
                      </label>
                      <input
                        type="text"
                        value={siteAnnouncementCtaText}
                        onChange={(e) => setSiteAnnouncementCtaText(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CTA URL
                      </label>
                      <input
                        type="text"
                        value={siteAnnouncementCtaUrl}
                        onChange={(e) => setSiteAnnouncementCtaUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Support Email
                    </label>
                    <input
                      type="email"
                      value={siteSupportEmail}
                      onChange={(e) => setSiteSupportEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Footer Brand Description
                    </label>
                    <input
                      type="text"
                      value={siteFooterTagline}
                      onChange={(e) => setSiteFooterTagline(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Footer Copyright Line
                    </label>
                    <input
                      type="text"
                      value={siteFooterCopyright}
                      onChange={(e) => setSiteFooterCopyright(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save Global Settings</span>
                  </button>
                </div>
              </form>

              {/* Pages Filter Bar */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={cmsSearch}
                    onChange={(e) => setCmsSearch(e.target.value)}
                    placeholder="Search website page title, /slug, or headline..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      'all',
                      'Home & Core',
                      'Hosting & Cloud',
                      'Domains & Support',
                      'Legal & Policy',
                      'Custom Page',
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCmsCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        cmsCategoryFilter === cat
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {cat === 'all' ? 'All Pages' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Website Pages Directory */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                        <th className="py-3 px-4">Page Title &amp; Headline</th>
                        <th className="py-3 px-4">URL Slug</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Last Modified</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs">
                      {filteredCmsPages.map((pg) => (
                        <tr key={pg.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3.5 px-4 max-w-[320px]">
                            <span className="font-semibold text-[#0F172A] block">
                              {pg.navTitle}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                              {pg.heroTitle}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#0E6B63] whitespace-nowrap">
                            {pg.slug}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {pg.category}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusTextBadge
                              tone={pg.status === 'published' ? 'emerald' : 'amber'}
                              label={pg.status === 'published' ? 'Published' : 'Draft'}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            <span className="font-mono text-[11px] block">
                              {pg.updatedAtUtc}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {pg.updatedBy}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={() => onPreviewPublicPath(pg.slug)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-[#E2E8F0] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                              <span>Live</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => navigateAdmin('cms', { cmsPageId: pg.id })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                            >
                              <span>Edit Page</span>
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

          {/* ==================== CMS PAGE EDITOR & CREATOR (/admin/cms/new or /admin/cms/:id) ==================== */}
          {activeSection === 'cms' && (creatingNewCms || activeEditingCmsPage) && (
            <form onSubmit={handleSaveCmsEditor} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigateAdmin('cms')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0E6B63] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Back to Website Pages</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {activeEditingCmsPage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onPreviewPublicPath(activeEditingCmsPage.slug)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>View Live ({activeEditingCmsPage.slug})</span>
                      </button>

                      {activeEditingCmsPage.isSystemPage ? (
                        <button
                          type="button"
                          onClick={() => {
                            resetSystemCmsPage(activeEditingCmsPage.id);
                            showToast('Restored default copy');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#CBD5E1] hover:border-amber-500 hover:text-amber-700 rounded-lg cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reset Defaults</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const res = deleteCmsPage(activeEditingCmsPage.id);
                            if (res.ok) {
                              showToast('Custom page deleted');
                              navigateAdmin('cms');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#DC2626] bg-white border border-red-200 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete Page</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{creatingNewCms ? 'Publish New Page' : 'Save Page Changes'}</span>
                  </button>
                </div>
              </div>

              {cmsEditorError && (
                <div className="bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold rounded-xl px-4 py-3">
                  {cmsEditorError}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Main Content Editor */}
                <div className="xl:col-span-8 space-y-5">
                  {/* Hero Content */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
                    <h2 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                      Hero &amp; Primary Page Content
                    </h2>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hero Eyebrow / Top Badge
                      </label>
                      <input
                        type="text"
                        value={draftHeroBadge}
                        onChange={(e) => setDraftHeroBadge(e.target.value)}
                        placeholder="e.g., StackCP & cPanel Cloud Platform"
                        className="w-full px-3.5 py-2 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Main H1 Headline *
                      </label>
                      <input
                        type="text"
                        value={draftHeroTitle}
                        onChange={(e) => setDraftHeroTitle(e.target.value)}
                        placeholder="Enter main H1 page headline"
                        className="w-full px-3.5 py-2.5 text-sm font-semibold border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hero Subtitle / Lead Paragraph
                      </label>
                      <textarea
                        rows={4}
                        value={draftHeroSubtitle}
                        onChange={(e) => setDraftHeroSubtitle(e.target.value)}
                        placeholder="Enter descriptive lead copy shown under the headline..."
                        className="w-full px-3.5 py-2.5 text-sm border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Primary Button Label
                        </label>
                        <input
                          type="text"
                          value={draftPrimaryCtaText}
                          onChange={(e) => setDraftPrimaryCtaText(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Primary Button URL / Anchor
                        </label>
                        <input
                          type="text"
                          value={draftPrimaryCtaUrl}
                          onChange={(e) => setDraftPrimaryCtaUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Secondary Button Label
                        </label>
                        <input
                          type="text"
                          value={draftSecondaryCtaText}
                          onChange={(e) => setDraftSecondaryCtaText(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Secondary Button URL / Anchor
                        </label>
                        <input
                          type="text"
                          value={draftSecondaryCtaUrl}
                          onChange={(e) => setDraftSecondaryCtaUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-sm font-bold text-[#0F172A]">
                          Hero Feature Checkpoints
                        </h2>
                        <p className="text-xs text-slate-500">
                          Bullet highlights displayed on Home Hero &amp; custom CMS pages.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraftHighlights((prev) => [...prev, ''])}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add Bullet</span>
                      </button>
                    </div>

                    {draftHighlights.length === 0 ? (
                      <p className="text-xs text-slate-400">No highlight bullets added.</p>
                    ) : (
                      <div className="space-y-2">
                        {draftHighlights.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) =>
                                setDraftHighlights((prev) =>
                                  prev.map((v, i) => (i === idx ? e.target.value : v))
                                )
                              }
                              placeholder="Enter feature highlight..."
                              className="flex-1 px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftHighlights((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              aria-label="Remove bullet"
                              className="p-2 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional / Body Sections */}
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-sm font-bold text-[#0F172A]">
                          Content Sections ({draftSections.length})
                        </h2>
                        <p className="text-xs text-slate-500">
                          Add promotional banners or custom content blocks directly onto this page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftSections((prev) => [
                            ...prev,
                            {
                              id: `sec-${Date.now().toString(36)}`,
                              heading: '',
                              body: '',
                              ctaText: '',
                              ctaUrl: '',
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    {draftSections.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No extra sections added to this page yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {draftSections.map((sec, idx) => (
                          <div
                            key={sec.id}
                            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-semibold text-[#0E6B63]">
                                Section #{idx + 1}{' '}
                                {sec.id === 'switch-credits' ? '(Switch Credits Banner)' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftSections((prev) =>
                                    prev.filter((item) => item.id !== sec.id)
                                  )
                                }
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                                <span>Remove</span>
                              </button>
                            </div>

                            <input
                              type="text"
                              value={sec.heading}
                              onChange={(e) =>
                                setDraftSections((prev) =>
                                  prev.map((item) =>
                                    item.id === sec.id
                                      ? { ...item, heading: e.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Section heading..."
                              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg"
                            />
                            <textarea
                              rows={3}
                              value={sec.body}
                              onChange={(e) =>
                                setDraftSections((prev) =>
                                  prev.map((item) =>
                                    item.id === sec.id
                                      ? { ...item, body: e.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Section body content..."
                              className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                value={sec.ctaText || ''}
                                onChange={(e) =>
                                  setDraftSections((prev) =>
                                    prev.map((item) =>
                                      item.id === sec.id
                                        ? { ...item, ctaText: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                placeholder="Optional button text"
                                className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                              />
                              <input
                                type="text"
                                value={sec.ctaUrl || ''}
                                onChange={(e) =>
                                  setDraftSections((prev) =>
                                    prev.map((item) =>
                                      item.id === sec.id
                                        ? { ...item, ctaUrl: e.target.value }
                                        : item
                                    )
                                  )
                                }
                                placeholder="Optional button URL (/shared-hosting)"
                                className="px-3 py-1.5 text-xs font-mono bg-white border border-[#CBD5E1] rounded-lg"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FAQ Accordion Items (Always shown for Home & Custom Pages) */}
                  {(creatingNewCms ||
                    activeEditingCmsPage?.id === 'home' ||
                    !activeEditingCmsPage?.isSystemPage ||
                    draftFaqItems.length > 0) && (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display text-sm font-bold text-[#0F172A]">
                            FAQ Accordion Entries ({draftFaqItems.length})
                          </h2>
                          <p className="text-xs text-slate-500">
                            Manage expandable questions &amp; answers on this page.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftFaqItems((prev) => [
                              ...prev,
                              { question: '', answer: '' },
                            ])
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Add FAQ</span>
                        </button>
                      </div>

                      {draftFaqItems.map((faq, idx) => (
                        <div
                          key={idx}
                          className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-500">
                              Q{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftFaqItems((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-xs text-[#DC2626] hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) =>
                              setDraftFaqItems((prev) =>
                                prev.map((f, i) =>
                                  i === idx ? { ...f, question: e.target.value } : f
                                )
                              )
                            }
                            placeholder="Question..."
                            className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg"
                          />
                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) =>
                              setDraftFaqItems((prev) =>
                                prev.map((f, i) =>
                                  i === idx ? { ...f, answer: e.target.value } : f
                                )
                              )
                            }
                            placeholder="Answer..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Routing & SEO Metadata Sidebar */}
                <aside className="xl:col-span-4 space-y-5">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                    <h2 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                      Publishing &amp; Routing
                    </h2>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Navigation Page Title *
                      </label>
                      <input
                        type="text"
                        value={draftNavTitle}
                        onChange={(e) => {
                          setDraftNavTitle(e.target.value);
                          if (creatingNewCms && (!draftSlug || draftSlug === '/')) {
                            const auto = e.target.value
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-+|-+$/g, '');
                            if (auto) setDraftSlug(`/${auto}`);
                          }
                        }}
                        placeholder="e.g., Enterprise SLA"
                        className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(activeEditingCmsPage?.isSystemPage)}
                        value={draftSlug}
                        onChange={(e) => setDraftSlug(e.target.value)}
                        placeholder="/enterprise-sla"
                        className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg disabled:bg-slate-50 disabled:text-slate-500"
                      />
                      {activeEditingCmsPage?.isSystemPage && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Core system route URLs remain locked to preserve navigation integrity.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Status
                        </label>
                        <select
                          value={draftStatus}
                          onChange={(e) =>
                            setDraftStatus(e.target.value as 'published' | 'draft')
                          }
                          className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Category
                        </label>
                        <select
                          disabled={Boolean(activeEditingCmsPage?.isSystemPage)}
                          value={draftCategory}
                          onChange={(e) =>
                            setDraftCategory(e.target.value as CmsPageCategory)
                          }
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white disabled:bg-slate-50"
                        >
                          <option value="Custom Page">Custom Page</option>
                          <option value="Hosting & Cloud">Hosting &amp; Cloud</option>
                          <option value="Domains & Support">Domains &amp; Support</option>
                          <option value="Legal & Policy">Legal &amp; Policy</option>
                          <option value="Home & Core">Home &amp; Core</option>
                        </select>
                      </div>
                    </div>

                    {(creatingNewCms || !activeEditingCmsPage?.isSystemPage) && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftShowInHeader}
                            onChange={(e) => setDraftShowInHeader(e.target.checked)}
                            className="rounded border-slate-300 text-[#0E6B63]"
                          />
                          <span>Show link in Header Resources menu</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftShowInFooter}
                            onChange={(e) => setDraftShowInFooter(e.target.checked)}
                            className="rounded border-slate-300 text-[#0E6B63]"
                          />
                          <span>Show link in Website Footer</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3.5">
                    <h2 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                      Search Engine (SEO) Metadata
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={draftSeoTitle}
                        onChange={(e) => setDraftSeoTitle(e.target.value)}
                        placeholder="SEO Page Title | cpcloudhost.com"
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        rows={3}
                        value={draftSeoDescription}
                        onChange={(e) => setDraftSeoDescription(e.target.value)}
                        placeholder="Concise summary for Google search cards & social previews..."
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                      />
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          )}

          {/* ==================== USERS MANAGEMENT (/admin/users & /admin/users/:id) ==================== */}
          {activeSection === 'users' && activeManagedUser && (
            <AdminClientManageView
              user={activeManagedUser}
              onBackToUsers={() => navigateAdmin('users')}
              onOpenTicket={(ticketId) =>
                navigateAdmin('tickets', { ticketId })
              }
              onClientPortalLogin={onOpenDashboard}
              onShowToast={showToast}
            />
          )}

          {activeSection === 'users' && !activeManagedUser && (
            <div className="space-y-5">
              {showCreateUser && (
                <form
                  onSubmit={handleCreateUserSubmit}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
                >
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    Provision New User / Client Account
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Full Name *"
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="client@domain.com *"
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <input
                      type="text"
                      value={newUserCompany}
                      onChange={(e) => setNewUserCompany(e.target.value)}
                      placeholder="Company Name"
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <input
                      type="text"
                      value={newUserCountry}
                      onChange={(e) => setNewUserCountry(e.target.value)}
                      placeholder="Country"
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63]"
                    >
                      <option value="client">Role: Client</option>
                      <option value="reseller">Role: Reseller</option>
                      <option value="admin">Role: Admin</option>
                    </select>
                  </div>
                  {createUserError && (
                    <p className="text-xs font-semibold text-[#DC2626]">
                      {createUserError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateUser(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                    >
                      Create User Account
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user ID, username, name, email, or country..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) =>
                      setUserRoleFilter(e.target.value as 'all' | UserRole)
                    }
                    className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="client">Client</option>
                    <option value="reseller">Reseller</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) =>
                      setUserStatusFilter(
                        e.target.value as 'all' | UserAccountStatus
                      )
                    }
                    className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending_kyc">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                        <th className="py-3 px-4">Account Holder</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Security (2FA &amp; PIN)</th>
                        <th className="py-3 px-4 text-right">Services</th>
                        <th className="py-3 px-4 text-right">Spend</th>
                        <th className="py-3 px-4">KYC &amp; Status</th>
                        <th className="py-3 px-4 text-right">Client Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-500">
                            No user accounts match the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelf = currentUser.id === user.id;
                          const pinVisible = Boolean(revealedPins[user.id]);
                          return (
                            <tr key={user.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateAdmin('users', { userId: user.id })
                                  }
                                  className="text-left group cursor-pointer"
                                >
                                  <span className="font-semibold text-[#0F172A] group-hover:text-[#0E6B63] block">
                                    {user.name}{' '}
                                    <span className="font-mono text-[10px] text-slate-400">
                                      ({user.id})
                                    </span>
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-500 block">
                                    {user.email}
                                    {user.username ? ` · @${user.username}` : ''}
                                  </span>
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  aria-label={`Change role for ${user.email}`}
                                  disabled={isSelf}
                                  value={user.role}
                                  onChange={(e) =>
                                    updateUserRole(user.id, e.target.value as UserRole)
                                  }
                                  className="px-2 py-1 text-xs border border-[#E2E8F0] rounded bg-white disabled:opacity-60 cursor-pointer"
                                >
                                  <option value="client">Client</option>
                                  <option value="reseller">Reseller</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[11px] font-semibold ${
                                      user.twoFactorEnabled
                                        ? 'text-[#16A34A]'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {user.twoFactorEnabled ? '2FA On' : '2FA Off'}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="font-mono text-[11px] text-[#0F172A]">
                                    PIN:{' '}
                                    {user.supportPin?.pin
                                      ? pinVisible
                                        ? user.supportPin.pin
                                        : '••••••'
                                      : 'Auto'}
                                  </span>
                                  {user.supportPin?.pin && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRevealedPins((prev) => ({
                                          ...prev,
                                          [user.id]: !prev[user.id],
                                        }))
                                      }
                                      aria-label="Toggle Support PIN visibility"
                                      className="p-0.5 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                                    >
                                      {pinVisible ? (
                                        <EyeOff className="w-3 h-3" aria-hidden="true" />
                                      ) : (
                                        <Eye className="w-3 h-3" aria-hidden="true" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = adminResetUserSupportPin(user.id);
                                      if (res) {
                                        setRevealedPins((prev) => ({
                                          ...prev,
                                          [user.id]: true,
                                        }));
                                        showToast(`Permanent PIN updated for ${user.name}`);
                                      }
                                    }}
                                    title="Reset Permanent Support PIN"
                                    className="text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                                  >
                                    Reset PIN
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-[#0F172A]">
                                {user.activeServices}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A]">
                                {formatPrice(user.totalSpendUsd)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <StatusTextBadge
                                    tone={getUserTone(user.status)}
                                    label={
                                      user.status === 'pending_kyc'
                                        ? 'PENDING'
                                        : user.status.toUpperCase()
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => toggleUserKyc(user.id)}
                                    className={`text-[11px] font-semibold cursor-pointer ${
                                      user.kycVerified
                                        ? 'text-[#16A34A]'
                                        : 'text-slate-400 hover:text-[#0E6B63]'
                                    }`}
                                  >
                                    {user.kycVerified ? 'KYC OK' : 'Verify'}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateAdmin('users', { userId: user.id })
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                                >
                                  <span>Manage</span>
                                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                                </button>
                                {user.status !== 'active' ? (
                                  <button
                                    type="button"
                                    onClick={() => updateUserStatus(user.id, 'active')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#16A34A] border border-[#16A34A]/30 hover:bg-[#16A34A]/10 rounded-lg cursor-pointer"
                                  >
                                    <UserCheck className="w-3 h-3" aria-hidden="true" />
                                    <span>Activate</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isSelf}
                                    onClick={() => updateUserStatus(user.id, 'suspended')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#DC2626] border border-[#DC2626]/30 hover:bg-red-50 rounded-lg disabled:opacity-40 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3" aria-hidden="true" />
                                    <span>Suspend</span>
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
          )}

          {/* ==================== ORDERS & BILLING MANAGEMENT ==================== */}
          {activeSection === 'orders' && (
            <div className="space-y-5">
              {/* Sub-Navigation Tabs: Orders Queue | Invoices Manager & Editor | Invoice Template */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-px">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(
                    [
                      { id: 'orders', label: 'Orders Queue' },
                      { id: 'invoices', label: 'Invoices & Full Editor' },
                      { id: 'template', label: 'Invoice Template & PDF' },
                    ] as const
                  ).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setOrdersBillingSubTab(sub.id)}
                      className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        ordersBillingSubTab === sub.id
                          ? 'border-[#0E6B63] text-[#0E6B63]'
                          : 'border-transparent text-slate-500 hover:text-[#0F172A]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {ordersBillingSubTab === 'invoices' && (
                <AdminBillingInvoicesView mode="invoices" onShowToast={showToast} />
              )}

              {ordersBillingSubTab === 'template' && (
                <AdminBillingInvoicesView mode="template" onShowToast={showToast} />
              )}

              {ordersBillingSubTab === 'orders' && (
                <>
              {lastApprovedInvoiceNotice && (
                <div className="bg-[#F2FAF8] border border-[#0E6B63]/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0E6B63] text-white flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="text-xs">
                      <p className="font-display font-bold text-[#0F172A]">
                        Automated Invoice {lastApprovedInvoiceNotice.createdNew ? 'Generated' : 'Finalized'}:{' '}
                        <span className="font-mono text-[#0E6B63]">
                          {lastApprovedInvoiceNotice.invoice.id}
                        </span>{' '}
                        ({lastApprovedInvoiceNotice.invoice.status.toUpperCase()})
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Order <span className="font-mono font-semibold">{lastApprovedInvoiceNotice.orderId}</span> approved on{' '}
                        <strong>{lastApprovedInvoiceNotice.serverName}</strong> · Total{' '}
                        <span className="font-mono font-bold text-[#0F172A]">
                          {formatPrice(lastApprovedInvoiceNotice.invoice.amountUsd)}
                        </span>{' '}
                        · Available in Client Dashboard for PDF download.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        downloadInvoicePdf(
                          lastApprovedInvoiceNotice.invoice,
                          invoiceTemplateConfig,
                          paymentMethods,
                          {
                            code: currency.code,
                            formattedTotal: formatPrice(lastApprovedInvoiceNotice.invoice.amountUsd),
                          }
                        );
                        showToast(`Downloaded ${lastApprovedInvoiceNotice.invoice.id}.pdf`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrdersBillingSubTab('invoices')}
                      className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] whitespace-nowrap cursor-pointer"
                    >
                      Open Invoices
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastApprovedInvoiceNotice(null)}
                      aria-label="Dismiss automated invoice notification"
                      className="p-1 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {showCreateOrder && (
                <form
                  onSubmit={handleCreateOrderSubmit}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
                >
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    Provision Manual Hosting / VPS / Domain Order
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input
                      type="email"
                      value={newOrderEmail}
                      onChange={(e) => setNewOrderEmail(e.target.value)}
                      placeholder="Client Email *"
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <select
                      value={newOrderType}
                      onChange={(e) =>
                        setNewOrderType(e.target.value as PlatformOrder['productType'])
                      }
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      {ORDER_PRODUCT_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newOrderPlan}
                      onChange={(e) => setNewOrderPlan(e.target.value)}
                      placeholder="Plan Name (e.g. cPanel Velocity)"
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                    />
                    <input
                      type="text"
                      value={newOrderDomain}
                      onChange={(e) => setNewOrderDomain(e.target.value)}
                      placeholder="Domain or Node Hostname *"
                      className="px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                    />
                    <select
                      value={newOrderCycle}
                      onChange={(e) =>
                        setNewOrderCycle(
                          e.target.value as PlatformOrder['billingCycle']
                        )
                      }
                      className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="4 Years">4 Years</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="5-Year">5-Year</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={newOrderAmountUsd}
                        onChange={(e) => setNewOrderAmountUsd(e.target.value)}
                        placeholder="USD Amount"
                        className="w-1/2 px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                      />
                      <input
                        type="text"
                        value={newOrderDatacenter}
                        onChange={(e) => setNewOrderDatacenter(e.target.value)}
                        placeholder="Datacenter"
                        className="w-1/2 px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-[#0F172A]">Initial Order State:</span>
                      <select
                        value={newOrderInitialStatus}
                        onChange={(e) =>
                          setNewOrderInitialStatus(e.target.value as 'pending' | 'active')
                        }
                        className="px-2.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg bg-white font-medium text-[#0F172A]"
                      >
                        <option value="pending">
                          Pending Approval (Auto-generates invoice on Approve)
                        </option>
                        <option value="active">
                          Active Immediately (Generate invoice now)
                        </option>
                      </select>
                    </label>
                  </div>
                  {createOrderError && (
                    <p className="text-xs font-semibold text-[#DC2626]">
                      {createOrderError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateOrder(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                    >
                      {newOrderInitialStatus === 'pending'
                        ? 'Queue Pending Order'
                        : 'Create & Provision Order'}
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, domain, client email, or plan..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      'all',
                      'pending',
                      'active',
                      'suspended',
                      'expired',
                      'transferred',
                      'refunded',
                      'cancelled',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div
                  className={`${
                    selectedOrder ? 'xl:col-span-7' : 'xl:col-span-12'
                  } bg-white border border-[#E2E8F0] rounded-xl overflow-hidden`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                          <th className="py-3 px-4">Order ID &amp; Dates</th>
                          <th className="py-3 px-4">Client</th>
                          <th className="py-3 px-4">Service &amp; Hostname</th>
                          <th className="py-3 px-4">Datacenter</th>
                          <th className="py-3 px-4">Cycle</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-xs">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-500">
                              No orders match the current filter.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((ord) => (
                            <tr
                              key={ord.id}
                              onClick={() => setSelectedOrderId(ord.id)}
                              className={`hover:bg-[#F8FAFC] cursor-pointer ${
                                selectedOrderId === ord.id ? 'bg-[#F2FAF8]' : ''
                              }`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-mono font-semibold text-[#0F172A] block">
                                  {ord.id}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 block">
                                  Due: {(ord.nextDueDate || ord.createdAt).slice(0, 10)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#0F172A] block">
                                  {ord.clientName}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {ord.clientEmail}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#0F172A] block">
                                  {ord.planName}
                                  {ord.promoCode && (
                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-[#F2FAF8] border border-[#0E6B63]/25 font-mono text-[10px] font-bold text-[#0E6B63]">
                                      {ord.promoCode}
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono text-[11px] text-[#0E6B63]">
                                  {ord.domainOrHost}
                                </span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F172A]">
                                  <MapPin className="w-3 h-3 text-[#0E6B63] shrink-0" aria-hidden="true" />
                                  <span>{ord.datacenter}</span>
                                </span>
                                {ord.serverModuleId && (
                                  <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                                    {provisioningModules.find((m) => m.id === ord.serverModuleId)?.name ||
                                      ord.serverModuleId}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                {ord.billingCycle}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A]">
                                {formatPrice(ord.amountUsd)}
                              </td>
                              <td
                                className="py-3 px-4 whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <select
                                  aria-label={`Order status for ${ord.id}`}
                                  value={ord.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as OrderStatus;
                                    if (nextStatus === 'active' && ord.status === 'pending') {
                                      openApproveModal(ord);
                                      return;
                                    }
                                    updateOrderStatus(
                                      ord.id,
                                      nextStatus,
                                      `Status updated to ${nextStatus.toUpperCase()} by ${currentUser.name}`
                                    );
                                    showToast(`Order ${ord.id} marked ${nextStatus.toUpperCase()}`);
                                  }}
                                  className="px-2 py-1 rounded text-[11px] font-semibold border border-[#E2E8F0] bg-white text-[#0F172A] cursor-pointer"
                                >
                                  <option value="pending">PENDING</option>
                                  <option value="active">ACTIVE</option>
                                  <option value="suspended">SUSPENDED</option>
                                  <option value="expired">EXPIRED</option>
                                  <option value="transferred">TRANSFERRED</option>
                                  <option value="refunded">REFUNDED</option>
                                  <option value="cancelled">CANCELLED</option>
                                </select>
                              </td>
                              <td
                                className="py-3 px-4 text-right whitespace-nowrap space-x-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {ord.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => openApproveModal(ord)}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderId(ord.id);
                                    setEditingOrderMode(true);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#0E6B63]/10 rounded cursor-pointer"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedOrder && (
                  <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p className="font-mono text-xs font-bold text-[#0E6B63]">
                          {selectedOrder.id}
                        </p>
                        <h3 className="font-display text-base font-bold text-[#0F172A] mt-0.5">
                          {selectedOrder.planName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingOrderMode((v) => !v)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 rounded-lg cursor-pointer"
                        >
                          {editingOrderMode ? 'View Summary' : 'Edit Order & Dates'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(null)}
                          className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    {editingOrderMode ? (
                      <form onSubmit={handleSaveSelectedOrderEdit} className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Order Status
                            </label>
                            <select
                              value={editOrderStatus}
                              onChange={(e) =>
                                setEditOrderStatus(e.target.value as OrderStatus)
                              }
                              className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg bg-white"
                            >
                              <option value="pending">PENDING</option>
                              <option value="active">ACTIVE</option>
                              <option value="suspended">SUSPENDED</option>
                              <option value="expired">EXPIRED</option>
                              <option value="transferred">TRANSFERRED</option>
                              <option value="refunded">REFUNDED</option>
                              <option value="cancelled">CANCELLED</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Billing Cycle
                            </label>
                            <select
                              value={editOrderCycle}
                              onChange={(e) =>
                                setEditOrderCycle(
                                  e.target.value as PlatformOrder['billingCycle']
                                )
                              }
                              className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg bg-white"
                            >
                              <option value="1 Month">1 Month</option>
                              <option value="1 Year">1 Year</option>
                              <option value="2 Years">2 Years</option>
                              <option value="4 Years">4 Years</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Yearly">Yearly</option>
                              <option value="5-Year">5-Year</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Plan Name
                            </label>
                            <input
                              type="text"
                              value={editOrderPlan}
                              onChange={(e) => setEditOrderPlan(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Domain / Hostname
                            </label>
                            <input
                              type="text"
                              value={editOrderDomain}
                              onChange={(e) => setEditOrderDomain(e.target.value)}
                              className="w-full px-2.5 py-1.5 font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Start / Created Date
                            </label>
                            <input
                              type="date"
                              value={editOrderCreatedAt}
                              onChange={(e) => setEditOrderCreatedAt(e.target.value)}
                              className="w-full px-2.5 py-1.5 font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Next Due Date
                            </label>
                            <input
                              type="date"
                              value={editOrderDueDate}
                              onChange={(e) => setEditOrderDueDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Amount (USD)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editOrderAmountUsd}
                              onChange={(e) => setEditOrderAmountUsd(e.target.value)}
                              className="w-full px-2.5 py-1.5 font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Datacenter / IP
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={editOrderDatacenter}
                                onChange={(e) => setEditOrderDatacenter(e.target.value)}
                                placeholder="London, UK"
                                className="w-1/2 px-2 py-1.5 border border-[#CBD5E1] rounded-lg"
                              />
                              <input
                                type="text"
                                value={editOrderServerIp}
                                onChange={(e) => setEditOrderServerIp(e.target.value)}
                                placeholder="Server IP"
                                className="w-1/2 px-2 py-1.5 font-mono border border-[#CBD5E1] rounded-lg"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Server Module
                            </label>
                            <select
                              value={editOrderModuleId}
                              onChange={(e) => setEditOrderModuleId(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg bg-white"
                            >
                              <option value="">None / Manual</option>
                              {provisioningModules.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Server Package Name
                            </label>
                            <input
                              type="text"
                              value={editOrderPackage}
                              onChange={(e) => setEditOrderPackage(e.target.value)}
                              placeholder="cpcloud_velocity"
                              className="w-full px-2.5 py-1.5 font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Admin Provisioning Notes
                          </label>
                          <textarea
                            rows={2}
                            value={editOrderNotes}
                            onChange={(e) => setEditOrderNotes(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-lg"
                          />
                        </div>

                        <label className="inline-flex items-center gap-2 font-semibold text-[#0F172A] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editOrderAutoRenew}
                            onChange={(e) => setEditOrderAutoRenew(e.target.checked)}
                            className="rounded border-slate-300 text-[#0E6B63]"
                          />
                          <span>Auto-Renew Enabled</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingOrderMode(false)}
                            className="px-3 py-1.5 font-semibold text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                          >
                            Save Order Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Product Category</span>
                            <span className="font-semibold text-[#0F172A]">
                              {selectedOrder.productType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Target Domain / IP</span>
                            <span className="font-mono text-[#0E6B63]">
                              {selectedOrder.domainOrHost}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Status</span>
                            <StatusTextBadge
                              tone={getOrderTone(selectedOrder.status)}
                              label={selectedOrder.status.toUpperCase()}
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Start / Created Date</span>
                            <span className="font-mono text-slate-600">
                              {selectedOrder.createdAt}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Next Due Date</span>
                            <span className="font-mono font-semibold text-[#0F172A]">
                              {selectedOrder.nextDueDate || 'Not scheduled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Region / Node</span>
                            <span className="font-medium text-[#0F172A]">
                              {selectedOrder.datacenter}
                            </span>
                          </div>
                          {selectedOrder.serverPackageName && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Server Package</span>
                              <span className="font-mono text-[#0E6B63]">
                                {selectedOrder.serverPackageName}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Payment Method</span>
                            <span className="font-medium text-[#0F172A]">
                              {selectedOrder.paymentMethod}
                            </span>
                          </div>
                          {selectedOrder.promoCode && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Promo Code Applied</span>
                              <span className="font-mono font-semibold text-[#0E6B63]">
                                {selectedOrder.promoCode}
                                {selectedOrder.discountUsd
                                  ? ` (-${formatPrice(selectedOrder.discountUsd)})`
                                  : ''}
                              </span>
                            </div>
                          )}
                          {selectedOrder.transactionRef && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Transaction / TID</span>
                              <span className="font-mono text-[#0F172A]">
                                {selectedOrder.transactionRef}
                              </span>
                            </div>
                          )}
                        </div>

                        {selectedOrder.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => openApproveModal(selectedOrder)}
                            className="w-full py-2 px-4 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            Approve &amp; Assign Provisioning Server
                          </button>
                        )}

                        {(() => {
                          const linkedInvoice = invoices.find(
                            (inv) => inv.orderId === selectedOrder.id
                          );
                          return (
                            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display font-bold text-[#0F172A] inline-flex items-center gap-1.5">
                                  <Receipt className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                  <span>Linked Billing Invoice</span>
                                </span>
                                {linkedInvoice ? (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      linkedInvoice.status === 'paid'
                                        ? 'bg-[#16A34A]/10 text-[#16A34A]'
                                        : 'bg-[#D97706]/10 text-[#D97706]'
                                    }`}
                                  >
                                    {linkedInvoice.status.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600">
                                    PENDING APPROVAL
                                  </span>
                                )}
                              </div>

                              {linkedInvoice ? (
                                <>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-mono font-bold text-[#0E6B63]">
                                      {linkedInvoice.id}
                                    </span>
                                    <span className="font-mono font-semibold text-[#0F172A]">
                                      {formatPrice(linkedInvoice.amountUsd)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    Issued {linkedInvoice.issuedDate} · Due {linkedInvoice.dueDate}
                                    {linkedInvoice.autoGeneratedTrigger === 'order_approved'
                                      ? ' · Auto-generated on approval'
                                      : ''}
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        downloadInvoicePdf(
                                          linkedInvoice,
                                          invoiceTemplateConfig,
                                          paymentMethods,
                                          {
                                            code: currency.code,
                                            formattedTotal: formatPrice(linkedInvoice.amountUsd),
                                          }
                                        );
                                        showToast(`Downloaded ${linkedInvoice.id}.pdf`);
                                      }}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0E6B63] text-[11px] font-semibold text-[#0F172A] cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                                      <span>Download PDF</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setOrdersBillingSubTab('invoices')}
                                      className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0E6B63] text-[11px] font-semibold text-[#0E6B63] bg-white cursor-pointer"
                                    >
                                      Invoices Tab
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-slate-600">
                                    No invoice generated yet. Approving this order automatically generates and settles an official PDF invoice.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const gen = generateInvoiceForOrder(selectedOrder.id);
                                      if (gen.ok && gen.invoice) {
                                        showToast(`Invoice ${gen.invoice.id} generated`);
                                      }
                                    }}
                                    className="w-full py-1.5 px-3 rounded-lg border border-[#0E6B63]/30 bg-white hover:bg-[#F2FAF8] text-[11px] font-semibold text-[#0E6B63] cursor-pointer"
                                  >
                                    Generate Invoice Now
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {selectedOrder.notes && (
                          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-slate-600">
                            <span className="block font-semibold text-[#0F172A] mb-1">
                              Provisioning Audit Note
                            </span>
                            {selectedOrder.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}

          {/* ==================== PROMO CODES SYSTEM ==================== */}
          {activeSection === 'promos' && (
            <AdminPromoCodesView onShowToast={showToast} />
          )}

          {/* ==================== DOMAINS & TLD EXTENSIONS ==================== */}
          {activeSection === 'domains' && (
            <AdminDomainsView onShowToast={showToast} />
          )}

          {/* ==================== HOSTING PLANS & SERVER PROVISIONING ==================== */}
          {activeSection === 'plans' && (
            <AdminHostingPlansView onShowToast={showToast} />
          )}

          {/* ==================== MODULE CONFIGURATION (WHM / STACKCP / KVM) ==================== */}
          {activeSection === 'modules' && (
            <AdminModulesView onShowToast={showToast} />
          )}

          {/* ==================== SALES ANALYTICS & REPORTING ==================== */}
          {activeSection === 'analytics' && (
            <AdminAnalyticsView onShowToast={showToast} />
          )}

          {/* ==================== SYSTEM SETTINGS (STACKMAIL SMTP & GOOGLE OAUTH) ==================== */}
          {activeSection === 'system' && (
            <AdminSystemView onShowToast={showToast} />
          )}

          {/* ==================== PAYMENT METHODS (EASYPAISA, JAZZCASH, CARD, WIRE) ==================== */}
          {activeSection === 'payments' && (
            <AdminPaymentMethodsView onShowToast={showToast} />
          )}

          {/* ==================== EMAIL TEMPLATES SYSTEM ==================== */}
          {activeSection === 'emails' && (
            <AdminEmailTemplatesView onShowToast={showToast} />
          )}

          {/* ==================== ABUSE MODERATION ==================== */}
          {activeSection === 'abuse' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={abuseSearch}
                    onChange={(e) => setAbuseSearch(e.target.value)}
                    placeholder="Search ticket ID, target domain/IP, reporter email, or category..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      'all',
                      'open',
                      'investigating',
                      'suspended_target',
                      'resolved',
                      'dismissed',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAbuseFilter(st)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        abuseFilter === st
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {st === 'all' ? 'All Cases' : formatAbuseLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                          <th className="py-3 px-4">Case ID</th>
                          <th className="py-3 px-4">Target &amp; Category</th>
                          <th className="py-3 px-4">Severity</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-xs">
                        {filteredAbuse.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-slate-500">
                              No abuse complaints match this filter.
                            </td>
                          </tr>
                        ) : (
                          filteredAbuse.map((item) => {
                            const isActive =
                              selectedAbuseTicket?.ticketId === item.ticketId;
                            return (
                              <tr
                                key={item.ticketId}
                                onClick={() => setSelectedAbuseId(item.ticketId)}
                                className={`cursor-pointer transition-colors ${
                                  isActive ? 'bg-[#F2FAF8]' : 'hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A] whitespace-nowrap">
                                  {item.ticketId}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-mono text-[#0E6B63] block max-w-[260px] truncate">
                                    {item.targetResource}
                                  </span>
                                  <span className="text-slate-500 text-[11px] block mt-0.5">
                                    {item.categoryLabel}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                                  {item.severity}
                                </td>
                                <td className="py-3.5 px-4">
                                  <StatusTextBadge
                                    tone={getAbuseTone(item.status)}
                                    label={formatAbuseLabel(item.status)}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedAbuseTicket && (
                  <div className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <p className="font-mono text-xs font-bold text-[#0E6B63]">
                          {selectedAbuseTicket.ticketId} · {selectedAbuseTicket.severity}
                        </p>
                        <h3 className="font-display text-base font-bold text-[#0F172A] mt-1">
                          {selectedAbuseTicket.categoryLabel}
                        </h3>
                      </div>
                      <StatusTextBadge
                        tone={getAbuseTone(selectedAbuseTicket.status)}
                        label={formatAbuseLabel(selectedAbuseTicket.status)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">
                          Reporter / Organization
                        </span>
                        <span className="font-semibold text-[#0F172A]">
                          {selectedAbuseTicket.reporterName} (
                          {selectedAbuseTicket.organization})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          Reporter Contact &amp; Origin
                        </span>
                        <span className="font-mono text-[#0F172A]">
                          {selectedAbuseTicket.reporterEmail} ·{' '}
                          {selectedAbuseTicket.country}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block">
                          Target Domain / URL / IP
                        </span>
                        <span className="font-mono font-semibold text-[#DC2626] break-all">
                          {selectedAbuseTicket.targetResource}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block mb-1">
                          Submitted Evidence &amp; Headers
                        </span>
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-mono text-[11px] text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                          {selectedAbuseTicket.evidenceDetails}
                        </div>
                      </div>
                    </div>

                    <form
                      onSubmit={handleModerationSave}
                      className="space-y-4 pt-2 border-t border-slate-100"
                    >
                      <div>
                        <label
                          htmlFor="mod-status-select"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Moderation Decision Status
                        </label>
                        <select
                          id="mod-status-select"
                          value={modStatus}
                          onChange={(e) => setModStatus(e.target.value as AbuseStatus)}
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:border-[#0E6B63] cursor-pointer"
                        >
                          <option value="open">Open (Awaiting Triage)</option>
                          <option value="investigating">
                            Investigating (Notice Dispatched)
                          </option>
                          <option value="suspended_target">
                            Target Suspended / Null-Routed
                          </option>
                          <option value="resolved">Resolved &amp; Verified Clean</option>
                          <option value="dismissed">
                            Dismissed (False Positive / Insufficient Proof)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="mod-notes"
                          className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                        >
                          Enforcement Action &amp; Audit Notes
                        </label>
                        <textarea
                          id="mod-notes"
                          rows={3}
                          value={modNotes}
                          onChange={(e) => setModNotes(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                        />
                      </div>

                      <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={modSuspendOrders}
                          onChange={(e) => setModSuspendOrders(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#0E6B63]"
                        />
                        <span>
                          Automatically suspend matching domain/host orders in the
                          Orders Queue upon save
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer"
                      >
                        Apply Moderation Decision
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== LOGIN & SECURITY ACTIVITY AUDIT ==================== */}
          {activeSection === 'activity' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Search user email, event type, IP address, or authentication method..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['all', 'success', 'warning', 'blocked'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setActivityFilter(st)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                        activityFilter === st
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Event</th>
                        <th className="py-3 px-4">Method / Context</th>
                        <th className="py-3 px-4">IP &amp; Device</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs">
                      {filteredActivity.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-500">
                            No security activity entries match the filter.
                          </td>
                        </tr>
                      ) : (
                        filteredActivity.map((log) => (
                          <tr key={log.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {log.timestampUtc}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-[#0F172A] block">
                                {log.userName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {log.userEmail}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#0F172A]">
                              {log.eventType}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {log.authMethod}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] text-[#0F172A] block">
                                {log.ipAddress}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {log.deviceSummary}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <StatusTextBadge
                                tone={
                                  log.status === 'success'
                                    ? 'emerald'
                                    : log.status === 'warning'
                                    ? 'amber'
                                    : 'red'
                                }
                                label={log.status.toUpperCase()}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== APPROVE ORDER & SERVER SELECTION MODAL ==================== */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmApproveOrder}
            className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] font-bold text-[#0E6B63]">
                  {approvingOrder.id} · {approvingOrder.billingCycle}
                </p>
                <h3 className="font-display text-base font-bold text-[#0F172A]">
                  Approve &amp; Provision Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
                aria-label="Close approve modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Client</span>
                  <span className="font-semibold text-[#0F172A]">
                    {approvingOrder.clientName} ({approvingOrder.clientEmail})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Service / Domain</span>
                  <span className="font-semibold text-[#0F172A]">
                    {approvingOrder.planName} ·{' '}
                    <span className="font-mono text-[#0E6B63]">
                      {approvingOrder.domainOrHost}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Selected Datacenter</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                    <MapPin className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                    {approvingOrder.datacenter}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Amount &amp; Payment</span>
                  <span className="font-mono tabular-nums font-bold text-[#0F172A]">
                    {formatPrice(approvingOrder.amountUsd)} ({approvingOrder.paymentMethod})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Select Provisioning Server *
                </label>
                <select
                  value={approveModuleId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setApproveModuleId(nextId);
                    const nextMod = provisioningModules.find((m) => m.id === nextId);
                    if (nextMod) {
                      if (nextMod.packages.length > 0 && !approvePackageName) {
                        setApprovePackageName(nextMod.packages[0]);
                      }
                      setApproveLiveWhm(
                        nextMod.moduleType === 'whm' && Boolean(nextMod.apiToken.trim())
                      );
                    }
                    setApproveError('');
                  }}
                  className="w-full min-h-[42px] px-3 py-2 border border-[#CBD5E1] rounded-xl bg-white font-medium text-[#0F172A]"
                >
                  <option value="">Select server module...</option>
                  {provisioningModules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.moduleType.toUpperCase()} · {mod.hostname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                    Server Package Name
                  </label>
                  <input
                    type="text"
                    list="approve-package-suggestions"
                    value={approvePackageName}
                    onChange={(e) => setApprovePackageName(e.target.value)}
                    placeholder="e.g. stackcp_cloud_velocity"
                    className="w-full min-h-[40px] px-3 py-2 font-mono border border-[#CBD5E1] rounded-xl"
                  />
                  <datalist id="approve-package-suggestions">
                    {(
                      provisioningModules.find((m) => m.id === approveModuleId)
                        ?.packages || []
                    ).map((pkg) => (
                      <option key={pkg} value={pkg} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                    Assigned Server IP (Optional)
                  </label>
                  <input
                    type="text"
                    value={approveServerIp}
                    onChange={(e) => setApproveServerIp(e.target.value)}
                    placeholder="185.199.110.42"
                    className="w-full min-h-[40px] px-3 py-2 font-mono border border-[#CBD5E1] rounded-xl"
                  />
                </div>
              </div>

              {provisioningModules.find((m) => m.id === approveModuleId)?.moduleType ===
                'whm' && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F2FAF8] border border-[#0E6B63]/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveLiveWhm}
                    onChange={(e) => setApproveLiveWhm(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#0E6B63]"
                  />
                  <span className="text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-[#0F172A] block">
                      Run Live WHM Account Provisioning (createacct)
                    </strong>
                    Sends a real API call to your configured WHM server to provision the cPanel account immediately upon approval.
                  </span>
                </label>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                  Provisioning Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Optional onboarding or nameserver notes..."
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl"
                />
              </div>

              {invoiceTemplateConfig.autoGenerateOnApproval !== false && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-slate-600">
                  <Receipt className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong className="text-[#0F172A] block">
                      Automated Invoice Generation Enabled
                    </strong>
                    Upon approval, invoice{' '}
                    <span className="font-mono font-bold text-[#0E6B63]">
                      {approvingOrder.id.startsWith('ORD-')
                        ? `${invoiceTemplateConfig.invoicePrefix || 'INV-'}${approvingOrder.id.slice(4)}`
                        : `${invoiceTemplateConfig.invoicePrefix || 'INV-'}${approvingOrder.id}`}
                    </span>{' '}
                    is automatically generated{' '}
                    {invoiceTemplateConfig.autoMarkPaidOnApproval !== false
                      ? 'and stamped PAID'
                      : 'for billing'}
                    , with instant PDF download ready for the client.
                  </div>
                </div>
              )}

              {approveError && (
                <p className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {approveError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setApprovingOrder(null)}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveSubmitting}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {approveSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Approve &amp; Activate Service</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
