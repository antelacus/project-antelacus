"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchModal from './SearchModal';
import UtilityDropdown from './UtilityDropdown';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { locales } from '@/i18n/routing';
import { useLocalePrefix } from '@/i18n/use-locale-prefix';
import { SITE_ORIGIN } from '@/lib/site';
import { jsonLdScript } from '@/lib/structured-data';

export default function Nav() {
  const t = useTranslations();
  const pathname = usePathname();
  const [animationState, setAnimationState] = useState<'idle' | 'nav-prep' | 'nav-moving' | 'logo-appearing' | 'complete'>('idle');
  const [isFromHomepage, setIsFromHomepage] = useState(false);
  const [mounted, setMounted] = useState(false);

  const prefix = useLocalePrefix();
  const stripLocale = (path: string) => {
    const seg = (path || '/').split('/')[1] || '';
    if ((locales as readonly string[]).includes(seg)) {
      const rest = path.slice(seg.length + 1);
      return rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '/';
    }
    return path || '/';
  };
  const pathNoLocale = useMemo(() => stripLocale(pathname), [pathname]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPreset, setSearchPreset] = useState<{
    tags?: string[];
    type?: 'post' | 'note' | 'photo' | 'project' | 'all';
    q?: string;
    year?: string;
  } | undefined>(undefined);
  const [utilityOpen, setUtilityOpen] = useState(false);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const [tocHintDismissed, setTocHintDismissed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  // Helper to select short labels on narrow screens
  const labelFor = (key: string, shortKey: string) => (isNarrow ? t(shortKey) : t(key));

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const isHomePage = pathNoLocale === '/';
  const isDetailPage = useMemo(() => {
    // /posts/[slug], /notes/[slug], /gallery/[slug], /projects/[slug]
    return /^(\/posts|\/notes|\/gallery|\/projects)\/[A-Za-z0-9-_]+$/.test(pathNoLocale);
  }, [pathNoLocale]);

  const sectionInfo = useMemo(() => {
    // Determine top-level section and its Chinese label
    const m = pathNoLocale.match(/^\/(posts|notes|gallery|projects)(?:\/|$)/);
    const key = m ? m[1] : undefined;
    const labelMap: Record<string, { label: string; href: string }> = {
      posts: { label: labelFor('nav.posts', 'nav.posts_short'), href: `${prefix}/posts` },
      notes: { label: labelFor('nav.notes', 'nav.notes_short'), href: `${prefix}/notes` },
      gallery: { label: labelFor('nav.gallery', 'nav.gallery_short'), href: `${prefix}/gallery` },
      projects: { label: labelFor('nav.projects', 'nav.projects_short'), href: `${prefix}/projects` },
    };
    return key ? labelMap[key] : undefined;
  }, [pathNoLocale, t, prefix]);

  const [currentTitle, setCurrentTitle] = useState<string>("");
  useEffect(() => {
    if (!isDetailPage) return;
    // Preferred: document.title without site suffix
    const base = (document.title || '').replace(/\s*\|\s*AnteLacus.*/, '');
    if (base) {
      setCurrentTitle(base);
      return;
    }
    // Fallback: article data-title
    const article = document.querySelector('article');
    const dt = article?.getAttribute('data-title');
    if (dt) setCurrentTitle(dt);
  }, [isDetailPage, pathname]);

  // Close the utility dropdown on route change and reset ToC hint
  useEffect(() => {
    setUtilityOpen(false);
    setTocHintDismissed(false); // Reset ToC hint for new pages
  }, [pathname]);

  // Track ToC hint dismissal when nav hides for the first time
  useEffect(() => {
    if (hideOnScroll && !tocHintDismissed) {
      setTocHintDismissed(true);
    }
  }, [hideOnScroll, tocHintDismissed]);

  // Global event to open search with preset filters
  useEffect(() => {
    type OpenSearchDetail = {
      tags?: string[];
      type?: 'post' | 'note' | 'photo' | 'project' | 'all';
      q?: string;
      year?: string;
    };
    const handler = (e: CustomEvent<OpenSearchDetail>) => {
      const detail = e.detail || {};
      setSearchPreset(detail);
      setSearchOpen(true);
    };
    // Narrow the listener type without using any
    window.addEventListener('open-search', handler as EventListener);
    return () => window.removeEventListener('open-search', handler as EventListener);
  }, []);

  // Auto-hide header on scroll down, show on scroll up (with small threshold)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastY = window.scrollY || 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastY;
      // Always show near the very top
      if (y < 24) {
        setHideOnScroll(false);
        lastY = y;
        return;
      }
      // If scrolling down and passed a small hold threshold, hide
      if (delta > 6 && y > 80) {
        setHideOnScroll(true);
      }
      // If scrolling up, show immediately
      if (delta < -6) {
        setHideOnScroll(false);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Detect navigation from homepage
  useEffect(() => {
    const fromHome = sessionStorage.getItem('navigatedFromHome');
    if (fromHome === 'true' && !isHomePage) {
      setIsFromHomepage(true);
      // Prep phase: render at translateY(0) without transition so we can animate to 20px next tick
      setAnimationState('nav-prep');
      sessionStorage.removeItem('navigatedFromHome');
      
      // Animation sequence orchestration
      const startMove = setTimeout(() => {
        setAnimationState('nav-moving');
      }, 16); // next frame

      const timer1 = setTimeout(() => {
        setAnimationState('logo-appearing');
      }, 16 + 500);
      
      const timer2 = setTimeout(() => {
        setAnimationState('complete');
      }, 16 + 1000);
      
      return () => {
        clearTimeout(startMove);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setAnimationState('complete');
    }
  }, [pathname, isHomePage]);

  // Clear animation state when leaving the page
  useEffect(() => {
    return () => {
      if (isHomePage) {
        setAnimationState('idle');
        setIsFromHomepage(false);
      }
    };
  }, [isHomePage]);

  // Ensure content does not animate on non-home pages
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isHomePage) {
      document.body.classList.add('suppress-content-entrance');
    } else {
      document.body.classList.remove('suppress-content-entrance');
    }
    return () => {
      // Clean up when unmounting or route changes back
      document.body.classList.remove('suppress-content-entrance');
    };
  }, [isHomePage]);

  // Hydration safety: defer certain client-only conditionals until after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine narrow screen after mount to avoid SSR/CSR mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsNarrow(window.innerWidth <= 450);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  // Calculate dynamic styles based on animation state
  const getHeaderStyles = () => {
    // Keep header size constant so page content does not shift
    return { paddingTop: '2rem', paddingBottom: '2rem' };
  };

  const getLogoStyles = () => {
    if (!isFromHomepage || animationState === 'complete') {
      return {
        opacity: 1,
        transform: 'translateY(0)',
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
      };
    }
    
    switch (animationState) {
      case 'nav-moving':
        return {
          opacity: 0,
          transform: 'translateY(0)',
          transition: 'none',
        };
      case 'logo-appearing':
        return {
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        };
      default:
        return {
          opacity: 0,
          transform: 'translateY(0)',
        };
    }
  };

  // Only move the nav links container; keep header height constant
  const getNavContainerStyles = () => {
    // Avoid hydration mismatch: render neutral state until mounted
    if (!mounted) {
      return { transform: 'translateY(0)' };
    }
    if (!isFromHomepage) {
      // Homepage: no offset; Non-home direct load: resting offset
      return { transform: isHomePage ? 'translateY(0)' : 'translateY(20px)' };
    }

    switch (animationState) {
      case 'nav-prep':
        // Start at 0 without transition, so next state to 20px will animate
        return {
          transform: 'translateY(0)',
          transition: 'none',
        };
      case 'nav-moving':
        return {
          transform: 'translateY(20px)',
          transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        };
      case 'logo-appearing':
      case 'complete':
        return {
          transform: 'translateY(20px)',
          transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        };
      default:
        return { transform: 'translateY(0)' };
    }
  };

  // Build breadcrumb JSON-LD when on a detail page
  const breadcrumbJsonLd = useMemo(() => {
    if (!isDetailPage || !sectionInfo || !currentTitle) return null;
    const items = [
      { position: 1, name: '首页', item: `${SITE_ORIGIN}/` },
      { position: 2, name: sectionInfo.label, item: `${SITE_ORIGIN}${sectionInfo.href}` },
      { position: 3, name: currentTitle, item: `${SITE_ORIGIN}${pathname}` },
    ];
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it) => ({
        '@type': 'ListItem',
        position: it.position,
        name: it.name,
        item: it.item,
      })),
    } as const;
  }, [isDetailPage, sectionInfo, currentTitle, pathname]);

  // Prefer short labels on very small screens without shrinking font size
  const label = (key: string, shortKey: string) => labelFor(key, shortKey);
  const navLinks = [
    { href: `${prefix}/posts`, label: label('nav.posts', 'nav.posts_short') },
    { href: `${prefix}/notes`, label: label('nav.notes', 'nav.notes_short') },
    { href: `${prefix}/gallery`, label: label('nav.gallery', 'nav.gallery_short') },
    { href: `${prefix}/projects`, label: label('nav.projects', 'nav.projects_short') },
    { href: `${prefix}/about`, label: label('nav.about', 'nav.about_short') },
  ];

  return (
    <header
      className="text-center"
      style={{
        ...getHeaderStyles(),
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--color-paper)',
        transform: hideOnScroll ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Logo/Site Identity - only visible on non-home pages (deferred until mounted to avoid hydration mismatch) */}
      {mounted && !isHomePage && (
        <div className="mb-6" style={getLogoStyles()}>
          <Link 
            href={prefix || '/'} 
            className="inline-block text-lg font-medium transition-all duration-300 ease-out"
            aria-label={t('nav.backHome')}
            onClick={() => {
              sessionStorage.setItem('navigatedFromContent', 'true');
            }}
            style={{ 
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
              borderBottom: '1px solid',
              borderColor: 'var(--color-ink)',
              paddingBottom: '2px',
              color: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-ink)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'inherit';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            AnteLacus
          </Link>
        </div>
      )}

      {/* Utility dropdown anchored to header (button rendered in nav rows below) */}
      <UtilityDropdown
        open={utilityOpen}
        onClose={() => setUtilityOpen(false)}
        onOpenSearch={() => { setSearchOpen(true); setUtilityOpen(false); }}
        showToc={/^(\/posts|\/notes|\/projects)\//.test(pathNoLocale)}
      />

      <nav role="navigation" aria-label={t('nav.main')}>
        <div style={getNavContainerStyles()}>
          {isDetailPage ? (
            <div className="breadcrumb-bar" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="breadcrumb-inner" style={{ maxWidth: '90ch', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                <div className="breadcrumb-text" style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center' }}>
                  <span className="breadcrumb-prefix" style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                    <span className="breadcrumb-item"><Link href={prefix || '/'}>{t('nav.home')}</Link></span>
                    {sectionInfo && (
                      <>
                        <span className="breadcrumb-sep">›</span>
                        <span className="breadcrumb-item"><Link href={sectionInfo.href}>{sectionInfo.label}</Link></span>
                      </>
                    )}
                  </span>
                  {currentTitle && (
                    <>
                      <span className="breadcrumb-sep">›</span>
                      <span className="breadcrumb-current" style={{ flex: '1 1 auto', minWidth: 0, display: 'block' }}>
                        <span
                          className="breadcrumb-current-text"
                          title={currentTitle}
                          style={{
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            verticalAlign: 'bottom'
                          }}
                        >{currentTitle}</span>
                      </span>
                    </>
                  )}
                </div>
                <button
                  aria-label={t('nav.utility')}
                  aria-haspopup="menu"
                  aria-expanded={utilityOpen}
                  onClick={() => setUtilityOpen(v => !v)}
                  className="nav-utility-compact"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '38px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--color-paper)',
                    transition: 'all .3s cubic-bezier(0.4,0,0.2,1)',
                    marginLeft: '12px',
                    flex: '0 0 auto',
                    padding: (!hideOnScroll && !tocHintDismissed && /^(\/posts|\/notes|\/projects)\//.test(pathNoLocale)) ? '0 12px 0 10px' : '0',
                    width: (!hideOnScroll && !tocHintDismissed && /^(\/posts|\/notes|\/projects)\//.test(pathNoLocale)) ? 'auto' : '38px',
                    gap: (!hideOnScroll && !tocHintDismissed && /^(\/posts|\/notes|\/projects)\//.test(pathNoLocale)) ? '6px' : '0'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-wash-moss)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-paper)';
                  }}
                >
                  <img
                    src="/images/common/book-cover.svg"
                    alt={t('nav.utility')}
                    width={18}
                    height={18}
                    style={{
                      display: 'block',
                      border: 'none',
                      padding: '0',
                      borderRadius: '0'
                    }}
                  />
                  {(!hideOnScroll && !tocHintDismissed && /^(\/posts|\/notes|\/projects)\//.test(pathNoLocale)) && (
                    <span style={{ 
                      fontSize: '13px', 
                      color: 'var(--color-ink)',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      {t('nav.toc')}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <ul className="flex justify-center flex-nowrap gap-x-4 gap-y-0" style={{ alignItems: 'center', overflowX: 'visible' }}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm transition-all duration-300 ease-out"
                    style={{
                      color: isActive(link.href) ? 'var(--color-ink)' : 'inherit',
                      borderBottom: '1px solid',
                      borderColor: isActive(link.href) ? 'var(--color-ink)' : 'transparent',
                      paddingBottom: '2px',
                      transform: 'translateY(0)',
                    }}
                    onClick={() => {
                      if (isHomePage) {
                        sessionStorage.setItem('navigatedFromHome', 'true');
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(link.href)) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.borderColor = 'rgba(180, 42, 30, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(link.href)) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  aria-label={t('nav.utility')}
                  aria-haspopup="menu"
                  aria-expanded={utilityOpen}
                  onClick={() => setUtilityOpen(v => !v)}
                  className="nav-utility-compact"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'var(--color-paper)',
                    transition: 'all .3s cubic-bezier(0.4,0,0.2,1)',
                    marginLeft: '48px'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-wash-moss)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-paper)';
                  }}
                >
                  <img
                    src="/images/common/book-cover.svg"
                    alt={t('nav.utility')}
                    width={18}
                    height={18}
                    style={{
                      display: 'block',
                      border: 'none',
                      padding: '0',
                      borderRadius: '0'
                    }}
                  />
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }} />
      )}
      <SearchModal open={searchOpen} onClose={() => { setSearchOpen(false); setSearchPreset(undefined); }} preset={searchPreset} />
    </header>
  );
}
