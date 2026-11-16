/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { HeroSection } from './components/HeroSection';
import { ServiceMatrix } from './components/ServiceMatrix';
import { DomainSearchSection } from './components/DomainSearchSection';
import { SwitchCreditsBanner } from './components/SwitchCreditsBanner';
import { InfrastructureSection } from './components/InfrastructureSection';
import { WordPressShowcaseSection } from './components/WordPressShowcaseSection';
import { FreeMigrationsSection } from './components/FreeMigrationsSection';
import { CpanelFeaturesSection } from './components/CpanelFeaturesSection';
import { StackCpFeaturesSection } from './components/StackCpFeaturesSection';
import { FaqSection } from './components/FaqSection';
import { SharedHostingPage } from './components/shared/SharedHostingPage';
import { WordPressHostingPage } from './components/wordpress/WordPressHostingPage';
import { WindowsHostingPage } from './components/windows/WindowsHostingPage';
import { FreeTrialPage } from './components/trial/FreeTrialPage';
import { ComputePlatformPage } from './components/vps/ComputePlatformPage';
import { DomainRegistrationPage } from './components/domain/DomainRegistrationPage';
import { DomainTransferPage } from './components/domain/DomainTransferPage';
import { KnowledgeBasePage } from './components/kb/KnowledgeBasePage';
import { AboutUsPage } from './components/about/AboutUsPage';
import { MigrationFreePage } from './components/migrations/MigrationFreePage';
import { CpanelHostingPage } from './components/cpanel/CpanelHostingPage';
import { LegalPolicyPage } from './components/legal/LegalPolicyPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AuthLoginPage } from './components/auth/AuthLoginPage';
import { AuthRegisterPage } from './components/auth/AuthRegisterPage';
import { AuthForgotPasswordPage } from './components/auth/AuthForgotPasswordPage';
import { ClientDashboardPage } from './components/dashboard/ClientDashboardPage';
import { ServiceOrderPage } from './components/order/ServiceOrderPage';
import { CmsExtraSections } from './components/cms/CmsExtraSections';
import { CustomCmsPage } from './components/cms/CustomCmsPage';
import { Footer } from './components/Footer';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { ServiceMatrixItem } from './data/hostingData';
import { applyPageSeoMetadata } from './utils/seoManager';
import { useCurrency } from './context/CurrencyContext';
import { CmsPageRecord, usePlatform } from './context/PlatformContext';

type ActivePage =
  | 'home'
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'free-trial'
  | 'vps-hosting'
  | 'n8n-hosting'
  | 'domain-registration'
  | 'domain-transfer'
  | 'knowledge-base'
  | 'about-us'
  | 'migration-free'
  | 'cpanel-hosting'
  | 'terms-conditions'
  | 'privacy-policy'
  | 'order-terms'
  | 'refund-policy'
  | 'abuse-policy'
  | 'admin'
  | 'admin-login'
  | 'dashboard'
  | 'auth-login'
  | 'auth-register'
  | 'auth-forgot'
  | 'service-order'
  | 'custom-cms';

const PAGE_PATHS: Record<Exclude<ActivePage, 'custom-cms'>, string> = {
  home: '/',
  'shared-hosting': '/shared-hosting',
  'wordpress-hosting': '/wordpress-hosting',
  'windows-hosting': '/windows-hosting',
  'free-trial': '/free-trial',
  'vps-hosting': '/vps-hosting',
  'n8n-hosting': '/n8n-hosting',
  'domain-registration': '/domain-registration',
  'domain-transfer': '/domain-transfer',
  'knowledge-base': '/knowledge-base',
  'about-us': '/about-us',
  'migration-free': '/migration-free',
  'cpanel-hosting': '/cpanel-hosting',
  'terms-conditions': '/terms-conditions',
  'privacy-policy': '/privacy-policy',
  'order-terms': '/order-terms',
  'refund-policy': '/refund-policy',
  'abuse-policy': '/abuse-policy',
  admin: '/admin',
  'admin-login': '/admin/wp',
  dashboard: '/dashboard',
  'auth-login': '/auth/login',
  'auth-register': '/auth/register',
  'auth-forgot': '/auth/forgot-password',
  'service-order': '/order/shared-hosting',
};

export type OrderCategory =
  | 'shared-hosting'
  | 'wordpress-hosting'
  | 'windows-hosting'
  | 'cpanel-hosting'
  | 'domain-registration'
  | 'domain-transfer';

