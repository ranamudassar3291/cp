import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Menu,
  RefreshCw,
  X,
} from 'lucide-react';
import { NAV_MENUS, NavDropdownItem } from '../data/hostingData';
import {
  CURRENCY_CATALOG,
  POPULAR_COUNTRIES,
  useCurrency,
} from '../context/CurrencyContext';
import { usePlatform } from '../context/PlatformContext';

interface TopBarProps {
  onNavigateSection: (selector: string) => void;
  onNavigatePath?: (path: string) => void;
  onNavigatePage?: (
    page:
      | 'home'
      | 'shared-hosting'
      | 'wordpress-hosting'
      | 'windows-hosting'
      | 'reseller-hosting'
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
      | 'dashboard'
      | 'auth-login',
    selector?: string
  ) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onNavigateSection,
  onNavigatePath,
  onNavigatePage,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const { currentUser, cmsPages, cmsSiteSettings } = usePlatform();
  const customHeaderPages = cmsPages.filter(
    (p) => !p.isSystemPage && p.status === 'published' && p.showInHeaderMenu
  );
  const {
    countryCode,
    currency,
    detectionSource,
    isDetecting,
    setManualCountry,
    resetToAutoIp,
  } = useCurrency();

  const currencyChoices = POPULAR_COUNTRIES.some(
    (c) => c.currencyCode === currency.code
  )
    ? POPULAR_COUNTRIES
    : [
        {
          countryCode,
          countryName: currency.name,
          currencyCode: currency.code,
        },
        ...POPULAR_COUNTRIES,
      ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setCurrencyOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
        setCurrencyOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavItemClick = (item: NavDropdownItem) => {
    setOpenMenuId(null);
    setCurrencyOpen(false);
    setMobileOpen(false);

    if (item.pageTarget && onNavigatePage) {
      onNavigatePage(item.pageTarget, item.scrollTo);
      return;
    }

    if (onNavigatePage) {
      onNavigatePage('home', item.scrollTo);
    } else if (item.scrollTo) {
      onNavigateSection(item.scrollTo);
    }
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]"
    >
      {cmsSiteSettings.announcementEnabled &&
        cmsSiteSettings.announcementText.trim() && (
          <div className="bg-[#0F172A] text-white border-b border-slate-800 px-4 py-2 text-xs">
            <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
              <span className="text-slate-200 font-medium">
                {cmsSiteSettings.announcementText}
              </span>
              {cmsSiteSettings.announcementCtaText.trim() &&
                cmsSiteSettings.announcementCtaUrl.trim() && (
                  <a
                    href={cmsSiteSettings.announcementCtaUrl}
                    onClick={(e) => {
                      const url = cmsSiteSettings.announcementCtaUrl;
                      if (!url.startsWith('http') && !url.startsWith('mailto:') && onNavigatePath) {
                        e.preventDefault();
                        setOpenMenuId(null);
                        setCurrencyOpen(false);
                        setMobileOpen(false);
                        onNavigatePath(url);
                      }
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-[#10B981] hover:text-white transition-colors whitespace-nowrap"
                  >
                    <span>{cmsSiteSettings.announcementCtaText}</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
            </div>
          </div>
        )}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: cpcloudhost.com Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setOpenMenuId(null);
            setCurrencyOpen(false);
            if (onNavigatePage) {
              onNavigatePage('home', '#top');
            } else {
              onNavigateSection('#top');
            }
          }}
          className="flex items-center gap-2.5 text-[#0F172A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6B63] rounded"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="30" height="30" rx="7" fill="#0E6B63" />
            <path
              d="M9.2 18.2H20.8C22.1807 18.2 23.3 17.0807 23.3 15.7C23.3 14.4327 22.357 13.3855 21.1329 13.2215C20.7423 10.9367 18.7526 9.2 16.35 9.2C13.6714 9.2 11.5 11.3714 11.5 14.05C11.5 14.191 11.506 14.3307 11.5178 14.4688C9.69915 14.6225 8.3 16.1465 8.3 18C8.3 18.0674 8.30185 18.1343 8.3055 18.2H9.2Z"
              fill="white"
            />
            <rect
              x="8.8"
              y="20.4"
              width="12.4"
              height="1.8"
              rx="0.9"
              fill="#10B981"
            />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight">
            cpcloudhost.com
          </span>
        </a>

        {/* Zone 2: Mega Dropdown Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-7"
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setOpenMenuId(null);
              if (onNavigatePage) {
                onNavigatePage('home', '#top');
              } else {
                onNavigateSection('#top');
              }
            }}
            className="inline-flex items-center py-2 text-sm font-medium text-slate-600 hover:text-[#0E6B63] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6B63] rounded"
          >
            Home
          </a>

          {NAV_MENUS.map((menu) => {
            const isOpen = openMenuId === menu.id;
            return (
              <div
                key={menu.id}
                className="relative"
                onMouseEnter={() => setOpenMenuId(menu.id)}
                onMouseLeave={() => setOpenMenuId(null)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenMenuId(isOpen ? null : menu.id)}
                  className={`inline-flex items-center gap-1 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E6B63] rounded ${
                    isOpen
                      ? 'text-[#0E6B63]'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  <span>{menu.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-[#0E6B63]' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full pt-1.5 w-80 z-50">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_18px_40px_-12px_rgba(15,23,42,0.14)] p-2">
                      {menu.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.pageTarget && item.pageTarget !== 'home' ? `/${item.pageTarget}` : '/'}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavItemClick(item);
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-[#F8FAFC] group transition-colors flex flex-col gap-0.5 cursor-pointer"
                        >
                          <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors flex items-center justify-between">
                            {item.label}
                            <ArrowRight
                              className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0E6B63]"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="text-xs text-slate-600 leading-relaxed">
                            {item.description}
                          </span>
                        </a>
                      ))}
                      {menu.id === 'resources' &&
                        customHeaderPages.map((cp) => (
                          <a
                            key={cp.id}
                            href={cp.slug}
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenMenuId(null);
                              setMobileOpen(false);
                              onNavigatePath?.(cp.slug);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-[#F8FAFC] group transition-colors flex flex-col gap-0.5 cursor-pointer border-t border-slate-100 mt-1"
                          >
                            <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0E6B63] transition-colors flex items-center justify-between">
                              {cp.navTitle}
                              <ArrowRight
                                className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0E6B63]"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="text-xs text-slate-600 leading-relaxed line-clamp-1">
                              {cp.heroBadge || cp.seoDescription}
                            </span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Zone 3: Currency Selector Dropdown & Login / Client Portal Button */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={currencyOpen}
              aria-label={`Select currency (${currency.code})`}
              onClick={() => {
                setOpenMenuId(null);
                setCurrencyOpen((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63] ${
                currencyOpen
                  ? 'border-[#0E6B63] bg-[#F2FAF8] text-[#0E6B63]'
                  : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0E6B63]/50 hover:text-[#0E6B63]'
              }`}
            >
              <Globe className="w-4 h-4 text-[#0E6B63] shrink-0" aria-hidden="true" />
              <span className="font-mono tracking-tight">{currency.code}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  currencyOpen ? 'rotate-180 text-[#0E6B63]' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
            </button>

            {currencyOpen && (
              <div
                role="listbox"
                aria-label="Currency options"
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_18px_40px_-12px_rgba(15,23,42,0.16)] p-1.5 z-50"
              >
                <div className="max-h-72 overflow-y-auto space-y-0.5 pr-0.5">
                  {currencyChoices.map((choice) => {
                    const meta = CURRENCY_CATALOG[choice.currencyCode];
                    const symbol = meta?.symbol ?? choice.currencyCode;
                    const label = meta?.name ?? choice.countryName;
                    const isSelected = currency.code === choice.currencyCode;

                    return (
                      <button
                        key={`${choice.countryCode}-${choice.currencyCode}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setManualCountry(choice.countryCode);
                          setCurrencyOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F2FAF8] text-[#0E6B63]'
                            : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`font-mono text-xs font-bold w-8 shrink-0 ${
                              isSelected ? 'text-[#0E6B63]' : 'text-[#0F172A]'
                            }`}
                          >
                            {choice.currencyCode}
                          </span>
                          <span className="text-xs text-slate-600 truncate">
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-xs text-slate-500">
                            {symbol}
                          </span>
                          {isSelected && (
                            <Check
                              className="w-3.5 h-3.5 text-[#0E6B63]"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {detectionSource === 'manual' && (
                  <div className="mt-1 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isDetecting}
                      onClick={() => {
                        resetToAutoIp();
                        setCurrencyOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0E6B63] hover:bg-[#F2FAF8] rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>Auto-Detect Currency</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <a
            href={currentUser ? '/dashboard' : '/auth/login'}
            onClick={(e) => {
              e.preventDefault();
              setOpenMenuId(null);
              setCurrencyOpen(false);
              if (onNavigatePage) {
                onNavigatePage(currentUser ? 'dashboard' : 'auth-login', '#top');
              } else {
                onNavigateSection('#services');
              }
            }}
            className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg shadow-[0_4px_16px_rgba(14,107,99,0.22)] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E6B63]"
          >
            {currentUser ? 'Client Dashboard' : 'Login / Client Portal'}
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => {
              setCurrencyOpen(false);
              setMobileOpen(!mobileOpen);
            }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden p-2.5 rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            <div className="border-b border-[#E2E8F0] pb-2">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  if (onNavigatePage) {
                    onNavigatePage('home', '#top');
                  } else {
                    onNavigateSection('#top');
                  }
                }}
                className="w-full flex items-center justify-between py-2.5 text-sm font-semibold text-[#0F172A]"
              >
                Home
              </a>
            </div>
            {NAV_MENUS.map((menu) => {
              const expanded = mobileExpandedId === menu.id;
              return (
                <div key={menu.id} className="border-b border-[#E2E8F0] pb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileExpandedId(expanded ? null : menu.id)
                    }
                    className="w-full flex items-center justify-between py-2.5 text-sm font-semibold text-[#0F172A] cursor-pointer"
                  >
                    <span>{menu.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <div className="pl-3 pb-2 space-y-1">
                      {menu.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.pageTarget && item.pageTarget !== 'home' ? `/${item.pageTarget}` : '/'}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavItemClick(item);
                          }}
                          className="w-full text-left py-2 px-2.5 rounded-lg hover:bg-[#F8FAFC] block cursor-pointer"
                        >
                          <div className="text-sm font-medium text-[#0F172A]">
                            {item.label}
                          </div>
                          <div className="text-xs text-slate-600">
                            {item.description}
                          </div>
                        </a>
                      ))}
                      {menu.id === 'resources' &&
                        customHeaderPages.map((cp) => (
                          <a
                            key={cp.id}
                            href={cp.slug}
                            onClick={(e) => {
                              e.preventDefault();
                              setMobileOpen(false);
                              onNavigatePath?.(cp.slug);
                            }}
                            className="w-full text-left py-2 px-2.5 rounded-lg hover:bg-[#F8FAFC] block cursor-pointer"
                          >
                            <div className="text-sm font-medium text-[#0F172A]">
                              {cp.navTitle}
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-1">
                              {cp.heroBadge || cp.seoDescription}
                            </div>
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-3">
              <a
                href={currentUser ? '/dashboard' : '/auth/login'}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  if (onNavigatePage) {
                    onNavigatePage(currentUser ? 'dashboard' : 'auth-login', '#top');
                  } else {
                    onNavigateSection('#services');
                  }
                }}
                className="block text-center w-full py-3 px-4 text-sm font-semibold text-white bg-[#0E6B63] hover:bg-[#0A534D] rounded-lg cursor-pointer"
              >
                {currentUser ? 'Client Dashboard' : 'Login / Client Portal'}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
