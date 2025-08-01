"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

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

  return (
    <header className="py-8 text-center">
      <nav role="navigation" aria-label="主导航">
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
      </nav>
    </header>
  );
}
