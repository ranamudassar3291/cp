import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Globe,
  Headphones,
  Layers,
  Minus,
  Plus,
  Search,
  Server,
  ShieldAlert,
  Terminal,
  X,
} from 'lucide-react';
import kbHeroImg from '../../assets/images/kb_hero_isometric_docs_1794566148075.jpg';
import {
  KB_ARTICLES,
  KB_CATEGORIES,
  KB_POPULAR_TAGS,
  KbArticle,
  KbCategoryId,
} from '../../data/knowledgeBaseData';
import {
  applyPageSeoMetadata,
  buildKnowledgeBaseArticleJsonLd,
  buildKnowledgeBaseHubJsonLd,
} from '../../utils/seoManager';
import { usePlatform } from '../../context/PlatformContext';
import { CmsExtraSections } from '../cms/CmsExtraSections';

interface KnowledgeBasePageProps {
  initialArticleSlug?: string | null;
  onSelectArticleSlug?: (slug: string | null) => void;
  onNavigateHome: (sectionSelector?: string) => void;
  onNavigatePath?: (path: string) => void;
  onOpenPage?: (
    page:
      | 'home'
      | 'domain-registration'
      | 'domain-transfer'
      | 'shared-hosting'
      | 'wordpress-hosting'
      | 'vps-hosting'
      | 'n8n-hosting'
      | 'about-us'
      | 'migration-free'
  ) => void;
}

