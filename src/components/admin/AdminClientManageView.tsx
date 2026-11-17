import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  Check,
  Copy,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  KeyRound,
  LifeBuoy,
  Lock,
  LogIn,
  Paperclip,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Server,
  ShoppingBag,
  Unlock,
  User,
  X,
} from 'lucide-react';
import {
  InvoiceStatus,
  ManagedUserAccount,
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
import { useCurrency } from '../../context/CurrencyContext';
import { AdminInvoiceEditor } from './AdminBillingInvoicesView';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';

export type ClientManageTab =
  | 'profile'
  | 'services'
  | 'domains'
  | 'orders'
  | 'tickets';

interface AdminClientManageViewProps {
  user: ManagedUserAccount;
  onBackToUsers: () => void;
  onOpenTicket: (ticketId: string) => void;
  onClientPortalLogin: () => void;
  onShowToast: (message: string) => void;
}

const HOSTING_PRODUCT_TYPES: PlatformOrder['productType'][] = [
  'cPanel Hosting',
  'Shared Cloud',
  'Managed WordPress',
  'Windows Hosting',
  'Reseller Hosting',
  'Unmanaged VPS',
  'n8n Hosting',
];

const ALL_PRODUCT_TYPES: PlatformOrder['productType'][] = [
  ...HOSTING_PRODUCT_TYPES,
  'Domain Registration',
  'Domain Transfer',
];

const TICKET_DEPARTMENTS: TicketDepartment[] = [
  'Migration Site',
  'Technical Support',
  'Billing',
  'Account',
  'Support',
];

const DATACENTERS = [
  'London, UK (Tier-4)',
  'Frankfurt, DE',
  'Dallas, USA',
  'New York, USA',
  'Singapore, SG',
];

const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES =
  'image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/zip,.log,.txt,.json';

function addCycleToIsoDate(
  startIso: string,
  cycle: PlatformOrder['billingCycle']
): string {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(startIso)
    ? new Date(`${startIso}T00:00:00Z`)
    : new Date();
  if (cycle === 'Monthly') base.setUTCMonth(base.getUTCMonth() + 1);
  else if (cycle === '5-Year') base.setUTCFullYear(base.getUTCFullYear() + 5);
  else base.setUTCFullYear(base.getUTCFullYear() + 1);
  return base.toISOString().slice(0, 10);
}

function generateStrongPassword(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let out = '';
  for (let i = 0; i < 14; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function StatusChip({
  tone,
  label,
}: {
  tone: 'emerald' | 'amber' | 'red' | 'slate' | 'teal';
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
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function userStatusMeta(status: UserAccountStatus): {
  label: string;
  tone: 'emerald' | 'amber' | 'red' | 'slate';
} {
  if (status === 'active') return { label: 'ACTIVE', tone: 'emerald' };
  if (status === 'pending_kyc') return { label: 'PENDING', tone: 'amber' };
  if (status === 'suspended') return { label: 'SUSPENDED', tone: 'red' };
  return { label: 'CANCELLED', tone: 'slate' };
}

function orderStatusTone(
  status: OrderStatus
): 'emerald' | 'amber' | 'red' | 'slate' {
  if (status === 'active') return 'emerald';
  if (status === 'pending') return 'amber';
  if (status === 'suspended' || status === 'expired') return 'red';
  return 'slate';
}

function invoiceStatusTone(
  status: InvoiceStatus
): 'emerald' | 'amber' | 'red' | 'slate' {
  if (status === 'paid') return 'emerald';
  if (status === 'overdue') return 'red';
  if (status === 'unpaid' || status === 'pending') return 'amber';
  return 'slate';
}

export const AdminClientManageView: React.FC<AdminClientManageViewProps> = ({
  user,
  onBackToUsers,
  onOpenTicket,
  onClientPortalLogin,
  onShowToast,
}) => {
  const {
    currentUser,
    users,
    orders,
    invoices,
    tickets,
    adminUpdateUserProfile,
    adminChangeUserPassword,
    adminResetUserTwoFactor,
    adminResetUserSupportPin,
    updateUserStatus,
    impersonateClientAccount,
    addOrder,
    adminUpdateOrderDetails,
    adminTransferOrderToClient,
    adminUpdateInvoiceStatus,
    adminCreateTicketForClient,
    paymentMethods,
    invoiceTemplateConfig,
  } = usePlatform();
  const { formatPrice, currency, rate } = useCurrency();

  const [activeTab, setActiveTab] = useState<ClientManageTab>('profile');
  const [pinRevealed, setPinRevealed] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [editingClientInvoiceId, setEditingClientInvoiceId] = useState<string | null>(null);
  const [creatingClientInvoice, setCreatingClientInvoice] = useState(false);

  // Scoped client records
  const clientOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.clientEmail.toLowerCase() === user.email.toLowerCase()
      ),
    [orders, user.email]
  );

  const clientServices = useMemo(
    () =>
      clientOrders.filter(
        (o) =>
          o.productType !== 'Domain Registration' &&
          o.productType !== 'Domain Transfer'
      ),
    [clientOrders]
  );

  const clientDomains = useMemo(
    () =>
      clientOrders.filter(
        (o) =>
          o.productType === 'Domain Registration' ||
          o.productType === 'Domain Transfer'
      ),
    [clientOrders]
  );

  const clientInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) => inv.clientEmail.toLowerCase() === user.email.toLowerCase()
      ),
    [invoices, user.email]
  );

  const clientTickets = useMemo(
    () =>
      tickets.filter(
        (t) => t.clientEmail.toLowerCase() === user.email.toLowerCase()
      ),
    [tickets, user.email]
  );

  const otherClientAccounts = useMemo(
    () => users.filter((u) => u.id !== user.id),
    [users, user.id]
  );

  const unpaidInvoiceTotal = useMemo(
    () =>
      clientInvoices
        .filter(
          (inv) =>
            inv.status === 'unpaid' ||
            inv.status === 'overdue' ||
            inv.status === 'pending'
        )
        .reduce((sum, inv) => sum + inv.amountUsd, 0),
    [clientInvoices]
  );

  const editingClientInvoice = useMemo(
    () => clientInvoices.find((inv) => inv.id === editingClientInvoiceId) ?? null,
    [clientInvoices, editingClientInvoiceId]
  );

  const paidTotal = useMemo(
    () =>
      clientInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amountUsd, 0),
    [clientInvoices]
  );

  // =========================================================================
  // 1. PROFILE & PASSWORD STATE
  // =========================================================================
  const [editName, setEditName] = useState(user.name);
  const [editUsername, setEditUsername] = useState(
    user.username || user.email.split('@')[0]
  );
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editCompany, setEditCompany] = useState(user.company);
  const [editCountry, setEditCountry] = useState(user.country);
  const [editRole, setEditRole] = useState<UserRole>(user.role);
  const [editStatus, setEditStatus] = useState<UserAccountStatus>(user.status);
  const [editKyc, setEditKyc] = useState(user.kycVerified);
  const [profileError, setProfileError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setEditName(user.name);
    setEditUsername(user.username || user.email.split('@')[0]);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditCompany(user.company);
    setEditCountry(user.country);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditKyc(user.kycVerified);
    setProfileError('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminUpdateUserProfile(user.id, {
      name: editName,
      username: editUsername,
      email: editEmail,
      phone: editPhone,
      company: editCompany,
      country: editCountry,
      role: editRole,
      status: editStatus,
      kycVerified: editKyc,
    });
    if (!res.ok) {
      setProfileError(res.error || 'Could not update client profile.');
      return;
    }
    setProfileError('');
    onShowToast(`Profile saved for ${editName}`);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    const res = adminChangeUserPassword(user.id, newPassword);
    if (!res.ok) {
      setPasswordError(res.error || 'Unable to update password.');
      return;
    }
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast(`Password updated for ${user.name}`);
  };

  const handleDirectPortalLogin = () => {
    const res = impersonateClientAccount(user.id);
    if (!res.ok) {
      onShowToast(res.error || 'Unable to log into client portal.');
      return;
    }
    onClientPortalLogin();
  };

  // =========================================================================
  // 2. ADD NEW SERVICE INLINE FORM
  // =========================================================================
  const todayIso = new Date().toISOString().slice(0, 10);
  const [showAddService, setShowAddService] = useState(false);
  const [svcType, setSvcType] =
    useState<PlatformOrder['productType']>('cPanel Hosting');
  const [svcPlan, setSvcPlan] = useState('cPanel Velocity');
  const [svcDomain, setSvcDomain] = useState('');
  const [svcCycle, setSvcCycle] =
    useState<PlatformOrder['billingCycle']>('Yearly');
  const [svcAmount, setSvcAmount] = useState('199.00');
  const [svcDatacenter, setSvcDatacenter] = useState(DATACENTERS[0]);
  const [svcRegDate, setSvcRegDate] = useState(todayIso);
  const [svcDueDate, setSvcDueDate] = useState(() =>
    addCycleToIsoDate(todayIso, 'Yearly')
  );
  const [svcStatus, setSvcStatus] = useState<OrderStatus>('active');
  const [svcInvoiceMode, setSvcInvoiceMode] = useState<'unpaid' | 'paid'>('unpaid');
  const [svcFormError, setSvcFormError] = useState('');

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(svcAmount);
    if (!svcPlan.trim() || !svcDomain.trim()) {
      setSvcFormError('Enter both a service plan name and domain/hostname.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setSvcFormError('Enter a valid USD amount.');
      return;
    }
    const { order, invoice } = addOrder({
      clientEmail: user.email,
      clientName: user.name,
      country: user.country,
      productType: svcType,
      planName: svcPlan.trim(),
      domainOrHost: svcDomain.trim().toLowerCase(),
      billingCycle: svcCycle,
      amountUsd: amount,
      datacenter: svcDatacenter,
      createdAt: svcRegDate,
      nextDueDate: svcDueDate,
      status: svcStatus,
      invoicePaid: svcInvoiceMode === 'paid',
      paymentMethod:
        svcInvoiceMode === 'paid'
          ? 'Admin Recorded Payment'
          : 'Invoice Pending',
      notes: `Provisioned via Admin Client Profile (${user.id})`,
    });
    setSvcFormError('');
    setSvcDomain('');
    setShowAddService(false);
    onShowToast(
      `Service ${order.id} added & Invoice ${invoice?.id ?? ''} generated automatically`
    );
  };

  // =========================================================================
  // 3. ADD NEW DOMAIN INLINE FORM
  // =========================================================================
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [domType, setDomType] = useState<
    'Domain Registration' | 'Domain Transfer'
  >('Domain Registration');
  const [domName, setDomName] = useState('');
  const [domPlan, setDomPlan] = useState('.com 1-Year Registration + DNSSEC');
  const [domCycle, setDomCycle] = useState<'Yearly' | '5-Year'>('Yearly');
  const [domAmount, setDomAmount] = useState('14.99');
  const [domRegDate, setDomRegDate] = useState(todayIso);
  const [domDueDate, setDomDueDate] = useState(() =>
    addCycleToIsoDate(todayIso, 'Yearly')
  );
  const [domNs1, setDomNs1] = useState('ns1.cpcloudhost.com');
  const [domNs2, setDomNs2] = useState('ns2.cpcloudhost.com');
  const [domLock, setDomLock] = useState(true);
  const [domPrivacy, setDomPrivacy] = useState(true);
  const [domInvoiceMode, setDomInvoiceMode] = useState<'unpaid' | 'paid'>('unpaid');
  const [domFormError, setDomFormError] = useState('');

  const handleCreateDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = domName.trim().toLowerCase();
    const amount = parseFloat(domAmount);
    if (!cleanDomain || !cleanDomain.includes('.')) {
      setDomFormError('Enter a valid domain name (e.g. clientbrand.com).');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setDomFormError('Enter a valid USD amount.');
      return;
    }
    const { order, invoice } = addOrder({
      clientEmail: user.email,
      clientName: user.name,
      country: user.country,
      productType: domType,
      planName: domPlan.trim() || `${domType} (${cleanDomain})`,
      domainOrHost: cleanDomain,
      billingCycle: domCycle,
      amountUsd: amount,
      datacenter: 'Global Anycast DNS',
      createdAt: domRegDate,
      nextDueDate: domDueDate,
      nameservers: [
        domNs1.trim() || 'ns1.cpcloudhost.com',
        domNs2.trim() || 'ns2.cpcloudhost.com',
      ],
      registrarLock: domLock,
      whoisPrivacy: domPrivacy,
      status: domInvoiceMode === 'paid' ? 'active' : 'pending',
      invoicePaid: domInvoiceMode === 'paid',
      paymentMethod:
        domInvoiceMode === 'paid'
          ? 'Admin Recorded Payment'
          : 'Invoice Pending',
      notes: `${domType} added by Staff & invoice auto-generated`,
    });
    setDomFormError('');
    setDomName('');
    setShowAddDomain(false);
    onShowToast(
      `Domain ${order.domainOrHost} added & Invoice ${invoice?.id ?? ''} generated automatically`
    );
  };

  // =========================================================================
  // 4. ADD NEW ORDER INLINE FORM (ORDERS & INVOICES TAB)
  // =========================================================================
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [ordType, setOrdType] =
    useState<PlatformOrder['productType']>('Managed WordPress');
  const [ordPlan, setOrdPlan] = useState('WP Scale Edge');
  const [ordHost, setOrdHost] = useState('');
  const [ordCycle, setOrdCycle] =
    useState<PlatformOrder['billingCycle']>('Yearly');
  const [ordAmount, setOrdAmount] = useState('143.88');
  const [ordRegDate, setOrdRegDate] = useState(todayIso);
  const [ordDueDate, setOrdDueDate] = useState(() =>
    addCycleToIsoDate(todayIso, 'Yearly')
  );
  const [ordStatus, setOrdStatus] = useState<OrderStatus>('pending');
  const [ordInvoicePaid, setOrdInvoicePaid] = useState(false);
  const [ordError, setOrdError] = useState('');

  const handleCreateCustomOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(ordAmount);
    if (!ordPlan.trim() || !ordHost.trim()) {
      setOrdError('Enter both plan description and target domain/hostname.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setOrdError('Enter a valid non-negative USD amount.');
      return;
    }
    const { order, invoice } = addOrder({
      clientEmail: user.email,
      clientName: user.name,
      country: user.country,
      productType: ordType,
      planName: ordPlan.trim(),
      domainOrHost: ordHost.trim().toLowerCase(),
      billingCycle: ordCycle,
      amountUsd: amount,
      createdAt: ordRegDate,
      nextDueDate: ordDueDate,
      status: ordStatus,
      invoicePaid: ordInvoicePaid,
      paymentMethod: ordInvoicePaid
        ? 'Admin Recorded Payment'
        : 'Invoice Pending',
      notes: 'Manual Admin Order with auto-generated invoice',
    });
    setOrdError('');
    setOrdHost('');
    setShowAddOrder(false);
    onShowToast(
      `Order ${order.id} created with automatic Invoice ${invoice?.id ?? ''}`
    );
  };

  // =========================================================================
  // 5. SERVICE / DOMAIN INLINE EDITING & ACCOUNT TRANSFER STATE
  // =========================================================================
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [draftRegDate, setDraftRegDate] = useState('');
  const [draftDueDate, setDraftDueDate] = useState('');
  const [draftOrderStatus, setDraftOrderStatus] = useState<OrderStatus>('active');
  const [draftOrderAmount, setDraftOrderAmount] = useState('');
  const [draftOrderDatacenter, setDraftOrderDatacenter] = useState('');
  const [draftAutoRenew, setDraftAutoRenew] = useState(true);
  const [draftNs1, setDraftNs1] = useState('ns1.cpcloudhost.com');
  const [draftNs2, setDraftNs2] = useState('ns2.cpcloudhost.com');
  const [draftRegistrarLock, setDraftRegistrarLock] = useState(true);
  const [draftWhoisPrivacy, setDraftWhoisPrivacy] = useState(true);

  const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
  const [transferTargetUserId, setTransferTargetUserId] = useState<string>(
    otherClientAccounts[0]?.id || ''
  );

  useEffect(() => {
    if (
      !transferTargetUserId ||
      !otherClientAccounts.some((u) => u.id === transferTargetUserId)
    ) {
      setTransferTargetUserId(otherClientAccounts[0]?.id || '');
    }
  }, [otherClientAccounts, transferTargetUserId]);

  const startEditingOrder = (ord: PlatformOrder) => {
    setTransferOrderId(null);
    setEditingOrderId(ord.id);
    setDraftRegDate(ord.createdAt.slice(0, 10));
    setDraftDueDate(
      ord.nextDueDate || addCycleToIsoDate(ord.createdAt.slice(0, 10), ord.billingCycle)
    );
    setDraftOrderStatus(ord.status);
    setDraftOrderAmount(ord.amountUsd.toFixed(2));
    setDraftOrderDatacenter(ord.datacenter);
    setDraftAutoRenew(ord.autoRenew !== false);
    setDraftNs1(ord.nameservers?.[0] || 'ns1.cpcloudhost.com');
    setDraftNs2(ord.nameservers?.[1] || 'ns2.cpcloudhost.com');
    setDraftRegistrarLock(ord.registrarLock !== false);
    setDraftWhoisPrivacy(ord.whoisPrivacy !== false);
  };

  const handleSaveOrderEdit = (ord: PlatformOrder) => {
    const isDom =
      ord.productType === 'Domain Registration' ||
      ord.productType === 'Domain Transfer';
    const parsedAmt = parseFloat(draftOrderAmount);
    const res = adminUpdateOrderDetails(ord.id, {
      createdAt: draftRegDate,
      nextDueDate: draftDueDate,
      status: draftOrderStatus,
      amountUsd: Number.isFinite(parsedAmt) ? parsedAmt : ord.amountUsd,
      datacenter: draftOrderDatacenter.trim() || ord.datacenter,
      autoRenew: draftAutoRenew,
      ...(isDom
        ? {
            nameservers: [
              draftNs1.trim() || 'ns1.cpcloudhost.com',
              draftNs2.trim() || 'ns2.cpcloudhost.com',
            ],
            registrarLock: draftRegistrarLock,
            whoisPrivacy: draftWhoisPrivacy,
          }
        : {}),
    });
    if (!res.ok) {
      onShowToast(res.error || 'Could not save updates.');
      return;
    }
    setEditingOrderId(null);
    onShowToast(
      `Updated dates & settings for ${ord.domainOrHost} (synced to Invoice & Client Portal)`
    );
  };

  const handleConfirmTransfer = (ord: PlatformOrder) => {
    if (!transferTargetUserId) return;
    const targetUser = users.find((u) => u.id === transferTargetUserId);
    const res = adminTransferOrderToClient(ord.id, transferTargetUserId);
    if (!res.ok) {
      onShowToast(res.error || 'Transfer failed.');
      return;
    }
    setTransferOrderId(null);
    onShowToast(
      `${ord.domainOrHost} transferred to ${targetUser?.name || transferTargetUserId}`
    );
  };

  // =========================================================================
  // 6. CREATE SUPPORT TICKET FOR CLIENT
  // =========================================================================
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [tktDept, setTktDept] =
    useState<TicketDepartment>('Technical Support');
  const [tktPriority, setTktPriority] = useState<TicketPriority>('Normal');
  const [tktStatus, setTktStatus] = useState<TicketStatus>('pending');
  const [tktRelatedService, setTktRelatedService] = useState('');
  const [tktSubject, setTktSubject] = useState('');
  const [tktMessage, setTktMessage] = useState('');
  const [tktAttachments, setTktAttachments] = useState<TicketAttachment[]>([]);
  const [tktError, setTktError] = useState('');
  const tktFileRef = useRef<HTMLInputElement | null>(null);

  const handleTicketFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, MAX_ATTACHMENT_COUNT - tktAttachments.length);
    const list = Array.from(files).slice(0, remaining);
    const loaded: TicketAttachment[] = [];
    for (const file of list) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setTktError(`${file.name} exceeds 10 MB limit.`);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      if (dataUrl) {
        loaded.push({
          id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          dataUrl,
        });
      }
    }
    if (loaded.length > 0) {
      setTktAttachments((prev) =>
        [...prev, ...loaded].slice(0, MAX_ATTACHMENT_COUNT)
      );
    }
  };

  const handleCreateClientTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminCreateTicketForClient({
      userId: user.id,
      department: tktDept,
      priority: tktPriority,
      status: tktStatus,
      relatedService: tktRelatedService || undefined,
      subject: tktSubject,
      message: tktMessage,
      attachments: tktAttachments,
    });
    if (!res.ok || !res.ticket) {
      setTktError(res.error || 'Unable to create ticket.');
      return;
    }
    setTktError('');
    setTktSubject('');
    setTktMessage('');
    setTktAttachments([]);
    setShowCreateTicket(false);
    onShowToast(`Ticket ${res.ticket.id} opened for ${user.name}`);
  };

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const statusMeta = userStatusMeta(user.status);
  const isSelfAdmin = currentUser?.id === user.id;

  const tabs: {
    id: ClientManageTab;
    label: string;
    count?: number;
    icon: React.FC<{ className?: string; 'aria-hidden'?: boolean }>;
  }[] = [
    { id: 'profile', label: 'Profile & Security', icon: User },
    {
      id: 'services',
      label: 'Services',
      count: clientServices.length,
      icon: Server,
    },
    {
      id: 'domains',
      label: 'Domains',
      count: clientDomains.length,
      icon: Globe,
    },
    {
      id: 'orders',
      label: 'Orders & Invoices',
      count: clientOrders.length,
      icon: Receipt,
    },
    {
      id: 'tickets',
      label: 'Support Tickets',
      count: clientTickets.length,
      icon: LifeBuoy,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action & Back Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToUsers}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to All Clients</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Account Status Selector */}
          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Status:
            </span>
            <select
              aria-label="Client Account Status"
              disabled={isSelfAdmin}
              value={user.status}
              onChange={(e) => {
                const nextStatus = e.target.value as UserAccountStatus;
                updateUserStatus(user.id, nextStatus);
                onShowToast(
                  `${user.name} status updated to ${userStatusMeta(nextStatus).label}`
                );
              }}
              className="text-xs font-semibold text-[#0F172A] bg-transparent focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="active">Active</option>
              <option value="pending_kyc">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Direct Client Portal Login CTA */}
          <button
            type="button"
            onClick={handleDirectPortalLogin}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Client Portal Login</span>
          </button>
        </div>
      </div>

      {/* Client Identity Summary Card */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white font-display text-base font-bold flex items-center justify-center shrink-0">
              {initials || 'CL'}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] truncate">
                  {user.name}
                </h1>
                <span className="font-mono text-xs text-slate-500">
                  {user.id}
                </span>
                <StatusChip tone={statusMeta.tone} label={statusMeta.label} />
                {user.kycVerified && (
                  <StatusChip tone="teal" label="KYC VERIFIED" />
                )}
              </div>
              <p className="text-xs text-slate-600 font-mono truncate">
                {user.email} · @{user.username || user.email.split('@')[0]}
                {user.phone ? ` · ${user.phone}` : ''}
              </p>
              <p className="text-xs text-slate-500">
                {user.company} · {user.country} · Registered:{' '}
                <span className="font-mono">{user.createdAt}</span> · Last
                Login: <span className="font-mono">{user.lastLoginAt}</span>
              </p>
            </div>
          </div>

          {/* Right Quick Telemetry Figures (Tabular Numerals) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-[#E2E8F0] pt-4 lg:pt-0 lg:pl-6">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Services
              </span>
              <span className="font-mono text-base font-bold text-[#0F172A] tabular-nums">
                {clientServices.length}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Domains
              </span>
              <span className="font-mono text-base font-bold text-[#0F172A] tabular-nums">
                {clientDomains.length}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Unpaid Due
              </span>
              <span
                className={`font-mono text-base font-bold tabular-nums ${
                  unpaidInvoiceTotal > 0 ? 'text-[#D97706]' : 'text-[#16A34A]'
                }`}
              >
                {formatPrice(unpaidInvoiceTotal)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Total Paid
              </span>
              <span className="font-mono text-base font-bold text-[#0F172A] tabular-nums">
                {formatPrice(paidTotal > 0 ? paidTotal : user.totalSpendUsd)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Client System Tabs */}
      <nav
        aria-label="Client workspace sections"
        className="flex items-center gap-1.5 border-b border-[#E2E8F0] overflow-x-auto pb-px"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'border-[#0E6B63] text-[#0E6B63]'
                  : 'border-transparent text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden={true} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                    active
                      ? 'bg-[#0E6B63]/10 text-[#0E6B63]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ===================================================================== */}
      {/* TAB 1: PROFILE, ACCOUNT STATUS & PASSWORD SECURITY                    */}
      {/* ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Edit Client Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-sm font-bold text-[#0F172A]">
                  Client Profile &amp; Account Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Updates propagate automatically across orders, invoices, WHOIS records, and tickets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Username *
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+44 20 7946 0000"
                  className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country / Billing Region
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  disabled={isSelfAdmin}
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as UserAccountStatus)
                  }
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="pending_kyc">Pending (Verification)</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Role
                </label>
                <select
                  disabled={isSelfAdmin}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#CBD5E1] rounded-lg bg-white disabled:opacity-50"
                >
                  <option value="client">Client</option>
                  <option value="reseller">Reseller</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editKyc}
                onChange={(e) => setEditKyc(e.target.checked)}
                className="rounded border-slate-300 text-[#0E6B63]"
              />
              <span>Identity &amp; KYC Compliance Verified</span>
            </label>

            {profileError && (
              <p className="text-xs font-semibold text-[#DC2626]">
                {profileError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Client Profile</span>
              </button>
            </div>
          </form>

          {/* Right Security Column: Change Password, 2FA & Support PIN */}
          <div className="xl:col-span-5 space-y-5">
            {/* Change Password */}
            <form
              onSubmit={handleSavePassword}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-display text-sm font-bold text-[#0F172A] inline-flex items-center gap-2">
                  <KeyRound
                    className="w-4 h-4 text-[#0E6B63]"
                    aria-hidden="true"
                  />
                  <span>Change Client Password</span>
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const pwd = generateStrongPassword();
                    setNewPassword(pwd);
                    setConfirmPassword(pwd);
                    setShowPass(true);
                    setPasswordError('');
                  }}
                  className="text-[11px] font-semibold text-[#0E6B63] hover:underline cursor-pointer"
                >
                  Generate Strong
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pr-9 pl-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                    <button
                      type="button"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                    >
                      {showPass ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {passwordError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Update Client Password
              </button>
            </form>

            {/* Support PIN & 2FA Recovery */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
              <h2 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                Authentication &amp; Support Verification
              </h2>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#0F172A] block">
                    Two-Factor Authentication (TOTP)
                  </span>
                  <span className="text-slate-500">
                    {user.twoFactorEnabled
                      ? 'Authenticator app active on this account'
                      : 'Not enrolled by client'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    tone={user.twoFactorEnabled ? 'emerald' : 'slate'}
                    label={user.twoFactorEnabled ? '2FA ENABLED' : '2FA OFF'}
                  />
                  {user.twoFactorEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        adminResetUserTwoFactor(user.id);
                        onShowToast(`2FA reset completed for ${user.name}`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] border border-[#DC2626]/30 hover:bg-red-50 rounded cursor-pointer"
                    >
                      Disable 2FA
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-[#0F172A] block">
                    Permanent Support PIN (Never Expires)
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm font-bold text-[#0E6B63]">
                      {user.supportPin?.pin
                        ? pinRevealed
                          ? user.supportPin.pin
                          : '••••••'
                        : 'Pending Generation'}
                    </span>
                    {user.supportPin?.pin && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPinRevealed((v) => !v)}
                          aria-label="Toggle Support PIN visibility"
                          className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
                        >
                          {pinRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(user.supportPin?.pin || '')
                              .then(() => {
                                setCopiedPin(true);
                                window.setTimeout(() => setCopiedPin(false), 1800);
                              })
                              .catch(() => {});
                          }}
                          className="text-slate-400 hover:text-[#0E6B63] cursor-pointer"
                        >
                          {copiedPin ? (
                            <Check
                              className="w-3.5 h-3.5 text-[#16A34A]"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = adminResetUserSupportPin(user.id);
                    if (next) {
                      setPinRevealed(true);
                      onShowToast(`New permanent Support PIN issued: ${next.pin}`);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  <span>Reset PIN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SERVICES (ADD, EDIT DATES, TRANSFER ACCOUNT)                   */}
      {/* ===================================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Hosted Services &amp; Compute Instances
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust registration/due dates, transfer ownership to another account, or add a service with automatic invoicing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddService((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddService ? 'Close Form' : 'Add New Service'}</span>
            </button>
          </div>

          {showAddService && (
            <form
              onSubmit={handleCreateService}
              className="bg-white border border-[#0E6B63]/30 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display text-sm font-bold text-[#0F172A]">
                  Provision Service + Auto-Generate Invoice
                </h3>
                <span className="text-[11px] font-semibold text-[#0E6B63]">
                  Invoice INV-... created automatically
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Product Category
                  </label>
                  <select
                    value={svcType}
                    onChange={(e) =>
                      setSvcType(e.target.value as PlatformOrder['productType'])
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    {HOSTING_PRODUCT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={svcPlan}
                    onChange={(e) => setSvcPlan(e.target.value)}
                    placeholder="cPanel Turbo Pro"
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Primary Domain / Hostname *
                  </label>
                  <input
                    type="text"
                    required
                    value={svcDomain}
                    onChange={(e) => setSvcDomain(e.target.value)}
                    placeholder="app.clientdomain.com"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Datacenter Location
                  </label>
                  <select
                    value={svcDatacenter}
                    onChange={(e) => setSvcDatacenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    {DATACENTERS.map((dc) => (
                      <option key={dc} value={dc}>
                        {dc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={svcCycle}
                    onChange={(e) => {
                      const nextCycle = e.target
                        .value as PlatformOrder['billingCycle'];
                      setSvcCycle(nextCycle);
                      setSvcDueDate(addCycleToIsoDate(svcRegDate, nextCycle));
                    }}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="5-Year">5-Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={svcAmount}
                    onChange={(e) => setSvcAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={svcRegDate}
                    onChange={(e) => {
                      setSvcRegDate(e.target.value);
                      setSvcDueDate(addCycleToIsoDate(e.target.value, svcCycle));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={svcDueDate}
                    onChange={(e) => setSvcDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Initial Service Status
                  </label>
                  <select
                    value={svcStatus}
                    onChange={(e) =>
                      setSvcStatus(e.target.value as OrderStatus)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Automatic Invoice Status
                  </label>
                  <select
                    value={svcInvoiceMode}
                    onChange={(e) =>
                      setSvcInvoiceMode(e.target.value as 'unpaid' | 'paid')
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="unpaid">
                      Generate Unpaid Invoice (Client Must Settle)
                    </option>
                    <option value="paid">
                      Generate Paid Invoice (Settled Now)
                    </option>
                  </select>
                </div>
              </div>

              {svcFormError && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {svcFormError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                >
                  Create Service &amp; Generate Invoice
                </button>
              </div>
            </form>
          )}

          {clientServices.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
              <Server
                className="w-8 h-8 text-slate-300 mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-[#0F172A]">
                No hosting or compute services under {user.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Click &ldquo;Add New Service&rdquo; above to deploy a plan and generate an invoice automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientServices.map((svc) => {
                const isEditing = editingOrderId === svc.id;
                const isTransferring = transferOrderId === svc.id;
                return (
                  <div
                    key={svc.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0E6B63]">
                            {svc.id}
                          </span>
                          <span className="font-display text-sm font-bold text-[#0F172A]">
                            {svc.planName}
                          </span>
                          <StatusChip
                            tone={orderStatusTone(svc.status)}
                            label={svc.status.toUpperCase()}
                          />
                        </div>
                        <p className="text-xs text-slate-600">
                          <span className="font-mono font-semibold text-[#0F172A]">
                            {svc.domainOrHost}
                          </span>{' '}
                          · {svc.productType} · {svc.datacenter}
                          {svc.serverIp ? ` · ${svc.serverIp}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono tabular-nums pt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            Reg: {svc.createdAt.slice(0, 10)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            Due: {svc.nextDueDate || 'Auto'}
                          </span>
                          <span>
                            {formatPrice(svc.amountUsd)} / {svc.billingCycle}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            isEditing
                              ? setEditingOrderId(null)
                              : startEditingOrder(svc)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] hover:border-[#0E6B63] rounded-lg cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {isEditing ? 'Close Editor' : 'Dates & Settings'}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={otherClientAccounts.length === 0}
                          onClick={() => {
                            setEditingOrderId(null);
                            setTransferOrderId(
                              isTransferring ? null : svc.id
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg disabled:opacity-40 cursor-pointer"
                        >
                          <ArrowRightLeft
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Transfer Account</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Date & Settings Editor */}
                    {isEditing && (
                      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Registration Date
                          </label>
                          <input
                            type="date"
                            value={draftRegDate}
                            onChange={(e) => setDraftRegDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Next Due Date
                          </label>
                          <input
                            type="date"
                            value={draftDueDate}
                            onChange={(e) => setDraftDueDate(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Status
                          </label>
                          <select
                            value={draftOrderStatus}
                            onChange={(e) =>
                              setDraftOrderStatus(e.target.value as OrderStatus)
                            }
                            className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            USD Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={draftOrderAmount}
                            onChange={(e) =>
                              setDraftOrderAmount(e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draftAutoRenew}
                              onChange={(e) =>
                                setDraftAutoRenew(e.target.checked)
                              }
                              className="rounded border-slate-300 text-[#0E6B63]"
                            />
                            <span>Auto-Renew</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSaveOrderEdit(svc)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                          >
                            Save Dates
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Ownership Transfer Panel */}
                    {isTransferring && (
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC] p-3 rounded-lg">
                        <div className="text-xs">
                          <span className="font-semibold text-[#0F172A] block">
                            Transfer {svc.domainOrHost} ({svc.id}) to another account
                          </span>
                          <span className="text-slate-500">
                            Moves active service control and billing ownership immediately.
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={transferTargetUserId}
                            onChange={(e) =>
                              setTransferTargetUserId(e.target.value)
                            }
                            className="px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg bg-white min-w-[220px]"
                          >
                            {otherClientAccounts.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleConfirmTransfer(svc)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                          >
                            Confirm Transfer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DOMAINS (ADD, EDIT DATES/DNS, TRANSFER ACCOUNT)                */}
      {/* ===================================================================== */}
      {activeTab === 'domains' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Registered &amp; Transferred Domains
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set registration &amp; expiry dates, nameservers, transfer domains across client accounts, or add domains with auto-invoicing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDomain((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddDomain ? 'Close Form' : 'Add New Domain'}</span>
            </button>
          </div>

          {showAddDomain && (
            <form
              onSubmit={handleCreateDomain}
              className="bg-white border border-[#0E6B63]/30 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display text-sm font-bold text-[#0F172A]">
                  Register / Add Domain + Auto-Generate Invoice
                </h3>
                <span className="text-[11px] font-semibold text-[#0E6B63]">
                  Invoice INV-... created automatically
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Operation Type
                  </label>
                  <select
                    value={domType}
                    onChange={(e) =>
                      setDomType(
                        e.target.value as
                          | 'Domain Registration'
                          | 'Domain Transfer'
                      )
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Domain Registration">
                      Domain Registration
                    </option>
                    <option value="Domain Transfer">Domain Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Domain Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={domName}
                    onChange={(e) => setDomName(e.target.value)}
                    placeholder="exampledomain.com"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Plan / TLD Label
                  </label>
                  <input
                    type="text"
                    value={domPlan}
                    onChange={(e) => setDomPlan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Term
                    </label>
                    <select
                      value={domCycle}
                      onChange={(e) => {
                        const c = e.target.value as 'Yearly' | '5-Year';
                        setDomCycle(c);
                        setDomDueDate(addCycleToIsoDate(domRegDate, c));
                      }}
                      className="w-full px-2 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      <option value="Yearly">1 Year</option>
                      <option value="5-Year">5 Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      USD Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={domAmount}
                      onChange={(e) => setDomAmount(e.target.value)}
                      className="w-full px-2 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={domRegDate}
                    onChange={(e) => {
                      setDomRegDate(e.target.value);
                      setDomDueDate(addCycleToIsoDate(e.target.value, domCycle));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Next Due / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={domDueDate}
                    onChange={(e) => setDomDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nameserver 1
                  </label>
                  <input
                    type="text"
                    value={domNs1}
                    onChange={(e) => setDomNs1(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nameserver 2
                  </label>
                  <input
                    type="text"
                    value={domNs2}
                    onChange={(e) => setDomNs2(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={domLock}
                      onChange={(e) => setDomLock(e.target.checked)}
                      className="rounded border-slate-300 text-[#0E6B63]"
                    />
                    <span>Registrar Transfer Lock</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={domPrivacy}
                      onChange={(e) => setDomPrivacy(e.target.checked)}
                      className="rounded border-slate-300 text-[#0E6B63]"
                    />
                    <span>WHOIS Privacy Shield</span>
                  </label>
                </div>

                <select
                  value={domInvoiceMode}
                  onChange={(e) =>
                    setDomInvoiceMode(e.target.value as 'unpaid' | 'paid')
                  }
                  className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                >
                  <option value="unpaid">Auto-Invoice: Unpaid</option>
                  <option value="paid">Auto-Invoice: Paid (Active)</option>
                </select>
              </div>

              {domFormError && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {domFormError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDomain(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                >
                  Add Domain &amp; Generate Invoice
                </button>
              </div>
            </form>
          )}

          {clientDomains.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
              <Globe
                className="w-8 h-8 text-slate-300 mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-[#0F172A]">
                No domains assigned to {user.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Click &ldquo;Add New Domain&rdquo; above to register or transfer a domain with automatic invoicing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientDomains.map((dom) => {
                const isEditing = editingOrderId === dom.id;
                const isTransferring = transferOrderId === dom.id;
                return (
                  <div
                    key={dom.id}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#0F172A]">
                            {dom.domainOrHost}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {dom.id}
                          </span>
                          <StatusChip
                            tone={orderStatusTone(dom.status)}
                            label={dom.status.toUpperCase()}
                          />
                        </div>
                        <p className="text-xs text-slate-600">
                          {dom.planName} · NS:{' '}
                          <span className="font-mono">
                            {(
                              dom.nameservers || [
                                'ns1.cpcloudhost.com',
                                'ns2.cpcloudhost.com',
                              ]
                            ).join(', ')}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono tabular-nums pt-0.5">
                          <span>Reg: {dom.createdAt.slice(0, 10)}</span>
                          <span>Due: {dom.nextDueDate || 'Auto'}</span>
                          <span className="inline-flex items-center gap-1">
                            {dom.registrarLock !== false ? (
                              <Lock className="w-3 h-3 text-[#16A34A]" aria-hidden="true" />
                            ) : (
                              <Unlock className="w-3 h-3 text-[#D97706]" aria-hidden="true" />
                            )}
                            {dom.registrarLock !== false ? 'Locked' : 'Unlocked'}
                          </span>
                          <span>
                            {formatPrice(dom.amountUsd)} / {dom.billingCycle}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            isEditing
                              ? setEditingOrderId(null)
                              : startEditingOrder(dom)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] hover:border-[#0E6B63] rounded-lg cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {isEditing ? 'Close Editor' : 'Dates & DNS'}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={otherClientAccounts.length === 0}
                          onClick={() => {
                            setEditingOrderId(null);
                            setTransferOrderId(
                              isTransferring ? null : dom.id
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded-lg disabled:opacity-40 cursor-pointer"
                        >
                          <ArrowRightLeft
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Transfer Domain</span>
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Registration Date
                            </label>
                            <input
                              type="date"
                              value={draftRegDate}
                              onChange={(e) => setDraftRegDate(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Expiry / Next Due Date
                            </label>
                            <input
                              type="date"
                              value={draftDueDate}
                              onChange={(e) => setDraftDueDate(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nameserver 1
                            </label>
                            <input
                              type="text"
                              value={draftNs1}
                              onChange={(e) => setDraftNs1(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nameserver 2
                            </label>
                            <input
                              type="text"
                              value={draftNs2}
                              onChange={(e) => setDraftNs2(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Domain Status
                            </label>
                            <select
                              value={draftOrderStatus}
                              onChange={(e) =>
                                setDraftOrderStatus(
                                  e.target.value as OrderStatus
                                )
                              }
                              className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="suspended">Suspended</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draftRegistrarLock}
                                onChange={(e) =>
                                  setDraftRegistrarLock(e.target.checked)
                                }
                                className="rounded border-slate-300 text-[#0E6B63]"
                              />
                              <span>Registrar Lock</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draftWhoisPrivacy}
                                onChange={(e) =>
                                  setDraftWhoisPrivacy(e.target.checked)
                                }
                                className="rounded border-slate-300 text-[#0E6B63]"
                              />
                              <span>WHOIS Privacy</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draftAutoRenew}
                                onChange={(e) =>
                                  setDraftAutoRenew(e.target.checked)
                                }
                                className="rounded border-slate-300 text-[#0E6B63]"
                              />
                              <span>Auto-Renew</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveOrderEdit(dom)}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                          >
                            Save Domain Settings
                          </button>
                        </div>
                      </div>
                    )}

                    {isTransferring && (
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC] p-3 rounded-lg">
                        <div className="text-xs">
                          <span className="font-semibold text-[#0F172A] block">
                            Transfer Domain {dom.domainOrHost} to another account
                          </span>
                          <span className="text-slate-500">
                            Reassigns domain DNS zone, lock control, and renewals cleanly.
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={transferTargetUserId}
                            onChange={(e) =>
                              setTransferTargetUserId(e.target.value)
                            }
                            className="px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg bg-white min-w-[220px]"
                          >
                            {otherClientAccounts.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleConfirmTransfer(dom)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                          >
                            Confirm Domain Transfer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ORDERS & AUTOMATICALLY GENERATED INVOICES                      */}
      {/* ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Client Orders &amp; Generated Invoices
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every service, domain, or manual order creates a tracked invoice synchronized with the Client Portal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddOrder((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showAddOrder ? 'Close Order Form' : 'Add New Order'}</span>
            </button>
          </div>

          {showAddOrder && (
            <form
              onSubmit={handleCreateCustomOrder}
              className="bg-white border border-[#0E6B63]/30 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                Create New Order (Auto-Creates Invoice)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Product / Service Type
                  </label>
                  <select
                    value={ordType}
                    onChange={(e) =>
                      setOrdType(e.target.value as PlatformOrder['productType'])
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    {ALL_PRODUCT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Plan / Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={ordPlan}
                    onChange={(e) => setOrdPlan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Domain / Hostname *
                  </label>
                  <input
                    type="text"
                    required
                    value={ordHost}
                    onChange={(e) => setOrdHost(e.target.value)}
                    placeholder="portal.clientdomain.com"
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={ordCycle}
                    onChange={(e) => {
                      const c = e.target.value as PlatformOrder['billingCycle'];
                      setOrdCycle(c);
                      setOrdDueDate(addCycleToIsoDate(ordRegDate, c));
                    }}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="5-Year">5-Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    USD Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ordAmount}
                    onChange={(e) => setOrdAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Order / Registration Date
                  </label>
                  <input
                    type="date"
                    value={ordRegDate}
                    onChange={(e) => {
                      setOrdRegDate(e.target.value);
                      setOrdDueDate(addCycleToIsoDate(e.target.value, ordCycle));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Invoice Due Date
                  </label>
                  <input
                    type="date"
                    value={ordDueDate}
                    onChange={(e) => setOrdDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#CBD5E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Order &amp; Invoice Status
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={ordStatus}
                      onChange={(e) =>
                        setOrdStatus(e.target.value as OrderStatus)
                      }
                      className="w-1/2 px-2 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ordInvoicePaid}
                        onChange={(e) => setOrdInvoicePaid(e.target.checked)}
                        className="rounded border-slate-300 text-[#0E6B63]"
                      />
                      <span>Mark Paid</span>
                    </label>
                  </div>
                </div>
              </div>
              {ordError && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {ordError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrder(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                >
                  Create Order &amp; Invoice
                </button>
              </div>
            </form>
          )}

          {(creatingClientInvoice || editingClientInvoice) && (
            <AdminInvoiceEditor
              invoice={creatingClientInvoice ? null : editingClientInvoice}
              defaultClientEmail={user.email}
              onClose={() => {
                setCreatingClientInvoice(false);
                setEditingClientInvoiceId(null);
              }}
              onShowToast={onShowToast}
            />
          )}

          {/* Invoices Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-[#0F172A] inline-flex items-center gap-2">
                <CreditCard
                  className="w-4 h-4 text-[#0E6B63]"
                  aria-hidden="true"
                />
                <span>Invoices Ledger ({clientInvoices.length})</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500">
                  Due Balance: {formatPrice(unpaidInvoiceTotal)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingClientInvoiceId(null);
                    setCreatingClientInvoice(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>New Invoice</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Order / Items</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Settlement &amp; Edit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {clientInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-slate-500"
                      >
                        No invoices generated for this client yet.
                      </td>
                    </tr>
                  ) : (
                    clientInvoices.map((inv: PlatformInvoice) => (
                      <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F172A] whitespace-nowrap">
                          {inv.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0F172A] block">
                            {inv.planName}
                            {inv.items && inv.items.length > 1 && (
                              <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                +{inv.items.length - 1} items
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {inv.orderId ? `${inv.orderId} · ` : ''}
                            {inv.domainOrHost}
                            {inv.transactionRef ? ` · TID: ${inv.transactionRef}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {inv.issuedDate}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {inv.dueDate}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A] whitespace-nowrap">
                          {formatPrice(inv.amountUsd)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusChip
                            tone={invoiceStatusTone(inv.status)}
                            label={inv.status.toUpperCase()}
                          />
                          {inv.refundStatus && inv.refundStatus !== 'none' && (
                            <span className="block mt-1 text-[10px] font-semibold text-[#0E6B63]">
                              Refund: {inv.refundStatus.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCreatingClientInvoice(false);
                              setEditingClientInvoiceId(inv.id);
                            }}
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
                          {inv.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                adminUpdateInvoiceStatus(
                                  inv.id,
                                  'paid',
                                  inv.paymentMethod && inv.paymentMethod !== 'Invoice Pending'
                                    ? inv.paymentMethod
                                    : 'Admin Staff Settlement'
                                );
                                onShowToast(
                                  `Invoice ${inv.id} marked Paid & linked service activated`
                                );
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#16A34A] border border-[#16A34A]/30 hover:bg-[#16A34A]/10 rounded cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          )}
                          {inv.status === 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                adminUpdateInvoiceStatus(inv.id, 'unpaid');
                                onShowToast(`Invoice ${inv.id} reverted to Unpaid`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#D97706] border border-[#D97706]/30 hover:bg-amber-50 rounded cursor-pointer"
                            >
                              Mark Unpaid
                            </button>
                          )}
                          {inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                adminUpdateInvoiceStatus(inv.id, 'cancelled');
                                onShowToast(`Invoice ${inv.id} cancelled`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders History Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0]">
              <h3 className="font-display text-sm font-bold text-[#0F172A] inline-flex items-center gap-2">
                <ShoppingBag
                  className="w-4 h-4 text-[#0E6B63]"
                  aria-hidden="true"
                />
                <span>All Client Orders ({clientOrders.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Product &amp; Domain</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4">Reg Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {clientOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-slate-500"
                      >
                        No orders recorded for this account.
                      </td>
                    </tr>
                  ) : (
                    clientOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-mono font-semibold text-[#0F172A]">
                          {ord.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0F172A] block">
                            {ord.planName}
                          </span>
                          <span className="font-mono text-[11px] text-[#0E6B63]">
                            {ord.domainOrHost}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {ord.billingCycle}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {ord.createdAt.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {ord.nextDueDate || 'Auto'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#0F172A]">
                          {formatPrice(ord.amountUsd)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusChip
                            tone={orderStatusTone(ord.status)}
                            label={ord.status.toUpperCase()}
                          />
                          {ord.cancellationStatus && ord.cancellationStatus !== 'none' && (
                            <span className="block mt-1 text-[10px] font-semibold text-[#D97706]">
                              Cancel: {ord.cancellationStatus.toUpperCase()}
                            </span>
                          )}
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

      {/* ===================================================================== */}
      {/* TAB 5: SUPPORT TICKETS (VIEW THREAD + CREATE FOR CLIENT)              */}
      {/* ===================================================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Client Support Tickets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Open new staff-initiated tickets for this client or jump directly into active support threads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateTicket((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {showCreateTicket ? 'Close Form' : 'Create Ticket for Client'}
              </span>
            </button>
          </div>

          {showCreateTicket && (
            <form
              onSubmit={handleCreateClientTicket}
              className="bg-white border border-[#0E6B63]/30 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-display text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-3">
                New Support Ticket — {user.name} ({user.email})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    value={tktDept}
                    onChange={(e) =>
                      setTktDept(e.target.value as TicketDepartment)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    {TICKET_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={tktPriority}
                    onChange={(e) =>
                      setTktPriority(e.target.value as TicketPriority)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={tktStatus}
                    onChange={(e) =>
                      setTktStatus(e.target.value as TicketStatus)
                    }
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="pending">Pending Client Reply</option>
                    <option value="open">Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Related Service / Domain
                  </label>
                  <select
                    value={tktRelatedService}
                    onChange={(e) => setTktRelatedService(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg bg-white"
                  >
                    <option value="">General Account Inquiry</option>
                    {clientOrders.map((ord) => (
                      <option key={ord.id} value={ord.domainOrHost}>
                        {ord.domainOrHost} ({ord.productType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ticket Subject *
                </label>
                <input
                  type="text"
                  required
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  placeholder="e.g., DNS verification notice or cPanel migration update"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Message to Client *
                </label>
                <textarea
                  rows={4}
                  required
                  value={tktMessage}
                  onChange={(e) => setTktMessage(e.target.value)}
                  placeholder="Write detailed engineering notes or billing instructions for the client..."
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={tktFileRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_ATTACHMENT_TYPES}
                    onChange={(e) => handleTicketFiles(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => tktFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Attach File / Screenshot</span>
                  </button>
                  {tktAttachments.map((att) => (
                    <span
                      key={att.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-slate-100 rounded border border-slate-200"
                    >
                      <FileText className="w-3 h-3" aria-hidden="true" />
                      <span className="max-w-[140px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTktAttachments((prev) =>
                            prev.filter((x) => x.id !== att.id)
                          )
                        }
                        aria-label="Remove attachment"
                        className="text-slate-400 hover:text-[#DC2626] cursor-pointer"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateTicket(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
                  >
                    Dispatch Ticket to Client
                  </button>
                </div>
              </div>
              {tktError && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {tktError}
                </p>
              )}
            </form>
          )}

          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Ticket #</th>
                    <th className="py-3 px-4">Subject &amp; Service</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {clientTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-slate-500"
                      >
                        No support tickets recorded for {user.name}.
                      </td>
                    </tr>
                  ) : (
                    clientTickets.map((tkt: SupportTicketRecord) => (
                      <tr key={tkt.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-mono font-bold text-[#0E6B63] whitespace-nowrap">
                          {tkt.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0F172A] block">
                            {tkt.subject}
                          </span>
                          {tkt.relatedService && (
                            <span className="font-mono text-[11px] text-slate-500">
                              {tkt.relatedService}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {tkt.department}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              tkt.priority === 'Urgent'
                                ? 'text-[#DC2626]'
                                : tkt.priority === 'High'
                                  ? 'text-[#D97706]'
                                  : 'text-slate-600'
                            }`}
                          >
                            {tkt.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                          {tkt.updatedAtUtc}
                        </td>
                        <td className="py-3 px-4">
                          <StatusChip
                            tone={
                              tkt.status === 'resolved'
                                ? 'emerald'
                                : tkt.status === 'pending'
                                  ? 'amber'
                                  : 'teal'
                            }
                            label={
                              tkt.status === 'resolved'
                                ? 'Resolved'
                                : tkt.status === 'pending'
                                  ? 'Pending'
                                  : 'Open'
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenTicket(tkt.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0E6B63] border border-[#0E6B63]/30 hover:bg-[#F2FAF8] rounded cursor-pointer"
                          >
                            <span>View Thread</span>
                            <ExternalLink
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                          </button>
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
    </div>
  );
};
