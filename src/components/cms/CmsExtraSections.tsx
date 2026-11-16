import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CmsSectionItem } from '../../context/PlatformContext';

interface CmsExtraSectionsProps {
  sections?: CmsSectionItem[];
  excludeIds?: string[];
  onNavigateUrl: (url: string) => void;
}

export const CmsExtraSections: React.FC<CmsExtraSectionsProps> = ({
  sections = [],
  excludeIds = [],
  onNavigateUrl,
}) => {
  const visibleSections = sections.filter(
    (s) => !excludeIds.includes(s.id) && (s.heading.trim() || s.body.trim())
  );

  if (visibleSections.length === 0) return null;

  return (
    <section className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-14 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
        {visibleSections.map((sec) => (
          <div
            key={sec.id}
            className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="max-w-3xl space-y-2.5">
              {sec.heading.trim() && (
                <h2
                  className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] leading-snug"
                  style={{ textWrap: 'balance' }}
                >
                  {sec.heading}
                </h2>
              )}
              {sec.body.trim() && (
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                  {sec.body}
                </p>
              )}
            </div>

            {sec.ctaText?.trim() && sec.ctaUrl?.trim() && (
              <a
                href={sec.ctaUrl}
                onClick={(e) => {
                  if (!sec.ctaUrl!.startsWith('http') && !sec.ctaUrl!.startsWith('mailto:')) {
                    e.preventDefault();
                    onNavigateUrl(sec.ctaUrl!);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
              >
                <span>{sec.ctaText}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
