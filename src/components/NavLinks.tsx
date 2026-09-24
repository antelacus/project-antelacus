'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import SiteLink from './SiteLink';

const SECTIONS = ['posts', 'notes', 'gallery', 'projects', 'about'] as const;

// The section links, with the current one marked for assistive technology and by its underline. The
// site's name leads back home everywhere except home itself, where the gate already names it.
export default function NavLinks() {
  const t = useTranslations();
  const pathname = usePathname() ?? '';
  const section = pathname.split('/')[2] ?? '';
  return (
    <ul className="site-nav-links">
      {section !== '' && (
        <li>
          <SiteLink href="/" className="site-nav-home">{t('site.title')}</SiteLink>
        </li>
      )}
      {SECTIONS.map((name) => (
        <li key={name}>
          <SiteLink href={`/${name}`} aria-current={section === name ? 'page' : undefined}>
            {t(`nav.${name}`)}
          </SiteLink>
        </li>
      ))}
    </ul>
  );
}
