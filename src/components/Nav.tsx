"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchModal from './SearchModal';
import UtilityDropdown from './UtilityDropdown';
import { useEffect, useMemo, useState } from 'react';

export default function Nav() {
  const pathname = usePathname();
  const [animationState, setAnimationState] = useState<'idle' | 'nav-prep' | 'nav-moving' | 'logo-appearing' | 'complete'>('idle');
  const [isFromHomepage, setIsFromHomepage] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navLinks = [
    { href: "/posts", label: "专栏" },
    { href: "/notes", label: "闪念" },
    { href: "/gallery", label: "视觉" },
    { href: "/projects", label: "实验室" },
    { href: "/about", label: "关于" },
  ];
  const [searchOpen, setSearchOpen] = useState(false);
  const [utilityOpen, setUtilityOpen] = useState(false);
  const [hideOnScroll, setHideOnScroll] = useState(false);

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const isHomePage = pathname === '/';
  const isDetailPage = useMemo(() => {
    // /posts/[slug], /notes/[slug], /gallery/[slug], /projects/[slug]
    return /^(\/posts|\/notes|\/gallery|\/projects)\/[A-Za-z0-9-_]+$/.test(pathname);
  }, [pathname]);

  const sectionInfo = useMemo(() => {
    // Determine top-level section and its Chinese label
    const m = pathname.match(/^\/(posts|notes|gallery|projects)(?:\/|$)/);
    const key = m ? m[1] : undefined;
    const labelMap: Record<string, { label: string; href: string }> = {
      posts: { label: '专栏', href: '/posts' },
      notes: { label: '闪念', href: '/notes' },
      gallery: { label: '视觉', href: '/gallery' },
      projects: { label: '实验室', href: '/projects' },
    };
    return key ? labelMap[key] : undefined;
  }, [pathname]);

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

  // Close the utility dropdown on route change
  useEffect(() => {
    setUtilityOpen(false);
  }, [pathname]);

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
      { position: 1, name: '首页', item: 'https://antelacus.com/' },
      { position: 2, name: sectionInfo.label, item: `https://antelacus.com${sectionInfo.href}` },
      { position: 3, name: currentTitle, item: `https://antelacus.com${pathname}` },
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
            href="/" 
            className="inline-block text-lg font-medium transition-all duration-300 ease-out"
            aria-label="返回首页"
            onClick={() => {
              sessionStorage.setItem('navigatedFromContent', 'true');
            }}
            style={{ 
              fontFamily: 'var(--font-cormorant-garamond)',
              letterSpacing: '0.02em',
              borderBottom: '1px solid',
              borderColor: 'var(--color-seal)',
              paddingBottom: '2px',
              color: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-seal)';
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
        showToc={/^(\/posts|\/notes|\/projects)\//.test(pathname)}
      />

      <nav role="navigation" aria-label="主导航">
        <div style={getNavContainerStyles()}>
          {isDetailPage ? (
            <div className="breadcrumb-bar" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="breadcrumb-inner" style={{ maxWidth: '90ch', padding: '0 1rem', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                <span className="breadcrumb-item"><Link href="/">首页</Link></span>
                {sectionInfo && (
                  <>
                    <span className="breadcrumb-sep">›</span>
                    <span className="breadcrumb-item"><Link href={sectionInfo.href}>{sectionInfo.label}</Link></span>
                  </>
                )}
                {currentTitle && (
                  <>
                    <span className="breadcrumb-sep">›</span>
                    <span className="breadcrumb-current" title={currentTitle}>{currentTitle}</span>
                  </>
                )}
                <button
                  aria-label="功能"
                  aria-haspopup="menu"
                  aria-expanded={utilityOpen}
                  onClick={() => setUtilityOpen(v => !v)}
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
                    alt="功能"
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
              </div>
            </div>
          ) : (
            <ul className="flex justify-center flex-wrap gap-x-6 gap-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm transition-all duration-300 ease-out"
                    style={{
                      color: isActive(link.href) ? 'var(--color-seal)' : 'inherit',
                      borderBottom: '1px solid',
                      borderColor: isActive(link.href) ? 'var(--color-seal)' : 'transparent',
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
                  aria-label="功能"
                  aria-haspopup="menu"
                  aria-expanded={utilityOpen}
                  onClick={() => setUtilityOpen(v => !v)}
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
                    alt="功能"
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
