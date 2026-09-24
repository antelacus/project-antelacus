import { useTranslations } from 'next-intl';

import LanguageSwitch from './LanguageSwitch';
import NavLinks from './NavLinks';
import SearchDialog from './SearchDialog';
import { PAGE_IDS } from '@/lib/page-ids';

// The head of every public page: the sections, search and the language menu. Still and in the flow of
// the page — it scrolls away with it, never fixed, never hiding itself (docs/aesthetic-thesis.md, 五).
export default function Nav() {
  const t = useTranslations('nav');
  return (
    <nav id={PAGE_IDS.nav} className="site-nav" aria-label={t('main')} data-site-nav>
      <div className="site-nav-bar">
        <NavLinks />
        <div className="site-nav-tools">
          <SearchDialog />
          <LanguageSwitch />
        </div>
      </div>
    </nav>
  );
}
