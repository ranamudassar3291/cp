import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { WebSocketServer, WebSocket } from 'ws';
import {
  liveChatStore,
  MAX_CHAT_ATTACHMENT_BYTES,
  MAX_CHAT_ATTACHMENT_COUNT,
} from './server/liveChatStore';
import {
  generateAdminDraftReply,
  generateLiveChatAiReply,
  generateTicketTriageAi,
} from './server/geminiSupport';
import {
  createRateLimiter,
  extractClientIp,
  hashPassword,
  isMaskedSecret,
  securityHeadersMiddleware,
} from './server/security';
import {
  adminSetIpBlockedStatus,
  getBootstrapState,
  getPool,
  hasDatabaseConfigured,
  initDatabaseSchema,
  isDatabaseEmpty,
  isIpBlocked,
  issueSessionToken,
  resolveSmtpCredentialsFromDb,
  resolveWhmModuleConfigFromDb,
  resolveWhmTokenFromDb,
  runAutomatedTrialAndRenewalBilling,
  syncFullPlatformState,
  testDatabaseConnection,
  updateUserPasswordInDb,
  validateAndRecordFreeTrial,
  verifySessionToken,
  verifyUserLoginInDb,
} from './server/db';
import type { LiveChatAttachment, LiveChatSession } from './src/types/liveChat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

interface HttpJsonResponse {
  statusCode: number;
  bodyText: string;
}

