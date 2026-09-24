import { useTranslations } from 'next-intl';

import EndMark from './EndMark';

// The motto is Latin in every language (its gloss is on the about page), so it is not a message to translate.
const MOTTO = 'Ante Lacus, Pax Mentis';

// The home page's gate: the name, then the motto closed by the mark — and nothing that moves.
export default function Gate() {
  const t = useTranslations('site');
  return (
    <header className="gate" data-gate>
      <h1 className="gate-name">{t('title')}</h1>
      <p className="gate-motto">
        <span lang="la">{MOTTO}</span>
        <EndMark />
      </p>
    </header>
  );
}
