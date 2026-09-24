import { useTranslations } from 'next-intl';

import EndMark from './EndMark';

// The home page's gate: the name, the mark, the motto — and nothing that moves.
export default function Gate() {
  const t = useTranslations('site');
  return (
    <header className="gate" data-gate>
      <h1 className="gate-name">
        {t('title')}
        <EndMark />
      </h1>
      <p className="gate-motto" lang="la">{t('motto')}</p>
    </header>
  );
}
