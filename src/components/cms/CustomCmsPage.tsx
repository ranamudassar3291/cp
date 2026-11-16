import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Minus, Plus } from 'lucide-react';
import { CmsPageRecord } from '../../context/PlatformContext';
import { applyPageSeoMetadata } from '../../utils/seoManager';

interface CustomCmsPageProps {
  page: CmsPageRecord;
  onNavigateHome: () => void;
  onNavigateUrl: (url: string) => void;
}

export const CustomCmsPage: React.FC<CustomCmsPageProps> = ({
  page,
  onNavigateHome,
  onNavigateUrl,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    applyPageSeoMetadata({
      title: page.seoTitle || `${page.navTitle} | cpcloudhost.com`,
      description:
        page.seoDescription ||
        page.heroSubtitle ||
        'Enterprise cloud hosting and web infrastructure by cpcloudhost.com.',
      canonicalPath: page.slug,
      ogType: 'website',
      jsonLd: null,
    });
  }, [page]);

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Breadcrumb Bar */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onNavigateHome}
            className="font-medium text-slate-600 hover:text-[#0E6B63] transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-[#0E6B63]">{page.navTitle}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="max-w-3xl">
            {page.heroBadge.trim() && (
              <p className="text-xs font-semibold tracking-wide text-[#0E6B63] mb-3">
                {page.heroBadge}
              </p>
            )}

            <h1
              className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              {page.heroTitle || page.navTitle}
            </h1>

            {page.heroSubtitle.trim() && (
              <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {page.heroSubtitle}
              </p>
            )}

            {page.highlights.length > 0 && (
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {page.highlights
                  .filter((h) => h.trim())
                  .map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm font-medium text-[#0F172A]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#0E6B63]/10 text-[#0E6B63] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            )}

            {(page.primaryCtaText.trim() || page.secondaryCtaText.trim()) && (
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                {page.primaryCtaText.trim() && (
                  <a
                    href={page.primaryCtaUrl || '/shared-hosting'}
                    onClick={(e) => {
                      const target = page.primaryCtaUrl || '/shared-hosting';
                      if (!target.startsWith('http') && !target.startsWith('mailto:')) {
                        e.preventDefault();
                        onNavigateUrl(target);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg shadow-[0_6px_20px_rgba(14,107,99,0.2)] transition-all whitespace-nowrap shrink-0"
                  >
                    <span>{page.primaryCtaText}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}

                {page.secondaryCtaText.trim() && (
                  <a
                    href={page.secondaryCtaUrl || '/'}
                    onClick={(e) => {
                      const target = page.secondaryCtaUrl || '/';
                      if (!target.startsWith('http') && !target.startsWith('mailto:')) {
                        e.preventDefault();
                        onNavigateUrl(target);
                      }
                    }}
                    className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {page.secondaryCtaText}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      {page.sections.length > 0 && (
        <section className="bg-[#F8FAFC] border-b border-[#E2E8F0] py-14 lg:py-16">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
            {page.sections.map((sec) => (
              <article
                key={sec.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="max-w-3xl space-y-3">
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#0E6B63] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
                  >
                    <span>{sec.ctaText}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Optional FAQ Accordion */}
      {page.faqItems && page.faqItems.length > 0 && (
        <section className="bg-white border-b border-[#E2E8F0] py-16">
          <div className="max-w-[760px] mx-auto px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-[#0F172A] text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
              {page.faqItems.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={`${item.question}-${idx}`} className="py-3.5">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx((prev) => (prev === idx ? null : idx))}
                      aria-expanded={isOpen}
                      className="w-full flex items-center gap-3 text-left group cursor-pointer"
                    >
                      <span className="shrink-0 text-[#0F172A] group-hover:text-[#0E6B63]">
                        {isOpen ? (
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </span>
                      <span className="font-display text-sm sm:text-[15px] font-semibold text-[#0F172A] group-hover:text-[#0E6B63]">
                        {item.question}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 pl-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
