import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is StackCP Web Hosting?',
    answer:
      'StackCP is our custom-engineered, autoscaling cloud control panel built to replace legacy fixed-server limits. At cpcloudhost.com, your site draws compute and memory dynamically across our global cloud cluster for consistent speed during traffic spikes.',
  },
  {
    question: 'Do you support cPanel as well?',
    answer:
      'Yes. Alongside StackCP autoscaling cloud hosting, cpcloudhost.com provides classic CloudLinux-powered cPanel accounts with up to 4GB RAM, JetBackup, Imunify360, NVMe SSD storage, and selectable PHP 5.6 through PHP 8.4.',
  },
  {
    question: 'Can you migrate my website from another StackCP provider?',
    answer:
      'Yes. We offer unlimited free StackCP-to-StackCP migrations with zero downtime, seamlessly transferring your websites, databases, SSL certificates, and mailboxes directly into your cpcloudhost.com account.',
  },
  {
    question: 'Is it suitable for WooCommerce?',
    answer:
      'Absolutely. Both our WordPress and cPanel platforms are optimised for WooCommerce stores with StackCache edge caching, HTTP/3, Redis object caching, and NVMe storage to keep checkout pages fast under heavy load.',
  },
  {
    question: 'Do I get free SSL certificates?',
    answer:
      'Every hosting plan at cpcloudhost.com includes free wildcard SSL certificates that automatically install and renew across your primary domain and unlimited subdomains.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes. You can scale your cpcloudhost.com plan up or down anytime directly from your client area without downtime or migration hassle.',
  },
  {
    question: 'Where are your servers located?',
    answer:
      'We operate Tier-III+ datacentre clusters in London (UK), New York & Dallas (USA), Frankfurt (Germany), Singapore, Mumbai (India), and Sydney (Australia), backed by a global Anycast CDN.',
  },
  {
    question: 'What kind of support do you offer?',
    answer:
      'Our in-house Linux, StackCP, and cPanel systems engineers are available 24/7 via ticket and live chat, with fast troubleshooting and hands-on migration assistance.',
  },
  {
    question: 'Can I migrate from another host?',
    answer:
      'Yes. Whether you are moving from cPanel, Plesk, DirectAdmin, Krystal, Cloudways, or WP Engine, our team handles the entire transfer free of charge—plus we credit remaining unused time via Switch Credits.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Yes — you can start any StackCP hosting plan on cpcloudhost.com with our 30-day risk-free guarantee and Switch Credits for any remaining balance at your previous provider.',
  },
];

export const FaqSection: React.FC = () => {
  const { cmsPages } = usePlatform();
  const homeCms = cmsPages.find((p) => p.id === 'home');
  const activeFaqs =
    homeCms?.faqItems && homeCms.faqItems.length > 0
      ? homeCms.faqItems
      : FAQ_ITEMS;

  // Default open the final item ("Do you offer a free trial?") matching the reference layout
  const [openIndex, setOpenIndex] = useState<number | null>(activeFaqs.length - 1);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="bg-white border-b border-[#E2E8F0] py-16 lg:py-20">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">
        <h2 className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A] text-center mb-10">
          FAQ&apos;s
        </h2>

        <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
          {activeFaqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.question} className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
                >
                  <span className="shrink-0 text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                    {isOpen ? (
                      <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="font-display text-sm sm:text-[15px] font-semibold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors">
                    {item.question}
                  </span>
                </button>

                {isOpen && (
                  <p className="mt-2.5 pl-6.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
