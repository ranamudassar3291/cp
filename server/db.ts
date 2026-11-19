import { Pool } from 'pg';
import crypto from 'node:crypto';
import {
  decryptSecret,
  ENCRYPTED_SECRET_MASK,
  encryptSecret,
  hashPassword,
  isEncryptedSecret,
  isMaskedSecret,
  verifyPassword,
} from './security';
import type { LiveChatSession } from '../src/types/liveChat';

export interface DbIpSecurityRecord {
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

type AnyRecord = Record<string, any>;

let pool: Pool | null = null;
let schemaReady = false;

export function hasDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
}

export function getPool(): Pool {
  if (!pool) {
    const connStr = (process.env.DATABASE_URL || '').trim();
    if (!connStr) {
      throw new Error('DATABASE_URL environment variable is not configured.');
    }
    pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 12000,
    });
  }
  return pool;
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!hasDatabaseConfigured()) return false;
  try {
    const res = await getPool().query('SELECT 1 AS ok');
    return res.rows[0]?.ok === 1;
  } catch (err) {
    console.error('[DB] Connection check failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function initDatabaseSchema(): Promise<void> {
  if (!hasDatabaseConfigured() || schemaReady) return;
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS platform_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'client',
      status TEXT NOT NULL DEFAULT 'active',
      kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
      email_verified BOOLEAN NOT NULL DEFAULT TRUE,
      free_trial_claimed BOOLEAN NOT NULL DEFAULT FALSE,
      signup_ip TEXT NOT NULL DEFAULT '',
      last_ip TEXT NOT NULL DEFAULT '',
      terms_accepted_at_utc TEXT NOT NULL DEFAULT '',
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_orders (
      id TEXT PRIMARY KEY,
      client_email TEXT NOT NULL,
      product_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      domain_or_host TEXT NOT NULL DEFAULT '',
      is_free_trial BOOLEAN NOT NULL DEFAULT FALSE,
      next_due_date TEXT NOT NULL DEFAULT '',
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_invoices (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      due_date TEXT NOT NULL DEFAULT '',
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_tickets (
      id TEXT PRIMARY KEY,
      client_email TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'Support',
      status TEXT NOT NULL DEFAULT 'open',
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_abuse_complaints (
      ticket_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'open',
      target_resource TEXT NOT NULL DEFAULT '',
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_login_activity (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'success',
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_cms_pages (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_hosting_plans (
      id TEXT PRIMARY KEY,
      page_category TEXT NOT NULL,
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_tlds (
      id TEXT PRIMARY KEY,
      tld TEXT NOT NULL,
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_payment_methods (
      id TEXT PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_email_templates (
      id TEXT PRIMARY KEY,
      template_key TEXT NOT NULL DEFAULT '',
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_provisioning_modules (
      id TEXT PRIMARY KEY,
      module_type TEXT NOT NULL,
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_domain_contacts (
      id TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL,
      sort_order BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_kv_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_ip_security (
      ip_address TEXT PRIMARY KEY,
      trial_count INT NOT NULL DEFAULT 0,
      trial_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
      first_trial_order_id TEXT,
      first_trial_at TIMESTAMPTZ,
      blocked BOOLEAN NOT NULL DEFAULT FALSE,
      blocked_reason TEXT,
      blocked_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_live_chat_sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'ai',
      updated_at_ms BIGINT NOT NULL DEFAULT 0,
      expires_at_ms BIGINT NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_platform_orders_email ON platform_orders (LOWER(client_email));
    CREATE INDEX IF NOT EXISTS idx_platform_invoices_email ON platform_invoices (LOWER(client_email));
    CREATE INDEX IF NOT EXISTS idx_platform_tickets_email ON platform_tickets (LOWER(client_email));
  `);
  schemaReady = true;
}

function getSessionSecretKey(): string {
  return (
    process.env.APP_ENCRYPTION_SECRET ||
    process.env.DATABASE_URL ||
    'cpcloudhost-session-signing-secret'
  );
}

export function issueSessionToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email.toLowerCase(),
      role: user.role,
      iat: Date.now(),
    }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecretKey())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(
  token?: string | null
): { id: string; email: string; role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecretKey())
      .update(payload)
      .digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      id?: string;
      email?: string;
      role?: string;
      iat?: number;
    };
    if (!parsed.id || !parsed.email || !parsed.role) return null;
    // Token valid for 14 days
    if (parsed.iat && Date.now() - parsed.iat > 14 * 24 * 60 * 60 * 1000) return null;
    return {
      id: parsed.id,
      email: parsed.email.toLowerCase(),
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function sanitizeUserForClient(raw: AnyRecord): AnyRecord {
  const copy = { ...raw };
  delete copy.passwordSecret;
  delete copy.twoFactorSecret;
  delete copy.twoFactorBackupCodes;
  return copy;
}

function sanitizeOrderForViewer(
  raw: AnyRecord,
  viewer: { email?: string; role?: string } | null
): AnyRecord {
  const isAdmin = viewer?.role === 'admin';
  const isOwner =
    Boolean(viewer?.email) &&
    String(raw.clientEmail || '').toLowerCase() === viewer!.email!.toLowerCase();
  const copy = { ...raw };
  if (isAdmin || isOwner) {
    if (copy.controlPanelPassword) {
      copy.controlPanelPassword = decryptSecret(String(copy.controlPanelPassword));
    }
    if (copy.eppCode) {
      copy.eppCode = decryptSecret(String(copy.eppCode));
    }
  } else {
    if (copy.controlPanelPassword) copy.controlPanelPassword = ENCRYPTED_SECRET_MASK;
    if (copy.eppCode) copy.eppCode = ENCRYPTED_SECRET_MASK;
  }
  return copy;
}

function sanitizeModuleForViewer(raw: AnyRecord, isAdmin: boolean): AnyRecord {
  const copy = { ...raw };
  if (!isAdmin) {
    copy.apiToken = '';
    copy.username = '';
    copy.hostname = '';
  } else {
    copy.apiToken = copy.apiToken ? ENCRYPTED_SECRET_MASK : '';
  }
  return copy;
}

function sanitizeSystemSettingsForViewer(raw: AnyRecord | null, isAdmin: boolean): AnyRecord | null {
  if (!raw) return null;
  const smtp = raw.smtp ? { ...raw.smtp } : {};
  const googleOAuth = raw.googleOAuth ? { ...raw.googleOAuth } : {};
  const adminAlerts = raw.adminAlerts ? { ...raw.adminAlerts } : {};

  const smtpConfigured = Boolean(
    smtp.enabled &&
      String(smtp.host || '').trim() &&
      String(smtp.username || '').trim() &&
      String(smtp.password || '').trim()
  );

  if (isAdmin) {
    smtp.password = smtp.password ? ENCRYPTED_SECRET_MASK : '';
    googleOAuth.clientSecret = googleOAuth.clientSecret ? ENCRYPTED_SECRET_MASK : '';
  } else {
    smtp.username = '';
    smtp.password = '';
    googleOAuth.clientSecret = '';
    googleOAuth.apiKey = '';
  }

  return {
    ...raw,
    smtp: {
      ...smtp,
      configured: smtpConfigured,
    },
    googleOAuth,
    adminAlerts,
  };
}

export async function isDatabaseEmpty(): Promise<boolean> {
  if (!hasDatabaseConfigured()) return false;
  await initDatabaseSchema();
  const p = getPool();
  const res = await p.query(
    `SELECT
      (SELECT COUNT(*)::int FROM platform_users) AS users_cnt,
      (SELECT COUNT(*)::int FROM platform_hosting_plans) AS plans_cnt,
      (SELECT COUNT(*)::int FROM platform_cms_pages) AS cms_cnt`
  );
  const row = res.rows[0] || {};
  return Number(row.users_cnt || 0) === 0 || Number(row.plans_cnt || 0) === 0 || Number(row.cms_cnt || 0) === 0;
}

export async function getBootstrapState(
  viewer: { email?: string; role?: string } | null
): Promise<AnyRecord> {
  await initDatabaseSchema();
  const p = getPool();
  const isAdmin = viewer?.role === 'admin';

  const [
    usersRes,
    ordersRes,
    invoicesRes,
    ticketsRes,
    abuseRes,
    logsRes,
    cmsRes,
    plansRes,
    tldsRes,
    pmRes,
    tplRes,
    promosRes,
    modsRes,
    contactsRes,
    kvRes,
    ipSecRes,
  ] = await Promise.all([
    p.query('SELECT data FROM platform_users ORDER BY updated_at DESC'),
    p.query('SELECT data FROM platform_orders ORDER BY sort_order ASC, updated_at DESC'),
    p.query('SELECT data FROM platform_invoices ORDER BY sort_order ASC, updated_at DESC'),
    p.query('SELECT data FROM platform_tickets ORDER BY sort_order ASC, updated_at DESC'),
    p.query('SELECT data FROM platform_abuse_complaints ORDER BY sort_order ASC, updated_at DESC'),
    p.query('SELECT data FROM platform_login_activity ORDER BY sort_order ASC, updated_at DESC LIMIT 150'),
    p.query('SELECT data FROM platform_cms_pages ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_hosting_plans ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_tlds ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_payment_methods ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_email_templates ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_promo_codes ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_provisioning_modules ORDER BY sort_order ASC'),
    p.query('SELECT data FROM platform_domain_contacts ORDER BY sort_order ASC'),
    p.query('SELECT key, value FROM platform_kv_store'),
    isAdmin
      ? p.query('SELECT * FROM platform_ip_security ORDER BY updated_at DESC')
      : Promise.resolve({ rows: [] as AnyRecord[] }),
  ]);

  const kvMap: Record<string, AnyRecord> = {};
  for (const row of kvRes.rows) {
    kvMap[String(row.key)] = row.value as AnyRecord;
  }

  return {
    users: usersRes.rows.map((r) => sanitizeUserForClient(r.data as AnyRecord)),
    orders: ordersRes.rows.map((r) => sanitizeOrderForViewer(r.data as AnyRecord, viewer)),
    invoices: invoicesRes.rows.map((r) => r.data as AnyRecord),
    tickets: ticketsRes.rows.map((r) => r.data as AnyRecord),
    abuseComplaints: abuseRes.rows.map((r) => r.data as AnyRecord),
    loginActivityLogs: logsRes.rows.map((r) => r.data as AnyRecord),
    cmsPages: cmsRes.rows.map((r) => r.data as AnyRecord),
    hostingPlans: plansRes.rows.map((r) => r.data as AnyRecord),
    tldExtensions: tldsRes.rows.map((r) => r.data as AnyRecord),
    paymentMethods: pmRes.rows.map((r) => r.data as AnyRecord),
    emailTemplates: tplRes.rows.map((r) => r.data as AnyRecord),
    promoCodes: promosRes.rows.map((r) => r.data as AnyRecord),
    provisioningModules: modsRes.rows.map((r) => sanitizeModuleForViewer(r.data as AnyRecord, isAdmin)),
    domainContactAddresses: contactsRes.rows.map((r) => r.data as AnyRecord),
    cmsSiteSettings: kvMap.cms_site_settings || null,
    invoiceTemplateConfig: kvMap.invoice_template_config || null,
    systemSettings: sanitizeSystemSettingsForViewer(kvMap.system_settings || null, isAdmin),
    ipSecurityRecords: isAdmin
      ? ipSecRes.rows.map((r) => ({
          ipAddress: String(r.ip_address),
          trialCount: Number(r.trial_count || 0),
          trialEmails: Array.isArray(r.trial_emails) ? r.trial_emails : [],
          firstTrialOrderId: r.first_trial_order_id || null,
          firstTrialAt: r.first_trial_at ? new Date(r.first_trial_at).toISOString() : null,
          blocked: Boolean(r.blocked),
          blockedReason: r.blocked_reason || null,
          blockedAt: r.blocked_at ? new Date(r.blocked_at).toISOString() : null,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        }))
      : [],
  };
}

export async function syncFullPlatformState(
  payload: AnyRecord,
  options: { isAdmin?: boolean; pruneMissing?: boolean; clientIp?: string } = {}
): Promise<void> {
  if (!hasDatabaseConfigured()) return;
  await initDatabaseSchema();
  const p = getPool();
  const client = await p.connect();

  try {
    await client.query('BEGIN');

    // 1. Users (always preserve existing passwordSecret & 2FA secrets if masked/absent in client payload)
    if (Array.isArray(payload.users)) {
      const existingRes = await client.query('SELECT id, data, free_trial_claimed, signup_ip, last_ip, terms_accepted_at_utc FROM platform_users');
      const existingById = new Map<string, AnyRecord>();
      for (const row of existingRes.rows) {
        existingById.set(String(row.id), {
          ...(row.data as AnyRecord),
          _freeTrialClaimed: row.free_trial_claimed,
          _signupIp: row.signup_ip,
          _lastIp: row.last_ip,
          _termsAcceptedAtUtc: row.terms_accepted_at_utc,
        });
      }

      const incomingIds: string[] = [];
      for (const rawUser of payload.users) {
        if (!rawUser || !rawUser.id || !rawUser.email) continue;
        const id = String(rawUser.id);
        incomingIds.push(id);
        const existing = existingById.get(id);
        const cleanEmail = String(rawUser.email).trim().toLowerCase();
        const cleanUsername = String(rawUser.username || cleanEmail.split('@')[0]).trim().toLowerCase();

        // Password hashing & preservation
        let resolvedPasswordHash = existing?.passwordSecret ? String(existing.passwordSecret) : '';
        const incomingPass = typeof rawUser.passwordSecret === 'string' ? rawUser.passwordSecret.trim() : '';
        if (incomingPass && !isMaskedSecret(incomingPass)) {
          resolvedPasswordHash = hashPassword(incomingPass);
        } else if (!resolvedPasswordHash) {
          resolvedPasswordHash = hashPassword(
            rawUser.role === 'admin' ? 'cpcloud-admin-2026' : 'client-2026'
          );
        }

        // 2FA encryption & preservation
        let twoFactorSecret = existing?.twoFactorSecret ? String(existing.twoFactorSecret) : undefined;
        if (typeof rawUser.twoFactorSecret === 'string' && rawUser.twoFactorSecret.trim() && !isMaskedSecret(rawUser.twoFactorSecret)) {
          twoFactorSecret = encryptSecret(rawUser.twoFactorSecret.trim());
        } else if (rawUser.twoFactorEnabled === false) {
          twoFactorSecret = undefined;
        }

        const freeTrialClaimed = Boolean(rawUser.freeTrialClaimed || existing?._freeTrialClaimed);
        const signupIp = String(rawUser.signupIp || existing?._signupIp || options.clientIp || '');
        const lastIp = String(rawUser.lastIp || existing?._lastIp || options.clientIp || '');
        const termsAcceptedAtUtc = String(rawUser.termsAcceptedAtUtc || existing?._termsAcceptedAtUtc || '');

        const storedUser: AnyRecord = {
          ...rawUser,
          email: cleanEmail,
          username: cleanUsername,
          passwordSecret: resolvedPasswordHash,
          ...(twoFactorSecret ? { twoFactorSecret } : {}),
          freeTrialClaimed,
          ...(signupIp ? { signupIp } : {}),
          ...(lastIp ? { lastIp } : {}),
          ...(termsAcceptedAtUtc ? { termsAcceptedAtUtc } : {}),
        };
        delete storedUser._freeTrialClaimed;
        delete storedUser._signupIp;
        delete storedUser._lastIp;
        delete storedUser._termsAcceptedAtUtc;

        await client.query(
          `INSERT INTO platform_users (id, email, username, name, role, status, kyc_verified, email_verified, free_trial_claimed, signup_ip, last_ip, terms_accepted_at_utc, data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             username = EXCLUDED.username,
             name = EXCLUDED.name,
             role = EXCLUDED.role,
             status = EXCLUDED.status,
             kyc_verified = EXCLUDED.kyc_verified,
             email_verified = EXCLUDED.email_verified,
             free_trial_claimed = platform_users.free_trial_claimed OR EXCLUDED.free_trial_claimed,
             signup_ip = CASE WHEN platform_users.signup_ip <> '' THEN platform_users.signup_ip ELSE EXCLUDED.signup_ip END,
             last_ip = CASE WHEN EXCLUDED.last_ip <> '' THEN EXCLUDED.last_ip ELSE platform_users.last_ip END,
             terms_accepted_at_utc = CASE WHEN EXCLUDED.terms_accepted_at_utc <> '' THEN EXCLUDED.terms_accepted_at_utc ELSE platform_users.terms_accepted_at_utc END,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            id,
            cleanEmail,
            cleanUsername,
            String(rawUser.name || ''),
            String(rawUser.role || 'client'),
            String(rawUser.status || 'active'),
            Boolean(rawUser.kycVerified),
            rawUser.emailVerified !== false,
            freeTrialClaimed,
            signupIp,
            lastIp,
            termsAcceptedAtUtc,
            JSON.stringify(storedUser),
          ]
        );
      }

      if (options.isAdmin && options.pruneMissing && incomingIds.length > 0) {
        await client.query(
          'DELETE FROM platform_users WHERE NOT (id = ANY($1::text[]))',
          [incomingIds]
        );
      }
    }

    // 2. Orders (encrypt controlPanelPassword & eppCode at rest)
    if (Array.isArray(payload.orders)) {
      const existingOrdersRes = await client.query('SELECT id, data FROM platform_orders');
      const existingOrderMap = new Map<string, AnyRecord>();
      for (const r of existingOrdersRes.rows) {
        existingOrderMap.set(String(r.id), r.data as AnyRecord);
      }

      const incomingIds: string[] = [];
      let idx = 0;
      for (const ord of payload.orders) {
        if (!ord || !ord.id) continue;
        const id = String(ord.id);
        incomingIds.push(id);
        const existingOrd = existingOrderMap.get(id);

        const storedOrd: AnyRecord = { ...ord };
        if (typeof ord.controlPanelPassword === 'string' && ord.controlPanelPassword.trim()) {
          if (isMaskedSecret(ord.controlPanelPassword) && existingOrd?.controlPanelPassword) {
            storedOrd.controlPanelPassword = existingOrd.controlPanelPassword;
          } else {
            storedOrd.controlPanelPassword = encryptSecret(ord.controlPanelPassword);
          }
        }
        if (typeof ord.eppCode === 'string' && ord.eppCode.trim()) {
          if (isMaskedSecret(ord.eppCode) && existingOrd?.eppCode) {
            storedOrd.eppCode = existingOrd.eppCode;
          } else {
            storedOrd.eppCode = encryptSecret(ord.eppCode);
          }
        }

        const isFreeTrial = Boolean(
          ord.isFreeTrial || String(ord.promoCode || '').toUpperCase() === 'STARTFREE'
        );

        await client.query(
          `INSERT INTO platform_orders (id, client_email, product_type, status, domain_or_host, is_free_trial, next_due_date, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
           ON CONFLICT (id) DO UPDATE SET
             client_email = EXCLUDED.client_email,
             product_type = EXCLUDED.product_type,
             status = EXCLUDED.status,
             domain_or_host = EXCLUDED.domain_or_host,
             is_free_trial = EXCLUDED.is_free_trial,
             next_due_date = EXCLUDED.next_due_date,
             sort_order = EXCLUDED.sort_order,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            id,
            String(ord.clientEmail || '').toLowerCase(),
            String(ord.productType || 'Shared Cloud'),
            String(ord.status || 'pending'),
            String(ord.domainOrHost || ''),
            isFreeTrial,
            String(ord.nextDueDate || ''),
            idx++,
            JSON.stringify(storedOrd),
          ]
        );
      }
      if (options.isAdmin && options.pruneMissing) {
        if (incomingIds.length === 0) {
          await client.query('DELETE FROM platform_orders');
        } else {
          await client.query('DELETE FROM platform_orders WHERE NOT (id = ANY($1::text[]))', [incomingIds]);
        }
      }
    }

    // 3. Invoices
    if (Array.isArray(payload.invoices)) {
      const incomingIds: string[] = [];
      let idx = 0;
      for (const inv of payload.invoices) {
        if (!inv || !inv.id) continue;
        const id = String(inv.id);
        incomingIds.push(id);
        await client.query(
          `INSERT INTO platform_invoices (id, order_id, client_email, status, due_date, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
           ON CONFLICT (id) DO UPDATE SET
             order_id = EXCLUDED.order_id,
             client_email = EXCLUDED.client_email,
             status = EXCLUDED.status,
             due_date = EXCLUDED.due_date,
             sort_order = EXCLUDED.sort_order,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            id,
            String(inv.orderId || ''),
            String(inv.clientEmail || '').toLowerCase(),
            String(inv.status || 'unpaid'),
            String(inv.dueDate || ''),
            idx++,
            JSON.stringify(inv),
          ]
        );
      }
      if (options.isAdmin && options.pruneMissing) {
        if (incomingIds.length === 0) {
          await client.query('DELETE FROM platform_invoices');
        } else {
          await client.query('DELETE FROM platform_invoices WHERE NOT (id = ANY($1::text[]))', [incomingIds]);
        }
      }
    }

    // 4. Tickets
    if (Array.isArray(payload.tickets)) {
      const incomingIds: string[] = [];
      let idx = 0;
      for (const tkt of payload.tickets) {
        if (!tkt || !tkt.id) continue;
        const id = String(tkt.id);
        incomingIds.push(id);
        await client.query(
          `INSERT INTO platform_tickets (id, client_email, department, status, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW())
           ON CONFLICT (id) DO UPDATE SET
             client_email = EXCLUDED.client_email,
             department = EXCLUDED.department,
             status = EXCLUDED.status,
             sort_order = EXCLUDED.sort_order,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            id,
            String(tkt.clientEmail || '').toLowerCase(),
            String(tkt.department || 'Support'),
            String(tkt.status || 'open'),
            idx++,
            JSON.stringify(tkt),
          ]
        );
      }
      if (options.isAdmin && options.pruneMissing) {
        if (incomingIds.length === 0) {
          await client.query('DELETE FROM platform_tickets');
        } else {
          await client.query('DELETE FROM platform_tickets WHERE NOT (id = ANY($1::text[]))', [incomingIds]);
        }
      }
    }

    // 5. Abuse Complaints
    if (Array.isArray(payload.abuseComplaints)) {
      const incomingIds: string[] = [];
      let idx = 0;
      for (const ab of payload.abuseComplaints) {
        if (!ab || !ab.ticketId) continue;
        const id = String(ab.ticketId);
        incomingIds.push(id);
        await client.query(
          `INSERT INTO platform_abuse_complaints (ticket_id, status, target_resource, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,$5,NOW())
           ON CONFLICT (ticket_id) DO UPDATE SET
             status = EXCLUDED.status,
             target_resource = EXCLUDED.target_resource,
             sort_order = EXCLUDED.sort_order,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            id,
            String(ab.status || 'open'),
            String(ab.targetResource || ''),
            idx++,
            JSON.stringify(ab),
          ]
        );
      }
      if (options.isAdmin && options.pruneMissing) {
        if (incomingIds.length === 0) {
          await client.query('DELETE FROM platform_abuse_complaints');
        } else {
          await client.query('DELETE FROM platform_abuse_complaints WHERE NOT (ticket_id = ANY($1::text[]))', [incomingIds]);
        }
      }
    }

    // 6. Login Activity Logs
    if (Array.isArray(payload.loginActivityLogs)) {
      let idx = 0;
      for (const log of payload.loginActivityLogs.slice(0, 120)) {
        if (!log || !log.id) continue;
        await client.query(
          `INSERT INTO platform_login_activity (id, user_email, ip_address, status, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW())
           ON CONFLICT (id) DO UPDATE SET
             user_email = EXCLUDED.user_email,
             ip_address = EXCLUDED.ip_address,
             status = EXCLUDED.status,
             sort_order = EXCLUDED.sort_order,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            String(log.id),
            String(log.userEmail || '').toLowerCase(),
            String(log.ipAddress || options.clientIp || ''),
            String(log.status || 'success'),
            idx++,
            JSON.stringify(log),
          ]
        );
      }
    }

    // 7. Domain Contacts
    if (Array.isArray(payload.domainContactAddresses)) {
      const incomingIds: string[] = [];
      let idx = 0;
      for (const c of payload.domainContactAddresses) {
        if (!c || !c.id) continue;
        const id = String(c.id);
        incomingIds.push(id);
        await client.query(
          `INSERT INTO platform_domain_contacts (id, owner_email, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (id) DO UPDATE SET
             owner_email = EXCLUDED.owner_email,
             sort_order = EXCLUDED.sort_order,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [id, String(c.ownerEmail || '').toLowerCase(), idx++, JSON.stringify(c)]
        );
      }
      if (options.isAdmin && options.pruneMissing) {
        if (incomingIds.length === 0) {
          await client.query('DELETE FROM platform_domain_contacts');
        } else {
          await client.query('DELETE FROM platform_domain_contacts WHERE NOT (id = ANY($1::text[]))', [incomingIds]);
        }
      }
    }

    // Admin-managed catalog & config tables (only accept updates when isAdmin OR when seeding empty tables)
    const allowCatalogWrite = Boolean(options.isAdmin || payload._seedIfEmpty);

    if (allowCatalogWrite && Array.isArray(payload.cmsPages)) {
      const ids: string[] = [];
      let idx = 0;
      for (const page of payload.cmsPages) {
        if (!page || !page.id) continue;
        ids.push(String(page.id));
        await client.query(
          `INSERT INTO platform_cms_pages (id, slug, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
          [String(page.id), String(page.slug || ''), idx++, JSON.stringify(page)]
        );
      }
      if (options.isAdmin && options.pruneMissing && ids.length > 0) {
        await client.query('DELETE FROM platform_cms_pages WHERE NOT (id = ANY($1::text[]))', [ids]);
      }
    }

    if (allowCatalogWrite && Array.isArray(payload.hostingPlans)) {
      const ids: string[] = [];
      let idx = 0;
      for (const plan of payload.hostingPlans) {
        if (!plan || !plan.id) continue;
        ids.push(String(plan.id));
        await client.query(
          `INSERT INTO platform_hosting_plans (id, page_category, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (id) DO UPDATE SET page_category = EXCLUDED.page_category, sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
          [String(plan.id), String(plan.pageCategory || 'shared-hosting'), idx++, JSON.stringify(plan)]
        );
      }
      if (options.isAdmin && options.pruneMissing && ids.length > 0) {
        await client.query('DELETE FROM platform_hosting_plans WHERE NOT (id = ANY($1::text[]))', [ids]);
      }
    }

    if (allowCatalogWrite && Array.isArray(payload.tldExtensions)) {
      const ids: string[] = [];
      let idx = 0;
      for (const tld of payload.tldExtensions) {
        if (!tld || !tld.id) continue;
        ids.push(String(tld.id));
        await client.query(
          `INSERT INTO platform_tlds (id, tld, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (id) DO UPDATE SET tld = EXCLUDED.tld, sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
          [String(tld.id), String(tld.tld || ''), idx++, JSON.stringify(tld)]
        );
      }
      if (options.isAdmin && options.pruneMissing && ids.length > 0) {
        await client.query('DELETE FROM platform_tlds WHERE NOT (id = ANY($1::text[]))', [ids]);
      }
    }

    if (allowCatalogWrite && Array.isArray(payload.paymentMethods)) {
      const ids: string[] = [];
      for (const pm of payload.paymentMethods) {
        if (!pm || !pm.id) continue;
        ids.push(String(pm.id));
        await client.query(
          `INSERT INTO platform_payment_methods (id, sort_order, data, updated_at)
           VALUES ($1,$2,$3,NOW())
           ON CONFLICT (id) DO UPDATE SET sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
          [String(pm.id), Number(pm.sortOrder || 0), JSON.stringify(pm)]
        );
      }
      if (options.isAdmin && options.pruneMissing && ids.length > 0) {
        await client.query('DELETE FROM platform_payment_methods WHERE NOT (id = ANY($1::text[]))', [ids]);
      }
    }

    if (allowCatalogWrite && Array.isArray(payload.emailTemplates)) {
      const ids: string[] = [];
      let idx = 0;
      for (const tpl of payload.emailTemplates) {
        if (!tpl || !tpl.id) continue;
        ids.push(String(tpl.id));
        await client.query(
          `INSERT INTO platform_email_templates (id, template_key, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (id) DO UPDATE SET template_key = EXCLUDED.template_key, sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
          [String(tpl.id), String(tpl.key || tpl.id), idx++, JSON.stringify(tpl)]
        );
      }
      if (options.isAdmin && options.pruneMissing && ids.length > 0) {
        await client.query('DELETE FROM platform_email_templates WHERE NOT (id = ANY($1::text[]))', [ids]);
      }
    }

    if (Array.isArray(payload.promoCodes)) {
      const ids: string[] = [];
      let idx = 0;
      for (const pr of payload.promoCodes) {
        if (!pr || !pr.id) continue;
        ids.push(String(pr.id));
        if (allowCatalogWrite) {
          await client.query(
            `INSERT INTO platform_promo_codes (id, code, sort_order, data, updated_at)
             VALUES ($1,$2,$3,$4,NOW())
             ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
            [String(pr.id), String(pr.code || ''), idx++, JSON.stringify(pr)]
          );
        }
      }
      if (options.isAdmin && options.pruneMissing && ids.length > 0) {
        await client.query('DELETE FROM platform_promo_codes WHERE NOT (id = ANY($1::text[]))', [ids]);
      }
    }

    // Provisioning Modules (WHM tokens encrypted via AES-256-GCM; masked token preserves existing DB ciphertext)
    if (allowCatalogWrite && Array.isArray(payload.provisioningModules)) {
      const existingModRes = await client.query('SELECT id, data FROM platform_provisioning_modules');
      const existingMods = new Map<string, AnyRecord>();
      for (const r of existingModRes.rows) {
        existingMods.set(String(r.id), r.data as AnyRecord);
      }

      const ids: string[] = [];
      let idx = 0;
      for (const mod of payload.provisioningModules) {
        if (!mod || !mod.id) continue;
        const id = String(mod.id);
        ids.push(id);
        const existingMod = existingMods.get(id);
        const incomingToken = typeof mod.apiToken === 'string' ? mod.apiToken.trim() : '';
        let storedToken = '';
        if (isMaskedSecret(incomingToken) && existingMod?.apiToken) {
          storedToken = String(existingMod.apiToken);
        } else if (incomingToken) {
          storedToken = encryptSecret(incomingToken);
        } else if (existingMod?.apiToken && !options.isAdmin) {
          storedToken = String(existingMod.apiToken);
        }

        const storedMod: AnyRecord = {
          ...mod,
          apiToken: storedToken,
        };
        await client.query(
          `INSERT INTO platform_provisioning_modules (id, module_type, sort_order, data, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (id) DO UPDATE SET module_type = EXCLUDED.module_type, sort_order = EXCLUDED.sort_order, data = EXCLUDED.data, updated_at = NOW()`,
          [id, String(mod.moduleType || 'whm'), idx++, JSON.stringify(storedMod)]
        );
      }
      if (options.isAdmin && options.pruneMissing) {
        if (ids.length === 0) {
          await client.query('DELETE FROM platform_provisioning_modules');
        } else {
          await client.query('DELETE FROM platform_provisioning_modules WHERE NOT (id = ANY($1::text[]))', [ids]);
        }
      }
    }

    // KV stores
    if (allowCatalogWrite && payload.cmsSiteSettings) {
      await client.query(
        `INSERT INTO platform_kv_store (key, value, updated_at)
         VALUES ('cms_site_settings', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(payload.cmsSiteSettings)]
      );
    }
    if (allowCatalogWrite && payload.invoiceTemplateConfig) {
      await client.query(
        `INSERT INTO platform_kv_store (key, value, updated_at)
         VALUES ('invoice_template_config', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(payload.invoiceTemplateConfig)]
      );
    }
    if (allowCatalogWrite && payload.systemSettings) {
      const prevRes = await client.query(`SELECT value FROM platform_kv_store WHERE key = 'system_settings'`);
      const prevSettings = (prevRes.rows[0]?.value || {}) as AnyRecord;
      const incoming = payload.systemSettings as AnyRecord;

      const incSmtp = (incoming.smtp || {}) as AnyRecord;
      const prevSmtp = (prevSettings.smtp || {}) as AnyRecord;
      const incPass = typeof incSmtp.password === 'string' ? incSmtp.password.trim() : '';
      const storedSmtpPass = isMaskedSecret(incPass)
        ? String(prevSmtp.password || '')
        : incPass
          ? encryptSecret(incPass)
          : '';

      const incGoogle = (incoming.googleOAuth || {}) as AnyRecord;
      const prevGoogle = (prevSettings.googleOAuth || {}) as AnyRecord;
      const incGoogleSecret = typeof incGoogle.clientSecret === 'string' ? incGoogle.clientSecret.trim() : '';
      const storedGoogleSecret = isMaskedSecret(incGoogleSecret)
        ? String(prevGoogle.clientSecret || '')
        : incGoogleSecret
          ? encryptSecret(incGoogleSecret)
          : '';

      const storedSettings: AnyRecord = {
        ...incoming,
        smtp: {
          ...incSmtp,
          password: storedSmtpPass,
        },
        googleOAuth: {
          ...incGoogle,
          clientSecret: storedGoogleSecret,
        },
      };

      await client.query(
        `INSERT INTO platform_kv_store (key, value, updated_at)
         VALUES ('system_settings', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(storedSettings)]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function resolveSmtpCredentialsFromDb(): Promise<{
  enabled: boolean;
  host: string;
  port: number;
  encryption: 'ssl' | 'tls' | 'none';
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
} | null> {
  if (!hasDatabaseConfigured()) return null;
  await initDatabaseSchema();
  const res = await getPool().query(`SELECT value FROM platform_kv_store WHERE key = 'system_settings'`);
  const settings = (res.rows[0]?.value || null) as AnyRecord | null;
  if (!settings || !settings.smtp) return null;
  const smtp = settings.smtp as AnyRecord;
  return {
    enabled: Boolean(smtp.enabled),
    host: String(smtp.host || '').trim(),
    port: Number(smtp.port || 465),
    encryption: (smtp.encryption === 'tls' || smtp.encryption === 'none' ? smtp.encryption : 'ssl'),
    username: String(smtp.username || '').trim(),
    password: decryptSecret(String(smtp.password || '')),
    fromName: String(smtp.fromName || 'CPCloudHost').trim(),
    fromEmail: String(smtp.fromEmail || smtp.username || '').trim(),
  };
}

export async function resolveWhmTokenFromDb(input: {
  moduleId?: string;
  hostname?: string;
  apiToken?: string;
}): Promise<string> {
  const candidate = (input.apiToken || '').trim();
  if (candidate && !isMaskedSecret(candidate)) {
    return isEncryptedSecret(candidate) ? decryptSecret(candidate) : candidate;
  }
  if (!hasDatabaseConfigured()) return '';
  await initDatabaseSchema();
  const p = getPool();
  if (input.moduleId) {
    const res = await p.query('SELECT data FROM platform_provisioning_modules WHERE id = $1', [input.moduleId]);
    const mod = res.rows[0]?.data as AnyRecord | undefined;
    if (mod?.apiToken) return decryptSecret(String(mod.apiToken));
  }
  if (input.hostname) {
    const cleanHost = input.hostname.trim().toLowerCase();
    const res = await p.query('SELECT data FROM platform_provisioning_modules');
    for (const row of res.rows) {
      const mod = row.data as AnyRecord;
      if (String(mod.hostname || '').trim().toLowerCase() === cleanHost && mod.apiToken) {
        return decryptSecret(String(mod.apiToken));
      }
    }
  }
  return '';
}

export async function resolveWhmModuleConfigFromDb(moduleId?: string): Promise<{
  id: string;
  hostname: string;
  port: number;
  useSsl: boolean;
  username: string;
  apiToken: string;
  ignoreSslErrors: boolean;
} | null> {
  if (!hasDatabaseConfigured()) return null;
  await initDatabaseSchema();
  const p = getPool();
  const res = moduleId
    ? await p.query('SELECT id, data FROM platform_provisioning_modules WHERE id = $1 LIMIT 1', [moduleId])
    : await p.query(`SELECT id, data FROM platform_provisioning_modules WHERE module_type = 'whm' ORDER BY sort_order ASC LIMIT 1`);
  const row = res.rows[0];
  if (!row) return null;
  const mod = row.data as AnyRecord;
  if (!mod.enabled) return null;
  return {
    id: String(row.id),
    hostname: String(mod.hostname || '').trim(),
    port: Number(mod.port || 2087),
    useSsl: mod.useSsl !== false,
    username: String(mod.username || '').trim(),
    apiToken: decryptSecret(String(mod.apiToken || '')),
    ignoreSslErrors: Boolean(mod.ignoreSslErrors),
  };
}

export async function isIpBlocked(ipAddress: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!hasDatabaseConfigured() || !ipAddress) return { blocked: false };
  await initDatabaseSchema();
  const res = await getPool().query(
    'SELECT blocked, blocked_reason FROM platform_ip_security WHERE ip_address = $1',
    [ipAddress]
  );
  const row = res.rows[0];
  if (!row || !row.blocked) return { blocked: false };
  return {
    blocked: true,
    reason:
      String(row.blocked_reason || '') ||
      'Access blocked due to multiple free trial abuse detected from this IP address.',
  };
}

export async function adminSetIpBlockedStatus(
  ipAddress: string,
  blocked: boolean,
  reason?: string
): Promise<void> {
  if (!hasDatabaseConfigured() || !ipAddress) return;
  await initDatabaseSchema();
  await getPool().query(
    `INSERT INTO platform_ip_security (ip_address, blocked, blocked_reason, blocked_at, updated_at)
     VALUES ($1, $2, $3, CASE WHEN $2 THEN NOW() ELSE NULL END, NOW())
     ON CONFLICT (ip_address) DO UPDATE SET
       blocked = EXCLUDED.blocked,
       blocked_reason = CASE WHEN EXCLUDED.blocked THEN EXCLUDED.blocked_reason ELSE NULL END,
       blocked_at = CASE WHEN EXCLUDED.blocked THEN NOW() ELSE NULL END,
       updated_at = NOW()`,
    [ipAddress.trim(), blocked, blocked ? reason || 'Blocked by Administrator' : null]
  );
}

export async function verifyUserLoginInDb(input: {
  identifier: string;
  password: string;
  portal: 'client' | 'admin';
  clientIp: string;
}): Promise<{
  ok: boolean;
  error?: string;
  user?: AnyRecord;
  token?: string;
  requiresEmailVerification?: boolean;
  unverifiedEmail?: string;
}> {
  await initDatabaseSchema();
  const p = getPool();
  const norm = input.identifier.trim().toLowerCase();

  // Check IP block before client authentication (admins on /admin/wp are exempt so owners never lock themselves out)
  if (input.portal !== 'admin') {
    const ipBlock = await isIpBlocked(input.clientIp);
    if (ipBlock.blocked) {
      return {
        ok: false,
        error:
          ipBlock.reason ||
          'Access denied: Your IP address has been automatically blocked due to free-trial abuse.',
      };
    }
  }

  const res = await p.query(
    'SELECT id, email, username, role, status, email_verified, data FROM platform_users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1',
    [norm]
  );
  const row = res.rows[0];
  if (!row) {
    return { ok: false, error: 'Invalid username, email, or password.' };
  }

  const userData = row.data as AnyRecord;
  const storedHash = String(
    userData.passwordSecret || (row.role === 'admin' ? 'cpcloud-admin-2026' : 'client-2026')
  );
  if (!verifyPassword(input.password, storedHash)) {
    return { ok: false, error: 'Invalid username, email, or password.' };
  }

  if (row.status === 'suspended' || row.status === 'cancelled') {
    return {
      ok: false,
      error:
        row.status === 'cancelled'
          ? 'This account has been cancelled. Contact billing@cpcloudhost.com for reinstatement.'
          : 'This account has been suspended due to policy or abuse review. Contact support@cpcloudhost.com.',
    };
  }

  if (input.portal === 'admin' && row.role !== 'admin') {
    return { ok: false, error: 'Access denied. Authorized staff credentials are required.' };
  }

  if (input.portal === 'client' && row.role !== 'admin' && row.email_verified === false) {
    return {
      ok: false,
      requiresEmailVerification: true,
      unverifiedEmail: String(row.email),
      error: 'Please enter the 6-digit verification code sent to your email address to activate sign-in.',
    };
  }

  // Transparently upgrade legacy plaintext password -> scrypt hash + record last_ip
  const upgradedHash = hashPassword(input.password);
  const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const nextData: AnyRecord = {
    ...userData,
    passwordSecret: upgradedHash,
    lastLoginAt: nowUtc,
    lastIp: input.clientIp,
  };
  await p.query(
    'UPDATE platform_users SET data = $2, last_ip = $3, updated_at = NOW() WHERE id = $1',
    [row.id, JSON.stringify(nextData), input.clientIp]
  );

  const token = issueSessionToken({
    id: String(row.id),
    email: String(row.email),
    role: String(row.role),
  });

  return {
    ok: true,
    user: sanitizeUserForClient(nextData),
    token,
  };
}

export async function updateUserPasswordInDb(input: {
  emailOrId: string;
  currentPassword?: string;
  newPassword: string;
  requireCurrentPassword: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  await initDatabaseSchema();
  const p = getPool();
  const key = input.emailOrId.trim().toLowerCase();
  const res = await p.query(
    'SELECT id, role, data FROM platform_users WHERE LOWER(id) = $1 OR LOWER(email) = $1 LIMIT 1',
    [key]
  );
  const row = res.rows[0];
  if (!row) {
    return { ok: false, error: 'Account record not found.' };
  }
  const userData = row.data as AnyRecord;
  if (input.requireCurrentPassword) {
    const storedHash = String(
      userData.passwordSecret || (row.role === 'admin' ? 'cpcloud-admin-2026' : 'client-2026')
    );
    if (!verifyPassword(input.currentPassword || '', storedHash)) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
  }
  if (input.newPassword.trim().length < 8) {
    return { ok: false, error: 'New password must be at least 8 characters long.' };
  }
  const hashed = hashPassword(input.newPassword.trim());
  const nextData = { ...userData, passwordSecret: hashed };
  await p.query('UPDATE platform_users SET data = $2, updated_at = NOW() WHERE id = $1', [
    row.id,
    JSON.stringify(nextData),
  ]);
  return { ok: true };
}

export async function validateAndRecordFreeTrial(input: {
  email: string;
  clientIp: string;
  orderId?: string;
  commitTrialClaim?: boolean;
}): Promise<{
  ok: boolean;
  allowed: boolean;
  ipBlocked?: boolean;
  accountSuspended?: boolean;
  error?: string;
}> {
  if (!hasDatabaseConfigured()) {
    return { ok: true, allowed: true };
  }
  await initDatabaseSchema();
  const p = getPool();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanIp = input.clientIp || '127.0.0.1';

  // 1. Check if IP is already blocked
  const ipRowRes = await p.query(
    'SELECT * FROM platform_ip_security WHERE ip_address = $1',
    [cleanIp]
  );
  const ipRow = ipRowRes.rows[0];
  if (ipRow?.blocked) {
    // Ensure requesting non-admin account is also suspended if attempting from blocked IP
    await p.query(
      `UPDATE platform_users
       SET status = 'suspended',
           data = jsonb_set(data, '{status}', '"suspended"'::jsonb),
           updated_at = NOW()
       WHERE LOWER(email) = $1 AND role <> 'admin'`,
      [cleanEmail]
    );
    return {
      ok: false,
      allowed: false,
      ipBlocked: true,
      accountSuspended: true,
      error:
        'Security Block: This IP address is permanently blocked due to multiple free trial attempts.',
    };
  }

  // 2. Check if THIS account already used a free trial across ANY plan
  const acctOrdersRes = await p.query(
    `SELECT COUNT(*)::int AS cnt FROM platform_orders
     WHERE LOWER(client_email) = $1 AND is_free_trial = TRUE`,
    [cleanEmail]
  );
  const acctUserRes = await p.query(
    'SELECT free_trial_claimed, role FROM platform_users WHERE LOWER(email) = $1 LIMIT 1',
    [cleanEmail]
  );
  const hasUsedTrialOnAccount =
    Number(acctOrdersRes.rows[0]?.cnt || 0) > 0 ||
    Boolean(acctUserRes.rows[0]?.free_trial_claimed);

  if (hasUsedTrialOnAccount) {
    return {
      ok: false,
      allowed: false,
      error:
        'Each client account is strictly limited to 1 Free Trial across all hosting plans.',
    };
  }

  // 3. Check if ANOTHER account already claimed a free trial from the SAME IP address!
  if (ipRow && Number(ipRow.trial_count || 0) >= 1) {
    const existingEmails: string[] = Array.isArray(ipRow.trial_emails)
      ? ipRow.trial_emails.map((e: unknown) => String(e).toLowerCase())
      : [];
    const affectedEmails = Array.from(new Set([...existingEmails, cleanEmail]));
    const blockReason = `Auto-blocked IP (${cleanIp}) and suspended client accounts (${affectedEmails.join(', ')}) for attempting multiple Free Trials from the same IP.`;
    const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    // Block the IP
    await p.query(
      `UPDATE platform_ip_security
       SET blocked = TRUE,
           trial_count = trial_count + 1,
           trial_emails = $2,
           blocked_reason = $3,
           blocked_at = NOW(),
           updated_at = NOW()
       WHERE ip_address = $1`,
      [cleanIp, JSON.stringify(affectedEmails), blockReason]
    );

    // Suspend all involved non-admin client accounts (both new + prior accounts on same IP)
    await p.query(
      `UPDATE platform_users
       SET status = 'suspended',
           data = jsonb_set(data, '{status}', '"suspended"'::jsonb),
           updated_at = NOW()
       WHERE role <> 'admin' AND (LOWER(email) = ANY($1::text[]) OR signup_ip = $2 OR last_ip = $2)`,
      [affectedEmails, cleanIp]
    );

    // Record Abuse & Security log entries in Supabase
    const abuseId = `ABUSE-IP-${Date.now().toString().slice(-6)}`;
    const abuseRecord = {
      ticketId: abuseId,
      category: 'free_trial_ip_abuse',
      categoryLabel: 'Free Trial Multi-Account IP Abuse (Auto-Blocked)',
      severity: 'P0 Critical',
      slaTarget: 'Automated Immediate Action',
      targetResource: `${cleanIp} · ${cleanEmail}`,
      reporterName: 'CPCloudHost Anti-Abuse Engine',
      organization: 'Automated Security Guard',
      reporterEmail: 'security@cpcloudhost.com',
      country: 'Global',
      incidentUtc: nowUtc,
      evidenceDetails: blockReason,
      submittedAtUtc: nowUtc,
      status: 'suspended_target',
      moderatorNotes: blockReason,
      moderatedBy: 'Automated Anti-Abuse System',
      updatedAtUtc: nowUtc,
    };
    await p.query(
      `INSERT INTO platform_abuse_complaints (ticket_id, status, target_resource, sort_order, data, updated_at)
       VALUES ($1, 'suspended_target', $2, 0, $3, NOW())
       ON CONFLICT (ticket_id) DO NOTHING`,
      [abuseId, `${cleanIp} · ${cleanEmail}`, JSON.stringify(abuseRecord)]
    );

    const logId = `LOG-${Math.floor(100000 + Math.random() * 899999)}`;
    const logRecord = {
      id: logId,
      userEmail: cleanEmail,
      userName: cleanEmail.split('@')[0],
      eventType: 'Suspended Account Blocked',
      status: 'blocked',
      authMethod: 'Free Trial Multi-IP Abuse Guard',
      deviceSummary: 'Server Anti-Abuse Rule',
      ipAddress: cleanIp,
      locationLabel: 'Automated Firewall',
      timestampUtc: nowUtc,
    };
    await p.query(
      `INSERT INTO platform_login_activity (id, user_email, ip_address, status, sort_order, data, updated_at)
       VALUES ($1, $2, $3, 'blocked', 0, $4, NOW())`,
      [logId, cleanEmail, cleanIp, JSON.stringify(logRecord)]
    );

    return {
      ok: false,
      allowed: false,
      ipBlocked: true,
      accountSuspended: true,
      error:
        'Security Alert: Multiple Free Trials from the same IP address are prohibited. Your account and IP address have been automatically blocked.',
    };
  }

  // 4. Record legitimate 1st Free Trial claim if requested
  if (input.commitTrialClaim) {
    await p.query(
      `UPDATE platform_users
       SET free_trial_claimed = TRUE,
           data = jsonb_set(data, '{freeTrialClaimed}', 'true'::jsonb),
           updated_at = NOW()
       WHERE LOWER(email) = $1`,
      [cleanEmail]
    );
    await p.query(
      `INSERT INTO platform_ip_security (ip_address, trial_count, trial_emails, first_trial_order_id, first_trial_at, blocked, updated_at)
       VALUES ($1, 1, $2, $3, NOW(), FALSE, NOW())
       ON CONFLICT (ip_address) DO UPDATE SET
         trial_count = GREATEST(platform_ip_security.trial_count, 1),
         trial_emails = $2,
         first_trial_order_id = COALESCE(platform_ip_security.first_trial_order_id, EXCLUDED.first_trial_order_id),
         first_trial_at = COALESCE(platform_ip_security.first_trial_at, NOW()),
         updated_at = NOW()`,
      [cleanIp, JSON.stringify([cleanEmail]), input.orderId || null]
    );
  }

  return { ok: true, allowed: true };
}

function addDaysToIsoDate(baseIso: string, days: number): string {
  const d = new Date(`${baseIso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return baseIso;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonthsToIsoDate(baseIso: string, months: number): string {
  const d = new Date(`${baseIso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return baseIso;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export async function runAutomatedTrialAndRenewalBilling(
  sendEmailFn?: (opts: {
    toEmail: string;
    subject: string;
    heading: string;
    body: string;
  }) => Promise<void>
): Promise<{ convertedTrials: number; generatedInvoices: number }> {
  if (!hasDatabaseConfigured()) {
    return { convertedTrials: 0, generatedInvoices: 0 };
  }
  await initDatabaseSchema();
  const p = getPool();
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  const [ordersRes, plansRes] = await Promise.all([
    p.query(
      `SELECT id, data FROM platform_orders
       WHERE is_free_trial = TRUE AND status = 'active' AND next_due_date <> '' AND next_due_date <= $1`,
      [todayIso]
    ),
    p.query('SELECT data FROM platform_hosting_plans'),
  ]);

  const plansByName = new Map<string, AnyRecord>();
  for (const r of plansRes.rows) {
    const plan = r.data as AnyRecord;
    if (plan.name) plansByName.set(String(plan.name).toLowerCase(), plan);
  }

  let convertedTrials = 0;
  let generatedInvoices = 0;

  for (const row of ordersRes.rows) {
    const ord = row.data as AnyRecord;
    if (ord.autoRenew === false) continue;

    const matchedPlan = plansByName.get(String(ord.planName || '').toLowerCase());
    const monthlyRate =
      Number(ord.recurringMonthlyUsd || 0) > 0
        ? Number(ord.recurringMonthlyUsd)
        : Number(matchedPlan?.monthlyPrice || matchedPlan?.renewalPrice || 4.99);

    const nextCycleDue = addMonthsToIsoDate(todayIso, 1);
    const invId = `INV-TRL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 899)}`;

    const updatedOrder: AnyRecord = {
      ...ord,
      isFreeTrial: false,
      trialConvertedAtUtc: nowUtc,
      billingCycle: '1 Month',
      amountUsd: monthlyRate,
      recurringMonthlyUsd: monthlyRate,
      invoicePaid: false,
      nextDueDate: nextCycleDue,
      notes: `${ord.notes ? `${ord.notes} · ` : ''}Free Trial ended on ${todayIso}. Auto-converted to Monthly Billing ($${monthlyRate.toFixed(2)}/mo).`,
    };

    const renewalInvoice: AnyRecord = {
      id: invId,
      orderId: String(ord.id),
      clientEmail: String(ord.clientEmail || '').toLowerCase(),
      clientName: String(ord.clientName || 'Client'),
      productType: ord.productType || 'Shared Cloud',
      planName: `${ord.planName} (Monthly Renewal After Free Trial)`,
      domainOrHost: String(ord.domainOrHost || ''),
      billingCycle: '1 Month',
      items: [
        {
          id: `ITEM-${invId}`,
          description: `${ord.planName} — Post-Trial Monthly Hosting Renewal`,
          productType: ord.productType || 'Shared Cloud',
          domainOrHost: String(ord.domainOrHost || ''),
          billingCycle: '1 Month',
          quantity: 1,
          unitPriceUsd: monthlyRate,
          lineTotalUsd: monthlyRate,
        },
      ],
      subtotalUsd: monthlyRate,
      taxRatePercent: 0,
      discountUsd: 0,
      amountUsd: monthlyRate,
      issuedDate: todayIso,
      dueDate: addDaysToIsoDate(todayIso, 3),
      status: 'unpaid',
      paymentMethod: String(ord.paymentMethod || 'Pending Payment'),
      datacenter: String(ord.datacenter || 'London, UK'),
      autoGeneratedAt: nowUtc,
      autoGeneratedTrigger: 'order_created',
      notes: `30-Day Free Trial completed for ${ord.domainOrHost}. Monthly subscription invoice auto-generated for next billing period.`,
    };

    await p.query(
      `UPDATE platform_orders
       SET is_free_trial = FALSE,
           next_due_date = $2,
           data = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [String(ord.id), nextCycleDue, JSON.stringify(updatedOrder)]
    );

    await p.query(
      `INSERT INTO platform_invoices (id, order_id, client_email, status, due_date, sort_order, data, updated_at)
       VALUES ($1, $2, $3, 'unpaid', $4, 0, $5, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [invId, String(ord.id), renewalInvoice.clientEmail, renewalInvoice.dueDate, JSON.stringify(renewalInvoice)]
    );

    convertedTrials += 1;
    generatedInvoices += 1;

    if (sendEmailFn && renewalInvoice.clientEmail) {
      await sendEmailFn({
        toEmail: renewalInvoice.clientEmail,
        subject: `[CPCloudHost] Invoice ${invId} — Free Trial Converted to Monthly Plan ($${monthlyRate.toFixed(2)})`,
        heading: `30-Day Free Trial Completed — Monthly Renewal Invoice ${invId}`,
        body: [
          `Hello ${renewalInvoice.clientName},`,
          '',
          `Your 30-day Free Trial for ${ord.planName} (${ord.domainOrHost}) has completed and automatically transitioned to standard monthly billing ($${monthlyRate.toFixed(2)} USD/month).`,
          `Invoice ${invId} has been generated with due date ${renewalInvoice.dueDate}. Please settle it in your Client Portal -> Billing & Invoices to keep your website online without interruption.`,
        ].join('\n'),
      }).catch(() => undefined);
    }
  }

  return { convertedTrials, generatedInvoices };
}

// =========================================================================
// LIVE CHAT POSTGRESQL PERSISTENCE
// =========================================================================
export async function loadLiveChatSessionsFromDb(): Promise<LiveChatSession[]> {
  if (!hasDatabaseConfigured()) return [];
  try {
    await initDatabaseSchema();
    const res = await getPool().query(
      'SELECT data FROM platform_live_chat_sessions ORDER BY updated_at_ms DESC'
    );
    return res.rows.map((r) => r.data as LiveChatSession);
  } catch (err) {
    console.error('[DB] Failed to load live chat sessions:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function upsertLiveChatSessionInDb(session: LiveChatSession): Promise<void> {
  if (!hasDatabaseConfigured()) return;
  try {
    await initDatabaseSchema();
    await getPool().query(
      `INSERT INTO platform_live_chat_sessions (id, status, updated_at_ms, expires_at_ms, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at_ms = EXCLUDED.updated_at_ms,
         expires_at_ms = EXCLUDED.expires_at_ms,
         data = EXCLUDED.data,
         updated_at = NOW()`,
      [
        session.id,
        session.status,
        Number(session.updatedAtMs || Date.now()),
        Number(session.expiresAtMs || Date.now()),
        JSON.stringify(session),
      ]
    );
  } catch (err) {
    console.error('[DB] Failed to upsert live chat session:', err instanceof Error ? err.message : err);
  }
}
