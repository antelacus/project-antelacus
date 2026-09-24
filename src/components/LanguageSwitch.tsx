'use client';

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { languageNames, locales } from '@/i18n/routing';

// A disclosure of plain links. Each goes through /api/locale, which records the choice and redirects to
// this same page in the chosen language — the path's own language segment swapped, so the redirect
// never lands back on the language just left. Public pages carry no meaningful query, so none is kept.
export default function LanguageSwitch() {
  const t = useTranslations('utility');
  const current = useLocale();
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.split('/').slice(2).join('/');
  const target = (locale: string) => `/api/locale?to=${locale}&next=${encodeURIComponent(`/${locale}${rest ? `/${rest}` : ''}`)}`;

  return (
    <details className="language-switch" data-language-switch>
      <summary className="nav-button">{t('language')}</summary>
      <ul>
        {locales.map((locale) => (
          <li key={locale}>
            <a href={target(locale)} hrefLang={locale} lang={locale} aria-current={locale === current ? 'true' : undefined}>
              {languageNames[locale]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
