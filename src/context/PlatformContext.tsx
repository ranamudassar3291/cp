import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  generateBackupCodes,
  generateSupportPin,
  verifyTotpCode,
} from '../utils/totpSecurity';
import {
  EmailTemplateRecord,
  INITIAL_EMAIL_TEMPLATES,
  renderEmailMergeText,
} from '../data/defaultEmailTemplates';
import {
  addYearsToIso,
  diffDaysIso,
  generateDeterministicEppCode,
  generateFreshEppCode,
  getTodayIsoUtc,
  ICANN_TRANSFER_LOCK_DAYS,
  isDomainOrderRecord,
  parseIsoDateOnly,
} from '../utils/domainLifecycle';

export type { EmailTemplateRecord };

export type UserRole = 'admin' | 'reseller' | 'client';
export type UserAccountStatus =
  | 'active'
  | 'pending_kyc'
  | 'suspended'
  | 'cancelled';

export interface AuthSessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserAccountStatus;
  country: string;
  signedInAt: string;
}

export const ENCRYPTED_SECRET_MASK = '••••••••ENCRYPTED••••••••';

export interface IpSecurityRecord {
  ipAddress: string;
  trialCount: number;
  trialEmails: string[];
  firstTrialOrderId: string | null;
  firstTrialAt: string | null;
  blocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  updatedAt: string;
}

export interface ManagedUserAccount {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  referralSource?: string;
  passwordSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  supportPin?: { pin: string; createdAtUtc: string };
  company: string;
  country: string;
  role: UserRole;
  status: UserAccountStatus;
  kycVerified: boolean;
  emailVerified?: boolean;
  emailVerifiedAtUtc?: string;
  freeTrialClaimed?: boolean;
  signupIp?: string;
  lastIp?: string;
  termsAcceptedAtUtc?: string;
  activeServices: number;
  totalSpendUsd: number;
  createdAt: string;
  lastLoginAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'refunded'
  | 'cancelled'
  | 'expired'
  | 'transferred';

export type CancellationStatus =
  | 'none'
  | 'requested'
  | 'approved'
  | 'completed'
  | 'rejected';

export type CancellationType = 'immediate' | 'end_of_period';

export type RefundStatus =
  | 'none'
  | 'requested'
  | 'approved'
  | 'processed'
  | 'rejected';

export interface TldExtensionRecord {
  id: string;
  tld: string;
  description: string;
  minYears: 1 | 2;
  year1Usd: number;
  year2Usd: number;
  renewalUsd: number;
  transferUsd: number;
  popular: boolean;
  enabled: boolean;
  registrarModuleId?: string;
  updatedAtUtc: string;
}

export type ProvisioningModuleType = 'whm' | 'stackcp' | 'proxmox' | 'registrar';

export interface ProvisioningModuleRecord {
  id: string;
  name: string;
  moduleType: ProvisioningModuleType;
  hostname: string;
  port: number;
  useSsl: boolean;
  username: string;
  apiToken: string;
  ignoreSslErrors: boolean;
  nameservers: [string, string];
  autoProvisionEnabled: boolean;
  enabled: boolean;
  packages: string[];
  lastConnectionStatus: 'untested' | 'connected' | 'error';
  lastConnectionMessage?: string;
  lastWhmVersion?: string;
  lastTestedAtUtc?: string;
  updatedAtUtc: string;
}

export type ManagedPlanCategory =
  | 'shared-hosting'
  | 'cpanel-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'reseller-hosting'
  | 'vps-hosting'
  | 'n8n-hosting';

export interface ManagedHostingPlanRecord {
  id: string;
  pageCategory: ManagedPlanCategory;
  name: string;
  tagline: string;
  audience: string;
  monthlyPrice: number;
  yearlyPrice: number;
  twoYearPrice?: number;
  fourYearPrice?: number;
  renewalPrice: number;
  storage: string;
  bandwidth: string;
  ssl: string;
  backups: string;
  features: string[];
  popular: boolean;
  enabled: boolean;
  autoProvision: boolean;
  serverModuleId: string;
  serverPackageName: string;
  updatedAtUtc: string;
}

export interface SystemSmtpSettings {
  enabled: boolean;
  providerLabel: string;
  host: string;
  port: number;
  encryption: 'ssl' | 'tls' | 'none';
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  configured?: boolean;
  lastVerifiedAtUtc?: string;
  lastTestStatus?: 'untested' | 'verified' | 'error';
  lastTestMessage?: string;
}

export function isSmtpConfigured(smtp?: SystemSmtpSettings | null): boolean {
  if (!smtp?.enabled) return false;
  if (smtp.configured) return true;
  return Boolean(smtp.host?.trim() && smtp.username?.trim() && smtp.password);
}

export interface SystemGoogleOAuthSettings {
  enabled: boolean;
  clientId: string;
  apiKey: string;
  clientSecret: string;
  buttonLabel: string;
  allowAutoRegister: boolean;
}

export interface SystemAdminAlertSettings {
  enabled: boolean;
  alertEmail: string;
  notifyNewOrder: boolean;
  notifyNewTicket: boolean;
  notifyNameserverRequest: boolean;
  notifyDomainEvents: boolean;
}

export interface SystemIntegrationSettings {
  smtp: SystemSmtpSettings;
  googleOAuth: SystemGoogleOAuthSettings;
  adminAlerts: SystemAdminAlertSettings;
  updatedAtUtc: string;
}

export type OrderBillingPeriod =
  | '1 Month'
  | '1 Year'
  | '2 Years'
  | '4 Years'
  | 'Monthly'
  | 'Yearly'
  | '5-Year';

export type PromoCodeScope = 'hosting' | 'domain';
export type PromoDiscountType = 'percent' | 'fixed';

export interface PromoCodeRecord {
  id: string;
  code: string;
  description: string;
  scope: PromoCodeScope;
  discountType: PromoDiscountType;
  discountValue: number;
  applicableItems: string[];
  applicableCycles: string[];
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  enabled: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface LastSearchedDomain {
  domain: string;
  tld: string;
  available: boolean;
  priceUsd: number;
  renewalUsd: number;
  minYears: 1 | 2;
  mode: 'register' | 'transfer';
  eppAuthCode?: string;
  searchedAtUtc: string;
}

export interface DomainContactAddress {
  id: string;
  ownerEmail: string;
  label: string;
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  countryCode: string;
  countryName: string;
  stateProvince: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
  createdAtUtc: string;
}

export interface DomainDnsRecord {
  id: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface ServerCustomConfig {
  serverType: 'vps' | 'n8n';
  osCategory: 'plain-os' | 'os-panel' | 'app-docker' | 'n8n-stack';
  osId: string;
  osName: string;
  osVersion: string;
  controlPanelOrStack: string;
  datacenterId: 'uk' | 'us' | 'sg' | 'eu';
  datacenterLabel: string;
  storageMode?: 'NVMe High-IOPS' | 'SSD High-Capacity';
  hostname: string;
  authMode: 'password' | 'ssh' | 'both';
  sshKeyLabel?: string;
  sshPublicKey?: string;
  rootPasswordConfigured?: boolean;
  backupAddon?: 'none' | 'weekly-snapshots' | 'daily-backups';
  backupAddonLabel?: string;
  backupAddonMonthlyUsd?: number;
  dedicatedIpAddon?: boolean;
  dedicatedIpMonthlyUsd?: number;
  firewallShieldAddon?: boolean;
  firewallShieldMonthlyUsd?: number;
  customEnvNote?: string;
}

export interface OrderCheckoutDraft {
  orderCategory?:
    | 'catalog'
    | 'free-trial'
    | 'shared-hosting'
    | 'wordpress-hosting'
    | 'windows-hosting'
    | 'cpanel-hosting'
    | 'reseller-hosting'
    | 'vps-hosting'
    | 'n8n-hosting'
    | 'domain-registration'
    | 'domain-transfer';
  planId: string;
  planName: string;
  productType: PlatformOrder['productType'];
  billingCycle: '1 Month' | '1 Year' | '2 Years' | '4 Years';
  datacenterId: 'uk' | 'us' | 'sg' | 'eu';
  datacenterLabel: string;
  domainOption: 'register' | 'existing' | 'later' | 'transfer';
  domainName: string;
  domainTld?: string;
  domainYears?: 1 | 2;
  domainPriceUsd?: number;
  promoCode?: string;
  isFreeTrial?: boolean;
  trialDays?: number;
  serverConfig?: ServerCustomConfig;
  nameserversType?: 'default' | 'custom';
  nameservers?: string[];
  whoisPrivacy?: boolean;
  whoisContactId?: string;
  eppAuthCode?: string;
  domainUnlockedConfirmed?: boolean;
  preselectedFromSite?: boolean;
  domainSearchedFromSite?: boolean;
  step: 1 | 2 | 3 | 4;
  sourceOrigin?: 'public' | 'dashboard';
  updatedAtUtc: string;
}

export interface PlatformOrder {
  id: string;
  clientEmail: string;
  clientName: string;
  country: string;
  productType:
    | 'cPanel Hosting'
    | 'Shared Cloud'
    | 'Managed WordPress'
    | 'Windows Hosting'
    | 'Reseller Hosting'
    | 'Unmanaged VPS'
    | 'n8n Hosting'
    | 'Domain Registration'
    | 'Domain Transfer';
  planName: string;
  domainOrHost: string;
  billingCycle: OrderBillingPeriod;
  amountUsd: number;
  status: OrderStatus;
  paymentMethod: string;
  datacenter: string;
  createdAt: string;
  notes?: string;
  autoRenew?: boolean;
  invoicePaid?: boolean;
  nextDueDate?: string;
  nameservers?: string[];
  registrarLock?: boolean;
  whoisPrivacy?: boolean;
  eppCode?: string;
  whoisContact?: DomainContactAddress;
  dnsRecords?: DomainDnsRecord[];
  serverIp?: string;
  cpanelUsername?: string;
  controlPanelUrl?: string;
  controlPanelPassword?: string;
  serverModuleId?: string;
  serverPackageName?: string;
  linkedFreeDomainOrderId?: string;
  linkedHostingOrderId?: string;
  promoCode?: string;
  discountUsd?: number;
  isFreeTrial?: boolean;
  trialDays?: number;
  recurringMonthlyUsd?: number;
  trialConvertedAtUtc?: string;
  serverConfig?: ServerCustomConfig;
  transactionRef?: string;
  paymentSubmittedAt?: string;
  paymentDetailsNote?: string;
  cancellationStatus?: CancellationStatus;
  cancellationType?: CancellationType;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationReviewedAt?: string;
  cancellationAdminNote?: string;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundAmountUsd?: number;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundAdminNote?: string;
  domainVerificationStatus?:
    | 'pending_admin_approval'
    | 'pending_contact_verification'
    | 'verified';
  domainVerificationToken?: string;
  domainContactVerifiedAt?: string;
  pendingNameservers?: string[];
  nameserverUpdateStatus?: 'idle' | 'pending_update' | 'updated';
  nameserverRequestedAt?: string;
  nameserverUpdatedAt?: string;
  transferStatus?: 'pending_admin' | 'in_progress' | 'client_notified' | 'completed';
  transferStartedAt?: string;
  transferClientNotifiedAt?: string;
  transferCompletedAt?: string;
}

export type TicketDepartment =
  | 'Migration Site'
  | 'Technical Support'
  | 'Billing'
  | 'Account'
  | 'Support'
  | 'Abuse';

export type TicketPriority = 'Normal' | 'High' | 'Urgent';
export type TicketStatus = 'open' | 'pending' | 'resolved';

export interface TicketAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

export interface TicketMessage {
  id: string;
  authorName: string;
  authorRole: 'client' | 'support';
  body: string;
  timestampUtc: string;
  attachments?: TicketAttachment[];
}

export type LoginActivityStatus = 'success' | 'warning' | 'blocked';

export type InvoiceStatus =
  | 'paid'
  | 'unpaid'
  | 'pending'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export interface InvoiceLineItem {
  id: string;
  description: string;
  productType: PlatformOrder['productType'] | 'Custom Service' | 'Setup / Add-on';
  domainOrHost: string;
  billingCycle: PlatformOrder['billingCycle'] | 'One-Time';
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
}

export interface PlatformInvoice {
  id: string;
  orderId: string;
  clientEmail: string;
  clientName: string;
  productType: PlatformOrder['productType'];
  planName: string;
  domainOrHost: string;
  billingCycle: PlatformOrder['billingCycle'];
  items: InvoiceLineItem[];
  subtotalUsd: number;
  taxRatePercent: number;
  discountUsd: number;
  amountUsd: number;
  issuedDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentMethod: string;
  transactionRef?: string;
  paymentSubmittedAt?: string;
  paymentDetailsNote?: string;
  paidAt?: string;
  notes?: string;
  datacenter?: string;
  promoCode?: string;
  isFreeTrial?: boolean;
  trialDays?: number;
  serverConfig?: ServerCustomConfig;
  autoGeneratedAt?: string;
  autoGeneratedTrigger?: 'order_created' | 'order_approved' | 'manual';
  cancellationStatus?: CancellationStatus;
  cancellationType?: CancellationType;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationReviewedAt?: string;
  cancellationAdminNote?: string;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundAmountUsd?: number;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundAdminNote?: string;
}

export type PaymentGatewayKind =
  | 'easypaisa'
  | 'jazzcash'
  | 'bank_transfer'
  | 'card'
  | 'paypal'
  | 'custom';

export interface PaymentMethodConfig {
  id: string;
  kind: PaymentGatewayKind;
  name: string;
  enabled: boolean;
  isSystem: boolean;
  accountTitle: string;
  accountNumber: string;
  ibanOrRouting: string;
  bankOrProviderName: string;
  currencyHint: string;
  instructions: string;
  requiresTransactionId: boolean;
  autoActivate: boolean;
  sortOrder: number;
  updatedAtUtc: string;
}

export interface InvoiceTemplateConfig {
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  taxVatId: string;
  accentColor: string;
  invoicePrefix: string;
  paperSize: 'A4' | 'Letter';
  defaultTaxRatePercent: number;
  paymentInstructions: string;
  footerNote: string;
  showPaidStamp: boolean;
  showTaxColumn: boolean;
  autoGenerateOnApproval: boolean;
  autoMarkPaidOnApproval: boolean;
  autoSendInvoiceEmailOnApproval: boolean;
  updatedAtUtc: string;
}

export interface AdminImpersonationState {
  adminId: string;
  adminName: string;
  adminEmail: string;
  targetUserId: string;
  targetUserName: string;
  startedAtUtc: string;
}

export type LoginActivityEventType =
  | 'Signed In'
  | 'Admin Portal Sign-In'
  | 'Admin Client Impersonation'
  | 'Unauthorized Admin Login Blocked'
  | '2FA Challenge Verified'
  | '2FA Backup Code Used'
  | 'Failed Login Attempt'
  | '2FA Verification Failed'
  | 'Account Locked (Rate Limit)'
  | 'Suspended Account Blocked'
  | 'Account Registered'
  | 'Two-Factor Auth Enabled'
  | 'Two-Factor Auth Disabled'
  | 'Support PIN Regenerated'
  | 'Password Changed by Admin'
  | 'Service/Domain Transferred'
  | 'Invoice Auto-Generated'
  | 'WHOIS Contact Verified'
  | 'WHM Account Auto-Suspended'
  | 'WHM Account Unsuspended'
  | 'WHM State Sync Warning'
  | 'Service Auto-Suspended (Due Date)'
  | 'Email Verification Code Sent'
  | 'Email Address Verified'
  | 'Abuse Ticket Issued'
  | 'Signed Out';

export interface LoginActivityRecord {
  id: string;
  userEmail: string;
  userName: string;
  eventType: LoginActivityEventType;
  status: LoginActivityStatus;
  authMethod: string;
  deviceSummary: string;
  ipAddress: string;
  locationLabel: string;
  timestampUtc: string;
}

export type CmsPageCategory =
  | 'Home & Core'
  | 'Hosting & Cloud'
  | 'Domains & Support'
  | 'Legal & Policy'
  | 'Custom Page';

export interface CmsSectionItem {
  id: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CmsFaqItem {
  question: string;
  answer: string;
}

export interface CmsPageRecord {
  id: string;
  slug: string;
  navTitle: string;
  category: CmsPageCategory;
  status: 'published' | 'draft';
  isSystemPage: boolean;
  seoTitle: string;
  seoDescription: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  highlights: string[];
  sections: CmsSectionItem[];
  faqItems?: CmsFaqItem[];
  showInHeaderMenu?: boolean;
  showInFooter?: boolean;
  updatedAtUtc: string;
  updatedBy: string;
}

export interface CmsSiteSettings {
  announcementEnabled: boolean;
  announcementText: string;
  announcementCtaText: string;
  announcementCtaUrl: string;
  supportEmail: string;
  footerTagline: string;
  footerCopyright: string;
}

export interface SupportTicketRecord {
  id: string;
  clientEmail: string;
  clientName: string;
  subject: string;
  department: TicketDepartment;
  priority: TicketPriority;
  status: TicketStatus;
  relatedService?: string;
  supportPinUsed?: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  messages: TicketMessage[];
}

export type AbuseStatus =
  | 'open'
  | 'investigating'
  | 'suspended_target'
  | 'resolved'
  | 'dismissed';

export type AbuseSeverity = 'P0 Critical' | 'P1 High' | 'P2 Legal Notice';

export interface AbuseComplaintRecord {
  ticketId: string;
  category: string;
  categoryLabel: string;
  severity: AbuseSeverity;
  slaTarget: string;
  targetResource: string;
  reporterName: string;
  organization: string;
  reporterEmail: string;
  country: string;
  incidentUtc: string;
  evidenceDetails: string;
  submittedAtUtc: string;
  status: AbuseStatus;
  moderatorNotes: string;
  moderatedBy?: string;
  updatedAtUtc?: string;
}

interface PlatformContextValue {
  currentUser: AuthSessionUser | null;
  isAdmin: boolean;
  adminImpersonation: AdminImpersonationState | null;
  rememberedIdentifier: string;
  pendingTwoFactor: { email: string; name: string } | null;
  activeSupportPin: { pin: string; createdAtUtc: string } | null;
  users: ManagedUserAccount[];
  orders: PlatformOrder[];
  invoices: PlatformInvoice[];
  tickets: SupportTicketRecord[];
  abuseComplaints: AbuseComplaintRecord[];
  loginActivityLogs: LoginActivityRecord[];
  cmsPages: CmsPageRecord[];
  cmsSiteSettings: CmsSiteSettings;
  paymentMethods: PaymentMethodConfig[];
  emailTemplates: EmailTemplateRecord[];
  invoiceTemplateConfig: InvoiceTemplateConfig;
  tldExtensions: TldExtensionRecord[];
  provisioningModules: ProvisioningModuleRecord[];
  hostingPlans: ManagedHostingPlanRecord[];
  systemSettings: SystemIntegrationSettings;
  promoCodes: PromoCodeRecord[];
  ipSecurityRecords: IpSecurityRecord[];
  dbSyncedAtUtc: string | null;
  orderCheckoutDraft: OrderCheckoutDraft | null;
  lastSearchedDomain: LastSearchedDomain | null;
  pendingPostAuthPath: string | null;
  loginWithCredentials: (
    identifier: string,
    passphrase: string,
    rememberMe?: boolean,
    portal?: 'client' | 'admin'
  ) => Promise<{
    ok: boolean;
    requiresTwoFactor?: boolean;
    requiresEmailVerification?: boolean;
    unverifiedEmail?: string;
    error?: string;
    lockedSeconds?: number;
    user?: AuthSessionUser;
  }>;
  signInWithGoogle: (input: {
    email: string;
    name: string;
    googleSub?: string;
    country?: string;
    token?: string;
  }) => Promise<{
    ok: boolean;
    error?: string;
    user?: AuthSessionUser;
    isNewAccount?: boolean;
  }>;
  verifyTwoFactorChallenge: (codeOrBackup: string) => Promise<{
    ok: boolean;
    error?: string;
    user?: AuthSessionUser;
  }>;
  cancelTwoFactorChallenge: () => void;
  enableTwoFactorAuth: (
    secret: string,
    code: string
  ) => Promise<{ ok: boolean; error?: string; backupCodes?: string[] }>;
  disableTwoFactorAuth: (codeOrPassword: string) => Promise<{
    ok: boolean;
    error?: string;
  }>;
  regenerateTwoFactorBackupCodes: () => string[];
  rotateSupportPin: () => { pin: string; createdAtUtc: string } | null;
  adminResetUserSupportPin: (
    userId: string
  ) => { pin: string; createdAtUtc: string } | null;
  clearMyLoginLogs: () => void;
  logout: () => void;
  createUserAccount: (input: {
    name: string;
    email: string;
    company?: string;
    country: string;
    role: UserRole;
    password?: string;
  }) => { ok: boolean; error?: string; user?: ManagedUserAccount };
  registerClientAccount: (input: {
    name: string;
    username: string;
    email: string;
    phone: string;
    country: string;
    referralSource: string;
    password: string;
    termsAcceptedAtUtc?: string;
    autoSignIn?: boolean;
    skipEmailOtp?: boolean;
  }) => Promise<{
    ok: boolean;
    error?: string;
    requiresEmailVerification?: boolean;
    emailSent?: boolean;
    smtpConfigured?: boolean;
    account?: { id: string; name: string; username: string; email: string; phone: string };
  }>;
  verifyRegistrationOtp: (
    email: string,
    code: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    user?: AuthSessionUser;
  }>;
  resendRegistrationOtp: (email: string) => Promise<{
    ok: boolean;
    error?: string;
    emailSent?: boolean;
    smtpConfigured?: boolean;
    cooldownSeconds?: number;
  }>;
  updateClientProfile: (updates: {
    name: string;
    company: string;
    phone: string;
    country: string;
  }) => { ok: boolean; error?: string };
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateUserStatus: (userId: string, status: UserAccountStatus) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserKyc: (userId: string) => void;
  adminUpdateUserProfile: (
    userId: string,
    updates: {
      name?: string;
      username?: string;
      email?: string;
      phone?: string;
      company?: string;
      country?: string;
      role?: UserRole;
      status?: UserAccountStatus;
      kycVerified?: boolean;
    }
  ) => { ok: boolean; error?: string };
  adminChangeUserPassword: (
    userId: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  adminResetUserTwoFactor: (userId: string) => void;
  updateOwnAdminCredentials: (input: {
    name: string;
    username: string;
    email: string;
    currentPassword: string;
    newPassword?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  createAdminAccount: (input: {
    name: string;
    username: string;
    email: string;
    password: string;
    company?: string;
    country?: string;
  }) => { ok: boolean; error?: string; account?: ManagedUserAccount };
  impersonateClientAccount: (userId: string) => {
    ok: boolean;
    error?: string;
    targetUserId?: string;
  };
  exitClientImpersonation: () => string | null;
  addOrder: (input: {
    clientEmail: string;
    clientName?: string;
    country?: string;
    productType: PlatformOrder['productType'];
    planName: string;
    domainOrHost: string;
    billingCycle: PlatformOrder['billingCycle'];
    amountUsd: number;
    paymentMethod?: string;
    datacenter?: string;
    status?: OrderStatus;
    customRef?: string;
    createdAt?: string;
    nextDueDate?: string;
    invoicePaid?: boolean;
    autoRenew?: boolean;
    nameservers?: string[];
    registrarLock?: boolean;
    whoisPrivacy?: boolean;
    serverIp?: string;
    cpanelUsername?: string;
    controlPanelUrl?: string;
    controlPanelPassword?: string;
    serverModuleId?: string;
    serverPackageName?: string;
    linkedFreeDomainOrderId?: string;
    linkedHostingOrderId?: string;
    promoCode?: string;
    discountUsd?: number;
    isFreeTrial?: boolean;
    trialDays?: number;
    recurringMonthlyUsd?: number;
    serverConfig?: ServerCustomConfig;
    transactionRef?: string;
    notes?: string;
    generateInvoice?: boolean;
    eppCode?: string;
    whoisContact?: DomainContactAddress;
    dnsRecords?: DomainDnsRecord[];
    transferStatus?: PlatformOrder['transferStatus'];
    transferStartedAt?: string;
  }) => { order: PlatformOrder; invoice: PlatformInvoice | null };
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
  approveOrderWithServer: (input: {
    orderId: string;
    serverModuleId: string;
    serverPackageName?: string;
    serverIp?: string;
    cpanelUsername?: string;
    controlPanelUrl?: string;
    controlPanelPassword?: string;
    nameservers?: string[];
    notes?: string;
  }) => {
    ok: boolean;
    error?: string;
    invoice?: PlatformInvoice;
    invoiceWasCreated?: boolean;
  };
  approveSharedHostingOrder: (input: {
    orderId: string;
    password: string;
    notes?: string;
  }) => {
    ok: boolean;
    error?: string;
    invoice?: PlatformInvoice;
  };
  generateInvoiceForOrder: (orderId: string) => {
    ok: boolean;
    error?: string;
    invoice?: PlatformInvoice;
    created?: boolean;
  };
  adminUpdateOrderDetails: (
    orderId: string,
    updates: {
      createdAt?: string;
      nextDueDate?: string;
      status?: OrderStatus;
      amountUsd?: number;
      billingCycle?: PlatformOrder['billingCycle'];
      planName?: string;
      domainOrHost?: string;
      datacenter?: string;
      serverIp?: string;
      cpanelUsername?: string;
      controlPanelUrl?: string;
      controlPanelPassword?: string;
      serverModuleId?: string;
      serverPackageName?: string;
      autoRenew?: boolean;
      nameservers?: string[];
      registrarLock?: boolean;
      whoisPrivacy?: boolean;
      notes?: string;
    }
  ) => { ok: boolean; error?: string };
  adminTransferOrderToClient: (
    orderId: string,
    targetUserId: string
  ) => { ok: boolean; error?: string };
  adminUpdateInvoiceStatus: (
    invoiceId: string,
    status: InvoiceStatus,
    paymentMethod?: string,
    transactionRef?: string
  ) => void;
  adminUpdateInvoiceFull: (
    invoiceId: string,
    updates: {
      issuedDate: string;
      dueDate: string;
      status: InvoiceStatus;
      paymentMethod: string;
      transactionRef?: string;
      taxRatePercent: number;
      discountUsd: number;
      notes?: string;
      items: InvoiceLineItem[];
    }
  ) => { ok: boolean; error?: string; invoice?: PlatformInvoice };
  adminCreateStandaloneInvoice: (input: {
    clientEmail: string;
    issuedDate: string;
    dueDate: string;
    status: InvoiceStatus;
    paymentMethod: string;
    transactionRef?: string;
    taxRatePercent: number;
    discountUsd: number;
    notes?: string;
    items: InvoiceLineItem[];
  }) => { ok: boolean; error?: string; invoice?: PlatformInvoice };
  saveInvoiceTemplateConfig: (updates: Partial<InvoiceTemplateConfig>) => void;
  savePaymentMethod: (
    methodId: string,
    updates: Partial<Omit<PaymentMethodConfig, 'id' | 'isSystem'>>
  ) => { ok: boolean; error?: string };
  createPaymentMethod: (input: {
    name: string;
    kind?: PaymentGatewayKind;
    accountTitle: string;
    accountNumber: string;
    ibanOrRouting?: string;
    bankOrProviderName?: string;
    currencyHint?: string;
    instructions: string;
    requiresTransactionId?: boolean;
    autoActivate?: boolean;
    enabled?: boolean;
  }) => { ok: boolean; error?: string; method?: PaymentMethodConfig };
  deletePaymentMethod: (methodId: string) => { ok: boolean; error?: string };
  togglePaymentMethod: (methodId: string) => void;
  saveEmailTemplate: (
    templateId: string,
    updates: Partial<Omit<EmailTemplateRecord, 'id' | 'isSystem' | 'key'>>
  ) => { ok: boolean; error?: string };
  createEmailTemplate: (input: {
    name: string;
    category: EmailTemplateRecord['category'];
    description: string;
    subject: string;
    preheader: string;
    heading: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
    footerNote: string;
  }) => { ok: boolean; error?: string; template?: EmailTemplateRecord };
  deleteEmailTemplate: (templateId: string) => { ok: boolean; error?: string };
  resetEmailTemplate: (templateId: string) => void;
  updateClientOrderSettings: (
    orderId: string,
    updates: Partial<
      Pick<
        PlatformOrder,
        'autoRenew' | 'nameservers' | 'registrarLock' | 'whoisPrivacy' | 'status' | 'notes'
      >
    >
  ) => void;
  domainContactAddresses: DomainContactAddress[];
  saveDomainContactAddress: (
    input: Omit<DomainContactAddress, 'id' | 'ownerEmail' | 'createdAtUtc'> & { id?: string }
  ) => { ok: boolean; error?: string; address?: DomainContactAddress };
  deleteDomainContactAddress: (addressId: string) => void;
  setDefaultDomainContactAddress: (addressId: string) => void;
  updateDomainTransferLock: (
    orderId: string,
    locked: boolean
  ) => { ok: boolean; error?: string };
  regenerateDomainEppCode: (
    orderId: string
  ) => { ok: boolean; error?: string; eppCode?: string };
  updateDomainDnsRecords: (
    orderId: string,
    records: DomainDnsRecord[]
  ) => { ok: boolean; error?: string };
  updateDomainWhoisContact: (
    orderId: string,
    contact: DomainContactAddress
  ) => { ok: boolean; error?: string };
  approveDomainRegistrationAndSendVerify: (orderId: string) => {
    ok: boolean;
    error?: string;
    verifyUrl?: string;
    token?: string;
  };
  verifyDomainContactByToken: (
    orderId: string,
    token: string
  ) => { ok: boolean; error?: string; order?: PlatformOrder };
  resendDomainVerificationEmail: (orderId: string) => Promise<{
    ok: boolean;
    error?: string;
    verifyUrl?: string;
    emailSent?: boolean;
  }>;
  requestDomainNameserverChange: (
    orderId: string,
    ns1OrList: string | string[],
    ns2?: string
  ) => { ok: boolean; error?: string };
  adminApplyNameserverChange: (
    orderId: string
  ) => { ok: boolean; error?: string };
  adminStartDomainTransfer: (
    orderId: string
  ) => { ok: boolean; error?: string };
  clientNotifyDomainTransferApproved: (
    orderId: string
  ) => { ok: boolean; error?: string };
  adminCompleteDomainTransfer: (
    orderId: string,
    viaSevenDayAllow?: boolean
  ) => { ok: boolean; error?: string };
  payClientOrderInvoice: (
    orderOrInvoiceId: string,
    paymentMethod: string,
    options?: { transactionRef?: string; paymentDetailsNote?: string }
  ) => { status: InvoiceStatus } | void;
  requestOrderCancellation: (
    orderId: string,
    input: { type: CancellationType; reason: string }
  ) => { ok: boolean; error?: string };
  adminHandleCancellation: (
    orderId: string,
    decision: 'approved' | 'completed' | 'rejected',
    adminNote?: string
  ) => { ok: boolean; error?: string };
  requestInvoiceRefund: (
    invoiceId: string,
    input: { reason: string; amountUsd?: number }
  ) => { ok: boolean; error?: string };
  adminProcessRefund: (
    invoiceId: string,
    decision: 'approved' | 'processed' | 'rejected',
    options?: { refundAmountUsd?: number; note?: string }
  ) => { ok: boolean; error?: string };
  createSupportTicket: (input: {
    subject: string;
    department: TicketDepartment;
    priority: TicketPriority;
    relatedService?: string;
    message: string;
    attachments?: TicketAttachment[];
  }) => SupportTicketRecord | null;
  adminCreateTicketForClient: (input: {
    userId: string;
    department: TicketDepartment;
    priority: TicketPriority;
    subject: string;
    message: string;
    relatedService?: string;
    status?: TicketStatus;
    attachments?: TicketAttachment[];
  }) => { ok: boolean; error?: string; ticket?: SupportTicketRecord };
  adminCreateAbuseTicketAndNotify: (input: {
    userId?: string;
    clientEmail?: string;
    relatedService?: string;
    subject: string;
    message: string;
    priority?: TicketPriority;
    suspendMatchingService?: boolean;
    abuseCaseTicketId?: string;
  }) => Promise<{
    ok: boolean;
    error?: string;
    ticket?: SupportTicketRecord;
    emailSent?: boolean;
  }>;
  replySupportTicket: (
    ticketId: string,
    message: string,
    attachments?: TicketAttachment[]
  ) => void;
  resolveSupportTicket: (ticketId: string) => void;
  reopenSupportTicket: (ticketId: string) => void;
  closeSupportTicket: (ticketId: string) => void;
  replyTicketAsAdmin: (
    ticketId: string,
    message: string,
    attachments?: TicketAttachment[],
    nextStatus?: TicketStatus
  ) => { ok: boolean; error?: string };
  updateTicketByAdmin: (
    ticketId: string,
    updates: {
      status?: TicketStatus;
      priority?: TicketPriority;
      department?: TicketDepartment;
    }
  ) => void;
  saveCmsPage: (
    pageId: string,
    updates: Partial<Omit<CmsPageRecord, 'id' | 'isSystemPage'>>
  ) => { ok: boolean; error?: string };
  createCmsPage: (
    input: Omit<CmsPageRecord, 'id' | 'isSystemPage' | 'updatedAtUtc' | 'updatedBy'>
  ) => { ok: boolean; error?: string; page?: CmsPageRecord };
  deleteCmsPage: (pageId: string) => { ok: boolean; error?: string };
  resetSystemCmsPage: (pageId: string) => void;
  updateCmsSiteSettings: (updates: Partial<CmsSiteSettings>) => void;
  submitAbuseComplaint: (input: {
    ticketId?: string;
    category: string;
    categoryLabel: string;
    slaTarget: string;
    targetResource: string;
    reporterName: string;
    organization: string;
    reporterEmail: string;
    country: string;
    incidentUtc: string;
    evidenceDetails: string;
  }) => AbuseComplaintRecord;
  moderateAbuseComplaint: (
    ticketId: string,
    status: AbuseStatus,
    moderatorNotes: string,
    suspendMatchingOrders?: boolean
  ) => void;
  saveTldExtension: (
    tldId: string,
    updates: Partial<Omit<TldExtensionRecord, 'id'>>
  ) => { ok: boolean; error?: string };
  createTldExtension: (input: {
    tld: string;
    description: string;
    minYears: 1 | 2;
    year1Usd: number;
    year2Usd: number;
    renewalUsd: number;
    transferUsd: number;
    popular?: boolean;
    enabled?: boolean;
    registrarModuleId?: string;
  }) => { ok: boolean; error?: string; record?: TldExtensionRecord };
  deleteTldExtension: (tldId: string) => { ok: boolean; error?: string };
  createProvisioningModule: (input: {
    name: string;
    moduleType: ProvisioningModuleType;
    hostname: string;
    port: number;
    useSsl: boolean;
    username: string;
    apiToken: string;
    ignoreSslErrors: boolean;
    nameservers: [string, string];
    autoProvisionEnabled: boolean;
    packages?: string[];
  }) => { ok: boolean; error?: string; module?: ProvisioningModuleRecord };
  saveProvisioningModule: (
    moduleId: string,
    updates: Partial<Omit<ProvisioningModuleRecord, 'id'>>
  ) => { ok: boolean; error?: string };
  deleteProvisioningModule: (moduleId: string) => { ok: boolean; error?: string };
  saveHostingPlan: (
    planId: string,
    updates: Partial<Omit<ManagedHostingPlanRecord, 'id'>>
  ) => { ok: boolean; error?: string };
  createHostingPlan: (
    input: Omit<ManagedHostingPlanRecord, 'id' | 'updatedAtUtc'>
  ) => { ok: boolean; error?: string; plan?: ManagedHostingPlanRecord };
  deleteHostingPlan: (planId: string) => { ok: boolean; error?: string };
  saveSystemIntegrationSettings: (updates: {
    smtp?: Partial<SystemSmtpSettings>;
    googleOAuth?: Partial<SystemGoogleOAuthSettings>;
    adminAlerts?: Partial<SystemAdminAlertSettings>;
  }) => { ok: boolean; error?: string };
  createPromoCode: (input: {
    code: string;
    description: string;
    scope: PromoCodeScope;
    discountType: PromoDiscountType;
    discountValue: number;
    applicableItems: string[];
    applicableCycles: string[];
    maxUses: number;
    expiresAt: string;
    enabled?: boolean;
  }) => { ok: boolean; error?: string; promo?: PromoCodeRecord };
  savePromoCode: (
    promoId: string,
    updates: Partial<Omit<PromoCodeRecord, 'id' | 'createdAtUtc'>>
  ) => { ok: boolean; error?: string };
  deletePromoCode: (promoId: string) => { ok: boolean; error?: string };
  togglePromoCode: (promoId: string) => void;
  validatePromoCode: (input: {
    code: string;
    hostingPlanId?: string;
    hostingPlanName?: string;
    hostingCycle?: string;
    hostingSubtotalUsd?: number;
    domainTld?: string;
    domainSubtotalUsd?: number;
  }) => {
    ok: boolean;
    error?: string;
    promo?: PromoCodeRecord;
    discountUsd: number;
  };
  recordPromoCodeUsage: (code: string) => void;
  setOrderCheckoutDraft: (draft: OrderCheckoutDraft | null) => void;
  clearOrderCheckoutDraft: () => void;
  setLastSearchedDomain: (info: LastSearchedDomain | null) => void;
  setPendingPostAuthPath: (path: string | null) => void;
  runDueDateBillingSweep: () => { suspendedCount: number; expiredCount: number };
  resetOperationalDataForProduction: () => void;
  hasClientUsedFreeTrial: (email: string) => boolean;
  validateFreeTrialEligibility: (email: string) => Promise<{
    ok: boolean;
    allowed: boolean;
    ipBlocked?: boolean;
    accountSuspended?: boolean;
    error?: string;
  }>;
  adminToggleIpBlock: (
    ipAddress: string,
    blocked: boolean,
    reason?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  runAutomatedTrialBillingNow: () => Promise<{
    ok: boolean;
    convertedTrials?: number;
    generatedInvoices?: number;
    error?: string;
  }>;
}

const SESSION_KEY = 'cpcloud_admin_session_v1';
const IMPERSONATOR_KEY = 'cpcloud_admin_impersonator_v1';
const REMEMBER_ID_KEY = 'cpcloud_remember_identifier_v1';
const USERS_KEY = 'cpcloud_platform_users_v1';
const ORDERS_KEY = 'cpcloud_platform_orders_v1';
const INVOICES_KEY = 'cpcloud_platform_invoices_v1';
const TICKETS_KEY = 'cpcloud_platform_tickets_v1';
const ABUSE_KEY = 'cpcloud_platform_abuse_v1';
const LOGIN_LOGS_KEY = 'cpcloud_platform_login_logs_v1';
const CMS_PAGES_KEY = 'cpcloud_cms_pages_v1';
const CMS_SETTINGS_KEY = 'cpcloud_cms_settings_v1';
const PAYMENT_METHODS_KEY = 'cpcloud_payment_methods_v1';
const EMAIL_TEMPLATES_KEY = 'cpcloud_email_templates_v1';
const INVOICE_TEMPLATE_KEY = 'cpcloud_invoice_template_v1';
const TLD_EXTENSIONS_KEY = 'cpcloud_tld_extensions_v1';
const PROVISIONING_MODULES_KEY = 'cpcloud_modules_v1';
const HOSTING_PLANS_KEY = 'cpcloud_hosting_plans_v1';
const SYSTEM_SETTINGS_KEY = 'cpcloud_system_settings_v1';
const PROMO_CODES_KEY = 'cpcloud_promo_codes_v1';
const ORDER_DRAFT_KEY = 'cpcloud_order_draft_v1';
const LAST_SEARCHED_DOMAIN_KEY = 'cpcloud_last_searched_domain_v1';
const POST_AUTH_REDIRECT_KEY = 'cpcloud_post_auth_redirect_v1';
const DOMAIN_CONTACTS_KEY = 'cpcloud_domain_contacts_v1';
const EMAIL_OTP_STORAGE_KEY = 'cpcloud_pending_email_otp_v1';
const PROD_CLEANUP_KEY = 'cpcloud_prod_clean_v2';
const AUTH_TOKEN_KEY = 'cpcloud_auth_token_v1';

const LEGACY_FAKE_USER_IDS = new Set([
  'USR-1042',
  'USR-1089',
  'USR-1114',
  'USR-1156',
  'USR-1178',
]);
const LEGACY_FAKE_EMAILS = new Set([
  'tariq@lahorecommerce.pk',
  'client@acme-studios.co',
  'hannah@northwind.io',
  'billing@acme-studios.co',
]);
const LEGACY_FAKE_ORDER_IDS = new Set([
  'ORD-904310',
  'ORD-904288',
  'ORD-904274',
  'ORD-904155',
  'ORD-903842',
  'ORD-904218',
  'ORD-904195',
  'ORD-904177',
  'ORD-904132',
  'ORD-903988',
  'ORD-903910',
]);
const LEGACY_FAKE_TICKET_IDS = new Set(['TKT-48219', 'TKT-48104']);
const LEGACY_FAKE_ABUSE_IDS = new Set([
  'ABUSE-2026-884102',
  'ABUSE-2026-731509',
  'ABUSE-2026-441920',
]);
const LEGACY_FAKE_LOG_IDS = new Set(['LOG-849201', 'LOG-849174', 'LOG-849108']);
const LEGACY_FAKE_CONTACT_IDS = new Set(['ADDR-PK-1001', 'ADDR-UK-1002']);
const LEGACY_FAKE_MODULE_IDS = new Set([
  'mod-whm-uk01',
  'mod-stackcp-cloud',
  'mod-kvm-frankfurt',
]);

const INITIAL_PROMO_CODES: PromoCodeRecord[] = [
  {
    id: 'promo-host30',
    code: 'HOST30',
    description: '30% launch discount on Shared Cloud Hosting plans',
    scope: 'hosting',
    discountType: 'percent',
    discountValue: 30,
    applicableItems: ['plan-shared-ignite', 'plan-shared-velocity', 'plan-shared-horizon'],
    applicableCycles: ['1 Year', '2 Years', '4 Years'],
    maxUses: 500,
    usedCount: 42,
    expiresAt: '2027-12-31',
    enabled: true,
    createdAtUtc: '2026-04-01 09:00 UTC',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'promo-cloud10',
    code: 'CLOUD10',
    description: '10% recurring welcome discount across all hosting plans and billing periods',
    scope: 'hosting',
    discountType: 'percent',
    discountValue: 10,
    applicableItems: [],
    applicableCycles: [],
    maxUses: 0,
    usedCount: 18,
    expiresAt: '2027-12-31',
    enabled: true,
    createdAtUtc: '2026-04-01 09:00 UTC',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'promo-dom20',
    code: 'DOM20',
    description: '20% off first-term .com, .net, .org, and .pk domain registrations',
    scope: 'domain',
    discountType: 'percent',
    discountValue: 20,
    applicableItems: ['.com', '.net', '.org', '.pk'],
    applicableCycles: [],
    maxUses: 250,
    usedCount: 15,
    expiresAt: '2027-12-31',
    enabled: true,
    createdAtUtc: '2026-04-01 09:00 UTC',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'promo-startfree',
    code: 'STARTFREE',
    description: '30-Day Free Hosting Trial — 100% off first month ($0.00 due today) on Cloud Ignite, WP Core & WinCore Pro',
    scope: 'hosting',
    discountType: 'percent',
    discountValue: 100,
    applicableItems: [
      'plan-shared-ignite',
      'plan-wp-core',
      'plan-win-core',
      'Cloud Ignite',
      'WP Core',
      'WinCore Pro',
    ],
    applicableCycles: ['1 Month', 'Monthly'],
    maxUses: 0,
    usedCount: 0,
    expiresAt: '2028-12-31',
    enabled: true,
    createdAtUtc: '2026-11-17 09:00 UTC',
    updatedAtUtc: '2026-11-17 09:00 UTC',
  },
];

const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-easypaisa',
    kind: 'easypaisa',
    name: 'Easypaisa Mobile Wallet',
    enabled: true,
    isSystem: true,
    accountTitle: 'CPCloudHost Billing (Muhammad Mudassar)',
    accountNumber: '0345-5485400',
    ibanOrRouting: 'PK42TMFB0000000018492031',
    bankOrProviderName: 'Easypaisa / Telenor Microfinance Bank',
    currencyHint: 'PKR / USD Equivalent',
    instructions:
      'Open your Easypaisa App -> Send Money -> Easypaisa Transfer. Enter the wallet number above, verify Account Title, send the invoice total, and submit your 11-digit Transaction ID (TID) below for quick verification.',
    requiresTransactionId: true,
    autoActivate: false,
    sortOrder: 1,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'pm-jazzcash',
    kind: 'jazzcash',
    name: 'JazzCash Mobile Wallet',
    enabled: true,
    isSystem: true,
    accountTitle: 'CPCloudHost Billing (Muhammad Mudassar)',
    accountNumber: '0300-5485400',
    ibanOrRouting: 'PK79JCMA0000000092837104',
    bankOrProviderName: 'JazzCash / Mobilink Microfinance Bank',
    currencyHint: 'PKR / USD Equivalent',
    instructions:
      'Open JazzCash App or dial *786# -> Money Transfer -> JazzCash Account. Confirm Account Title before sending and enter your TID reference below so our Billing Desk activates your invoice.',
    requiresTransactionId: true,
    autoActivate: false,
    sortOrder: 2,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'pm-bank-wire',
    kind: 'bank_transfer',
    name: 'Bank Wire / IBAN Transfer',
    enabled: true,
    isSystem: true,
    accountTitle: 'CPCloudHost Infrastructure Ltd',
    accountNumber: '0184-0923811402',
    ibanOrRouting: 'PK88MEZN0001840923811402 / SWIFT: MEZNPKKA',
    bankOrProviderName: 'Meezan Bank / International SWIFT Wire',
    currencyHint: 'USD / GBP / EUR / PKR',
    instructions:
      'Include your Invoice Number (e.g. INV-2026-XXXX) in the payment narration and paste your Bank Reference / RRN number below.',
    requiresTransactionId: true,
    autoActivate: false,
    sortOrder: 3,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'pm-card',
    kind: 'card',
    name: 'Visa / Mastercard (Instant)',
    enabled: true,
    isSystem: true,
    accountTitle: 'CPCloudHost Merchant Processing',
    accountNumber: '**** **** **** 8842',
    ibanOrRouting: 'Stripe / 3D-Secure Instant Gateway',
    bankOrProviderName: 'International Card Acquirer',
    currencyHint: 'USD / Multi-Currency',
    instructions:
      'Instant automated settlement protected by 3D-Secure. Services and domains activate immediately after authorization.',
    requiresTransactionId: false,
    autoActivate: true,
    sortOrder: 4,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'pm-paypal',
    kind: 'paypal',
    name: 'PayPal Express Checkout',
    enabled: true,
    isSystem: true,
    accountTitle: 'CPCloudHost Global Billing',
    accountNumber: 'billing@cpcloudhost.com',
    ibanOrRouting: 'PayPal Verified Business',
    bankOrProviderName: 'PayPal Inc.',
    currencyHint: 'USD / EUR / GBP',
    instructions:
      'Instant checkout via PayPal balance or linked international debit/credit card.',
    requiresTransactionId: false,
    autoActivate: true,
    sortOrder: 5,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
];

const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplateConfig = {
  companyName: 'CPCloudHost',
  companyTagline: 'Global Cloud Hosting, KVM VPS & Registrar Infrastructure',
  companyEmail: 'billing@cpcloudhost.com',
  companyWebsite: 'https://cpcloudhost.com',
  companyAddress: 'Suite 410, 128 City Road, London EC1V 2NX, United Kingdom',
  taxVatId: 'GB-419-8824-90',
  accentColor: '#0E6B63',
  invoicePrefix: 'INV-',
  paperSize: 'A4',
  defaultTaxRatePercent: 0,
  paymentInstructions:
    'Settle online via Card, PayPal, Easypaisa, JazzCash, or Bank IBAN from your Client Portal. Quote your Invoice ID on all manual wallet transfers.',
  footerNote:
    'Thank you for hosting with CPCloudHost. Services remaining overdue past the due date are subject to automated suspension.',
  showPaidStamp: true,
  showTaxColumn: true,
  autoGenerateOnApproval: true,
  autoMarkPaidOnApproval: true,
  autoSendInvoiceEmailOnApproval: true,
  updatedAtUtc: '2026-04-01 09:00 UTC',
};

const INITIAL_TLD_EXTENSIONS: TldExtensionRecord[] = [
  {
    id: 'tld-com',
    tld: '.com',
    description: 'Worldwide commercial standard with WHOIS privacy, DNSSEC & Anycast DNS.',
    minYears: 1,
    year1Usd: 9.99,
    year2Usd: 19.98,
    renewalUsd: 14.99,
    transferUsd: 9.99,
    popular: true,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-pk',
    tld: '.pk',
    description: 'Official PKNIC Pakistan domain (minimum 2-year registry registration cycle).',
    minYears: 2,
    year1Usd: 16.99,
    year2Usd: 29.99,
    renewalUsd: 15.99,
    transferUsd: 29.99,
    popular: true,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-com-pk',
    tld: '.com.pk',
    description: 'PKNIC commercial Pakistan namespace (2-year minimum term).',
    minYears: 2,
    year1Usd: 16.99,
    year2Usd: 29.99,
    renewalUsd: 15.99,
    transferUsd: 29.99,
    popular: true,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-co-uk',
    tld: '.co.uk',
    description: 'Trusted British business domain with free cloud starter & Wildcard SSL.',
    minYears: 1,
    year1Usd: 6.99,
    year2Usd: 13.98,
    renewalUsd: 9.99,
    transferUsd: 6.99,
    popular: true,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-uk',
    tld: '.uk',
    description: 'Crisp UK domain extension paired with free DNSSEC & Anycast DNS.',
    minYears: 1,
    year1Usd: 7.99,
    year2Usd: 15.98,
    renewalUsd: 10.99,
    transferUsd: 7.99,
    popular: true,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-net',
    tld: '.net',
    description: 'Reliable infrastructure and networking extension with free SSL & DNS.',
    minYears: 1,
    year1Usd: 11.99,
    year2Usd: 23.98,
    renewalUsd: 14.99,
    transferUsd: 11.99,
    popular: false,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-org',
    tld: '.org',
    description: 'Trusted non-profit, foundation, and open-source namespace.',
    minYears: 1,
    year1Usd: 10.99,
    year2Usd: 21.98,
    renewalUsd: 14.99,
    transferUsd: 10.99,
    popular: false,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-io',
    tld: '.io',
    description: 'Premier SaaS, startup & developer extension with Anycast routing.',
    minYears: 1,
    year1Usd: 34.99,
    year2Usd: 69.98,
    renewalUsd: 44.99,
    transferUsd: 34.99,
    popular: true,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-ai',
    tld: '.ai',
    description: 'Category-defining namespace for AI workflows & intelligent applications.',
    minYears: 2,
    year1Usd: 69.99,
    year2Usd: 139.98,
    renewalUsd: 79.99,
    transferUsd: 69.99,
    popular: false,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-cloud',
    tld: '.cloud',
    description: 'Clean cloud infrastructure namespace for APIs & portals.',
    minYears: 1,
    year1Usd: 15.99,
    year2Usd: 31.98,
    renewalUsd: 21.99,
    transferUsd: 15.99,
    popular: false,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-dev',
    tld: '.dev',
    description: 'HTTPS-enforced developer namespace for docs and SDKs.',
    minYears: 1,
    year1Usd: 13.99,
    year2Usd: 27.98,
    renewalUsd: 16.99,
    transferUsd: 13.99,
    popular: false,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'tld-xyz',
    tld: '.xyz',
    description: 'Modern namespace built for SaaS launches and global brands.',
    minYears: 1,
    year1Usd: 11.99,
    year2Usd: 23.98,
    renewalUsd: 15.99,
    transferUsd: 11.99,
    popular: false,
    enabled: true,
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
];

const INITIAL_PROVISIONING_MODULES: ProvisioningModuleRecord[] = [];

const INITIAL_MANAGED_PLANS: ManagedHostingPlanRecord[] = [
  // Shared Hosting
  {
    id: 'plan-shared-ignite',
    pageCategory: 'shared-hosting',
    name: 'Cloud Ignite',
    audience: 'For Creators & Startups',
    tagline: 'Essential NVMe cloud capacity for new launches.',
    monthlyPrice: 2.5,
    yearlyPrice: 30.0,
    twoYearPrice: 54.0,
    fourYearPrice: 96.0,
    renewalPrice: 30.0,
    storage: '10GB SSD Space',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free Wildcard SSL',
    backups: 'Daily Snapshots',
    features: [
      '6 Linux Websites',
      '18x Databases',
      '24x Emails',
      '10GB SSD Space',
      '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)',
      '80+ App Installer',
    ],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_cloud_ignite',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-shared-velocity',
    pageCategory: 'shared-hosting',
    name: 'Cloud Velocity',
    audience: 'For Growing Brands',
    tagline: 'High-throughput NGINX caching for busy sites & stores.',
    monthlyPrice: 3.49,
    yearlyPrice: 41.88,
    twoYearPrice: 75.38,
    fourYearPrice: 134.0,
    renewalPrice: 41.88,
    storage: '20GB SSD Space',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free Wildcard SSL',
    backups: 'Daily Snapshots',
    features: [
      '12 Linux Websites',
      '36x 1GB Databases',
      '48x Emails',
      '20GB SSD Space',
      '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)',
      'Free NGINX edge cache',
    ],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_cloud_velocity',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-shared-horizon',
    pageCategory: 'shared-hosting',
    name: 'Cloud Horizon',
    audience: 'For Agencies & Studios',
    tagline: 'Unrestricted multi-site headroom for client fleets.',
    monthlyPrice: 4.49,
    yearlyPrice: 53.88,
    twoYearPrice: 96.98,
    fourYearPrice: 172.4,
    renewalPrice: 53.88,
    storage: 'Unlimited SSD Space',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free Wildcard SSL',
    backups: 'Daily Snapshots',
    features: [
      'Unlimited Linux Websites',
      'Unlimited 1GB Databases',
      'Unlimited Emails',
      'Unlimited SSD Space',
      '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)',
    ],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_cloud_horizon',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  // cPanel Hosting
  {
    id: 'plan-cpanel-ignite',
    pageCategory: 'cpanel-hosting',
    name: 'cPanel Ignite',
    audience: 'For 3 cPanel Websites',
    tagline: 'Reliable NVMe cPanel hosting engineered for growing business websites.',
    monthlyPrice: 14.99,
    yearlyPrice: 143.88,
    twoYearPrice: 258.98,
    fourYearPrice: 460.4,
    renewalPrice: 143.88,
    storage: '50 GB NVMe Storage',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL Certificate',
    backups: 'Weekly Backups',
    features: [
      'Host 3 Websites',
      '1 GB RAM',
      '10 Email Accounts',
      '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)',
      'Node.js & Python',
    ],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'cpcloud_ignite',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-cpanel-velocity',
    pageCategory: 'cpanel-hosting',
    name: 'cPanel Velocity',
    audience: 'For 10 cPanel Websites',
    tagline: 'High-headroom multi-site cPanel hosting with daily backups and doubled NVMe.',
    monthlyPrice: 24.99,
    yearlyPrice: 239.88,
    twoYearPrice: 431.78,
    fourYearPrice: 767.6,
    renewalPrice: 239.88,
    storage: '100 GB NVMe Storage',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL Certificate',
    backups: 'Free Daily Backup',
    features: [
      'Host 10 Websites',
      '2 GB RAM',
      '20 Email Accounts',
      '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)',
      'Node.js & Python',
    ],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'cpcloud_velocity',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-cpanel-zenith',
    pageCategory: 'cpanel-hosting',
    name: 'cPanel Zenith',
    audience: 'For Unlimited cPanel Websites',
    tagline: 'Full-power developer and agency cPanel stack with unmetered websites & SSH.',
    monthlyPrice: 39.99,
    yearlyPrice: 419.88,
    twoYearPrice: 755.78,
    fourYearPrice: 1343.6,
    renewalPrice: 419.88,
    storage: 'Unlimited NVMe Storage',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL Certificates',
    backups: 'Free Daily Auto Backup',
    features: [
      'Host Unlimited Websites',
      '4 GB RAM',
      'Unlimited Emails',
      '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)',
      'SSH Access',
    ],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'cpcloud_zenith',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  // WordPress Hosting
  {
    id: 'plan-wp-core',
    pageCategory: 'wordpress-hosting',
    name: 'WP Core',
    audience: 'For Blogs & Creators',
    tagline: 'Essential managed speed for single sites.',
    monthlyPrice: 2.5,
    yearlyPrice: 30.0,
    twoYearPrice: 54.0,
    fourYearPrice: 96.0,
    renewalPrice: 30.0,
    storage: '10GB SSD',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL',
    backups: 'Daily Backups',
    features: ['1 WP Website', '1 Database', 'Unlimited Emails', 'WordPress Staging Site'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_wp_core',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-wp-studio',
    pageCategory: 'wordpress-hosting',
    name: 'WP Studio',
    audience: 'For Growing Brands',
    tagline: 'Tuned performance for multi-site businesses.',
    monthlyPrice: 3.49,
    yearlyPrice: 41.88,
    twoYearPrice: 75.38,
    fourYearPrice: 134.0,
    renewalPrice: 41.88,
    storage: '20GB SSD',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL',
    backups: 'Daily Backups',
    features: ['6 WP Websites', '6 Databases', 'Unlimited Emails', 'WordPress Staging Site'],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_wp_studio',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-wp-flagship',
    pageCategory: 'wordpress-hosting',
    name: 'WP Flagship',
    audience: 'For Agencies & Commerce',
    tagline: 'Unrestricted capacity for high-volume fleets.',
    monthlyPrice: 4.49,
    yearlyPrice: 53.88,
    twoYearPrice: 96.98,
    fourYearPrice: 172.4,
    renewalPrice: 53.88,
    storage: 'Unlimited SSD',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL',
    backups: 'Daily Backups',
    features: ['Unlimited WP Websites', 'Unlimited Databases', 'Unlimited Emails', 'WordPress Staging Site'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_wp_flagship',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  // Windows Hosting
  {
    id: 'plan-win-core',
    pageCategory: 'windows-hosting',
    name: 'WinCore Pro',
    audience: 'For 6 Websites',
    tagline: 'Streamlined Windows IIS hosting for modern ASP.NET web applications.',
    monthlyPrice: 2.5,
    yearlyPrice: 30.0,
    twoYearPrice: 54.0,
    fourYearPrice: 96.0,
    renewalPrice: 30.0,
    storage: '10GB SSD Space',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL',
    backups: 'Daily Snapshots',
    features: ['6 Windows Websites', '18 MySQL Databases', '24 Emails', 'SSH & FTPS Access'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_win_core',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-win-business',
    pageCategory: 'windows-hosting',
    name: 'WinScale Business',
    audience: 'For 12 Websites',
    tagline: 'Built for growing agencies managing client IIS & database portals.',
    monthlyPrice: 3.49,
    yearlyPrice: 41.88,
    twoYearPrice: 75.38,
    fourYearPrice: 134.0,
    renewalPrice: 41.88,
    storage: '20GB SSD Space',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL',
    backups: 'Daily Snapshots',
    features: ['12 Windows Websites', '36 MySQL Databases', '48 Emails', 'SSH & FTPS Access'],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_win_business',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-win-enterprise',
    pageCategory: 'windows-hosting',
    name: 'WinEnterprise',
    audience: 'For Unlimited Websites',
    tagline: 'Unrestricted Windows IIS headroom unified inside one control plane.',
    monthlyPrice: 4.49,
    yearlyPrice: 53.88,
    twoYearPrice: 96.98,
    fourYearPrice: 172.4,
    renewalPrice: 53.88,
    storage: 'Unlimited SSD Space',
    bandwidth: 'Unlimited Bandwidth',
    ssl: 'Free SSL',
    backups: 'Daily Snapshots',
    features: ['Unlimited Windows Websites', 'Unlimited MySQL Databases', 'Unlimited Emails', 'SSH & FTPS'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'stackcp_win_enterprise',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  // VPS Hosting
  {
    id: 'plan-vps-core-4',
    pageCategory: 'vps-hosting',
    name: 'VPS Core 4',
    audience: 'Unmanaged KVM VPS',
    tagline: 'Dedicated KVM compute resources with full root SSH control.',
    monthlyPrice: 12.99,
    yearlyPrice: 142.89,
    twoYearPrice: 270.0,
    fourYearPrice: 510.0,
    renewalPrice: 12.99,
    storage: '100 GB SSD',
    bandwidth: '200 Mbit/s Unlimited Traffic',
    ssl: 'Root SSH & VNC',
    backups: '1 Snapshot Included',
    features: ['4 vCPU Cores', '8 GB RAM', '100 GB SSD', '1 Snapshot', '200 Mbit/s Port'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'kvm_core_4vcpu_8g',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-vps-pro-6',
    pageCategory: 'vps-hosting',
    name: 'VPS Pro 6',
    audience: 'Unmanaged KVM VPS',
    tagline: 'Zero setup cost plus 1 month free on yearly billing.',
    monthlyPrice: 19.99,
    yearlyPrice: 219.89,
    twoYearPrice: 418.0,
    fourYearPrice: 790.0,
    renewalPrice: 19.99,
    storage: '200GB SSD / 100GB NVMe',
    bandwidth: '300 Mbit/s Unlimited Traffic',
    ssl: 'Root SSH & VNC',
    backups: '2 Snapshots Included',
    features: ['6 vCPU Cores', '12 GB RAM', '200GB SSD / 100GB NVMe', '2 Snapshots', '300 Mbit/s Port'],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'kvm_pro_6vcpu_12g',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-vps-scale-8',
    pageCategory: 'vps-hosting',
    name: 'VPS Scale 8',
    audience: 'Unmanaged KVM VPS',
    tagline: 'High-memory KVM compute with zero setup cost.',
    monthlyPrice: 34.99,
    yearlyPrice: 384.89,
    twoYearPrice: 730.0,
    fourYearPrice: 1380.0,
    renewalPrice: 34.99,
    storage: '300GB SSD / 150GB NVMe',
    bandwidth: '600 Mbit/s Unlimited Traffic',
    ssl: 'Root SSH & VNC',
    backups: '3 Snapshots Included',
    features: ['8 vCPU Cores', '24 GB RAM', '300GB SSD / 150GB NVMe', '3 Snapshots', '600 Mbit/s Port'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'kvm_scale_8vcpu_24g',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-vps-max-12',
    pageCategory: 'vps-hosting',
    name: 'VPS Max 12',
    audience: 'Unmanaged KVM VPS',
    tagline: 'Dedicated 12-core power built for heavy applications.',
    monthlyPrice: 59.99,
    yearlyPrice: 659.89,
    twoYearPrice: 1250.0,
    fourYearPrice: 2370.0,
    renewalPrice: 59.99,
    storage: '400GB SSD / 200GB NVMe',
    bandwidth: '800 Mbit/s Unlimited Traffic',
    ssl: 'Root SSH & VNC',
    backups: '3 Snapshots Included',
    features: ['12 vCPU Cores', '48 GB RAM', '400GB SSD / 200GB NVMe', '3 Snapshots', '800 Mbit/s Port'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'kvm_max_12vcpu_48g',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  // n8n Hosting
  {
    id: 'plan-n8n-starter-4',
    pageCategory: 'n8n-hosting',
    name: 'n8n Starter 4',
    audience: 'Dedicated n8n Cloud Node',
    tagline: 'Pre-configured Docker n8n stack with unlimited executions.',
    monthlyPrice: 12.99,
    yearlyPrice: 142.89,
    twoYearPrice: 270.0,
    fourYearPrice: 510.0,
    renewalPrice: 12.99,
    storage: '100 GB SSD',
    bandwidth: '200 Mbit/s Port',
    ssl: 'Auto HTTPS Reverse Proxy',
    backups: '1 Snapshot',
    features: ['4 vCPU Cores', '8 GB RAM', 'PostgreSQL & Docker', 'Unlimited Workflows'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'n8n_docker_starter4',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-n8n-growth-6',
    pageCategory: 'n8n-hosting',
    name: 'n8n Growth 6',
    audience: 'Dedicated n8n Cloud Node',
    tagline: 'Zero setup cost plus 1 month free on yearly billing.',
    monthlyPrice: 19.99,
    yearlyPrice: 219.89,
    twoYearPrice: 418.0,
    fourYearPrice: 790.0,
    renewalPrice: 19.99,
    storage: '200GB SSD / 100GB NVMe',
    bandwidth: '300 Mbit/s Port',
    ssl: 'Auto HTTPS Reverse Proxy',
    backups: '2 Snapshots',
    features: ['6 vCPU Cores', '12 GB RAM', 'Redis Queue Mode', 'Unlimited Workflows'],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'n8n_docker_growth6',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-n8n-scale-8',
    pageCategory: 'n8n-hosting',
    name: 'n8n Scale 8',
    audience: 'Dedicated n8n Cloud Node',
    tagline: 'High-memory n8n & Redis queue compute for concurrent agents.',
    monthlyPrice: 34.99,
    yearlyPrice: 384.89,
    twoYearPrice: 730.0,
    fourYearPrice: 1380.0,
    renewalPrice: 34.99,
    storage: '300GB SSD / 150GB NVMe',
    bandwidth: '600 Mbit/s Port',
    ssl: 'Auto HTTPS Reverse Proxy',
    backups: '3 Snapshots',
    features: ['8 vCPU Cores', '24 GB RAM', 'Redis Queue Workers', 'Unlimited Workflows'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'n8n_docker_scale8',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-n8n-enterprise-12',
    pageCategory: 'n8n-hosting',
    name: 'n8n Enterprise 12',
    audience: 'Dedicated n8n Cloud Node',
    tagline: 'Dedicated 12-core power for heavy automation pipelines.',
    monthlyPrice: 59.99,
    yearlyPrice: 659.89,
    twoYearPrice: 1250.0,
    fourYearPrice: 2370.0,
    renewalPrice: 59.99,
    storage: '400GB SSD / 200GB NVMe',
    bandwidth: '800 Mbit/s Port',
    ssl: 'Auto HTTPS Reverse Proxy',
    backups: '3 Snapshots',
    features: ['12 vCPU Cores', '48 GB RAM', 'Multi-Worker Redis', 'Unlimited Workflows'],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'n8n_docker_ent12',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  // Reseller Hosting
  {
    id: 'plan-reseller-launch',
    pageCategory: 'reseller-hosting',
    name: 'Reseller Launch',
    audience: 'Freelancers & Boutique Studios',
    tagline: 'Start hosting client websites under your own brand with full WHM, white-label nameservers, and Gen4 NVMe speed.',
    monthlyPrice: 14.99,
    yearlyPrice: 149.0,
    twoYearPrice: 268.0,
    fourYearPrice: 476.0,
    renewalPrice: 149.0,
    storage: '60 GB Gen4 NVMe SSD',
    bandwidth: 'Unmetered Tier-1 Bandwidth',
    ssl: 'Unlimited Free AutoSSL & Wildcard TLS',
    backups: 'Daily JetBackup Off-Site Snapshots',
    features: [
      '25 Isolated cPanel Client Accounts',
      '60 GB Gen4 NVMe RAID-10 Storage',
      'Full WHM Control & Package Creator',
      'Private White-Label Nameservers (ns1/ns2)',
      'CloudLinux OS+ & CageFS Account Isolation',
      'Free LiteSpeed Web Server + LSCache',
    ],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'whm_reseller_launch_25',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-reseller-agency',
    pageCategory: 'reseller-hosting',
    name: 'Reseller Agency Pro',
    audience: 'Growing Agencies & MSPs',
    tagline: 'Scale recurring client hosting revenue with 60 isolated cPanel accounts, WHMCS automation hooks, and Imunify360 defense.',
    monthlyPrice: 29.99,
    yearlyPrice: 299.0,
    twoYearPrice: 538.0,
    fourYearPrice: 956.0,
    renewalPrice: 299.0,
    storage: '150 GB Gen4 NVMe SSD',
    bandwidth: 'Unmetered Tier-1 Bandwidth',
    ssl: 'Unlimited Free AutoSSL & Wildcard TLS',
    backups: 'Twice-Daily JetBackup + 30-Day Retention',
    features: [
      '60 Isolated cPanel Client Accounts',
      '150 GB Gen4 NVMe RAID-10 Storage',
      'Higher LVE Per-Account CPU & RAM Bursts',
      '1 Free Dedicated IPv4 Address Included',
      'Automated WHMCS / Upmind Provisioning API',
      'Zero-Downtime White-Glove Client Migrations',
    ],
    popular: true,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'whm_reseller_agency_60',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
  {
    id: 'plan-reseller-enterprise',
    pageCategory: 'reseller-hosting',
    name: 'Reseller Enterprise Cluster',
    audience: 'High-Volume Hosting Brands',
    tagline: 'Maximum account density and unthrottled enterprise throughput engineered for multi-region reseller brands.',
    monthlyPrice: 54.99,
    yearlyPrice: 549.0,
    twoYearPrice: 988.0,
    fourYearPrice: 1756.0,
    renewalPrice: 549.0,
    storage: '350 GB Gen4 NVMe SSD',
    bandwidth: 'Unmetered 10 Gbps Redundant Port',
    ssl: 'Unlimited Free AutoSSL & Wildcard TLS',
    backups: 'Hourly & Daily Off-Site Snapshot Vault',
    features: [
      '150 Isolated cPanel Client Accounts',
      '350 GB Gen4 NVMe RAID-10 Storage',
      '2 Dedicated IPv4 Addresses Included',
      'Imunify360 Proactive Malware Shield',
      'Priority 24/7 Partner Escalation Desk',
      'Custom Branded Webmail & DNS Cluster',
    ],
    popular: false,
    enabled: true,
    autoProvision: true,
    serverModuleId: '',
    serverPackageName: 'whm_reseller_ent_150',
    updatedAtUtc: '2026-04-01 09:00 UTC',
  },
];

const DEFAULT_SYSTEM_SETTINGS: SystemIntegrationSettings = {
  smtp: {
    enabled: true,
    providerLabel: 'StackMail SMTP',
    host: 'smtp.stackmail.com',
    port: 465,
    encryption: 'ssl',
    username: '',
    password: '',
    fromName: 'CPCloudHost',
    fromEmail: 'noreply@cpcloudhost.com',
    lastTestStatus: 'untested',
  },
  googleOAuth: {
    enabled: true,
    clientId: '',
    apiKey: '',
    clientSecret: '',
    buttonLabel: 'Continue with Google',
    allowAutoRegister: true,
  },
  adminAlerts: {
    enabled: true,
    alertEmail: 'ranamudassar6486@gmail.com',
    notifyNewOrder: true,
    notifyNewTicket: true,
    notifyNameserverRequest: true,
    notifyDomainEvents: true,
  },
  updatedAtUtc: '2026-04-01 09:00 UTC',
};

const INITIAL_USERS: ManagedUserAccount[] = [
  {
    id: 'USR-1001',
    name: 'Mr. Mudassar',
    username: 'mudassar',
    email: 'ranamudassar6486@gmail.com',
    company: 'cpcloudhost.com HQ · CEO & Founder',
    country: 'Pakistan',
    role: 'admin',
    status: 'active',
    kycVerified: true,
    emailVerified: true,
    activeServices: 0,
    totalSpendUsd: 0,
    createdAt: '2025-01-12',
    lastLoginAt: '2026-11-14 19:15 UTC',
  },
];

const INITIAL_ORDERS: PlatformOrder[] = [];

const INITIAL_DOMAIN_CONTACTS: DomainContactAddress[] = [];

function normalizeCpanelUsernameFallback(domainOrHost: string): string {
  const raw = domainOrHost
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/[^a-z0-9]/g, '');
  let base = raw.replace(/^[0-9]+/, '');
  if (!base) base = `cpuser${raw}`;
  if (base.length < 4) base = `${base}acct`.slice(0, 8);
  return base.slice(0, 14);
}

function applyAutomaticOrderExpirations(list: PlatformOrder[]): {
  orders: PlatformOrder[];
  changed: boolean;
  newlySuspendedIds: string[];
  newlyExpiredIds: string[];
} {
  const todayIso = getTodayIsoUtc();
  let changed = false;
  const newlySuspendedIds: string[] = [];
  const newlyExpiredIds: string[] = [];

  const next = list.map((ord) => {
    if (
      ord.status === 'cancelled' ||
      ord.status === 'refunded' ||
      ord.status === 'transferred' ||
      ord.status === 'expired' ||
      ord.status === 'suspended' ||
      (ord.status === 'pending' && ord.productType === 'Domain Transfer')
    ) {
      return ord;
    }
    const dueIso = ord.nextDueDate ? parseIsoDateOnly(ord.nextDueDate) : '';
    if (!dueIso) return ord;
    const daysRemaining = diffDaysIso(todayIso, dueIso);
    const createdIso = ord.createdAt ? parseIsoDateOnly(ord.createdAt) : '';
    const isDueTodayAndUnsettled =
      daysRemaining === 0 && (!ord.invoicePaid || (Boolean(createdIso) && createdIso < todayIso));
    if (daysRemaining < 0 || isDueTodayAndUnsettled) {
      changed = true;
      if (isDomainOrderRecord(ord)) {
        newlyExpiredIds.push(ord.id);
        return {
          ...ord,
          status: 'expired' as OrderStatus,
          invoicePaid: false,
          registrarLock: true,
          notes:
            ord.notes && ord.notes.includes('Auto-expired')
              ? ord.notes
              : `Auto-expired on due date (${dueIso}) without renewal.`,
        };
      }
      if (ord.status === 'active') {
        newlySuspendedIds.push(ord.id);
        return {
          ...ord,
          status: 'suspended' as OrderStatus,
          invoicePaid: false,
          notes:
            ord.notes && ord.notes.includes('Auto-suspended')
              ? ord.notes
              : `Auto-suspended on due date (${dueIso}) without payment.`,
        };
      }
    }
    return ord;
  });
  return { orders: next, changed, newlySuspendedIds, newlyExpiredIds };
}

function runOneTimeProductionStorageCleanup(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(PROD_CLEANUP_KEY) === 'done') return;

    const filterJsonArray = <T,>(
      key: string,
      keepPredicate: (item: T) => boolean,
      mapItem?: (item: T) => T
    ) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(keepPredicate).map((item) => (mapItem ? mapItem(item) : item));
          window.localStorage.setItem(key, JSON.stringify(cleaned));
        }
      } catch {
        // ignore invalid json
      }
    };

    filterJsonArray<ManagedUserAccount>(
      USERS_KEY,
      (u) =>
        !LEGACY_FAKE_USER_IDS.has(u.id) &&
        !LEGACY_FAKE_EMAILS.has((u.email || '').toLowerCase()),
      (u) => (u.role === 'admin' ? { ...u, activeServices: 0, totalSpendUsd: 0 } : u)
    );
    filterJsonArray<PlatformOrder>(
      ORDERS_KEY,
      (o) =>
        !LEGACY_FAKE_ORDER_IDS.has(o.id) &&
        !LEGACY_FAKE_EMAILS.has((o.clientEmail || '').toLowerCase())
    );
    filterJsonArray<PlatformInvoice>(
      INVOICES_KEY,
      (inv) =>
        !LEGACY_FAKE_ORDER_IDS.has(inv.orderId) &&
        !LEGACY_FAKE_ORDER_IDS.has(`ORD-${inv.id.replace(/^INV-/, '')}`) &&
        !LEGACY_FAKE_EMAILS.has((inv.clientEmail || '').toLowerCase())
    );
    filterJsonArray<SupportTicketRecord>(
      TICKETS_KEY,
      (t) =>
        !LEGACY_FAKE_TICKET_IDS.has(t.id) &&
        !LEGACY_FAKE_EMAILS.has((t.clientEmail || '').toLowerCase())
    );
    filterJsonArray<AbuseComplaintRecord>(ABUSE_KEY, (a) => !LEGACY_FAKE_ABUSE_IDS.has(a.ticketId));
    filterJsonArray<LoginActivityRecord>(
      LOGIN_LOGS_KEY,
      (l) =>
        !LEGACY_FAKE_LOG_IDS.has(l.id) &&
        !LEGACY_FAKE_EMAILS.has((l.userEmail || '').toLowerCase())
    );
    filterJsonArray<DomainContactAddress>(
      DOMAIN_CONTACTS_KEY,
      (c) => !LEGACY_FAKE_CONTACT_IDS.has(c.id)
    );
    filterJsonArray<ProvisioningModuleRecord>(
      PROVISIONING_MODULES_KEY,
      (m) => !LEGACY_FAKE_MODULE_IDS.has(m.id) || Boolean(m.apiToken && m.apiToken.trim())
    );
    filterJsonArray<ManagedHostingPlanRecord>(
      HOSTING_PLANS_KEY,
      () => true,
      (plan) =>
        LEGACY_FAKE_MODULE_IDS.has(plan.serverModuleId)
          ? { ...plan, serverModuleId: '' }
          : plan
    );

    window.localStorage.setItem(PROD_CLEANUP_KEY, 'done');
  } catch {
    // ignore storage errors
  }
}

runOneTimeProductionStorageCleanup();

function readInitialOrdersWithSync(): PlatformOrder[] {
  runOneTimeProductionStorageCleanup();
  const stored = readStorage<PlatformOrder[]>(ORDERS_KEY, INITIAL_ORDERS);
  return applyAutomaticOrderExpirations(Array.isArray(stored) ? stored : INITIAL_ORDERS).orders;
}

function readInitialDomainContacts(): DomainContactAddress[] {
  runOneTimeProductionStorageCleanup();
  const stored = readStorage<DomainContactAddress[] | null>(DOMAIN_CONTACTS_KEY, null);
  if (!stored || !Array.isArray(stored)) {
    return INITIAL_DOMAIN_CONTACTS;
  }
  return stored;
}

const INITIAL_TICKETS: SupportTicketRecord[] = [];

const INITIAL_ABUSE: AbuseComplaintRecord[] = [];

const INITIAL_LOGIN_LOGS: LoginActivityRecord[] = [];

export const DEFAULT_CMS_SITE_SETTINGS: CmsSiteSettings = {
  announcementEnabled: false,
  announcementText:
    'Launch Cloud Hosting & Managed WordPress with Free Migrations + Up to 12 Months Switch Credits',
  announcementCtaText: 'Explore Free Migrations',
  announcementCtaUrl: '/migration-free',
  supportEmail: 'support@cpcloudhost.com',
  footerTagline:
    'Enterprise StackCP, cPanel, KVM VPS, n8n, and cloud web hosting engineered for 99.99% uptime across worldwide datacentres.',
  footerCopyright: '© 2026 cpcloudhost.com. All rights reserved.',
};

const DEFAULT_HOME_FAQS: CmsFaqItem[] = [
  {
    question: 'What is StackCP Web Hosting?',
    answer:
      'StackCP is our custom-engineered, autoscaling cloud control panel built to replace legacy fixed-server limits. At cpcloudhost.com, your site draws compute and memory dynamically across our global cloud cluster for consistent speed during traffic spikes.',
  },
  {
    question: 'Do you support cPanel as well?',
    answer:
      'Yes. Alongside StackCP autoscaling cloud hosting, cpcloudhost.com provides classic CloudLinux-powered cPanel accounts with up to 4GB RAM, JetBackup, Imunify360, NVMe SSD storage, and selectable PHP 5.6 through PHP 8.4.',
  },
  {
    question: 'Can you migrate my website from another StackCP provider?',
    answer:
      'Yes. We offer unlimited free StackCP-to-StackCP migrations with zero downtime, seamlessly transferring your websites, databases, SSL certificates, and mailboxes directly into your cpcloudhost.com account.',
  },
  {
    question: 'Is it suitable for WooCommerce?',
    answer:
      'Absolutely. Both our WordPress and cPanel platforms are optimised for WooCommerce stores with StackCache edge caching, HTTP/3, Redis object caching, and NVMe storage to keep checkout pages fast under heavy load.',
  },
  {
    question: 'Do I get free SSL certificates?',
    answer:
      'Every hosting plan at cpcloudhost.com includes free wildcard SSL certificates that automatically install and renew across your primary domain and unlimited subdomains.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes. You can scale your cpcloudhost.com plan up or down anytime directly from your client area without downtime or migration hassle.',
  },
  {
    question: 'Where are your servers located?',
    answer:
      'We operate Tier-III+ datacentre clusters in London (UK), New York & Dallas (USA), Frankfurt (Germany), Singapore, Mumbai (India), and Sydney (Australia), backed by a global Anycast CDN.',
  },
  {
    question: 'What kind of support do you offer?',
    answer:
      'Our in-house Linux, StackCP, and cPanel systems engineers are available 24/7 via ticket and live chat, with fast troubleshooting and hands-on migration assistance.',
  },
  {
    question: 'Can I migrate from another host?',
    answer:
      'Yes. Whether you are moving from cPanel, Plesk, DirectAdmin, Krystal, Cloudways, or WP Engine, our team handles the entire transfer free of charge—plus we credit remaining unused time via Switch Credits.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Yes — you can start any StackCP hosting plan on cpcloudhost.com with our 30-day risk-free guarantee and Switch Credits for any remaining balance at your previous provider.',
  },
];

export const INITIAL_CMS_PAGES: CmsPageRecord[] = [
  {
    id: 'home',
    slug: '/',
    navTitle: 'Home Landing Page',
    category: 'Home & Core',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'cpcloudhost.com — NVMe Cloud Hosting, VPS & Managed Infrastructure',
    seoDescription:
      'Enterprise NVMe cloud hosting, managed WordPress, cPanel, Windows, VPS, and multi-cloud servers with Free SSL, daily backups, and a 99.99% uptime SLA.',
    heroBadge: 'StackCP & cPanel Web Hosting',
    heroTitle: 'Next-Generation Cloud & Web Hosting for Modern Websites',
    heroSubtitle:
      'Fast, secure, and autoscaling cloud hosting powered by StackCP and cPanel on pure NVMe Gen4 clusters. Launch WordPress, business storefronts, or multi-cloud workloads starting from $2.50/mo.',
    primaryCtaText: 'Start Free Trial Now',
    primaryCtaUrl: '/free-trial',
    secondaryCtaText: 'View Plans & Pricing',
    secondaryCtaUrl: '#services',
    highlights: [
      'Free Wildcard SSL & Global CDN',
      'Free Domain Hosting & WHOIS Privacy',
      '30-Day Money-Back Guarantee',
      '99.99% Uptime SLA Guarantee',
      'Global Tier-III+ Datacentres',
    ],
    sections: [
      {
        id: 'switch-credits',
        heading:
          "Switch to cpcloudhost.com and we'll credit your unused time from your current provider.",
        body: 'Are you locked in with your current web host? Our Switch Credits give you money back on any time you have left on your plan, so you can join cpcloudhost.com sooner. Switch your cPanel or StackCP Web Hosting Now!',
        ctaText: 'Switch Now',
        ctaUrl: '#free-migrations',
      },
    ],
    faqItems: DEFAULT_HOME_FAQS,
    showInHeaderMenu: false,
    showInFooter: false,
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'shared-hosting',
    slug: '/shared-hosting',
    navTitle: 'Shared Web Hosting',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Shared Web Hosting — NVMe Autoscaling Cloud | cpcloudhost.com',
    seoDescription:
      'Fast, autoscaling Linux shared hosting starting at $2.50/mo with StackCP, Free SSL, daily backups, and free site migrations.',
    heroBadge: 'cpcloudhost.com · StackCP Cloud Platform',
    heroTitle: 'Cloud-Powered StackCP Linux Hosting Built for Speed',
    heroSubtitle:
      'Run your websites on resilient multi-server cloud architecture instead of a single crowded machine. Every StackCP account at cpcloudhost.com balances traffic across NVMe Linux nodes with automatic Wildcard SSL, global Anycast DNS, and a visual site builder ready out of the box.',
    primaryCtaText: 'Launch Your Free Trial',
    primaryCtaUrl: '#shared-plans',
    secondaryCtaText: 'Compare Cloud Capabilities',
    secondaryCtaUrl: '#shared-core-features',
    highlights: [
      'Multi-server StackCP autoscaling cloud',
      'Automatic Wildcard SSL & Anycast DNS',
      'Daily offsite backups & 24/7 systems engineers',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'wordpress-hosting',
    slug: '/wordpress-hosting',
    navTitle: 'Managed WordPress Hosting',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Managed WordPress Hosting — LiteSpeed & Edge Cache | cpcloudhost.com',
    seoDescription:
      'High-speed managed WordPress and WooCommerce hosting with StackCache, Redis object cache, automated staging, and daily backups.',
    heroBadge: 'cpcloudhost.com · StackCP Managed WordPress Cloud',
    heroTitle: 'Managed WordPress Cloud Hosting Built for Speed & Growth',
    heroSubtitle:
      'Accelerate your editorial blogs, agency builds, and WooCommerce storefronts on isolated NVMe infrastructure tuned specifically for WordPress and PHP 8.4. Every cpcloudhost.com package ships with Wildcard SSL, Anycast CDN delivery, automated core updates, and 1-click staging sandboxes.',
    primaryCtaText: 'Start Free Trial Now',
    primaryCtaUrl: '#wp-plans',
    secondaryCtaText: 'Compare WordPress Specs',
    secondaryCtaUrl: '#wp-plans',
    highlights: [
      'StackCache edge caching & Redis object cache',
      'Automated WordPress core & security hardening',
      '1-click staging sandboxes & daily backups',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'windows-hosting',
    slug: '/windows-hosting',
    navTitle: 'Windows Web Hosting',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Windows Web Hosting — ASP.NET Core 8, IIS 10 & MSSQL | cpcloudhost.com',
    seoDescription:
      'Dedicated Windows IIS 10, ASP.NET Core, and MSSQL enterprise hosting with Free SSL and autoscaling cloud resources.',
    heroBadge: 'cpcloudhost.com · StackCP Windows IIS Cloud',
    heroTitle: 'Enterprise Windows Cloud & ASP.NET Web Hosting',
    heroSubtitle:
      'Power data-driven Microsoft .NET portals, WebForms apps, and IIS 10 websites inside isolated StackCP Windows containers at cpcloudhost.com. Built natively for ASP.NET Core, MS SQL Server, and seamless Visual Studio Web Deploy workflows.',
    primaryCtaText: 'Explore Windows Plans',
    primaryCtaUrl: '#win-plans',
    secondaryCtaText: 'Compare IIS Features',
    secondaryCtaUrl: '#win-plans',
    highlights: [
      'IIS 10 & ASP.NET Core 8 isolated workers',
      'Managed Microsoft SQL Server databases',
      'Visual Studio Web Deploy & Free Wildcard SSL',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'cpanel-hosting',
    slug: '/cpanel-hosting',
    navTitle: 'cPanel Web Hosting',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Enterprise cPanel Web Hosting — NVMe, CloudLinux & SSL | cpcloudhost.com',
    seoDescription:
      'NVMe cPanel hosting with CloudLinux isolation, Imunify360, JetBackup, Free .com domain on yearly billing, and Node.js/Python support.',
    heroBadge: 'cPanel® Cloud Infrastructure · 1 Free .com Domain With Yearly',
    heroTitle: 'Enterprise cPanel Web Hosting Engineered for Total Control',
    heroSubtitle:
      'Take full ownership of your business websites with high-speed PCIe NVMe storage, automated offsite backups, malware defense, and integrated DDoS protection. Manage domains, MySQL databases, WordPress, and Node.js or Python workloads seamlessly from the familiar cPanel workspace.',
    primaryCtaText: 'View Hosting Plans',
    primaryCtaUrl: '#cpanel-pricing',
    secondaryCtaText: 'Free Migration Available',
    secondaryCtaUrl: '/migration-free',
    highlights: [
      'PCIe Gen4 NVMe Storage & Unlimited Bandwidth',
      'Imunify360 Malware Scanner & DDoS Protection',
      'Node.js, Python & Selectable PHP 5.6–8.4',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'reseller-hosting',
    slug: '/reseller-hosting',
    navTitle: 'Reseller Hosting',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Reseller Hosting — White-Label cPanel & WHM Suites | cpcloudhost.com',
    seoDescription:
      'Build your own web hosting brand with white-label cPanel accounts, private nameservers, WHM partner console, and automated backups.',
    heroBadge: 'cpcloudhost.com · WHM Partner & White-Label Infrastructure',
    heroTitle: 'Build Your Own Hosting Brand With White-Label Reseller Power',
    heroSubtitle:
      'Sell fast NVMe cPanel hosting under your own brand, private nameservers, and custom pricing. Manage 25 to 150+ isolated client accounts inside your WHM Partner console backed by CloudLinux LVE isolation and automated JetBackup snapshots.',
    primaryCtaText: 'Compare Reseller Plans',
    primaryCtaUrl: '#reseller-plans',
    secondaryCtaText: 'Inspect Partner Benefits',
    secondaryCtaUrl: '#reseller-benefits',
    highlights: [
      'Private Nameservers & 100% White-Label Brand',
      'Isolated cPanel Accounts with CloudLinux LVE',
      'Free WHMCS / Client Billing Integration Support',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'free-trial',
    slug: '/free-trial',
    navTitle: '30-Day Free Trial',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: '30-Day Free Hosting Trial (Promo: STARTFREE) | cpcloudhost.com',
    seoDescription:
      'Launch Cloud Ignite, WP Core, or WinCore Pro free for 30 days with promo code STARTFREE on cpcloudhost.com.',
    heroBadge: 'cpcloudhost.com · Risk-Free StackCP Evaluation',
    heroTitle: 'Enterprise Cloud Hosting. Free for 30 Days.',
    heroSubtitle:
      'Deploy or migrate live websites onto the high-availability StackCP cloud infrastructure at cpcloudhost.com. Benchmark NVMe storage, 99.99% uptime resiliency, and direct 24/7 engineering support with unrestricted access.',
    primaryCtaText: 'Start Your Free Trial',
    primaryCtaUrl: '#trial-plans',
    secondaryCtaText: 'Compare Trial Plans',
    secondaryCtaUrl: '#trial-plans',
    highlights: [
      'Promo Code STARTFREE pre-applied',
      'Instant StackCP cloud provisioning',
      'Cancel anytime within 30 days',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'vps-hosting',
    slug: '/vps-hosting',
    navTitle: 'Unmanaged KVM VPS',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Unmanaged KVM VPS Hosting — Dedicated vCPU & NVMe | cpcloudhost.com',
    seoDescription:
      'Full root SSH KVM VPS instances with dedicated vCPU cores, NVMe/SSD storage, automated snapshots, and unlimited traffic.',
    heroBadge: 'cpcloudhost.com · High-Frequency KVM Compute',
    heroTitle: 'Complete Root Control Over High-Speed Cloud Compute',
    heroSubtitle:
      'Run latency-sensitive applications, custom stacks, and Docker workloads inside dedicated KVM virtual machines with unshared CPU cores and fast SSD or NVMe storage engineered at cpcloudhost.com.',
    primaryCtaText: 'Configure VPS Instance',
    primaryCtaUrl: '#compute-plans',
    secondaryCtaText: 'Inspect Server Regions',
    secondaryCtaUrl: '#compute-plans',
    highlights: [
      'Full root SSH & KVM kernel isolation',
      'Dedicated vCPU cores & NVMe / SSD arrays',
      'UK, USA, EU & Singapore global regions',
      'Automated snapshot rollbacks & unlimited traffic',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'n8n-hosting',
    slug: '/n8n-hosting',
    navTitle: 'n8n Workflow Hosting',
    category: 'Hosting & Cloud',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'n8n Hosting — Pre-Configured Workflow Automation Nodes | cpcloudhost.com',
    seoDescription:
      'Dedicated n8n workflow automation hosting on KVM NVMe nodes with Redis queues, PostgreSQL persistence, and HTTPS webhooks.',
    heroBadge: 'cpcloudhost.com · Dedicated n8n Automation Infrastructure',
    heroTitle: 'Self-Hosted n8n Automation Without Execution Limits',
    heroSubtitle:
      'Deploy dedicated n8n automation servers backed by isolated KVM hardware, pre-configured Docker containers, and PostgreSQL + Redis queues. Run unlimited multi-step workflows, webhooks, and AI pipelines on infrastructure tuned by cpcloudhost.com.',
    primaryCtaText: 'Deploy n8n Server',
    primaryCtaUrl: '#compute-plans',
    secondaryCtaText: 'Compare n8n Node Tiers',
    secondaryCtaUrl: '#compute-plans',
    highlights: [
      'Unlimited workflows, triggers & webhook runs',
      'Pre-configured Docker, HTTPS SSL & PostgreSQL',
      'UK, USA, EU & Singapore automation nodes',
      'Instant snapshot rollbacks & full root SSH',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'domain-registration',
    slug: '/domain-registration',
    navTitle: 'Domain Registration',
    category: 'Domains & Support',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Domain Registration & Live Availability Search | cpcloudhost.com',
    seoDescription:
      'Register .com, .co.uk, .uk, .net, .io, and .cloud domains with free WHOIS privacy, DNSSEC, and instant DNS propagation.',
    heroBadge: 'cpcloudhost.com · Accredited Domain & Anycast DNS',
    heroTitle: 'Secure Your Brand Domain — Fast, Transparent & Managed',
    heroSubtitle:
      'Register, configure, or consolidate domains effortlessly inside StackCP at cpcloudhost.com. Launch live DNS records, custom email forwarding, and Wildcard SSL certificates in minutes from one unified portal.',
    primaryCtaText: 'Search Domains',
    primaryCtaUrl: '#domain-live-search',
    secondaryCtaText: 'Transfer Existing Domain',
    secondaryCtaUrl: '/domain-transfer',
    highlights: [
      'Live availability & real-time WHOIS / RDAP lookup',
      'Seamless inbound transfers (adds +1 year automatically)',
      'Complimentary Anycast DNS, SSL & email forwarding',
      '24/7 UK, EU & USA domain engineering support',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'domain-transfer',
    slug: '/domain-transfer',
    navTitle: 'Domain Transfer',
    category: 'Domains & Support',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Domain Transfer — Zero-Downtime Registrar Moves | cpcloudhost.com',
    seoDescription:
      'Transfer single or bulk domains to cpcloudhost.com with +1 year renewal, zero DNS downtime, and live EPP readiness verification.',
    heroBadge: 'cpcloudhost.com · Zero-Downtime Domain Consolidation',
    heroTitle: 'Transfer Your Domains Smoothly & Unify Under StackCP',
    heroSubtitle:
      'Bring scattered domains together into cpcloudhost.com without breaking websites or emails. Verify lock status live, preserve active DNS zones, and automatically add +1 full year onto your current expiry date.',
    primaryCtaText: 'Verify Transfer Eligibility',
    primaryCtaUrl: '#transfer-single-tool',
    secondaryCtaText: 'Register New Domain',
    secondaryCtaUrl: '/domain-registration',
    highlights: [
      'Live registrar lock & 60-day eligibility pre-check',
      'Zero downtime — preserve existing DNS records during cutover',
      'Free ongoing WHOIS privacy & Wildcard SSL readiness',
      'Single or bulk portfolio authorization support',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'migration-free',
    slug: '/migration-free',
    navTitle: 'Free Site Migrations',
    category: 'Domains & Support',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Free Zero-Downtime Website & Server Migrations | cpcloudhost.com',
    seoDescription:
      'Migrate WordPress, cPanel, Windows IIS, IMAP email, or KVM VPS to cpcloudhost.com for free with zero downtime. Compare eligible hosting plans or Buy Hosting & Migrate now.',
    heroBadge: 'White-Glove Engineering Service · $0 Migration Fee',
    heroTitle: 'Seamless, Zero-Downtime Website & Server Migrations',
    heroSubtitle:
      'Leave slow legacy servers behind without risking lost orders or broken emails. Our specialists clone your websites, databases, SSL certificates, and IMAP mailboxes onto cpcloudhost.com with zero downtime—plus Switch Credits up to 12 months.',
    primaryCtaText: 'Buy Hosting & Migrate',
    primaryCtaUrl: '#migration-plans',
    secondaryCtaText: 'Submit Migration Request',
    secondaryCtaUrl: '#migration-form',
    highlights: [
      'cPanel, Plesk, StackCP, WordPress, Windows & VPS transfers',
      'Private cloned sync before any DNS cutover',
      'Up to 12 months Switch Credits on remaining contract balance',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'about-us',
    slug: '/about-us',
    navTitle: 'About Us',
    category: 'Domains & Support',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'About Us — Global Cloud Infrastructure & Leadership | cpcloudhost.com',
    seoDescription:
      'Meet Chief Executive Officer & Founder Mr. Mudassar and the cpcloudhost.com engineering team — powering 99.99% uptime across global NVMe cloud hubs.',
    heroBadge: 'About cpcloudhost.com · Global Cloud & Hosting Platform',
    heroTitle: 'Cloud Infrastructure Engineered for Speed, Trust & Human Support',
    heroSubtitle:
      'cpcloudhost.com delivers NVMe shared cloud hosting, managed WordPress, Windows IIS, root KVM VPS, and domain automation for agencies and businesses worldwide. Every node combines bare-metal reliability with direct access to senior systems engineers.',
    primaryCtaText: 'Explore Hosting Plans',
    primaryCtaUrl: '/shared-hosting',
    secondaryCtaText: 'Free Migration Service',
    secondaryCtaUrl: '/migration-free',
    highlights: [
      '99.99% Uptime SLA across London, US, Frankfurt & APAC',
      'Transparent Multi-Currency Billing',
      '24/7 Direct Engineering Desk',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'knowledge-base',
    slug: '/knowledge-base',
    navTitle: 'Knowledge Base',
    category: 'Domains & Support',
    status: 'published',
    isSystemPage: true,
    seoTitle:
      'Knowledge Base — Domain, Cloud Hosting, VPS & Error Fix Guides | cpcloudhost.com',
    seoDescription:
      'Authoritative technical tutorials and troubleshooting guides for fixing 502 Bad Gateway, database errors, DNS propagation, SSL certificates, VPS hardening, and n8n setup.',
    heroBadge: 'cpcloudhost.com Technical Documentation & Troubleshooting',
    heroTitle: 'Cloud Hosting, Domains & Error Resolution Guides',
    heroSubtitle:
      'Verified step-by-step runbooks written by cpcloudhost.com infrastructure engineers to resolve HTTP errors, configure Anycast DNS records, harden KVM VPS nodes, and optimize WordPress or n8n deployments.',
    primaryCtaText: 'Find Solution',
    primaryCtaUrl: '#kb-directory',
    secondaryCtaText: 'Open Client Support',
    secondaryCtaUrl: '/auth/login',
    highlights: [
      'HTTP 502 / 500 / 403 troubleshooting runbooks',
      'Anycast DNS, SPF, DKIM & SSL setup guides',
      'Linux KVM VPS & n8n webhook tuning',
    ],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'terms-conditions',
    slug: '/terms-conditions',
    navTitle: 'Terms & Conditions',
    category: 'Legal & Policy',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Terms & Conditions | cpcloudhost.com',
    seoDescription:
      'Master Service Agreement governing cpcloudhost.com web hosting, VPS compute, domain registration, and 99.99% uptime SLA.',
    heroBadge: 'cpcloudhost.com Legal Framework',
    heroTitle: 'Master Terms & Conditions of Service',
    heroSubtitle:
      'Governing agreement covering StackCP shared cloud hosting, cPanel accounts, managed WordPress, Windows IIS, KVM VPS nodes, n8n instances, and domain lifecycle operations.',
    primaryCtaText: 'Contact Legal Desk',
    primaryCtaUrl: 'mailto:legal@cpcloudhost.com',
    secondaryCtaText: 'Back to Home',
    secondaryCtaUrl: '/',
    highlights: ['99.99% Uptime SLA Commitments', 'Acceptable Infrastructure Conduct'],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'privacy-policy',
    slug: '/privacy-policy',
    navTitle: 'Privacy Policy',
    category: 'Legal & Policy',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Privacy Policy & Data Protection | cpcloudhost.com',
    seoDescription:
      'International GDPR & data privacy framework explaining how cpcloudhost.com processes account, telemetry, and billing information.',
    heroBadge: 'cpcloudhost.com Legal Framework',
    heroTitle: 'Global Privacy & Data Protection Policy',
    heroSubtitle:
      'Transparent disclosure of how cpcloudhost.com collects, secures, encrypts, and retains client account, support attachment, and infrastructure telemetry data.',
    primaryCtaText: 'Data Privacy Desk',
    primaryCtaUrl: 'mailto:privacy@cpcloudhost.com',
    secondaryCtaText: 'Back to Home',
    secondaryCtaUrl: '/',
    highlights: ['GDPR & International Data Rights', 'TLS 1.3 & Encrypted Storage'],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'order-terms',
    slug: '/order-terms',
    navTitle: 'Order & Billing Terms',
    category: 'Legal & Policy',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Order, Provisioning & Renewal Terms | cpcloudhost.com',
    seoDescription:
      'Service provisioning SLAs, currency conversion rules, domain auto-renewal schedules, and invoicing terms at cpcloudhost.com.',
    heroBadge: 'cpcloudhost.com Legal Framework',
    heroTitle: 'Order Provisioning, Renewal & Billing Terms',
    heroSubtitle:
      'Clear operational rules covering instant provisioning, currency pricing, invoice due dates, Switch Credits redemptions, and domain grace periods.',
    primaryCtaText: 'Billing Inquiry',
    primaryCtaUrl: 'mailto:billing@cpcloudhost.com',
    secondaryCtaText: 'Back to Home',
    secondaryCtaUrl: '/',
    highlights: ['Automated Multi-Currency Invoicing', 'Switch Credits & Domain Grace Rules'],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'refund-policy',
    slug: '/refund-policy',
    navTitle: 'Refund Policy',
    category: 'Legal & Policy',
    status: 'published',
    isSystemPage: true,
    seoTitle: '30-Day Money-Back & Refund Policy | cpcloudhost.com',
    seoDescription:
      'Learn about cpcloudhost.com’s 30-day unconditional hosting money-back guarantee, domain exclusions, and fast refund turnaround.',
    heroBadge: 'cpcloudhost.com Legal Framework',
    heroTitle: '30-Day Money-Back & Refund Policy',
    heroSubtitle:
      'Eligibility criteria, processing timelines, and transparent exclusions for shared cloud, WordPress, cPanel, Windows hosting, VPS compute, and domain registrations.',
    primaryCtaText: 'Request Billing Review',
    primaryCtaUrl: 'mailto:billing@cpcloudhost.com',
    secondaryCtaText: 'Back to Home',
    secondaryCtaUrl: '/',
    highlights: ['30-Day Hosting Guarantee', '5–7 Business Day Refund Processing'],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
  {
    id: 'abuse-policy',
    slug: '/abuse-policy',
    navTitle: 'Report Abuse & AUP',
    category: 'Legal & Policy',
    status: 'published',
    isSystemPage: true,
    seoTitle: 'Report Network Abuse, DMCA & Acceptable Use Policy | cpcloudhost.com',
    seoDescription:
      'Report phishing, malware, spam, or DMCA copyright violations directly to the cpcloudhost.com Trust & Safety engineering team.',
    heroBadge: 'cpcloudhost.com Legal Framework',
    heroTitle: 'Acceptable Use Policy & Network Abuse Portal',
    heroSubtitle:
      'Submit verified phishing, malware, DDoS, spam, or DMCA takedown notices directly to our Trust & Safety moderation queue with guaranteed SLA response times.',
    primaryCtaText: 'File Abuse Report',
    primaryCtaUrl: '#abuse-report-form',
    secondaryCtaText: 'Back to Home',
    secondaryCtaUrl: '/',
    highlights: ['P0 Critical < 2 Hour Triage', 'RFC 2142 & DMCA Compliance Desk'],
    sections: [],
    updatedAtUtc: '2026-11-14 19:00 UTC',
    updatedBy: 'System Default',
  },
];

function readInitialCmsPages(): CmsPageRecord[] {
  const stored = readStorage<CmsPageRecord[]>(CMS_PAGES_KEY, INITIAL_CMS_PAGES);
  const byId = new Map<string, CmsPageRecord>();
  for (const item of stored) {
    byId.set(item.id, item);
  }
  const mergedSystem = INITIAL_CMS_PAGES.map((def) => {
    const existing = byId.get(def.id);
    if (!existing) return def;
    const rawSections = existing.sections ?? def.sections;
    const normalizedSections =
      def.id === 'home'
        ? rawSections.map((sec) =>
            sec.id === 'switch-credits'
              ? {
                  ...sec,
                  heading: sec.heading
                    .replace(/CP Cloud Hosting/gi, 'cpcloudhost.com')
                    .replace(/cpcloudhosting\.com/gi, 'cpcloudhost.com'),
                  body: sec.body
                    .replace(/CP Cloud Hosting/gi, 'cpcloudhost.com')
                    .replace(/cpcloudhosting\.com/gi, 'cpcloudhost.com'),
                }
              : sec
          )
        : rawSections;
    const sanitizedExisting =
      def.id === 'about-us'
        ? {
            ...existing,
            seoDescription:
              existing.seoDescription && /(arslan|irfan)/i.test(existing.seoDescription)
                ? def.seoDescription
                : existing.seoDescription,
            heroSubtitle:
              existing.heroSubtitle && /(arslan|irfan)/i.test(existing.heroSubtitle)
                ? def.heroSubtitle
                : existing.heroSubtitle,
          }
        : existing;
    return {
      ...def,
      ...sanitizedExisting,
      isSystemPage: true,
      slug: def.slug,
      highlights: existing.highlights ?? def.highlights,
      sections: normalizedSections,
      faqItems: existing.faqItems ?? def.faqItems,
    };
  });
  const customPages = stored.filter((p) => !p.isSystemPage && !INITIAL_CMS_PAGES.some((s) => s.id === p.id));
  return [...mergedSystem, ...customPages];
}

function detectClientDeviceSummary(): string {
  if (typeof navigator === 'undefined') return 'Web Portal Client';
  const ua = navigator.userAgent || '';
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Chromium')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  let os = 'Desktop';
  if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} · ${os}`;
}

function resolveSessionTimezoneRegion(fallbackCountry?: string): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return `${fallbackCountry ? `${fallbackCountry} · ` : ''}${tz}`;
  } catch {
    // ignore
  }
  return fallbackCountry || 'Browser Session';
}

function deriveClientIpLabel(): string {
  try {
    const stored = window.localStorage.getItem('cpcloud_client_session_ip_v1');
    if (stored) return stored;
    const oct3 = Math.floor(20 + Math.random() * 210);
    const oct4 = Math.floor(10 + Math.random() * 230);
    const ip = `185.199.${oct3}.${oct4}`;
    window.localStorage.setItem('cpcloud_client_session_ip_v1', ip);
    return ip;
  } catch {
    return '185.199.110.42';
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readInitialUsers(): ManagedUserAccount[] {
  const raw = readStorage<ManagedUserAccount[]>(USERS_KEY, INITIAL_USERS);
  const filtered = raw.filter((u) => {
    const lowerName = (u.name || '').trim().toLowerCase();
    const lowerUsername = (u.username || '').trim().toLowerCase();
    const lowerEmail = (u.email || '').trim().toLowerCase();
    if (
      u.id === 'USR-1002' ||
      lowerName.includes('arslan') ||
      lowerName === 'irfan' ||
      lowerEmail === 'admin@cpcloudhost.com' ||
      lowerUsername === 'arslan'
    ) {
      return false;
    }
    return true;
  });
  const ensuredUsers = filtered.length > 0 ? filtered : INITIAL_USERS;
  return ensuredUsers.map((u) => {
    const baseUser: ManagedUserAccount =
      u.id === 'USR-1001'
        ? {
            ...u,
            name: 'Mr. Mudassar',
            company: 'cpcloudhost.com HQ · CEO & Founder',
            emailVerified: true,
          }
        : {
            ...u,
            emailVerified: u.emailVerified !== false,
          };
    if (!baseUser.supportPin) return baseUser;
    const legacyPin = baseUser.supportPin as unknown as {
      pin: string;
      createdAtUtc?: string;
      expiresAtMs?: number;
    };
    return {
      ...baseUser,
      supportPin: {
        pin: legacyPin.pin,
        createdAtUtc: legacyPin.createdAtUtc || baseUser.createdAt || 'Persistent',
      },
    };
  });
}

function normalizeTicketDepartment(dept: string): TicketDepartment {
  if (dept === 'Migration Site' || dept === 'Site Migration') return 'Migration Site';
  if (dept === 'Billing' || dept === 'Billing & Accounts') return 'Billing';
  if (dept === 'Account') return 'Account';
  if (dept === 'Support') return 'Support';
  if (dept === 'Abuse' || dept === 'Abuse & Trust') return 'Abuse';
  return 'Technical Support';
}

function normalizeTicketStatus(status: string): TicketStatus {
  if (status === 'resolved' || status === 'closed') return 'resolved';
  if (status === 'pending' || status === 'answered') return 'pending';
  return 'open';
}

function readInitialTickets(): SupportTicketRecord[] {
  const raw = readStorage<SupportTicketRecord[]>(TICKETS_KEY, INITIAL_TICKETS);
  return raw.map((t) => ({
    ...t,
    department: normalizeTicketDepartment(t.department as string),
    status: normalizeTicketStatus(t.status as string),
    messages: Array.isArray(t.messages)
      ? t.messages.map((m) =>
          m.authorRole === 'support'
            ? { ...m, authorName: 'Support cpcloudhost' }
            : m
        )
      : [],
  }));
}

function deriveInvoiceIdFromOrderId(orderId: string, prefix = 'INV-'): string {
  const cleanPrefix = prefix || 'INV-';
  return orderId.startsWith('ORD-')
    ? `${cleanPrefix}${orderId.slice(4)}`
    : `${cleanPrefix}${orderId}`;
}

export function computeDefaultNextDueDate(
  startDateStr: string,
  cycle: PlatformOrder['billingCycle']
): string {
  const cleanDate = startDateStr.slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(cleanDate)
    ? new Date(`${cleanDate}T00:00:00Z`)
    : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10);
  }
  if (cycle === 'Monthly' || cycle === '1 Month') {
    parsed.setUTCMonth(parsed.getUTCMonth() + 1);
  } else if (cycle === '2 Years') {
    parsed.setUTCFullYear(parsed.getUTCFullYear() + 2);
  } else if (cycle === '4 Years') {
    parsed.setUTCFullYear(parsed.getUTCFullYear() + 4);
  } else if (cycle === '5-Year') {
    parsed.setUTCFullYear(parsed.getUTCFullYear() + 5);
  } else {
    parsed.setUTCFullYear(parsed.getUTCFullYear() + 1);
  }
  return parsed.toISOString().slice(0, 10);
}

function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  taxRatePercent: number,
  discountUsd: number
): { subtotalUsd: number; totalUsd: number } {
  const subtotalUsd = Number(
    items
      .reduce((sum, item) => sum + (Number(item.lineTotalUsd) || 0), 0)
      .toFixed(2)
  );
  const cleanDiscount = Math.max(0, Number(discountUsd) || 0);
  const taxableBase = Math.max(0, subtotalUsd - cleanDiscount);
  const cleanTax = Math.max(0, Number(taxRatePercent) || 0);
  const totalUsd = Number((taxableBase * (1 + cleanTax / 100)).toFixed(2));
  return { subtotalUsd, totalUsd };
}

function normalizeInvoiceRecord(raw: Partial<PlatformInvoice> & { id: string }): PlatformInvoice {
  const fallbackItem: InvoiceLineItem = {
    id: `ITEM-${raw.id}-1`,
    description: raw.planName || 'Cloud Hosting Service',
    productType: raw.productType || 'cPanel Hosting',
    domainOrHost: raw.domainOrHost || 'service.cpcloudhost.com',
    billingCycle: raw.billingCycle || 'Yearly',
    quantity: 1,
    unitPriceUsd: Number(raw.amountUsd) || 0,
    lineTotalUsd: Number(raw.amountUsd) || 0,
  };
  const items =
    Array.isArray(raw.items) && raw.items.length > 0
      ? raw.items.map((it, idx) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const unit = Math.max(0, Number(it.unitPriceUsd) || 0);
          return {
            ...it,
            id: it.id || `ITEM-${raw.id}-${idx + 1}`,
            quantity: qty,
            unitPriceUsd: unit,
            lineTotalUsd: Number((qty * unit).toFixed(2)),
          };
        })
      : [fallbackItem];
  const taxRatePercent = Number(raw.taxRatePercent) || 0;
  const discountUsd = Number(raw.discountUsd) || 0;
  const { subtotalUsd, totalUsd } = calculateInvoiceTotals(items, taxRatePercent, discountUsd);
  const first = items[0];
  const validStatuses: InvoiceStatus[] = [
    'paid',
    'unpaid',
    'pending',
    'overdue',
    'cancelled',
    'refunded',
  ];
  const status: InvoiceStatus = validStatuses.includes(raw.status as InvoiceStatus)
    ? (raw.status as InvoiceStatus)
    : 'unpaid';

  return {
    id: raw.id,
    orderId: raw.orderId || '',
    clientEmail: (raw.clientEmail || '').toLowerCase(),
    clientName: raw.clientName || 'Client',
    productType:
      first.productType === 'Custom Service' || first.productType === 'Setup / Add-on'
        ? raw.productType || 'cPanel Hosting'
        : first.productType,
    planName: first.description || raw.planName || 'Hosting Service',
    domainOrHost: first.domainOrHost || raw.domainOrHost || '—',
    billingCycle:
      first.billingCycle === 'One-Time'
        ? raw.billingCycle || 'Yearly'
        : first.billingCycle,
    items,
    subtotalUsd,
    taxRatePercent,
    discountUsd,
    amountUsd: totalUsd,
    issuedDate: raw.issuedDate || new Date().toISOString().slice(0, 10),
    dueDate: raw.dueDate || new Date().toISOString().slice(0, 10),
    status,
    paymentMethod: raw.paymentMethod || 'Invoice Pending',
    transactionRef: raw.transactionRef,
    paymentSubmittedAt: raw.paymentSubmittedAt,
    paymentDetailsNote: raw.paymentDetailsNote,
    paidAt: raw.paidAt,
    notes: raw.notes,
    datacenter: raw.datacenter,
    isFreeTrial: raw.isFreeTrial,
    trialDays: raw.trialDays,
    serverConfig: raw.serverConfig,
    autoGeneratedAt: raw.autoGeneratedAt,
    autoGeneratedTrigger: raw.autoGeneratedTrigger,
    cancellationStatus: raw.cancellationStatus || 'none',
    cancellationType: raw.cancellationType,
    cancellationReason: raw.cancellationReason,
    cancellationRequestedAt: raw.cancellationRequestedAt,
    cancellationReviewedAt: raw.cancellationReviewedAt,
    cancellationAdminNote: raw.cancellationAdminNote,
    refundStatus: raw.refundStatus || (status === 'refunded' ? 'processed' : 'none'),
    refundReason: raw.refundReason,
    refundAmountUsd: raw.refundAmountUsd,
    refundRequestedAt: raw.refundRequestedAt,
    refundProcessedAt: raw.refundProcessedAt,
    refundAdminNote: raw.refundAdminNote,
  };
}

function getBillingCycleMonthsMultiplier(cycle: PlatformOrder['billingCycle']): number {
  if (cycle === '2 Years') return 24;
  if (cycle === '4 Years') return 48;
  if (cycle === '5-Year') return 60;
  if (cycle === '1 Year' || cycle === 'Yearly') return 12;
  return 1;
}

function buildInvoiceFromOrder(
  order: PlatformOrder,
  templateConfig?: InvoiceTemplateConfig,
  overrides?: {
    status?: InvoiceStatus;
    paidAt?: string;
    autoGeneratedAt?: string;
    autoGeneratedTrigger?: 'order_created' | 'order_approved' | 'manual';
    notes?: string;
  }
): PlatformInvoice {
  const issuedDate = order.createdAt.slice(0, 10);
  const dueDate =
    order.nextDueDate || computeDefaultNextDueDate(issuedDate, order.billingCycle);
  const paid =
    overrides?.status !== undefined
      ? overrides.status === 'paid'
      : order.invoicePaid !== undefined
        ? order.invoicePaid
        : order.status !== 'pending';
  const status: InvoiceStatus =
    overrides?.status ??
    (order.status === 'refunded'
      ? 'refunded'
      : order.status === 'cancelled' && !paid
        ? 'cancelled'
        : paid
          ? 'paid'
          : 'unpaid');
  const id = deriveInvoiceIdFromOrderId(
    order.id,
    templateConfig?.invoicePrefix || 'INV-'
  );
  const discountUsd = Math.max(0, Number(order.discountUsd) || 0);
  const grossOrderTotalUsd = Number((order.amountUsd + discountUsd).toFixed(2));
  const taxRatePercent = Math.max(0, Number(templateConfig?.defaultTaxRatePercent) || 0);

  const cycleMonths = getBillingCycleMonthsMultiplier(order.billingCycle);
  const cfg = order.serverConfig;
  const items: InvoiceLineItem[] = [];

  if (cfg) {
    const backupTotalUsd =
      cfg.backupAddon && cfg.backupAddon !== 'none' && (cfg.backupAddonMonthlyUsd || 0) > 0
        ? Number(((cfg.backupAddonMonthlyUsd || 0) * cycleMonths).toFixed(2))
        : 0;
    const ipTotalUsd =
      cfg.dedicatedIpAddon && (cfg.dedicatedIpMonthlyUsd || 0) > 0
        ? Number(((cfg.dedicatedIpMonthlyUsd || 0) * cycleMonths).toFixed(2))
        : 0;
    const fwTotalUsd =
      cfg.firewallShieldAddon && (cfg.firewallShieldMonthlyUsd || 0) > 0
        ? Number(((cfg.firewallShieldMonthlyUsd || 0) * cycleMonths).toFixed(2))
        : 0;
    const addonsSum = Number((backupTotalUsd + ipTotalUsd + fwTotalUsd).toFixed(2));
    const basePlanUsd = Math.max(0, Number((grossOrderTotalUsd - addonsSum).toFixed(2)));

    items.push({
      id: `ITEM-${id}-1`,
      description: `${order.planName} — ${cfg.osName} ${cfg.osVersion}${
        order.promoCode ? ` (Promo: ${order.promoCode})` : ''
      }`,
      productType: order.productType,
      domainOrHost: cfg.hostname || order.domainOrHost,
      billingCycle: order.billingCycle,
      quantity: 1,
      unitPriceUsd: basePlanUsd,
      lineTotalUsd: basePlanUsd,
    });

    if (backupTotalUsd > 0) {
      items.push({
        id: `ITEM-${id}-2`,
        description: cfg.backupAddonLabel || 'Automated Off-Site Backup Add-on',
        productType: 'Setup / Add-on',
        domainOrHost: cfg.hostname || order.domainOrHost,
        billingCycle: order.billingCycle,
        quantity: 1,
        unitPriceUsd: backupTotalUsd,
        lineTotalUsd: backupTotalUsd,
      });
    }
    if (ipTotalUsd > 0) {
      items.push({
        id: `ITEM-${id}-3`,
        description: 'Additional Dedicated IPv4 Address',
        productType: 'Setup / Add-on',
        domainOrHost: cfg.hostname || order.domainOrHost,
        billingCycle: order.billingCycle,
        quantity: 1,
        unitPriceUsd: ipTotalUsd,
        lineTotalUsd: ipTotalUsd,
      });
    }
    if (fwTotalUsd > 0) {
      items.push({
        id: `ITEM-${id}-4`,
        description: 'Managed Malware & Network Firewall Shield',
        productType: 'Setup / Add-on',
        domainOrHost: cfg.hostname || order.domainOrHost,
        billingCycle: order.billingCycle,
        quantity: 1,
        unitPriceUsd: fwTotalUsd,
        lineTotalUsd: fwTotalUsd,
      });
    }
  } else {
    items.push({
      id: `ITEM-${id}-1`,
      description: order.isFreeTrial
        ? `${order.planName} — 30-Day Free Trial${
            order.promoCode ? ` (Promo: ${order.promoCode})` : ''
          }`
        : order.promoCode
          ? `${order.planName} (Promo: ${order.promoCode})`
          : order.planName,
      productType: order.productType,
      domainOrHost: order.domainOrHost,
      billingCycle: order.billingCycle,
      quantity: 1,
      unitPriceUsd: grossOrderTotalUsd,
      lineTotalUsd: grossOrderTotalUsd,
    });
  }

  const { subtotalUsd, totalUsd } = calculateInvoiceTotals(
    items,
    taxRatePercent,
    discountUsd
  );

  return {
    id,
    orderId: order.id,
    clientEmail: order.clientEmail,
    clientName: order.clientName,
    productType: order.productType,
    planName: order.planName,
    domainOrHost: order.domainOrHost,
    billingCycle: order.billingCycle,
    items,
    subtotalUsd,
    taxRatePercent,
    discountUsd,
    amountUsd: taxRatePercent > 0 ? totalUsd : order.amountUsd,
    issuedDate,
    dueDate,
    status,
    paymentMethod: order.paymentMethod || 'Invoice Pending',
    transactionRef: order.transactionRef,
    paymentSubmittedAt: order.paymentSubmittedAt,
    paymentDetailsNote: order.paymentDetailsNote,
    paidAt:
      overrides?.paidAt ??
      (status === 'paid'
        ? new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
        : undefined),
    notes: overrides?.notes ?? order.notes,
    datacenter: order.datacenter,
    promoCode: order.promoCode,
    isFreeTrial: order.isFreeTrial,
    trialDays: order.trialDays,
    serverConfig: order.serverConfig,
    autoGeneratedAt: overrides?.autoGeneratedAt,
    autoGeneratedTrigger: overrides?.autoGeneratedTrigger,
    cancellationStatus: order.cancellationStatus || (order.status === 'cancelled' ? 'completed' : 'none'),
    cancellationType: order.cancellationType,
    cancellationReason: order.cancellationReason,
    cancellationRequestedAt: order.cancellationRequestedAt,
    cancellationReviewedAt: order.cancellationReviewedAt,
    cancellationAdminNote: order.cancellationAdminNote,
    refundStatus: order.refundStatus || (status === 'refunded' ? 'processed' : 'none'),
    refundReason: order.refundReason,
    refundAmountUsd: order.refundAmountUsd,
    refundRequestedAt: order.refundRequestedAt,
    refundProcessedAt: order.refundProcessedAt,
    refundAdminNote: order.refundAdminNote,
  };
}

function readInitialInvoices(): PlatformInvoice[] {
  runOneTimeProductionStorageCleanup();
  const stored = readStorage<PlatformInvoice[] | null>(INVOICES_KEY, null);
  if (stored && Array.isArray(stored)) {
    return stored.map((inv) => normalizeInvoiceRecord(inv));
  }
  return [];
}

function readInitialPaymentMethods(): PaymentMethodConfig[] {
  const stored = readStorage<PaymentMethodConfig[] | null>(PAYMENT_METHODS_KEY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return INITIAL_PAYMENT_METHODS;
  }
  const byId = new Map(stored.map((m) => [m.id, m]));
  const mergedSystem = INITIAL_PAYMENT_METHODS.map((def) => {
    const existing = byId.get(def.id);
    return existing ? { ...def, ...existing, isSystem: true } : def;
  });
  const custom = stored.filter(
    (m) => !m.isSystem && !INITIAL_PAYMENT_METHODS.some((d) => d.id === m.id)
  );
  return [...mergedSystem, ...custom].sort((a, b) => a.sortOrder - b.sortOrder);
}

function readInitialTldExtensions(): TldExtensionRecord[] {
  const stored = readStorage<TldExtensionRecord[] | null>(TLD_EXTENSIONS_KEY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return INITIAL_TLD_EXTENSIONS;
  }
  return stored;
}

function readInitialModules(): ProvisioningModuleRecord[] {
  runOneTimeProductionStorageCleanup();
  const stored = readStorage<ProvisioningModuleRecord[] | null>(PROVISIONING_MODULES_KEY, null);
  if (!stored || !Array.isArray(stored)) {
    return INITIAL_PROVISIONING_MODULES;
  }
  return stored;
}

function readInitialHostingPlans(): ManagedHostingPlanRecord[] {
  const stored = readStorage<ManagedHostingPlanRecord[] | null>(HOSTING_PLANS_KEY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return INITIAL_MANAGED_PLANS;
  }
  const byId = new Map(INITIAL_MANAGED_PLANS.map((p) => [p.id, p]));
  const normalized = stored.map((plan) => {
    const def = byId.get(plan.id);
    const baseYear = plan.yearlyPrice || plan.monthlyPrice * 12;
    const twoYear =
      plan.twoYearPrice !== undefined && plan.twoYearPrice > 0
        ? plan.twoYearPrice
        : def?.twoYearPrice ?? Number((baseYear * 1.8).toFixed(2));
    const fourYear =
      plan.fourYearPrice !== undefined && plan.fourYearPrice > 0
        ? plan.fourYearPrice
        : def?.fourYearPrice ?? Number((baseYear * 3.2).toFixed(2));
    let nextFeatures = Array.isArray(plan.features) ? [...plan.features] : [];
    if (
      (plan.pageCategory === 'shared-hosting' || plan.pageCategory === 'cpanel-hosting') &&
      !nextFeatures.some((f) => f.toLowerCase().includes('.com'))
    ) {
      nextFeatures = [...nextFeatures, '1 Free .com Domain (1-Yr w/ 1Y/2Y/4Y Plan)'];
    }
    return {
      ...plan,
      twoYearPrice: twoYear,
      fourYearPrice: fourYear,
      features: nextFeatures,
    };
  });
  const existingIds = new Set(normalized.map((p) => p.id));
  const missingReseller = INITIAL_MANAGED_PLANS.filter(
    (def) => def.pageCategory === 'reseller-hosting' && !existingIds.has(def.id)
  );
  return missingReseller.length > 0 ? [...normalized, ...missingReseller] : normalized;
}

function readInitialSystemSettings(): SystemIntegrationSettings {
  const stored = readStorage<SystemIntegrationSettings | null>(SYSTEM_SETTINGS_KEY, null);
  if (!stored || typeof stored !== 'object') {
    return DEFAULT_SYSTEM_SETTINGS;
  }
  return {
    smtp: { ...DEFAULT_SYSTEM_SETTINGS.smtp, ...(stored.smtp || {}) },
    googleOAuth: { ...DEFAULT_SYSTEM_SETTINGS.googleOAuth, ...(stored.googleOAuth || {}) },
    adminAlerts: { ...DEFAULT_SYSTEM_SETTINGS.adminAlerts, ...(stored.adminAlerts || {}) },
    updatedAtUtc: stored.updatedAtUtc || DEFAULT_SYSTEM_SETTINGS.updatedAtUtc,
  };
}

function readInitialPromoCodes(): PromoCodeRecord[] {
  const stored = readStorage<PromoCodeRecord[] | null>(PROMO_CODES_KEY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return INITIAL_PROMO_CODES;
  }
  const existingCodes = new Set(stored.map((p) => p.code.toUpperCase()));
  const missingSystem = INITIAL_PROMO_CODES.filter(
    (def) => !existingCodes.has(def.code.toUpperCase())
  );
  return missingSystem.length > 0 ? [...stored, ...missingSystem] : stored;
}

function readInitialOrderDraft(): OrderCheckoutDraft | null {
  return readStorage<OrderCheckoutDraft | null>(ORDER_DRAFT_KEY, null);
}

function readInitialLastSearchedDomain(): LastSearchedDomain | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_SEARCHED_DOMAIN_KEY);
    return raw ? (JSON.parse(raw) as LastSearchedDomain) : null;
  } catch {
    return null;
  }
}

function readInitialPostAuthPath(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(POST_AUTH_REDIRECT_KEY) || null;
  } catch {
    return null;
  }
}

function readInitialEmailTemplates(): EmailTemplateRecord[] {
  const stored = readStorage<EmailTemplateRecord[] | null>(EMAIL_TEMPLATES_KEY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return INITIAL_EMAIL_TEMPLATES;
  }
  const byId = new Map(stored.map((t) => [t.id, t]));
  const mergedSystem = INITIAL_EMAIL_TEMPLATES.map((def) => {
    const existing = byId.get(def.id);
    return existing ? { ...def, ...existing, isSystem: true, key: def.key } : def;
  });
  const custom = stored.filter(
    (t) => !t.isSystem && !INITIAL_EMAIL_TEMPLATES.some((d) => d.id === t.id)
  );
  return [...mergedSystem, ...custom];
}

function readInitialImpersonation(): AdminImpersonationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.sessionStorage.getItem(IMPERSONATOR_KEY) ||
      window.localStorage.getItem(IMPERSONATOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminImpersonationState;
  } catch {
    return null;
  }
}

function readInitialSession(): AuthSessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const persistent = window.localStorage.getItem(SESSION_KEY);
    if (persistent) return JSON.parse(persistent) as AuthSessionUser;
    const temp = window.sessionStorage.getItem(SESSION_KEY);
    if (temp) return JSON.parse(temp) as AuthSessionUser;
  } catch {
    return null;
  }
  return null;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() =>
    readInitialSession()
  );
  const [adminImpersonation, setAdminImpersonation] =
    useState<AdminImpersonationState | null>(() => readInitialImpersonation());
  const [rememberedIdentifier, setRememberedIdentifier] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(REMEMBER_ID_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [rememberSession, setRememberSession] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return false;
      return true;
    } catch {
      return true;
    }
  });
  const [users, setUsers] = useState<ManagedUserAccount[]>(() =>
    readInitialUsers()
  );
  const [orders, setOrders] = useState<PlatformOrder[]>(() =>
    readInitialOrdersWithSync()
  );
  const [invoices, setInvoices] = useState<PlatformInvoice[]>(() =>
    readInitialInvoices()
  );
  const [allDomainContacts, setAllDomainContacts] = useState<DomainContactAddress[]>(() =>
    readInitialDomainContacts()
  );
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(() =>
    readInitialTickets()
  );
  const [abuseComplaints, setAbuseComplaints] = useState<AbuseComplaintRecord[]>(
    () => readStorage<AbuseComplaintRecord[]>(ABUSE_KEY, INITIAL_ABUSE)
  );
  const [loginActivityLogs, setLoginActivityLogs] = useState<LoginActivityRecord[]>(
    () => readStorage<LoginActivityRecord[]>(LOGIN_LOGS_KEY, INITIAL_LOGIN_LOGS)
  );
  const [cmsPages, setCmsPages] = useState<CmsPageRecord[]>(() =>
    readInitialCmsPages()
  );
  const [cmsSiteSettings, setCmsSiteSettings] = useState<CmsSiteSettings>(() =>
    readStorage<CmsSiteSettings>(CMS_SETTINGS_KEY, DEFAULT_CMS_SITE_SETTINGS)
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() =>
    readInitialPaymentMethods()
  );
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateRecord[]>(() =>
    readInitialEmailTemplates()
  );
  const [invoiceTemplateConfig, setInvoiceTemplateConfig] =
    useState<InvoiceTemplateConfig>(() => ({
      ...DEFAULT_INVOICE_TEMPLATE,
      ...readStorage<Partial<InvoiceTemplateConfig>>(
        INVOICE_TEMPLATE_KEY,
        DEFAULT_INVOICE_TEMPLATE
      ),
    }));
  const [tldExtensions, setTldExtensions] = useState<TldExtensionRecord[]>(() =>
    readInitialTldExtensions()
  );
  const [provisioningModules, setProvisioningModules] = useState<
    ProvisioningModuleRecord[]
  >(() => readInitialModules());
  const [hostingPlans, setHostingPlans] = useState<ManagedHostingPlanRecord[]>(() =>
    readInitialHostingPlans()
  );
  const [systemSettings, setSystemSettings] = useState<SystemIntegrationSettings>(() =>
    readInitialSystemSettings()
  );
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>(() =>
    readInitialPromoCodes()
  );
  const [ipSecurityRecords, setIpSecurityRecords] = useState<IpSecurityRecord[]>([]);
  const [dbSyncedAtUtc, setDbSyncedAtUtc] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return (
        window.localStorage.getItem(AUTH_TOKEN_KEY) ||
        window.sessionStorage.getItem(AUTH_TOKEN_KEY) ||
        null
      );
    } catch {
      return null;
    }
  });
  const dbHydratedRef = useRef<boolean>(false);
  const suppressNextSyncRef = useRef<boolean>(false);
  const syncTimerRef = useRef<number | null>(null);

  const [orderCheckoutDraft, setOrderCheckoutDraftState] =
    useState<OrderCheckoutDraft | null>(() => readInitialOrderDraft());
  const [lastSearchedDomain, setLastSearchedDomainState] =
    useState<LastSearchedDomain | null>(() => readInitialLastSearchedDomain());
  const [pendingPostAuthPath, setPendingPostAuthPathState] = useState<string | null>(() =>
    readInitialPostAuthPath()
  );
  const [pendingChallenge, setPendingChallenge] = useState<{
    userId: string;
    email: string;
    name: string;
    identifierUsed: string;
    rememberMe: boolean;
    portal: 'client' | 'admin';
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (authToken) {
        if (rememberSession) {
          window.localStorage.setItem(AUTH_TOKEN_KEY, authToken);
          window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
        } else {
          window.sessionStorage.setItem(AUTH_TOKEN_KEY, authToken);
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // ignore
    }
  }, [authToken, rememberSession]);

  useEffect(() => {
    try {
      if (currentUser) {
        if (rememberSession) {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
          window.sessionStorage.removeItem(SESSION_KEY);
        } else {
          window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
          window.localStorage.removeItem(SESSION_KEY);
        }
      } else {
        window.localStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [currentUser, rememberSession]);

  useEffect(() => {
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DOMAIN_CONTACTS_KEY, JSON.stringify(allDomainContacts));
    } catch {
      // ignore
    }
  }, [allDomainContacts]);

  const usersRef = useRef<ManagedUserAccount[]>(users);
  usersRef.current = users;
  const ordersRef = useRef<PlatformOrder[]>(orders);
  ordersRef.current = orders;
  const provisioningModulesRef = useRef<ProvisioningModuleRecord[]>(provisioningModules);
  provisioningModulesRef.current = provisioningModules;
  const systemSettingsRef = useRef<SystemIntegrationSettings>(systemSettings);
  systemSettingsRef.current = systemSettings;
  const invoiceTemplateConfigRef = useRef<InvoiceTemplateConfig>(invoiceTemplateConfig);
  invoiceTemplateConfigRef.current = invoiceTemplateConfig;
  const emailTemplatesRef = useRef<EmailTemplateRecord[]>(emailTemplates);
  emailTemplatesRef.current = emailTemplates;

  const appendLoginActivity = useCallback(
    (entry: {
      userEmail: string;
      userName: string;
      eventType: LoginActivityEventType;
      status: LoginActivityStatus;
      authMethod: string;
      country?: string;
    }) => {
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const record: LoginActivityRecord = {
        id: `LOG-${Math.floor(100000 + Math.random() * 899999)}`,
        userEmail: entry.userEmail.toLowerCase(),
        userName: entry.userName,
        eventType: entry.eventType,
        status: entry.status,
        authMethod: entry.authMethod,
        deviceSummary: detectClientDeviceSummary(),
        ipAddress: deriveClientIpLabel(),
        locationLabel: resolveSessionTimezoneRegion(entry.country),
        timestampUtc: nowUtc,
      };
      setLoginActivityLogs((prev) => [record, ...prev].slice(0, 100));
    },
    []
  );

  const dispatchSuspensionNoticeEmail = useCallback(
    (order: PlatformOrder, reason: string) => {
      const smtp = systemSettingsRef.current.smtp;
      if (typeof window === 'undefined' || !isSmtpConfigured(smtp)) {
        return;
      }
      const tpl =
        emailTemplatesRef.current.find((t) => t.key === 'service-suspended' || t.id === 'service-suspended') ??
        INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'service-suspended');
      if (!tpl || !tpl.enabled) return;
      const cfg = invoiceTemplateConfigRef.current;
      const mergeVars: Record<string, string> = {
        company_name: cfg.companyName || 'CPCloudHost',
        client_name: order.clientName,
        plan_name: order.planName,
        domain: order.domainOrHost,
        reason,
        server_ip: order.serverIp || order.datacenter,
        due_date: order.nextDueDate || '',
        order_id: order.id,
      };
      void fetch('/api/system/send-templated-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp,
          toEmail: order.clientEmail,
          companyName: cfg.companyName,
          companyEmail: cfg.companyEmail,
          companyWebsite: cfg.companyWebsite,
          accentColor: cfg.accentColor,
          headerBadge: 'BILLING SUSPENSION NOTICE',
          subject: renderEmailMergeText(tpl.subject, mergeVars),
          preheader: renderEmailMergeText(tpl.preheader, mergeVars),
          heading: renderEmailMergeText(tpl.heading, mergeVars),
          body: renderEmailMergeText(tpl.body, mergeVars),
          ctaLabel: renderEmailMergeText(tpl.ctaLabel, mergeVars),
          ctaUrl: renderEmailMergeText(tpl.ctaUrl, mergeVars),
          footerNote: renderEmailMergeText(tpl.footerNote, mergeVars),
        }),
      }).catch(() => undefined);
    },
    []
  );

  const syncWhmAccountState = useCallback(
    (order: PlatformOrder, action: 'suspend' | 'unsuspend', reason?: string) => {
      if (typeof window === 'undefined' || !order.serverModuleId) return;
      const mod = provisioningModulesRef.current.find(
        (m) =>
          m.id === order.serverModuleId &&
          m.enabled &&
          m.moduleType === 'whm' &&
          Boolean(m.apiToken && m.apiToken.trim())
      );
      if (!mod) return;
      const acctUser =
        order.cpanelUsername?.trim() ||
        normalizeCpanelUsernameFallback(order.domainOrHost);
      const endpoint =
        action === 'suspend'
          ? '/api/modules/whm/suspend'
          : '/api/modules/whm/unsuspend';
      const resolvedReason =
        reason ||
        (action === 'suspend'
          ? 'Automated due-date billing suspension'
          : 'Reactivated after billing settlement');

      void fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: mod.id,
          hostname: mod.hostname,
          port: mod.port,
          useSsl: mod.useSsl,
          username: mod.username,
          apiToken: mod.apiToken,
          ignoreSslErrors: mod.ignoreSslErrors,
          acctUsername: acctUser,
          cpanelUsername: acctUser,
          reason: resolvedReason,
        }),
      })
        .then(async (resp) => {
          const data = (await resp.json().catch(() => ({}))) as {
            ok?: boolean;
            reason?: string;
            message?: string;
            error?: string;
          };
          const ok = resp.ok && Boolean(data.ok);
          appendLoginActivity({
            userEmail: order.clientEmail,
            userName: order.clientName,
            eventType: ok
              ? action === 'suspend'
                ? 'WHM Account Auto-Suspended'
                : 'WHM Account Unsuspended'
              : 'WHM State Sync Warning',
            status: ok ? 'success' : 'warning',
            authMethod: `${mod.name} (${acctUser}): ${
              ok ? data.reason || data.message || 'Done' : data.error || `HTTP ${resp.status}`
            }`,
            country: order.country,
          });
        })
        .catch((err) => {
          appendLoginActivity({
            userEmail: order.clientEmail,
            userName: order.clientName,
            eventType: 'WHM State Sync Warning',
            status: 'warning',
            authMethod: `${mod.name} (${acctUser}): ${
              err instanceof Error ? err.message : 'Network error'
            }`,
            country: order.country,
          });
        });
    },
    [appendLoginActivity]
  );

  const executeDueDateSweep = useCallback(() => {
    const res = applyAutomaticOrderExpirations(ordersRef.current);
    if (!res.changed) {
      return { suspendedCount: 0, expiredCount: 0 };
    }
    ordersRef.current = res.orders;
    setOrders(res.orders);

    const affectedIds = new Set([...res.newlySuspendedIds, ...res.newlyExpiredIds]);
    if (affectedIds.size > 0) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.orderId &&
          affectedIds.has(inv.orderId) &&
          (inv.status === 'unpaid' || inv.status === 'pending')
            ? { ...inv, status: 'overdue' }
            : inv
        )
      );
      res.newlySuspendedIds.forEach((ordId) => {
        const ord = res.orders.find((o) => o.id === ordId);
        if (ord) {
          const reason = `Automated due-date billing suspension (${ord.nextDueDate || 'due'})`;
          syncWhmAccountState(ord, 'suspend', reason);
          dispatchSuspensionNoticeEmail(ord, reason);
          appendLoginActivity({
            userEmail: ord.clientEmail,
            userName: ord.clientName,
            eventType: 'Service Auto-Suspended (Due Date)',
            status: 'warning',
            authMethod: `${ord.id} · ${ord.domainOrHost}`,
            country: ord.country,
          });
        }
      });
    }
    return {
      suspendedCount: res.newlySuspendedIds.length,
      expiredCount: res.newlyExpiredIds.length,
    };
  }, [syncWhmAccountState, dispatchSuspensionNoticeEmail, appendLoginActivity]);

  const runDueDateBillingSweep = useCallback(
    () => executeDueDateSweep(),
    [executeDueDateSweep]
  );

  // Automatic date-based service suspension & domain expiry check (on mount, focus & every 30s)
  useEffect(() => {
    executeDueDateSweep();
    const timer = window.setInterval(() => {
      executeDueDateSweep();
    }, 30000);
    const onFocusSweep = () => {
      executeDueDateSweep();
    };
    window.addEventListener('focus', onFocusSweep);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocusSweep);
    };
  }, [executeDueDateSweep]);

  useEffect(() => {
    try {
      window.localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    } catch {
      // ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
    } catch {
      // ignore
    }
  }, [paymentMethods]);

  useEffect(() => {
    try {
      window.localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(emailTemplates));
    } catch {
      // ignore
    }
  }, [emailTemplates]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        INVOICE_TEMPLATE_KEY,
        JSON.stringify(invoiceTemplateConfig)
      );
    } catch {
      // ignore
    }
  }, [invoiceTemplateConfig]);

  useEffect(() => {
    try {
      if (adminImpersonation) {
        window.sessionStorage.setItem(
          IMPERSONATOR_KEY,
          JSON.stringify(adminImpersonation)
        );
      } else {
        window.sessionStorage.removeItem(IMPERSONATOR_KEY);
        window.localStorage.removeItem(IMPERSONATOR_KEY);
      }
    } catch {
      // ignore
    }
  }, [adminImpersonation]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ABUSE_KEY, JSON.stringify(abuseComplaints));
    } catch {
      // ignore
    }
  }, [abuseComplaints]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOGIN_LOGS_KEY,
        JSON.stringify(loginActivityLogs.slice(0, 100))
      );
    } catch {
      // ignore
    }
  }, [loginActivityLogs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CMS_PAGES_KEY, JSON.stringify(cmsPages));
    } catch {
      // ignore
    }
  }, [cmsPages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CMS_SETTINGS_KEY, JSON.stringify(cmsSiteSettings));
    } catch {
      // ignore
    }
  }, [cmsSiteSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TLD_EXTENSIONS_KEY, JSON.stringify(tldExtensions));
    } catch {
      // ignore
    }
  }, [tldExtensions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PROVISIONING_MODULES_KEY,
        JSON.stringify(provisioningModules)
      );
    } catch {
      // ignore
    }
  }, [provisioningModules]);

  useEffect(() => {
    try {
      window.localStorage.setItem(HOSTING_PLANS_KEY, JSON.stringify(hostingPlans));
    } catch {
      // ignore
    }
  }, [hostingPlans]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(systemSettings));
    } catch {
      // ignore
    }
  }, [systemSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROMO_CODES_KEY, JSON.stringify(promoCodes));
    } catch {
      // ignore
    }
  }, [promoCodes]);

  useEffect(() => {
    try {
      if (orderCheckoutDraft) {
        window.localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(orderCheckoutDraft));
      } else {
        window.localStorage.removeItem(ORDER_DRAFT_KEY);
      }
    } catch {
      // ignore
    }
  }, [orderCheckoutDraft]);

  useEffect(() => {
    try {
      if (lastSearchedDomain) {
        window.sessionStorage.setItem(
          LAST_SEARCHED_DOMAIN_KEY,
          JSON.stringify(lastSearchedDomain)
        );
      } else {
        window.sessionStorage.removeItem(LAST_SEARCHED_DOMAIN_KEY);
      }
    } catch {
      // ignore
    }
  }, [lastSearchedDomain]);

  useEffect(() => {
    try {
      if (pendingPostAuthPath) {
        window.localStorage.setItem(POST_AUTH_REDIRECT_KEY, pendingPostAuthPath);
      } else {
        window.localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      }
    } catch {
      // ignore
    }
  }, [pendingPostAuthPath]);

  const isAdmin = useMemo(
    () => Boolean(currentUser && currentUser.role === 'admin' && currentUser.status === 'active'),
    [currentUser]
  );

  const applyBootstrapStateFromServer = useCallback(
    (remote: Record<string, any> | null | undefined) => {
      if (!remote) return;
      suppressNextSyncRef.current = true;
      if (Array.isArray(remote.users) && remote.users.length > 0) {
        setUsers(remote.users);
        // Enforce immediate sign-out if logged-in client account was suspended in Supabase
        if (currentUser) {
          const updatedSelf = (remote.users as ManagedUserAccount[]).find(
            (u) => u.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (
            updatedSelf &&
            updatedSelf.role !== 'admin' &&
            (updatedSelf.status === 'suspended' || updatedSelf.status === 'cancelled')
          ) {
            setCurrentUser(null);
            setAuthToken(null);
          }
        }
      }
      if (Array.isArray(remote.orders)) setOrders(remote.orders);
      if (Array.isArray(remote.invoices)) setInvoices(remote.invoices);
      if (Array.isArray(remote.tickets)) setTickets(remote.tickets);
      if (Array.isArray(remote.abuseComplaints)) setAbuseComplaints(remote.abuseComplaints);
      if (Array.isArray(remote.loginActivityLogs)) setLoginActivityLogs(remote.loginActivityLogs);
      if (Array.isArray(remote.cmsPages) && remote.cmsPages.length > 0) setCmsPages(remote.cmsPages);
      if (remote.cmsSiteSettings) setCmsSiteSettings((prev) => ({ ...prev, ...remote.cmsSiteSettings }));
      if (Array.isArray(remote.paymentMethods) && remote.paymentMethods.length > 0) {
        setPaymentMethods(remote.paymentMethods);
      }
      if (Array.isArray(remote.emailTemplates) && remote.emailTemplates.length > 0) {
        setEmailTemplates(remote.emailTemplates);
      }
      if (remote.invoiceTemplateConfig) {
        setInvoiceTemplateConfig((prev) => ({ ...prev, ...remote.invoiceTemplateConfig }));
      }
      if (Array.isArray(remote.tldExtensions) && remote.tldExtensions.length > 0) {
        setTldExtensions(remote.tldExtensions);
      }
      if (Array.isArray(remote.provisioningModules)) {
        setProvisioningModules(remote.provisioningModules);
      }
      if (Array.isArray(remote.hostingPlans) && remote.hostingPlans.length > 0) {
        setHostingPlans(remote.hostingPlans);
      }
      if (remote.systemSettings) {
        setSystemSettings((prev) => ({
          ...prev,
          ...remote.systemSettings,
          smtp: { ...prev.smtp, ...(remote.systemSettings.smtp || {}) },
          googleOAuth: { ...prev.googleOAuth, ...(remote.systemSettings.googleOAuth || {}) },
          adminAlerts: { ...prev.adminAlerts, ...(remote.systemSettings.adminAlerts || {}) },
        }));
      }
      if (Array.isArray(remote.promoCodes) && remote.promoCodes.length > 0) {
        setPromoCodes(remote.promoCodes);
      }
      if (Array.isArray(remote.domainContactAddresses)) {
        setAllDomainContacts(remote.domainContactAddresses);
      }
      if (Array.isArray(remote.ipSecurityRecords)) {
        setIpSecurityRecords(remote.ipSecurityRecords);
      }
      setDbSyncedAtUtc(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    },
    [currentUser]
  );

  // Initial Supabase bootstrap + auto-seed if database tables are empty
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const headers: Record<string, string> = {};
    if (authToken) headers['x-cpcloud-token'] = authToken;

    void fetch('/api/platform/bootstrap', { headers })
      .then((res) => res.json())
      .then(async (data: { ok?: boolean; isEmpty?: boolean; state?: Record<string, any> | null }) => {
        if (cancelled) return;
        if (data?.ok && data.isEmpty) {
          const seedPayload = {
            users: usersRef.current,
            orders: ordersRef.current,
            invoices,
            tickets,
            abuseComplaints,
            loginActivityLogs,
            cmsPages,
            cmsSiteSettings,
            paymentMethods,
            emailTemplates: emailTemplatesRef.current,
            invoiceTemplateConfig: invoiceTemplateConfigRef.current,
            tldExtensions,
            provisioningModules: provisioningModulesRef.current,
            hostingPlans,
            systemSettings: systemSettingsRef.current,
            promoCodes,
            domainContactAddresses: allDomainContacts,
          };
          const seedRes = await fetch('/api/platform/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(seedPayload),
          });
          const seeded = (await seedRes.json()) as { state?: Record<string, any> | null };
          if (!cancelled && seeded?.state) {
            applyBootstrapStateFromServer(seeded.state);
          }
        } else if (data?.ok && data.state) {
          applyBootstrapStateFromServer(data.state);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          dbHydratedRef.current = true;
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Real-time WebSocket subscription for cross-session Supabase updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ws: WebSocket | null = null;
    let closedByEffect = false;
    let refreshTimer: number | null = null;

    const connect = () => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(
          `${proto}//${window.location.host}/ws/live-chat?role=${isAdmin ? 'admin' : 'client'}`
        );
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as { type?: string };
            if (msg.type === 'platform:updated') {
              if (refreshTimer) window.clearTimeout(refreshTimer);
              refreshTimer = window.setTimeout(() => {
                const headers: Record<string, string> = {};
                if (authToken) headers['x-cpcloud-token'] = authToken;
                void fetch('/api/platform/bootstrap', { headers })
                  .then((r) => r.json())
                  .then((d: { ok?: boolean; state?: Record<string, any> | null }) => {
                    if (d?.ok && d.state) {
                      applyBootstrapStateFromServer(d.state);
                    }
                  })
                  .catch(() => undefined);
              }, 350);
            }
          } catch {
            // ignore
          }
        };
        ws.onclose = () => {
          if (!closedByEffect) {
            window.setTimeout(connect, 5000);
          }
        };
      } catch {
        // ignore ws fallback
      }
    };
    connect();
    return () => {
      closedByEffect = true;
      if (refreshTimer) window.clearTimeout(refreshTimer);
      try {
        ws?.close();
      } catch {
        // ignore
      }
    };
  }, [isAdmin, authToken, applyBootstrapStateFromServer]);

  // Debounced real-time sync to Supabase PostgreSQL on any state mutation
  useEffect(() => {
    if (typeof window === 'undefined' || !dbHydratedRef.current) return;
    if (suppressNextSyncRef.current) {
      suppressNextSyncRef.current = false;
      return;
    }
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['x-cpcloud-token'] = authToken;
      const bodyPayload = {
        pruneMissing: isAdmin,
        users,
        orders,
        invoices,
        tickets,
        abuseComplaints,
        loginActivityLogs,
        domainContactAddresses: allDomainContacts,
        ...(isAdmin
          ? {
              cmsPages,
              cmsSiteSettings,
              paymentMethods,
              emailTemplates,
              invoiceTemplateConfig,
              tldExtensions,
              provisioningModules,
              hostingPlans,
              systemSettings,
              promoCodes,
            }
          : {}),
      };
      void fetch('/api/platform/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      })
        .then((r) => r.json())
        .then((d: { ok?: boolean }) => {
          if (d?.ok) {
            setDbSyncedAtUtc(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
          }
        })
        .catch(() => undefined);
    }, 550);

    return () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [
    isAdmin,
    authToken,
    users,
    orders,
    invoices,
    tickets,
    abuseComplaints,
    loginActivityLogs,
    allDomainContacts,
    cmsPages,
    cmsSiteSettings,
    paymentMethods,
    emailTemplates,
    invoiceTemplateConfig,
    tldExtensions,
    provisioningModules,
    hostingPlans,
    systemSettings,
    promoCodes,
  ]);

  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);

  const loginWithCredentials = useCallback(
    async (
      identifierInput: string,
      passphraseInput: string,
      rememberMe = false,
      portal: 'client' | 'admin' = 'client'
    ) => {
      const nowMs = Date.now();
      if (lockoutUntil > nowMs) {
        const remaining = Math.ceil((lockoutUntil - nowMs) / 1000);
        return {
          ok: false,
          lockedSeconds: remaining,
          error: `Too many failed sign-in attempts. Please wait ${remaining}s before trying again.`,
        };
      }

      const cleanInput = identifierInput.trim();
      const pass = passphraseInput.trim();

      if (!cleanInput || !pass) {
        return {
          ok: false,
          error: 'Enter both your username or email and password.',
        };
      }

      if (cleanInput.length > 128 || pass.length > 128) {
        return {
          ok: false,
          error: 'Input exceeds maximum allowed character length.',
        };
      }

      const serverAuth = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanInput, password: pass, portal }),
      })
        .then((r) => r.json())
        .catch(() => null) as {
          ok?: boolean;
          error?: string;
          user?: ManagedUserAccount;
          token?: string;
          requiresEmailVerification?: boolean;
          unverifiedEmail?: string;
          lockedSeconds?: number;
        } | null;

      if (serverAuth && !serverAuth.ok) {
        if (serverAuth.requiresEmailVerification && serverAuth.unverifiedEmail) {
          const matchedLocal = usersRef.current.find(
            (u) => u.email.toLowerCase() === serverAuth.unverifiedEmail!.toLowerCase()
          );
          if (matchedLocal) {
            const existingOtpMap = readStorage<
              Record<string, { code: string; expiresAtMs: number; lastSentAtMs: number }>
            >(EMAIL_OTP_STORAGE_KEY, {});
            const existingOtp = existingOtpMap[matchedLocal.email.toLowerCase()];
            if (!existingOtp || Date.now() > existingOtp.expiresAtMs) {
              const freshCode = String(Math.floor(100000 + Math.random() * 900000));
              const nowOtpMs = Date.now();
              try {
                window.localStorage.setItem(
                  EMAIL_OTP_STORAGE_KEY,
                  JSON.stringify({
                    ...existingOtpMap,
                    [matchedLocal.email.toLowerCase()]: {
                      code: freshCode,
                      expiresAtMs: nowOtpMs + 10 * 60 * 1000,
                      lastSentAtMs: nowOtpMs,
                    },
                  })
                );
              } catch {
                // ignore
              }
              const smtp = systemSettingsRef.current.smtp;
              if (typeof window !== 'undefined' && isSmtpConfigured(smtp)) {
                const tpl =
                  emailTemplatesRef.current.find(
                    (t) => t.key === 'verification-code' || t.id === 'verification-code'
                  ) ?? INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'verification-code');
                if (tpl && tpl.enabled) {
                  const vars = {
                    company_name: invoiceTemplateConfigRef.current.companyName || 'CPCloudHost',
                    client_name: matchedLocal.name,
                    client_email: matchedLocal.email,
                    verification_code: freshCode,
                  };
                  void fetch('/api/system/send-templated-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      smtp,
                      toEmail: matchedLocal.email,
                      companyName: invoiceTemplateConfigRef.current.companyName,
                      companyEmail: invoiceTemplateConfigRef.current.companyEmail,
                      companyWebsite: invoiceTemplateConfigRef.current.companyWebsite,
                      accentColor: invoiceTemplateConfigRef.current.accentColor,
                      headerBadge: 'EMAIL VERIFICATION CODE',
                      subject: renderEmailMergeText(tpl.subject, vars),
                      preheader: renderEmailMergeText(tpl.preheader, vars),
                      heading: renderEmailMergeText(tpl.heading, vars),
                      body: renderEmailMergeText(tpl.body, vars),
                      ctaLabel: renderEmailMergeText(tpl.ctaLabel, vars),
                      ctaUrl: renderEmailMergeText(tpl.ctaUrl, vars),
                      footerNote: renderEmailMergeText(tpl.footerNote, vars),
                    }),
                  }).catch(() => undefined);
                }
              }
            }
          }
          return {
            ok: false,
            requiresEmailVerification: true,
            unverifiedEmail: serverAuth.unverifiedEmail,
            error: serverAuth.error,
          };
        }

        const nextAttempts = failedAttempts + 1;
        if (nextAttempts >= 5) {
          setFailedAttempts(0);
          setLockoutUntil(Date.now() + 30_000);
          return {
            ok: false,
            lockedSeconds: 30,
            error: 'Too many failed sign-in attempts. Login temporarily locked for 30 seconds.',
          };
        }
        setFailedAttempts(nextAttempts);
        return {
          ok: false,
          lockedSeconds: serverAuth.lockedSeconds,
          error: serverAuth.error || 'Invalid username, email, or password.',
        };
      }

      const normalizedIdentifier = cleanInput.toLowerCase();
      const matched =
        (serverAuth?.ok && serverAuth.user
          ? usersRef.current.find((u) => u.id === serverAuth.user!.id) || serverAuth.user
          : usersRef.current.find((u) => {
              const derivedUsername = (u.username || u.email.split('@')[0]).toLowerCase();
              return (
                u.email.toLowerCase() === normalizedIdentifier ||
                derivedUsername === normalizedIdentifier
              );
            })) || null;

      if (!serverAuth?.ok) {
        const expectedPassphrase =
          matched?.passwordSecret ??
          (matched?.role === 'admin' ? 'cpcloud-admin-2026' : 'client-2026');
        if (!matched || pass !== expectedPassphrase) {
          const nextAttempts = failedAttempts + 1;
          if (nextAttempts >= 5) {
            setFailedAttempts(0);
            setLockoutUntil(Date.now() + 30_000);
            return {
              ok: false,
              lockedSeconds: 30,
              error:
                'Too many failed sign-in attempts. Login temporarily locked for 30 seconds.',
            };
          }
          setFailedAttempts(nextAttempts);
          return { ok: false, error: 'Invalid username, email, or password.' };
        }
      }

      if (!matched) {
        return { ok: false, error: 'Invalid username, email, or password.' };
      }

      setFailedAttempts(0);
      setLockoutUntil(0);

      if (matched.twoFactorEnabled && matched.twoFactorSecret) {
        if (serverAuth?.token) setAuthToken(serverAuth.token);
        setPendingChallenge({
          userId: matched.id,
          email: matched.email,
          name: matched.name,
          identifierUsed: cleanInput,
          rememberMe,
          portal,
        });
        return {
          ok: true,
          requiresTwoFactor: true,
        };
      }

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedUsername = matched.username || matched.email.split('@')[0];
      const session: AuthSessionUser = {
        id: matched.id,
        name: matched.name,
        username: resolvedUsername,
        email: matched.email,
        role: matched.role,
        status: matched.status,
        country: matched.country,
        signedInAt: nowUtc,
      };

      setRememberSession(rememberMe);
      if (serverAuth?.token) setAuthToken(serverAuth.token);
      try {
        if (rememberMe && portal === 'client') {
          window.localStorage.setItem(REMEMBER_ID_KEY, cleanInput);
          setRememberedIdentifier(cleanInput);
        } else if (portal === 'client') {
          window.localStorage.removeItem(REMEMBER_ID_KEY);
          setRememberedIdentifier('');
        }
      } catch {
        // ignore
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === matched.id
            ? {
                ...u,
                lastLoginAt: nowUtc,
                supportPin: u.supportPin?.pin ? u.supportPin : generateSupportPin(),
              }
            : u
        )
      );
      appendLoginActivity({
        userEmail: matched.email,
        userName: matched.name,
        eventType: portal === 'admin' ? 'Admin Portal Sign-In' : 'Signed In',
        status: 'success',
        authMethod: `Password (${cleanInput.includes('@') ? 'Email' : 'Username'})`,
        country: matched.country,
      });
      setCurrentUser(session);
      return { ok: true, user: session };
    },
    [failedAttempts, lockoutUntil, appendLoginActivity]
  );

  const signInWithGoogle = useCallback(
    async (input: { email: string; name: string; googleSub?: string; country?: string; token?: string }) => {
      const cleanEmail = (input.email || '').trim().toLowerCase();
      const cleanName = (input.name || '').trim() || cleanEmail.split('@')[0] || 'Google User';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
        return { ok: false, error: 'Google returned an invalid email address.' };
      }
      if (!systemSettings.googleOAuth.enabled) {
        return { ok: false, error: 'Google Sign-In is disabled in System Settings.' };
      }

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        if (existing.status === 'suspended' || existing.status === 'cancelled') {
          appendLoginActivity({
            userEmail: existing.email,
            userName: existing.name,
            eventType: 'Suspended Account Blocked',
            status: 'blocked',
            authMethod: 'Google OAuth 2.0',
            country: existing.country,
          });
          return {
            ok: false,
            error: `This account is ${existing.status}. Contact support@cpcloudhost.com.`,
          };
        }

        const resolvedUsername = existing.username || existing.email.split('@')[0];
        const session: AuthSessionUser = {
          id: existing.id,
          name: existing.name,
          username: resolvedUsername,
          email: existing.email,
          role: existing.role,
          status: existing.status,
          country: existing.country,
          signedInAt: nowUtc,
        };
        if (input.token) setAuthToken(input.token);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === existing.id
              ? {
                  ...u,
                  lastLoginAt: nowUtc,
                  supportPin: u.supportPin?.pin ? u.supportPin : generateSupportPin(),
                }
              : u
          )
        );
        appendLoginActivity({
          userEmail: existing.email,
          userName: existing.name,
          eventType: 'Signed In',
          status: 'success',
          authMethod: 'Google OAuth 2.0',
          country: existing.country,
        });
        setRememberSession(true);
        setCurrentUser(session);
        return { ok: true, user: session, isNewAccount: false };
      }

      if (!systemSettings.googleOAuth.allowAutoRegister) {
        return {
          ok: false,
          error: 'No existing account found for this Google email and auto-registration is off.',
        };
      }

      const baseSlug =
        cleanEmail
          .split('@')[0]
          .replace(/[^a-z0-9._-]/g, '')
          .toLowerCase()
          .slice(0, 24) || 'client';
      const uniqueUsername = users.some(
        (u) => (u.username || '').toLowerCase() === baseSlug
      )
        ? `${baseSlug}.${Math.floor(100 + Math.random() * 899)}`
        : baseSlug;

      const created: ManagedUserAccount = {
        id: `USR-${Math.floor(1200 + Math.random() * 8700)}`,
        name: cleanName,
        username: uniqueUsername,
        email: cleanEmail,
        company: 'Google Verified Client',
        country: input.country?.trim() || 'International',
        role: 'client',
        status: 'active',
        kycVerified: true,
        activeServices: 0,
        totalSpendUsd: 0,
        createdAt: new Date().toISOString().slice(0, 10),
        lastLoginAt: nowUtc,
        supportPin: generateSupportPin(),
      };

      const session: AuthSessionUser = {
        id: created.id,
        name: created.name,
        username: uniqueUsername,
        email: created.email,
        role: created.role,
        status: created.status,
        country: created.country,
        signedInAt: nowUtc,
      };

      setUsers((prev) => [created, ...prev]);
      appendLoginActivity({
        userEmail: created.email,
        userName: created.name,
        eventType: 'Account Registered',
        status: 'success',
        authMethod: 'Google OAuth 2.0',
        country: created.country,
      });
      setRememberSession(true);
      setCurrentUser(session);
      return { ok: true, user: session, isNewAccount: true };
    },
    [systemSettings.googleOAuth, users, appendLoginActivity]
  );

  const verifyTwoFactorChallenge = useCallback(
    async (codeOrBackupInput: string) => {
      if (!pendingChallenge) {
        return { ok: false, error: 'No pending verification challenge.' };
      }
      const matched = users.find((u) => u.id === pendingChallenge.userId);
      if (!matched || !matched.twoFactorSecret) {
        setPendingChallenge(null);
        return { ok: false, error: 'Verification session expired. Sign in again.' };
      }

      if (pendingChallenge.portal === 'admin' && matched.role !== 'admin') {
        setPendingChallenge(null);
        return { ok: false, error: 'Access denied. Authorized staff credentials required.' };
      }

      const raw = codeOrBackupInput.trim().toUpperCase();
      const digitsOnly = raw.replace(/\s+/g, '');
      let verified = false;
      let usedBackupCode: string | null = null;

      if (/^\d{6}$/.test(digitsOnly)) {
        verified = await verifyTotpCode(matched.twoFactorSecret, digitsOnly, 1, 30);
      } else {
        const matchedBackup = (matched.twoFactorBackupCodes ?? []).find(
          (b) => b.toUpperCase() === raw
        );
        if (matchedBackup) {
          verified = true;
          usedBackupCode = matchedBackup;
        }
      }

      if (!verified) {
        appendLoginActivity({
          userEmail: matched.email,
          userName: matched.name,
          eventType: '2FA Verification Failed',
          status: 'warning',
          authMethod: 'TOTP / Backup Challenge',
          country: matched.country,
        });
        return {
          ok: false,
          error: 'Invalid 6-digit authenticator code or backup recovery code.',
        };
      }

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedUsername = matched.username || matched.email.split('@')[0];
      const session: AuthSessionUser = {
        id: matched.id,
        name: matched.name,
        username: resolvedUsername,
        email: matched.email,
        role: matched.role,
        status: matched.status,
        country: matched.country,
        signedInAt: nowUtc,
      };

      setRememberSession(pendingChallenge.rememberMe);
      try {
        if (pendingChallenge.rememberMe && pendingChallenge.portal === 'client') {
          window.localStorage.setItem(REMEMBER_ID_KEY, pendingChallenge.identifierUsed);
          setRememberedIdentifier(pendingChallenge.identifierUsed);
        } else if (pendingChallenge.portal === 'client') {
          window.localStorage.removeItem(REMEMBER_ID_KEY);
          setRememberedIdentifier('');
        }
      } catch {
        // ignore
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== matched.id) return u;
          return {
            ...u,
            lastLoginAt: nowUtc,
            twoFactorBackupCodes: usedBackupCode
              ? (u.twoFactorBackupCodes ?? []).filter((b) => b !== usedBackupCode)
              : u.twoFactorBackupCodes,
            supportPin: u.supportPin?.pin ? u.supportPin : generateSupportPin(),
          };
        })
      );
      appendLoginActivity({
        userEmail: matched.email,
        userName: matched.name,
        eventType: usedBackupCode ? '2FA Backup Code Used' : '2FA Challenge Verified',
        status: 'success',
        authMethod: usedBackupCode ? 'Password + Backup Code' : 'Password + TOTP 2FA',
        country: matched.country,
      });
      setPendingChallenge(null);
      setCurrentUser(session);
      return { ok: true, user: session };
    },
    [pendingChallenge, users, appendLoginActivity]
  );

  const cancelTwoFactorChallenge = useCallback(() => {
    setPendingChallenge(null);
  }, []);

  const enableTwoFactorAuth = useCallback(
    async (secret: string, code: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required.' };
      }
      const valid = await verifyTotpCode(secret, code, 1, 30);
      if (!valid) {
        return {
          ok: false,
          error: 'Verification code does not match your authenticator secret. Check device clock and try again.',
        };
      }
      const backupCodes = generateBackupCodes(8);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                twoFactorEnabled: true,
                twoFactorSecret: secret,
                twoFactorBackupCodes: backupCodes,
              }
            : u
        )
      );
      appendLoginActivity({
        userEmail: currentUser.email,
        userName: currentUser.name,
        eventType: 'Two-Factor Auth Enabled',
        status: 'success',
        authMethod: 'Authenticator App (TOTP)',
        country: currentUser.country,
      });
      return { ok: true, backupCodes };
    },
    [currentUser, appendLoginActivity]
  );

  const disableTwoFactorAuth = useCallback(
    async (codeOrPassword: string) => {
      if (!currentUser) return { ok: false, error: 'Sign in required.' };
      const matched = users.find((u) => u.id === currentUser.id);
      if (!matched) return { ok: false, error: 'Account record not found.' };

      const input = codeOrPassword.trim();
      const expectedPassword =
        matched.passwordSecret ??
        (matched.role === 'admin' ? 'cpcloud-admin-2026' : 'client-2026');

      let authorized = input === expectedPassword;
      if (!authorized && matched.twoFactorSecret && /^\d{6}$/.test(input)) {
        authorized = await verifyTotpCode(matched.twoFactorSecret, input, 1, 30);
      }

      if (!authorized) {
        return {
          ok: false,
          error: 'Enter your current 6-digit authenticator code or account password to disable 2FA.',
        };
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                twoFactorEnabled: false,
                twoFactorSecret: undefined,
                twoFactorBackupCodes: undefined,
              }
            : u
        )
      );
      appendLoginActivity({
        userEmail: currentUser.email,
        userName: currentUser.name,
        eventType: 'Two-Factor Auth Disabled',
        status: 'warning',
        authMethod: 'Account Security Verification',
        country: currentUser.country,
      });
      return { ok: true };
    },
    [currentUser, users, appendLoginActivity]
  );

  const regenerateTwoFactorBackupCodes = useCallback(() => {
    if (!currentUser) return [];
    const fresh = generateBackupCodes(8);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, twoFactorBackupCodes: fresh } : u
      )
    );
    return fresh;
  }, [currentUser]);

  const activeSupportPin = useMemo(() => {
    if (!currentUser) return null;
    const record = users.find((u) => u.id === currentUser.id);
    if (record?.supportPin?.pin) {
      return record.supportPin;
    }
    return null;
  }, [currentUser, users]);

  useEffect(() => {
    if (!currentUser) return;
    const record = users.find((u) => u.id === currentUser.id);
    if (record && !record.supportPin?.pin) {
      const nextPin = generateSupportPin();
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, supportPin: nextPin } : u))
      );
    }
  }, [currentUser, users]);

  const rotateSupportPin = useCallback(() => {
    if (!currentUser) return null;
    const nextPin = generateSupportPin();
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, supportPin: nextPin } : u))
    );
    appendLoginActivity({
      userEmail: currentUser.email,
      userName: currentUser.name,
      eventType: 'Support PIN Regenerated',
      status: 'success',
      authMethod: 'Client Portal Action',
      country: currentUser.country,
    });
    return nextPin;
  }, [currentUser, appendLoginActivity]);

  const adminResetUserSupportPin = useCallback(
    (userId: string) => {
      if (!isAdmin) return null;
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return null;
      const nextPin = generateSupportPin();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, supportPin: nextPin } : u))
      );
      appendLoginActivity({
        userEmail: targetUser.email,
        userName: targetUser.name,
        eventType: 'Support PIN Regenerated',
        status: 'success',
        authMethod: `Admin Staff Reset (${currentUser?.name || 'Admin'})`,
        country: targetUser.country,
      });
      return nextPin;
    },
    [isAdmin, users, currentUser, appendLoginActivity]
  );

  const clearMyLoginLogs = useCallback(() => {
    if (!currentUser) return;
    setLoginActivityLogs((prev) =>
      prev.filter(
        (log) => log.userEmail.toLowerCase() !== currentUser.email.toLowerCase()
      )
    );
  }, [currentUser]);

  const logout = useCallback(() => {
    if (currentUser) {
      appendLoginActivity({
        userEmail: currentUser.email,
        userName: currentUser.name,
        eventType: 'Signed Out',
        status: 'success',
        authMethod: 'Manual Sign-Out',
        country: currentUser.country,
      });
    }
    setPendingChallenge(null);
    setAdminImpersonation(null);
    setCurrentUser(null);
  }, [currentUser, appendLoginActivity]);

  const createUserAccount = useCallback(
    (input: {
      name: string;
      email: string;
      company?: string;
      country: string;
      role: UserRole;
      password?: string;
    }) => {
      if (!isAdmin) {
        return { ok: false, error: 'Unauthorized: Administrator role required.' };
      }
      const cleanEmail = input.email.trim().toLowerCase();
      if (!input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
        return { ok: false, error: 'Provide a valid full name and email address.' };
      }
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { ok: false, error: 'A user account with this email already exists.' };
      }

      const cleanPassword = input.password?.trim() || '';
      if (input.password !== undefined && cleanPassword.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }

      const nextId = `USR-${Math.floor(1200 + Math.random() * 8700)}`;
      const today = new Date().toISOString().slice(0, 10);
      const baseSlug =
        cleanEmail
          .split('@')[0]
          .replace(/[^a-z0-9._-]/g, '')
          .toLowerCase()
          .slice(0, 24) || 'client';
      const created: ManagedUserAccount = {
        id: nextId,
        name: input.name.trim(),
        username: baseSlug,
        email: cleanEmail,
        passwordSecret: cleanPassword || 'client-2026',
        company: input.company?.trim() || 'Independent',
        country: input.country.trim() || 'Pakistan',
        role: input.role,
        status: 'active',
        kycVerified: input.role === 'admin',
        activeServices: 0,
        totalSpendUsd: 0,
        createdAt: today,
        lastLoginAt: 'Never signed in',
        supportPin: generateSupportPin(),
      };
      setUsers((prev) => [created, ...prev]);

      if (
        typeof window !== 'undefined' &&
        systemSettings.smtp?.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password
      ) {
        const welcomeTpl =
          emailTemplates.find((t) => t.key === 'welcome-email' || t.id === 'welcome-email') ??
          INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'welcome-email');
        if (welcomeTpl && welcomeTpl.enabled) {
          const mergeVars: Record<string, string> = {
            company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
            client_name: created.name,
            client_email: created.email,
            client_username: created.username || baseSlug,
            support_pin: created.supportPin?.pin || '—',
            control_panel_url: `${window.location?.origin || 'https://cpcloudhost.com'}/dashboard`,
          };
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: created.email,
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge: 'ACCOUNT CREATED',
              subject: renderEmailMergeText(welcomeTpl.subject, mergeVars),
              preheader: renderEmailMergeText(welcomeTpl.preheader, mergeVars),
              heading: renderEmailMergeText(welcomeTpl.heading, mergeVars),
              body: renderEmailMergeText(welcomeTpl.body, mergeVars),
              ctaLabel: renderEmailMergeText(welcomeTpl.ctaLabel, mergeVars),
              ctaUrl: renderEmailMergeText(welcomeTpl.ctaUrl, mergeVars),
              footerNote: renderEmailMergeText(welcomeTpl.footerNote, mergeVars),
            }),
          }).catch(() => undefined);
        }
      }

      return { ok: true, user: created };
    },
    [isAdmin, users, systemSettings.smtp, emailTemplates, invoiceTemplateConfig]
  );

  const sendEmailVerificationOtpCode = useCallback(
    async (target: { name: string; email: string }): Promise<{
      code: string;
      emailSent: boolean;
      smtpConfigured: boolean;
      error?: string;
    }> => {
      const cleanEmail = target.email.trim().toLowerCase();
      const freshCode = String(Math.floor(100000 + Math.random() * 900000));
      const nowMs = Date.now();
      const otpMap = readStorage<
        Record<string, { code: string; expiresAtMs: number; lastSentAtMs: number }>
      >(EMAIL_OTP_STORAGE_KEY, {});
      try {
        window.localStorage.setItem(
          EMAIL_OTP_STORAGE_KEY,
          JSON.stringify({
            ...otpMap,
            [cleanEmail]: {
              code: freshCode,
              expiresAtMs: nowMs + 10 * 60 * 1000,
              lastSentAtMs: nowMs,
            },
          })
        );
      } catch {
        // ignore storage write failure
      }

      appendLoginActivity({
        userEmail: cleanEmail,
        userName: target.name,
        eventType: 'Email Verification Code Sent',
        status: 'success',
        authMethod: '6-Digit Email OTP',
        country: 'Global Verification',
      });

      const smtp = systemSettingsRef.current.smtp;
      const smtpReady = Boolean(
        typeof window !== 'undefined' &&
          smtp?.enabled &&
          smtp.host.trim() &&
          smtp.username.trim() &&
          smtp.password
      );
      if (!smtpReady) {
        return { code: freshCode, emailSent: false, smtpConfigured: false };
      }

      const tpl =
        emailTemplatesRef.current.find(
          (t) => t.key === 'verification-code' || t.id === 'verification-code'
        ) ?? INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'verification-code');
      if (!tpl || !tpl.enabled) {
        return { code: freshCode, emailSent: false, smtpConfigured: true };
      }

      const vars: Record<string, string> = {
        company_name: invoiceTemplateConfigRef.current.companyName || 'CPCloudHost',
        client_name: target.name,
        client_email: cleanEmail,
        verification_code: freshCode,
      };

      try {
        const res = await fetch('/api/system/send-templated-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp,
            toEmail: cleanEmail,
            companyName: invoiceTemplateConfigRef.current.companyName,
            companyEmail: invoiceTemplateConfigRef.current.companyEmail,
            companyWebsite: invoiceTemplateConfigRef.current.companyWebsite,
            accentColor: invoiceTemplateConfigRef.current.accentColor,
            headerBadge: 'EMAIL VERIFICATION CODE',
            subject: renderEmailMergeText(tpl.subject, vars),
            preheader: renderEmailMergeText(tpl.preheader, vars),
            heading: renderEmailMergeText(tpl.heading, vars),
            body: renderEmailMergeText(tpl.body, vars),
            ctaLabel: renderEmailMergeText(tpl.ctaLabel, vars),
            ctaUrl: renderEmailMergeText(tpl.ctaUrl, vars),
            footerNote: renderEmailMergeText(tpl.footerNote, vars),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        return {
          code: freshCode,
          emailSent: Boolean(res.ok && data.ok),
          smtpConfigured: true,
          error: !res.ok || !data.ok ? data.error : undefined,
        };
      } catch (err) {
        return {
          code: freshCode,
          emailSent: false,
          smtpConfigured: true,
          error: err instanceof Error ? err.message : 'SMTP delivery error',
        };
      }
    },
    [appendLoginActivity]
  );

  const registerClientAccount = useCallback(
    (input: {
      name: string;
      username: string;
      email: string;
      phone: string;
      country: string;
      referralSource: string;
      password: string;
      autoSignIn?: boolean;
      skipEmailOtp?: boolean;
    }) => {
      const cleanName = input.name.trim();
      const cleanUsername = input.username.trim().toLowerCase();
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanPhone = input.phone.trim();
      const cleanSource = input.referralSource.trim();
      const cleanPassword = input.password.trim();

      if (cleanName.length < 2) {
        return { ok: false, error: 'Enter your full legal or business name.' };
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
        return {
          ok: false,
          error:
            'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.',
        };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
        return { ok: false, error: 'Enter a valid email address.' };
      }
      if (cleanPhone.replace(/\D/g, '').length < 7) {
        return { ok: false, error: 'Enter a valid international phone number.' };
      }
      if (!cleanSource) {
        return { ok: false, error: 'Please tell us how you discovered cpcloudhost.com.' };
      }
      if (cleanPassword.length < 8) {
        return {
          ok: false,
          error: 'Password must be at least 8 characters and meet security rules.',
        };
      }
      if (usersRef.current.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return {
          ok: false,
          error: 'An account with this email address is already registered.',
        };
      }
      if (
        usersRef.current.some(
          (u) => (u.username || u.email.split('@')[0]).toLowerCase() === cleanUsername
        )
      ) {
        return {
          ok: false,
          error: 'This username is already taken. Choose another username.',
        };
      }

      const requiresOtp = !input.skipEmailOtp;
      const nextId = `USR-${Math.floor(1200 + Math.random() * 8700)}`;
      const today = new Date().toISOString().slice(0, 10);
      const created: ManagedUserAccount = {
        id: nextId,
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        referralSource: cleanSource,
        passwordSecret: cleanPassword,
        company: 'Personal / Client Account',
        country: input.country.trim() || 'International',
        role: 'client',
        status: 'active',
        kycVerified: false,
        emailVerified: !requiresOtp,
        activeServices: 0,
        totalSpendUsd: 0,
        createdAt: today,
        lastLoginAt: requiresOtp ? 'Awaiting Email Verification' : 'Registered via Portal',
        supportPin: generateSupportPin(),
      };

      usersRef.current = [created, ...usersRef.current];
      setUsers((prev) => [created, ...prev]);

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      appendLoginActivity({
        userEmail: created.email,
        userName: created.name,
        eventType: 'Account Registered',
        status: 'success',
        authMethod: requiresOtp ? 'Registration Form (OTP Pending)' : 'Registration Form',
        country: created.country,
      });

      if (!requiresOtp && input.autoSignIn) {
        setRememberSession(true);
        setCurrentUser({
          id: created.id,
          name: created.name,
          username: cleanUsername,
          email: created.email,
          role: 'client',
          status: 'active',
          country: created.country,
          signedInAt: nowUtc,
        });
        return {
          ok: true,
          requiresEmailVerification: false,
          account: {
            id: created.id,
            name: created.name,
            username: cleanUsername,
            email: created.email,
            phone: cleanPhone,
          },
        };
      }

      void sendEmailVerificationOtpCode({ name: created.name, email: created.email });
      const smtp = systemSettingsRef.current.smtp;
      const smtpConfigured = Boolean(
        smtp?.enabled && smtp.host.trim() && smtp.username.trim() && smtp.password
      );

      return {
        ok: true,
        requiresEmailVerification: true,
        emailSent: smtpConfigured,
        smtpConfigured,
        account: {
          id: created.id,
          name: created.name,
          username: cleanUsername,
          email: created.email,
          phone: cleanPhone,
        },
      };
    },
    [appendLoginActivity, sendEmailVerificationOtpCode]
  );

  const verifyRegistrationOtp = useCallback(
    (email: string, code: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.replace(/\D/g, '').trim();
      if (!cleanEmail || cleanCode.length !== 6) {
        return { ok: false, error: 'Enter the 6-digit verification code sent to your email.' };
      }

      const matched = usersRef.current.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!matched) {
        return { ok: false, error: 'No registration record found for this email address.' };
      }

      const otpMap = readStorage<
        Record<string, { code: string; expiresAtMs: number; lastSentAtMs: number }>
      >(EMAIL_OTP_STORAGE_KEY, {});
      const entry = otpMap[cleanEmail];
      if (!entry) {
        return { ok: false, error: 'No active verification code found. Click Resend Code.' };
      }
      if (Date.now() > entry.expiresAtMs) {
        return { ok: false, error: 'This verification code has expired. Click Resend Code to get a new one.' };
      }
      if (entry.code !== cleanCode) {
        return { ok: false, error: 'Incorrect 6-digit verification code. Check your email and try again.' };
      }

      const nextOtpMap = { ...otpMap };
      delete nextOtpMap[cleanEmail];
      try {
        window.localStorage.setItem(EMAIL_OTP_STORAGE_KEY, JSON.stringify(nextOtpMap));
      } catch {
        // ignore
      }

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      usersRef.current = usersRef.current.map((u) =>
        u.id === matched.id
          ? {
              ...u,
              emailVerified: true,
              emailVerifiedAtUtc: nowUtc,
              lastLoginAt: nowUtc,
            }
          : u
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === matched.id
            ? {
                ...u,
                emailVerified: true,
                emailVerifiedAtUtc: nowUtc,
                lastLoginAt: nowUtc,
              }
            : u
        )
      );

      const resolvedUsername = matched.username || matched.email.split('@')[0];
      const session: AuthSessionUser = {
        id: matched.id,
        name: matched.name,
        username: resolvedUsername,
        email: matched.email,
        role: matched.role,
        status: matched.status,
        country: matched.country,
        signedInAt: nowUtc,
      };
      setRememberSession(true);
      setCurrentUser(session);

      appendLoginActivity({
        userEmail: matched.email,
        userName: matched.name,
        eventType: 'Email Address Verified',
        status: 'success',
        authMethod: '6-Digit Email OTP Verified',
        country: matched.country,
      });

      // Dispatch Welcome Email automatically after verification
      const smtp = systemSettingsRef.current.smtp;
      if (
        typeof window !== 'undefined' &&
        smtp?.enabled &&
        smtp.host.trim() &&
        smtp.username.trim() &&
        smtp.password
      ) {
        const welcomeTpl =
          emailTemplatesRef.current.find(
            (t) => t.key === 'welcome-email' || t.id === 'welcome-email'
          ) ?? INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'welcome-email');
        if (welcomeTpl && welcomeTpl.enabled) {
          const origin =
            window.location?.origin ||
            invoiceTemplateConfigRef.current.companyWebsite ||
            'https://cpcloudhost.com';
          const vars: Record<string, string> = {
            company_name: invoiceTemplateConfigRef.current.companyName || 'CPCloudHost',
            client_name: matched.name,
            client_email: matched.email,
            client_username: resolvedUsername,
            support_pin: matched.supportPin?.pin || '—',
            control_panel_url: `${origin}/dashboard`,
          };
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp,
              toEmail: matched.email,
              companyName: invoiceTemplateConfigRef.current.companyName,
              companyEmail: invoiceTemplateConfigRef.current.companyEmail,
              companyWebsite: invoiceTemplateConfigRef.current.companyWebsite,
              accentColor: invoiceTemplateConfigRef.current.accentColor,
              headerBadge: 'WELCOME · ACCOUNT VERIFIED',
              subject: renderEmailMergeText(welcomeTpl.subject, vars),
              preheader: renderEmailMergeText(welcomeTpl.preheader, vars),
              heading: renderEmailMergeText(welcomeTpl.heading, vars),
              body: renderEmailMergeText(welcomeTpl.body, vars),
              ctaLabel: renderEmailMergeText(welcomeTpl.ctaLabel, vars),
              ctaUrl: renderEmailMergeText(welcomeTpl.ctaUrl, vars),
              footerNote: renderEmailMergeText(welcomeTpl.footerNote, vars),
            }),
          }).catch(() => undefined);
        }
      }

      return { ok: true, user: session };
    },
    [appendLoginActivity]
  );

  const resendRegistrationOtp = useCallback(
    async (email: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const matched = usersRef.current.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!matched) {
        return { ok: false, error: 'Account not found for this email address.' };
      }
      const otpMap = readStorage<
        Record<string, { code: string; expiresAtMs: number; lastSentAtMs: number }>
      >(EMAIL_OTP_STORAGE_KEY, {});
      const prevEntry = otpMap[cleanEmail];
      if (prevEntry && Date.now() - prevEntry.lastSentAtMs < 30_000) {
        const waitSec = Math.ceil((30_000 - (Date.now() - prevEntry.lastSentAtMs)) / 1000);
        return {
          ok: false,
          cooldownSeconds: waitSec,
          error: `Please wait ${waitSec}s before requesting another verification code.`,
        };
      }
      const sent = await sendEmailVerificationOtpCode({
        name: matched.name,
        email: matched.email,
      });
      return {
        ok: true,
        emailSent: sent.emailSent,
        smtpConfigured: sent.smtpConfigured,
        cooldownSeconds: 30,
        error: sent.error,
      };
    },
    [sendEmailVerificationOtpCode]
  );

  const updateUserStatus = useCallback(
    (userId: string, status: UserAccountStatus) => {
      if (!isAdmin) return;
      if (
        currentUser?.id === userId &&
        (status === 'suspended' || status === 'cancelled')
      ) {
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
    },
    [isAdmin, currentUser]
  );

  const updateUserRole = useCallback(
    (userId: string, role: UserRole) => {
      if (!isAdmin) return;
      if (currentUser?.id === userId && role !== 'admin') return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    },
    [isAdmin, currentUser]
  );

  const toggleUserKyc = useCallback(
    (userId: string) => {
      if (!isAdmin) return;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                kycVerified: !u.kycVerified,
                status: !u.kycVerified && u.status === 'pending_kyc' ? 'active' : u.status,
              }
            : u
        )
      );
    },
    [isAdmin]
  );

  const adminUpdateUserProfile = useCallback(
    (
      userId: string,
      updates: {
        name?: string;
        username?: string;
        email?: string;
        phone?: string;
        company?: string;
        country?: string;
        role?: UserRole;
        status?: UserAccountStatus;
        kycVerified?: boolean;
      }
    ) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator access required.' };
      }
      const existing = users.find((u) => u.id === userId);
      if (!existing) {
        return { ok: false, error: 'Client account not found.' };
      }

      const nextName =
        updates.name !== undefined ? updates.name.trim() : existing.name;
      if (nextName.length < 2) {
        return { ok: false, error: 'Full name must be at least 2 characters.' };
      }

      const nextEmail =
        updates.email !== undefined
          ? updates.email.trim().toLowerCase()
          : existing.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nextEmail)) {
        return { ok: false, error: 'Enter a valid email address.' };
      }
      if (
        nextEmail !== existing.email.toLowerCase() &&
        users.some((u) => u.id !== userId && u.email.toLowerCase() === nextEmail)
      ) {
        return { ok: false, error: 'Another account already uses this email.' };
      }

      let nextUsername =
        updates.username !== undefined
          ? updates.username.trim().toLowerCase()
          : existing.username || existing.email.split('@')[0];
      if (!/^[a-z0-9._-]{3,32}$/.test(nextUsername)) {
        return {
          ok: false,
          error:
            'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.',
        };
      }
      if (
        users.some(
          (u) =>
            u.id !== userId &&
            (u.username || u.email.split('@')[0]).toLowerCase() === nextUsername
        )
      ) {
        return { ok: false, error: 'This username is already taken.' };
      }

      const nextRole =
        currentUser?.id === userId ? existing.role : updates.role ?? existing.role;
      const requestedStatus = updates.status ?? existing.status;
      const nextStatus =
        currentUser?.id === userId &&
        (requestedStatus === 'suspended' || requestedStatus === 'cancelled')
          ? existing.status
          : requestedStatus;
      const nextCountry =
        updates.country !== undefined
          ? updates.country.trim() || existing.country
          : existing.country;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                name: nextName,
                username: nextUsername,
                email: nextEmail,
                phone:
                  updates.phone !== undefined ? updates.phone.trim() : u.phone,
                company:
                  updates.company !== undefined
                    ? updates.company.trim() || 'Personal / Client Account'
                    : u.company,
                country: nextCountry,
                role: nextRole,
                status: nextStatus,
                kycVerified:
                  updates.kycVerified !== undefined
                    ? updates.kycVerified
                    : u.kycVerified,
              }
            : u
        )
      );

      const oldEmailLower = existing.email.toLowerCase();
      if (oldEmailLower !== nextEmail || existing.name !== nextName) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord.clientEmail.toLowerCase() === oldEmailLower
              ? {
                  ...ord,
                  clientEmail: nextEmail,
                  clientName: nextName,
                  country: nextCountry,
                }
              : ord
          )
        );
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.clientEmail.toLowerCase() === oldEmailLower
              ? { ...inv, clientEmail: nextEmail, clientName: nextName }
              : inv
          )
        );
        setTickets((prev) =>
          prev.map((tkt) =>
            tkt.clientEmail.toLowerCase() === oldEmailLower
              ? { ...tkt, clientEmail: nextEmail, clientName: nextName }
              : tkt
          )
        );
        setLoginActivityLogs((prev) =>
          prev.map((log) =>
            log.userEmail.toLowerCase() === oldEmailLower
              ? { ...log, userEmail: nextEmail, userName: nextName }
              : log
          )
        );
      }

      if (currentUser?.id === userId) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                name: nextName,
                username: nextUsername,
                email: nextEmail,
                country: nextCountry,
                status: nextStatus,
              }
            : null
        );
      }

      return { ok: true };
    },
    [isAdmin, users, currentUser]
  );

  const adminChangeUserPassword = useCallback(
    (userId: string, newPassword: string) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const clean = newPassword.trim();
      if (clean.length < 8) {
        return {
          ok: false,
          error: 'Password must be at least 8 characters long.',
        };
      }
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) {
        return { ok: false, error: 'Client account not found.' };
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, passwordSecret: clean } : u))
      );
      appendLoginActivity({
        userEmail: targetUser.email,
        userName: targetUser.name,
        eventType: 'Password Changed by Admin',
        status: 'warning',
        authMethod: `Staff Update (${currentUser?.name || 'Admin'})`,
        country: targetUser.country,
      });
      return { ok: true };
    },
    [isAdmin, users, currentUser, appendLoginActivity]
  );

  const adminResetUserTwoFactor = useCallback(
    (userId: string) => {
      if (!isAdmin) return;
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                twoFactorEnabled: false,
                twoFactorSecret: undefined,
                twoFactorBackupCodes: undefined,
              }
            : u
        )
      );
      appendLoginActivity({
        userEmail: targetUser.email,
        userName: targetUser.name,
        eventType: 'Two-Factor Auth Disabled',
        status: 'warning',
        authMethod: `Admin Recovery Reset (${currentUser?.name || 'Admin'})`,
        country: targetUser.country,
      });
    },
    [isAdmin, users, currentUser, appendLoginActivity]
  );

  const updateOwnAdminCredentials = useCallback(
    (input: {
      name: string;
      username: string;
      email: string;
      currentPassword: string;
      newPassword?: string;
    }) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const existing = users.find((u) => u.id === currentUser.id);
      if (!existing) {
        return { ok: false, error: 'Signed-in admin account record not found.' };
      }
      const expectedPassword = existing.passwordSecret ?? 'cpcloud-admin-2026';
      if (input.currentPassword !== expectedPassword) {
        return { ok: false, error: 'Current admin password is incorrect.' };
      }

      const nextName = input.name.trim();
      const nextUsername = input.username.trim().toLowerCase();
      const nextEmail = input.email.trim().toLowerCase();
      const nextPassword = input.newPassword?.trim() || '';

      if (nextName.length < 2) {
        return { ok: false, error: 'Full name must be at least 2 characters.' };
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(nextUsername)) {
        return {
          ok: false,
          error: 'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.',
        };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nextEmail)) {
        return { ok: false, error: 'Enter a valid admin email address.' };
      }
      if (nextPassword && nextPassword.length < 8) {
        return { ok: false, error: 'New admin password must be at least 8 characters.' };
      }
      if (users.some((u) => u.id !== existing.id && u.email.toLowerCase() === nextEmail)) {
        return { ok: false, error: 'Another account already uses this email address.' };
      }
      if (
        users.some(
          (u) =>
            u.id !== existing.id &&
            (u.username || u.email.split('@')[0]).toLowerCase() === nextUsername
        )
      ) {
        return { ok: false, error: 'This username is already taken.' };
      }

      const oldEmailLower = existing.email.toLowerCase();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === existing.id
            ? {
                ...u,
                name: nextName,
                username: nextUsername,
                email: nextEmail,
                passwordSecret: nextPassword ? nextPassword : u.passwordSecret,
              }
            : u
        )
      );

      if (oldEmailLower !== nextEmail || existing.name !== nextName) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord.clientEmail.toLowerCase() === oldEmailLower
              ? { ...ord, clientEmail: nextEmail, clientName: nextName }
              : ord
          )
        );
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.clientEmail.toLowerCase() === oldEmailLower
              ? { ...inv, clientEmail: nextEmail, clientName: nextName }
              : inv
          )
        );
        setTickets((prev) =>
          prev.map((tkt) =>
            tkt.clientEmail.toLowerCase() === oldEmailLower
              ? { ...tkt, clientEmail: nextEmail, clientName: nextName }
              : tkt
          )
        );
        setLoginActivityLogs((prev) =>
          prev.map((log) =>
            log.userEmail.toLowerCase() === oldEmailLower
              ? { ...log, userEmail: nextEmail, userName: nextName }
              : log
          )
        );
        setAllDomainContacts((prev) =>
          prev.map((c) =>
            c.ownerEmail.toLowerCase() === oldEmailLower
              ? { ...c, ownerEmail: nextEmail }
              : c
          )
        );
      }

      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: nextName,
              username: nextUsername,
              email: nextEmail,
            }
          : null
      );

      appendLoginActivity({
        userEmail: nextEmail,
        userName: nextName,
        eventType: nextPassword ? 'Password Changed by Admin' : 'Admin Portal Sign-In',
        status: 'success',
        authMethod: 'Main Admin Credentials Updated',
        country: existing.country,
      });

      return { ok: true };
    },
    [isAdmin, currentUser, users, appendLoginActivity]
  );

  const createAdminAccount = useCallback(
    (input: {
      name: string;
      username: string;
      email: string;
      password: string;
      company?: string;
      country?: string;
    }) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const cleanName = input.name.trim();
      const cleanUsername = input.username.trim().toLowerCase();
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanPassword = input.password.trim();

      if (cleanName.length < 2) {
        return { ok: false, error: 'Admin name must be at least 2 characters.' };
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
        return {
          ok: false,
          error: 'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.',
        };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
        return { ok: false, error: 'Enter a valid email address.' };
      }
      if (cleanPassword.length < 8) {
        return { ok: false, error: 'Admin password must be at least 8 characters.' };
      }
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      if (
        users.some(
          (u) => (u.username || u.email.split('@')[0]).toLowerCase() === cleanUsername
        )
      ) {
        return { ok: false, error: 'This username is already taken.' };
      }

      const nextId = `USR-${Math.floor(1200 + Math.random() * 8700)}`;
      const today = new Date().toISOString().slice(0, 10);
      const created: ManagedUserAccount = {
        id: nextId,
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        passwordSecret: cleanPassword,
        company: input.company?.trim() || 'cpcloudhost.com Operations',
        country: input.country?.trim() || 'Pakistan',
        role: 'admin',
        status: 'active',
        kycVerified: true,
        activeServices: 0,
        totalSpendUsd: 0,
        createdAt: today,
        lastLoginAt: 'Never signed in',
        supportPin: generateSupportPin(),
      };
      setUsers((prev) => [created, ...prev]);

      appendLoginActivity({
        userEmail: created.email,
        userName: created.name,
        eventType: 'Account Registered',
        status: 'success',
        authMethod: `Admin Staff Created by ${currentUser?.name || 'Admin'}`,
        country: created.country,
      });

      return { ok: true, account: created };
    },
    [isAdmin, users, currentUser, appendLoginActivity]
  );

  const impersonateClientAccount = useCallback(
    (userId: string) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = users.find((u) => u.id === userId);
      if (!target) {
        return { ok: false, error: 'Target client account not found.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedUsername = target.username || target.email.split('@')[0];

      setAdminImpersonation({
        adminId: currentUser.id,
        adminName: currentUser.name,
        adminEmail: currentUser.email,
        targetUserId: target.id,
        targetUserName: target.name,
        startedAtUtc: nowUtc,
      });

      const targetSession: AuthSessionUser = {
        id: target.id,
        name: target.name,
        username: resolvedUsername,
        email: target.email,
        role: target.role,
        status: target.status,
        country: target.country,
        signedInAt: nowUtc,
      };

      appendLoginActivity({
        userEmail: target.email,
        userName: target.name,
        eventType: 'Admin Client Impersonation',
        status: 'warning',
        authMethod: `Direct Portal Login by ${currentUser.name}`,
        country: target.country,
      });
      setCurrentUser(targetSession);
      return { ok: true, targetUserId: target.id };
    },
    [isAdmin, currentUser, users, appendLoginActivity]
  );

  const exitClientImpersonation = useCallback(() => {
    if (!adminImpersonation) return null;
    const adminRecord = users.find((u) => u.id === adminImpersonation.adminId);
    const targetId = adminImpersonation.targetUserId;
    if (!adminRecord) {
      setAdminImpersonation(null);
      return null;
    }
    const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    setCurrentUser({
      id: adminRecord.id,
      name: adminRecord.name,
      username: adminRecord.username || adminRecord.email.split('@')[0],
      email: adminRecord.email,
      role: adminRecord.role,
      status: adminRecord.status,
      country: adminRecord.country,
      signedInAt: nowUtc,
    });
    setAdminImpersonation(null);
    return targetId;
  }, [adminImpersonation, users]);

  const addOrder = useCallback(
    (input: {
      clientEmail: string;
      clientName?: string;
      country?: string;
      productType: PlatformOrder['productType'];
      planName: string;
      domainOrHost: string;
      billingCycle: PlatformOrder['billingCycle'];
      amountUsd: number;
      paymentMethod?: string;
      datacenter?: string;
      status?: OrderStatus;
      customRef?: string;
      createdAt?: string;
      nextDueDate?: string;
      invoicePaid?: boolean;
      autoRenew?: boolean;
      nameservers?: string[];
      registrarLock?: boolean;
      whoisPrivacy?: boolean;
      serverIp?: string;
      cpanelUsername?: string;
      controlPanelUrl?: string;
      controlPanelPassword?: string;
      serverModuleId?: string;
      serverPackageName?: string;
      linkedFreeDomainOrderId?: string;
      linkedHostingOrderId?: string;
      promoCode?: string;
      discountUsd?: number;
      isFreeTrial?: boolean;
      trialDays?: number;
      serverConfig?: ServerCustomConfig;
      transactionRef?: string;
      notes?: string;
      generateInvoice?: boolean;
      eppCode?: string;
      whoisContact?: DomainContactAddress;
      dnsRecords?: DomainDnsRecord[];
      transferStatus?: PlatformOrder['transferStatus'];
      transferStartedAt?: string;
    }) => {
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedCreatedAt = input.createdAt?.trim()
        ? input.createdAt.trim().length <= 10
          ? `${input.createdAt.trim()} 09:00 UTC`
          : input.createdAt.trim()
        : nowUtc;
      const issuedDateIso = resolvedCreatedAt.slice(0, 10);
      const resolvedNextDue =
        input.nextDueDate?.trim() ||
        computeDefaultNextDueDate(issuedDateIso, input.billingCycle);
      const resolvedStatus = input.status ?? 'pending';
      const resolvedPaid =
        input.invoicePaid !== undefined
          ? input.invoicePaid
          : resolvedStatus === 'active';
      const isDomain =
        input.productType === 'Domain Registration' ||
        input.productType === 'Domain Transfer';
      const isSharedCloud = input.productType === 'Shared Cloud';
      const newOrderId =
        input.customRef || `ORD-${Math.floor(905000 + Math.random() * 94000)}`;
      const resolvedHost =
        input.domainOrHost.trim() || 'pending-provision.cpcloudhost.com';
      const generatedVerifyToken =
        input.productType === 'Domain Registration'
          ? `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
          : undefined;
      const initialVerificationStatus: PlatformOrder['domainVerificationStatus'] =
        input.productType === 'Domain Registration'
          ? resolvedStatus === 'active'
            ? 'pending_contact_verification'
            : 'pending_admin_approval'
          : undefined;

      const resolvedNameservers: string[] | undefined =
        input.nameservers && input.nameservers.length > 0
          ? input.nameservers
          : isSharedCloud
            ? ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com']
            : isDomain
              ? ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com']
              : undefined;

      const resolvedTransferStatus: PlatformOrder['transferStatus'] =
        input.productType === 'Domain Transfer'
          ? resolvedStatus === 'active'
            ? 'completed'
            : input.transferStatus || 'pending_admin'
          : undefined;

      const defaultDnsRecords: DomainDnsRecord[] | undefined = isDomain
        ? input.dnsRecords || [
            {
              id: `DNS-${newOrderId}-A`,
              type: 'A',
              name: '@',
              value: '185.199.110.42',
              ttl: 3600,
            },
            {
              id: `DNS-${newOrderId}-CNAME`,
              type: 'CNAME',
              name: 'www',
              value: resolvedHost,
              ttl: 3600,
            },
            {
              id: `DNS-${newOrderId}-MX`,
              type: 'MX',
              name: '@',
              value: `mail.${resolvedHost}`,
              ttl: 3600,
              priority: 10,
            },
            {
              id: `DNS-${newOrderId}-TXT`,
              type: 'TXT',
              name: '@',
              value: 'v=spf1 include:_spf.cpcloudhost.com ~all',
              ttl: 3600,
            },
          ]
        : input.dnsRecords;

      const created: PlatformOrder = {
        id: newOrderId,
        clientEmail: input.clientEmail.trim().toLowerCase(),
        clientName:
          input.clientName?.trim() ||
          input.clientEmail.split('@')[0] ||
          'New Client',
        country: input.country?.trim() || 'International',
        productType: input.productType,
        planName: input.planName,
        domainOrHost: resolvedHost,
        billingCycle: input.billingCycle,
        amountUsd: Number(input.amountUsd) || 0,
        status: resolvedStatus,
        paymentMethod:
          input.paymentMethod ||
          (resolvedPaid ? 'Portal Checkout' : 'Invoice Pending'),
        datacenter:
          input.datacenter || (isDomain ? 'Global Anycast DNS' : 'London, UK'),
        createdAt: resolvedCreatedAt,
        nextDueDate: resolvedNextDue,
        autoRenew: input.autoRenew !== undefined ? input.autoRenew : true,
        invoicePaid: resolvedPaid,
        nameservers: resolvedNameservers,
        registrarLock:
          input.registrarLock !== undefined
            ? input.registrarLock
            : isDomain
              ? true
              : undefined,
        whoisPrivacy:
          input.whoisPrivacy !== undefined
            ? input.whoisPrivacy
            : isDomain
              ? true
              : undefined,
        eppCode: isDomain
          ? input.eppCode || generateDeterministicEppCode(newOrderId)
          : input.eppCode,
        whoisContact: input.whoisContact,
        dnsRecords: defaultDnsRecords,
        serverIp: input.serverIp?.trim() || undefined,
        cpanelUsername: input.cpanelUsername?.trim() || undefined,
        controlPanelUrl: input.controlPanelUrl?.trim() || (isSharedCloud ? 'https://stackcp.com' : undefined),
        controlPanelPassword: input.controlPanelPassword?.trim() || undefined,
        serverModuleId: input.serverModuleId,
        serverPackageName: input.serverPackageName,
        linkedFreeDomainOrderId: input.linkedFreeDomainOrderId,
        linkedHostingOrderId: input.linkedHostingOrderId,
        promoCode: input.promoCode,
        discountUsd: input.discountUsd,
        isFreeTrial: input.isFreeTrial,
        trialDays: input.trialDays,
        serverConfig: input.serverConfig,
        transactionRef: input.transactionRef,
        notes: input.notes,
        domainVerificationStatus: initialVerificationStatus,
        domainVerificationToken: generatedVerifyToken,
        nameserverUpdateStatus: isDomain ? 'idle' : undefined,
        transferStatus: resolvedTransferStatus,
        transferStartedAt: input.transferStartedAt,
      };
      ordersRef.current = [created, ...ordersRef.current];
      setOrders((prev) => [created, ...prev]);

      let generatedInvoice: PlatformInvoice | null = null;
      if (input.generateInvoice !== false) {
        generatedInvoice = buildInvoiceFromOrder(created, invoiceTemplateConfig, {
          autoGeneratedAt: nowUtc,
          autoGeneratedTrigger: 'order_created',
        });
        setInvoices((prev) => [generatedInvoice!, ...prev]);
      }

      // Automatically link or register client record cleanly
      setUsers((prev) => {
        const existingIdx = prev.findIndex(
          (u) => u.email.toLowerCase() === created.clientEmail
        );
        if (existingIdx >= 0) {
          return prev.map((u, idx) =>
            idx === existingIdx
              ? {
                  ...u,
                  activeServices: u.activeServices + 1,
                  totalSpendUsd: Number(
                    (u.totalSpendUsd + created.amountUsd).toFixed(2)
                  ),
                }
              : u
          );
        }
        const newClient: ManagedUserAccount = {
          id: `USR-${Math.floor(1200 + Math.random() * 8700)}`,
          name: created.clientName,
          email: created.clientEmail,
          company: created.domainOrHost,
          country: created.country,
          role: 'client',
          status: 'active',
          kycVerified: false,
          activeServices: 1,
          totalSpendUsd: created.amountUsd,
          createdAt: new Date().toISOString().slice(0, 10),
          lastLoginAt: nowUtc,
        };
        return [newClient, ...prev];
      });

      // Fire transactional & admin alert emails when SMTP is configured
      if (typeof window !== 'undefined' && systemSettings.smtp?.enabled && systemSettings.smtp.host.trim() && systemSettings.smtp.username.trim() && systemSettings.smtp.password) {
        const origin = window.location?.origin || invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
        const nsPair = created.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
        const whoisStr = created.whoisContact
          ? `${created.whoisContact.firstName} ${created.whoisContact.lastName}${created.whoisContact.organization ? ` · ${created.whoisContact.organization}` : ''} · ${created.whoisContact.addressLine1}, ${created.whoisContact.city}, ${created.whoisContact.countryName} · ${created.whoisContact.phone}`
          : `${created.clientName} (${created.clientEmail})`;

        const sendTpl = (tplKey: string, recipient: string, vars: Record<string, string>, badge: string) => {
          const tpl =
            emailTemplates.find((t) => t.key === tplKey || t.id === tplKey) ??
            INITIAL_EMAIL_TEMPLATES.find((t) => t.key === tplKey);
          if (!tpl || !tpl.enabled || !recipient) return;
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: recipient,
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge: badge,
              subject: renderEmailMergeText(tpl.subject, vars),
              preheader: renderEmailMergeText(tpl.preheader, vars),
              heading: renderEmailMergeText(tpl.heading, vars),
              body: renderEmailMergeText(tpl.body, vars),
              ctaLabel: renderEmailMergeText(tpl.ctaLabel, vars),
              ctaUrl: renderEmailMergeText(tpl.ctaUrl, vars),
              footerNote: renderEmailMergeText(tpl.footerNote, vars),
            }),
          }).catch(() => undefined);
        };

        const baseVars: Record<string, string> = {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: created.clientName,
          client_email: created.clientEmail,
          order_id: created.id,
          invoice_id: generatedInvoice?.id || `INV-${created.id}`,
          plan_name: created.planName,
          product_type: created.productType,
          domain: created.domainOrHost,
          billing_cycle: created.billingCycle,
          amount: `$${created.amountUsd.toFixed(2)} USD`,
          start_date: created.createdAt.slice(0, 10),
          due_date: created.nextDueDate || '',
          payment_method: created.paymentMethod,
          nameserver_1: nsPair[0] || 'ns1.cpcloudhost.com',
          nameserver_2: nsPair[1] || 'ns2.cpcloudhost.com',
          nameserver_3: nsPair[2] || 'ns3.stackdns.com',
          nameserver_4: nsPair[3] || 'ns4.stackdns.com',
          whois_summary: whoisStr,
          verify_domain_url: `${origin}/verify-domain?orderId=${encodeURIComponent(created.id)}&token=${encodeURIComponent(generatedVerifyToken || '')}`,
          updated_at: nowUtc,
        };

        if (created.productType === 'Domain Registration') {
          if (resolvedStatus === 'pending') {
            sendTpl('domain-order-pending-review', created.clientEmail, baseVars, 'REGISTRAR REVIEW');
          } else {
            sendTpl('domain-registration', created.clientEmail, baseVars, 'DOMAIN REGISTRATION');
            sendTpl('domain-contact-verification', created.clientEmail, baseVars, 'WHOIS VERIFICATION');
          }
        } else if (created.productType === 'Domain Transfer') {
          sendTpl('domain-transfer-initiated', created.clientEmail, baseVars, 'DOMAIN TRANSFER');
        }

        if (
          systemSettings.adminAlerts?.enabled &&
          systemSettings.adminAlerts.notifyNewOrder &&
          systemSettings.adminAlerts.alertEmail.trim()
        ) {
          sendTpl(
            'admin-system-alert',
            systemSettings.adminAlerts.alertEmail.trim(),
            {
              ...baseVars,
              event_title: `New ${created.productType} Order (${created.id})`,
              event_details: `${created.planName} · ${created.domainOrHost} · $${created.amountUsd.toFixed(2)} USD (${created.billingCycle}) · Status: ${created.status.toUpperCase()}`,
              action_url: `${origin}/admin/wp`,
            },
            'ADMIN OPERATIONS ALERT'
          );
        }
      }

      return { order: created, invoice: generatedInvoice };
    },
    [invoiceTemplateConfig, systemSettings, emailTemplates]
  );

  const upsertInvoiceOnOrderApproval = useCallback(
    (
      approvedOrder: PlatformOrder,
      approvalNote?: string
    ): { invoice: PlatformInvoice; created: boolean } => {
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const existing = invoices.find((inv) => inv.orderId === approvedOrder.id);
      const shouldMarkPaid = invoiceTemplateConfig.autoMarkPaidOnApproval !== false;

      if (existing) {
        const updated: PlatformInvoice = {
          ...existing,
          status: shouldMarkPaid ? 'paid' : existing.status,
          paidAt: shouldMarkPaid ? existing.paidAt || nowUtc : existing.paidAt,
          datacenter: approvedOrder.datacenter,
          autoGeneratedAt: existing.autoGeneratedAt || nowUtc,
          autoGeneratedTrigger: existing.autoGeneratedTrigger || 'order_approved',
          notes:
            approvalNote ||
            existing.notes ||
            `Auto-verified upon order ${approvedOrder.id} approval.`,
        };
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === existing.id ? updated : inv))
        );
        return { invoice: updated, created: false };
      }

      const generated = buildInvoiceFromOrder(
        approvedOrder,
        invoiceTemplateConfig,
        {
          status: shouldMarkPaid ? 'paid' : 'unpaid',
          paidAt: shouldMarkPaid ? nowUtc : undefined,
          autoGeneratedAt: nowUtc,
          autoGeneratedTrigger: 'order_approved',
          notes:
            approvalNote ||
            `Automatically generated upon approval of order ${approvedOrder.id}.`,
        }
      );
      setInvoices((prev) => [generated, ...prev]);

      appendLoginActivity({
        userEmail: approvedOrder.clientEmail,
        userName: approvedOrder.clientName,
        eventType: 'Invoice Auto-Generated',
        status: 'success',
        authMethod: `${generated.id} · ${approvedOrder.id} (${generated.status.toUpperCase()})`,
        country: approvedOrder.country,
      });

      return { invoice: generated, created: true };
    },
    [invoices, invoiceTemplateConfig, appendLoginActivity]
  );

  const generateInvoiceForOrder = useCallback(
    (orderId: string) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Order record not found.' };
      }
      const { invoice, created } = upsertInvoiceOnOrderApproval(
        target,
        `Generated by ${currentUser?.name || 'Admin'} for order ${target.id}.`
      );
      return { ok: true, invoice, created };
    },
    [isAdmin, orders, currentUser, upsertInvoiceOnOrderApproval]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, notes?: string) => {
      if (!isAdmin) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const targetOrder = orders.find((o) => o.id === orderId);
      const isApprovingDomainReg =
        status === 'active' &&
        targetOrder?.productType === 'Domain Registration' &&
        targetOrder.status !== 'active';
      const resolvedToken =
        targetOrder?.domainVerificationToken ||
        `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                status,
                domainVerificationToken:
                  isApprovingDomainReg || ord.productType === 'Domain Registration'
                    ? ord.domainVerificationToken || resolvedToken
                    : ord.domainVerificationToken,
                domainVerificationStatus: isApprovingDomainReg
                  ? ord.domainVerificationStatus === 'verified'
                    ? 'verified'
                    : 'pending_contact_verification'
                  : ord.domainVerificationStatus,
                invoicePaid:
                  status === 'active' && invoiceTemplateConfig.autoMarkPaidOnApproval !== false
                    ? true
                    : ord.invoicePaid,
                cancellationStatus:
                  status === 'cancelled'
                    ? 'completed'
                    : ord.cancellationStatus,
                cancellationReviewedAt:
                  status === 'cancelled' ? nowUtc : ord.cancellationReviewedAt,
                refundStatus:
                  status === 'refunded' ? 'processed' : ord.refundStatus,
                refundAmountUsd:
                  status === 'refunded'
                    ? ord.refundAmountUsd ?? ord.amountUsd
                    : ord.refundAmountUsd,
                refundProcessedAt:
                  status === 'refunded' ? nowUtc : ord.refundProcessedAt,
                notes: notes !== undefined ? notes : ord.notes,
              }
            : ord
        )
      );
      if (
        status === 'active' &&
        targetOrder &&
        invoiceTemplateConfig.autoGenerateOnApproval !== false
      ) {
        upsertInvoiceOnOrderApproval(
          {
            ...targetOrder,
            status: 'active',
            invoicePaid: invoiceTemplateConfig.autoMarkPaidOnApproval !== false,
          },
          notes || `Auto-generated upon order approval by ${currentUser?.name || 'Admin'}.`
        );
      } else if (status === 'refunded' || status === 'cancelled') {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.orderId === orderId
              ? {
                  ...inv,
                  status:
                    status === 'refunded'
                      ? 'refunded'
                      : inv.status === 'paid'
                        ? inv.status
                        : 'cancelled',
                  cancellationStatus:
                    status === 'cancelled' ? 'completed' : inv.cancellationStatus,
                  refundStatus: status === 'refunded' ? 'processed' : inv.refundStatus,
                  refundAmountUsd:
                    status === 'refunded'
                      ? inv.refundAmountUsd ?? inv.amountUsd
                      : inv.refundAmountUsd,
                  refundProcessedAt:
                    status === 'refunded' ? nowUtc : inv.refundProcessedAt,
                }
              : inv
          )
        );
      }

      if (targetOrder) {
        if (status === 'suspended' && targetOrder.status !== 'suspended') {
          syncWhmAccountState(
            targetOrder,
            'suspend',
            notes || `Suspended by ${currentUser?.name || 'Admin'}`
          );
        } else if (
          status === 'active' &&
          (targetOrder.status === 'suspended' || targetOrder.status === 'expired')
        ) {
          syncWhmAccountState(
            targetOrder,
            'unsuspend',
            notes || `Reactivated by ${currentUser?.name || 'Admin'}`
          );
        }
      }

      if (
        isApprovingDomainReg &&
        targetOrder &&
        typeof window !== 'undefined' &&
        systemSettings.smtp?.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password
      ) {
        const origin = window.location?.origin || invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
        const nsPair = targetOrder.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
        const whoisStr = targetOrder.whoisContact
          ? `${targetOrder.whoisContact.firstName} ${targetOrder.whoisContact.lastName}${targetOrder.whoisContact.organization ? ` · ${targetOrder.whoisContact.organization}` : ''} · ${targetOrder.whoisContact.addressLine1}, ${targetOrder.whoisContact.city}, ${targetOrder.whoisContact.countryName} · ${targetOrder.whoisContact.phone}`
          : `${targetOrder.clientName} (${targetOrder.clientEmail})`;
        const verifyUrl = `${origin}/verify-domain?orderId=${encodeURIComponent(targetOrder.id)}&token=${encodeURIComponent(resolvedToken)}`;
        const mergeVars: Record<string, string> = {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: targetOrder.clientName,
          client_email: targetOrder.clientEmail,
          order_id: targetOrder.id,
          domain: targetOrder.domainOrHost,
          billing_cycle: targetOrder.billingCycle,
          amount: `$${targetOrder.amountUsd.toFixed(2)} USD`,
          start_date: targetOrder.createdAt.slice(0, 10),
          due_date: targetOrder.nextDueDate || '',
          nameserver_1: nsPair[0],
          nameserver_2: nsPair[1],
          whois_summary: whoisStr,
          verify_domain_url: verifyUrl,
          updated_at: nowUtc,
        };
        ['domain-registration', 'domain-contact-verification'].forEach((tplKey) => {
          const tpl =
            emailTemplates.find((t) => t.key === tplKey || t.id === tplKey) ??
            INITIAL_EMAIL_TEMPLATES.find((t) => t.key === tplKey);
          if (!tpl || !tpl.enabled) return;
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: targetOrder.clientEmail,
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge: tplKey === 'domain-contact-verification' ? 'WHOIS VERIFICATION' : 'DOMAIN REGISTRATION',
              subject: renderEmailMergeText(tpl.subject, mergeVars),
              preheader: renderEmailMergeText(tpl.preheader, mergeVars),
              heading: renderEmailMergeText(tpl.heading, mergeVars),
              body: renderEmailMergeText(tpl.body, mergeVars),
              ctaLabel: renderEmailMergeText(tpl.ctaLabel, mergeVars),
              ctaUrl: renderEmailMergeText(tpl.ctaUrl, mergeVars),
              footerNote: renderEmailMergeText(tpl.footerNote, mergeVars),
            }),
          }).catch(() => undefined);
        });
      }
    },
    [isAdmin, orders, currentUser, invoiceTemplateConfig, upsertInvoiceOnOrderApproval, syncWhmAccountState, systemSettings.smtp, emailTemplates]
  );

  const dispatchTemplatedOrderEmail = useCallback(
    (
      tplKey: string,
      recipient: string,
      vars: Record<string, string>,
      headerBadge: string
    ) => {
      if (
        typeof window === 'undefined' ||
        !systemSettings.smtp?.enabled ||
        !systemSettings.smtp.host.trim() ||
        !systemSettings.smtp.username.trim() ||
        !systemSettings.smtp.password ||
        !recipient
      ) {
        return;
      }
      const tpl =
        emailTemplates.find((t) => t.key === tplKey || t.id === tplKey) ??
        INITIAL_EMAIL_TEMPLATES.find((t) => t.key === tplKey);
      if (!tpl || !tpl.enabled) return;
      void fetch('/api/system/send-templated-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: systemSettings.smtp,
          toEmail: recipient,
          companyName: invoiceTemplateConfig.companyName,
          companyEmail: invoiceTemplateConfig.companyEmail,
          companyWebsite: invoiceTemplateConfig.companyWebsite,
          accentColor: invoiceTemplateConfig.accentColor,
          headerBadge,
          subject: renderEmailMergeText(tpl.subject, vars),
          preheader: renderEmailMergeText(tpl.preheader, vars),
          heading: renderEmailMergeText(tpl.heading, vars),
          body: renderEmailMergeText(tpl.body, vars),
          ctaLabel: renderEmailMergeText(tpl.ctaLabel, vars),
          ctaUrl: renderEmailMergeText(tpl.ctaUrl, vars),
          footerNote: renderEmailMergeText(tpl.footerNote, vars),
        }),
      }).catch(() => undefined);
    },
    [systemSettings.smtp, emailTemplates, invoiceTemplateConfig]
  );

  const activateLinkedFreeDomainForHosting = useCallback(
    (hostingOrder: PlatformOrder, overrideNameservers?: string[]) => {
      const linked =
        ordersRef.current.find(
          (o) =>
            o.id === hostingOrder.linkedFreeDomainOrderId ||
            o.linkedHostingOrderId === hostingOrder.id
        ) ?? null;
      if (!linked) return;

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const todayIso = getTodayIsoUtc();
      const domainDue = computeDefaultNextDueDate(todayIso, '1 Year');
      const token =
        linked.domainVerificationToken ||
        `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const nextNs =
        overrideNameservers && overrideNameservers.length > 0
          ? overrideNameservers
          : linked.nameservers && linked.nameservers.length > 0
            ? linked.nameservers
            : hostingOrder.nameservers || ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com'];

      const activatedDomain: PlatformOrder = {
        ...linked,
        status: 'active',
        billingCycle: '1 Year',
        nextDueDate: domainDue,
        invoicePaid: true,
        nameservers: nextNs,
        domainVerificationToken: token,
        domainVerificationStatus:
          linked.domainVerificationStatus === 'verified'
            ? 'verified'
            : 'pending_contact_verification',
        notes: `Free 1-Year .com domain activated with ${hostingOrder.planName} (${hostingOrder.id}) on ${nowUtc}.`,
      };

      ordersRef.current = ordersRef.current.map((ord) =>
        ord.id === linked.id ? activatedDomain : ord
      );
      setOrders((prev) =>
        prev.map((ord) => (ord.id === linked.id ? activatedDomain : ord))
      );

      if (invoiceTemplateConfig.autoGenerateOnApproval !== false) {
        upsertInvoiceOnOrderApproval(
          activatedDomain,
          `Free Year 1 .com Domain activated with hosting order ${hostingOrder.id}.`
        );
      }

      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
      const verifyUrl = `${origin}/verify-domain?orderId=${encodeURIComponent(activatedDomain.id)}&token=${encodeURIComponent(token)}`;
      const whoisStr = activatedDomain.whoisContact
        ? `${activatedDomain.whoisContact.firstName} ${activatedDomain.whoisContact.lastName}${activatedDomain.whoisContact.organization ? ` · ${activatedDomain.whoisContact.organization}` : ''} · ${activatedDomain.whoisContact.addressLine1}, ${activatedDomain.whoisContact.city}, ${activatedDomain.whoisContact.countryName}`
        : `${activatedDomain.clientName} (${activatedDomain.clientEmail})`;

      const vars: Record<string, string> = {
        company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
        client_name: activatedDomain.clientName,
        client_email: activatedDomain.clientEmail,
        order_id: activatedDomain.id,
        domain: activatedDomain.domainOrHost,
        billing_cycle: '1 Year',
        amount: '$0.00 USD (Free Year 1 Promo)',
        start_date: todayIso,
        due_date: domainDue,
        nameserver_1: nextNs[0] || 'ns1.stackdns.com',
        nameserver_2: nextNs[1] || 'ns2.stackdns.com',
        nameserver_3: nextNs[2] || 'ns3.stackdns.com',
        nameserver_4: nextNs[3] || 'ns4.stackdns.com',
        whois_summary: whoisStr,
        verify_domain_url: verifyUrl,
        updated_at: nowUtc,
      };

      dispatchTemplatedOrderEmail(
        'domain-registration',
        activatedDomain.clientEmail,
        vars,
        'FREE .COM DOMAIN ACTIVE'
      );
      if (activatedDomain.domainVerificationStatus !== 'verified') {
        dispatchTemplatedOrderEmail(
          'domain-contact-verification',
          activatedDomain.clientEmail,
          vars,
          'WHOIS VERIFICATION'
        );
      }
    },
    [invoiceTemplateConfig, upsertInvoiceOnOrderApproval, dispatchTemplatedOrderEmail]
  );

  const approveSharedHostingOrder = useCallback(
    (input: { orderId: string; password: string; notes?: string }) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target =
        orders.find((o) => o.id === input.orderId) ??
        ordersRef.current.find((o) => o.id === input.orderId);
      if (!target) {
        return { ok: false, error: 'Order record not found.' };
      }
      const cleanPassword = input.password.trim();
      if (!cleanPassword) {
        return { ok: false, error: 'Enter a StackCP control panel password.' };
      }

      const todayIso = getTodayIsoUtc();
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedDueDate =
        target.nextDueDate && target.nextDueDate.trim()
          ? target.nextDueDate
          : computeDefaultNextDueDate(todayIso, target.billingCycle);
      const stackNs = [
        'ns1.stackdns.com',
        'ns2.stackdns.com',
        'ns3.stackdns.com',
        'ns4.stackdns.com',
      ];
      const resolvedNote =
        input.notes?.trim() ||
        `Shared Cloud approved & StackCP credentials issued by ${currentUser.name} (${nowUtc}).`;

      const updatedOrder: PlatformOrder = {
        ...target,
        status: 'active',
        nextDueDate: resolvedDueDate,
        invoicePaid:
          invoiceTemplateConfig.autoMarkPaidOnApproval !== false
            ? true
            : target.invoicePaid,
        controlPanelUrl: 'https://stackcp.com',
        cpanelUsername: target.domainOrHost,
        controlPanelPassword: cleanPassword,
        nameservers: stackNs,
        notes: resolvedNote,
      };

      ordersRef.current = ordersRef.current.map((ord) =>
        ord.id === input.orderId ? updatedOrder : ord
      );
      setOrders((prev) =>
        prev.map((ord) => (ord.id === input.orderId ? updatedOrder : ord))
      );

      let resultingInvoice: PlatformInvoice | undefined;
      if (invoiceTemplateConfig.autoGenerateOnApproval !== false) {
        resultingInvoice = upsertInvoiceOnOrderApproval(updatedOrder, resolvedNote).invoice;
      }

      dispatchTemplatedOrderEmail(
        'shared-hosting-details',
        updatedOrder.clientEmail,
        {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: updatedOrder.clientName,
          plan_name: updatedOrder.planName,
          datacenter: updatedOrder.datacenter,
          domain: updatedOrder.domainOrHost,
          cp_url: 'https://stackcp.com',
          cp_username: updatedOrder.domainOrHost,
          cp_password: cleanPassword,
          server_hostname: 'stackcp.com',
          server_ip: updatedOrder.serverIp || 'Autoscaling StackCP Cloud',
          nameserver_1: stackNs[0],
          nameserver_2: stackNs[1],
          nameserver_3: stackNs[2],
          nameserver_4: stackNs[3],
          start_date: updatedOrder.createdAt.slice(0, 10),
          due_date: resolvedDueDate,
        },
        'STACKCP CREDENTIALS'
      );

      activateLinkedFreeDomainForHosting(updatedOrder, stackNs);

      return { ok: true, invoice: resultingInvoice };
    },
    [
      isAdmin,
      currentUser,
      orders,
      invoiceTemplateConfig,
      upsertInvoiceOnOrderApproval,
      dispatchTemplatedOrderEmail,
      activateLinkedFreeDomainForHosting,
    ]
  );

  const approveOrderWithServer = useCallback(
    (input: {
      orderId: string;
      serverModuleId: string;
      serverPackageName?: string;
      serverIp?: string;
      cpanelUsername?: string;
      controlPanelUrl?: string;
      controlPanelPassword?: string;
      nameservers?: string[];
      notes?: string;
    }) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target =
        orders.find((o) => o.id === input.orderId) ??
        ordersRef.current.find((o) => o.id === input.orderId);
      if (!target) {
        return { ok: false, error: 'Order record not found.' };
      }
      const mod = provisioningModules.find((m) => m.id === input.serverModuleId);
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedNote =
        input.notes?.trim() ||
        `Approved & provisioned on ${mod ? mod.name : 'Manual Server'} (${input.serverPackageName || 'default'}) by ${currentUser.name} (${nowUtc}).`;

      const resolvedDueDate =
        target.nextDueDate && target.nextDueDate.trim()
          ? target.nextDueDate
          : computeDefaultNextDueDate(
              parseIsoDateOnly(target.createdAt) || getTodayIsoUtc(),
              target.billingCycle
            );

      const resolvedCpUrl =
        input.controlPanelUrl?.trim() ||
        target.controlPanelUrl ||
        (mod?.hostname
          ? `https://${mod.hostname}:${target.productType === 'Reseller Hosting' ? 2087 : 2083}`
          : undefined);
      const resolvedNs =
        input.nameservers && input.nameservers.length > 0
          ? input.nameservers
          : mod?.nameservers?.filter(Boolean).length
            ? mod.nameservers
            : target.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];

      const updatedOrder: PlatformOrder = {
        ...target,
        status: 'active',
        nextDueDate: resolvedDueDate,
        invoicePaid:
          invoiceTemplateConfig.autoMarkPaidOnApproval !== false
            ? true
            : target.invoicePaid,
        serverModuleId: input.serverModuleId || target.serverModuleId,
        serverPackageName:
          input.serverPackageName?.trim() || target.serverPackageName,
        serverIp: input.serverIp?.trim() || mod?.hostname || target.serverIp,
        cpanelUsername: input.cpanelUsername?.trim() || target.cpanelUsername,
        controlPanelUrl: resolvedCpUrl,
        controlPanelPassword:
          input.controlPanelPassword?.trim() || target.controlPanelPassword,
        nameservers: resolvedNs,
        notes: resolvedNote,
      };

      ordersRef.current = ordersRef.current.map((ord) =>
        ord.id === input.orderId ? updatedOrder : ord
      );
      setOrders((prev) =>
        prev.map((ord) => (ord.id === input.orderId ? updatedOrder : ord))
      );

      let resultingInvoice: PlatformInvoice | undefined;
      let invoiceWasCreated = false;

      if (invoiceTemplateConfig.autoGenerateOnApproval !== false) {
        const res = upsertInvoiceOnOrderApproval(updatedOrder, resolvedNote);
        resultingInvoice = res.invoice;
        invoiceWasCreated = res.created;
      }

      const tplKey =
        updatedOrder.productType === 'cPanel Hosting'
          ? 'cpanel-hosting-details'
          : updatedOrder.productType === 'Managed WordPress'
            ? 'wordpress-hosting-details'
            : updatedOrder.productType === 'Windows Hosting'
              ? 'windows-hosting-details'
              : updatedOrder.productType === 'Reseller Hosting'
                ? 'reseller-hosting-details'
                : updatedOrder.productType === 'Unmanaged VPS'
                  ? 'vps-hosting-details'
                  : updatedOrder.productType === 'n8n Hosting'
                    ? 'n8n-hosting-details'
                    : 'hosting-details';

      dispatchTemplatedOrderEmail(
        tplKey,
        updatedOrder.clientEmail,
        {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: updatedOrder.clientName,
          plan_name: updatedOrder.planName,
          datacenter: updatedOrder.datacenter,
          domain: updatedOrder.domainOrHost,
          cp_url: resolvedCpUrl || 'https://cpcloudhost.com/dashboard/services',
          cp_username: updatedOrder.cpanelUsername || updatedOrder.domainOrHost,
          cp_password:
            updatedOrder.controlPanelPassword || 'Configured on provisioning node (use SSO in portal)',
          server_hostname: mod?.hostname || updatedOrder.serverIp || updatedOrder.domainOrHost,
          server_ip: updatedOrder.serverIp || mod?.hostname || 'Assigned Cluster Node',
          whm_url: resolvedCpUrl || '',
          cpanel_accounts_quota: updatedOrder.planName,
          nameserver_1: resolvedNs[0] || 'ns1.cpcloudhost.com',
          nameserver_2: resolvedNs[1] || 'ns2.cpcloudhost.com',
          nameserver_3: resolvedNs[2] || '',
          nameserver_4: resolvedNs[3] || '',
          start_date: updatedOrder.createdAt.slice(0, 10),
          due_date: resolvedDueDate,
        },
        `${updatedOrder.productType.toUpperCase()} ACTIVE`
      );

      activateLinkedFreeDomainForHosting(updatedOrder, resolvedNs);

      return {
        ok: true,
        invoice: resultingInvoice,
        invoiceWasCreated,
      };
    },
    [
      isAdmin,
      currentUser,
      orders,
      provisioningModules,
      invoiceTemplateConfig,
      upsertInvoiceOnOrderApproval,
      dispatchTemplatedOrderEmail,
      activateLinkedFreeDomainForHosting,
    ]
  );

  const adminUpdateOrderDetails = useCallback(
    (
      orderId: string,
      updates: {
        createdAt?: string;
        nextDueDate?: string;
        status?: OrderStatus;
        amountUsd?: number;
        billingCycle?: PlatformOrder['billingCycle'];
        planName?: string;
        domainOrHost?: string;
        datacenter?: string;
        serverIp?: string;
        cpanelUsername?: string;
        controlPanelUrl?: string;
        controlPanelPassword?: string;
        serverModuleId?: string;
        serverPackageName?: string;
        autoRenew?: boolean;
        nameservers?: string[];
        registrarLock?: boolean;
        whoisPrivacy?: boolean;
        notes?: string;
      }
    ) => {
    if (!isAdmin) {
      return { ok: false, error: 'Administrator clearance required.' };
    }
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) {
      return { ok: false, error: 'Order record not found.' };
    }

    const normalizedCreatedAt =
      updates.createdAt !== undefined
        ? updates.createdAt.trim().length === 10
          ? `${updates.createdAt.trim()} 09:00 UTC`
          : updates.createdAt.trim() || existing.createdAt
        : existing.createdAt;

    const updatedOrder: PlatformOrder = {
      ...existing,
      ...updates,
      createdAt: normalizedCreatedAt,
      amountUsd:
        updates.amountUsd !== undefined
          ? Number(updates.amountUsd) || 0
          : existing.amountUsd,
    };

    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? updatedOrder : ord))
    );

    if (updates.status && updates.status !== existing.status) {
      if (updates.status === 'suspended') {
        syncWhmAccountState(updatedOrder, 'suspend', updates.notes || 'Suspended via Admin Order Editor');
      } else if (
        updates.status === 'active' &&
        (existing.status === 'suspended' || existing.status === 'expired')
      ) {
        syncWhmAccountState(updatedOrder, 'unsuspend', updates.notes || 'Reactivated via Admin Order Editor');
      }
    }

    const hasExistingInvoice = invoices.some((inv) => inv.orderId === orderId);
    if (
      !hasExistingInvoice &&
      updatedOrder.status === 'active' &&
      invoiceTemplateConfig.autoGenerateOnApproval !== false
    ) {
      upsertInvoiceOnOrderApproval(updatedOrder);
    } else {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.orderId !== orderId) return inv;
          const nextAmount =
            updates.amountUsd !== undefined
              ? Number(updates.amountUsd) || 0
              : inv.amountUsd;
          const updatedItems = inv.items.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  description: updates.planName ?? item.description,
                  domainOrHost: updates.domainOrHost ?? item.domainOrHost,
                  billingCycle: updates.billingCycle ?? item.billingCycle,
                  unitPriceUsd:
                    updates.amountUsd !== undefined && inv.items.length === 1
                      ? nextAmount
                      : item.unitPriceUsd,
                  lineTotalUsd:
                    updates.amountUsd !== undefined && inv.items.length === 1
                      ? nextAmount * item.quantity
                      : item.lineTotalUsd,
                }
              : item
          );
          const totals = calculateInvoiceTotals(
            updatedItems,
            inv.taxRatePercent,
            inv.discountUsd
          );
          const nowUtc =
            new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
          const autoSettle =
            updates.status === 'active' &&
            invoiceTemplateConfig.autoMarkPaidOnApproval !== false;
          return {
            ...inv,
            issuedDate: normalizedCreatedAt.slice(0, 10),
            dueDate: updates.nextDueDate ?? inv.dueDate,
            items: updatedItems,
            subtotalUsd: totals.subtotalUsd,
            amountUsd:
              inv.items.length === 1 && updates.amountUsd !== undefined
                ? totals.totalUsd
                : inv.amountUsd,
            planName: updates.planName ?? inv.planName,
            domainOrHost: updates.domainOrHost ?? inv.domainOrHost,
            billingCycle: updates.billingCycle ?? inv.billingCycle,
            datacenter: updates.datacenter ?? inv.datacenter,
            status: autoSettle ? 'paid' : inv.status,
            paidAt: autoSettle ? inv.paidAt || nowUtc : inv.paidAt,
          };
        })
      );
    }

    return { ok: true };
  },
  [
    isAdmin,
    orders,
    invoices,
    invoiceTemplateConfig,
    upsertInvoiceOnOrderApproval,
    syncWhmAccountState,
  ]
);

  const adminTransferOrderToClient = useCallback(
    (orderId: string, targetUserId: string) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        return { ok: false, error: 'Service or domain order not found.' };
      }
      const targetUser = users.find((u) => u.id === targetUserId);
      if (!targetUser) {
        return { ok: false, error: 'Target client account not found.' };
      }
      if (targetUser.email.toLowerCase() === order.clientEmail.toLowerCase()) {
        return { ok: false, error: 'This service already belongs to the selected client.' };
      }

      const sourceEmailLower = order.clientEmail.toLowerCase();
      const targetEmailLower = targetUser.email.toLowerCase();
      const transferNote = `Transferred from ${order.clientEmail} to ${targetEmailLower} by ${currentUser?.name || 'Admin'} on ${new Date().toISOString().slice(0, 10)}`;

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                clientEmail: targetEmailLower,
                clientName: targetUser.name,
                country: targetUser.country,
                notes: ord.notes ? `${ord.notes} · ${transferNote}` : transferNote,
              }
            : ord
        )
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.orderId === orderId
            ? {
                ...inv,
                clientEmail: targetEmailLower,
                clientName: targetUser.name,
              }
            : inv
        )
      );

      setUsers((prev) =>
        prev.map((u) => {
          const emailLower = u.email.toLowerCase();
          if (emailLower === sourceEmailLower) {
            return {
              ...u,
              activeServices: Math.max(0, u.activeServices - 1),
            };
          }
          if (emailLower === targetEmailLower) {
            return {
              ...u,
              activeServices: u.activeServices + 1,
            };
          }
          return u;
        })
      );

      appendLoginActivity({
        userEmail: targetEmailLower,
        userName: targetUser.name,
        eventType: 'Service/Domain Transferred',
        status: 'success',
        authMethod: `${order.domainOrHost} (${order.id}) from ${sourceEmailLower}`,
        country: targetUser.country,
      });

      return { ok: true };
    },
    [isAdmin, orders, users, currentUser, appendLoginActivity]
  );

  const adminUpdateInvoiceStatus = useCallback(
    (
      invoiceId: string,
      status: InvoiceStatus,
      paymentMethod?: string,
      transactionRef?: string
    ) => {
      if (!isAdmin) return;
      const targetInv = invoices.find((inv) => inv.id === invoiceId);
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const paid = status === 'paid';

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status,
                paymentMethod: paymentMethod || inv.paymentMethod,
                transactionRef: transactionRef !== undefined ? transactionRef : inv.transactionRef,
                paidAt: paid ? inv.paidAt || nowUtc : inv.paidAt,
                refundStatus: status === 'refunded' ? 'processed' : inv.refundStatus,
                refundAmountUsd:
                  status === 'refunded' ? inv.refundAmountUsd ?? inv.amountUsd : inv.refundAmountUsd,
                refundProcessedAt: status === 'refunded' ? nowUtc : inv.refundProcessedAt,
                cancellationStatus:
                  status === 'cancelled' ? 'completed' : inv.cancellationStatus,
              }
            : inv
        )
      );

      if (targetInv && targetInv.orderId) {
        const linkedOrder = orders.find((o) => o.id === targetInv.orderId);
        const todayIso = getTodayIsoUtc();
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id !== targetInv.orderId) return ord;
            const requiresProvisioningApproval =
              ord.status === 'pending' &&
              (ord.productType === 'Shared Cloud' ||
                ord.productType === 'cPanel Hosting' ||
                ord.productType === 'Domain Registration' ||
                ord.productType === 'Domain Transfer');
            const shouldReactivate =
              paid &&
              !requiresProvisioningApproval &&
              (ord.status === 'pending' || ord.status === 'suspended' || ord.status === 'expired');
            const isPastDue = ord.nextDueDate
              ? diffDaysIso(todayIso, parseIsoDateOnly(ord.nextDueDate)) < 0
              : false;
            const nextDue =
              shouldReactivate && isPastDue
                ? computeDefaultNextDueDate(todayIso, ord.billingCycle)
                : ord.nextDueDate;
            return {
              ...ord,
              invoicePaid: paid,
              nextDueDate: nextDue,
              paymentMethod: paymentMethod || ord.paymentMethod,
              status: shouldReactivate
                ? 'active'
                : status === 'refunded'
                  ? 'refunded'
                  : status === 'cancelled'
                    ? 'cancelled'
                    : ord.status,
              refundStatus: status === 'refunded' ? 'processed' : ord.refundStatus,
              refundAmountUsd:
                status === 'refunded' ? ord.refundAmountUsd ?? ord.amountUsd : ord.refundAmountUsd,
              refundProcessedAt: status === 'refunded' ? nowUtc : ord.refundProcessedAt,
              cancellationStatus:
                status === 'cancelled' ? 'completed' : ord.cancellationStatus,
              notes: `Invoice ${invoiceId} marked ${status.toUpperCase()} by ${currentUser?.name || 'Admin'}`,
            };
          })
        );
        if (
          paid &&
          linkedOrder &&
          (linkedOrder.status === 'suspended' || linkedOrder.status === 'expired')
        ) {
          syncWhmAccountState(linkedOrder, 'unsuspend', `Invoice ${invoiceId} settled by Admin`);
        }
      }
    },
    [isAdmin, invoices, orders, currentUser, syncWhmAccountState]
  );

  const adminUpdateInvoiceFull = useCallback(
    (
      invoiceId: string,
      updates: {
        issuedDate: string;
        dueDate: string;
        status: InvoiceStatus;
        paymentMethod: string;
        transactionRef?: string;
        taxRatePercent: number;
        discountUsd: number;
        notes?: string;
        items: InvoiceLineItem[];
      }
    ) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const existing = invoices.find((inv) => inv.id === invoiceId);
      if (!existing) {
        return { ok: false, error: 'Invoice record not found.' };
      }
      if (!updates.items || updates.items.length === 0) {
        return { ok: false, error: 'Add at least one invoice line item.' };
      }
      const cleanedItems: InvoiceLineItem[] = updates.items.map((it, idx) => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const unit = Math.max(0, Number(it.unitPriceUsd) || 0);
        return {
          ...it,
          id: it.id || `ITEM-${invoiceId}-${idx + 1}`,
          description: it.description.trim() || 'Service Line Item',
          domainOrHost: it.domainOrHost.trim() || existing.domainOrHost || '—',
          quantity: qty,
          unitPriceUsd: unit,
          lineTotalUsd: Number((qty * unit).toFixed(2)),
        };
      });
      const totals = calculateInvoiceTotals(
        cleanedItems,
        updates.taxRatePercent,
        updates.discountUsd
      );
      const first = cleanedItems[0];
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const paid = updates.status === 'paid';

      const updatedInvoice: PlatformInvoice = {
        ...existing,
        issuedDate: updates.issuedDate.slice(0, 10) || existing.issuedDate,
        dueDate: updates.dueDate.slice(0, 10) || existing.dueDate,
        status: updates.status,
        paymentMethod: updates.paymentMethod.trim() || existing.paymentMethod,
        transactionRef: updates.transactionRef?.trim() || undefined,
        taxRatePercent: Math.max(0, Number(updates.taxRatePercent) || 0),
        discountUsd: Math.max(0, Number(updates.discountUsd) || 0),
        items: cleanedItems,
        subtotalUsd: totals.subtotalUsd,
        amountUsd: totals.totalUsd,
        planName: first.description,
        domainOrHost: first.domainOrHost,
        productType:
          first.productType === 'Custom Service' || first.productType === 'Setup / Add-on'
            ? existing.productType
            : first.productType,
        billingCycle:
          first.billingCycle === 'One-Time' ? existing.billingCycle : first.billingCycle,
        paidAt: paid ? existing.paidAt || nowUtc : undefined,
        notes: updates.notes?.trim() || undefined,
        refundStatus: updates.status === 'refunded' ? 'processed' : existing.refundStatus,
        refundAmountUsd:
          updates.status === 'refunded'
            ? existing.refundAmountUsd ?? totals.totalUsd
            : existing.refundAmountUsd,
        refundProcessedAt:
          updates.status === 'refunded'
            ? existing.refundProcessedAt || nowUtc
            : existing.refundProcessedAt,
        cancellationStatus:
          updates.status === 'cancelled' ? 'completed' : existing.cancellationStatus,
      };

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv))
      );

      if (existing.orderId) {
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id !== existing.orderId) return ord;
            return {
              ...ord,
              createdAt: updatedInvoice.issuedDate,
              nextDueDate: updatedInvoice.dueDate,
              amountUsd: updatedInvoice.amountUsd,
              planName: updatedInvoice.planName,
              domainOrHost: updatedInvoice.domainOrHost,
              paymentMethod: updatedInvoice.paymentMethod,
              invoicePaid: paid,
              status:
                paid &&
                ord.status === 'pending' &&
                ord.productType !== 'Shared Cloud' &&
                ord.productType !== 'cPanel Hosting' &&
                ord.productType !== 'Domain Registration' &&
                ord.productType !== 'Domain Transfer'
                  ? 'active'
                  : updates.status === 'refunded'
                    ? 'refunded'
                    : updates.status === 'cancelled'
                      ? 'cancelled'
                      : ord.status,
              refundStatus:
                updates.status === 'refunded' ? 'processed' : ord.refundStatus,
              refundAmountUsd:
                updates.status === 'refunded'
                  ? updatedInvoice.refundAmountUsd ?? updatedInvoice.amountUsd
                  : ord.refundAmountUsd,
              refundProcessedAt:
                updates.status === 'refunded'
                  ? updatedInvoice.refundProcessedAt
                  : ord.refundProcessedAt,
              cancellationStatus:
                updates.status === 'cancelled' ? 'completed' : ord.cancellationStatus,
            };
          })
        );
      }

      return { ok: true, invoice: updatedInvoice };
    },
    [isAdmin, invoices]
  );

  const adminCreateStandaloneInvoice = useCallback(
    (input: {
      clientEmail: string;
      issuedDate: string;
      dueDate: string;
      status: InvoiceStatus;
      paymentMethod: string;
      transactionRef?: string;
      taxRatePercent: number;
      discountUsd: number;
      notes?: string;
      items: InvoiceLineItem[];
    }) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const client = users.find(
        (u) => u.email.toLowerCase() === input.clientEmail.trim().toLowerCase()
      );
      if (!client) {
        return { ok: false, error: 'Client account not found for selected email.' };
      }
      if (!input.items || input.items.length === 0) {
        return { ok: false, error: 'Add at least one line item.' };
      }
      const prefix = invoiceTemplateConfig.invoicePrefix || 'INV-';
      const invId = `${prefix}2026-${Math.floor(1000 + Math.random() * 8999)}`;
      const cleanedItems = input.items.map((it, idx) => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const unit = Math.max(0, Number(it.unitPriceUsd) || 0);
        return {
          ...it,
          id: it.id || `ITEM-${invId}-${idx + 1}`,
          description: it.description.trim() || 'Hosting Service Item',
          domainOrHost: it.domainOrHost.trim() || 'cpcloudhost.com',
          quantity: qty,
          unitPriceUsd: unit,
          lineTotalUsd: Number((qty * unit).toFixed(2)),
        };
      });
      const totals = calculateInvoiceTotals(
        cleanedItems,
        input.taxRatePercent,
        input.discountUsd
      );
      const first = cleanedItems[0];
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: PlatformInvoice = {
        id: invId,
        orderId: '',
        clientEmail: client.email.toLowerCase(),
        clientName: client.name,
        productType:
          first.productType === 'Custom Service' || first.productType === 'Setup / Add-on'
            ? 'cPanel Hosting'
            : first.productType,
        planName: first.description,
        domainOrHost: first.domainOrHost,
        billingCycle: first.billingCycle === 'One-Time' ? 'Yearly' : first.billingCycle,
        items: cleanedItems,
        subtotalUsd: totals.subtotalUsd,
        taxRatePercent: Math.max(0, Number(input.taxRatePercent) || 0),
        discountUsd: Math.max(0, Number(input.discountUsd) || 0),
        amountUsd: totals.totalUsd,
        issuedDate: input.issuedDate || new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate || new Date().toISOString().slice(0, 10),
        status: input.status,
        paymentMethod: input.paymentMethod.trim() || 'Invoice Pending',
        transactionRef: input.transactionRef?.trim() || undefined,
        paidAt: input.status === 'paid' ? nowUtc : undefined,
        notes: input.notes?.trim() || undefined,
      };
      setInvoices((prev) => [created, ...prev]);
      return { ok: true, invoice: created };
    },
    [isAdmin, users, invoiceTemplateConfig.invoicePrefix]
  );

  const saveInvoiceTemplateConfig = useCallback(
    (updates: Partial<InvoiceTemplateConfig>) => {
      if (!isAdmin) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setInvoiceTemplateConfig((prev) => ({
        ...prev,
        ...updates,
        updatedAtUtc: nowUtc,
      }));
    },
    [isAdmin]
  );

  const savePaymentMethod = useCallback(
    (
      methodId: string,
      updates: Partial<Omit<PaymentMethodConfig, 'id' | 'isSystem'>>
    ) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setPaymentMethods((prev) =>
        prev.map((m) =>
          m.id === methodId
            ? {
                ...m,
                ...updates,
                updatedAtUtc: nowUtc,
              }
            : m
        )
      );
      return { ok: true };
    },
    [isAdmin]
  );

  const createPaymentMethod = useCallback(
    (input: {
      name: string;
      kind?: PaymentGatewayKind;
      accountTitle: string;
      accountNumber: string;
      ibanOrRouting?: string;
      bankOrProviderName?: string;
      currencyHint?: string;
      instructions: string;
      requiresTransactionId?: boolean;
      autoActivate?: boolean;
      enabled?: boolean;
    }) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const cleanName = input.name.trim();
      if (!cleanName) {
        return { ok: false, error: 'Gateway name is required.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: PaymentMethodConfig = {
        id: `pm-custom-${Date.now()}`,
        kind: input.kind || 'custom',
        name: cleanName,
        enabled: input.enabled ?? true,
        isSystem: false,
        accountTitle: input.accountTitle.trim() || 'CPCloudHost Billing',
        accountNumber: input.accountNumber.trim(),
        ibanOrRouting: input.ibanOrRouting?.trim() || '',
        bankOrProviderName: input.bankOrProviderName?.trim() || cleanName,
        currencyHint: input.currencyHint?.trim() || 'USD / PKR',
        instructions: input.instructions.trim() || 'Submit payment reference after transfer.',
        requiresTransactionId: input.requiresTransactionId ?? true,
        autoActivate: input.autoActivate ?? false,
        sortOrder: paymentMethods.length + 1,
        updatedAtUtc: nowUtc,
      };
      setPaymentMethods((prev) => [...prev, created]);
      return { ok: true, method: created };
    },
    [isAdmin, paymentMethods.length]
  );

  const deletePaymentMethod = useCallback(
    (methodId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const target = paymentMethods.find((m) => m.id === methodId);
      if (!target) return { ok: false, error: 'Payment gateway not found.' };
      if (target.isSystem) {
        return { ok: false, error: 'Built-in gateways cannot be deleted; disable them instead.' };
      }
      setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
      return { ok: true };
    },
    [isAdmin, paymentMethods]
  );

  const togglePaymentMethod = useCallback(
    (methodId: string) => {
      if (!isAdmin) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setPaymentMethods((prev) =>
        prev.map((m) =>
          m.id === methodId ? { ...m, enabled: !m.enabled, updatedAtUtc: nowUtc } : m
        )
      );
    },
    [isAdmin]
  );

  const saveEmailTemplate = useCallback(
    (
      templateId: string,
      updates: Partial<Omit<EmailTemplateRecord, 'id' | 'isSystem' | 'key'>>
    ) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setEmailTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === templateId
            ? {
                ...tpl,
                ...updates,
                updatedAtUtc: nowUtc,
                updatedBy: currentUser?.name || 'Admin',
              }
            : tpl
        )
      );
      return { ok: true };
    },
    [isAdmin, currentUser]
  );

  const createEmailTemplate = useCallback(
    (input: {
      name: string;
      category: EmailTemplateRecord['category'];
      description: string;
      subject: string;
      preheader: string;
      heading: string;
      body: string;
      ctaLabel: string;
      ctaUrl: string;
      footerNote: string;
    }) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      if (!input.name.trim() || !input.subject.trim() || !input.body.trim()) {
        return { ok: false, error: 'Template name, subject, and body are required.' };
      }
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: EmailTemplateRecord = {
        id: `tpl-${slug}-${Date.now().toString(36)}`,
        key: slug || `custom-${Date.now()}`,
        name: input.name.trim(),
        category: input.category,
        description: input.description.trim() || 'Custom lifecycle notification template.',
        subject: input.subject.trim(),
        preheader: input.preheader.trim(),
        heading: input.heading.trim() || input.name.trim(),
        body: input.body.trim(),
        ctaLabel: input.ctaLabel.trim() || 'Open Client Portal',
        ctaUrl: input.ctaUrl.trim() || 'https://cpcloudhost.com/dashboard',
        footerNote: input.footerNote.trim() || 'CPCloudHost Automated Notifications',
        enabled: true,
        isSystem: false,
        variables: ['client_name', 'domain', 'invoice_id', 'amount', 'due_date'],
        updatedAtUtc: nowUtc,
        updatedBy: currentUser?.name || 'Admin',
      };
      setEmailTemplates((prev) => [created, ...prev]);
      return { ok: true, template: created };
    },
    [isAdmin, currentUser]
  );

  const deleteEmailTemplate = useCallback(
    (templateId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const target = emailTemplates.find((t) => t.id === templateId);
      if (!target) return { ok: false, error: 'Email template not found.' };
      if (target.isSystem) {
        return { ok: false, error: 'Built-in system email templates cannot be deleted.' };
      }
      setEmailTemplates((prev) => prev.filter((t) => t.id !== templateId));
      return { ok: true };
    },
    [isAdmin, emailTemplates]
  );

  const resetEmailTemplate = useCallback(
    (templateId: string) => {
      if (!isAdmin) return;
      const defaultTpl = INITIAL_EMAIL_TEMPLATES.find((d) => d.id === templateId);
      if (!defaultTpl) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setEmailTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? {
                ...defaultTpl,
                updatedAtUtc: nowUtc,
                updatedBy: currentUser?.name || 'Admin',
              }
            : t
        )
      );
    },
    [isAdmin, currentUser]
  );

  const submitAbuseComplaint = useCallback(
    (input: {
      ticketId?: string;
      category: string;
      categoryLabel: string;
      slaTarget: string;
      targetResource: string;
      reporterName: string;
      organization: string;
      reporterEmail: string;
      country: string;
      incidentUtc: string;
      evidenceDetails: string;
    }) => {
      const severity: AbuseSeverity = input.slaTarget.includes('P0') || input.slaTarget.includes('Immediate')
        ? 'P0 Critical'
        : input.slaTarget.includes('P2')
        ? 'P2 Legal Notice'
        : 'P1 High';

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      const generatedId =
        input.ticketId ||
        `ABUSE-2026-${Math.floor(100000 + Math.random() * 899999)}`;

      const record: AbuseComplaintRecord = {
        ticketId: generatedId,
        category: input.category,
        categoryLabel: input.categoryLabel,
        severity,
        slaTarget: input.slaTarget,
        targetResource: input.targetResource.trim(),
        reporterName: input.reporterName.trim(),
        organization: input.organization.trim() || 'Independent Reporter',
        reporterEmail: input.reporterEmail.trim().toLowerCase(),
        country: input.country.trim() || 'International',
        incidentUtc: input.incidentUtc.trim() || nowUtc,
        evidenceDetails: input.evidenceDetails.trim(),
        submittedAtUtc: nowUtc,
        status: 'open',
        moderatorNotes: 'Logged via Public Abuse Portal; awaiting Trust & Safety triage.',
      };
      setAbuseComplaints((prev) => [record, ...prev]);
      return record;
    },
    []
  );

  const moderateAbuseComplaint = useCallback(
    (
      ticketId: string,
      status: AbuseStatus,
      moderatorNotes: string,
      suspendMatchingOrders?: boolean
    ) => {
      if (!isAdmin) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const targetTicket = abuseComplaints.find((item) => item.ticketId === ticketId);
      const matchedTarget = targetTicket?.targetResource.toLowerCase() ?? '';

      setAbuseComplaints((prev) =>
        prev.map((item) => {
          if (item.ticketId !== ticketId) return item;
          return {
            ...item,
            status,
            moderatorNotes: moderatorNotes.trim() || item.moderatorNotes,
            moderatedBy: currentUser?.name || 'Administrator',
            updatedAtUtc: nowUtc,
          };
        })
      );

      if (suspendMatchingOrders && matchedTarget) {
        setOrders((prev) =>
          prev.map((ord) =>
            matchedTarget.includes(ord.domainOrHost.toLowerCase())
              ? {
                  ...ord,
                  status: 'suspended',
                  notes: `Suspended under Abuse Case ${ticketId}`,
                }
              : ord
          )
        );
      }
    },
    [isAdmin, currentUser, abuseComplaints]
  );

  const updateClientProfile = useCallback(
    (updates: { name: string; company: string; phone: string; country: string }) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required to update profile.' };
      }
      const cleanName = updates.name.trim();
      if (cleanName.length < 2) {
        return { ok: false, error: 'Full name must be at least 2 characters.' };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                name: cleanName,
                company: updates.company.trim() || u.company,
                phone: updates.phone.trim() || u.phone,
                country: updates.country.trim() || u.country,
              }
            : u
        )
      );
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: cleanName,
              country: updates.country.trim() || prev.country,
            }
          : null
      );
      return { ok: true };
    },
    [currentUser]
  );

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required.' };
      }
      if (newPassword.length < 8) {
        return { ok: false, error: 'New password must be at least 8 characters.' };
      }
      const targetUser = users.find(
        (u) => u.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (!targetUser || (targetUser.passwordSecret && targetUser.passwordSecret !== currentPassword)) {
        return { ok: false, error: 'Current password is incorrect.' };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.email.toLowerCase() === currentUser.email.toLowerCase()
            ? { ...u, passwordSecret: newPassword }
            : u
        )
      );
      appendLoginActivity({
        userEmail: currentUser.email,
        userName: currentUser.name,
        eventType: 'Password Changed by Admin',
        status: 'success',
        authMethod: 'Client Portal Security Settings',
        country: currentUser.country,
      });
      return { ok: true };
    },
    [currentUser, users, appendLoginActivity]
  );

  const domainContactAddresses = useMemo(() => {
    const emailLower = (currentUser?.email || 'guest@checkout').toLowerCase();
    return allDomainContacts.filter(
      (c) =>
        c.ownerEmail.toLowerCase() === emailLower ||
        (!currentUser && c.ownerEmail === 'guest@checkout')
    );
  }, [allDomainContacts, currentUser]);

  const saveDomainContactAddress = useCallback(
    (
      input: Omit<DomainContactAddress, 'id' | 'ownerEmail' | 'createdAtUtc'> & {
        id?: string;
      }
    ): { ok: boolean; error?: string; address?: DomainContactAddress } => {
      if (!input.firstName.trim() || !input.lastName.trim()) {
        return { ok: false, error: 'First and last name are required.' };
      }
      if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
        return { ok: false, error: 'Enter a valid WHOIS contact email address.' };
      }
      if (!input.phone.trim() || input.phone.trim().length < 6) {
        return { ok: false, error: 'Enter a valid telephone number.' };
      }
      if (!input.addressLine1.trim() || !input.city.trim() || !input.stateProvince.trim() || !input.countryCode.trim()) {
        return { ok: false, error: 'Street address, city, state/province, and country are required.' };
      }
      if (!input.postalCode.trim()) {
        return { ok: false, error: 'Postal / ZIP code is required.' };
      }

      const ownerEmail = (currentUser?.email || 'guest@checkout').toLowerCase();
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const existingForUser = allDomainContacts.filter(
        (c) => c.ownerEmail.toLowerCase() === ownerEmail
      );
      const shouldBeDefault = Boolean(input.isDefault) || existingForUser.length === 0;

      const record: DomainContactAddress = {
        id: input.id || `ADDR-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
        ownerEmail,
        label: input.label.trim() || `${input.city.trim()} (${input.countryCode})`,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        organization: input.organization?.trim() || undefined,
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || undefined,
        countryCode: input.countryCode.trim().toUpperCase(),
        countryName: input.countryName.trim(),
        stateProvince: input.stateProvince.trim(),
        city: input.city.trim(),
        postalCode: input.postalCode.trim(),
        isDefault: shouldBeDefault,
        createdAtUtc: nowUtc,
      };

      setAllDomainContacts((prev) => {
        const cleaned = shouldBeDefault
          ? prev.map((c) =>
              c.ownerEmail.toLowerCase() === ownerEmail ? { ...c, isDefault: false } : c
            )
          : prev;
        const existsIdx = cleaned.findIndex((c) => c.id === record.id);
        if (existsIdx >= 0) {
          return cleaned.map((c, idx) => (idx === existsIdx ? record : c));
        }
        return [record, ...cleaned];
      });

      return { ok: true, address: record };
    },
    [allDomainContacts, currentUser]
  );

  const deleteDomainContactAddress = useCallback(
    (addressId: string) => {
      const ownerEmail = (currentUser?.email || 'guest@checkout').toLowerCase();
      setAllDomainContacts((prev) => {
        const filtered = prev.filter(
          (c) =>
            c.id !== addressId ||
            (c.ownerEmail.toLowerCase() !== ownerEmail && !isAdmin)
        );
        const remainingForOwner = filtered.filter(
          (c) => c.ownerEmail.toLowerCase() === ownerEmail
        );
        if (remainingForOwner.length > 0 && !remainingForOwner.some((c) => c.isDefault)) {
          const firstId = remainingForOwner[0].id;
          return filtered.map((c) =>
            c.id === firstId ? { ...c, isDefault: true } : c
          );
        }
        return filtered;
      });
    },
    [currentUser, isAdmin]
  );

  const setDefaultDomainContactAddress = useCallback(
    (addressId: string) => {
      const ownerEmail = (currentUser?.email || 'guest@checkout').toLowerCase();
      setAllDomainContacts((prev) =>
        prev.map((c) =>
          c.ownerEmail.toLowerCase() === ownerEmail
            ? { ...c, isDefault: c.id === addressId }
            : c
        )
      );
    },
    [currentUser]
  );

  const updateClientOrderSettings = useCallback(
    (
      orderId: string,
      updates: Partial<
        Pick<
          PlatformOrder,
          'autoRenew' | 'nameservers' | 'registrarLock' | 'whoisPrivacy' | 'status' | 'notes'
        >
      >
    ) => {
      if (!currentUser) return;
      const todayIso = getTodayIsoUtc();
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const ownsOrder =
            ord.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
          if (!ownsOrder) return ord;
          if (ord.status === 'expired') return ord;
          const regIso = parseIsoDateOnly(ord.createdAt);
          const daysElapsed = Math.max(0, diffDaysIso(regIso, todayIso));
          const safeRegistrarLock =
            updates.registrarLock === false && daysElapsed < ICANN_TRANSFER_LOCK_DAYS
              ? true
              : updates.registrarLock !== undefined
                ? updates.registrarLock
                : ord.registrarLock;
          return { ...ord, ...updates, registrarLock: safeRegistrarLock };
        })
      );
    },
    [currentUser, isAdmin]
  );

  const updateDomainTransferLock = useCallback(
    (orderId: string, locked: boolean): { ok: boolean; error?: string } => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Domain order not found.' };
      }
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) {
        return { ok: false, error: 'Permission denied.' };
      }
      const todayIso = getTodayIsoUtc();
      const dueIso = target.nextDueDate ? parseIsoDateOnly(target.nextDueDate) : '';
      if (target.status === 'expired' || (dueIso && diffDaysIso(todayIso, dueIso) < 0)) {
        return {
          ok: false,
          error: 'Domain management is locked because the domain has expired. Renew first.',
        };
      }
      const regIso = parseIsoDateOnly(target.createdAt);
      const daysElapsed = Math.max(0, diffDaysIso(regIso, todayIso));
      if (!locked && daysElapsed < ICANN_TRANSFER_LOCK_DAYS) {
        const remaining = ICANN_TRANSFER_LOCK_DAYS - daysElapsed;
        return {
          ok: false,
          error: `Per ICANN 60-day transfer policy, ${target.domainOrHost} remains locked for ${remaining} more ${remaining === 1 ? 'day' : 'days'}.`,
        };
      }
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, registrarLock: locked } : ord
        )
      );
      return { ok: true };
    },
    [currentUser, isAdmin, orders]
  );

  const regenerateDomainEppCode = useCallback(
    (
      orderId: string
    ): { ok: boolean; error?: string; eppCode?: string } => {
      if (!currentUser) return { ok: false, error: 'Sign in required.' };
      const target = orders.find((o) => o.id === orderId);
      if (!target) return { ok: false, error: 'Domain order not found.' };
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) return { ok: false, error: 'Permission denied.' };
      const todayIso = getTodayIsoUtc();
      const dueIso = target.nextDueDate ? parseIsoDateOnly(target.nextDueDate) : '';
      if (target.status === 'expired' || (dueIso && diffDaysIso(todayIso, dueIso) < 0)) {
        return {
          ok: false,
          error: 'Domain is expired. Renew to unlock EPP authorization code.',
        };
      }
      const regIso = parseIsoDateOnly(target.createdAt);
      const daysElapsed = Math.max(0, diffDaysIso(regIso, todayIso));
      if (daysElapsed < ICANN_TRANSFER_LOCK_DAYS) {
        return {
          ok: false,
          error: 'EPP authorization code becomes available after the 60-day ICANN lock period.',
        };
      }
      const nextCode = generateFreshEppCode(orderId);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, eppCode: nextCode } : ord))
      );
      return { ok: true, eppCode: nextCode };
    },
    [currentUser, isAdmin, orders]
  );

  const updateDomainDnsRecords = useCallback(
    (
      orderId: string,
      records: DomainDnsRecord[]
    ): { ok: boolean; error?: string } => {
      if (!currentUser) return { ok: false, error: 'Sign in required.' };
      const target = orders.find((o) => o.id === orderId);
      if (!target) return { ok: false, error: 'Domain order not found.' };
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) return { ok: false, error: 'Permission denied.' };
      if (target.status === 'expired') {
        return { ok: false, error: 'Renew this domain before modifying DNS zone records.' };
      }
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, dnsRecords: records } : ord))
      );
      return { ok: true };
    },
    [currentUser, isAdmin, orders]
  );

  const updateDomainWhoisContact = useCallback(
    (
      orderId: string,
      contact: DomainContactAddress
    ): { ok: boolean; error?: string } => {
      if (!currentUser) return { ok: false, error: 'Sign in required.' };
      const target = orders.find((o) => o.id === orderId);
      if (!target) return { ok: false, error: 'Domain order not found.' };
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) return { ok: false, error: 'Permission denied.' };
      if (target.status === 'expired') {
        return { ok: false, error: 'Renew this domain before updating WHOIS registrant details.' };
      }
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                whoisContact: contact,
                country: contact.countryName || ord.country,
              }
            : ord
        )
      );
      return { ok: true };
    },
    [currentUser, isAdmin, orders]
  );

  const approveDomainRegistrationAndSendVerify = useCallback(
    (orderId: string) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Domain order record not found.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const token =
        target.domainVerificationToken ||
        `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
      const verifyUrl = `${origin}/verify-domain?orderId=${encodeURIComponent(target.id)}&token=${encodeURIComponent(token)}`;
      const nextVerifyStatus: PlatformOrder['domainVerificationStatus'] =
        target.domainVerificationStatus === 'verified'
          ? 'verified'
          : 'pending_contact_verification';

      const computedDueDate =
        target.nextDueDate && target.nextDueDate.trim()
          ? target.nextDueDate
          : computeDefaultNextDueDate(
              parseIsoDateOnly(target.createdAt) || getTodayIsoUtc(),
              target.billingCycle
            );

      const approvedOrder: PlatformOrder = {
        ...target,
        status: 'active',
        nextDueDate: computedDueDate,
        invoicePaid:
          invoiceTemplateConfig.autoMarkPaidOnApproval !== false
            ? true
            : target.invoicePaid,
        domainVerificationToken: token,
        domainVerificationStatus: nextVerifyStatus,
        notes: `${target.productType} approved by ${currentUser?.name || 'Admin'} (${nowUtc}). WHOIS verification link issued.`,
      };

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? approvedOrder : ord))
      );

      if (invoiceTemplateConfig.autoGenerateOnApproval !== false) {
        upsertInvoiceOnOrderApproval(
          approvedOrder,
          `${target.productType} approved & verification dispatched (${nowUtc}).`
        );
      }

      if (
        typeof window !== 'undefined' &&
        systemSettings.smtp?.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password
      ) {
        const nsPair = approvedOrder.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
        const whoisStr = approvedOrder.whoisContact
          ? `${approvedOrder.whoisContact.firstName} ${approvedOrder.whoisContact.lastName}${approvedOrder.whoisContact.organization ? ` · ${approvedOrder.whoisContact.organization}` : ''} · ${approvedOrder.whoisContact.addressLine1}, ${approvedOrder.whoisContact.city}, ${approvedOrder.whoisContact.countryName} · ${approvedOrder.whoisContact.phone}`
          : `${approvedOrder.clientName} (${approvedOrder.clientEmail})`;

        const mergeVars: Record<string, string> = {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: approvedOrder.clientName,
          client_email: approvedOrder.clientEmail,
          order_id: approvedOrder.id,
          domain: approvedOrder.domainOrHost,
          billing_cycle: approvedOrder.billingCycle,
          amount: `$${approvedOrder.amountUsd.toFixed(2)} USD`,
          start_date: approvedOrder.createdAt.slice(0, 10),
          due_date: approvedOrder.nextDueDate || '',
          nameserver_1: nsPair[0],
          nameserver_2: nsPair[1],
          whois_summary: whoisStr,
          verify_domain_url: verifyUrl,
          updated_at: nowUtc,
        };

        const keysToSend =
          nextVerifyStatus === 'verified'
            ? ['domain-registration']
            : ['domain-registration', 'domain-contact-verification'];

        keysToSend.forEach((tplKey) => {
          const tpl =
            emailTemplates.find((t) => t.key === tplKey || t.id === tplKey) ??
            INITIAL_EMAIL_TEMPLATES.find((t) => t.key === tplKey);
          if (!tpl || !tpl.enabled) return;
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: approvedOrder.clientEmail,
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge:
                tplKey === 'domain-contact-verification'
                  ? 'WHOIS VERIFICATION'
                  : 'DOMAIN REGISTRATION',
              subject: renderEmailMergeText(tpl.subject, mergeVars),
              preheader: renderEmailMergeText(tpl.preheader, mergeVars),
              heading: renderEmailMergeText(tpl.heading, mergeVars),
              body: renderEmailMergeText(tpl.body, mergeVars),
              ctaLabel: renderEmailMergeText(tpl.ctaLabel, mergeVars),
              ctaUrl: renderEmailMergeText(tpl.ctaUrl, mergeVars),
              footerNote: renderEmailMergeText(tpl.footerNote, mergeVars),
            }),
          }).catch(() => undefined);
        });
      }

      return { ok: true, verifyUrl, token };
    },
    [
      isAdmin,
      orders,
      currentUser,
      invoiceTemplateConfig,
      upsertInvoiceOnOrderApproval,
      systemSettings.smtp,
      emailTemplates,
    ]
  );

  const verifyDomainContactByToken = useCallback(
    (orderId: string, token: string) => {
      const target =
        ordersRef.current.find((o) => o.id === orderId) ??
        orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Domain registration order not found.' };
      }
      if (target.status === 'pending' && target.domainVerificationStatus === 'pending_admin_approval') {
        return {
          ok: false,
          error: 'This domain order is still awaiting admin team approval before WHOIS verification.',
        };
      }
      if (
        target.domainVerificationToken &&
        token.trim().toUpperCase() !== target.domainVerificationToken.trim().toUpperCase()
      ) {
        return {
          ok: false,
          error: 'Invalid or expired domain verification token.',
        };
      }

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const updated: PlatformOrder = {
        ...target,
        status: target.status === 'pending' ? 'active' : target.status,
        domainVerificationStatus: 'verified',
        domainContactVerifiedAt: target.domainContactVerifiedAt || nowUtc,
      };

      ordersRef.current = ordersRef.current.map((ord) =>
        ord.id === orderId ? updated : ord
      );
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? updated : ord))
      );

      if (target.domainVerificationStatus !== 'verified') {
        appendLoginActivity({
          userEmail: target.clientEmail,
          userName: target.clientName,
          eventType: 'WHOIS Contact Verified',
          status: 'success',
          authMethod: `Domain ${target.domainOrHost} (${target.id})`,
          country: target.country,
        });

        if (
          typeof window !== 'undefined' &&
          systemSettings.smtp?.enabled &&
          systemSettings.smtp.host.trim() &&
          systemSettings.smtp.username.trim() &&
          systemSettings.smtp.password
        ) {
          const tpl =
            emailTemplates.find(
              (t) => t.key === 'domain-contact-verified' || t.id === 'domain-contact-verified'
            ) ?? INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'domain-contact-verified');
          if (tpl && tpl.enabled) {
            const whoisStr = target.whoisContact
              ? `${target.whoisContact.firstName} ${target.whoisContact.lastName}${target.whoisContact.organization ? ` · ${target.whoisContact.organization}` : ''} · ${target.whoisContact.addressLine1}, ${target.whoisContact.city}, ${target.whoisContact.countryName} · ${target.whoisContact.phone}`
              : `${target.clientName} (${target.clientEmail})`;
            const mergeVars: Record<string, string> = {
              company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
              client_name: target.clientName,
              domain: target.domainOrHost,
              order_id: target.id,
              whois_summary: whoisStr,
              updated_at: nowUtc,
            };
            void fetch('/api/system/send-templated-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                smtp: systemSettings.smtp,
                toEmail: target.clientEmail,
                companyName: invoiceTemplateConfig.companyName,
                companyEmail: invoiceTemplateConfig.companyEmail,
                companyWebsite: invoiceTemplateConfig.companyWebsite,
                accentColor: invoiceTemplateConfig.accentColor,
                headerBadge: 'DOMAIN VERIFIED',
                subject: renderEmailMergeText(tpl.subject, mergeVars),
                preheader: renderEmailMergeText(tpl.preheader, mergeVars),
                heading: renderEmailMergeText(tpl.heading, mergeVars),
                body: renderEmailMergeText(tpl.body, mergeVars),
                ctaLabel: renderEmailMergeText(tpl.ctaLabel, mergeVars),
                ctaUrl: renderEmailMergeText(tpl.ctaUrl, mergeVars),
                footerNote: renderEmailMergeText(tpl.footerNote, mergeVars),
              }),
            }).catch(() => undefined);
          }
        }
      }

      return { ok: true, order: updated };
    },
    [orders, appendLoginActivity, systemSettings.smtp, emailTemplates, invoiceTemplateConfig]
  );

  const resendDomainVerificationEmail = useCallback(
    async (orderId: string) => {
      const target =
        ordersRef.current.find((o) => o.id === orderId) ??
        orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Domain order not found.' };
      }
      if (!currentUser) {
        return { ok: false, error: 'Sign in required.' };
      }
      const allowed =
        isAdmin || target.clientEmail.toLowerCase() === currentUser.email.toLowerCase();
      if (!allowed) {
        return { ok: false, error: 'Permission denied.' };
      }

      const token =
        target.domainVerificationToken ||
        `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      if (!target.domainVerificationToken) {
        ordersRef.current = ordersRef.current.map((ord) =>
          ord.id === orderId ? { ...ord, domainVerificationToken: token } : ord
        );
        setOrders((prev) =>
          prev.map((ord) =>
            ord.id === orderId ? { ...ord, domainVerificationToken: token } : ord
          )
        );
      }

      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
      const verifyUrl = `${origin}/verify-domain?orderId=${encodeURIComponent(
        target.id
      )}&token=${encodeURIComponent(token)}`;

      const smtp = systemSettings.smtp;
      if (
        !smtp?.enabled ||
        !smtp.host.trim() ||
        !smtp.username.trim() ||
        !smtp.password
      ) {
        return { ok: true, verifyUrl, emailSent: false };
      }

      const tpl =
        emailTemplates.find(
          (t) =>
            t.key === 'domain-contact-verification' ||
            t.id === 'domain-contact-verification'
        ) ??
        INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'domain-contact-verification');
      if (!tpl || !tpl.enabled) {
        return { ok: true, verifyUrl, emailSent: false };
      }

      const nsPair = target.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
      const whoisStr = target.whoisContact
        ? `${target.whoisContact.firstName} ${target.whoisContact.lastName}${
            target.whoisContact.organization
              ? ` · ${target.whoisContact.organization}`
              : ''
          } · ${target.whoisContact.addressLine1}, ${target.whoisContact.city}, ${
            target.whoisContact.countryName
          } · ${target.whoisContact.phone}`
        : `${target.clientName} (${target.clientEmail})`;

      const mergeVars: Record<string, string> = {
        company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
        client_name: target.clientName,
        domain: target.domainOrHost,
        order_id: target.id,
        whois_summary: whoisStr,
        nameserver_1: nsPair[0] || 'ns1.cpcloudhost.com',
        nameserver_2: nsPair[1] || 'ns2.cpcloudhost.com',
        verify_domain_url: verifyUrl,
      };

      try {
        const res = await fetch('/api/system/send-templated-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp,
            toEmail: target.clientEmail,
            companyName: invoiceTemplateConfig.companyName,
            companyEmail: invoiceTemplateConfig.companyEmail,
            companyWebsite: invoiceTemplateConfig.companyWebsite,
            accentColor: invoiceTemplateConfig.accentColor,
            headerBadge: 'WHOIS VERIFICATION',
            subject: renderEmailMergeText(tpl.subject, mergeVars),
            preheader: renderEmailMergeText(tpl.preheader, mergeVars),
            heading: renderEmailMergeText(tpl.heading, mergeVars),
            body: renderEmailMergeText(tpl.body, mergeVars),
            ctaLabel: renderEmailMergeText(tpl.ctaLabel, mergeVars),
            ctaUrl: renderEmailMergeText(tpl.ctaUrl, mergeVars),
            footerNote: renderEmailMergeText(tpl.footerNote, mergeVars),
          }),
        });
        const data = (await res.json()) as { ok?: boolean };
        return { ok: true, verifyUrl, emailSent: Boolean(res.ok && data.ok) };
      } catch {
        return { ok: true, verifyUrl, emailSent: false };
      }
    },
    [orders, currentUser, isAdmin, invoiceTemplateConfig, systemSettings.smtp, emailTemplates]
  );

  const requestDomainNameserverChange = useCallback(
    (orderId: string, ns1OrList: string | string[], ns2?: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Domain order not found.' };
      }
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) {
        return { ok: false, error: 'Permission denied.' };
      }
      if (target.status === 'expired' || target.status === 'cancelled' || target.status === 'suspended') {
        return { ok: false, error: 'Domain management is locked for this status.' };
      }
      if (
        target.status === 'pending' ||
        target.domainVerificationStatus === 'pending_contact_verification'
      ) {
        return {
          ok: false,
          error: 'Complete admin approval & WHOIS contact verification before changing nameservers.',
        };
      }

      const rawList = Array.isArray(ns1OrList)
        ? ns1OrList
        : [ns1OrList, ns2 || ''];
      const cleanedList = rawList.map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 4);
      const nsRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
      if (cleanedList.length < 2 || cleanedList.some((ns) => !nsRegex.test(ns))) {
        return {
          ok: false,
          error: 'Enter valid authoritative hostnames for at least NS1 and NS2 (e.g., ns1.cpcloudhost.com).',
        };
      }
      const clean1 = cleanedList[0];
      const clean2 = cleanedList[1];

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                pendingNameservers: cleanedList,
                nameserverUpdateStatus: 'pending_update',
                nameserverRequestedAt: nowUtc,
              }
            : ord
        )
      );

      if (
        typeof window !== 'undefined' &&
        systemSettings.smtp?.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password
      ) {
        const origin = window.location?.origin || invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
        const clientTpl =
          emailTemplates.find(
            (t) => t.key === 'domain-nameserver-pending' || t.id === 'domain-nameserver-pending'
          ) ?? INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'domain-nameserver-pending');
        const vars: Record<string, string> = {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: target.clientName,
          client_email: target.clientEmail,
          domain: target.domainOrHost,
          order_id: target.id,
          nameserver_1: clean1,
          nameserver_2: clean2,
          nameserver_3: cleanedList[2] || '',
          nameserver_4: cleanedList[3] || '',
          eta_window: '1 to 3 hours',
          updated_at: nowUtc,
          action_url: `${origin}/admin/wp`,
        };

        if (clientTpl && clientTpl.enabled) {
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: target.clientEmail,
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge: 'DNS DELEGATION',
              subject: renderEmailMergeText(clientTpl.subject, vars),
              preheader: renderEmailMergeText(clientTpl.preheader, vars),
              heading: renderEmailMergeText(clientTpl.heading, vars),
              body: renderEmailMergeText(clientTpl.body, vars),
              ctaLabel: renderEmailMergeText(clientTpl.ctaLabel, vars),
              ctaUrl: renderEmailMergeText(clientTpl.ctaUrl, vars),
              footerNote: renderEmailMergeText(clientTpl.footerNote, vars),
            }),
          }).catch(() => undefined);
        }

        if (
          systemSettings.adminAlerts?.enabled &&
          systemSettings.adminAlerts.notifyNameserverRequest &&
          systemSettings.adminAlerts.alertEmail.trim()
        ) {
          const alertTpl =
            emailTemplates.find((t) => t.key === 'admin-system-alert' || t.id === 'admin-system-alert') ??
            INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'admin-system-alert');
          if (alertTpl && alertTpl.enabled) {
            const alertVars: Record<string, string> = {
              ...vars,
              event_title: `Nameserver Change Requested: ${target.domainOrHost}`,
              event_details: `Requested: ${cleanedList.join(', ')} (Previous: ${(target.nameservers || []).join(', ')}). Click Update & Notify Client inside Admin Domains.`,
            };
            void fetch('/api/system/send-templated-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                smtp: systemSettings.smtp,
                toEmail: systemSettings.adminAlerts.alertEmail.trim(),
                companyName: invoiceTemplateConfig.companyName,
                companyEmail: invoiceTemplateConfig.companyEmail,
                companyWebsite: invoiceTemplateConfig.companyWebsite,
                accentColor: invoiceTemplateConfig.accentColor,
                headerBadge: 'ADMIN OPERATIONS ALERT',
                subject: renderEmailMergeText(alertTpl.subject, alertVars),
                preheader: renderEmailMergeText(alertTpl.preheader, alertVars),
                heading: renderEmailMergeText(alertTpl.heading, alertVars),
                body: renderEmailMergeText(alertTpl.body, alertVars),
                ctaLabel: renderEmailMergeText(alertTpl.ctaLabel, alertVars),
                ctaUrl: renderEmailMergeText(alertTpl.ctaUrl, alertVars),
                footerNote: renderEmailMergeText(alertTpl.footerNote, alertVars),
              }),
            }).catch(() => undefined);
          }
        }
      }

      return { ok: true };
    },
    [currentUser, isAdmin, orders, systemSettings, emailTemplates, invoiceTemplateConfig]
  );

  const adminApplyNameserverChange = useCallback(
    (orderId: string) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Domain order record not found.' };
      }
      const nextList: string[] = target.pendingNameservers?.length
        ? target.pendingNameservers
        : target.nameservers?.length
          ? target.nameservers
          : ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                nameservers: nextList,
                pendingNameservers: undefined,
                nameserverUpdateStatus: 'updated',
                nameserverUpdatedAt: nowUtc,
              }
            : ord
        )
      );

      dispatchTemplatedOrderEmail(
        'domain-nameserver-updated',
        target.clientEmail,
        {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: target.clientName,
          client_email: target.clientEmail,
          domain: target.domainOrHost,
          order_id: target.id,
          nameserver_1: nextList[0] || 'ns1.cpcloudhost.com',
          nameserver_2: nextList[1] || 'ns2.cpcloudhost.com',
          nameserver_3: nextList[2] || '',
          nameserver_4: nextList[3] || '',
          updated_at: nowUtc,
        },
        'NAMESERVER LIVE'
      );

      return { ok: true };
    },
    [isAdmin, orders, invoiceTemplateConfig, dispatchTemplatedOrderEmail]
  );

  const adminStartDomainTransfer = useCallback(
    (orderId: string) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target || target.productType !== 'Domain Transfer') {
        return { ok: false, error: 'Domain transfer order not found.' };
      }
      const todayIso = getTodayIsoUtc();
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const nsPair = target.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                status: 'pending',
                transferStatus: 'in_progress',
                transferStartedAt: ord.transferStartedAt || todayIso,
                notes: `Transfer approved by ${currentUser?.name || 'Admin'} (${nowUtc}). 7-day transfer window active until client approves & notifies or Day 7 elapses.`,
              }
            : ord
        )
      );

      dispatchTemplatedOrderEmail(
        'domain-transfer-initiated',
        target.clientEmail,
        {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: target.clientName,
          domain: target.domainOrHost,
          order_id: target.id,
          nameserver_1: nsPair[0] || 'ns1.cpcloudhost.com',
          nameserver_2: nsPair[1] || 'ns2.cpcloudhost.com',
        },
        'TRANSFER IN PROGRESS'
      );

      return { ok: true };
    },
    [isAdmin, orders, currentUser, invoiceTemplateConfig, dispatchTemplatedOrderEmail]
  );

  const clientNotifyDomainTransferApproved = useCallback(
    (orderId: string) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target || target.productType !== 'Domain Transfer') {
        return { ok: false, error: 'Domain transfer order not found.' };
      }
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) {
        return { ok: false, error: 'Permission denied.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                transferStatus: 'client_notified',
                transferClientNotifiedAt: nowUtc,
                notes: `Client confirmed registrar transfer approval & notified admin (${nowUtc}).`,
              }
            : ord
        )
      );

      dispatchTemplatedOrderEmail(
        'domain-transfer-client-notified',
        target.clientEmail,
        {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: target.clientName,
          domain: target.domainOrHost,
          order_id: target.id,
        },
        'REGISTRAR APPROVAL LOGGED'
      );

      if (
        systemSettings.adminAlerts?.enabled &&
        systemSettings.adminAlerts.notifyDomainEvents &&
        systemSettings.adminAlerts.alertEmail.trim()
      ) {
        const origin =
          typeof window !== 'undefined'
            ? window.location.origin
            : invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
        dispatchTemplatedOrderEmail(
          'admin-system-alert',
          systemSettings.adminAlerts.alertEmail.trim(),
          {
            company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
            event_title: `Transfer Client Notified: ${target.domainOrHost}`,
            client_name: target.clientName,
            client_email: target.clientEmail,
            domain: target.domainOrHost,
            order_id: target.id,
            event_details: `${target.clientName} confirmed registrar approval for ${target.domainOrHost}. Accept transfer inside Admin -> Domains to complete handover & send confirmation email.`,
            updated_at: nowUtc,
            action_url: `${origin}/admin/wp`,
          },
          'ADMIN TRANSFER NOTIFY'
        );
      }

      return { ok: true };
    },
    [currentUser, isAdmin, orders, invoiceTemplateConfig, systemSettings.adminAlerts, dispatchTemplatedOrderEmail]
  );

  const adminCompleteDomainTransfer = useCallback(
    (orderId: string, viaSevenDayAllow?: boolean) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target || target.productType !== 'Domain Transfer') {
        return { ok: false, error: 'Domain transfer order not found.' };
      }
      const todayIso = getTodayIsoUtc();
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const updatedDue = addYearsToIso(todayIso, 1);
      const nsPair = target.nameservers || ['ns1.cpcloudhost.com', 'ns2.cpcloudhost.com'];
      const note = viaSevenDayAllow
        ? `7-day ICANN transfer window elapsed — Manage unlocked & transfer finalized by ${currentUser?.name || 'Admin'} (${nowUtc}).`
        : `Domain transfer accepted & completed by ${currentUser?.name || 'Admin'} (${nowUtc}).`;

      const completedOrder: PlatformOrder = {
        ...target,
        status: 'active',
        transferStatus: 'completed',
        transferCompletedAt: nowUtc,
        nextDueDate: updatedDue,
        invoicePaid: true,
        domainVerificationStatus: 'verified',
        notes: note,
      };

      ordersRef.current = ordersRef.current.map((ord) =>
        ord.id === orderId ? completedOrder : ord
      );
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? completedOrder : ord))
      );

      if (invoiceTemplateConfig.autoGenerateOnApproval !== false) {
        upsertInvoiceOnOrderApproval(completedOrder, note);
      }

      dispatchTemplatedOrderEmail(
        'domain-transfer',
        completedOrder.clientEmail,
        {
          company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
          client_name: completedOrder.clientName,
          domain: completedOrder.domainOrHost,
          order_id: completedOrder.id,
          start_date: todayIso,
          due_date: updatedDue,
          nameserver_1: nsPair[0] || 'ns1.cpcloudhost.com',
          nameserver_2: nsPair[1] || 'ns2.cpcloudhost.com',
        },
        'DOMAIN TRANSFER SUCCESSFUL'
      );

      return { ok: true };
    },
    [
      isAdmin,
      orders,
      currentUser,
      invoiceTemplateConfig,
      upsertInvoiceOnOrderApproval,
      dispatchTemplatedOrderEmail,
    ]
  );

  const payClientOrderInvoice = useCallback(
    (
      orderOrInvoiceId: string,
      paymentMethod: string,
      options?: { transactionRef?: string; paymentDetailsNote?: string }
    ): { status: InvoiceStatus } | void => {
      if (!currentUser) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const todayIso = getTodayIsoUtc();
      const matchedGateway = paymentMethods.find(
        (m) =>
          m.name.toLowerCase() === paymentMethod.toLowerCase() ||
          m.id === paymentMethod
      );
      const isInstantGateway = matchedGateway ? matchedGateway.autoActivate : true;
      const nextStatus: InvoiceStatus = isInstantGateway ? 'paid' : 'pending';
      const cleanTxRef = options?.transactionRef?.trim() || undefined;
      const cleanPaymentNote = options?.paymentDetailsNote?.trim() || undefined;

      const targetInvoice = invoices.find(
        (inv) => inv.id === orderOrInvoiceId || inv.orderId === orderOrInvoiceId
      );
      const linkedOrderId = targetInvoice?.orderId || orderOrInvoiceId;

      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== orderOrInvoiceId && inv.orderId !== orderOrInvoiceId) {
            return inv;
          }
          const ownsInvoice =
            inv.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
          if (!ownsInvoice) return inv;
          return {
            ...inv,
            status: nextStatus,
            paymentMethod: matchedGateway?.name || paymentMethod || inv.paymentMethod,
            transactionRef: cleanTxRef || inv.transactionRef,
            paymentDetailsNote: cleanPaymentNote || inv.paymentDetailsNote,
            paymentSubmittedAt: nowUtc,
            paidAt: nextStatus === 'paid' ? nowUtc : inv.paidAt,
          };
        })
      );

      if (linkedOrderId) {
        const linkedBefore = orders.find((o) => o.id === linkedOrderId);
        let reactivatedFromSuspended = false;
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id !== linkedOrderId) return ord;
            const ownsOrder =
              ord.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
            if (!ownsOrder) return ord;
            const requiresProvisioningApproval =
              ord.status === 'pending' &&
              (ord.productType === 'Shared Cloud' ||
                ord.productType === 'cPanel Hosting' ||
                ord.productType === 'Domain Registration' ||
                ord.productType === 'Domain Transfer');
            const isReactivatingExpired =
              nextStatus === 'paid' &&
              !requiresProvisioningApproval &&
              (ord.status === 'expired' ||
                ord.status === 'suspended' ||
                (ord.nextDueDate ? diffDaysIso(todayIso, parseIsoDateOnly(ord.nextDueDate)) < 0 : false));
            if (isReactivatingExpired && ord.status === 'suspended') {
              reactivatedFromSuspended = true;
            }
            const renewedNextDue = isReactivatingExpired
              ? computeDefaultNextDueDate(todayIso, ord.billingCycle)
              : ord.nextDueDate;
            return {
              ...ord,
              invoicePaid: nextStatus === 'paid',
              nextDueDate: renewedNextDue,
              status:
                nextStatus === 'paid' &&
                !requiresProvisioningApproval &&
                (ord.status === 'pending' || ord.status === 'expired' || ord.status === 'suspended')
                  ? 'active'
                  : ord.status,
              paymentMethod: matchedGateway?.name || paymentMethod || ord.paymentMethod,
              transactionRef: cleanTxRef || ord.transactionRef,
              paymentDetailsNote: cleanPaymentNote || ord.paymentDetailsNote,
              paymentSubmittedAt: nowUtc,
              notes:
                nextStatus === 'paid'
                  ? `Invoice paid via ${matchedGateway?.name || paymentMethod}${cleanTxRef ? ` · TID: ${cleanTxRef}` : ''}${requiresProvisioningApproval ? ' · Awaiting Admin Provisioning Approval' : isReactivatingExpired ? ` · Renewed until ${renewedNextDue}` : ''}`
                  : `Payment details submitted (${matchedGateway?.name || paymentMethod}${cleanTxRef ? ` · TID: ${cleanTxRef}` : ''}) — Pending verification`,
            };
          })
        );
        if (linkedBefore && nextStatus === 'paid' && (reactivatedFromSuspended || linkedBefore.status === 'suspended')) {
          syncWhmAccountState(linkedBefore, 'unsuspend', `Invoice settled via ${matchedGateway?.name || paymentMethod}`);
        }
      }

      return { status: nextStatus };
    },
    [currentUser, isAdmin, paymentMethods, invoices, orders, syncWhmAccountState]
  );

  const requestOrderCancellation = useCallback(
    (orderId: string, input: { type: CancellationType; reason: string }) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required to submit a cancellation request.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Service order not found.' };
      }
      const ownsOrder =
        target.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsOrder) {
        return { ok: false, error: 'Permission denied for this service.' };
      }
      if (target.status === 'cancelled') {
        return { ok: false, error: 'This service is already cancelled.' };
      }
      const cleanReason = input.reason.trim();
      if (cleanReason.length < 5) {
        return { ok: false, error: 'Please provide a brief cancellation reason (at least 5 characters).' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                autoRenew: false,
                cancellationStatus: 'requested',
                cancellationType: input.type,
                cancellationReason: cleanReason,
                cancellationRequestedAt: nowUtc,
                notes: `Client cancellation requested (${input.type === 'immediate' ? 'Immediate' : 'End of Billing Period'}): ${cleanReason}`,
              }
            : ord
        )
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.orderId === orderId
            ? {
                ...inv,
                cancellationStatus: 'requested',
                cancellationType: input.type,
                cancellationReason: cleanReason,
                cancellationRequestedAt: nowUtc,
              }
            : inv
        )
      );

      return { ok: true };
    },
    [currentUser, isAdmin, orders]
  );

  const adminHandleCancellation = useCallback(
    (
      orderId: string,
      decision: 'approved' | 'completed' | 'rejected',
      adminNote?: string
    ) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const target = orders.find((o) => o.id === orderId);
      if (!target) {
        return { ok: false, error: 'Order record not found.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const cleanNote =
        adminNote?.trim() ||
        (decision === 'completed'
          ? `Cancellation completed by ${currentUser?.name || 'Admin'}`
          : decision === 'approved'
            ? `Cancellation scheduled/approved by ${currentUser?.name || 'Admin'}`
            : `Cancellation request declined by ${currentUser?.name || 'Admin'}`);

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                status: decision === 'completed' ? 'cancelled' : ord.status,
                autoRenew: decision === 'rejected' ? ord.autoRenew : false,
                cancellationStatus: decision,
                cancellationReviewedAt: nowUtc,
                cancellationAdminNote: cleanNote,
                notes: cleanNote,
              }
            : ord
        )
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.orderId === orderId
            ? {
                ...inv,
                status:
                  decision === 'completed' && inv.status !== 'paid' && inv.status !== 'refunded'
                    ? 'cancelled'
                    : inv.status,
                cancellationStatus: decision,
                cancellationReviewedAt: nowUtc,
                cancellationAdminNote: cleanNote,
              }
            : inv
        )
      );

      return { ok: true };
    },
    [isAdmin, orders, currentUser]
  );

  const requestInvoiceRefund = useCallback(
    (invoiceId: string, input: { reason: string; amountUsd?: number }) => {
      if (!currentUser) {
        return { ok: false, error: 'Sign in required to submit a refund request.' };
      }
      const targetInv = invoices.find((inv) => inv.id === invoiceId);
      if (!targetInv) {
        return { ok: false, error: 'Invoice record not found.' };
      }
      const ownsInvoice =
        targetInv.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
      if (!ownsInvoice) {
        return { ok: false, error: 'Permission denied for this invoice.' };
      }
      if (targetInv.status !== 'paid') {
        return { ok: false, error: 'Only paid invoices are eligible for a refund request.' };
      }
      if (
        targetInv.refundStatus === 'requested' ||
        targetInv.refundStatus === 'approved' ||
        targetInv.refundStatus === 'processed'
      ) {
        return { ok: false, error: 'A refund request is already active or completed for this invoice.' };
      }
      const cleanReason = input.reason.trim();
      if (cleanReason.length < 5) {
        return { ok: false, error: 'Please explain why you are requesting a refund (at least 5 characters).' };
      }
      const requestedAmount =
        input.amountUsd !== undefined && Number.isFinite(input.amountUsd) && input.amountUsd > 0
          ? Math.min(targetInv.amountUsd, Number(input.amountUsd))
          : targetInv.amountUsd;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                refundStatus: 'requested',
                refundReason: cleanReason,
                refundAmountUsd: requestedAmount,
                refundRequestedAt: nowUtc,
              }
            : inv
        )
      );

      if (targetInv.orderId) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord.id === targetInv.orderId
              ? {
                  ...ord,
                  refundStatus: 'requested',
                  refundReason: cleanReason,
                  refundAmountUsd: requestedAmount,
                  refundRequestedAt: nowUtc,
                  notes: `Refund requested on ${invoiceId}: ${cleanReason}`,
                }
              : ord
          )
        );
      }

      return { ok: true };
    },
    [currentUser, isAdmin, invoices]
  );

  const adminProcessRefund = useCallback(
    (
      invoiceId: string,
      decision: 'approved' | 'processed' | 'rejected',
      options?: { refundAmountUsd?: number; note?: string }
    ) => {
      if (!isAdmin) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const targetInv = invoices.find((inv) => inv.id === invoiceId);
      if (!targetInv) {
        return { ok: false, error: 'Invoice record not found.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedAmount =
        options?.refundAmountUsd !== undefined && Number.isFinite(options.refundAmountUsd)
          ? Math.min(targetInv.amountUsd, Math.max(0, Number(options.refundAmountUsd)))
          : targetInv.refundAmountUsd ?? targetInv.amountUsd;
      const cleanNote =
        options?.note?.trim() ||
        (decision === 'processed'
          ? `Refund processed ($${resolvedAmount.toFixed(2)} USD) by ${currentUser?.name || 'Admin'}`
          : decision === 'approved'
            ? `Refund approved ($${resolvedAmount.toFixed(2)} USD) by ${currentUser?.name || 'Admin'}`
            : `Refund request declined by ${currentUser?.name || 'Admin'}`);

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: decision === 'processed' ? 'refunded' : inv.status,
                refundStatus: decision,
                refundAmountUsd: decision === 'rejected' ? inv.refundAmountUsd : resolvedAmount,
                refundProcessedAt: decision === 'processed' ? nowUtc : inv.refundProcessedAt,
                refundAdminNote: cleanNote,
              }
            : inv
        )
      );

      if (targetInv.orderId) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord.id === targetInv.orderId
              ? {
                  ...ord,
                  status: decision === 'processed' ? 'refunded' : ord.status,
                  autoRenew: decision === 'processed' ? false : ord.autoRenew,
                  refundStatus: decision,
                  refundAmountUsd:
                    decision === 'rejected' ? ord.refundAmountUsd : resolvedAmount,
                  refundProcessedAt: decision === 'processed' ? nowUtc : ord.refundProcessedAt,
                  refundAdminNote: cleanNote,
                  notes: cleanNote,
                }
              : ord
          )
        );
      }

      return { ok: true };
    },
    [isAdmin, invoices, currentUser]
  );

  const dispatchTicketEmail = useCallback(
    async (
      templateKey: 'ticket-created' | 'ticket-admin-reply' | 'ticket-closed' | 'abuse-ticket-alert',
      params: {
        toEmail: string;
        clientName: string;
        ticketId: string;
        subject: string;
        department: TicketDepartment;
        priority: TicketPriority;
        status: string;
        relatedService?: string;
        supportPin?: string;
        messageBody: string;
        staffName?: string;
      }
    ): Promise<boolean> => {
      if (typeof window === 'undefined') return false;
      const smtp = systemSettings.smtp;
      if (
        !smtp?.enabled ||
        !smtp.host.trim() ||
        !smtp.username.trim() ||
        !smtp.password
      ) {
        return false;
      }
      const tpl =
        emailTemplates.find((t) => t.key === templateKey || t.id === templateKey) ??
        INITIAL_EMAIL_TEMPLATES.find((t) => t.key === templateKey);
      if (!tpl || !tpl.enabled) return false;

      const origin = window.location?.origin || invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
      const mergeVars: Record<string, string> = {
        company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
        client_name: params.clientName,
        client_email: params.toEmail,
        ticket_id: params.ticketId,
        ticket_subject: params.subject,
        ticket_department: params.department,
        ticket_priority: params.priority,
        ticket_status: params.status.toUpperCase(),
        domain: params.relatedService || 'General Account',
        support_pin: params.supportPin || '—',
        ticket_message: params.messageBody,
        ticket_url: `${origin}/dashboard/tickets/${encodeURIComponent(params.ticketId)}`,
        staff_name: 'Support cpcloudhost',
      };

      try {
        const res = await fetch('/api/system/send-templated-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp,
            toEmail: params.toEmail,
            companyName: invoiceTemplateConfig.companyName,
            companyEmail: invoiceTemplateConfig.companyEmail,
            companyWebsite: invoiceTemplateConfig.companyWebsite,
            accentColor: invoiceTemplateConfig.accentColor,
            headerBadge:
              templateKey === 'abuse-ticket-alert'
                ? 'ABUSE COMPLIANCE NOTICE'
                : templateKey === 'ticket-closed'
                  ? 'TICKET CLOSED'
                  : templateKey === 'ticket-admin-reply'
                    ? 'SUPPORT CPCLOUDHOST REPLY'
                    : 'SUPPORT TICKET',
            subject: renderEmailMergeText(tpl.subject, mergeVars),
            preheader: renderEmailMergeText(tpl.preheader, mergeVars),
            heading: renderEmailMergeText(tpl.heading, mergeVars),
            body: renderEmailMergeText(tpl.body, mergeVars),
            ctaLabel: renderEmailMergeText(tpl.ctaLabel, mergeVars),
            ctaUrl: renderEmailMergeText(tpl.ctaUrl, mergeVars),
            footerNote: renderEmailMergeText(tpl.footerNote, mergeVars),
          }),
        });
        const data = (await res.json()) as { ok?: boolean };
        return Boolean(res.ok && data.ok);
      } catch {
        return false;
      }
    },
    [systemSettings.smtp, emailTemplates, invoiceTemplateConfig]
  );

  const createSupportTicket = useCallback(
    (input: {
      subject: string;
      department: TicketDepartment;
      priority: TicketPriority;
      relatedService?: string;
      message: string;
      attachments?: TicketAttachment[];
    }) => {
      if (!currentUser) return null;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: SupportTicketRecord = {
        id: `TKT-${Math.floor(49000 + Math.random() * 50000)}`,
        clientEmail: currentUser.email,
        clientName: currentUser.name,
        subject: input.subject.trim(),
        department: input.department,
        priority: input.priority,
        status: 'open',
        relatedService: input.relatedService?.trim() || undefined,
        supportPinUsed: activeSupportPin?.pin,
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
        messages: [
          {
            id: `MSG-${Date.now()}`,
            authorName: currentUser.name,
            authorRole: 'client',
            body: input.message.trim(),
            timestampUtc: nowUtc,
            attachments:
              input.attachments && input.attachments.length > 0
                ? input.attachments
                : undefined,
          },
        ],
      };
      setTickets((prev) => [created, ...prev]);

      void dispatchTicketEmail('ticket-created', {
        toEmail: created.clientEmail,
        clientName: created.clientName,
        ticketId: created.id,
        subject: created.subject,
        department: created.department,
        priority: created.priority,
        status: created.status,
        relatedService: created.relatedService,
        supportPin: created.supportPinUsed,
        messageBody: input.message.trim(),
      });

      if (
        typeof window !== 'undefined' &&
        systemSettings.smtp?.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password &&
        systemSettings.adminAlerts?.enabled &&
        systemSettings.adminAlerts.notifyNewTicket &&
        systemSettings.adminAlerts.alertEmail.trim()
      ) {
        const origin = window.location?.origin || invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
        const alertTpl =
          emailTemplates.find((t) => t.key === 'admin-system-alert' || t.id === 'admin-system-alert') ??
          INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'admin-system-alert');
        if (alertTpl && alertTpl.enabled) {
          const alertVars: Record<string, string> = {
            company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
            event_title: `New Support Ticket ${created.id} (${created.department})`,
            client_name: created.clientName,
            client_email: created.clientEmail,
            domain: created.relatedService || 'General Account',
            order_id: created.id,
            event_details: `Subject: ${created.subject} · Priority: ${created.priority} · Message: ${input.message.trim().slice(0, 260)}`,
            updated_at: nowUtc,
            action_url: `${origin}/admin/wp`,
          };
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: systemSettings.adminAlerts.alertEmail.trim(),
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge: 'ADMIN TICKET ALERT',
              subject: renderEmailMergeText(alertTpl.subject, alertVars),
              preheader: renderEmailMergeText(alertTpl.preheader, alertVars),
              heading: renderEmailMergeText(alertTpl.heading, alertVars),
              body: renderEmailMergeText(alertTpl.body, alertVars),
              ctaLabel: renderEmailMergeText(alertTpl.ctaLabel, alertVars),
              ctaUrl: renderEmailMergeText(alertTpl.ctaUrl, alertVars),
              footerNote: renderEmailMergeText(alertTpl.footerNote, alertVars),
            }),
          }).catch(() => undefined);
        }
      }

      return created;
    },
    [currentUser, activeSupportPin, dispatchTicketEmail, systemSettings, emailTemplates, invoiceTemplateConfig]
  );

  const adminCreateTicketForClient = useCallback(
    (input: {
      userId: string;
      department: TicketDepartment;
      priority: TicketPriority;
      subject: string;
      message: string;
      relatedService?: string;
      status?: TicketStatus;
      attachments?: TicketAttachment[];
    }) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const targetUser = users.find((u) => u.id === input.userId);
      if (!targetUser) {
        return { ok: false, error: 'Client account not found.' };
      }
      if (!input.subject.trim() || !input.message.trim()) {
        return { ok: false, error: 'Enter both a subject and initial message.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: SupportTicketRecord = {
        id: `TKT-${Math.floor(49000 + Math.random() * 50000)}`,
        clientEmail: targetUser.email.toLowerCase(),
        clientName: targetUser.name,
        subject: input.subject.trim(),
        department: input.department,
        priority: input.priority,
        status: input.status || 'pending',
        relatedService: input.relatedService?.trim() || undefined,
        supportPinUsed: targetUser.supportPin?.pin,
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
        messages: [
          {
            id: `MSG-${Date.now()}-ADMIN-INIT`,
            authorName: 'Support cpcloudhost',
            authorRole: 'support',
            body: input.message.trim(),
            timestampUtc: nowUtc,
            attachments:
              input.attachments && input.attachments.length > 0
                ? input.attachments
                : undefined,
          },
        ],
      };
      setTickets((prev) => [created, ...prev]);

      void dispatchTicketEmail(
        input.department === 'Abuse' ? 'abuse-ticket-alert' : 'ticket-created',
        {
          toEmail: created.clientEmail,
          clientName: created.clientName,
          ticketId: created.id,
          subject: created.subject,
          department: created.department,
          priority: created.priority,
          status: created.status,
          relatedService: created.relatedService,
          supportPin: created.supportPinUsed,
          messageBody: input.message.trim(),
          staffName: 'Support cpcloudhost',
        }
      );

      return { ok: true, ticket: created };
    },
    [isAdmin, currentUser, users, dispatchTicketEmail]
  );

  const adminCreateAbuseTicketAndNotify = useCallback(
    async (input: {
      userId?: string;
      clientEmail?: string;
      relatedService?: string;
      subject: string;
      message: string;
      priority?: TicketPriority;
      suspendMatchingService?: boolean;
      abuseCaseTicketId?: string;
    }) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const cleanSubject = input.subject.trim();
      const cleanMessage = input.message.trim();
      if (!cleanSubject || !cleanMessage) {
        return { ok: false, error: 'Enter both an abuse subject and notice details.' };
      }

      const targetById = input.userId
        ? usersRef.current.find((u) => u.id === input.userId)
        : undefined;
      const cleanEmailLower = (input.clientEmail || '').trim().toLowerCase();
      const targetByEmail = cleanEmailLower
        ? usersRef.current.find((u) => u.email.toLowerCase() === cleanEmailLower)
        : undefined;
      const matchedOrder = input.relatedService
        ? ordersRef.current.find(
            (o) =>
              o.domainOrHost.toLowerCase() === input.relatedService?.trim().toLowerCase() ||
              input.relatedService?.toLowerCase().includes(o.domainOrHost.toLowerCase())
          )
        : undefined;

      const resolvedEmail = (
        targetById?.email ||
        targetByEmail?.email ||
        cleanEmailLower ||
        matchedOrder?.clientEmail ||
        ''
      )
        .trim()
        .toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(resolvedEmail)) {
        return {
          ok: false,
          error: 'Select a valid client account or enter a valid client email address.',
        };
      }

      const resolvedName =
        targetById?.name ||
        targetByEmail?.name ||
        matchedOrder?.clientName ||
        resolvedEmail.split('@')[0];
      const resolvedPin =
        targetById?.supportPin?.pin || targetByEmail?.supportPin?.pin;

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: SupportTicketRecord = {
        id: `TKT-${Math.floor(49000 + Math.random() * 50000)}`,
        clientEmail: resolvedEmail,
        clientName: resolvedName,
        subject: cleanSubject,
        department: 'Abuse',
        priority: input.priority || 'High',
        status: 'pending',
        relatedService: input.relatedService?.trim() || matchedOrder?.domainOrHost,
        supportPinUsed: resolvedPin,
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
        messages: [
          {
            id: `MSG-${Date.now()}-ABUSE`,
            authorName: 'Support cpcloudhost',
            authorRole: 'support',
            body: cleanMessage,
            timestampUtc: nowUtc,
          },
        ],
      };

      setTickets((prev) => [created, ...prev]);

      if (input.suspendMatchingService && (input.relatedService || matchedOrder)) {
        const needle = (input.relatedService || matchedOrder?.domainOrHost || '').toLowerCase();
        setOrders((prev) =>
          prev.map((ord) =>
            ord.clientEmail.toLowerCase() === resolvedEmail &&
            (needle.includes(ord.domainOrHost.toLowerCase()) ||
              ord.domainOrHost.toLowerCase() === needle)
              ? {
                  ...ord,
                  status: 'suspended',
                  notes: `Suspended due to Abuse Ticket ${created.id} (${nowUtc})`,
                }
              : ord
          )
        );
      }

      if (input.abuseCaseTicketId) {
        setAbuseComplaints((prev) =>
          prev.map((item) =>
            item.ticketId === input.abuseCaseTicketId
              ? {
                  ...item,
                  status: input.suspendMatchingService ? 'suspended_target' : 'investigating',
                  moderatorNotes: `${item.moderatorNotes}\n[${nowUtc}] Client notified via Abuse Ticket ${created.id}.`,
                  moderatedBy: 'Support cpcloudhost',
                  updatedAtUtc: nowUtc,
                }
              : item
          )
        );
      }

      appendLoginActivity({
        userEmail: resolvedEmail,
        userName: resolvedName,
        eventType: 'Abuse Ticket Issued',
        status: 'warning',
        authMethod: `Ticket ${created.id} · ${created.relatedService || 'Account'}`,
        country: targetById?.country || targetByEmail?.country || 'International',
      });

      const emailSent = await dispatchTicketEmail('abuse-ticket-alert', {
        toEmail: created.clientEmail,
        clientName: created.clientName,
        ticketId: created.id,
        subject: created.subject,
        department: 'Abuse',
        priority: created.priority,
        status: created.status,
        relatedService: created.relatedService,
        supportPin: created.supportPinUsed,
        messageBody: cleanMessage,
        staffName: 'Support cpcloudhost',
      });

      return { ok: true, ticket: created, emailSent };
    },
    [isAdmin, currentUser, appendLoginActivity, dispatchTicketEmail]
  );

  const replySupportTicket = useCallback(
    (ticketId: string, message: string, attachments?: TicketAttachment[]) => {
      if (!currentUser) return;
      const hasBody = Boolean(message.trim());
      const hasFiles = Boolean(attachments && attachments.length > 0);
      if (!hasBody && !hasFiles) return;

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

      const targetTicket = tickets.find((t) => t.id === ticketId) ?? null;

      setTickets((prev) =>
        prev.map((tkt) => {
          if (tkt.id !== ticketId) return tkt;
          const ownsTicket =
            tkt.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
          if (!ownsTicket) return tkt;
          return {
            ...tkt,
            status: 'open',
            updatedAtUtc: nowUtc,
            messages: [
              ...tkt.messages,
              {
                id: `MSG-${Date.now()}`,
                authorName: currentUser.name,
                authorRole: 'client',
                body: hasBody ? message.trim() : 'Attached file(s) for review.',
                timestampUtc: nowUtc,
                attachments: hasFiles ? attachments : undefined,
              },
            ],
          };
        })
      );

      if (
        targetTicket &&
        typeof window !== 'undefined' &&
        systemSettings.smtp?.enabled &&
        systemSettings.smtp.host.trim() &&
        systemSettings.smtp.username.trim() &&
        systemSettings.smtp.password &&
        systemSettings.adminAlerts?.enabled &&
        systemSettings.adminAlerts.notifyNewTicket &&
        systemSettings.adminAlerts.alertEmail.trim()
      ) {
        const origin = window.location?.origin || invoiceTemplateConfig.companyWebsite || 'https://cpcloudhost.com';
        const alertTpl =
          emailTemplates.find((t) => t.key === 'admin-system-alert' || t.id === 'admin-system-alert') ??
          INITIAL_EMAIL_TEMPLATES.find((t) => t.key === 'admin-system-alert');
        if (alertTpl && alertTpl.enabled) {
          const alertVars: Record<string, string> = {
            company_name: invoiceTemplateConfig.companyName || 'CPCloudHost',
            event_title: `Client Replied on Ticket ${targetTicket.id}`,
            client_name: currentUser.name,
            client_email: currentUser.email,
            domain: targetTicket.relatedService || 'Support Ticket',
            order_id: targetTicket.id,
            event_details: `Subject: ${targetTicket.subject} · Reply: ${(hasBody ? message.trim() : 'Attached file(s)').slice(0, 260)}`,
            updated_at: nowUtc,
            action_url: `${origin}/admin/wp`,
          };
          void fetch('/api/system/send-templated-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtp: systemSettings.smtp,
              toEmail: systemSettings.adminAlerts.alertEmail.trim(),
              companyName: invoiceTemplateConfig.companyName,
              companyEmail: invoiceTemplateConfig.companyEmail,
              companyWebsite: invoiceTemplateConfig.companyWebsite,
              accentColor: invoiceTemplateConfig.accentColor,
              headerBadge: 'ADMIN TICKET REPLY',
              subject: renderEmailMergeText(alertTpl.subject, alertVars),
              preheader: renderEmailMergeText(alertTpl.preheader, alertVars),
              heading: renderEmailMergeText(alertTpl.heading, alertVars),
              body: renderEmailMergeText(alertTpl.body, alertVars),
              ctaLabel: renderEmailMergeText(alertTpl.ctaLabel, alertVars),
              ctaUrl: renderEmailMergeText(alertTpl.ctaUrl, alertVars),
              footerNote: renderEmailMergeText(alertTpl.footerNote, alertVars),
            }),
          }).catch(() => undefined);
        }
      }
    },
    [currentUser, isAdmin, tickets, systemSettings, emailTemplates, invoiceTemplateConfig]
  );

  const resolveSupportTicket = useCallback(
    (ticketId: string) => {
      if (!currentUser) return;
      const targetTicket = tickets.find((t) => t.id === ticketId) ?? null;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setTickets((prev) =>
        prev.map((tkt) => {
          if (tkt.id !== ticketId) return tkt;
          const ownsTicket =
            tkt.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
          if (!ownsTicket) return tkt;
          return { ...tkt, status: 'resolved', updatedAtUtc: nowUtc };
        })
      );
      if (targetTicket && isAdmin) {
        void dispatchTicketEmail('ticket-closed', {
          toEmail: targetTicket.clientEmail,
          clientName: targetTicket.clientName,
          ticketId: targetTicket.id,
          subject: targetTicket.subject,
          department: targetTicket.department,
          priority: targetTicket.priority,
          status: 'resolved',
          relatedService: targetTicket.relatedService,
          supportPin: targetTicket.supportPinUsed,
          messageBody: 'This support ticket has been marked as resolved.',
          staffName: 'Support cpcloudhost',
        });
      }
    },
    [currentUser, isAdmin, tickets, dispatchTicketEmail]
  );

  const reopenSupportTicket = useCallback(
    (ticketId: string) => {
      if (!currentUser) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setTickets((prev) =>
        prev.map((tkt) => {
          if (tkt.id !== ticketId) return tkt;
          const ownsTicket =
            tkt.clientEmail.toLowerCase() === currentUser.email.toLowerCase() || isAdmin;
          if (!ownsTicket) return tkt;
          return { ...tkt, status: 'open', updatedAtUtc: nowUtc };
        })
      );
    },
    [currentUser, isAdmin]
  );

  const replyTicketAsAdmin = useCallback(
    (
      ticketId: string,
      message: string,
      attachments?: TicketAttachment[],
      nextStatus: TicketStatus = 'pending'
    ) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator clearance required.' };
      }
      const hasBody = Boolean(message.trim());
      const hasFiles = Boolean(attachments && attachments.length > 0);
      if (!hasBody && !hasFiles) {
        return { ok: false, error: 'Enter a support response or attach a file.' };
      }

      const targetTicket = tickets.find((t) => t.id === ticketId) ?? null;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const resolvedBody = hasBody ? message.trim() : 'Attached staff diagnostics for review.';

      setTickets((prev) =>
        prev.map((tkt) => {
          if (tkt.id !== ticketId) return tkt;
          return {
            ...tkt,
            status: nextStatus,
            updatedAtUtc: nowUtc,
            messages: [
              ...tkt.messages,
              {
                id: `MSG-${Date.now()}-ADMIN`,
                authorName: 'Support cpcloudhost',
                authorRole: 'support',
                body: resolvedBody,
                timestampUtc: nowUtc,
                attachments: hasFiles ? attachments : undefined,
              },
            ],
          };
        })
      );

      if (targetTicket) {
        void dispatchTicketEmail('ticket-admin-reply', {
          toEmail: targetTicket.clientEmail,
          clientName: targetTicket.clientName,
          ticketId: targetTicket.id,
          subject: targetTicket.subject,
          department: targetTicket.department,
          priority: targetTicket.priority,
          status: nextStatus,
          relatedService: targetTicket.relatedService,
          supportPin: targetTicket.supportPinUsed,
          messageBody: resolvedBody,
          staffName: 'Support cpcloudhost',
        });
      }

      return { ok: true };
    },
    [isAdmin, currentUser, tickets, dispatchTicketEmail]
  );

  const updateTicketByAdmin = useCallback(
    (
      ticketId: string,
      updates: {
        status?: TicketStatus;
        priority?: TicketPriority;
        department?: TicketDepartment;
      }
    ) => {
      if (!isAdmin) return;
      const targetTicket = tickets.find((t) => t.id === ticketId) ?? null;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setTickets((prev) =>
        prev.map((tkt) => {
          if (tkt.id !== ticketId) return tkt;
          return {
            ...tkt,
            ...updates,
            updatedAtUtc: nowUtc,
          };
        })
      );
      if (targetTicket && updates.status === 'resolved' && targetTicket.status !== 'resolved') {
        void dispatchTicketEmail('ticket-closed', {
          toEmail: targetTicket.clientEmail,
          clientName: targetTicket.clientName,
          ticketId: targetTicket.id,
          subject: targetTicket.subject,
          department: updates.department || targetTicket.department,
          priority: updates.priority || targetTicket.priority,
          status: 'resolved',
          relatedService: targetTicket.relatedService,
          supportPin: targetTicket.supportPinUsed,
          messageBody: 'This support ticket has been resolved and closed.',
          staffName: 'Support cpcloudhost',
        });
      }
    },
    [isAdmin, tickets, dispatchTicketEmail]
  );

  const normalizeCustomSlug = (rawSlug: string) => {
    const cleaned = rawSlug
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-z0-9/-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/\/{2,}/g, '/');
    return cleaned ? `/${cleaned}` : '';
  };

  const RESERVED_CMS_PATHS = useMemo(
    () =>
      new Set([
        '/',
        '/admin',
        '/admin/wp',
        '/dashboard',
        '/auth',
        '/auth/login',
        '/auth/register',
      ]),
    []
  );

  const saveCmsPage = useCallback(
    (
      pageId: string,
      updates: Partial<Omit<CmsPageRecord, 'id' | 'isSystemPage'>>
    ) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator access required.' };
      }
      const existing = cmsPages.find((p) => p.id === pageId);
      if (!existing) {
        return { ok: false, error: 'Page record not found.' };
      }

      let resolvedSlug = existing.slug;
      if (!existing.isSystemPage && updates.slug !== undefined) {
        const candidateSlug = normalizeCustomSlug(updates.slug);
        if (!candidateSlug || candidateSlug.length < 2) {
          return { ok: false, error: 'Enter a valid URL slug (e.g., /cloud-pricing).' };
        }
        if (
          RESERVED_CMS_PATHS.has(candidateSlug) ||
          candidateSlug.startsWith('/admin/') ||
          candidateSlug.startsWith('/dashboard/') ||
          candidateSlug.startsWith('/auth/')
        ) {
          return { ok: false, error: 'This URL path is reserved by portal or system routes.' };
        }
        const duplicate = cmsPages.find(
          (p) => p.id !== pageId && p.slug.toLowerCase() === candidateSlug
        );
        if (duplicate) {
          return { ok: false, error: `Slug ${candidateSlug} is already used by another page.` };
        }
        resolvedSlug = candidateSlug;
      }

      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setCmsPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? {
                ...p,
                ...updates,
                slug: resolvedSlug,
                updatedAtUtc: nowUtc,
                updatedBy: currentUser.name,
              }
            : p
        )
      );
      return { ok: true };
    },
    [isAdmin, currentUser, cmsPages, RESERVED_CMS_PATHS]
  );

  const createCmsPage = useCallback(
    (
      input: Omit<CmsPageRecord, 'id' | 'isSystemPage' | 'updatedAtUtc' | 'updatedBy'>
    ) => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: 'Administrator access required.' };
      }
      const candidateSlug = normalizeCustomSlug(input.slug || input.navTitle);
      if (!candidateSlug || candidateSlug.length < 2) {
        return { ok: false, error: 'Provide a valid URL slug (e.g., /enterprise-sla).' };
      }
      if (
        RESERVED_CMS_PATHS.has(candidateSlug) ||
        candidateSlug.startsWith('/admin/') ||
        candidateSlug.startsWith('/dashboard/') ||
        candidateSlug.startsWith('/auth/')
      ) {
        return { ok: false, error: 'This URL path is reserved for portal routes.' };
      }
      if (cmsPages.some((p) => p.slug.toLowerCase() === candidateSlug)) {
        return { ok: false, error: `A page already exists at ${candidateSlug}.` };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: CmsPageRecord = {
        ...input,
        id: `page-${Date.now().toString(36)}`,
        slug: candidateSlug,
        category: input.category || 'Custom Page',
        isSystemPage: false,
        updatedAtUtc: nowUtc,
        updatedBy: currentUser.name,
      };
      setCmsPages((prev) => [...prev, created]);
      return { ok: true, page: created };
    },
    [isAdmin, currentUser, cmsPages, RESERVED_CMS_PATHS]
  );

  const deleteCmsPage = useCallback(
    (pageId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator access required.' };
      const target = cmsPages.find((p) => p.id === pageId);
      if (!target) return { ok: false, error: 'Page not found.' };
      if (target.isSystemPage) {
        return { ok: false, error: 'Core website pages cannot be deleted; use Reset Defaults or Draft mode instead.' };
      }
      setCmsPages((prev) => prev.filter((p) => p.id !== pageId));
      return { ok: true };
    },
    [isAdmin, cmsPages]
  );

  const resetSystemCmsPage = useCallback(
    (pageId: string) => {
      if (!isAdmin || !currentUser) return;
      const seed = INITIAL_CMS_PAGES.find((p) => p.id === pageId);
      if (!seed) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setCmsPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...seed, updatedAtUtc: nowUtc, updatedBy: `${currentUser.name} (Reset)` }
            : p
        )
      );
    },
    [isAdmin, currentUser]
  );

  const updateCmsSiteSettings = useCallback(
    (updates: Partial<CmsSiteSettings>) => {
      if (!isAdmin) return;
      setCmsSiteSettings((prev) => ({ ...prev, ...updates }));
    },
    [isAdmin]
  );

  // ---- TLD Extensions CRUD ----
  const saveTldExtension = useCallback(
    (tldId: string, updates: Partial<Omit<TldExtensionRecord, 'id'>>) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setTldExtensions((prev) =>
        prev.map((item) =>
          item.id === tldId ? { ...item, ...updates, updatedAtUtc: nowUtc } : item
        )
      );
      return { ok: true };
    },
    [isAdmin]
  );

  const createTldExtension = useCallback(
    (input: {
      tld: string;
      description: string;
      minYears: 1 | 2;
      year1Usd: number;
      year2Usd: number;
      renewalUsd: number;
      transferUsd: number;
      popular?: boolean;
      enabled?: boolean;
      registrarModuleId?: string;
    }) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      let cleanTld = input.tld.trim().toLowerCase();
      if (!cleanTld) return { ok: false, error: 'Enter a TLD extension such as .com or .pk.' };
      if (!cleanTld.startsWith('.')) cleanTld = `.${cleanTld}`;
      if (tldExtensions.some((t) => t.tld.toLowerCase() === cleanTld)) {
        return { ok: false, error: `${cleanTld} already exists in the TLD catalog.` };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: TldExtensionRecord = {
        id: `tld-${cleanTld.replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
        tld: cleanTld,
        description:
          input.description.trim() ||
          `Domain registration and DNS management for ${cleanTld}.`,
        minYears: input.minYears === 2 ? 2 : 1,
        year1Usd: Math.max(0, Number(input.year1Usd) || 0),
        year2Usd: Math.max(0, Number(input.year2Usd) || 0),
        renewalUsd: Math.max(0, Number(input.renewalUsd) || 0),
        transferUsd: Math.max(0, Number(input.transferUsd) || 0),
        popular: Boolean(input.popular),
        enabled: input.enabled ?? true,
        registrarModuleId: input.registrarModuleId,
        updatedAtUtc: nowUtc,
      };
      setTldExtensions((prev) => [created, ...prev]);
      return { ok: true, record: created };
    },
    [isAdmin, tldExtensions]
  );

  const deleteTldExtension = useCallback(
    (tldId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      setTldExtensions((prev) => prev.filter((t) => t.id !== tldId));
      return { ok: true };
    },
    [isAdmin]
  );

  // ---- Provisioning Modules (WHM / StackCP / Proxmox) CRUD ----
  const createProvisioningModule = useCallback(
    (input: {
      name: string;
      moduleType: ProvisioningModuleType;
      hostname: string;
      port: number;
      useSsl: boolean;
      username: string;
      apiToken: string;
      ignoreSslErrors: boolean;
      nameservers: [string, string];
      autoProvisionEnabled: boolean;
      packages?: string[];
    }) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      if (!input.name.trim() || !input.hostname.trim()) {
        return { ok: false, error: 'Module name and server hostname are required.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: ProvisioningModuleRecord = {
        id: `mod-${input.moduleType}-${Date.now().toString(36)}`,
        name: input.name.trim(),
        moduleType: input.moduleType,
        hostname: input.hostname.trim(),
        port: Number(input.port) || 2087,
        useSsl: input.useSsl,
        username: input.username.trim() || 'root',
        apiToken: input.apiToken.trim(),
        ignoreSslErrors: input.ignoreSslErrors,
        nameservers: [
          input.nameservers[0].trim() || 'ns1.cpcloudhost.com',
          input.nameservers[1].trim() || 'ns2.cpcloudhost.com',
        ],
        autoProvisionEnabled: input.autoProvisionEnabled,
        enabled: true,
        packages: input.packages ?? [],
        lastConnectionStatus: 'untested',
        updatedAtUtc: nowUtc,
      };
      setProvisioningModules((prev) => [...prev, created]);
      return { ok: true, module: created };
    },
    [isAdmin]
  );

  const saveProvisioningModule = useCallback(
    (moduleId: string, updates: Partial<Omit<ProvisioningModuleRecord, 'id'>>) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setProvisioningModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, ...updates, updatedAtUtc: nowUtc } : m
        )
      );
      return { ok: true };
    },
    [isAdmin]
  );

  const deleteProvisioningModule = useCallback(
    (moduleId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      setProvisioningModules((prev) => prev.filter((m) => m.id !== moduleId));
      return { ok: true };
    },
    [isAdmin]
  );

  // ---- Managed Hosting Plans CRUD ----
  const saveHostingPlan = useCallback(
    (planId: string, updates: Partial<Omit<ManagedHostingPlanRecord, 'id'>>) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setHostingPlans((prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, ...updates, updatedAtUtc: nowUtc } : p
        )
      );
      return { ok: true };
    },
    [isAdmin]
  );

  const createHostingPlan = useCallback(
    (input: Omit<ManagedHostingPlanRecord, 'id' | 'updatedAtUtc'>) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      if (!input.name.trim()) {
        return { ok: false, error: 'Hosting plan name is required.' };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: ManagedHostingPlanRecord = {
        ...input,
        id: `plan-${input.pageCategory}-${Date.now().toString(36)}`,
        name: input.name.trim(),
        updatedAtUtc: nowUtc,
      };
      setHostingPlans((prev) => [...prev, created]);
      return { ok: true, plan: created };
    },
    [isAdmin]
  );

  const deleteHostingPlan = useCallback(
    (planId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      setHostingPlans((prev) => prev.filter((p) => p.id !== planId));
      return { ok: true };
    },
    [isAdmin]
  );

  // ---- System Integration Settings (StackMail SMTP, Google OAuth & Admin Alerts) ----
  const saveSystemIntegrationSettings = useCallback(
    (updates: {
      smtp?: Partial<SystemSmtpSettings>;
      googleOAuth?: Partial<SystemGoogleOAuthSettings>;
      adminAlerts?: Partial<SystemAdminAlertSettings>;
    }) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setSystemSettings((prev) => ({
        smtp: updates.smtp ? { ...prev.smtp, ...updates.smtp } : prev.smtp,
        googleOAuth: updates.googleOAuth
          ? { ...prev.googleOAuth, ...updates.googleOAuth }
          : prev.googleOAuth,
        adminAlerts: updates.adminAlerts
          ? { ...prev.adminAlerts, ...updates.adminAlerts }
          : prev.adminAlerts,
        updatedAtUtc: nowUtc,
      }));
      return { ok: true };
    },
    [isAdmin]
  );

  // ---- Promo Codes CRUD & Validation ----
  const createPromoCode = useCallback(
    (input: {
      code: string;
      description: string;
      scope: PromoCodeScope;
      discountType: PromoDiscountType;
      discountValue: number;
      applicableItems: string[];
      applicableCycles: string[];
      maxUses: number;
      expiresAt: string;
      enabled?: boolean;
    }) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const cleanCode = input.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (cleanCode.length < 3) {
        return { ok: false, error: 'Promo code must be at least 3 alphanumeric characters.' };
      }
      if (promoCodes.some((p) => p.code.toUpperCase() === cleanCode)) {
        return { ok: false, error: `Promo code ${cleanCode} already exists.` };
      }
      const val = Math.max(0, Number(input.discountValue) || 0);
      if (val <= 0 || (input.discountType === 'percent' && val > 100)) {
        return {
          ok: false,
          error:
            input.discountType === 'percent'
              ? 'Percentage discount must be between 1% and 100%.'
              : 'Fixed discount amount must be greater than 0.',
        };
      }
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const created: PromoCodeRecord = {
        id: `promo-${cleanCode.toLowerCase()}-${Date.now().toString(36)}`,
        code: cleanCode,
        description:
          input.description.trim() ||
          `${input.discountType === 'percent' ? `${val}%` : `$${val}`} off ${input.scope}`,
        scope: input.scope,
        discountType: input.discountType,
        discountValue: val,
        applicableItems: input.applicableItems,
        applicableCycles: input.applicableCycles,
        maxUses: Math.max(0, Number(input.maxUses) || 0),
        usedCount: 0,
        expiresAt: input.expiresAt.trim() || '2027-12-31',
        enabled: input.enabled ?? true,
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
      };
      setPromoCodes((prev) => [created, ...prev]);
      return { ok: true, promo: created };
    },
    [isAdmin, promoCodes]
  );

  const savePromoCode = useCallback(
    (
      promoId: string,
      updates: Partial<Omit<PromoCodeRecord, 'id' | 'createdAtUtc'>>
    ) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      const cleanCode = updates.code
        ? updates.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
        : undefined;
      if (
        cleanCode &&
        promoCodes.some((p) => p.id !== promoId && p.code.toUpperCase() === cleanCode)
      ) {
        return { ok: false, error: `Promo code ${cleanCode} is already in use.` };
      }
      setPromoCodes((prev) =>
        prev.map((p) =>
          p.id === promoId
            ? {
                ...p,
                ...updates,
                code: cleanCode ?? p.code,
                updatedAtUtc: nowUtc,
              }
            : p
        )
      );
      return { ok: true };
    },
    [isAdmin, promoCodes]
  );

  const deletePromoCode = useCallback(
    (promoId: string) => {
      if (!isAdmin) return { ok: false, error: 'Administrator clearance required.' };
      setPromoCodes((prev) => prev.filter((p) => p.id !== promoId));
      return { ok: true };
    },
    [isAdmin]
  );

  const togglePromoCode = useCallback(
    (promoId: string) => {
      if (!isAdmin) return;
      const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setPromoCodes((prev) =>
        prev.map((p) =>
          p.id === promoId ? { ...p, enabled: !p.enabled, updatedAtUtc: nowUtc } : p
        )
      );
    },
    [isAdmin]
  );

  const validatePromoCode = useCallback(
    (input: {
      code: string;
      hostingPlanId?: string;
      hostingPlanName?: string;
      hostingCycle?: string;
      hostingSubtotalUsd?: number;
      domainTld?: string;
      domainSubtotalUsd?: number;
    }) => {
      const clean = input.code.trim().toUpperCase();
      if (!clean) {
        return { ok: false, error: 'Enter a promo code.', discountUsd: 0 };
      }
      const promo = promoCodes.find((p) => p.code.toUpperCase() === clean);
      if (!promo) {
        return { ok: false, error: `Promo code "${clean}" was not found.`, discountUsd: 0 };
      }
      if (!promo.enabled) {
        return { ok: false, error: `Promo code ${promo.code} is currently disabled.`, discountUsd: 0 };
      }
      if (promo.expiresAt) {
        const expMs = Date.parse(`${promo.expiresAt}T23:59:59Z`);
        if (!Number.isNaN(expMs) && Date.now() > expMs) {
          return { ok: false, error: `Promo code ${promo.code} expired on ${promo.expiresAt}.`, discountUsd: 0 };
        }
      }
      if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
        return { ok: false, error: `Promo code ${promo.code} has reached its maximum usage limit.`, discountUsd: 0 };
      }

      if (promo.scope === 'hosting') {
        const base = Math.max(0, Number(input.hostingSubtotalUsd) || 0);
        if (base <= 0) {
          return { ok: false, error: 'No eligible hosting plan in cart.', discountUsd: 0 };
        }
        if (promo.applicableItems.length > 0) {
          const matchesPlan = promo.applicableItems.some(
            (idOrName) =>
              idOrName === input.hostingPlanId ||
              idOrName.toLowerCase() === (input.hostingPlanName || '').toLowerCase()
          );
          if (!matchesPlan) {
            return {
              ok: false,
              error: `Promo ${promo.code} does not apply to ${input.hostingPlanName || 'the selected plan'}.`,
              discountUsd: 0,
            };
          }
        }
        if (promo.applicableCycles.length > 0 && input.hostingCycle) {
          if (!promo.applicableCycles.includes(input.hostingCycle)) {
            return {
              ok: false,
              error: `Promo ${promo.code} applies only to: ${promo.applicableCycles.join(', ')}.`,
              discountUsd: 0,
            };
          }
        }
        const rawDiscount =
          promo.discountType === 'percent'
            ? (base * promo.discountValue) / 100
            : promo.discountValue;
        const discountUsd = Number(Math.min(base, Math.max(0, rawDiscount)).toFixed(2));
        return { ok: true, promo, discountUsd };
      }

      // Domain promo scope
      const domBase = Math.max(0, Number(input.domainSubtotalUsd) || 0);
      if (!input.domainTld || domBase <= 0) {
        return {
          ok: false,
          error: `Promo ${promo.code} applies to Domain Registrations. Select a domain first.`,
          discountUsd: 0,
        };
      }
      if (promo.applicableItems.length > 0) {
        const cleanTld = input.domainTld.toLowerCase();
        const matchesTld = promo.applicableItems.some((t) => t.toLowerCase() === cleanTld);
        if (!matchesTld) {
          return {
            ok: false,
            error: `Promo ${promo.code} applies only to ${promo.applicableItems.join(', ')} domains.`,
            discountUsd: 0,
          };
        }
      }
      const rawDiscount =
        promo.discountType === 'percent'
          ? (domBase * promo.discountValue) / 100
          : promo.discountValue;
      const discountUsd = Number(Math.min(domBase, Math.max(0, rawDiscount)).toFixed(2));
      return { ok: true, promo, discountUsd };
    },
    [promoCodes]
  );

  const recordPromoCodeUsage = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setPromoCodes((prev) =>
      prev.map((p) =>
        p.code.toUpperCase() === clean ? { ...p, usedCount: p.usedCount + 1 } : p
      )
    );
  }, []);

  const setOrderCheckoutDraft = useCallback((draft: OrderCheckoutDraft | null) => {
    setOrderCheckoutDraftState(draft);
  }, []);

  const clearOrderCheckoutDraft = useCallback(() => {
    setOrderCheckoutDraftState(null);
  }, []);

  const setLastSearchedDomain = useCallback((info: LastSearchedDomain | null) => {
    setLastSearchedDomainState(info);
  }, []);

  const setPendingPostAuthPath = useCallback((path: string | null) => {
    setPendingPostAuthPathState(path);
  }, []);

  const resetOperationalDataForProduction = useCallback(() => {
    if (!isAdmin) return;
    setOrders([]);
    setInvoices([]);
    setTickets([]);
    setAbuseComplaints([]);
    setLoginActivityLogs([]);
    setAllDomainContacts([]);
    setProvisioningModules([]);
    setHostingPlans((prev) =>
      prev.map((p) => (LEGACY_FAKE_MODULE_IDS.has(p.serverModuleId) ? { ...p, serverModuleId: '' } : p))
    );
    setUsers((prev) =>
      prev
        .filter((u) => u.role === 'admin')
        .map((u) => ({ ...u, activeServices: 0, totalSpendUsd: 0 }))
    );
    try {
      window.localStorage.setItem(PROD_CLEANUP_KEY, 'done');
    } catch {
      // ignore
    }
  }, [isAdmin]);

  const value = useMemo<PlatformContextValue>(
    () => ({
      currentUser,
      isAdmin,
      adminImpersonation,
      rememberedIdentifier,
      pendingTwoFactor: pendingChallenge
        ? { email: pendingChallenge.email, name: pendingChallenge.name }
        : null,
      activeSupportPin,
      users,
      orders,
      invoices,
      tickets,
      abuseComplaints,
      loginActivityLogs,
      cmsPages,
      cmsSiteSettings,
      paymentMethods,
      emailTemplates,
      invoiceTemplateConfig,
      tldExtensions,
      provisioningModules,
      hostingPlans,
      systemSettings,
      promoCodes,
      orderCheckoutDraft,
      lastSearchedDomain,
      pendingPostAuthPath,
      loginWithCredentials,
      signInWithGoogle,
      verifyTwoFactorChallenge,
      cancelTwoFactorChallenge,
      enableTwoFactorAuth,
      disableTwoFactorAuth,
      regenerateTwoFactorBackupCodes,
      rotateSupportPin,
      adminResetUserSupportPin,
      clearMyLoginLogs,
      logout,
      createUserAccount,
      registerClientAccount,
      verifyRegistrationOtp,
      resendRegistrationOtp,
      updateClientProfile,
      changePassword,
      updateUserStatus,
      updateUserRole,
      toggleUserKyc,
      adminUpdateUserProfile,
      adminChangeUserPassword,
      adminResetUserTwoFactor,
      updateOwnAdminCredentials,
      createAdminAccount,
      impersonateClientAccount,
      exitClientImpersonation,
      addOrder,
      updateOrderStatus,
      approveOrderWithServer,
      approveSharedHostingOrder,
      generateInvoiceForOrder,
      adminUpdateOrderDetails,
      adminTransferOrderToClient,
      adminUpdateInvoiceStatus,
      adminUpdateInvoiceFull,
      adminCreateStandaloneInvoice,
      saveInvoiceTemplateConfig,
      savePaymentMethod,
      createPaymentMethod,
      deletePaymentMethod,
      togglePaymentMethod,
      saveEmailTemplate,
      createEmailTemplate,
      deleteEmailTemplate,
      resetEmailTemplate,
      updateClientOrderSettings,
      domainContactAddresses,
      saveDomainContactAddress,
      deleteDomainContactAddress,
      setDefaultDomainContactAddress,
      updateDomainTransferLock,
      regenerateDomainEppCode,
      updateDomainDnsRecords,
      updateDomainWhoisContact,
      approveDomainRegistrationAndSendVerify,
      verifyDomainContactByToken,
      resendDomainVerificationEmail,
      requestDomainNameserverChange,
      adminApplyNameserverChange,
      adminStartDomainTransfer,
      clientNotifyDomainTransferApproved,
      adminCompleteDomainTransfer,
      payClientOrderInvoice,
      requestOrderCancellation,
      adminHandleCancellation,
      requestInvoiceRefund,
      adminProcessRefund,
      createSupportTicket,
      adminCreateTicketForClient,
      adminCreateAbuseTicketAndNotify,
      replySupportTicket,
      resolveSupportTicket,
      reopenSupportTicket,
      closeSupportTicket: resolveSupportTicket,
      replyTicketAsAdmin,
      updateTicketByAdmin,
      saveCmsPage,
      createCmsPage,
      deleteCmsPage,
      resetSystemCmsPage,
      updateCmsSiteSettings,
      submitAbuseComplaint,
      moderateAbuseComplaint,
      saveTldExtension,
      createTldExtension,
      deleteTldExtension,
      createProvisioningModule,
      saveProvisioningModule,
      deleteProvisioningModule,
      saveHostingPlan,
      createHostingPlan,
      deleteHostingPlan,
      saveSystemIntegrationSettings,
      createPromoCode,
      savePromoCode,
      deletePromoCode,
      togglePromoCode,
      validatePromoCode,
      recordPromoCodeUsage,
      setOrderCheckoutDraft,
      clearOrderCheckoutDraft,
      setLastSearchedDomain,
      setPendingPostAuthPath,
      runDueDateBillingSweep,
      resetOperationalDataForProduction,
    }),
    [
      currentUser,
      isAdmin,
      adminImpersonation,
      rememberedIdentifier,
      pendingChallenge,
      activeSupportPin,
      users,
      orders,
      invoices,
      tickets,
      abuseComplaints,
      loginActivityLogs,
      cmsPages,
      cmsSiteSettings,
      paymentMethods,
      emailTemplates,
      invoiceTemplateConfig,
      tldExtensions,
      provisioningModules,
      hostingPlans,
      systemSettings,
      promoCodes,
      orderCheckoutDraft,
      lastSearchedDomain,
      pendingPostAuthPath,
      loginWithCredentials,
      signInWithGoogle,
      verifyTwoFactorChallenge,
      cancelTwoFactorChallenge,
      enableTwoFactorAuth,
      disableTwoFactorAuth,
      regenerateTwoFactorBackupCodes,
      rotateSupportPin,
      adminResetUserSupportPin,
      clearMyLoginLogs,
      logout,
      createUserAccount,
      registerClientAccount,
      verifyRegistrationOtp,
      resendRegistrationOtp,
      updateClientProfile,
      changePassword,
      updateUserStatus,
      updateUserRole,
      toggleUserKyc,
      adminUpdateUserProfile,
      adminChangeUserPassword,
      adminResetUserTwoFactor,
      updateOwnAdminCredentials,
      createAdminAccount,
      impersonateClientAccount,
      exitClientImpersonation,
      addOrder,
      updateOrderStatus,
      approveOrderWithServer,
      approveSharedHostingOrder,
      generateInvoiceForOrder,
      adminUpdateOrderDetails,
      adminTransferOrderToClient,
      adminUpdateInvoiceStatus,
      adminUpdateInvoiceFull,
      adminCreateStandaloneInvoice,
      saveInvoiceTemplateConfig,
      savePaymentMethod,
      createPaymentMethod,
      deletePaymentMethod,
      togglePaymentMethod,
      saveEmailTemplate,
      createEmailTemplate,
      deleteEmailTemplate,
      resetEmailTemplate,
      updateClientOrderSettings,
      domainContactAddresses,
      saveDomainContactAddress,
      deleteDomainContactAddress,
      setDefaultDomainContactAddress,
      updateDomainTransferLock,
      regenerateDomainEppCode,
      updateDomainDnsRecords,
      updateDomainWhoisContact,
      approveDomainRegistrationAndSendVerify,
      verifyDomainContactByToken,
      resendDomainVerificationEmail,
      requestDomainNameserverChange,
      adminApplyNameserverChange,
      adminStartDomainTransfer,
      clientNotifyDomainTransferApproved,
      adminCompleteDomainTransfer,
      payClientOrderInvoice,
      requestOrderCancellation,
      adminHandleCancellation,
      requestInvoiceRefund,
      adminProcessRefund,
      createSupportTicket,
      adminCreateTicketForClient,
      adminCreateAbuseTicketAndNotify,
      replySupportTicket,
      resolveSupportTicket,
      reopenSupportTicket,
      replyTicketAsAdmin,
      updateTicketByAdmin,
      saveCmsPage,
      createCmsPage,
      deleteCmsPage,
      resetSystemCmsPage,
      updateCmsSiteSettings,
      submitAbuseComplaint,
      moderateAbuseComplaint,
      saveTldExtension,
      createTldExtension,
      deleteTldExtension,
      createProvisioningModule,
      saveProvisioningModule,
      deleteProvisioningModule,
      saveHostingPlan,
      createHostingPlan,
      deleteHostingPlan,
      saveSystemIntegrationSettings,
      createPromoCode,
      savePromoCode,
      deletePromoCode,
      togglePromoCode,
      validatePromoCode,
      recordPromoCodeUsage,
      setOrderCheckoutDraft,
      clearOrderCheckoutDraft,
      setLastSearchedDomain,
      setPendingPostAuthPath,
      runDueDateBillingSweep,
      resetOperationalDataForProduction,
    ]
  );

  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  );
};

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return ctx;
}
