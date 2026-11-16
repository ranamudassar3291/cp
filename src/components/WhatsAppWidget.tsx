import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface ChatMessage {
  id: string;
  sender: 'support' | 'user';
  text: string;
}

export const WhatsAppWidget: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'support',
      text: 'Hello! Welcome to cpcloudhost.com support. Ask us about NVMe cloud plans, VPS sizing, or free site migrations.',
    },
  ]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    const replyText = trimmed.toLowerCase().includes('migrat')
      ? 'We migrate cPanel, Plesk, DirectAdmin, and WordPress sites free with zero downtime and up to 6 months switch credit. Share your domain here!'
      : trimmed.toLowerCase().includes('vps') ||
        trimmed.toLowerCase().includes('aws')
      ? `Our Shared NVMe plans start at ${formatPrice(2.5)}/mo, Unmanaged KVM VPS starts at ${formatPrice(12.99)}/mo, and Managed Cloud VPS is ${formatPrice(24.99)}/mo across 5 global regions. Which location do you prefer?`
      : 'Thanks for reaching out! An engineer from cpcloudhost.com is ready to assist you right away.';

    const replyMsg: ChatMessage = {
      id: `s-${Date.now() + 1}`,
      sender: 'support',
      text: replyText,
    };

    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setDraft('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(draft);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="WhatsApp Live Support"
          className="w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-[#0E6B63] text-white px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-sm font-bold">
                cpcloudhost.com Support
              </div>
              <div className="text-[11px] text-white/85">
                WhatsApp Sales &amp; Migration Desk
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp support chat"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 bg-[#F8FAFC] max-h-64 overflow-y-auto space-y-2.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0E6B63] text-white'
                      : 'bg-white border border-[#E2E8F0] text-[#0F172A]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Free Migration Help',
                'NVMe vs VPS Advice',
                'WHMCS Billing',
              ].map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => sendMessage(topic)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white border border-[#E2E8F0] hover:border-[#0E6B63] text-[#0F172A] rounded-md transition-colors cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-[#E2E8F0] flex items-center gap-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message..."
              aria-label="Message cpcloudhost.com support"
              className="flex-1 h-9 px-3 text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0E6B63]"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="w-9 h-9 rounded-lg bg-[#0E6B63] hover:bg-[#0A534D] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close WhatsApp support' : 'Chat on WhatsApp'}
        className="w-13 h-13 rounded-full bg-[#0E6B63] hover:bg-[#0A534D] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};
