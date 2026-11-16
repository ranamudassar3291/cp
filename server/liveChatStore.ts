import fs from 'node:fs';
import path from 'node:path';
import type {
  LiveChatAttachment,
  LiveChatMessage,
  LiveChatSenderRole,
  LiveChatSession,
} from '../src/types/liveChat';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'live-chat-sessions.json');

// Auto-close chats cleanly after 24 hours (1 day)
export const CHAT_AUTO_CLOSE_MS = 24 * 60 * 60 * 1000;
export const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_CHAT_ATTACHMENT_COUNT = 5;

function nowUtcLabel(ms = Date.now()): string {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function makeMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class LiveChatStore {
  private sessions: Map<string, LiveChatSession> = new Map();

  constructor() {
    this.loadFromDisk();
    this.sweepExpiredSessions();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(STORE_FILE)) return;
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as LiveChatSession[];
      if (Array.isArray(parsed)) {
        for (const sess of parsed) {
          if (sess && sess.id) {
            this.sessions.set(sess.id, sess);
          }
        }
      }
    } catch {
      // Ignore corrupt/missing initial store and start cleanly
    }
  }

  private persistToDisk() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const arr = Array.from(this.sessions.values()).sort(
        (a, b) => b.updatedAtMs - a.updatedAtMs
      );
      fs.writeFileSync(STORE_FILE, JSON.stringify(arr), 'utf8');
    } catch {
      // Non-fatal if disk write fails in restricted container
    }
  }

  public sweepExpiredSessions(): LiveChatSession[] {
    const nowMs = Date.now();
    const expiredChanged: LiveChatSession[] = [];

    for (const [id, sess] of this.sessions.entries()) {
      if (sess.status !== 'closed' && nowMs >= sess.expiresAtMs) {
        const closedUtc = nowUtcLabel(nowMs);
        const sysMsg: LiveChatMessage = {
          id: makeMessageId('SYS'),
          senderRole: 'system',
          senderName: 'System',
          body: 'This live chat session has been automatically closed after 24 hours. Start a new chat anytime if you need further help.',
          timestampUtc: closedUtc,
          timestampMs: nowMs,
        };
        const updated: LiveChatSession = {
          ...sess,
          status: 'closed',
          updatedAtUtc: closedUtc,
          updatedAtMs: nowMs,
          closedAtUtc: closedUtc,
          closedBy: 'system_24h',
          closeReason: 'Auto-closed after 24 hours (1 day)',
          messages: [...sess.messages, sysMsg],
        };
        this.sessions.set(id, updated);
        expiredChanged.push(updated);
      }
    }

    if (expiredChanged.length > 0) {
      this.persistToDisk();
    }
    return expiredChanged;
  }

  public listSessions(): LiveChatSession[] {
    this.sweepExpiredSessions();
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAtMs - a.updatedAtMs
    );
  }

  public getSession(id: string): LiveChatSession | null {
    this.sweepExpiredSessions();
    return this.sessions.get(id) ?? null;
  }

  public createOrResumeSession(input: {
    sessionId?: string;
    visitorId?: string;
    clientName?: string;
    clientEmail?: string;
    isAuthenticatedClient?: boolean;
    pageContext?: string;
  }): LiveChatSession {
    this.sweepExpiredSessions();
    if (input.sessionId) {
      const existing = this.sessions.get(input.sessionId);
      if (existing) {
        let changed = false;
        const next = { ...existing };
        if (input.clientName && existing.clientName === 'Guest Visitor') {
          next.clientName = input.clientName.trim();
          changed = true;
        }
        if (input.clientEmail && !existing.clientEmail) {
          next.clientEmail = input.clientEmail.trim().toLowerCase();
          changed = true;
        }
        if (input.isAuthenticatedClient && !existing.isAuthenticatedClient) {
          next.isAuthenticatedClient = true;
          changed = true;
        }
        if (input.pageContext && input.pageContext !== existing.pageContext) {
          next.pageContext = input.pageContext;
          changed = true;
        }
        if (changed) {
          this.sessions.set(existing.id, next);
          this.persistToDisk();
        }
        return next;
      }
    }

    const nowMs = Date.now();
    const nowUtc = nowUtcLabel(nowMs);
    const expiresAtMs = nowMs + CHAT_AUTO_CLOSE_MS;
    const id = `CHAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const cleanName = (input.clientName || '').trim() || 'Guest Visitor';
    const cleanEmail = (input.clientEmail || '').trim().toLowerCase();

    const welcomeMsg: LiveChatMessage = {
      id: makeMessageId('AI'),
      senderRole: 'ai',
      senderName: 'CPCloudHost AI Engineer',
      body: `Hello ${cleanName === 'Guest Visitor' ? 'there' : cleanName}! Welcome to CPCloudHost Live Support. Describe any hosting, DNS, SSL, cPanel, VPS, or billing issue — or attach a screenshot/error log (up to 10 MB) — and I will help diagnose & fix it right away. You can also transfer to a live human agent anytime.`,
      timestampUtc: nowUtc,
      timestampMs: nowMs,
    };

    const session: LiveChatSession = {
      id,
      visitorId: input.visitorId || `VIS-${nowMs}`,
      clientName: cleanName,
      clientEmail: cleanEmail,
      isAuthenticatedClient: Boolean(input.isAuthenticatedClient),
      pageContext: input.pageContext || '/',
      status: 'ai',
      createdAtUtc: nowUtc,
      createdAtMs: nowMs,
      updatedAtUtc: nowUtc,
      updatedAtMs: nowMs,
      expiresAtUtc: nowUtcLabel(expiresAtMs),
      expiresAtMs,
      unreadForAdmin: 0,
      messages: [welcomeMsg],
    };

    this.sessions.set(id, session);
    this.persistToDisk();
    return session;
  }

  public appendMessage(
    sessionId: string,
    input: {
      senderRole: LiveChatSenderRole;
      senderName: string;
      body: string;
      attachments?: LiveChatAttachment[];
      markAdminRead?: boolean;
      incrementAdminUnread?: boolean;
    }
  ): { session: LiveChatSession; message: LiveChatMessage } | null {
    this.sweepExpiredSessions();
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;

    const nowMs = Date.now();
    const nowUtc = nowUtcLabel(nowMs);
    const expiresAtMs = nowMs + CHAT_AUTO_CLOSE_MS;

    const message: LiveChatMessage = {
      id: makeMessageId(
        input.senderRole === 'client'
          ? 'CLI'
          : input.senderRole === 'admin'
          ? 'ADM'
          : input.senderRole === 'ai'
          ? 'AI'
          : 'SYS'
      ),
      senderRole: input.senderRole,
      senderName: input.senderName,
      body: input.body.trim(),
      timestampUtc: nowUtc,
      timestampMs: nowMs,
      attachments:
        input.attachments && input.attachments.length > 0
          ? input.attachments.slice(0, MAX_CHAT_ATTACHMENT_COUNT)
          : undefined,
    };

    const nextUnread = input.markAdminRead
      ? 0
      : input.incrementAdminUnread
      ? (existing.unreadForAdmin || 0) + 1
      : existing.unreadForAdmin || 0;

    const updated: LiveChatSession = {
      ...existing,
      updatedAtUtc: nowUtc,
      updatedAtMs: nowMs,
      expiresAtUtc: nowUtcLabel(expiresAtMs),
      expiresAtMs,
      unreadForAdmin: nextUnread,
      messages: [...existing.messages, message],
    };

    this.sessions.set(sessionId, updated);
    this.persistToDisk();
    return { session: updated, message };
  }

  public transferToAdmin(
    sessionId: string,
    reason?: string
  ): LiveChatSession | null {
    this.sweepExpiredSessions();
    const existing = this.sessions.get(sessionId);
    if (!existing || existing.status === 'closed') return null;

    if (existing.status === 'waiting_admin' || existing.status === 'admin_active') {
      return existing;
    }

    const nowMs = Date.now();
    const nowUtc = nowUtcLabel(nowMs);
    const expiresAtMs = nowMs + CHAT_AUTO_CLOSE_MS;

    const waitMsg: LiveChatMessage = {
      id: makeMessageId('SYS'),
      senderRole: 'system',
      senderName: 'Support Queue',
      body:
        'Your conversation and any attached screenshots/logs have been transferred to our live engineering desk. Please hold for a moment while a senior human agent connects — you can continue sharing additional details below.',
      timestampUtc: nowUtc,
      timestampMs: nowMs,
    };

    const updated: LiveChatSession = {
      ...existing,
      status: 'waiting_admin',
      updatedAtUtc: nowUtc,
      updatedAtMs: nowMs,
      expiresAtUtc: nowUtcLabel(expiresAtMs),
      expiresAtMs,
      unreadForAdmin: (existing.unreadForAdmin || 0) + 1,
      messages: [...existing.messages, waitMsg],
      ...(reason ? {} : {}),
    };

    this.sessions.set(sessionId, updated);
    this.persistToDisk();
    return updated;
  }

  public joinAsAdmin(
    sessionId: string,
    adminName: string,
    adminEmail?: string
  ): LiveChatSession | null {
    this.sweepExpiredSessions();
    const existing = this.sessions.get(sessionId);
    if (!existing || existing.status === 'closed') return null;

    const nowMs = Date.now();
    const nowUtc = nowUtcLabel(nowMs);
    const expiresAtMs = nowMs + CHAT_AUTO_CLOSE_MS;

    const alreadyJoined =
      existing.status === 'admin_active' && existing.assignedAdminName === adminName;

    const joinMsg: LiveChatMessage | null = alreadyJoined
      ? null
      : {
          id: makeMessageId('SYS'),
          senderRole: 'system',
          senderName: 'Live Agent Connected',
          body: `${adminName} has joined the live chat and is reviewing your request.`,
          timestampUtc: nowUtc,
          timestampMs: nowMs,
        };

    const updated: LiveChatSession = {
      ...existing,
      status: 'admin_active',
      assignedAdminName: adminName,
      assignedAdminEmail: adminEmail,
      updatedAtUtc: nowUtc,
      updatedAtMs: nowMs,
      expiresAtUtc: nowUtcLabel(expiresAtMs),
      expiresAtMs,
      unreadForAdmin: 0,
      messages: joinMsg ? [...existing.messages, joinMsg] : existing.messages,
    };

    this.sessions.set(sessionId, updated);
    this.persistToDisk();
    return updated;
  }

  public markAdminRead(sessionId: string): LiveChatSession | null {
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;
    if (existing.unreadForAdmin === 0) return existing;
    const updated: LiveChatSession = {
      ...existing,
      unreadForAdmin: 0,
    };
    this.sessions.set(sessionId, updated);
    this.persistToDisk();
    return updated;
  }

  public returnToAi(sessionId: string, adminName: string): LiveChatSession | null {
    this.sweepExpiredSessions();
    const existing = this.sessions.get(sessionId);
    if (!existing || existing.status === 'closed') return null;

    const nowMs = Date.now();
    const nowUtc = nowUtcLabel(nowMs);
    const expiresAtMs = nowMs + CHAT_AUTO_CLOSE_MS;

    const sysMsg: LiveChatMessage = {
      id: makeMessageId('SYS'),
      senderRole: 'system',
      senderName: 'Support Routing',
      body: `${adminName} handed this conversation back to CPCloudHost AI Assistant for ongoing troubleshooting.`,
      timestampUtc: nowUtc,
      timestampMs: nowMs,
    };

    const updated: LiveChatSession = {
      ...existing,
      status: 'ai',
      updatedAtUtc: nowUtc,
      updatedAtMs: nowMs,
      expiresAtUtc: nowUtcLabel(expiresAtMs),
      expiresAtMs,
      unreadForAdmin: 0,
      messages: [...existing.messages, sysMsg],
    };

    this.sessions.set(sessionId, updated);
    this.persistToDisk();
    return updated;
  }

  public closeSession(
    sessionId: string,
    closedBy: 'client' | 'admin',
    actorName?: string
  ): LiveChatSession | null {
    this.sweepExpiredSessions();
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;
    if (existing.status === 'closed') return existing;

    const nowMs = Date.now();
    const nowUtc = nowUtcLabel(nowMs);

    const sysMsg: LiveChatMessage = {
      id: makeMessageId('SYS'),
      senderRole: 'system',
      senderName: 'Chat Closed',
      body:
        closedBy === 'client'
          ? 'You closed this live support session. You can start a new chat anytime.'
          : `This live support session was closed by ${actorName || 'Support Staff'}. Start a new chat anytime if you need more help.`,
      timestampUtc: nowUtc,
      timestampMs: nowMs,
    };

    const updated: LiveChatSession = {
      ...existing,
      status: 'closed',
      updatedAtUtc: nowUtc,
      updatedAtMs: nowMs,
      closedAtUtc: nowUtc,
      closedBy,
      closeReason: closedBy === 'client' ? 'Closed by client' : `Closed by ${actorName || 'Admin'}`,
      unreadForAdmin: 0,
      messages: [...existing.messages, sysMsg],
    };

    this.sessions.set(sessionId, updated);
    this.persistToDisk();
    return updated;
  }
}

export const liveChatStore = new LiveChatStore();
