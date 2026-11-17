import type { PlatformOrder } from '../context/PlatformContext';

export const ICANN_TRANSFER_LOCK_DAYS = 60;

export function getTodayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseIsoDateOnly(raw?: string): string {
  if (!raw) return getTodayIsoUtc();
  const match = raw.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return getTodayIsoUtc();
}

export function addDaysToIso(isoDate: string, days: number): string {
  const [y, m, d] = parseIsoDateOnly(isoDate).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function addYearsToIso(isoDate: string, years: number): string {
  const [y, m, d] = parseIsoDateOnly(isoDate).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCFullYear(dt.getUTCFullYear() + years);
  return dt.toISOString().slice(0, 10);
}

export function diffDaysIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = parseIsoDateOnly(fromIso).split('-').map(Number);
  const [ty, tm, td] = parseIsoDateOnly(toIso).split('-').map(Number);
  const fromMs = Date.UTC(fy, (fm || 1) - 1, fd || 1);
  const toMs = Date.UTC(ty, (tm || 1) - 1, td || 1);
  return Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

export function generateDeterministicEppCode(seed: string): string {
  const clean = (seed || 'CPCH').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4) || 'CPCH';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 999983;
  }
  const part2 = String(1000 + (hash % 8999));
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part3 =
    chars[hash % chars.length] +
    chars[(hash >> 3) % chars.length] +
    chars[(hash >> 6) % chars.length] +
    chars[(hash >> 9) % chars.length];
  return `CP-${clean}-${part2}-${part3}`;
}

export function generateFreshEppCode(orderId: string): string {
  const clean = (orderId || 'DOM').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4) || 'DOM';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CP-${clean}-${rand(4)}-${rand(4)}`;
}

export interface DomainLifecycleSummary {
  isStandaloneDomain: boolean;
  registeredDateIso: string;
  dueDateIso: string;
  todayIso: string;
  daysSinceRegistration: number;
  daysRemainingUntilDue: number;
  icann60DayLockActive: boolean;
  icannUnlockDateIso: string;
  daysUntilIcannUnlock: number;
  icannProgressPercent: number;
  isDueDatePassed: boolean;
  isExpired: boolean;
  isPendingAdminApproval: boolean;
  isPendingContactVerification: boolean;
  isContactVerified: boolean;
  isManageLocked: boolean;
  effectiveRegistrarLocked: boolean;
}

export function isDomainOrderRecord(ord: PlatformOrder): boolean {
  return (
    ord.productType === 'Domain Registration' ||
    ord.productType === 'Domain Transfer' ||
    Boolean(ord.nameservers?.length)
  );
}

export function evaluateDomainLifecycle(
  ord: PlatformOrder,
  todayOverride?: string
): DomainLifecycleSummary {
  const todayIso = todayOverride || getTodayIsoUtc();
  const isStandaloneDomain =
    ord.productType === 'Domain Registration' || ord.productType === 'Domain Transfer';

  const registeredDateIso = parseIsoDateOnly(ord.createdAt);
  const dueDateIso = ord.nextDueDate
    ? parseIsoDateOnly(ord.nextDueDate)
    : addYearsToIso(registeredDateIso, ord.billingCycle === '2 Years' ? 2 : 1);

  const daysSinceRegistration = Math.max(0, diffDaysIso(registeredDateIso, todayIso));
  const daysRemainingUntilDue = diffDaysIso(todayIso, dueDateIso);

  const icann60DayLockActive = daysSinceRegistration < ICANN_TRANSFER_LOCK_DAYS;
  const icannUnlockDateIso = addDaysToIso(registeredDateIso, ICANN_TRANSFER_LOCK_DAYS);
  const daysUntilIcannUnlock = Math.max(
    0,
    ICANN_TRANSFER_LOCK_DAYS - daysSinceRegistration
  );
  const icannProgressPercent = Math.min(
    100,
    Math.round((daysSinceRegistration / ICANN_TRANSFER_LOCK_DAYS) * 100)
  );

  const isDueDatePassed = daysRemainingUntilDue < 0;
  const isExpired =
    ord.status === 'expired' ||
    (isDueDatePassed && ord.status !== 'cancelled' && ord.status !== 'refunded');

  const isPendingAdminApproval =
    ord.status === 'pending' &&
    (ord.domainVerificationStatus === 'pending_admin_approval' ||
      ord.productType === 'Domain Registration' ||
      ord.productType === 'Domain Transfer');

  const isPendingContactVerification =
    ord.productType === 'Domain Registration' &&
    ord.status === 'active' &&
    ord.domainVerificationStatus === 'pending_contact_verification';

  // Legacy/seeded active domain records without domainVerificationStatus are treated as verified.
  const isContactVerified =
    ord.domainVerificationStatus === 'verified' ||
    (ord.status === 'active' && !ord.domainVerificationStatus);

  const isManageLocked =
    isExpired ||
    ord.status === 'cancelled' ||
    ord.status === 'refunded' ||
    ord.status === 'suspended' ||
    ord.status === 'pending' ||
    isPendingContactVerification;

  const effectiveRegistrarLocked =
    icann60DayLockActive || ord.registrarLock !== false;

  return {
    isStandaloneDomain,
    registeredDateIso,
    dueDateIso,
    todayIso,
    daysSinceRegistration,
    daysRemainingUntilDue,
    icann60DayLockActive,
    icannUnlockDateIso,
    daysUntilIcannUnlock,
    icannProgressPercent,
    isDueDatePassed,
    isExpired,
    isPendingAdminApproval,
    isPendingContactVerification,
    isContactVerified,
    isManageLocked,
    effectiveRegistrarLocked,
  };
}
