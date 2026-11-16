import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import type {
  LiveChatAttachment,
  LiveChatSession,
  LiveChatStatus,
} from '../../types/liveChat';

interface AdminLiveChatViewProps {
  onShowToast: (msg: string) => void;
  onManageClient?: (userId: string) => void;
}

const MAX_ADMIN_CHAT_FILES = 5;
const MAX_ADMIN_CHAT_BYTES = 10 * 1024 * 1024; // 10 MB per file

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readAdminChatFile(file: File): Promise<LiveChatAttachment> {
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

function getStatusBadgeMeta(status: LiveChatStatus): {
  label: string;
  classes: string;
} {
  if (status === 'waiting_admin') {
    return {
      label: 'Waiting for Agent',
      classes: 'text-[#D97706] bg-[#D97706]/10',
    };
  }
  if (status === 'admin_active') {
    return {
      label: 'Live Agent Active',
      classes: 'text-[#16A34A] bg-[#16A34A]/10',
    };
  }
  if (status === 'closed') {
    return {
      label: 'Closed',
      classes: 'text-slate-600 bg-slate-100',
    };
  }
  return {
    label: 'AI Assistant',
    classes: 'text-[#0E6B63] bg-[#0E6B63]/10',
  };
}

export const AdminLiveChatView: React.FC<AdminLiveChatViewProps> = ({
  onShowToast,
  onManageClient,
}) => {
  const { currentUser, users } = usePlatform();

  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | LiveChatStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const [replyDraft, setReplyDraft] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<LiveChatAttachment[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [joiningChat, setJoiningChat] = useState(false);
  const [closingChat, setClosingChat] = useState(false);
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);
  const [actionError, setActionError] = useState('');
  const [expandedImageIds, setExpandedImageIds] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/live-chat/sessions');
      const data = (await res.json()) as { ok?: boolean; sessions?: LiveChatSession[] };
      if (res.ok && data.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        setSelectedId((prev) => prev || data.sessions?.[0]?.id || null);
      }
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  // Real-time WebSocket stream for Admin console
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-chat?role=admin`;
    let closedByEffect = false;
    let reconnectTimer: number | null = null;
    let ws: WebSocket | null = null;

    const connect = () => {
      if (closedByEffect) return;
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(String(evt.data)) as {
            type?: string;
            session?: LiveChatSession;
            sessions?: LiveChatSession[];
          };
          if (payload.type === 'chat:sessions_list' && Array.isArray(payload.sessions)) {
            setSessions(payload.sessions);
            setLoading(false);
          } else if (payload.type === 'chat:session_updated' && payload.session) {
            const incoming = payload.session;
            setSessions((prev) => {
              const filtered = prev.filter((s) => s.id !== incoming.id);
              return [incoming, ...filtered].sort(
                (a, b) => b.updatedAtMs - a.updatedAtMs
              );
            });
          }
        } catch {
          // ignore malformed messages
        }
      };
      ws.onclose = () => {
        setWsConnected(false);
        if (!closedByEffect) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  const matchedCrmUser = useMemo(() => {
    if (!selectedSession?.clientEmail) return null;
    return (
      users.find(
        (u) => u.email.toLowerCase() === selectedSession.clientEmail.toLowerCase()
      ) ?? null
    );
  }, [users, selectedSession]);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        s.clientEmail.toLowerCase().includes(q) ||
        s.messages.some((m) => m.body.toLowerCase().includes(q))
      );
    });
  }, [sessions, statusFilter, search]);

  const kpis = useMemo(() => {
    const waiting = sessions.filter((s) => s.status === 'waiting_admin').length;
    const activeLive = sessions.filter((s) => s.status === 'admin_active').length;
    const aiOnly = sessions.filter((s) => s.status === 'ai').length;
    const closed = sessions.filter((s) => s.status === 'closed').length;
    return { waiting, activeLive, aiOnly, closed };
  }, [sessions]);

  const handleSelectSession = async (sess: LiveChatSession) => {
    setSelectedId(sess.id);
    setActionError('');
    if (sess.unreadForAdmin > 0) {
      try {
        await fetch(`/api/live-chat/sessions/${encodeURIComponent(sess.id)}/read`, {
          method: 'POST',
        });
      } catch {
        // ignore
      }
    }
    window.setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleJoinChat = async () => {
    if (!selectedSession || joiningChat) return;
    setJoiningChat(true);
    setActionError('');
    try {
      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(selectedSession.id)}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminName: currentUser?.name || 'Senior Support Engineer',
            adminEmail: currentUser?.email,
          }),
        }
      );
      const data = (await res.json()) as {
        ok?: boolean;
        session?: LiveChatSession;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.session) {
        setActionError(data.error || 'Could not join chat.');
        return;
      }
      onShowToast(`Joined live chat ${selectedSession.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to join chat.');
    } finally {
      setJoiningChat(false);
    }
  };

  const handleReturnToAi = async () => {
    if (!selectedSession) return;
    setActionError('');
    try {
      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(selectedSession.id)}/return-ai`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminName: currentUser?.name || 'Support Staff',
          }),
        }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error || 'Unable to hand back to AI.');
        return;
      }
      onShowToast(`Returned ${selectedSession.id} to AI assistant`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Request failed.');
    }
  };

  const handleCloseChat = async () => {
    if (!selectedSession || closingChat) return;
    setClosingChat(true);
    setActionError('');
    try {
      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(selectedSession.id)}/close`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            closedBy: 'admin',
            actorName: currentUser?.name || 'Support Staff',
          }),
        }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error || 'Unable to close chat.');
        return;
      }
      onShowToast(`Closed live chat ${selectedSession.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to close chat.');
    } finally {
      setClosingChat(false);
    }
  };

  const handleAttachFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setActionError('');
    const remaining = Math.max(0, MAX_ADMIN_CHAT_FILES - replyAttachments.length);
    if (remaining === 0) {
      setActionError(`Up to ${MAX_ADMIN_CHAT_FILES} attachments allowed per message.`);
      return;
    }
    const picked = Array.from(fileList).slice(0, remaining);
    const oversized = picked.find((f) => f.size > MAX_ADMIN_CHAT_BYTES);
    if (oversized) {
      setActionError(
        `"${oversized.name}" exceeds the 10 MB limit (${formatFileSize(oversized.size)}).`
      );
      return;
    }
    try {
      const encoded = await Promise.all(picked.map(readAdminChatFile));
      setReplyAttachments((prev) => [...prev, ...encoded].slice(0, MAX_ADMIN_CHAT_FILES));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to attach file.');
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || sendingReply) return;
    if (!replyDraft.trim() && replyAttachments.length === 0) return;

    setSendingReply(true);
    setActionError('');
    try {
      // Ensure admin is joined if replying directly from waiting or AI queue
      if (selectedSession.status === 'ai' || selectedSession.status === 'waiting_admin') {
        await fetch(
          `/api/live-chat/sessions/${encodeURIComponent(selectedSession.id)}/join`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminName: currentUser?.name || 'Senior Support Engineer',
              adminEmail: currentUser?.email,
            }),
          }
        );
      }

      const res = await fetch(
        `/api/live-chat/sessions/${encodeURIComponent(selectedSession.id)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderRole: 'admin',
            senderName: `${currentUser?.name || 'Support Admin'} · Live Engineer`,
            body: replyDraft.trim(),
            attachments: replyAttachments,
          }),
        }
      );

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error || 'Could not send live chat reply.');
        return;
      }

      setReplyDraft('');
      setReplyAttachments([]);
      window.setTimeout(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error sending reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleGenerateAiDraft = async () => {
    if (!selectedSession || generatingAiDraft) return;
    setGeneratingAiDraft(true);
    setActionError('');
    try {
      const res = await fetch('/api/ai/admin-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'live-chat',
          history: selectedSession.messages.map((m) => ({
            sender: `${m.senderRole.toUpperCase()} (${m.senderName})`,
            body: m.body,
            attachments: m.attachments,
          })),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; draft?: string; error?: string };
      if (!res.ok || !data.ok || !data.draft) {
        setActionError(data.error || 'Could not generate AI troubleshooting draft.');
        return;
      }
      setReplyDraft(data.draft);
      onShowToast('AI technical draft inserted into composer');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'AI draft failed.');
    } finally {
      setGeneratingAiDraft(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Waiting for Agent</span>
            <Headphones className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#D97706] tabular-nums mt-1">
            {kpis.waiting}
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Live Agent</span>
            <UserCheck className="w-4 h-4 text-[#16A34A]" aria-hidden="true" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#16A34A] tabular-nums mt-1">
            {kpis.activeLive}
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AI Handled Sessions</span>
            <Bot className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#0E6B63] tabular-nums mt-1">
            {kpis.aiOnly}
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Closed (Incl. 24h Auto)</span>
            <XCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {kpis.closed}
          </p>
        </div>
      </div>

      {/* Filter & Live Sync Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client name, email, chat ID, or error keyword..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'waiting_admin', label: 'Waiting Queue' },
                { id: 'admin_active', label: 'Live Active' },
                { id: 'ai', label: 'AI Handled' },
                { id: 'closed', label: 'Closed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void fetchSessions()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] hover:border-[#0E6B63] rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
            <span>{wsConnected ? 'Live Synced' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Split Live Queue (Left) + Conversation Desk (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Queue */}
        <div className="xl:col-span-4 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0F172A]">
              Live Conversations ({filteredSessions.length})
            </span>
            <span className="text-[11px] text-slate-500">Auto-close: 24h</span>
          </div>

          <div className="divide-y divide-[#E2E8F0] max-h-[680px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading live chat sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" aria-hidden="true" />
                <p>No live chat sessions match this filter yet.</p>
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const badge = getStatusBadgeMeta(sess.status);
                const lastMsg = sess.messages[sess.messages.length - 1];
                const active = selectedId === sess.id;
                return (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => void handleSelectSession(sess)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      active ? 'bg-[#F2FAF8]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-xs font-bold text-[#0F172A] truncate">
                            {sess.clientName}
                          </span>
                          {sess.unreadForAdmin > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#D97706] text-white font-mono text-[10px] font-bold">
                              {sess.unreadForAdmin}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                          {sess.clientEmail || sess.id}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {lastMsg && (
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-snug">
                        {lastMsg.body}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{sess.id}</span>
                      <span>{sess.updatedAtUtc}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Conversation Desk */}
        <div className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col min-h-[680px]">
          {!selectedSession ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
              <Headphones className="w-10 h-10 text-slate-300 mb-3" aria-hidden="true" />
              <p className="font-display text-base font-bold text-[#0F172A]">
                Select a Live Chat Session
              </p>
              <p className="text-xs mt-1 max-w-md">
                Clients chatting on either the public website or their Client Dashboard appear here in real time. Join escalated chats, inspect screenshots up to 10 MB, or close sessions anytime.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header & Controls */}
              <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-bold text-[#0F172A]">
                        {selectedSession.clientName}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          getStatusBadgeMeta(selectedSession.status).classes
                        }`}
                      >
                        {getStatusBadgeMeta(selectedSession.status).label}
                      </span>
                      {matchedCrmUser && onManageClient && (
                        <button
                          type="button"
                          onClick={() => onManageClient(matchedCrmUser.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#0E6B63]/30 bg-white text-[11px] font-semibold text-[#0E6B63] hover:bg-[#F2FAF8] cursor-pointer"
                        >
                          <span>CRM: {matchedCrmUser.id}</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-1">
                      {selectedSession.id} · {selectedSession.clientEmail || 'Guest Visitor'} · Origin: {selectedSession.pageContext}
                    </p>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {selectedSession.status !== 'closed' &&
                      selectedSession.status !== 'admin_active' && (
                        <button
                          type="button"
                          disabled={joiningChat}
                          onClick={() => void handleJoinChat()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          {joiningChat ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>Join &amp; Take Over Chat</span>
                        </button>
                      )}

                    {selectedSession.status === 'admin_active' && (
                      <button
                        type="button"
                        onClick={() => void handleReturnToAi()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-xs font-semibold text-[#0F172A] whitespace-nowrap cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                        <span>Hand Back to AI</span>
                      </button>
                    )}

                    {selectedSession.status !== 'closed' && (
                      <button
                        type="button"
                        disabled={closingChat}
                        onClick={() => void handleCloseChat()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-[#DC2626] whitespace-nowrap cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Close Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500">
                  <span>Started: {selectedSession.createdAtUtc}</span>
                  <span>Updated: {selectedSession.updatedAtUtc}</span>
                  {selectedSession.status === 'closed' ? (
                    <span className="text-slate-700 font-semibold">
                      Closed: {selectedSession.closedAtUtc} ({selectedSession.closeReason})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#0E6B63]">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      Auto-closes: {selectedSession.expiresAtUtc}
                    </span>
                  )}
                </div>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 p-5 space-y-3.5 overflow-y-auto max-h-[430px] bg-[#F8FAFC]">
                {selectedSession.messages.map((msg) => {
                  if (msg.senderRole === 'system') {
                    return (
                      <div
                        key={msg.id}
                        className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-slate-600"
                      >
                        <strong className="text-[#0F172A] mr-1.5">
                          {msg.senderName}:
                        </strong>
                        <span>{msg.body}</span>
                        <span className="ml-2 font-mono text-[10px] text-slate-400">
                          {msg.timestampUtc}
                        </span>
                      </div>
                    );
                  }

                  const isAdminMsg = msg.senderRole === 'admin';
                  const isAiMsg = msg.senderRole === 'ai';

                  return (
                    <div
                      key={msg.id}
                      className={`rounded-xl border p-4 ${
                        isAdminMsg
                          ? 'bg-[#F2FAF8] border-[#0E6B63]/30'
                          : isAiMsg
                          ? 'bg-white border-slate-200'
                          : 'bg-white border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-[#0F172A]">
                            {msg.senderName}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isAdminMsg
                                ? 'text-[#0E6B63]'
                                : isAiMsg
                                ? 'text-slate-500'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            {isAdminMsg
                              ? 'Live Admin'
                              : isAiMsg
                              ? 'AI First-Line'
                              : 'Client'}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {msg.timestampUtc}
                        </span>
                      </div>

                      <p className="mt-2.5 text-xs sm:text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                        {msg.body}
                      </p>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.attachments.map((att) => {
                            const isImg = att.mimeType.startsWith('image/');
                            const zoomed = Boolean(expandedImageIds[att.id]);
                            return (
                              <div
                                key={att.id}
                                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 space-y-2"
                              >
                                {isImg ? (
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className={`w-full rounded border border-slate-200 bg-white object-contain ${
                                      zoomed ? 'max-h-[420px]' : 'max-h-36'
                                    }`}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 text-xs font-medium text-[#0F172A]">
                                    <FileText className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />
                                    <span className="truncate">{att.name}</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                  <span className="truncate font-mono">
                                    {att.name} ({formatFileSize(att.sizeBytes)})
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
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
                                        aria-label={zoomed ? 'Shrink preview' : 'Expand preview'}
                                      >
                                        {zoomed ? (
                                          <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                                        ) : (
                                          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                                        )}
                                      </button>
                                    )}
                                    <a
                                      href={att.dataUrl}
                                      download={att.name}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#CBD5E1] bg-white hover:border-[#0E6B63] text-[#0F172A] font-semibold"
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
                <div ref={transcriptEndRef} />
              </div>

              {/* Admin Reply Composer */}
              {selectedSession.status === 'closed' ? (
                <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    This live chat session is closed ({selectedSession.closeReason}).
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => void handleSendAdminReply(e)}
                  className="p-4 bg-white border-t border-[#E2E8F0] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Reply to {selectedSession.clientName}{' '}
                      {selectedSession.status !== 'admin_active' &&
                        '(sending automatically joins this chat)'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={generatingAiDraft}
                        onClick={() => void handleGenerateAiDraft()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0E6B63]/30 bg-[#F2FAF8] hover:bg-[#0E6B63]/10 text-[11px] font-semibold text-[#0E6B63] cursor-pointer"
                      >
                        {generatingAiDraft ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>AI Draft Fix</span>
                      </button>

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
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] hover:border-[#0E6B63] text-[11px] font-semibold text-[#0F172A] cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#0E6B63]" aria-hidden="true" />
                        <span>Attach (Max 10 MB)</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="Write live troubleshooting response for the client..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0E6B63]"
                  />

                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs"
                        >
                          <span className="truncate max-w-[180px] font-medium text-[#0F172A]">
                            {att.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {formatFileSize(att.sizeBytes)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyAttachments((prev) =>
                                prev.filter((item) => item.id !== att.id)
                              )
                            }
                            aria-label={`Remove ${att.name}`}
                            className="text-slate-400 hover:text-[#DC2626] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {actionError && (
                    <p className="text-xs font-semibold text-[#DC2626] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{actionError}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Delivered immediately via real-time WebSocket to client
                    </span>
                    <button
                      type="submit"
                      disabled={
                        sendingReply || (!replyDraft.trim() && replyAttachments.length === 0)
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Send Live Reply</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