function requestWhmJson(opts: {
  hostname: string;
  port: number;
  useSsl: boolean;
  path: string;
  username: string;
  apiToken: string;
  ignoreSslErrors?: boolean;
  timeoutMs?: number;
}): Promise<HttpJsonResponse> {
  return new Promise((resolve, reject) => {
    const cleanHost = opts.hostname
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');

    const transport = opts.useSsl ? https : http;
    const reqOpts: https.RequestOptions = {
      hostname: cleanHost,
      port: opts.port,
      path: opts.path,
      method: 'GET',
      timeout: opts.timeoutMs ?? 12000,
      headers: {
        Authorization: `whm ${opts.username.trim()}:${opts.apiToken.trim()}`,
        Accept: 'application/json',
        'User-Agent': 'CPCloudHost-Provisioner/1.0',
      },
      ...(opts.useSsl ? { rejectUnauthorized: !opts.ignoreSslErrors } : {}),
    };

    const req = transport.request(reqOpts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          bodyText: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`WHM request timed out after ${opts.timeoutMs ?? 12000}ms`));
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isExplicitHumanAgentRequest(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  return (
    /\b(human agent|live agent|real person|real human|speak to (?:a |an )?(?:human|agent|admin|staff)|talk to (?:a |an )?(?:human|agent|admin|staff)|connect (?:me )?(?:to|with) (?:a |an )?(?:human|live agent|agent|admin|support)|transfer (?:me )?(?:to )?(?:a )?(?:human|live|agent|admin)|need live agent|live chat agent)\b/.test(
      lower
    ) ||
    /\b(admin se baat|insaan se|live agent chahiye|agent se connect)\b/.test(lower)
  );
}

function validateAttachments(raw: unknown): {
  ok: boolean;
  attachments: LiveChatAttachment[];
  error?: string;
} {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: true, attachments: [] };
  }
  if (raw.length > MAX_CHAT_ATTACHMENT_COUNT) {
    return {
      ok: false,
      attachments: [],
      error: `Up to ${MAX_CHAT_ATTACHMENT_COUNT} attachments allowed per message.`,
    };
  }
  const clean: LiveChatAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const att = item as Partial<LiveChatAttachment>;
    const size = Number(att.sizeBytes || 0);
    if (size > MAX_CHAT_ATTACHMENT_BYTES) {
      return {
        ok: false,
        attachments: [],
        error: `Attachment "${att.name || 'file'}" exceeds the 10 MB limit.`,
      };
    }
    if (att.name && att.dataUrl) {
      clean.push({
        id: att.id || `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(att.name).slice(0, 180),
        mimeType: String(att.mimeType || 'application/octet-stream'),
        sizeBytes: size,
        dataUrl: String(att.dataUrl),
      });
    }
  }
  return { ok: true, attachments: clean };
}

function parseCookieToken(req: express.Request): { id: string; email: string; role: string } | null {
  const headerToken = req.headers['x-cpcloud-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    const parsed = verifySessionToken(headerToken.trim());
    if (parsed) return parsed;
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === 'cpcloud_session') {
      const val = decodeURIComponent(part.slice(eqIdx + 1).trim());
      return verifySessionToken(val);
    }
  }
  return null;
}

function setSessionCookie(res: express.Response, token: string): void {
  const maxAge = 14 * 24 * 60 * 60;
  res.setHeader(
    'Set-Cookie',
    `cpcloud_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res: express.Response): void {
  res.setHeader(
    'Set-Cookie',
    'cpcloud_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
}

async function resolveEffectiveSmtp(inputSmtp?: {
  host?: string;
  port?: number | string;
  encryption?: 'ssl' | 'tls' | 'none';
  username?: string;
  password?: string;
  fromName?: string;
  fromEmail?: string;
}) {
  const dbSmtp = await resolveSmtpCredentialsFromDb().catch(() => null);
  const host = (inputSmtp?.host || dbSmtp?.host || '').trim();
  const port = Number(inputSmtp?.port || dbSmtp?.port || 465);
  const encryption = inputSmtp?.encryption || dbSmtp?.encryption || 'ssl';
  const username = (inputSmtp?.username || dbSmtp?.username || '').trim();
  const rawPass = (inputSmtp?.password || '').trim();
  const password =
    !rawPass || isMaskedSecret(rawPass) ? (dbSmtp?.password || '') : rawPass;
  const fromName = (inputSmtp?.fromName || dbSmtp?.fromName || 'CPCloudHost').trim();
  const fromEmail = (inputSmtp?.fromEmail || dbSmtp?.fromEmail || username).trim();
  return { host, port, encryption, username, password, fromName, fromEmail };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.set('trust proxy', 1);
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: '60mb' }));

  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 45,
    message: 'Too many authentication attempts from your IP. Please wait a few minutes and try again.',
  });
  const securityRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    maxRequests: 60,
    message: 'Rate limit exceeded on security endpoint. Please wait before retrying.',
  });
  const systemRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 100,
  });

  app.use('/api/auth', authRateLimiter);
  app.use('/api/security', securityRateLimiter);
  app.use('/api/system', systemRateLimiter);
  app.use('/api/modules', systemRateLimiter);

  if (hasDatabaseConfigured()) {
    await initDatabaseSchema().catch((err) => {
      console.error('[DB] Initial schema check failed:', err instanceof Error ? err.message : err);
    });
    await liveChatStore.hydrateFromDatabase().catch((err) => {
      console.error('[DB] LiveChat hydration failed:', err instanceof Error ? err.message : err);
    });
  }

  interface WsClientMeta {
    ws: WebSocket;
    role: 'admin' | 'client';
    sessionId?: string;
  }
  const wsClients = new Set<WsClientMeta>();

  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/live-chat',
    maxPayload: 60 * 1024 * 1024,
  });

  const broadcastPlatformUpdate = (reason = 'sync') => {
    const payload = JSON.stringify({
      type: 'platform:updated',
      reason,
      at: Date.now(),
    });
    for (const client of wsClients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  };

  const broadcastSessionUpdate = (
    session: LiveChatSession,
    extra?: { suggestHumanTransfer?: boolean }
  ) => {
    const payload = JSON.stringify({
      type: 'chat:session_updated',
      session,
      ...(extra?.suggestHumanTransfer ? { suggestHumanTransfer: true } : {}),
    });
    for (const client of wsClients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      if (client.role === 'admin' || client.sessionId === session.id) {
        client.ws.send(payload);
      }
    }
  };

  const broadcastAiTyping = (sessionId: string, typing: boolean) => {
    const payload = JSON.stringify({ type: 'chat:ai_typing', sessionId, typing });
    for (const client of wsClients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      if (client.role === 'admin' || client.sessionId === sessionId) {
        client.ws.send(payload);
      }
    }
  };

  wss.on('connection', (ws, req) => {
    const reqUrl = new URL(req.url || '/ws/live-chat', `http://localhost:${PORT}`);
    const role = reqUrl.searchParams.get('role') === 'admin' ? 'admin' : 'client';
    const sessionId = reqUrl.searchParams.get('sessionId') || undefined;

    const meta: WsClientMeta = { ws, role, sessionId };
    wsClients.add(meta);

    if (role === 'admin') {
      ws.send(
        JSON.stringify({
          type: 'chat:sessions_list',
          sessions: liveChatStore.listSessions(),
        })
      );
    } else if (sessionId) {
      const sess = liveChatStore.getSession(sessionId);
      if (sess) {
        ws.send(JSON.stringify({ type: 'chat:session_updated', session: sess }));
      }
    }

    ws.on('message', (rawBuf) => {
      try {
        const msg = JSON.parse(rawBuf.toString('utf8')) as {
          type?: string;
          sessionId?: string;
        };
        if (msg.type === 'subscribe' && msg.sessionId) {
          meta.sessionId = msg.sessionId;
          const sess = liveChatStore.getSession(msg.sessionId);
          if (sess && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'chat:session_updated', session: sess }));
          }
        }
      } catch {
        // Ignore malformed ping/control frames
      }
    });

    ws.on('close', () => {
      wsClients.delete(meta);
    });
  });

  // Periodic 24-hour auto-close sweep every 60 seconds
  const autoCloseInterval = setInterval(() => {
    const closedList = liveChatStore.sweepExpiredSessions();
    for (const sess of closedList) {
      broadcastSessionUpdate(sess);
    }
  }, 60 * 1000);
  autoCloseInterval.unref?.();

  // Automated Trial-to-Monthly Billing & Renewal Scheduler
  const sendAutomatedBillingEmail = async (opts: {
    toEmail: string;
    subject: string;
    heading: string;
    body: string;
  }) => {
    const smtp = await resolveSmtpCredentialsFromDb();
    if (!smtp || !smtp.enabled || !smtp.host || !smtp.username || !smtp.password) return;
    const useSsl =
      smtp.encryption === 'ssl' ||
      (smtp.encryption !== 'tls' && smtp.encryption !== 'none' && smtp.port === 465);
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: useSsl,
      auth: { user: smtp.username, pass: smtp.password },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    });
    await transporter.sendMail({
      from: `"${smtp.fromName.replace(/"/g, '')}" <${smtp.fromEmail}>`,
      to: opts.toEmail,
      subject: opts.subject,
      text: `${opts.heading}\n\n${opts.body}`,
      html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;"><div style="background:#0F172A;padding:18px 24px;color:#FFF;"><h2 style="margin:0;font-size:17px;">${escapeHtmlText(opts.heading)}</h2></div><div style="padding:22px 24px;font-size:14px;line-height:1.6;color:#0F172A;">${escapeHtmlText(opts.body).replace(/\n/g, '<br/>')}</div></div>`,
    });
  };

  if (hasDatabaseConfigured()) {
    setTimeout(() => {
      void runAutomatedTrialAndRenewalBilling(sendAutomatedBillingEmail)
        .then((res) => {
          if (res.convertedTrials > 0) broadcastPlatformUpdate('trial_conversion');
        })
        .catch(() => undefined);
    }, 8000);

    const billingInterval = setInterval(() => {
      void runAutomatedTrialAndRenewalBilling(sendAutomatedBillingEmail)
        .then((res) => {
          if (res.convertedTrials > 0) broadcastPlatformUpdate('trial_conversion');
        })
        .catch(() => undefined);
    }, 15 * 60 * 1000);
    billingInterval.unref?.();
  }

  app.get('/api/health', async (_req, res) => {
    const dbConnected = await testDatabaseConnection();
    res.json({
      ok: true,
      service: 'cpcloudhost-api',
      dbConfigured: hasDatabaseConfigured(),
      dbConnected,
      timeUtc: new Date().toISOString(),
    });
  });

  // Real StackMail / SMTP verification & test email dispatch
  app.post('/api/system/test-smtp', async (req, res) => {
    const body = (req.body || {}) as {
      host?: string;
      port?: number | string;
      encryption?: 'ssl' | 'tls' | 'none';
      username?: string;
      password?: string;
      fromName?: string;
      fromEmail?: string;
      testTo?: string;
    };

    const resolved = await resolveEffectiveSmtp(body);
    const cleanHost = resolved.host;
    const numericPort = resolved.port;
    const cleanUser = resolved.username;
    const cleanPass = resolved.password;
    const cleanFromEmail = resolved.fromEmail || cleanUser;
    const cleanTestTo = (body.testTo || cleanFromEmail).trim();
    const encryption = resolved.encryption;

    if (!cleanHost) {
      res.status(400).json({ ok: false, error: 'SMTP host is required (e.g. smtp.stackmail.com).' });
      return;
    }
    if (!Number.isFinite(numericPort) || numericPort <= 0 || numericPort > 65535) {
      res.status(400).json({ ok: false, error: 'Enter a valid SMTP port (465 for SSL or 587 for STARTTLS).' });
      return;
    }
    if (!cleanUser || !cleanPass) {
      res.status(400).json({ ok: false, error: 'SMTP username and password are required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTestTo)) {
      res.status(400).json({ ok: false, error: 'Enter a valid test recipient email address.' });
      return;
    }

    const useSsl = encryption === 'ssl' || (encryption !== 'tls' && encryption !== 'none' && numericPort === 465);

    try {
      const transporter = nodemailer.createTransport({
        host: cleanHost,
        port: numericPort,
        secure: useSsl,
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 12000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transporter.verify();

      const verifiedAtUtc = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      const senderLabel = (resolved.fromName || 'CPCloudHost').replace(/"/g, '').trim();

      const info = await transporter.sendMail({
        from: `"${senderLabel}" <${cleanFromEmail}>`,
        to: cleanTestTo,
        subject: `[CPCloudHost] StackMail SMTP Verification Passed (${verifiedAtUtc})`,
        text: [
          'CPCloudHost Outbound Email Configuration Test',
          '',
          `SMTP Host: ${cleanHost}:${numericPort} (${useSsl ? 'SSL/TLS' : 'STARTTLS'})`,
          `Authenticated User: ${cleanUser}`,
          `Verified At: ${verifiedAtUtc}`,
          '',
          'Your StackMail / SMTP configuration is active and ready for welcome emails, invoices, domain notices, and expiry reminders.',
        ].join('\n'),
        html: `
          <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
            <div style="background: #0F172A; padding: 20px 24px; color: #FFFFFF;">
              <div style="font-size: 12px; color: #10B981; font-weight: 700; letter-spacing: 0.04em;">CPCLOUDHOST SYSTEM DIAGNOSTIC</div>
              <h1 style="margin: 6px 0 0; font-size: 18px; font-weight: 700;">SMTP Email Delivery Verified</h1>
            </div>
            <div style="padding: 24px; color: #0F172A; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0;">Your outbound StackMail / SMTP relay connected, authenticated, and dispatched this live test verification message.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                <tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">SMTP Relay</td><td style="padding: 8px 0; font-family: monospace; font-weight: 600; border-bottom: 1px solid #F1F5F9;">${cleanHost}:${numericPort}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">Security Mode</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #F1F5F9;">${useSsl ? 'SSL / TLS (Implicit)' : 'STARTTLS'}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">SMTP Account</td><td style="padding: 8px 0; font-family: monospace; border-bottom: 1px solid #F1F5F9;">${cleanUser}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748B;">Verified UTC</td><td style="padding: 8px 0; font-family: monospace;">${verifiedAtUtc}</td></tr>
              </table>
              <p style="margin-bottom: 0; font-size: 12px; color: #64748B;">Sent from CPCloudHost Admin System Settings.</p>
            </div>
          </div>
        `,
      });

      res.json({
        ok: true,
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response,
        verifiedAtUtc,
      });
    } catch (err) {
      const errorObj = err as { message?: string; code?: string; responseCode?: number };
      res.status(400).json({
        ok: false,
        code: errorObj.code || 'SMTP_CONNECTION_FAILED',
        responseCode: errorObj.responseCode,
        error:
          errorObj.message ||
          'Unable to connect or authenticate with SMTP server. Verify hostname, port, and mailbox credentials.',
      });
    }
  });

  // Automated invoice email dispatch upon order approval (via configured StackMail / SMTP)
  app.post('/api/system/send-invoice-email', async (req, res) => {
    const {
      smtp,
      toEmail,
      clientName,
      invoiceId,
      orderId,
      planName,
      domainOrHost,
      amountFormatted,
      statusLabel,
      issuedDate,
      dueDate,
      datacenter,
      companyName,
    } = (req.body || {}) as {
      smtp?: {
        host?: string;
        port?: number | string;
        encryption?: 'ssl' | 'tls' | 'none';
        username?: string;
        password?: string;
        fromName?: string;
        fromEmail?: string;
      };
      toEmail?: string;
      clientName?: string;
      invoiceId?: string;
      orderId?: string;
      planName?: string;
      domainOrHost?: string;
      amountFormatted?: string;
      statusLabel?: string;
      issuedDate?: string;
      dueDate?: string;
      datacenter?: string;
      companyName?: string;
    };

    const resolvedSmtp = await resolveEffectiveSmtp(smtp);
    const cleanHost = resolvedSmtp.host;
    const cleanUser = resolvedSmtp.username;
    const cleanPass = resolvedSmtp.password;
    const numericPort = resolvedSmtp.port;

    if (!cleanHost || !cleanUser || !cleanPass || !toEmail) {
      res.status(400).json({ ok: false, error: 'SMTP credentials or recipient missing.' });
      return;
    }

    const useSsl =
      resolvedSmtp.encryption === 'ssl' ||
      (resolvedSmtp.encryption !== 'tls' && resolvedSmtp.encryption !== 'none' && numericPort === 465);
    const brand = (companyName || 'CPCloudHost').trim();
    const senderLabel = (resolvedSmtp.fromName || brand).replace(/"/g, '').trim();
    const fromEmail = (resolvedSmtp.fromEmail || cleanUser).trim();

    try {
      const transporter = nodemailer.createTransport({
        host: cleanHost,
        port: numericPort,
        secure: useSsl,
        auth: { user: cleanUser, pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });

      const info = await transporter.sendMail({
        from: `"${senderLabel}" <${fromEmail}>`,
        to: toEmail.trim(),
        subject: `[${brand}] Invoice ${invoiceId} (${statusLabel || 'PAID'}) — Order ${orderId} Approved`,
        text: [
          `Hello ${clientName || 'Client'},`,
          '',
          `Your order ${orderId} has been approved and invoice ${invoiceId} has been generated.`,
          `Service: ${planName || 'Cloud Hosting'} (${domainOrHost || '—'})`,
          datacenter ? `Datacenter: ${datacenter}` : '',
          `Amount: ${amountFormatted || '$0.00 USD'} (${statusLabel || 'PAID'})`,
          `Issued: ${issuedDate || ''} | Due: ${dueDate || ''}`,
          '',
          'You can download your PDF invoice anytime inside your Client Portal -> Billing & Invoices.',
        ]
          .filter(Boolean)
          .join('\n'),
        html: `
          <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
            <div style="background: #0F172A; padding: 20px 24px; color: #FFFFFF;">
              <div style="font-size: 11px; color: #10B981; font-weight: 700; letter-spacing: 0.04em;">${brand.toUpperCase()} · AUTOMATED INVOICE</div>
              <h1 style="margin: 6px 0 0; font-size: 18px; font-weight: 700;">Invoice ${invoiceId} — ${statusLabel || 'PAID'}</h1>
            </div>
            <div style="padding: 24px; color: #0F172A; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0;">Hello ${clientName || 'Client'},</p>
              <p>Your order <strong>${orderId}</strong> has been approved and provisioned. Your official invoice is ready in your Client Portal (PDF download enabled).</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                <tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">Invoice Number</td><td style="padding: 8px 0; font-family: monospace; font-weight: 700; border-bottom: 1px solid #F1F5F9;">${invoiceId}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">Service / Host</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #F1F5F9;">${planName || ''} (${domainOrHost || '—'})</td></tr>
                ${datacenter ? `<tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">Datacenter</td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${datacenter}</td></tr>` : ''}
                <tr><td style="padding: 8px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">Total Amount</td><td style="padding: 8px 0; font-family: monospace; font-weight: 700; color: #0E6B63; border-bottom: 1px solid #F1F5F9;">${amountFormatted || ''} (${statusLabel || 'PAID'})</td></tr>
                <tr><td style="padding: 8px 0; color: #64748B;">Issued / Due</td><td style="padding: 8px 0; font-family: monospace;">${issuedDate || ''} / ${dueDate || ''}</td></tr>
              </table>
              <p style="margin-bottom: 0; font-size: 12px; color: #64748B;">Sign in to your Client Dashboard -> Billing &amp; Invoices to download your PDF receipt.</p>
            </div>
          </div>
        `,
      });

      res.json({ ok: true, messageId: info.messageId });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({
        ok: false,
        error: errorObj.message || 'SMTP invoice email dispatch failed.',
      });
    }
  });

  // Real WHM / cPanel JSON API Test Connection Ping + Package Sync
  app.post('/api/modules/whm/test-connection', async (req, res) => {
    const { moduleId, hostname, port, useSsl, username, apiToken, ignoreSslErrors } = (req.body || {}) as {
      moduleId?: string;
      hostname?: string;
      port?: number | string;
      useSsl?: boolean;
      username?: string;
      apiToken?: string;
      ignoreSslErrors?: boolean;
    };

    const cleanHost = (hostname || '').trim();
    const numericPort = Number(port || 2087);
    const cleanUser = (username || '').trim();
    const cleanToken = await resolveWhmTokenFromDb({ moduleId, hostname: cleanHost, apiToken });

    if (!cleanHost) {
      res.status(400).json({
        ok: false,
        status: 'Fail',
        code: 'MISSING_HOSTNAME',
        error: 'WHM server hostname or IP is required.',
      });
      return;
    }
    if (!cleanUser || !cleanToken) {
      res.status(400).json({
        ok: false,
        status: 'Fail',
        code: 'MISSING_CREDENTIALS',
        error: 'Authentication failed: WHM username (e.g. root) and API Token are required.',
      });
      return;
    }

    const startedAt = Date.now();
    try {
      const versionResp = await requestWhmJson({
        hostname: cleanHost,
        port: numericPort,
        useSsl: useSsl !== false,
        path: '/json-api/version?api.version=1',
        username: cleanUser,
        apiToken: cleanToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
      });

      const latencyMs = Date.now() - startedAt;

      if (versionResp.statusCode === 401 || versionResp.statusCode === 403) {
        res.status(versionResp.statusCode).json({
          ok: false,
          status: 'Fail',
          code: `HTTP_${versionResp.statusCode}`,
          latencyMs,
          error: `Authentication failed (HTTP ${versionResp.statusCode}): Invalid WHM username "${cleanUser}", expired/incorrect API Token, or missing API token privileges.`,
        });
        return;
      }

      if (versionResp.statusCode < 200 || versionResp.statusCode >= 300) {
        res.status(400).json({
          ok: false,
          status: 'Fail',
          code: `HTTP_${versionResp.statusCode}`,
          latencyMs,
          error: `WHM server responded with HTTP ${versionResp.statusCode}. Verify port ${numericPort} and WHM service availability.`,
        });
        return;
      }

      let versionJson: Record<string, unknown> = {};
      try {
        versionJson = JSON.parse(versionResp.bodyText) as Record<string, unknown>;
      } catch {
        res.status(400).json({
          ok: false,
          status: 'Fail',
          code: 'INVALID_WHM_RESPONSE',
          latencyMs,
          error: 'Received non-JSON response from WHM endpoint. Confirm WHM port (2087) and SSL mode.',
        });
        return;
      }

      const cpanelError = (versionJson.cpanelresult as { error?: string } | undefined)?.error;
      const versionMeta = versionJson.metadata as { result?: number; reason?: string } | undefined;
      const rawDeniedReason = cpanelError || (versionMeta?.result === 0 ? versionMeta.reason : undefined);
      if (rawDeniedReason || (versionMeta && versionMeta.result === 0)) {
        const reasonText = rawDeniedReason || 'WHM API returned access denied (result=0).';
        const looksLikeAuth = /access denied|auth|token|permission|invalid user|login/i.test(reasonText);
        res.status(looksLikeAuth ? 401 : 400).json({
          ok: false,
          status: 'Fail',
          code: looksLikeAuth ? 'WHM_AUTH_FAILED' : 'WHM_API_DENIED',
          latencyMs,
          error: looksLikeAuth
            ? `Authentication failed: ${reasonText}`
            : reasonText,
        });
        return;
      }

      const dataObj = versionJson.data as { version?: string } | undefined;
      const whmVersion =
        dataObj?.version ||
        (typeof versionJson.version === 'string' ? versionJson.version : 'WHM Connected');

      // Fetch real hosting packages list from WHM
      let packages: string[] = [];
      try {
        const pkgsResp = await requestWhmJson({
          hostname: cleanHost,
          port: numericPort,
          useSsl: useSsl !== false,
          path: '/json-api/listpkgs?api.version=1',
          username: cleanUser,
          apiToken: cleanToken,
          ignoreSslErrors: Boolean(ignoreSslErrors),
        });
        if (pkgsResp.statusCode >= 200 && pkgsResp.statusCode < 300) {
          const pkgJson = JSON.parse(pkgsResp.bodyText) as {
            data?: { pkg?: Array<{ name?: string }> };
            pkg?: Array<{ name?: string }>;
          };
          const pkgArray = pkgJson.data?.pkg || pkgJson.pkg || [];
          packages = pkgArray
            .map((p) => (p.name || '').trim())
            .filter(Boolean);
        }
      } catch {
        // Non-fatal if listpkgs ACL isn't granted on token
      }

      res.json({
        ok: true,
        status: 'Success',
        version: whmVersion,
        packages,
        latencyMs: Date.now() - startedAt,
        checkedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      });
    } catch (err) {
      const errorObj = err as { message?: string; code?: string };
      const latencyMs = Date.now() - startedAt;
      const code = errorObj.code || 'WHM_UNREACHABLE';
      let friendlyError =
        errorObj.message ||
        `Could not reach WHM server ${cleanHost}:${numericPort}. Check firewall port ${numericPort} and hostname.`;

      if (code === 'ENOTFOUND') {
        friendlyError = `DNS lookup failed for "${cleanHost}". Verify the WHM hostname or use the server IP address.`;
      } else if (code === 'ECONNREFUSED') {
        friendlyError = `Connection refused by ${cleanHost}:${numericPort}. Confirm WHM cpsrvd is running and port ${numericPort} is open.`;
      } else if (
        code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
        code === 'CERT_HAS_EXPIRED'
      ) {
        friendlyError = `SSL certificate verification failed (${code}). Enable "Ignore Self-Signed SSL Cert" or install a valid hostname certificate.`;
      }

      res.status(400).json({
        ok: false,
        status: 'Fail',
        code,
        latencyMs,
        error: friendlyError,
      });
    }
  });

  // Helper for safe WHM JSON parsing
  const parseWhmJsonBody = <T,>(bodyText: string, actionName: string): T => {
    try {
      return JSON.parse(bodyText) as T;
    } catch {
      const preview = bodyText.replace(/\s+/g, ' ').trim().slice(0, 160);
      throw new Error(
        `WHM ${actionName} returned non-JSON response${preview ? `: ${preview}` : '.'}`
      );
    }
  };

  const normalizeCpanelUsername = (raw: string): string => {
    let clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean || !/^[a-z]/.test(clean)) {
      clean = `cp${clean}`;
    }
    if (clean.length < 3) {
      clean = `${clean}usr`.slice(0, 8);
    }
    return clean.slice(0, 16);
  };

  const generateCpanelPassword = (): string => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const syms = '@#%!';
    const all = upper + lower + digits + syms;
    let out =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      digits[Math.floor(Math.random() * digits.length)] +
      syms[Math.floor(Math.random() * syms.length)];
    for (let i = 0; i < 10; i++) {
      out += all[Math.floor(Math.random() * all.length)];
    }
    return out;
  };

  // Real WHM createacct provisioning endpoint
  app.post('/api/modules/whm/provision', async (req, res) => {
    const {
      moduleId,
      hostname,
      port,
      useSsl,
      username,
      apiToken,
      ignoreSslErrors,
      domain,
      acctUsername,
      cpanelUsername,
      password,
      plan,
      contactEmail,
    } = (req.body || {}) as {
      moduleId?: string;
      hostname?: string;
      port?: number | string;
      useSsl?: boolean;
      username?: string;
      apiToken?: string;
      ignoreSslErrors?: boolean;
      domain?: string;
      acctUsername?: string;
      cpanelUsername?: string;
      password?: string;
      plan?: string;
      contactEmail?: string;
    };

    const resolvedToken = await resolveWhmTokenFromDb({ moduleId, hostname, apiToken });
    const rawAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !resolvedToken || !domain || !rawAcct || !plan) {
      res.status(400).json({
        ok: false,
        error: 'Missing required WHM module or account provisioning parameters.',
      });
      return;
    }

    const cleanAcctUser = normalizeCpanelUsername(rawAcct);
    const cleanPassword = (password || '').trim() || generateCpanelPassword();

    try {
      const qs = new URLSearchParams({
        'api.version': '1',
        username: cleanAcctUser,
        domain: domain.trim().toLowerCase(),
        plan: plan.trim(),
        password: cleanPassword,
        contactemail: (contactEmail || '').trim(),
      });
      const resp = await requestWhmJson({
        hostname,
        port: Number(port || 2087),
        useSsl: useSsl !== false,
        path: `/json-api/createacct?${qs.toString()}`,
        username,
        apiToken: resolvedToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
        timeoutMs: 25000,
      });
      const parsed = parseWhmJsonBody<{
        metadata?: { result?: number; reason?: string };
        data?: { ip?: string; nameserver?: string; nameserver2?: string };
      }>(resp.bodyText, 'createacct');
      if (parsed.metadata?.result !== 1) {
        res.status(400).json({
          ok: false,
          error: parsed.metadata?.reason || 'WHM createacct returned an error.',
        });
        return;
      }
      const reasonMsg = parsed.metadata?.reason || 'Account created on WHM server.';
      res.json({
        ok: true,
        reason: reasonMsg,
        message: reasonMsg,
        ip: parsed.data?.ip,
        acctUsername: cleanAcctUser,
        nameserver: parsed.data?.nameserver,
        nameserver2: parsed.data?.nameserver2,
      });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({
        ok: false,
        error: errorObj.message || 'WHM provisioning request failed.',
      });
    }
  });

  // Real WHM change cPanel account password
  app.post('/api/modules/whm/passwd', async (req, res) => {
    const { moduleId, hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, newPassword } =
      (req.body || {}) as {
        moduleId?: string;
        hostname?: string;
        port?: number | string;
        useSsl?: boolean;
        username?: string;
        apiToken?: string;
        ignoreSslErrors?: boolean;
        acctUsername?: string;
        cpanelUsername?: string;
        newPassword?: string;
      };
    const resolvedToken = await resolveWhmTokenFromDb({ moduleId, hostname, apiToken });
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !resolvedToken || !targetAcct || !newPassword) {
      res.status(400).json({ ok: false, error: 'Missing required WHM parameters for password reset.' });
      return;
    }
    try {
      const qs = new URLSearchParams({
        'api.version': '1',
        user: targetAcct,
        password: newPassword,
      });
      const resp = await requestWhmJson({
        hostname,
        port: Number(port || 2087),
        useSsl: useSsl !== false,
        path: `/json-api/passwd?${qs.toString()}`,
        username,
        apiToken: resolvedToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
      });
      const parsed = parseWhmJsonBody<{
        metadata?: { result?: number; reason?: string };
      }>(resp.bodyText, 'passwd');
      if (parsed.metadata?.result !== 1) {
        res.status(400).json({
          ok: false,
          error: parsed.metadata?.reason || 'WHM passwd returned an error.',
        });
        return;
      }
      const reasonMsg = parsed.metadata?.reason || 'Password updated on WHM server.';
      res.json({ ok: true, reason: reasonMsg, message: reasonMsg });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({ ok: false, error: errorObj.message || 'WHM passwd request failed.' });
    }
  });

  // Real WHM suspend cPanel account
  app.post('/api/modules/whm/suspend', async (req, res) => {
    const { moduleId, hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, reason } =
      (req.body || {}) as {
        moduleId?: string;
        hostname?: string;
        port?: number | string;
        useSsl?: boolean;
        username?: string;
        apiToken?: string;
        ignoreSslErrors?: boolean;
        acctUsername?: string;
        cpanelUsername?: string;
        reason?: string;
      };
    const resolvedToken = await resolveWhmTokenFromDb({ moduleId, hostname, apiToken });
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !resolvedToken || !targetAcct) {
      res.status(400).json({ ok: false, error: 'Missing required WHM parameters to suspend account.' });
      return;
    }
    try {
      const qs = new URLSearchParams({
        'api.version': '1',
        user: targetAcct,
        reason: (reason || 'Administrative suspension').trim(),
      });
      const resp = await requestWhmJson({
        hostname,
        port: Number(port || 2087),
        useSsl: useSsl !== false,
        path: `/json-api/suspendacct?${qs.toString()}`,
        username,
        apiToken: resolvedToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
      });
      const parsed = parseWhmJsonBody<{
        metadata?: { result?: number; reason?: string };
      }>(resp.bodyText, 'suspendacct');
      if (parsed.metadata?.result !== 1) {
        res.status(400).json({
          ok: false,
          error: parsed.metadata?.reason || 'WHM suspendacct failed.',
        });
        return;
      }
      const reasonMsg = parsed.metadata?.reason || 'Account suspended on WHM server.';
      res.json({ ok: true, reason: reasonMsg, message: reasonMsg });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({ ok: false, error: errorObj.message || 'WHM suspendacct request failed.' });
    }
  });

  // Real WHM unsuspend cPanel account
  app.post('/api/modules/whm/unsuspend', async (req, res) => {
    const { moduleId, hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername } =
      (req.body || {}) as {
        moduleId?: string;
        hostname?: string;
        port?: number | string;
        useSsl?: boolean;
        username?: string;
        apiToken?: string;
        ignoreSslErrors?: boolean;
        acctUsername?: string;
        cpanelUsername?: string;
      };
    const resolvedToken = await resolveWhmTokenFromDb({ moduleId, hostname, apiToken });
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !resolvedToken || !targetAcct) {
      res.status(400).json({ ok: false, error: 'Missing required WHM parameters to unsuspend account.' });
      return;
    }
    try {
      const qs = new URLSearchParams({
        'api.version': '1',
        user: targetAcct,
      });
      const resp = await requestWhmJson({
        hostname,
        port: Number(port || 2087),
        useSsl: useSsl !== false,
        path: `/json-api/unsuspendacct?${qs.toString()}`,
        username,
        apiToken: resolvedToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
      });
      const parsed = parseWhmJsonBody<{
        metadata?: { result?: number; reason?: string };
      }>(resp.bodyText, 'unsuspendacct');
      if (parsed.metadata?.result !== 1) {
        res.status(400).json({
          ok: false,
          error: parsed.metadata?.reason || 'WHM unsuspendacct failed.',
        });
        return;
      }
      const reasonMsg = parsed.metadata?.reason || 'Account unsuspended on WHM server.';
      res.json({ ok: true, reason: reasonMsg, message: reasonMsg });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({ ok: false, error: errorObj.message || 'WHM unsuspendacct request failed.' });
    }
  });

  // Real WHM upgrade / downgrade package
  app.post('/api/modules/whm/changepackage', async (req, res) => {
    const { moduleId, hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, pkg } =
      (req.body || {}) as {
        moduleId?: string;
        hostname?: string;
        port?: number | string;
        useSsl?: boolean;
        username?: string;
        apiToken?: string;
        ignoreSslErrors?: boolean;
        acctUsername?: string;
        cpanelUsername?: string;
        pkg?: string;
      };
    const resolvedToken = await resolveWhmTokenFromDb({ moduleId, hostname, apiToken });
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !resolvedToken || !targetAcct || !pkg) {
      res.status(400).json({ ok: false, error: 'Missing required WHM parameters for changepkg.' });
      return;
    }
    try {
      const qs = new URLSearchParams({
        'api.version': '1',
        user: targetAcct,
        pkg: pkg.trim(),
      });
      const resp = await requestWhmJson({
        hostname,
        port: Number(port || 2087),
        useSsl: useSsl !== false,
        path: `/json-api/changepackage?${qs.toString()}`,
        username,
        apiToken: resolvedToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
      });
      const parsed = parseWhmJsonBody<{
        metadata?: { result?: number; reason?: string };
      }>(resp.bodyText, 'changepackage');
      if (parsed.metadata?.result !== 1) {
        res.status(400).json({
          ok: false,
          error: parsed.metadata?.reason || 'WHM changepackage failed.',
        });
        return;
      }
      const reasonMsg = parsed.metadata?.reason || 'WHM package updated.';
      res.json({ ok: true, reason: reasonMsg, message: reasonMsg });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({ ok: false, error: errorObj.message || 'WHM changepackage request failed.' });
    }
  });

  // Real WHM create_user_session SSO Direct Control Panel Login
  app.post('/api/modules/whm/sso-login', async (req, res) => {
    const { moduleId, hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, service } =
      (req.body || {}) as {
        moduleId?: string;
        hostname?: string;
        port?: number | string;
        useSsl?: boolean;
        username?: string;
        apiToken?: string;
        ignoreSslErrors?: boolean;
        acctUsername?: string;
        cpanelUsername?: string;
        service?: string;
      };
    const dbMod = await resolveWhmModuleConfigFromDb(moduleId).catch(() => null);
    const resolvedHost = (hostname || dbMod?.hostname || '').trim();
    const resolvedUser = (username || dbMod?.username || '').trim();
    const resolvedPort = Number(port || dbMod?.port || 2087);
    const resolvedSsl = useSsl !== undefined ? useSsl !== false : dbMod?.useSsl !== false;
    const resolvedIgnoreSsl = ignoreSslErrors !== undefined ? Boolean(ignoreSslErrors) : Boolean(dbMod?.ignoreSslErrors);
    const resolvedToken = await resolveWhmTokenFromDb({ moduleId: moduleId || dbMod?.id, hostname: resolvedHost, apiToken });
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!resolvedHost || !resolvedUser || !resolvedToken || !targetAcct) {
      res.status(400).json({ ok: false, error: 'Missing required WHM parameters for SSO session.' });
      return;
    }
    try {
      const qs = new URLSearchParams({
        'api.version': '1',
        user: targetAcct,
        service: service?.trim() || 'cpaneld',
      });
      const resp = await requestWhmJson({
        hostname: resolvedHost,
        port: resolvedPort,
        useSsl: resolvedSsl,
        path: `/json-api/create_user_session?${qs.toString()}`,
        username: resolvedUser,
        apiToken: resolvedToken,
        ignoreSslErrors: resolvedIgnoreSsl,
      });
      const parsed = parseWhmJsonBody<{
        metadata?: { result?: number; reason?: string };
        data?: { url?: string; expires?: number };
      }>(resp.bodyText, 'create_user_session');
      if (parsed.metadata?.result !== 1 || !parsed.data?.url) {
        res.status(400).json({
          ok: false,
          error: parsed.metadata?.reason || 'WHM create_user_session did not return an SSO URL.',
        });
        return;
      }
      res.json({
        ok: true,
        ssoUrl: parsed.data.url,
        expires: parsed.data.expires,
      });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({ ok: false, error: errorObj.message || 'WHM SSO session request failed.' });
    }
  });

  // Real Google ID token / access token verification endpoint
  app.post('/api/auth/google/verify', async (req, res) => {
    const { idToken, accessToken, expectedClientId } = (req.body || {}) as {
      idToken?: string;
      accessToken?: string;
      expectedClientId?: string;
    };

    const clientIp = extractClientIp(req);
    const ipBlock = await isIpBlocked(clientIp);
    if (ipBlock.blocked) {
      res.status(403).json({
        ok: false,
        error:
          ipBlock.reason ||
          'Access denied: Your IP address has been automatically blocked due to free-trial abuse.',
      });
      return;
    }

    const finalizeGoogleAuth = async (email: string, name: string, sub: string) => {
      const cleanEmail = email.toLowerCase();
      let token: string | undefined;
      if (hasDatabaseConfigured()) {
        await initDatabaseSchema();
        const p = getPool();
        const found = await p.query(
          'SELECT id, email, role, status FROM platform_users WHERE LOWER(email) = $1 LIMIT 1',
          [cleanEmail]
        );
        const row = found.rows[0];
        if (row) {
          if (row.status === 'suspended' || row.status === 'cancelled') {
            res.status(403).json({
              ok: false,
              error: 'This account has been suspended or cancelled. Contact support@cpcloudhost.com.',
            });
            return;
          }
          token = issueSessionToken({
            id: String(row.id),
            email: String(row.email),
            role: String(row.role),
          });
          setSessionCookie(res, token);
        } else {
          const newId = `USR-CL-${Math.floor(1000 + Math.random() * 9000)}`;
          const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
          const username = cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '') || 'client';
          const userRecord = {
            id: newId,
            name,
            username,
            email: cleanEmail,
            role: 'client',
            status: 'active',
            kycVerified: false,
            emailVerified: true,
            freeTrialClaimed: false,
            country: 'United States',
            createdAt: nowUtc,
            signupIp: clientIp,
            lastIp: clientIp,
            googleLinked: true,
          };
          await p.query(
            `INSERT INTO platform_users (id, email, username, name, role, status, kyc_verified, email_verified, free_trial_claimed, signup_ip, last_ip, terms_accepted_at_utc, data, updated_at)
             VALUES ($1,$2,$3,$4,'client','active',FALSE,TRUE,FALSE,$5,$5,$6,$7,NOW())`,
            [newId, cleanEmail, username, name, clientIp, nowUtc, JSON.stringify(userRecord)]
          );
          token = issueSessionToken({ id: newId, email: cleanEmail, role: 'client' });
          setSessionCookie(res, token);
        }
      }
      res.json({
        ok: true,
        email: cleanEmail,
        name,
        sub,
        token,
        clientIp,
      });
    };

    try {
      if (idToken) {
        const gRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        const gData = (await gRes.json()) as {
          email?: string;
          name?: string;
          sub?: string;
          aud?: string;
          error_description?: string;
        };
        if (!gRes.ok || !gData.email) {
          res.status(401).json({
            ok: false,
            error: gData.error_description || 'Invalid Google ID token.',
          });
          return;
        }
        if (expectedClientId && gData.aud && gData.aud !== expectedClientId.trim()) {
          res.status(401).json({
            ok: false,
            error: 'Google OAuth Client ID mismatch.',
          });
          return;
        }
        await finalizeGoogleAuth(
          gData.email,
          gData.name || gData.email.split('@')[0],
          gData.sub || ''
        );
        return;
      }

      if (accessToken) {
        const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const uData = (await uRes.json()) as {
          email?: string;
          name?: string;
          sub?: string;
        };
        if (!uRes.ok || !uData.email) {
          res.status(401).json({
            ok: false,
            error: 'Unable to verify Google access token.',
          });
          return;
        }
        await finalizeGoogleAuth(
          uData.email,
          uData.name || uData.email.split('@')[0],
          uData.sub || ''
        );
        return;
      }

      res.status(400).json({ ok: false, error: 'Provide Google idToken or accessToken.' });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(500).json({
        ok: false,
        error: errorObj.message || 'Google token verification failed.',
      });
    }
  });

  // Reusable templated SMTP email dispatch (Support Tickets + System Alerts)
  app.post('/api/system/send-templated-email', async (req, res) => {
    const {
      smtp,
      toEmail,
      companyName,
      companyEmail,
      companyWebsite,
      accentColor,
      subject,
      preheader,
      heading,
      body,
      ctaLabel,
      ctaUrl,
      footerNote,
      headerBadge,
    } = (req.body || {}) as {
      smtp?: {
        host?: string;
        port?: number | string;
        encryption?: 'ssl' | 'tls' | 'none';
        username?: string;
        password?: string;
        fromName?: string;
        fromEmail?: string;
      };
      toEmail?: string;
      companyName?: string;
      companyEmail?: string;
      companyWebsite?: string;
      accentColor?: string;
      subject?: string;
      preheader?: string;
      heading?: string;
      body?: string;
      ctaLabel?: string;
      ctaUrl?: string;
      footerNote?: string;
      headerBadge?: string;
    };

    const resolvedSmtp = await resolveEffectiveSmtp(smtp);
    const cleanHost = resolvedSmtp.host;
    const cleanUser = resolvedSmtp.username;
    const cleanPass = resolvedSmtp.password;
    const numericPort = resolvedSmtp.port;

    if (!cleanHost || !cleanUser || !cleanPass || !toEmail || !subject || !body) {
      res.status(400).json({ ok: false, error: 'Missing SMTP credentials, recipient, or email body.' });
      return;
    }

    const useSsl =
      resolvedSmtp.encryption === 'ssl' ||
      (resolvedSmtp.encryption !== 'tls' && resolvedSmtp.encryption !== 'none' && numericPort === 465);
    const brand = (companyName || 'CPCloudHost').trim();
    const senderLabel = (resolvedSmtp.fromName || brand).replace(/"/g, '').trim();
    const fromEmail = (resolvedSmtp.fromEmail || cleanUser).trim();
    const primaryAccent = /^#[0-9a-fA-F]{3,8}$/.test(accentColor || '')
      ? accentColor!
      : '#0E6B63';

    const htmlBodyParagraphs = escapeHtmlText(body)
      .split(/\n/)
      .map((line) => (line.trim() ? `<p style="margin: 0 0 10px;">${line}</p>` : '<div style="height: 8px;"></div>'))
      .join('');

    const cleanCtaUrl = (ctaUrl || '').trim();
    const cleanCtaLabel = (ctaLabel || '').trim();

    try {
      const transporter = nodemailer.createTransport({
        host: cleanHost,
        port: numericPort,
        secure: useSsl,
        auth: { user: cleanUser, pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });

      const info = await transporter.sendMail({
        from: `"${senderLabel}" <${fromEmail}>`,
        to: toEmail.trim(),
        subject: subject.trim(),
        text: [
          heading ? `${heading}\n` : '',
          body,
          cleanCtaLabel && cleanCtaUrl ? `\n${cleanCtaLabel}: ${cleanCtaUrl}` : '',
          footerNote ? `\n---\n${footerNote}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        html: `
          <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
            ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtmlText(preheader)}</div>` : ''}
            <div style="background: ${primaryAccent}; padding: 20px 24px; color: #FFFFFF;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; opacity: 0.9;">${escapeHtmlText(brand.toUpperCase())} · ${escapeHtmlText((headerBadge || 'NOTIFICATION').trim().toUpperCase())}</div>
              <h1 style="margin: 6px 0 0; font-size: 18px; font-weight: 700; line-height: 1.3;">${escapeHtmlText(heading || subject)}</h1>
            </div>
            <div style="padding: 24px; color: #0F172A; font-size: 14px; line-height: 1.65;">
              ${htmlBodyParagraphs}
              ${
                cleanCtaLabel && cleanCtaUrl
                  ? `<div style="margin-top: 20px;">
                       <a href="${escapeHtmlText(cleanCtaUrl)}" style="display: inline-block; padding: 11px 20px; background: ${primaryAccent}; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">${escapeHtmlText(cleanCtaLabel)}</a>
                     </div>`
                  : ''
              }
            </div>
            <div style="padding: 16px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
              ${footerNote ? `<p style="margin: 0 0 6px;">${escapeHtmlText(footerNote)}</p>` : ''}
              <p style="margin: 0; font-family: monospace;">${escapeHtmlText(companyEmail || fromEmail)}${companyWebsite ? ` · ${escapeHtmlText(companyWebsite)}` : ''}</p>
            </div>
          </div>
        `,
      });

      res.json({ ok: true, messageId: info.messageId });
    } catch (err) {
      const errorObj = err as { message?: string };
      res.status(400).json({
        ok: false,
        error: errorObj.message || 'SMTP templated email dispatch failed.',
      });
    }
  });

  // =========================================================================
  // SUPABASE POSTGRESQL PLATFORM BOOTSTRAP, SYNC, AUTH & ANTI-ABUSE APIs
  // =========================================================================
  app.get('/api/platform/bootstrap', async (req, res) => {
    try {
      if (!hasDatabaseConfigured()) {
        res.json({ ok: true, isEmpty: true, state: null });
        return;
      }
      const viewer = parseCookieToken(req);
      const isEmpty = await isDatabaseEmpty();
      const state = await getBootstrapState(viewer);
      res.json({ ok: true, isEmpty, state });
    } catch (err) {
      console.error('[API] bootstrap failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ ok: false, error: 'Failed to load platform state from Supabase.' });
    }
  });

  app.post('/api/platform/seed', async (req, res) => {
    try {
      if (!hasDatabaseConfigured()) {
        res.status(400).json({ ok: false, error: 'DATABASE_URL not configured.' });
        return;
      }
      const clientIp = extractClientIp(req);
      const empty = await isDatabaseEmpty();
      if (empty) {
        await syncFullPlatformState(
          { ...(req.body || {}), _seedIfEmpty: true },
          { isAdmin: false, pruneMissing: false, clientIp }
        );
      }
      const viewer = parseCookieToken(req);
      const state = await getBootstrapState(viewer);
      res.json({ ok: true, seeded: empty, state });
    } catch (err) {
      console.error('[API] seed failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ ok: false, error: 'Failed to seed initial platform data.' });
    }
  });

  app.post('/api/platform/sync', async (req, res) => {
    try {
      if (!hasDatabaseConfigured()) {
        res.json({ ok: true, skipped: true });
        return;
      }
      const viewer = parseCookieToken(req);
      const clientIp = extractClientIp(req);
      const payload = (req.body || {}) as Record<string, unknown>;
      const isAdmin = viewer?.role === 'admin';
      await syncFullPlatformState(payload, {
        isAdmin,
        pruneMissing: Boolean(payload.pruneMissing && isAdmin),
        clientIp,
      });
      broadcastPlatformUpdate('state_sync');
      const state = await getBootstrapState(viewer);
      res.json({ ok: true, state });
    } catch (err) {
      console.error('[API] sync failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ ok: false, error: 'Failed to sync platform state to database.' });
    }
  });

  app.post('/api/auth/verify-login', async (req, res) => {
    try {
      const { identifier, password, portal } = (req.body || {}) as {
        identifier?: string;
        password?: string;
        portal?: 'client' | 'admin';
      };
      if (!identifier?.trim() || !password) {
        res.status(400).json({ ok: false, error: 'Please enter both username/email and password.' });
        return;
      }
      const clientIp = extractClientIp(req);
      const result = await verifyUserLoginInDb({
        identifier,
        password,
        portal: portal === 'admin' ? 'admin' : 'client',
        clientIp,
      });
      if (result.ok && result.token) {
        setSessionCookie(res, result.token);
      }
      res.status(result.ok ? 200 : 401).json({ ...result, clientIp });
    } catch (err) {
      console.error('[AUTH] verify-login failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ ok: false, error: 'Authentication service error.' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const clientIp = extractClientIp(req);
      const ipBlock = await isIpBlocked(clientIp);
      if (ipBlock.blocked) {
        res.status(403).json({
          ok: false,
          ipBlocked: true,
          error:
            ipBlock.reason ||
            'Registration blocked: Multiple free trial abuse detected from your IP address.',
        });
        return;
      }

      const {
        name,
        email,
        password,
        company,
        phone,
        country,
        termsAcceptedAtUtc,
        emailVerified,
        initialUser,
      } = (req.body || {}) as {
        name?: string;
        email?: string;
        password?: string;
        company?: string;
        phone?: string;
        country?: string;
        termsAcceptedAtUtc?: string;
        emailVerified?: boolean;
        initialUser?: Record<string, unknown>;
      };

      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !password || password.trim().length < 8) {
        res.status(400).json({
          ok: false,
          error: 'Valid email and password (minimum 8 characters) are required.',
        });
        return;
      }
      if (!termsAcceptedAtUtc) {
        res.status(400).json({
          ok: false,
          error: 'You must accept the Terms & Conditions, Privacy Policy, and Abuse Policy.',
        });
        return;
      }

      if (hasDatabaseConfigured()) {
        await initDatabaseSchema();
        const p = getPool();
        const dup = await p.query('SELECT id FROM platform_users WHERE LOWER(email) = $1 LIMIT 1', [
          cleanEmail,
        ]);
        if (dup.rows.length > 0) {
          res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
          return;
        }

        const cleanName = (name || cleanEmail.split('@')[0]).trim();
        const cleanUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'client';
        const id = String(initialUser?.id || `USR-CL-${Math.floor(1000 + Math.random() * 9000)}`);
        const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
        const hashed = hashPassword(password.trim());

        const userRecord = {
          ...(initialUser || {}),
          id,
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          role: 'client',
          status: 'active',
          kycVerified: false,
          emailVerified: Boolean(emailVerified),
          freeTrialClaimed: false,
          company: (company || '').trim() || undefined,
          phone: (phone || '').trim() || undefined,
          country: (country || 'United States').trim(),
          createdAt: String(initialUser?.createdAt || nowUtc),
          signupIp: clientIp,
          lastIp: clientIp,
          termsAcceptedAtUtc,
          passwordSecret: hashed,
        };

        await p.query(
          `INSERT INTO platform_users (id, email, username, name, role, status, kyc_verified, email_verified, free_trial_claimed, signup_ip, last_ip, terms_accepted_at_utc, data, updated_at)
           VALUES ($1,$2,$3,$4,'client','active',FALSE,$5,FALSE,$6,$6,$7,$8,NOW())`,
          [
            id,
            cleanEmail,
            cleanUsername,
            cleanName,
            Boolean(emailVerified),
            clientIp,
            termsAcceptedAtUtc,
            JSON.stringify(userRecord),
          ]
        );

        const clientSafeUser = { ...userRecord };
        delete (clientSafeUser as { passwordSecret?: string }).passwordSecret;

        let token: string | undefined;
        if (Boolean(emailVerified)) {
          token = issueSessionToken({ id, email: cleanEmail, role: 'client' });
          setSessionCookie(res, token);
        }

        broadcastPlatformUpdate('user_registered');
        res.json({ ok: true, user: clientSafeUser, token, clientIp });
        return;
      }

      res.json({ ok: true, clientIp });
    } catch (err) {
      console.error('[AUTH] register failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ ok: false, error: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/verify-otp-session', async (req, res) => {
    try {
      const { email } = (req.body || {}) as { email?: string };
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !hasDatabaseConfigured()) {
        res.status(400).json({ ok: false, error: 'Email is required.' });
        return;
      }
      await initDatabaseSchema();
      const p = getPool();
      const resDb = await p.query(
        'SELECT id, email, role, status, data FROM platform_users WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      const row = resDb.rows[0];
      if (!row) {
        res.status(404).json({ ok: false, error: 'User account not found.' });
        return;
      }
      if (row.status === 'suspended' || row.status === 'cancelled') {
        res.status(403).json({ ok: false, error: 'This account has been suspended or cancelled.' });
        return;
      }
      const nextData = { ...(row.data as Record<string, unknown>), emailVerified: true };
      await p.query(
        'UPDATE platform_users SET email_verified = TRUE, data = $2, updated_at = NOW() WHERE id = $1',
        [row.id, JSON.stringify(nextData)]
      );
      const token = issueSessionToken({
        id: String(row.id),
        email: String(row.email),
        role: String(row.role),
      });
      setSessionCookie(res, token);
      broadcastPlatformUpdate('email_verified');
      res.json({ ok: true, token });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Session error.' });
    }
  });

  app.post('/api/auth/update-password', async (req, res) => {
    try {
      const viewer = parseCookieToken(req);
      const { emailOrId, currentPassword, newPassword } = (req.body || {}) as {
        emailOrId?: string;
        currentPassword?: string;
        newPassword?: string;
      };
      const target = (viewer?.email || emailOrId || '').trim();
      if (!target || !newPassword) {
        res.status(400).json({ ok: false, error: 'Account and new password are required.' });
        return;
      }
      const result = await updateUserPasswordInDb({
        emailOrId: target,
        currentPassword,
        newPassword,
        requireCurrentPassword: true,
      });
      res.status(result.ok ? 200 : 400).json(result);
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Password update failed.' });
    }
  });

  app.post('/api/auth/admin-set-password', async (req, res) => {
    try {
      const viewer = parseCookieToken(req);
      if (!viewer || viewer.role !== 'admin') {
        res.status(403).json({ ok: false, error: 'Admin authorization required.' });
        return;
      }
      const { emailOrId, newPassword } = (req.body || {}) as {
        emailOrId?: string;
        newPassword?: string;
      };
      if (!emailOrId || !newPassword) {
        res.status(400).json({ ok: false, error: 'Target account and new password are required.' });
        return;
      }
      const result = await updateUserPasswordInDb({
        emailOrId,
        newPassword,
        requireCurrentPassword: false,
      });
      res.status(result.ok ? 200 : 400).json(result);
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Admin password update failed.' });
    }
  });

  app.post('/api/security/validate-trial', async (req, res) => {
    try {
      const { email, orderId, commitTrialClaim } = (req.body || {}) as {
        email?: string;
        orderId?: string;
        commitTrialClaim?: boolean;
      };
      if (!email?.trim()) {
        res.status(400).json({ ok: false, allowed: false, error: 'Client email is required.' });
        return;
      }
      const clientIp = extractClientIp(req);
      const result = await validateAndRecordFreeTrial({
        email: email.trim().toLowerCase(),
        clientIp,
        orderId,
        commitTrialClaim: Boolean(commitTrialClaim),
      });
      if (result.ipBlocked || result.accountSuspended || commitTrialClaim) {
        broadcastPlatformUpdate('trial_security');
      }
      res.status(result.allowed ? 200 : 403).json({ ...result, clientIp });
    } catch (err) {
      res.status(500).json({ ok: false, allowed: false, error: err instanceof Error ? err.message : 'Trial validation error.' });
    }
  });

  app.post('/api/security/admin-ip-block', async (req, res) => {
    try {
      const viewer = parseCookieToken(req);
      if (!viewer || viewer.role !== 'admin') {
        res.status(403).json({ ok: false, error: 'Admin authorization required.' });
        return;
      }
      const { ipAddress, blocked, reason } = (req.body || {}) as {
        ipAddress?: string;
        blocked?: boolean;
        reason?: string;
      };
      if (!ipAddress?.trim()) {
        res.status(400).json({ ok: false, error: 'IP address is required.' });
        return;
      }
      await adminSetIpBlockedStatus(ipAddress.trim(), Boolean(blocked), reason);
      broadcastPlatformUpdate('ip_security_updated');
      const state = await getBootstrapState(viewer);
      res.json({ ok: true, ipSecurityRecords: state.ipSecurityRecords });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'IP block update failed.' });
    }
  });

  app.post('/api/billing/run-cycle', async (req, res) => {
    try {
      const viewer = parseCookieToken(req);
      if (!viewer || viewer.role !== 'admin') {
        res.status(403).json({ ok: false, error: 'Admin authorization required.' });
        return;
      }
      const result = await runAutomatedTrialAndRenewalBilling(sendAutomatedBillingEmail);
      if (result.convertedTrials > 0 || result.generatedInvoices > 0) {
        broadcastPlatformUpdate('billing_cycle');
      }
      const state = await getBootstrapState(viewer);
      res.json({ ok: true, ...result, state });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Billing cycle execution failed.' });
    }
  });

  // =========================================================================
  // LIVE CHAT REST API (SYNCED WITH WEBSOCKETS + GEMINI AI + 24H AUTO-CLOSE)
  // =========================================================================
  app.get('/api/live-chat/sessions', (_req, res) => {
    res.json({ ok: true, sessions: liveChatStore.listSessions() });
  });

  app.get('/api/live-chat/sessions/:id', (req, res) => {
    const sess = liveChatStore.getSession(req.params.id);
    if (!sess) {
      res.status(404).json({ ok: false, error: 'Live chat session not found.' });
      return;
    }
    res.json({ ok: true, session: sess });
  });

  app.post('/api/live-chat/sessions', (req, res) => {
    const body = (req.body || {}) as {
      sessionId?: string;
      visitorId?: string;
      clientName?: string;
      clientEmail?: string;
      isAuthenticatedClient?: boolean;
      pageContext?: string;
    };
    const session = liveChatStore.createOrResumeSession(body);
    broadcastSessionUpdate(session);
    res.json({ ok: true, session });
  });

  app.post('/api/live-chat/sessions/:id/read', (req, res) => {
    const session = liveChatStore.markAdminRead(req.params.id);
    if (!session) {
      res.status(404).json({ ok: false, error: 'Live chat session not found.' });
      return;
    }
    broadcastSessionUpdate(session);
    res.json({ ok: true, session });
  });

  app.post('/api/live-chat/sessions/:id/messages', async (req, res) => {
    const sess = liveChatStore.getSession(req.params.id);
    if (!sess) {
      res.status(404).json({ ok: false, error: 'Live chat session not found.' });
      return;
    }
    if (sess.status === 'closed') {
      res.status(400).json({
        ok: false,
        error: 'This chat session is closed. Start a new chat to continue.',
        session: sess,
      });
      return;
    }

    const {
      senderRole,
      senderName,
      body,
      attachments: rawAttachments,
    } = (req.body || {}) as {
      senderRole?: 'client' | 'admin';
      senderName?: string;
      body?: string;
      attachments?: unknown;
    };

    const role: 'client' | 'admin' = senderRole === 'admin' ? 'admin' : 'client';
    const textBody = (body || '').trim();
    const attCheck = validateAttachments(rawAttachments);
    if (!attCheck.ok) {
      res.status(400).json({ ok: false, error: attCheck.error });
      return;
    }

    if (!textBody && attCheck.attachments.length === 0) {
      res.status(400).json({ ok: false, error: 'Enter a message or attach a file.' });
      return;
    }

    const appended = liveChatStore.appendMessage(sess.id, {
      senderRole: role,
      senderName: role === 'admin' ? 'Support cpcloudhost' : (senderName || '').trim() || sess.clientName,
      body: textBody || 'Sent file attachment(s) for review.',
      attachments: attCheck.attachments,
      markAdminRead: role === 'admin',
      incrementAdminUnread: role === 'client',
    });

    if (!appended) {
      res.status(404).json({ ok: false, error: 'Live chat session not found.' });
      return;
    }

    let latestSession = appended.session;
    broadcastSessionUpdate(latestSession);

    // If client message while in AI mode:
    // 1. Transfer immediately if explicit human/agent requested
    // 2. Otherwise ACK client message immediately and stream AI reply via WebSocket for instant UX
    if (role === 'client' && latestSession.status === 'ai') {
      if (isExplicitHumanAgentRequest(textBody)) {
        const transferred = liveChatStore.transferToAdmin(latestSession.id);
        if (transferred) {
          latestSession = transferred;
          broadcastSessionUpdate(latestSession);
        }
        res.json({
          ok: true,
          session: latestSession,
          aiPending: false,
          suggestHumanTransfer: false,
        });
        return;
      }

      const targetSessionId = latestSession.id;
      const snapshotClientName = latestSession.clientName;
      const snapshotClientEmail = latestSession.clientEmail;
      const snapshotPageContext = latestSession.pageContext;
      const snapshotHistory = [...latestSession.messages];
      const snapshotAttachments = attCheck.attachments;

      broadcastAiTyping(targetSessionId, true);

      res.json({
        ok: true,
        session: latestSession,
        aiPending: true,
        suggestHumanTransfer: false,
      });

      void (async () => {
        try {
          const aiRes = await generateLiveChatAiReply({
            clientName: snapshotClientName,
            clientEmail: snapshotClientEmail,
            pageContext: snapshotPageContext,
            history: snapshotHistory,
            latestMessage: textBody,
            attachments: snapshotAttachments,
          });
          const aiAppend = liveChatStore.appendMessage(targetSessionId, {
            senderRole: 'ai',
            senderName: 'CPCloudHost AI Engineer',
            body: aiRes.reply,
          });
          if (aiAppend) {
            broadcastSessionUpdate(aiAppend.session, {
              suggestHumanTransfer: aiRes.suggestHumanTransfer,
            });
          }
        } catch {
          const fallbackAppend = liveChatStore.appendMessage(targetSessionId, {
            senderRole: 'ai',
            senderName: 'CPCloudHost AI Engineer',
            body: 'I could not reach automated diagnostics right now. Click "Transfer to Live Agent" below to connect directly with a senior human support engineer.',
          });
          if (fallbackAppend) {
            broadcastSessionUpdate(fallbackAppend.session, { suggestHumanTransfer: true });
          }
        } finally {
          broadcastAiTyping(targetSessionId, false);
        }
      })();
      return;
    }

    res.json({
      ok: true,
      session: latestSession,
      aiPending: false,
      suggestHumanTransfer: false,
    });
  });

  app.post('/api/live-chat/sessions/:id/transfer', (req, res) => {
    const sess = liveChatStore.getSession(req.params.id);
    if (!sess) {
      res.status(404).json({ ok: false, error: 'Live chat session not found.' });
      return;
    }
    if (sess.status === 'closed') {
      res.status(400).json({ ok: false, error: 'Closed sessions cannot be transferred.' });
      return;
    }
    const updated = liveChatStore.transferToAdmin(sess.id);
    if (!updated) {
      res.status(400).json({ ok: false, error: 'Unable to transfer session.' });
      return;
    }
    broadcastSessionUpdate(updated);
    res.json({ ok: true, session: updated });
  });

  app.post('/api/live-chat/sessions/:id/join', (req, res) => {
    const { adminEmail } = (req.body || {}) as {
      adminName?: string;
      adminEmail?: string;
    };
    const updated = liveChatStore.joinAsAdmin(
      req.params.id,
      'Support cpcloudhost',
      adminEmail
    );
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Active chat session not found.' });
      return;
    }
    broadcastSessionUpdate(updated);
    res.json({ ok: true, session: updated });
  });

  app.post('/api/live-chat/sessions/:id/return-ai', (req, res) => {
    const updated = liveChatStore.returnToAi(
      req.params.id,
      'Support cpcloudhost'
    );
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Active chat session not found.' });
      return;
    }
    broadcastSessionUpdate(updated);
    res.json({ ok: true, session: updated });
  });

  app.post('/api/live-chat/sessions/:id/close', (req, res) => {
    const { closedBy } = (req.body || {}) as {
      closedBy?: 'client' | 'admin';
      actorName?: string;
    };
    const updated = liveChatStore.closeSession(
      req.params.id,
      closedBy === 'admin' ? 'admin' : 'client',
      closedBy === 'admin' ? 'Support cpcloudhost' : undefined
    );
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Live chat session not found.' });
      return;
    }
    broadcastSessionUpdate(updated);
    res.json({ ok: true, session: updated });
  });

  // =========================================================================
  // GEMINI AI SUPPORT TICKET TRIAGE & ADMIN DRAFT ASSISTANT
  // =========================================================================
  app.post('/api/ai/ticket-triage', async (req, res) => {
    const {
      department,
      priority,
      relatedService,
      subject,
      description,
      attachments: rawAttachments,
    } = (req.body || {}) as {
      department?: string;
      priority?: string;
      relatedService?: string;
      subject?: string;
      description?: string;
      attachments?: unknown;
    };

    if (!subject?.trim() || !description?.trim()) {
      res.status(400).json({
        ok: false,
        error: 'Subject and description are required for AI diagnostics.',
      });
      return;
    }

    const attCheck = validateAttachments(rawAttachments);
    if (!attCheck.ok) {
      res.status(400).json({ ok: false, error: attCheck.error });
      return;
    }

    try {
      const triage = await generateTicketTriageAi({
        department: department || 'Technical Support',
        priority: priority || 'Normal',
        relatedService,
        subject: subject.trim(),
        description: description.trim(),
        attachments: attCheck.attachments,
      });
      res.json({ ok: true, triage });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI diagnostics failed.';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  app.post('/api/ai/admin-draft', async (req, res) => {
    const { contextType, subject, department, relatedService, history } = (req.body || {}) as {
      contextType?: 'live-chat' | 'ticket';
      subject?: string;
      department?: string;
      relatedService?: string;
      history?: Array<{ sender: string; body: string; attachments?: LiveChatAttachment[] }>;
    };

    try {
      const draft = await generateAdminDraftReply({
        contextType: contextType === 'live-chat' ? 'live-chat' : 'ticket',
        subject,
        department,
        relatedService,
        history: Array.isArray(history) ? history : [],
      });
      res.json({ ok: true, draft });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate AI reply draft.';
      res.status(500).json({ ok: false, error: msg });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CPCloudHost server & WebSocket desk listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CPCloudHost server:', err);
  process.exit(1);
});
