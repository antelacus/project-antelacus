'use client';

import { useTranslations } from 'next-intl';

import SiteLink from '@/components/SiteLink';

// What a visitor sees when a page throws (the database unreachable, a render failing): the site's own
// words, never the error. Next renders this boundary on the client, inside the locale layout.
export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('status');
  return (
    <div className="page page-narrow">
      <div className="scroll-opening">
        <h1 className="scroll-title">{t('errorTitle')}</h1>
        <p className="scroll-lead">{t('errorBody')}</p>
        <p className="status-actions">
          <button type="button" className="nav-button status-retry" onClick={reset}>{t('retry')}</button>
          <SiteLink href="/">{t('home')}</SiteLink>
        </p>
      </div>
    </div>
  );
}
