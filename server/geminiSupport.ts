import { GoogleGenAI, ThinkingLevel, type Part } from '@google/genai';
import type {
  LiveChatAttachment,
  LiveChatMessage,
  TicketAiTriageResult,
} from '../src/types/liveChat.ts';

const SUPPORT_MODEL = 'gemini-4-hydrogen';
const FAST_CHAT_MODEL = 'gemini-3.1-flash-lite';

function getGenAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function buildAttachmentParts(attachments?: LiveChatAttachment[]): Part[] {
  if (!attachments || attachments.length === 0) return [];
  const parts: Part[] = [];

  for (const att of attachments.slice(0, 5)) {
    if (!att.dataUrl) continue;

    // Multimodal image analysis (screenshots, cPanel errors, DNS screenshots, etc.)
    if (att.mimeType.startsWith('image/')) {
      const commaIdx = att.dataUrl.indexOf(',');
      if (commaIdx !== -1) {
        const b64 = att.dataUrl.slice(commaIdx + 1);
        if (b64) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: b64,
            },
          });
          parts.push({
            text: `[Attached screenshot: ${att.name}]`,
          });
        }
      }
      continue;
    }

    // Extract readable text/log/json snippets for diagnostics
    const isTextLike =
      att.mimeType.startsWith('text/') ||
      /\.(log|txt|json|csv|conf|md|yml|yaml|env|ini|htaccess)$/i.test(att.name);
    if (isTextLike) {
      const commaIdx = att.dataUrl.indexOf(',');
      if (commaIdx !== -1) {
        try {
          const decoded = Buffer.from(att.dataUrl.slice(commaIdx + 1), 'base64').toString('utf8');
          const snippet = decoded.slice(0, 6000);
          parts.push({
            text: `[Attached log/file "${att.name}" content preview]:\n${snippet}`,
          });
        } catch {
          parts.push({ text: `[Attached file: ${att.name} (${att.mimeType})]` });
        }
      }
    } else {
      parts.push({
        text: `[Attached file: ${att.name} (${att.mimeType}, ${Math.round(att.sizeBytes / 1024)} KB)]`,
      });
    }
  }

  return parts;
}