function parseRouteFromLocation(cmsPages: CmsPageRecord[] = []): {
  page: ActivePage;
  kbSlug: string | null;
  customSlug: string | null;
  orderCategory?: OrderCategory;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', kbSlug: null, customSlug: null };
  }
  const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  const rawCandidate = rawPath !== '/' ? rawPath.replace(/^\//, '') : rawHash;
  const candidate = rawCandidate.toLowerCase();

  if (candidate === 'admin/wp' || candidate.startsWith('admin/wp/')) {
    return { page: 'admin-login', kbSlug: null, customSlug: null };
  }
  if (candidate === 'admin' || candidate.startsWith('admin/')) {
    return { page: 'admin', kbSlug: null, customSlug: null };
  }
  if (candidate === 'dashboard' || candidate.startsWith('dashboard/')) {
    return { page: 'dashboard', kbSlug: null, customSlug: null };
  }
  if (candidate === 'auth/register') {
    return { page: 'auth-register', kbSlug: null, customSlug: null };
  }
  if (candidate === 'auth/forgot-password' || candidate === 'auth/forgot') {
    return { page: 'auth-forgot', kbSlug: null, customSlug: null };
  }
  if (candidate === 'auth/login' || candidate === 'auth') {
    return { page: 'auth-login', kbSlug: null, customSlug: null };
  }
  if (candidate === 'order' || candidate.startsWith('order/') || candidate.startsWith('order')) {
    let orderCategory: OrderCategory = 'shared-hosting';
    if (candidate.includes('wordpress')) orderCategory = 'wordpress-hosting';
    else if (candidate.includes('windows') || candidate.includes('wincore')) orderCategory = 'windows-hosting';
    else if (candidate.includes('cpanel')) orderCategory = 'cpanel-hosting';
    else if (candidate.includes('domain-registration') || candidate.includes('register')) orderCategory = 'domain-registration';
    else if (candidate.includes('domain-transfer') || candidate.includes('transfer')) orderCategory = 'domain-transfer';
    return { page: 'service-order', kbSlug: null, customSlug: null, orderCategory };
  }
  if (candidate.startsWith('knowledge-base/')) {
    return {
      page: 'knowledge-base',
      kbSlug: rawCandidate.slice('knowledge-base/'.length) || null,
      customSlug: null,
    };
  }
  if (candidate === 'knowledge-base' || candidate.includes('knowledge-base')) {
    return { page: 'knowledge-base', kbSlug: null, customSlug: null };
  }
  if (candidate === 'shared-hosting' || candidate.includes('shared')) {
    return { page: 'shared-hosting', kbSlug: null, customSlug: null };
  }
  if (candidate === 'wordpress-hosting' || candidate.includes('wordpress')) {
    return { page: 'wordpress-hosting', kbSlug: null, customSlug: null };
  }
  if (candidate === 'windows-hosting' || candidate.includes('windows')) {
    return { page: 'windows-hosting', kbSlug: null, customSlug: null };
  }
  if (candidate === 'free-trial' || candidate.includes('free-trial')) {
    return { page: 'free-trial', kbSlug: null, customSlug: null };
  }
  if (candidate === 'vps-hosting' || candidate.includes('vps')) {
    return { page: 'vps-hosting', kbSlug: null, customSlug: null };
  }
  if (candidate === 'n8n-hosting' || candidate.includes('n8n')) {
    return { page: 'n8n-hosting', kbSlug: null, customSlug: null };
  }
  if (
    candidate === 'domain-registration' ||
    candidate.includes('domain-registration')
  ) {
    return { page: 'domain-registration', kbSlug: null, customSlug: null };
  }
  if (candidate === 'domain-transfer' || candidate.includes('domain-transfer')) {
    return { page: 'domain-transfer', kbSlug: null, customSlug: null };
  }
  if (candidate === 'about-us' || candidate.includes('about-us')) {
    return { page: 'about-us', kbSlug: null, customSlug: null };
  }
  if (candidate === 'migration-free' || candidate.includes('migration-free')) {
    return { page: 'migration-free', kbSlug: null, customSlug: null };
  }
  if (candidate === 'cpanel-hosting' || candidate.includes('cpanel-hosting')) {
    return { page: 'cpanel-hosting', kbSlug: null, customSlug: null };
  }
  if (
    candidate === 'terms-conditions' ||
    candidate.includes('terms-conditions')
  ) {
    return { page: 'terms-conditions', kbSlug: null, customSlug: null };
  }
  if (candidate === 'privacy-policy' || candidate.includes('privacy-policy')) {
    return { page: 'privacy-policy', kbSlug: null, customSlug: null };
  }
  if (candidate === 'order-terms' || candidate.includes('order-terms')) {
    return { page: 'order-terms', kbSlug: null, customSlug: null };
  }
  if (candidate === 'refund-policy' || candidate.includes('refund-policy')) {
    return { page: 'refund-policy', kbSlug: null, customSlug: null };
  }
  if (candidate === 'abuse-policy' || candidate.includes('abuse-policy')) {
    return { page: 'abuse-policy', kbSlug: null, customSlug: null };
  }

  if (candidate) {
    const matchedCustom = cmsPages.find(
      (p) =>
        !p.isSystemPage &&
        p.status === 'published' &&
        p.slug.replace(/^\/+/, '').toLowerCase() === candidate
    );
    if (matchedCustom) {
      return {
        page: 'custom-cms',
        kbSlug: null,
        customSlug: matchedCustom.slug,
      };
    }
  }

  return { page: 'home', kbSlug: null, customSlug: null };
}

function getInitialDashboardPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (rawPath === '/dashboard' || rawPath.startsWith('/dashboard/')) {
    return rawPath;
  }
  return '/dashboard';
}

function getInitialAdminPath(): string {
  if (typeof window === 'undefined') return '/admin';
  const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (
    (rawPath === '/admin' || rawPath.startsWith('/admin/')) &&
    !rawPath.startsWith('/admin/wp')
  ) {
    return rawPath;
  }
  return '/admin';
}

export default function App() {
  const { formatPriceString } = useCurrency();
  const {
    currentUser,
    isAdmin,
    cmsPages,
    hostingPlans,
    pendingPostAuthPath,
    setPendingPostAuthPath,
    setOrderCheckoutDraft,
  } = usePlatform();

  const cmsPagesRef = useRef<CmsPageRecord[]>(cmsPages);
  cmsPagesRef.current = cmsPages;

  const initialResolved = parseRouteFromLocation(cmsPages);
  const [activePage, setActivePage] = useState<ActivePage>(initialResolved.page);
  const [orderCategory, setOrderCategory] = useState<OrderCategory>(
    initialResolved.orderCategory || 'shared-hosting'
  );
  const [domainSearchPrefill, setDomainSearchPrefill] = useState('');
  const [domainTransferPrefill, setDomainTransferPrefill] = useState('');
  const [kbArticleSlug, setKbArticleSlug] = useState<string | null>(
    initialResolved.kbSlug
  );
  const [customCmsSlug, setCustomCmsSlug] = useState<string | null>(
    initialResolved.customSlug
  );
  const [dashboardPath, setDashboardPath] = useState<string>(
    getInitialDashboardPath
  );
  const [adminPath, setAdminPath] = useState<string>(getInitialAdminPath);
  const [toastMsg, setToastMsg] = useState('');
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  }, []);

  useEffect(() => {
    const normalizeAndSync = () => {
      const resolved = parseRouteFromLocation(cmsPagesRef.current);
      setActivePage(resolved.page);
      if (resolved.orderCategory) {
        setOrderCategory(resolved.orderCategory);
      }
      setKbArticleSlug(resolved.kbSlug);
      setCustomCmsSlug(resolved.customSlug);

      const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
      const cleanDashboardPath =
        rawPath === '/dashboard' || rawPath.startsWith('/dashboard/')
          ? rawPath
          : '/dashboard';
      const cleanAdminPath =
        (rawPath === '/admin' || rawPath.startsWith('/admin/')) &&
        !rawPath.startsWith('/admin/wp')
          ? rawPath
          : '/admin';

      if (resolved.page === 'dashboard') {
        setDashboardPath(cleanDashboardPath);
      }
      if (resolved.page === 'admin') {
        setAdminPath(cleanAdminPath);
      }

      const currentOrderCat = resolved.orderCategory || orderCategory || 'shared-hosting';
      const cleanPath =
        resolved.page === 'knowledge-base' && resolved.kbSlug
          ? `/knowledge-base/${resolved.kbSlug}`
          : resolved.page === 'service-order'
            ? `/order/${currentOrderCat}`
            : resolved.page === 'dashboard'
            ? cleanDashboardPath
            : resolved.page === 'admin'
              ? cleanAdminPath
              : resolved.page === 'custom-cms' && resolved.customSlug
                ? resolved.customSlug
                : resolved.page === 'custom-cms'
                  ? '/'
                  : PAGE_PATHS[resolved.page];

      if (
        window.location.pathname !== cleanPath ||
        window.location.hash !== ''
      ) {
        window.history.replaceState(
          null,
          '',
          `${cleanPath}${window.location.search}`
        );
      }
    };

    normalizeAndSync();

    window.addEventListener('popstate', normalizeAndSync);
    window.addEventListener('hashchange', normalizeAndSync);
    return () => {
      window.removeEventListener('popstate', normalizeAndSync);
      window.removeEventListener('hashchange', normalizeAndSync);
    };
  }, []);

  // Redirect unauthenticated or non-admin attempts to /admin cleanly onto /admin/wp
  useEffect(() => {
    if (activePage === 'admin' && (!currentUser || !isAdmin)) {
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/admin/wp'
      ) {
        window.history.replaceState(
          null,
          '',
          `/admin/wp${window.location.search}`
        );
      }
    }
  }, [activePage, currentUser, isAdmin]);

  const homeCms = useMemo(
    () => cmsPages.find((p) => p.id === 'home'),
    [cmsPages]
  );

  const activeCustomCmsPage = useMemo(() => {
    if (activePage !== 'custom-cms' || !customCmsSlug) return null;
    return (
      cmsPages.find(
        (p) =>
          !p.isSystemPage &&
          p.status === 'published' &&
          p.slug.toLowerCase() === customCmsSlug.toLowerCase()
      ) ?? null
    );
  }, [activePage, customCmsSlug, cmsPages]);

  // Keep SEO metadata crisp whenever navigating across core & hosting pages
  useEffect(() => {
    if (
      activePage === 'knowledge-base' ||
      activePage === 'about-us' ||
      activePage === 'migration-free' ||
      activePage === 'cpanel-hosting' ||
      activePage === 'terms-conditions' ||
      activePage === 'privacy-policy' ||
      activePage === 'order-terms' ||
      activePage === 'refund-policy' ||
      activePage === 'abuse-policy' ||
      activePage === 'admin' ||
      activePage === 'admin-login' ||
      activePage === 'dashboard' ||
      activePage === 'auth-login' ||
      activePage === 'auth-register' ||
      activePage === 'auth-forgot' ||
      activePage === 'service-order' ||
      activePage === 'custom-cms'
    ) {
      return;
    }

    const seoMap: Record<
      Exclude<
        ActivePage,
        | 'knowledge-base'
        | 'about-us'
        | 'migration-free'
        | 'cpanel-hosting'
        | 'terms-conditions'
        | 'privacy-policy'
        | 'order-terms'
        | 'refund-policy'
        | 'abuse-policy'
        | 'admin'
        | 'admin-login'
        | 'dashboard'
        | 'auth-login'
        | 'auth-register'
        | 'auth-forgot'
        | 'service-order'
        | 'custom-cms'
      >,
      { title: string; description: string; path: string }
    > = {
      home: {
        title:
          'cpcloudhost.com — NVMe Cloud Hosting, VPS & Managed Infrastructure',
        description:
          'Enterprise NVMe cloud hosting, managed WordPress, cPanel, Windows, VPS, and multi-cloud servers with Free SSL, daily backups, and a 99.99% uptime SLA.',
        path: '/',
      },
      'shared-hosting': {
        title: 'Shared Web Hosting — NVMe Autoscaling Cloud | cpcloudhost.com',
        description:
          'Fast, autoscaling Linux shared hosting starting at $2.50/mo with StackCP, Free SSL, daily backups, and free site migrations.',
        path: '/shared-hosting',
      },
      'wordpress-hosting': {
        title:
          'Managed WordPress Hosting — LiteSpeed & Edge Cache | cpcloudhost.com',
        description:
          'High-speed managed WordPress and WooCommerce hosting with StackCache, Redis object cache, automated staging, and daily backups.',
        path: '/wordpress-hosting',
      },
      'windows-hosting': {
        title:
          'Windows Web Hosting — ASP.NET Core 8, IIS 10 & MSSQL | cpcloudhost.com',
        description:
          'Dedicated Windows IIS 10, ASP.NET Core, and MSSQL enterprise hosting with Free SSL and autoscaling cloud resources.',
        path: '/windows-hosting',
      },
      'free-trial': {
        title:
          '30-Day Free Hosting Trial (Promo: STARTFREE) | cpcloudhost.com',
        description:
          'Launch Cloud Ignite, WP Core, or WinCore Pro free for 30 days with promo code STARTFREE on cpcloudhost.com.',
        path: '/free-trial',
      },
      'vps-hosting': {
        title:
          'Unmanaged KVM VPS Hosting — Dedicated vCPU & NVMe | cpcloudhost.com',
        description:
          'Full root SSH KVM VPS instances with dedicated vCPU cores, NVMe/SSD storage, automated snapshots, and unlimited traffic.',
        path: '/vps-hosting',
      },
      'n8n-hosting': {
        title:
          'n8n Hosting — Pre-Configured Workflow Automation Nodes | cpcloudhost.com',
        description:
          'Dedicated n8n workflow automation hosting on KVM NVMe nodes with Redis queues, PostgreSQL persistence, and HTTPS webhooks.',
        path: '/n8n-hosting',
      },
      'domain-registration': {
        title:
          'Domain Registration & Live Availability Search | cpcloudhost.com',
        description:
          'Register .com, .co.uk, .uk, .net, .io, and .cloud domains with free WHOIS privacy, DNSSEC, and instant DNS propagation.',
        path: '/domain-registration',
      },
      'domain-transfer': {
        title:
          'Domain Transfer — Zero-Downtime Registrar Moves | cpcloudhost.com',
        description:
          'Transfer single or bulk domains to cpcloudhost.com with +1 year renewal, zero DNS downtime, and live EPP readiness verification.',
        path: '/domain-transfer',
      },
    };

    const fallback = seoMap[activePage];
    const cmsOverride = cmsPages.find((p) => p.id === activePage);
    applyPageSeoMetadata({
      title: cmsOverride?.seoTitle?.trim() || fallback.title,
      description: formatPriceString(
        cmsOverride?.seoDescription?.trim() || fallback.description
      ),
      canonicalPath: fallback.path,
      ogType: 'website',
      jsonLd: null,
    });
  }, [activePage, cmsPages, formatPriceString]);

  const scrollToSection = (selector: string) => {
    if (selector === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigatePage = useCallback(
    (page: ActivePage, selector?: string, explicitCustomSlug?: string) => {
      setActivePage(page);
      if (page === 'knowledge-base' && selector !== '#kb-article') {
        setKbArticleSlug(null);
      }
      if (page === 'dashboard') {
        setDashboardPath('/dashboard');
      }
      if (page === 'admin') {
        setAdminPath('/admin');
      }
      if (page === 'custom-cms' && explicitCustomSlug) {
        setCustomCmsSlug(explicitCustomSlug);
      }

      if (typeof window !== 'undefined') {
        const targetPath =
          page === 'custom-cms'
            ? explicitCustomSlug || '/'
            : PAGE_PATHS[page] ?? '/';
        const currentFull = `${window.location.pathname}${window.location.hash}`;
        if (currentFull !== targetPath) {
          window.history.pushState(
            null,
            '',
            `${targetPath}${window.location.search}`
          );
        }
      }

      if (page !== 'home' && (!selector || selector === '#top')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setTimeout(() => {
        scrollToSection(selector ?? '#top');
      }, 60);
    },
    []
  );

  const navigateByPath = useCallback(
    (rawUrl: string) => {
      const cleaned = rawUrl.trim();
      if (!cleaned) {
        navigatePage('home', '#top');
        return;
      }
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('mailto:')) {
        window.location.assign(cleaned);
        return;
      }
      if (cleaned.startsWith('#')) {
        scrollToSection(cleaned);
        return;
      }
      if (cleaned.startsWith('/#')) {
        navigatePage('home', cleaned.slice(1));
        return;
      }

      const normalized = cleaned.replace(/\/+$/, '') || '/';
      if (normalized.startsWith('/order')) {
        let cat: OrderCategory = 'shared-hosting';
        if (normalized.includes('wordpress')) cat = 'wordpress-hosting';
        else if (normalized.includes('windows') || normalized.includes('wincore')) cat = 'windows-hosting';
        else if (normalized.includes('cpanel')) cat = 'cpanel-hosting';
        else if (normalized.includes('domain-registration') || normalized.includes('register')) cat = 'domain-registration';
        else if (normalized.includes('domain-transfer') || normalized.includes('transfer')) cat = 'domain-transfer';
        setOrderCategory(cat);
        setActivePage('service-order');
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `${normalized}${window.location.search}`);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (normalized.startsWith('/knowledge-base/')) {
        const slug = normalized.slice('/knowledge-base/'.length);
        setKbArticleSlug(slug);
        setActivePage('knowledge-base');
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `${normalized}${window.location.search}`);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const matchedEntry = (
        Object.entries(PAGE_PATHS) as [Exclude<ActivePage, 'custom-cms'>, string][]
      ).find(([, path]) => path === normalized);

      if (matchedEntry) {
        navigatePage(matchedEntry[0], '#top');
        return;
      }

      const matchedCustom = cmsPagesRef.current.find(
        (p) =>
          !p.isSystemPage &&
          p.status === 'published' &&
          p.slug.toLowerCase() === normalized.toLowerCase()
      );
      if (matchedCustom) {
        navigatePage('custom-cms', '#top', matchedCustom.slug);
        return;
      }

      navigatePage('home', '#top');
    },
    [navigatePage]
  );

  const handleSelectService = (item: ServiceMatrixItem) => {
    if (item.pageTarget === 'shared-hosting') {
      navigatePage('shared-hosting', '#top');
      return;
    }
    if (item.pageTarget === 'wordpress-hosting') {
      navigatePage('wordpress-hosting', '#top');
      return;
    }
    if (item.pageTarget === 'windows-hosting') {
      navigatePage('windows-hosting', '#top');
      return;
    }
    if (item.pageTarget === 'free-trial') {
      navigatePage('free-trial', '#top');
      return;
    }
    if (item.pageTarget === 'vps-hosting') {
      navigatePage('vps-hosting', '#top');
      return;
    }
    if (item.pageTarget === 'n8n-hosting') {
      navigatePage('n8n-hosting', '#top');
      return;
    }
    if (item.pageTarget === 'domain-registration') {
      navigatePage('domain-registration', '#top');
      return;
    }
    if (item.pageTarget === 'domain-transfer') {
      navigatePage('domain-transfer', '#top');
      return;
    }
    if (item.pageTarget === 'about-us') {
      navigatePage('about-us', '#top');
      return;
    }
    if (item.pageTarget === 'migration-free') {
      navigatePage('migration-free', '#top');
      return;
    }
    if (item.pageTarget === 'cpanel-hosting') {
      navigatePage('cpanel-hosting', '#top');
      return;
    }
    navigatePage('home', item.scrollTo ?? '#infrastructure');
  };

  const handlePostAuthSuccess = useCallback(() => {
    if (pendingPostAuthPath) {
      const target = pendingPostAuthPath;
      setPendingPostAuthPath(null);
      navigateByPath(target);
      return;
    }
    navigatePage('dashboard', '#top');
  }, [pendingPostAuthPath, setPendingPostAuthPath, navigateByPath, navigatePage]);

  const handleLaunchSharedOrderFromDashboard = useCallback(() => {
    const defaultPlan =
      hostingPlans.find((p) => p.pageCategory === 'shared-hosting' && p.enabled && p.popular) ??
      hostingPlans.find((p) => p.pageCategory === 'shared-hosting' && p.enabled);
    setOrderCheckoutDraft({
      planId: defaultPlan?.id || 'plan-shared-velocity',
      planName: defaultPlan?.name || 'Cloud Velocity',
      productType: 'Shared Cloud',
      billingCycle: '1 Year',
      datacenterId: 'uk',
      datacenterLabel: 'London, UK',
      domainOption: 'register',
      domainName: '',
      step: 1,
      sourceOrigin: 'dashboard',
      updatedAtUtc: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    });
    navigatePage('service-order', '#top');
  }, [hostingPlans, setOrderCheckoutDraft, navigatePage]);

  const isStandaloneShell =
    activePage === 'auth-login' ||
    activePage === 'auth-register' ||
    activePage === 'dashboard' ||
    activePage === 'service-order' ||
    activePage === 'admin' ||
    activePage === 'admin-login';

  const shouldRenderClientLoginGate =
    activePage === 'auth-login' || (activePage === 'dashboard' && !currentUser);

  const shouldRenderAdminLoginGate =
    activePage === 'admin-login' ||
    (activePage === 'admin' && (!currentUser || !isAdmin));

  return (
    <div id="top" className="min-h-screen bg-white text-[#0F172A] flex flex-col">
      {/* Sticky Header & Mega Navigation (Hidden on standalone /auth/*, /dashboard, /admin/wp, and /admin consoles) */}
      {!isStandaloneShell && (
        <TopBar
          onNavigateSection={(selector) => navigatePage('home', selector)}
          onNavigatePage={navigatePage}
          onNavigatePath={navigateByPath}
        />
      )}

      <main className="flex-1">
        {activePage === 'shared-hosting' ? (
          <SharedHostingPage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'wordpress-hosting' ? (
          <WordPressHostingPage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'windows-hosting' ? (
          <WindowsHostingPage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'free-trial' ? (
          <FreeTrialPage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'vps-hosting' ? (
          <ComputePlatformPage
            key="vps"
            mode="vps"
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'n8n-hosting' ? (
          <ComputePlatformPage
            key="n8n"
            mode="n8n"
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'domain-registration' ? (
          <DomainRegistrationPage
            initialQuery={domainSearchPrefill}
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onTransferDomain={(domain) => {
              setDomainTransferPrefill(domain);
              navigatePage('domain-transfer', '#top');
            }}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'domain-transfer' ? (
          <DomainTransferPage
            prefilledDomain={domainTransferPrefill}
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onRegisterInstead={(domain) => {
              setDomainSearchPrefill(domain);
              navigatePage('domain-registration', '#top');
            }}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'knowledge-base' ? (
          <KnowledgeBasePage
            initialArticleSlug={kbArticleSlug}
            onSelectArticleSlug={(slug) => {
              setKbArticleSlug(slug);
              if (typeof window !== 'undefined') {
                const nextPath = slug
                  ? `/knowledge-base/${slug}`
                  : '/knowledge-base';
                if (
                  window.location.pathname !== nextPath ||
                  window.location.hash !== ''
                ) {
                  window.history.pushState(
                    null,
                    '',
                    `${nextPath}${window.location.search}`
                  );
                }
              }
            }}
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onOpenPage={(targetPage) => navigatePage(targetPage, '#top')}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'about-us' ? (
          <AboutUsPage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onOpenPage={(targetPage, selector) =>
              navigatePage(targetPage, selector ?? '#top')
            }
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'migration-free' ? (
          <MigrationFreePage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onOpenPage={(targetPage, selector) =>
              navigatePage(targetPage, selector ?? '#top')
            }
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'cpanel-hosting' ? (
          <CpanelHostingPage
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onOpenPage={(targetPage, selector) =>
              navigatePage(targetPage, selector ?? '#top')
            }
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'terms-conditions' ||
          activePage === 'privacy-policy' ||
          activePage === 'order-terms' ||
          activePage === 'refund-policy' ||
          activePage === 'abuse-policy' ? (
          <LegalPolicyPage
            activePolicy={activePage}
            onSelectPolicy={(policy, selector) =>
              navigatePage(policy, selector ?? '#top')
            }
            onNavigateHome={(selector) => navigatePage('home', selector)}
            onNavigatePath={navigateByPath}
          />
        ) : activePage === 'custom-cms' && activeCustomCmsPage ? (
          <CustomCmsPage
            page={activeCustomCmsPage}
            onNavigateHome={() => navigatePage('home', '#top')}
            onNavigateUrl={navigateByPath}
          />
        ) : shouldRenderAdminLoginGate ? (
          <AdminLoginPage
            onNavigateHome={() => navigatePage('home', '#top')}
            onLoginSuccess={() => navigatePage('admin', '#top')}
            onOpenClientDashboard={() => navigatePage('dashboard', '#top')}
          />
        ) : activePage === 'admin' && currentUser && isAdmin ? (
          <AdminPanel
            initialRoutePath={adminPath}
            onSyncRoutePath={(nextPath) => {
              setAdminPath(nextPath);
              if (
                typeof window !== 'undefined' &&
                window.location.pathname !== nextPath
              ) {
                window.history.pushState(
                  null,
                  '',
                  `${nextPath}${window.location.search}`
                );
              }
            }}
            onNavigateHome={() => navigatePage('home', '#top')}
            onPreviewPublicPath={navigateByPath}
            onOpenDashboard={() => navigatePage('dashboard', '#top')}
            onSignedOut={() => navigatePage('admin-login', '#top')}
          />
        ) : activePage === 'service-order' ? (
          <ServiceOrderPage
            orderCategory={orderCategory}
            onNavigateHome={() => navigatePage('home', '#top')}
            onBackToSharedHosting={() => {
              if (orderCategory === 'wordpress-hosting') {
                navigatePage('wordpress-hosting', '#wp-plans');
              } else if (orderCategory === 'windows-hosting') {
                navigatePage('windows-hosting', '#win-plans');
              } else if (orderCategory === 'cpanel-hosting') {
                navigatePage('cpanel-hosting', '#cpanel-pricing');
              } else if (orderCategory === 'domain-registration') {
                navigatePage('domain-registration', '#top');
              } else if (orderCategory === 'domain-transfer') {
                navigatePage('domain-transfer', '#top');
              } else {
                navigatePage('shared-hosting', '#shared-plans');
              }
            }}
            onRequireLogin={() => navigatePage('auth-login', '#top')}
            onRequireRegister={() => navigatePage('auth-register', '#top')}
            onOpenDashboard={(subPath) => {
              if (subPath && subPath.startsWith('/dashboard')) {
                setDashboardPath(subPath);
                setActivePage('dashboard');
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', `${subPath}${window.location.search}`);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigatePage('dashboard', '#top');
              }
            }}
          />
        ) : activePage === 'dashboard' && currentUser ? (
          <ClientDashboardPage
            initialRoutePath={dashboardPath}
            onSyncRoutePath={(nextPath) => {
              setDashboardPath(nextPath);
              if (
                typeof window !== 'undefined' &&
                window.location.pathname !== nextPath
              ) {
                window.history.pushState(
                  null,
                  '',
                  `${nextPath}${window.location.search}`
                );
              }
            }}
            onNavigateHome={() => navigatePage('home', '#top')}
            onOpenKnowledgeBase={() => navigatePage('knowledge-base', '#top')}
            onSignedOut={() => navigatePage('auth-login', '#top')}
            onOrderSharedHosting={handleLaunchSharedOrderFromDashboard}
            onNavigateOrderCategory={(cat) => navigateByPath(`/order/${cat}`)}
            onReturnToAdminClient={(clientUserId) => {
              const nextAdminPath = `/admin/users/${encodeURIComponent(clientUserId)}`;
              setAdminPath(nextAdminPath);
              setActivePage('admin');
              if (typeof window !== 'undefined') {
                window.history.pushState(
                  null,
                  '',
                  `${nextAdminPath}${window.location.search}`
                );
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activePage === 'auth-register' ? (
          <AuthRegisterPage
            onNavigateHome={() => navigatePage('home', '#top')}
            onGoToLogin={() => navigatePage('auth-login', '#top')}
            onOpenDashboard={handlePostAuthSuccess}
            onOpenPolicy={(policy) => navigatePage(policy, '#top')}
          />
        ) : activePage === 'auth-forgot' ? (
          <AuthForgotPasswordPage
            onBackToLogin={() => navigatePage('auth-login', '#top')}
            onShowToast={showToast}
          />
        ) : shouldRenderClientLoginGate ? (
          <AuthLoginPage
            onNavigateHome={() => navigatePage('home', '#top')}
            onOpenDashboard={handlePostAuthSuccess}
            onOpenPolicy={(policy) => navigatePage(policy, '#top')}
            onGoToRegister={() => navigatePage('auth-register', '#top')}
            onGoToForgotPassword={() => navigatePage('auth-forgot', '#top')}
          />
        ) : (
          <>
            {/* Hero Section */}
            <HeroSection
              onStartTrial={() => navigatePage('free-trial', '#top')}
              onViewPlans={() => scrollToSection('#services')}
              onSelectOrbitPlatform={scrollToSection}
              onNavigatePath={navigateByPath}
            />

            {/* 10-Service Matrix Grid + Partner & Technology Logo Strip */}
            <ServiceMatrix
              onSelectService={handleSelectService}
              onSelectPlatform={scrollToSection}
            />

            {/* Interactive Domain Search Section */}
            <DomainSearchSection onNavigatePath={navigateByPath} />

            {/* Switch Credits Banner */}
            <SwitchCreditsBanner
              onSwitchNow={() => scrollToSection('#free-migrations')}
              onNavigatePath={navigateByPath}
            />

            {/* Worldwide Data Center Locations */}
            <InfrastructureSection />

            {/* Managed WordPress & WooCommerce Control Panel Showcase */}
            <WordPressShowcaseSection
              onExploreWordPress={() =>
                navigatePage('wordpress-hosting', '#top')
              }
            />

            {/* Free Migrations + Switch Credits Isometric Showcase */}
            <FreeMigrationsSection />

            {/* Classic cPanel Hosting Features & Unlimited cPanel Banner */}
            <CpanelFeaturesSection
              onViewFeatures={() => navigatePage('cpanel-hosting', '#top')}
              onGetStarted={() => navigatePage('cpanel-hosting', '#top')}
            />

            {/* StackCP Autoscaling Cloud Feature Grid */}
            <StackCpFeaturesSection
              onViewFeatures={() => scrollToSection('#services')}
            />

            {/* Custom CMS Sections Added To Homepage */}
            <CmsExtraSections
              sections={homeCms?.sections}
              excludeIds={['switch-credits']}
              onNavigateUrl={navigateByPath}
            />

            {/* FAQ's Accordion Section */}
            <FaqSection />
          </>
        )}
      </main>

      {/* Complete 5-Column Enterprise Footer (Hidden on standalone /auth/*, /dashboard, /admin/wp, and /admin consoles) */}
      {!isStandaloneShell && (
        <Footer
          onNavigateSection={(selector) => navigatePage('home', selector)}
          onNavigatePath={navigateByPath}
          onOpenSharedHosting={() => navigatePage('shared-hosting', '#top')}
          onOpenWordPressHosting={() =>
            navigatePage('wordpress-hosting', '#top')
          }
          onOpenWindowsHosting={() => navigatePage('windows-hosting', '#top')}
          onOpenFreeTrial={() => navigatePage('free-trial', '#top')}
          onOpenVpsHosting={() => navigatePage('vps-hosting', '#top')}
          onOpenN8nHosting={() => navigatePage('n8n-hosting', '#top')}
          onOpenDomainRegistration={() =>
            navigatePage('domain-registration', '#top')
          }
          onOpenDomainTransfer={() => navigatePage('domain-transfer', '#top')}
          onOpenKnowledgeBase={() => navigatePage('knowledge-base', '#top')}
          onOpenAboutUs={() => navigatePage('about-us', '#top')}
          onOpenMigrationFree={() => navigatePage('migration-free', '#top')}
          onOpenCpanelHosting={() => navigatePage('cpanel-hosting', '#top')}
          onOpenTerms={() => navigatePage('terms-conditions', '#top')}
          onOpenPrivacy={() => navigatePage('privacy-policy', '#top')}
          onOpenOrderTerms={() => navigatePage('order-terms', '#top')}
          onOpenRefundPolicy={() => navigatePage('refund-policy', '#top')}
          onOpenAbusePolicy={() => navigatePage('abuse-policy', '#top')}
        />
      )}

      {/* Floating WhatsApp Support Button */}
      {!isStandaloneShell && <WhatsAppWidget />}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-[#0E6B63] animate-pulse shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
