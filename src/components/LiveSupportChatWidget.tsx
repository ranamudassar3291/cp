import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Headphones,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  Paperclip,
  RotateCcw,
  Send,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { LiveChatAttachment, LiveChatSession } from '../types/liveChat';

const STORAGE_SESSION_KEY = 'cpcloudhost_live_chat_session_id';
const STORAGE_VISITOR_KEY = 'cpcloudhost_live_visitor_id';
const MAX_CHAT_FILES = 5;
const MAX_CHAT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return `VIS-${Date.now()}`;
  const existing = window.localStorage.getItem(STORAGE_VISITOR_KEY);
  if (existing) return existing;
  const created = `VIS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  window.localStorage.setItem(STORAGE_VISITOR_KEY, created);
  return created;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readChatFile(file: File): Promise<LiveChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error(`Unable to read "${file.name}".`));
        return;
      }
      resolve({
        id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl,
      });
    };
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

function formatExpiryRemaining(expiresAtMs: number): string {
  const diffMs = Math.max(0, expiresAtMs - Date.now());
  const hrs = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hrs >= 1) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

interface LiveSupportChatWidgetProps {
  pageContext?: string;
}

export const LiveSupportChatWidget: React.FC<LiveSupportChatWidgetProps> = ({
  pageContext = '/',
}) => {
  const { currentUser } = usePlatform();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [session, setSession] = useState<LiveChatSession | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [suggestTransferBanner, setSuggestTransferBanner] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<LiveChatAttachment[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewImgId, setPreviewImgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = useCallback(() => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, []);

  // Allow any button across Client Dashboard or Website to open Live Chat
  useEffect(() => {
    const onOpenTrigger = () => setOpen(true);
    window.addEventListener('cpcloudhost:open-live-chat', onOpenTrigger);
    return () => {
      window.removeEventListener('cpcloudhost:open-live-chat', onOpenTrigger);
    };
  }, []);

  const ensureSession = useCallback(
    async (forceNew = false): Promise<LiveChatSession | null> => {
      setInitializing(true);
      setErrorMsg('');
      try {
        const storedId = forceNew
          ? undefined
          : window.localStorage.getItem(STORAGE_SESSION_KEY) || undefined;
        const visitorId = getOrCreateVisitorId();
        const res = await fetch('/api/live-chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: storedId,
            visitorId,
            clientName: currentUser?.name || guestName.trim() || 'Guest Visitor',
            clientEmail: currentUser?.email || guestEmail.trim() || '',
            isAuthenticatedClient: Boolean(currentUser),
            pageContext,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; session?: LiveChatSession; error?: string };
        if (!res.ok || !data.ok || !data.session) {
          throw new Error(data.error || 'Could not initialize live support session.');
        }
        window.localStorage.setItem(STORAGE_SESSION_KEY, data.session.id);
        setSession(data.session);
        setConfirmClose(false);
        return data.session;
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to connect to support chat server.'
        );
        return null;
      } finally {
        setInitializing(false);
      }
    },
    [currentUser, guestName, guestEmail, pageContext]
  );

  // Load existing persisted session immediately on mount or auth change
  useEffect(() => {
    const existingId = window.localStorage.getItem(STORAGE_SESSION_KEY);
    if (existingId || open) {
      void ensureSession(false);
    }
  }, [open, currentUser?.email, ensureSession]);

  // Real-time WebSocket subscription for the active chat session
  useEffect(() => {
    if (!session?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-chat?role=client&sessionId=${encodeURIComponent(
      session.id
    )}`;

    let closedByEffect = false;
    let reconnectTimer: number | null = null;

    const connectWs = () => {
      if (closedByEffect) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data)) as {
            type?: string;
            sessionId?: string;
            typing?: boolean;
            suggestHumanTransfer?: boolean;
            session?: LiveChatSession;
          };
          if (msg.type === 'chat:ai_typing' && msg.sessionId === session.id) {
            setAiTyping(Boolean(msg.typing));
            scrollToBottom();
          } else if (msg.type === 'chat:session_updated' && msg.session && msg.session.id === session.id) {
            setSession(msg.session);
            if (msg.session.messages[msg.session.messages.length - 1]?.senderRole !== 'client') {
              setAiTyping(false);
            }
            if (msg.suggestHumanTransfer && msg.session.status === 'ai') {
              setSuggestTransferBanner(true);
            }
            scrollToBottom();
          }
        } catch {
          // ignore malformed WS frames
        }
      };

      ws.onclose = () => {
        if (!closedByEffect) {
          reconnectTimer = window.setTimeout(connectWs, 3500);
        }
      };
    };

    connectWs();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [session?.id]);

  useEffect(() => {
    if (open && session?.messages.length) {
      scrollToBottom();
    }
  }, [open, session?.messages.length, scrollToBottom]);

  const handleAttachFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg('');

    const remaining = Math.max(0, MAX_CHAT_FILES - attachments.length);
    if (remaining === 0) {
      setErrorMsg(`Up to ${MAX_CHAT_FILES} files allowed per message.`);
      return;
    }

    const picked = Array.from(fileList).slice(0, remaining);
    const oversized = picked.find((f) => f.size > MAX_CHAT_FILE_BYTES);
    if (oversized) {
      setErrorMsg(
        `"${oversized.name}" is ${formatBytes(oversized.size)}, which exceeds the 10 MB file limit.`
      );
      return;
    }

    try {
      const encoded = await Promise.all(picked.map(readChatFile));
      setAttachments((prev) => [...prev, ...encoded].slice(0, MAX_CHAT_FILES));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to attach file.');
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? draft).trim();
    if (!textToSend && attachments.length === 0) return;
    if (sending) return;

    setErrorMsg('');
    setSending(true);
    try {
      let targetSession = session;
      if (!targetSession || targetSession.status === 'closed') {
        targetSession = await ensureSession(targetSession?.status === 'closed');
      }
      if (!targetSession) {
        setSending(false);
        return;
      }

      const outgoingAtts = [...attachments];
      const clientSenderName = currentUser?.name || guestName.trim() || targetSession.clientName;
      if (!overrideText) {
        setDraft('');
      }
      setAttachments([]);

      // Optimistic client bubble for zero perceived delay
      const optimisticId = `TMP-${Date.now()}`;
      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: optimisticId,
                  senderRole: 'client',
                  senderName: clientSenderName,
                  body: textToSend || 'Sent file attachment(s) for review.',
                  timestampUtc: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
                  timestampMs: Date.now(),
                  attachments: outgoingAtts.length > 0 ? outgoingAtts : undefined,
                },
              ],
            }
          : prev
      );
      if (targetSession.status === 'ai') {
        setAiTyping(true);
      }
      scrollToBottom();

      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(targetSession.id)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderRole: 'client',
            senderName: clientSenderName,
            body: textToSend,
            attachments: outgoingAtts,
          }),
        }
      );

      const data = (await res.json()) as {
        ok?: boolean;
        session?: LiveChatSession;
        aiPending?: boolean;
        suggestHumanTransfer?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.session) {
        setAiTyping(false);
        setErrorMsg(data.error || 'Could not deliver message.');
        if (data.session) setSession(data.session);
        return;
      }

      setSession(data.session);
      if (!data.aiPending) {
        setAiTyping(false);
      }
      if (data.suggestHumanTransfer && data.session.status === 'ai') {
        setSuggestTransferBanner(true);
      }
      scrollToBottom();
    } catch (err) {
      setAiTyping(false);
      setErrorMsg(err instanceof Error ? err.message : 'Network error sending message.');
    } finally {
      setSending(false);
    }
  };

  const handleTransferToAgent = async () => {
    if (!session || transferring || session.status !== 'ai') return;
    setTransferring(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(session.id)}/transfer`,
        { method: 'POST' }
      );
      const data = (await res.json()) as {
        ok?: boolean;
        session?: LiveChatSession;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.session) {
        setErrorMsg(data.error || 'Unable to transfer chat to live agent.');
        return;
      }
      setSession(data.session);
      setSuggestTransferBanner(false);
      scrollToBottom();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Transfer request failed.');
    } finally {
      setTransferring(false);
    }
  };

  const handleCloseChat = async () => {
    if (!session || closing || session.status === 'closed') return;
    setClosing(true);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(session.id)}/close`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            closedBy: 'client',
            actorName: currentUser?.name || guestName.trim() || session.clientName,
          }),
        }
      );
      const data = (await res.json()) as {
        ok?: boolean;
        session?: LiveChatSession;
        error?: string;
      };
      if (data.session) {
        setSession(data.session);
      } else if (!res.ok) {
        setErrorMsg(data.error || 'Could not close chat session.');
      }
      setConfirmClose(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to close chat.');
    } finally {
      setClosing(false);
    }
  };

  const handleStartNewChat = async () => {
    setSuggestTransferBanner(false);
    setConfirmClose(false);
    setAttachments([]);
    setDraft('');
    await ensureSession(true);
  };

  const statusSummary = useMemo(() => {
    if (!session) {
      return {
        title: 'AI Engineering Support',
        subtitle: 'Instant error diagnostics & live escalation · Auto-closes in 24h',
      };
    }
    if (session.status === 'waiting_admin') {
      return {
        title: 'Connecting to Live Agent',
        subtitle: `In live queue (${session.id}) · Please hold while an engineer joins`,
      };
    }
    if (session.status === 'admin_active') {
      return {
        title: session.assignedAdminName || 'Live Support Engineer',
        subtitle: `Live Agent Connected · Session ${session.id}`,
      };
    }
    if (session.status === 'closed') {
      return {
        title: 'Chat Session Closed',
        subtitle: session.closeReason || `Session ${session.id} ended`,
      };
    }
    return {
      title: 'CPCloudHost Live & AI Support',
      subtitle: `AI Assistant Active · Auto-closes in ${formatExpiryRemaining(
        session.expiresAtMs
      )}`,
    };
  }, [session]);

  const unreadAdminReplyHint = useMemo(() => {
    if (open || !session) return false;
    const last = session.messages[session.messages.length - 1];
    return Boolean(last && (last.senderRole === 'admin' || last.senderRole === 'system'));
  }, [open, session]);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          role="dialog"
          aria-label="CPCloudHost Live Support Chat"
          className={`bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
            expanded
              ? 'w-[calc(100vw-2rem)] sm:w-[540px] h-[min(85vh,680px)]'
              : 'w-[calc(100vw-2rem)] sm:w-[410px] h-[min(80vh,580px)]'
          }`}
        >
          {/* Dark Slate Header */}
          <div className="bg-[#0F172A] text-white px-4 py-3.5 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {session?.status === 'admin_active' ? (
                    <UserCheck className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
                  ) : session?.status === 'waiting_admin' ? (
                    <Headphones className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                  ) : session?.status === 'closed' ? (
                    <XCircle className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
                  )}
                  <h2 className="font-display text-sm font-bold truncate">
                    {statusSummary.title}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                  {statusSummary.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-label={expanded ? 'Compact chat size' : 'Expand chat size'}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {expanded ? (
                    <Minimize2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Minimize support chat"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Session Control Strip: Transfer to Live Agent & Close Chat */}
            {session && session.status !== 'closed' && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                {session.status === 'ai' ? (
                  <button
                    type="button"
                    disabled={transferring}
                    onClick={handleTransferToAgent}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-60 text-[11px] font-semibold text-white whitespace-nowrap cursor-pointer"
                  >
                    {transferring ? (
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <Headphones className="w-3 h-3" aria-hidden="true" />
                    )}
                    <span>Transfer to Live Agent</span>
                  </button>
                ) : session.status === 'waiting_admin' ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                    <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Waiting for Live Agent</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Live Human Agent Active</span>
                  </span>
                )}

                {!confirmClose ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClose(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 hover:border-red-400 text-[11px] font-semibold text-slate-200 hover:text-red-200 whitespace-nowrap cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" aria-hidden="true" />
                    <span>Close Chat</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={closing}
                      onClick={handleCloseChat}
                      className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      {closing ? 'Closing...' : 'Confirm Close'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClose(false)}
                      className="px-2 py-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                    >
                      Keep
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Guest Contact Quick Bar (if not authenticated) */}
          {!currentUser && (!session || session.clientName === 'Guest Visitor') && (
            <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] grid grid-cols-2 gap-2 shrink-0">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your Name (optional)"
                aria-label="Your Name"
                className="px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Email for follow-up"
                aria-label="Your Email"
                className="px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
              />
            </div>
          )}

          {/* Waiting for Live Agent Notice */}
          {session?.status === 'waiting_admin' && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2 shrink-0">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  Transferred to Live Human Support Queue
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  Please hold a moment while an engineer connects. You can attach additional screenshots or logs below.
                </p>
              </div>
            </div>
          )}

          {/* AI Suggests Escalation Bar */}
          {suggestTransferBanner && session?.status === 'ai' && (
            <div className="px-4 py-2.5 bg-[#F2FAF8] border-b border-[#0E6B63]/20 text-xs flex items-center justify-between gap-2 shrink-0">
              <span className="text-[#0F172A] font-medium">
                Want a live human engineer to take over?
              </span>
              <button
                type="button"
                onClick={handleTransferToAgent}
                className="px-2.5 py-1 rounded-md bg-[#0E6B63] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Connect Agent
              </button>
            </div>
          )}

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] space-y-3">
            {initializing && !session ? (
              <div className="flex items-center justify-center py-10 text-xs text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0E6B63]" aria-hidden="true" />
                <span>Connecting to live support desk...</span>
              </div>
            ) : (
              session?.messages.map((msg) => {
                if (msg.senderRole === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[11px] text-slate-600 leading-relaxed"
                    >
                      <span className="font-semibold text-[#0F172A] mr-1.5">
                        {msg.senderName}:
                      </span>
                      <span>{msg.body}</span>
                    </div>
                  );
                }

                const isClient = msg.senderRole === 'client';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                      <span className="font-semibold text-[#0F172A]">
                        {isClient ? 'You' : msg.senderName}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {msg.timestampUtc.slice(11, 16)} UTC
                      </span>
                    </div>
                    <div
                      className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isClient
                          ? 'bg-[#0E6B63] text-white'
                          : msg.senderRole === 'admin'
                          ? 'bg-white border border-[#0E6B63]/40 text-[#0F172A]'
                          : 'bg-white border border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    >
                      {msg.body}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 space-y-2">
                          {msg.attachments.map((att) => {
                            const isImg = att.mimeType.startsWith('image/');
                            const zoomed = previewImgId === att.id;
                            return (
                              <div
                                key={att.id}
                                className={`rounded-lg p-2 border ${
                                  isClient
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                                }`}
                              >
                                {isImg ? (
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    onClick={() =>
                                      setPreviewImgId((prev) =>
                                        prev === att.id ? null : att.id
                                      )
                                    }
                                    className={`w-full rounded object-contain cursor-pointer ${
                                      zoomed ? 'max-h-72' : 'max-h-32'
                                    }`}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 text-[11px]">
                                    <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate font-medium">{att.name}</span>
                                  </div>
                                )}
                                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] opacity-85">
                                  <span className="truncate font-mono">
                                    {att.name} ({formatBytes(att.sizeBytes)})
                                  </span>
                                  <a
                                    href={att.dataUrl}
                                    download={att.name}
                                    className="inline-flex items-center gap-1 font-semibold underline shrink-0"
                                  >
                                    <Download className="w-3 h-3" aria-hidden="true" />
                                    <span>Save</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Quick Troubleshooting Chips on Initial Conversation */}
            {session && session.status === 'ai' && session.messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Fix 500 / 502 Error',
                  'SSL & DNS Not Propagating',
                  'Free cPanel Migration',
                  'Easypaisa Invoice Verification',
                ].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    disabled={sending}
                    onClick={() => handleSendMessage(topic)}
                    className="px-2.5 py-1.5 text-[11px] font-medium bg-white border border-[#E2E8F0] hover:border-[#0E6B63] text-[#0F172A] rounded-lg transition-colors cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            {(sending || aiTyping) && (
              <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E6B63]" aria-hidden="true" />
                <span>
                  {aiTyping || session?.status === 'ai'
                    ? 'AI Engineer is replying...'
                    : 'Sending message...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Preview Strip */}
          {attachments.length > 0 && (
            <div className="px-3.5 py-2 bg-white border-t border-[#E2E8F0] flex flex-wrap gap-2 shrink-0">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] max-w-[175px]"
                >
                  <span className="truncate font-medium text-[#0F172A]">
                    {att.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {formatBytes(att.sizeBytes)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${att.name}`}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                    }
                    className="text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errorMsg && (
            <div className="px-3.5 py-2 bg-red-50 border-t border-red-200 text-[11px] font-semibold text-red-700 flex items-center gap-1.5 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Composer or Closed State */}
          {session?.status === 'closed' ? (
            <div className="p-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-[#0F172A]">Chat session closed</p>
                <p className="text-[11px] text-slate-500">
                  Need more help? Open a fresh session anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start New Chat</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="p-3 bg-white border-t border-[#E2E8F0] shrink-0 space-y-2"
            >
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.log,.csv,.json,.zip,.conf,.md"
                  onChange={(e) => {
                    void handleAttachFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  title="Attach screenshots, logs, or PDF (Max 10 MB per file)"
                  aria-label="Attach screenshot or file up to 10 MB"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] bg-[#F8FAFC] text-slate-600 hover:text-[#0E6B63] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" aria-hidden="true" />
                </button>

                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe your error or ask a question..."
                  aria-label="Message live support"
                  className="flex-1 h-9 px-3 text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                />

                <button
                  type="submit"
                  disabled={sending || (!draft.trim() && attachments.length === 0)}
                  aria-label="Send support message"
                  className="w-9 h-9 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                <span>Attach screenshots/logs up to 10 MB ({attachments.length}/5)</span>
                <span>Auto-closes 24h after inactivity</span>
              </div>
            </form>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close live support chat' : 'Open live support chat'}
        className="relative h-13 px-4 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white shadow-lg flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">
              Live Support
            </span>
          </>
        )}
        {unreadAdminReplyHint && (
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
        )}
      </button>
    </div>
  );
};
