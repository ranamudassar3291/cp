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

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '60mb' }));

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

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'cpcloudhost-api',
      timeUtc: new Date().toISOString(),
    });
  });

  // Real StackMail / SMTP verification & test email dispatch
  app.post('/api/system/test-smtp', async (req, res) => {
    const {
      host,
      port,
      encryption,
      username,
      password,
      fromName,
      fromEmail,
      testTo,
    } = (req.body || {}) as {
      host?: string;
      port?: number | string;
      encryption?: 'ssl' | 'tls' | 'none';
      username?: string;
      password?: string;
      fromName?: string;
      fromEmail?: string;
      testTo?: string;
    };

    const cleanHost = (host || '').trim();
    const numericPort = Number(port || 465);
    const cleanUser = (username || '').trim();
    const cleanPass = password || '';
    const cleanFromEmail = (fromEmail || cleanUser).trim();
    const cleanTestTo = (testTo || cleanFromEmail).trim();

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
      const senderLabel = (fromName || 'CPCloudHost').replace(/"/g, '').trim();

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

    const cleanHost = (smtp?.host || '').trim();
    const cleanUser = (smtp?.username || '').trim();
    const cleanPass = smtp?.password || '';
    const numericPort = Number(smtp?.port || 465);

    if (!cleanHost || !cleanUser || !cleanPass || !toEmail) {
      res.status(400).json({ ok: false, error: 'SMTP credentials or recipient missing.' });
      return;
    }

    const useSsl =
      smtp?.encryption === 'ssl' ||
      (smtp?.encryption !== 'tls' && smtp?.encryption !== 'none' && numericPort === 465);
    const brand = (companyName || 'CPCloudHost').trim();
    const senderLabel = (smtp?.fromName || brand).replace(/"/g, '').trim();
    const fromEmail = (smtp?.fromEmail || cleanUser).trim();

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
    const { hostname, port, useSsl, username, apiToken, ignoreSslErrors } = (req.body || {}) as {
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
    const cleanToken = (apiToken || '').trim();

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

    const rawAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !apiToken || !domain || !rawAcct || !plan) {
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
        apiToken,
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
    const { hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, newPassword } =
      (req.body || {}) as {
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
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !apiToken || !targetAcct || !newPassword) {
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
        apiToken,
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
    const { hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, reason } =
      (req.body || {}) as {
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
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !apiToken || !targetAcct) {
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
        apiToken,
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
    const { hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername } =
      (req.body || {}) as {
        hostname?: string;
        port?: number | string;
        useSsl?: boolean;
        username?: string;
        apiToken?: string;
        ignoreSslErrors?: boolean;
        acctUsername?: string;
        cpanelUsername?: string;
      };
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !apiToken || !targetAcct) {
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
        apiToken,
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
    const { hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, pkg } =
      (req.body || {}) as {
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
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !apiToken || !targetAcct || !pkg) {
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
        apiToken,
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
    const { hostname, port, useSsl, username, apiToken, ignoreSslErrors, acctUsername, cpanelUsername, service } =
      (req.body || {}) as {
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
    const targetAcct = (acctUsername || cpanelUsername || '').trim();
    if (!hostname || !username || !apiToken || !targetAcct) {
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
        hostname,
        port: Number(port || 2087),
        useSsl: useSsl !== false,
        path: `/json-api/create_user_session?${qs.toString()}`,
        username,
        apiToken,
        ignoreSslErrors: Boolean(ignoreSslErrors),
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
        res.json({
          ok: true,
          email: gData.email.toLowerCase(),
          name: gData.name || gData.email.split('@')[0],
          sub: gData.sub || '',
        });
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
        res.json({
          ok: true,
          email: uData.email.toLowerCase(),
          name: uData.name || uData.email.split('@')[0],
          sub: uData.sub || '',
        });
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

    const cleanHost = (smtp?.host || '').trim();
    const cleanUser = (smtp?.username || '').trim();
    const cleanPass = smtp?.password || '';
    const numericPort = Number(smtp?.port || 465);

    if (!cleanHost || !cleanUser || !cleanPass || !toEmail || !subject || !body) {
      res.status(400).json({ ok: false, error: 'Missing SMTP credentials, recipient, or email body.' });
      return;
    }

    const useSsl =
      smtp?.encryption === 'ssl' ||
      (smtp?.encryption !== 'tls' && smtp?.encryption !== 'none' && numericPort === 465);
    const brand = (companyName || 'CPCloudHost').trim();
    const senderLabel = (smtp?.fromName || brand).replace(/"/g, '').trim();
    const fromEmail = (smtp?.fromEmail || cleanUser).trim();
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
      senderName: (senderName || '').trim() || (role === 'admin' ? 'Support Engineer' : sess.clientName),
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
    const { adminName, adminEmail } = (req.body || {}) as {
      adminName?: string;
      adminEmail?: string;
    };
    const updated = liveChatStore.joinAsAdmin(
      req.params.id,
      (adminName || '').trim() || 'Senior Support Engineer',
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
    const { adminName } = (req.body || {}) as { adminName?: string };
    const updated = liveChatStore.returnToAi(
      req.params.id,
      (adminName || '').trim() || 'Support Staff'
    );
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Active chat session not found.' });
      return;
    }
    broadcastSessionUpdate(updated);
    res.json({ ok: true, session: updated });
  });

  app.post('/api/live-chat/sessions/:id/close', (req, res) => {
    const { closedBy, actorName } = (req.body || {}) as {
      closedBy?: 'client' | 'admin';
      actorName?: string;
    };
    const updated = liveChatStore.closeSession(
      req.params.id,
      closedBy === 'admin' ? 'admin' : 'client',
      actorName
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
