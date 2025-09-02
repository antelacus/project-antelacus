"use client";
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const isHomePage = pathname === '/';

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

  return (
    <header className="text-center" style={getHeaderStyles()}>
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

      <nav role="navigation" aria-label="主导航">
        <div style={getNavContainerStyles()}>
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
        </ul>
        </div>
      </nav>
    </header>
  );
}
