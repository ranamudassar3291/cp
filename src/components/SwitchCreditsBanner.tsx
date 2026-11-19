import React from 'react';
import { ArrowRight } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface SwitchCreditsBannerProps {
  onSwitchNow: () => void;
  onNavigatePath?: (path: string) => void;
}

export const SwitchCreditsBanner: React.FC<SwitchCreditsBannerProps> = ({
  onSwitchNow,
  onNavigatePath,
}) => {
  const { cmsPages } = usePlatform();
  const homeCms = cmsPages.find((p) => p.id === 'home');
  const sectionCms = homeCms?.sections?.find((s) => s.id === 'switch-credits');

  const heading =
    sectionCms?.heading?.trim().replace(/cpcloudhosting\.com/gi, 'cpcloudhost.com').replace(/CP Cloud Hosting/gi, 'cpcloudhost.com') ||
    "Switch to cpcloudhost.com and we'll credit your unused time from your current provider.";
  const body =
    sectionCms?.body?.trim().replace(/cpcloudhosting\.com/gi, 'cpcloudhost.com').replace(/CP Cloud Hosting/gi, 'cpcloudhost.com') ||
    'Are you locked in with your current web host? Our Switch Credits give you money back on any time you have left on your plan, so you can join cpcloudhost.com sooner. Switch your cPanel or StackCP Web Hosting Now!';
  const ctaText = sectionCms?.ctaText?.trim() || 'Switch Now';

  return (
    <section
      id="migrations"
      className="bg-[#0B0F17] text-white py-14 lg:py-16 border-b border-slate-800"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="max-w-3xl">
          <h2
            className="font-display text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-white leading-snug"
            style={{ textWrap: 'balance' }}
          >
            {heading}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            {body}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const url = sectionCms?.ctaUrl?.trim();
            if (url && url !== '#free-migrations' && onNavigatePath) {
              onNavigatePath(url);
            } else {
              onSwitchNow();
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-full shadow-[0_6px_22px_rgba(14,107,99,0.32)] transition-all whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981]"
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
