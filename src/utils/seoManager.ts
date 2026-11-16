import { KbArticle } from '../data/knowledgeBaseData';

const SITE_NAME = 'cpcloudhost.com';
const SITE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://cpcloudhost.com';

function ensureMetaTag(
  selector: string,
  createAttr: { attr: 'name' | 'property'; key: string },
  content: string
) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(createAttr.attr, createAttr.key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureCanonicalLink(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setDynamicJsonLd(payload: Record<string, unknown> | null) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('cpcloudhost-dynamic-ld');
  if (!payload) {
    existing?.remove();
    return;
  }
  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : document.createElement('script');
  script.id = 'cpcloudhost-dynamic-ld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(payload);
  if (!existing) {
    document.head.appendChild(script);
  }
}

export function applyPageSeoMetadata(options: {
  title: string;
  description: string;
  keywords?: string[];
  ogType?: 'website' | 'article';
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | null;
}) {
  if (typeof document === 'undefined') return;

  const fullUrl = `${SITE_URL}${options.canonicalPath ?? ''}`;
  document.title = options.title;

  ensureMetaTag('meta[name="description"]', { attr: 'name', key: 'description' }, options.description);
  if (options.keywords && options.keywords.length > 0) {
    ensureMetaTag(
      'meta[name="keywords"]',
      { attr: 'name', key: 'keywords' },
      options.keywords.join(', ')
    );
  }

  ensureMetaTag(
    'meta[property="og:type"]',
    { attr: 'property', key: 'og:type' },
    options.ogType ?? 'website'
  );
  ensureMetaTag(
    'meta[property="og:title"]',
    { attr: 'property', key: 'og:title' },
    options.title
  );
  ensureMetaTag(
    'meta[property="og:description"]',
    { attr: 'property', key: 'og:description' },
    options.description
  );
  ensureMetaTag(
    'meta[property="og:site_name"]',
    { attr: 'property', key: 'og:site_name' },
    SITE_NAME
  );
  ensureMetaTag(
    'meta[property="og:url"]',
    { attr: 'property', key: 'og:url' },
    fullUrl
  );

  ensureMetaTag(
    'meta[name="twitter:card"]',
    { attr: 'name', key: 'twitter:card' },
    'summary_large_image'
  );
  ensureMetaTag(
    'meta[name="twitter:title"]',
    { attr: 'name', key: 'twitter:title' },
    options.title
  );
  ensureMetaTag(
    'meta[name="twitter:description"]',
    { attr: 'name', key: 'twitter:description' },
    options.description
  );

  ensureCanonicalLink(fullUrl);
  setDynamicJsonLd(options.jsonLd ?? null);
}

export function buildKnowledgeBaseHubJsonLd(articles: KbArticle[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'cpcloudhost.com Knowledge Base & Error Resolution Center',
        description:
          'Authoritative technical tutorials, troubleshooting checklists, and server fixes for domains, web hosting, WordPress, KVM VPS, n8n, SSL, and email.',
        url: `${SITE_URL}/knowledge-base`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Knowledge Base',
            item: `${SITE_URL}/knowledge-base`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: articles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: article.title,
          url: `${SITE_URL}/knowledge-base/${article.slug}`,
        })),
      },
    ],
  };
}

export function buildKnowledgeBaseArticleJsonLd(article: KbArticle) {
  const articleUrl = `${SITE_URL}/knowledge-base/${article.slug}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: article.title,
        description: article.seoDescription,
        dateModified: article.updatedDate,
        datePublished: article.updatedDate,
        author: {
          '@type': 'Organization',
          name: 'cpcloudhost.com Infrastructure Engineering',
          url: SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        },
        mainEntityOfPage: articleUrl,
        keywords: article.keywords.join(', '),
      },
      {
        '@type': 'HowTo',
        name: article.title,
        description: article.summary,
        step: article.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.stepTitle,
          text: step.explanation,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Knowledge Base',
            item: `${SITE_URL}/knowledge-base`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: article.title,
            item: articleUrl,
          },
        ],
      },
      ...(article.faqItems.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: article.faqItems.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };
}
