export type LiveChatStatus = 'ai' | 'waiting_admin' | 'admin_active' | 'closed';

export type LiveChatSenderRole = 'client' | 'ai' | 'admin' | 'system';

export interface LiveChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

export interface LiveChatMessage {
  id: string;
  senderRole: LiveChatSenderRole;
  senderName: string;
  body: string;
  timestampUtc: string;
  timestampMs: number;
  attachments?: LiveChatAttachment[];
}

export interface LiveChatSession {
  id: string;
  visitorId: string;
  clientName: string;
  clientEmail: string;
  isAuthenticatedClient: boolean;
  pageContext: string;
  status: LiveChatStatus;
  assignedAdminName?: string;
  assignedAdminEmail?: string;
  createdAtUtc: string;
  createdAtMs: number;
  updatedAtUtc: string;
  updatedAtMs: number;
  expiresAtUtc: string;
  expiresAtMs: number;
  closedAtUtc?: string;
  closedBy?: 'client' | 'admin' | 'system_24h';
  closeReason?: string;
  unreadForAdmin: number;
  messages: LiveChatMessage[];
}

export interface TicketAiTriageResult {
  summary: string;
  steps: string[];
  needsHumanFollowup: boolean;
  suggestedDepartment?: string;
  confidenceLabel?: string;
}