const CATEGORY_ICONS: Record<KbCategoryId, React.ReactNode> = {
  errors: <ShieldAlert className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />,
  domains: <Globe className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />,
  hosting: <Layers className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />,
  vps: <Terminal className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />,
  'email-ssl': <Server className="w-4 h-4 text-[#0E6B63]" aria-hidden="true" />,
};

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({
  initialArticleSlug = null,
  onSelectArticleSlug,
  onNavigateHome,
  onNavigatePath,
  onOpenPage,
}) => {
  const { cmsPages } = usePlatform();
  const pageCms = cmsPages.find((p) => p.id === 'knowledge-base');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialArticleSlug
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<KbCategoryId | 'all'>(
    'all'
  );
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [helpfulVote, setHelpfulVote] = useState<'yes' | 'no' | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Support ticket / Contact Us form state
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketTopic, setTicketTopic] = useState<
    'HTTP / Server Errors' | 'Domains & DNS' | 'WordPress / Hosting' | 'VPS & n8n' | 'Free Migration'
  >('HTTP / Server Errors');
  const [ticketDomainOrIp, setTicketDomainOrIp] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSlug(initialArticleSlug ?? null);
  }, [initialArticleSlug]);

  const activeArticle: KbArticle | null = useMemo(() => {
    if (!selectedSlug) return null;
    return KB_ARTICLES.find((a) => a.slug === selectedSlug) ?? null;
  }, [selectedSlug]);

  // Dynamic SEO & JSON-LD structured data updater
  useEffect(() => {
    if (activeArticle) {
      applyPageSeoMetadata({
        title: `${activeArticle.title} | cpcloudhost.com Knowledge Base`,
        description: activeArticle.seoDescription,
        keywords: activeArticle.keywords,
        ogType: 'article',
        canonicalPath: `/knowledge-base/${activeArticle.slug}`,
        jsonLd: buildKnowledgeBaseArticleJsonLd(activeArticle),
      });
    } else {
      applyPageSeoMetadata({
        title:
          pageCms?.seoTitle?.trim() ||
          'Knowledge Base — Domain, Cloud Hosting, VPS & Error Fix Guides | cpcloudhost.com',
        description:
          pageCms?.seoDescription?.trim() ||
          'Authoritative technical tutorials and troubleshooting guides for fixing 502 Bad Gateway, database errors, DNS propagation, SSL certificates, VPS hardening, and n8n setup.',
        keywords: [
          'cpcloudhost knowledge base',
          'hosting troubleshooting',
          'fix 502 bad gateway',
          'WordPress database error fix',
          'DNS nameserver setup',
          'VPS security guide',
        ],
        ogType: 'website',
        canonicalPath: '/knowledge-base',
        jsonLd: buildKnowledgeBaseHubJsonLd(KB_ARTICLES),
      });
    }
  }, [activeArticle, pageCms]);

  const handleOpenArticle = (slug: string | null) => {
    setSelectedSlug(slug);
    setHelpfulVote(null);
    setOpenFaqIdx(0);
    onSelectArticleSlug?.(slug);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      window.setTimeout(() => {
        setCopiedCodeId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch {
      setCopiedCodeId(null);
    }
  };

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return KB_ARTICLES.filter((article) => {
      if (activeCategory !== 'all' && article.categoryId !== activeCategory) {
        return false;
      }
      if (!q) return true;

      const haystack = [
        article.title,
        article.categoryLabel,
        article.seoDescription,
        article.summary,
        article.plainLanguageSummary ?? '',
        article.appliesTo,
        ...article.keywords,
        ...article.rootCauses,
        ...article.steps.map(
          (s) =>
            `${s.stepTitle} ${s.explanation} ${s.clientShortcut ?? ''} ${s.codeSnippet?.code ?? ''}`
        ),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [activeCategory, searchQuery]);

  const featuredArticles = useMemo(
    () => KB_ARTICLES.filter((a) => a.featured),
    []
  );

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    const sameCategory = KB_ARTICLES.filter(
      (a) =>
        a.slug !== activeArticle.slug &&
        a.categoryId === activeArticle.categoryId
    );
    const others = KB_ARTICLES.filter(
      (a) =>
        a.slug !== activeArticle.slug &&
        a.categoryId !== activeArticle.categoryId
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [activeArticle]);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName.trim() || ticketName.trim().length < 2) {
      setTicketError('Please enter your full name.');
      return;
    }
    if (
      !ticketEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticketEmail.trim())
    ) {
      setTicketError('Please enter a valid email address for engineer replies.');
      return;
    }
    if (!ticketMessage.trim() || ticketMessage.trim().length < 12) {
      setTicketError(
        'Include a brief description of the error code, domain, or server symptom.'
      );
      return;
    }

    setTicketError('');
    const code = `CPCH-${Math.floor(100000 + Math.random() * 899999)}`;
    setTicketRef(code);
  };

  return (
    <div className="bg-white text-[#0F172A]">
      {/* Top Hero / Article Breadcrumb Header */}
      {!activeArticle ? (
        <>
          {/* Knowledge Base Hub Hero */}
          <section className="relative bg-gradient-to-b from-[#F2FAF8] via-white to-white border-b border-[#E2E8F0] pt-8 pb-12 lg:py-14">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-xs text-slate-600 mb-6"
              >
                <button
                  type="button"
                  onClick={() => onNavigateHome('#top')}
                  className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
                >
                  Home
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span className="text-[#0F172A] font-semibold">
                  Knowledge Base
                </span>
              </nav>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Left Column: H1, Live Search, Quick Error Shortcuts */}
                <div className="lg:col-span-7">
                  <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                    {pageCms?.heroBadge?.trim() ||
                      'cpcloudhost.com Technical Documentation & Troubleshooting'}
                  </p>

                  <h1
                    className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#0F172A] leading-[1.12]"
                    style={{ textWrap: 'balance' }}
                  >
                    {pageCms?.heroTitle?.trim() ||
                      'Cloud Hosting, Domains & Error Resolution Guides'}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed max-w-2xl">
                    {pageCms?.heroSubtitle?.trim() ||
                      'Verified step-by-step runbooks written by cpcloudhost.com infrastructure engineers to resolve HTTP errors, configure Anycast DNS records, harden KVM VPS nodes, and optimize WordPress or n8n deployments.'}
                  </p>

                  {/* Real-time Instant Search Form */}
                  <div className="mt-6">
                    <label htmlFor="kb-search-input" className="sr-only">
                      Search Knowledge Base articles, error codes, or DNS tutorials
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-1.5 rounded-xl border border-[#CBD5E1] shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] focus-within:border-[#0E6B63] transition-colors">
                      <div className="relative flex-1 flex items-center">
                        <Search
                          className="w-4 h-4 text-slate-400 ml-3 shrink-0"
                          aria-hidden="true"
                        />
                        <input
                          id="kb-search-input"
                          type="search"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          placeholder="Search error codes (502, 500, 403), DNS, SSL, SPF, VPS, n8n..."
                          className="w-full px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 bg-transparent focus:outline-none"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search query"
                            className="p-1.5 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.querySelector('#kb-directory');
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Find Solution
                      </button>
                    </div>

                    {/* Interactive Quick Topic Filter Buttons */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 mr-1">
                        Quick lookups:
                      </span>
                      {KB_POPULAR_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setActiveCategory('all');
                            setSearchQuery(tag);
                            const el = document.querySelector('#kb-directory');
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-[#F1F5F9] hover:bg-[#E2ECE9] hover:text-[#0E6B63] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Bespoke Architectural Illustration */}
                <div className="lg:col-span-5">
                  <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F2FAF8] aspect-[4/3] shadow-[0_18px_40px_-20px_rgba(15,23,42,0.16)]">
                    {!heroImgFailed ? (
                      <img
                        src={kbHeroImg}
                        alt="Isometric cloud server rack, SSL security shield, DNS node graph, and terminal documentation interface"
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImgFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#F2FAF8] to-[#E2ECE9]">
                        <BookOpen className="w-12 h-12 text-[#0E6B63] mb-3" />
                        <p className="font-display font-bold text-[#0F172A]">
                          cpcloudhost.com Engineering Docs
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          DNS, WordPress, KVM VPS &amp; Error Resolution Guides
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured High-Priority Fix Guides */}
          <section className="py-12 border-b border-[#E2E8F0] bg-white">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
                <div>
                  <p className="text-xs font-semibold text-[#0E6B63] mb-1">
                    Most Searched Troubleshooting Guides
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                    Immediate Fixes for Common Server Errors
                  </h2>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {KB_ARTICLES.length} technical guides published
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <article
                    key={article.slug}
                    className="group border border-[#E2E8F0] hover:border-[#0E6B63]/60 rounded-xl p-6 bg-white transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <span className="font-medium text-[#0E6B63]">
                          {article.categoryLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{article.readTime}</span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors leading-snug">
                        <button
                          type="button"
                          onClick={() => handleOpenArticle(article.slug)}
                          className="text-left cursor-pointer"
                        >
                          {article.title}
                        </button>
                      </h3>

                      <p className="text-sm text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[180px]">
                        {article.appliesTo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenArticle(article.slug)}
                        className="inline-flex items-center gap-1 font-semibold text-[#0E6B63] hover:text-[#0A534D] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Read guide</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Interactive Categorized Knowledge Base Directory */}
          <section id="kb-directory" className="py-14 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                    Browse Documentation by Topic
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Select a platform area below to filter domain, hosting, VPS, SSL, and error runbooks.
                  </p>
                </div>

                <div className="text-xs text-slate-600 tabular-nums">
                  Showing <strong className="text-[#0F172A]">{filteredArticles.length}</strong> of{' '}
                  {KB_ARTICLES.length} articles
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div
                role="tablist"
                aria-label="Knowledge Base Categories"
                className="flex flex-wrap items-center gap-2 mb-8 pb-2"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-[#0E6B63] text-white border-[#0E6B63]'
                      : 'bg-white text-slate-700 border-[#E2E8F0] hover:border-[#0E6B63]/50 hover:text-[#0E6B63]'
                  }`}
                >
                  All Topics ({KB_ARTICLES.length})
                </button>

                {KB_CATEGORIES.map((cat) => {
                  const count = KB_ARTICLES.filter(
                    (a) => a.categoryId === cat.id
                  ).length;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#0E6B63] text-white border-[#0E6B63]'
                          : 'bg-white text-slate-700 border-[#E2E8F0] hover:border-[#0E6B63]/50 hover:text-[#0E6B63]'
                      }`}
                    >
                      {!isActive && CATEGORY_ICONS[cat.id]}
                      <span>
                        {cat.label} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Directory Grid or Empty State */}
              {filteredArticles.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center">
                  <p className="font-display text-lg font-bold text-[#0F172A]">
                    No guides matched "{searchQuery}"
                  </p>
                  <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
                    Try searching a broader term like 502, SSL, WordPress, SPF, or KVM VPS, or submit a request directly to our engineers below.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-[#0E6B63] text-white rounded-lg hover:bg-[#0A534D] cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.querySelector('#kb-contact-support');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="px-4 py-2 text-xs font-semibold border border-[#CBD5E1] text-[#0F172A] rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Ask an Engineer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredArticles.map((article) => (
                    <article
                      key={article.slug}
                      className="bg-white border border-[#E2E8F0] hover:border-[#0E6B63]/60 rounded-xl p-6 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2.5">
                          <span className="font-semibold text-[#0E6B63]">
                            {article.categoryLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{article.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{article.readTime}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={article.updatedDate}>
                            Updated {article.updatedDate}
                          </time>
                        </div>

                        <h3 className="font-display text-lg font-bold text-[#0F172A] leading-snug">
                          <button
                            type="button"
                            onClick={() => handleOpenArticle(article.slug)}
                            className="text-left hover:text-[#0E6B63] transition-colors cursor-pointer"
                          >
                            {article.title}
                          </button>
                        </h3>

                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {article.seoDescription}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 truncate">
                          {article.steps.length} steps · {article.appliesTo}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenArticle(article.slug)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0E6B63] bg-[#F2FAF8] hover:bg-[#0E6B63] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>View Solution</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* Full Article Reader View with Structured SEO Markup & Copyable Snippets */
        <article className="bg-white border-b border-[#E2E8F0]">
          {/* Article Sub-Header */}
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] py-8 lg:py-10">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mb-4"
              >
                <button
                  type="button"
                  onClick={() => onNavigateHome('#top')}
                  className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
                >
                  Home
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => handleOpenArticle(null)}
                  className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
                >
                  Knowledge Base
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(activeArticle.categoryId);
                    handleOpenArticle(null);
                  }}
                  className="hover:text-[#0E6B63] transition-colors cursor-pointer font-medium"
                >
                  {activeArticle.categoryLabel}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span className="text-[#0F172A] font-semibold truncate max-w-[320px]">
                  {activeArticle.title}
                </span>
              </nav>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
                <span className="font-semibold text-[#0E6B63]">
                  {activeArticle.categoryLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activeArticle.readTime}</span>
                <span aria-hidden="true">·</span>
                <span>Applies to {activeArticle.appliesTo}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={activeArticle.updatedDate}>
                  Updated {activeArticle.updatedDate}
                </time>
              </div>

              <h1
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] max-w-4xl leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {activeArticle.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 mt-3.5 max-w-3xl leading-relaxed">
                {activeArticle.summary}
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => handleOpenArticle(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B63] hover:text-[#0A534D] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Back to Knowledge Base Directory</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Documentation Body & Sticky TOC Sidebar */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Article Column */}
            <div className="lg:col-span-8 space-y-10">
              {/* Plain-Language Client Explanation */}
              {activeArticle.plainLanguageSummary && (
                <section className="border border-[#0E6B63]/20 rounded-xl p-6 bg-[#F2FAF8]">
                  <p className="text-xs font-bold text-[#0E6B63] mb-1.5">
                    In Simple Words (What This Means)
                  </p>
                  <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                    {activeArticle.plainLanguageSummary}
                  </p>
                </section>
              )}

              {/* Root Causes Section */}
              <section id="article-causes" className="border border-[#E2E8F0] rounded-xl p-6 bg-[#F8FAFC]">
                <h2 className="font-display text-lg font-bold text-[#0F172A] mb-3.5">
                  Common Root Causes
                </h2>
                <ul className="space-y-2.5">
                  {activeArticle.rootCauses.map((cause, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed"
                    >
                      <CheckCircle2
                        className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Step-by-Step Resolution Guide */}
              <section id="article-steps" className="space-y-7">
                <h2 className="font-display text-2xl font-bold text-[#0F172A]">
                  Step-by-Step Resolution
                </h2>

                {activeArticle.steps.map((step, index) => {
                  const codeId = `${activeArticle.slug}-step-${index}`;
                  const isCopied = copiedCodeId === codeId;
                  return (
                    <div
                      key={codeId}
                      className="border border-[#E2E8F0] rounded-xl p-6 bg-white"
                    >
                      <h3 className="font-display text-lg font-bold text-[#0F172A]">
                        <span className="font-mono text-[#0E6B63] tabular-nums mr-2">
                          0{index + 1}.
                        </span>
                        {step.stepTitle}
                      </h3>

                      <p className="text-sm sm:text-[15px] text-slate-600 mt-2.5 leading-relaxed">
                        {step.explanation}
                      </p>

                      {step.clientShortcut && (
                        <div className="mt-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold text-[#0E6B63]">
                            Easy Control Panel Shortcut:{' '}
                          </span>
                          {step.clientShortcut}
                        </div>
                      )}

                      {step.codeSnippet && (
                        <div className="mt-4 rounded-lg overflow-hidden border border-slate-800 bg-[#0F172A] text-slate-100">
                          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                            <span className="font-mono">
                              {step.codeSnippet.filename ??
                                step.codeSnippet.language}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyCode(codeId, step.codeSnippet!.code)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                                  <span className="text-[#10B981]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-slate-100">
                            <code>{step.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>

              {/* Verification Checklist */}
              <section
                id="article-verify"
                className="border border-[#0E6B63]/25 bg-[#F2FAF8] rounded-xl p-6"
              >
                <h2 className="font-display text-lg font-bold text-[#0F172A] mb-3.5">
                  Final Verification Checklist
                </h2>
                <ul className="space-y-2.5">
                  {activeArticle.verificationChecklist.map((check, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed"
                    >
                      <Check
                        className="w-4 h-4 text-[#0E6B63] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Article Specific FAQs */}
              {activeArticle.faqItems.length > 0 && (
                <section id="article-faq">
                  <h2 className="font-display text-xl font-bold text-[#0F172A] mb-4">
                    Troubleshooting Questions
                  </h2>
                  <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                    {activeArticle.faqItems.map((faq, idx) => {
                      const open = openFaqIdx === idx;
                      return (
                        <div key={idx} className="p-5">
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() =>
                              setOpenFaqIdx(open ? null : idx)
                            }
                            className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                          >
                            <span className="font-display text-sm sm:text-base font-bold text-[#0F172A]">
                              {faq.question}
                            </span>
                            {open ? (
                              <Minus className="w-4 h-4 text-[#0E6B63] shrink-0" />
                            ) : (
                              <Plus className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </button>
                          {open && (
                            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Was this guide helpful? */}
              <div className="border border-[#E2E8F0] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-display text-sm font-bold text-[#0F172A]">
                    Did this technical guide resolve your issue?
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Feedback helps cpcloudhost.com engineers keep documentation accurate.
                  </p>
                </div>

                {helpfulVote === 'yes' ? (
                  <p className="text-xs font-semibold text-[#0E6B63] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Glad that worked. Marked helpful!</span>
                  </p>
                ) : helpfulVote === 'no' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.querySelector('#kb-contact-support');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#0E6B63] text-white rounded-lg hover:bg-[#0A534D] cursor-pointer"
                  >
                    Ask Support Engineering Below
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHelpfulVote('yes')}
                      className="px-4 py-2 text-xs font-semibold border border-[#CBD5E1] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors cursor-pointer"
                    >
                      Yes, Solved
                    </button>
                    <button
                      type="button"
                      onClick={() => setHelpfulVote('no')}
                      className="px-4 py-2 text-xs font-semibold border border-[#CBD5E1] hover:border-[#0F172A] rounded-lg transition-colors cursor-pointer"
                    >
                      Need Assistance
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sticky Sidebar: TOC + Platform Actions + Related Guides */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
              <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white">
                <p className="text-xs font-bold text-[#0F172A] mb-3">
                  On This Guide
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .querySelector('#article-causes')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#0E6B63] transition-colors block py-0.5 text-left w-full cursor-pointer"
                    >
                      Common Root Causes
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .querySelector('#article-steps')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#0E6B63] transition-colors block py-0.5 text-left w-full cursor-pointer"
                    >
                      Step-by-Step Resolution ({activeArticle.steps.length} steps)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .querySelector('#article-verify')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#0E6B63] transition-colors block py-0.5 text-left w-full cursor-pointer"
                    >
                      Final Verification Checklist
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .querySelector('#article-faq')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#0E6B63] transition-colors block py-0.5 text-left w-full cursor-pointer"
                    >
                      Troubleshooting Questions
                    </button>
                  </li>
                </ul>
              </div>

              {/* Related Platform Action */}
              {onOpenPage && (
                <div className="border border-[#E2E8F0] rounded-xl p-5 bg-[#F2FAF8]">
                  <p className="font-display text-sm font-bold text-[#0F172A]">
                    Need Managed Infrastructure?
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Every cpcloudhost.com hosting, domain, and KVM VPS plan includes
                    free migrations and 24/7 engineering support.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPage('domain-registration')}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#0E6B63] text-white rounded-md hover:bg-[#0A534D] cursor-pointer"
                    >
                      Domain Search
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPage('vps-hosting')}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0F172A] rounded-md hover:border-[#0E6B63] cursor-pointer"
                    >
                      Explore KVM VPS
                    </button>
                  </div>
                </div>
              )}

              {/* Related Articles */}
              <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white">
                <p className="text-xs font-bold text-[#0F172A] mb-3.5">
                  Related Troubleshooting Guides
                </p>
                <div className="space-y-3.5">
                  {relatedArticles.map((rel) => (
                    <button
                      key={rel.slug}
                      type="button"
                      onClick={() => handleOpenArticle(rel.slug)}
                      className="w-full text-left group block border-b border-slate-100 last:border-b-0 pb-3 last:pb-0 cursor-pointer"
                    >
                      <span className="text-[11px] font-medium text-[#0E6B63] block">
                        {rel.categoryLabel} · {rel.readTime}
                      </span>
                      <span className="text-xs font-semibold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors leading-snug block mt-0.5">
                        {rel.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>
      )}

      {/* Interactive Engineering Contact & Support Ticket Desk (Linked from Support -> Contact Us) */}
      <section
        id="kb-contact-support"
        className="py-14 lg:py-16 bg-white"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Info & Direct Channels */}
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold text-[#0E6B63] mb-2">
                24/7 Cloud &amp; Systems Support
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Still Need Engineering Help? Contact Our Team
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                If your error code persists or you need a free website migration,
                message our system administrators directly with your domain or
                error snippet.
              </p>

              <div className="mt-6 space-y-3 border-t border-[#E2E8F0] pt-5 text-sm">
                <div className="flex items-start gap-3">
                  <Headphones
                    className="w-4 h-4 text-[#0E6B63] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[#0F172A]">
                      Direct Engineering Desk
                    </p>
                    <p className="text-xs text-slate-600">
                      support@cpcloudhost.com · Under 15-minute median initial response
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Server
                    className="w-4 h-4 text-[#0E6B63] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[#0F172A]">
                      Free Unlimited Migrations
                    </p>
                    <p className="text-xs text-slate-600">
                      Full cPanel, StackCP, WordPress, and VPS transfers handled zero-downtime
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onOpenPage
                      ? onOpenPage('migration-free')
                      : onNavigateHome('#migrations')
                  }
                  className="px-4 py-2 text-xs font-semibold border border-[#CBD5E1] text-[#0F172A] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors cursor-pointer"
                >
                  Request Free Migration
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenPage
                      ? onOpenPage('about-us')
                      : onNavigateHome('#infrastructure')
                  }
                  className="px-4 py-2 text-xs font-semibold border border-[#CBD5E1] text-[#0F172A] hover:border-[#0E6B63] hover:text-[#0E6B63] rounded-lg transition-colors cursor-pointer"
                >
                  About Us &amp; Infrastructure
                </button>
              </div>
            </div>

            {/* Right Support Request Form */}
            <div className="lg:col-span-7 border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 bg-[#F8FAFC]">
              {ticketRef ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#0E6B63] mx-auto mb-3" />
                  <h3 className="font-display text-xl font-bold text-[#0F172A]">
                    Support Request Logged
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                    Reference <strong className="font-mono text-[#0F172A]">{ticketRef}</strong> has been
                    assigned to the <strong>{ticketTopic}</strong> queue. Updates will be
                    dispatched to <strong>{ticketEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTicketRef(null);
                      setTicketMessage('');
                    }}
                    className="mt-5 px-5 py-2.5 text-xs font-semibold bg-[#0E6B63] text-white rounded-lg hover:bg-[#0A534D] cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="kb-ticket-name"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Full Name
                      </label>
                      <input
                        id="kb-ticket-name"
                        type="text"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="Alex Mercer"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="kb-ticket-email"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Email Address
                      </label>
                      <input
                        id="kb-ticket-email"
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="you@yourdomain.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="kb-ticket-topic"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Support Department
                      </label>
                      <select
                        id="kb-ticket-topic"
                        value={ticketTopic}
                        onChange={(e) =>
                          setTicketTopic(e.target.value as typeof ticketTopic)
                        }
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      >
                        <option value="HTTP / Server Errors">HTTP / Server Errors</option>
                        <option value="Domains & DNS">Domains &amp; DNS</option>
                        <option value="WordPress / Hosting">WordPress / Hosting</option>
                        <option value="VPS & n8n">VPS &amp; n8n</option>
                        <option value="Free Migration">Free Migration</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="kb-ticket-domain"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Affected Domain or Server IP (Optional)
                      </label>
                      <input
                        id="kb-ticket-domain"
                        type="text"
                        value={ticketDomainOrIp}
                        onChange={(e) => setTicketDomainOrIp(e.target.value)}
                        placeholder="yourdomain.com or 203.0.113.45"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="kb-ticket-message"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Error Code or Issue Details
                    </label>
                    <textarea
                      id="kb-ticket-message"
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe the error message, steps already tried, or migration request..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0E6B63]"
                    />
                  </div>

                  {ticketError && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {ticketError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg transition-colors cursor-pointer"
                  >
                    Open Engineering Ticket
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <CmsExtraSections
        sections={pageCms?.sections}
        onNavigateUrl={(url) => (onNavigatePath ? onNavigatePath(url) : onNavigateHome(url))}
      />
    </div>
  );
};