export async function generateLiveChatAiReply(params: {
  clientName: string;
  clientEmail?: string;
  pageContext?: string;
  history: LiveChatMessage[];
  latestMessage: string;
  attachments?: LiveChatAttachment[];
}): Promise<{ reply: string; suggestHumanTransfer: boolean }> {
  const ai = getGenAiClient();

  const recentTranscript = params.history
    .slice(-6)
    .map((m) => {
      const label =
        m.senderRole === 'client'
          ? `Client (${m.senderName})`
          : m.senderRole === 'admin'
          ? `Live Admin (${m.senderName})`
          : m.senderRole === 'system'
          ? 'System'
          : 'AI Engineer';
      const attachNote =
        m.attachments && m.attachments.length > 0
          ? ` [Attachments: ${m.attachments.map((a) => a.name).join(', ')}]`
          : '';
      return `${label}: ${m.body}${attachNote}`;
    })
    .join('\n');

  const systemInstruction = [
    'You are the Senior Cloud & Hosting Support AI Engineer for CPCloudHost (cpcloudhost.com), an international enterprise cloud hosting, cPanel, Managed WordPress, KVM VPS, n8n Automation, and Domain Registrar platform.',
    'Respond immediately, concisely, and accurately in the same language the client writes in (crisp English or clear Roman Urdu/English if the user writes in Roman Urdu).',
    'Give: 1) Likely root cause in 1 sentence, 2) 3 short numbered fix steps the client can apply right now in their Service Management / cPanel / DNS / Billing console, and 3) Note they can click "Transfer to Live Agent" if manual staff intervention is needed.',
    'Keep formatting clean plain text with short numbered steps (under 140 words) for instant readability.',
  ].join(' ');

  const userParts: Part[] = [
    {
      text: [
        `Client: ${params.clientName || 'Visitor'} | Page: ${params.pageContext || '/'}`,
        recentTranscript ? `Recent Chat:\n${recentTranscript}` : '',
        `Latest Message:\n${params.latestMessage || '(Client sent attachment(s) without text)'}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
    ...buildAttachmentParts(params.attachments),
  ];

  const response = await ai.models.generateContent({
    model: FAST_CHAT_MODEL,
    contents: userParts,
    config: {
      systemInstruction,
      maxOutputTokens: 320,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  const text = (response.text || '').trim();
  const fallbackReply =
    'I have reviewed your message. 1) Check your domain DNS A/MX records and nameservers (ns1.cpcloudhost.com / ns2.cpcloudhost.com). 2) Inspect error logs inside your Control Panel -> Metrics -> Errors. 3) If you need manual billing or server action, click "Transfer to Live Agent" above.';

  const lower = (params.latestMessage + ' ' + text).toLowerCase();
  const suggestHumanTransfer =
    /refund|cancel|manual|verify tid|transaction id|easypaisa|jazzcash|wire|human|live agent|real person|transfer|admin|staff|billing team|hacked|suspended/.test(
      lower
    );

  return {
    reply: text || fallbackReply,
    suggestHumanTransfer,
  };
}

export async function generateTicketTriageAi(params: {
  department: string;
  priority: string;
  relatedService?: string;
  subject: string;
  description: string;
  attachments?: LiveChatAttachment[];
}): Promise<TicketAiTriageResult> {
  const ai = getGenAiClient();

  const systemInstruction = [
    'You are CPCloudHost L3 Automated Support Triage AI.',
    'Analyze the client support request (including any attached screenshots or error logs) and provide an actionable troubleshooting fix BEFORE escalating to a human ticket.',
    'Return ONLY valid JSON with this exact schema:',
    '{"summary":"concise 1-2 sentence root cause explanation","steps":["Step 1: ...","Step 2: ...","Step 3: ..."],"needsHumanFollowup":boolean}',
    'Keep steps practical, specific to cPanel, StackCP, WordPress, DNS, SSL, KVM VPS, n8n, or Billing as applicable. Set needsHumanFollowup to true only if server-side/admin intervention, billing approval, or migration staff access is required.',
  ].join(' ');

  const userParts: Part[] = [
    {
      text: [
        `Department: ${params.department}`,
        `Priority: ${params.priority}`,
        params.relatedService ? `Affected Service/Domain: ${params.relatedService}` : '',
        `Subject: ${params.subject}`,
        `Issue Description:\n${params.description}`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
    ...buildAttachmentParts(params.attachments),
  ];

  const response = await ai.models.generateContent({
    model: SUPPORT_MODEL,
    contents: userParts,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const raw = (response.text || '').trim();
  try {
    const parsed = JSON.parse(raw) as {
      summary?: string;
      steps?: string[];
      needsHumanFollowup?: boolean;
    };
    return {
      summary:
        parsed.summary?.trim() ||
        'Review the diagnostic steps below. If the issue persists after checking these items, request human engineering support.',
      steps:
        Array.isArray(parsed.steps) && parsed.steps.length > 0
          ? parsed.steps.map((s) => String(s).trim()).filter(Boolean)
          : [
              'Verify domain nameservers and DNS A/MX records point to your active CPCloudHost node.',
              'Check recent PHP / web server error logs inside your hosting control panel.',
              'Confirm SSL certificate issuance and clear any application or CDN cache.',
            ],
      needsHumanFollowup: Boolean(parsed.needsHumanFollowup),
    };
  } catch {
    return {
      summary:
        raw ||
        'Automated diagnostics completed. Follow the troubleshooting checklist below or escalate directly to our engineering team.',
      steps: [
        'Check your service status and DNS configuration in the Client Dashboard.',
        'Inspect application/server error logs and confirm recent changes or plugin updates.',
        'If the problem continues, click "I Need Additional Support" to route this request directly to an engineer.',
      ],
      needsHumanFollowup: true,
    };
  }
}

export async function generateAdminDraftReply(params: {
  contextType: 'live-chat' | 'ticket';
  subject?: string;
  department?: string;
  relatedService?: string;
  history: Array<{ sender: string; body: string; attachments?: LiveChatAttachment[] }>;
}): Promise<string> {
  const ai = getGenAiClient();

  const transcript = params.history
    .slice(-12)
    .map((m) => `${m.sender}: ${m.body}`)
    .join('\n');

  const latestAttachments =
    params.history
      .slice(-4)
      .flatMap((m) => m.attachments || [])
      .slice(-5) || [];

  const systemInstruction = [
    'You are drafting an official response for a human Senior Support Engineer at CPCloudHost.',
    'Write a polished, empathetic, technically precise reply ready to send to the client.',
    'Include concrete diagnostic findings and next steps. Do not include placeholder brackets like [Your Name] — end cleanly as a complete engineering reply.',
  ].join(' ');

  const parts: Part[] = [
    {
      text: [
        `Context: ${params.contextType === 'live-chat' ? 'Live Support Chat' : 'Support Ticket'}`,
        params.subject ? `Subject: ${params.subject}` : '',
        params.department ? `Department: ${params.department}` : '',
        params.relatedService ? `Service/Domain: ${params.relatedService}` : '',
        `Transcript:\n${transcript}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
    ...buildAttachmentParts(latestAttachments),
  ];

  const response = await ai.models.generateContent({
    model: SUPPORT_MODEL,
    contents: parts,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  return (
    (response.text || '').trim() ||
    'Thank you for the details. Our engineering team has reviewed your service configuration and is checking the server logs now. We will follow up with exact verification steps shortly.'
  );
}
