import { useTranslations } from 'next-intl';

import SiteLink from '@/components/SiteLink';

// A page that does not exist under a known language (an unknown slug, an about page with no published
// version): the opening of a scroll, and the way home.
export default function LocaleNotFound() {
  const t = useTranslations('status');
  return (
    <div className="page page-narrow">
      <div className="scroll-opening">
        <h1 className="scroll-title">{t('notFoundTitle')}</h1>
        <p className="scroll-lead">{t('notFoundBody')}</p>
        <p><SiteLink href="/">{t('home')}</SiteLink></p>
      </div>
    </div>
  );
}
