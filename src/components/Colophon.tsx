import { Fragment } from 'react';
import { useTranslations } from 'next-intl';

import { isSupportedLocale, languageNames } from '@/i18n/routing';
import { PAGE_IDS } from '@/lib/page-ids';
import ContentsLink from './ContentsLink';
import EndMark from './EndMark';
import SiteLink from './SiteLink';

export type ColophonProps = {
  date?: string;
  tags?: string[];
  lang?: string;
  links?: { label: string; url: string }[];
  /** The piece has a folded contents list to return to. */
  hasContents?: boolean;
};

// The tail of the scroll: when it was written, its tags, its language — gathered here, not scattered
// around the text — then the way back up (the navigation stays at the top of the page, it does not
// follow the reader) and, at the end of that line, the author's mark.
export default function Colophon({ date, tags = [], lang, links = [], hasContents = false }: ColophonProps) {
  const t = useTranslations('article');
  const day = date?.slice(0, 10);
  return (
    <footer className="colophon" data-colophon>
      {day && (
        <p data-meta="written">
          <span className="colophon-label">{t('written')}</span> <time dateTime={day}>{day}</time>
        </p>
      )}
      {tags.length > 0 && (
        <p data-meta="tags">
          <span className="colophon-label">{t('tags')}</span>{' '}
          {tags.map((tag, i) => (
            <Fragment key={tag}>
              {i > 0 && ', '}
              <SiteLink href={`/tags/${encodeURIComponent(tag)}`}>{tag}</SiteLink>
            </Fragment>
          ))}
        </p>
      )}
      {lang && (
        <p data-meta="language">
          <span className="colophon-label">{t('language')}</span>{' '}
          <span lang={lang}>{isSupportedLocale(lang) ? languageNames[lang] : lang}</span>
        </p>
      )}
      {links.length > 0 && (
        <p data-meta="links">
          <span className="colophon-label">{t('links')}</span>{' '}
          {links.map((link, i) => (
            <Fragment key={link.url}>
              {i > 0 && ', '}
              <a href={link.url} rel="noopener noreferrer">{link.label}</a>
            </Fragment>
          ))}
        </p>
      )}
      <p className="colophon-return" data-meta="return">
        <a href={`#${PAGE_IDS.nav}`}>{t('backToTop')}</a>
        {hasContents && (
          <>
            <span aria-hidden="true"> · </span>
            <ContentsLink>{t('toc')}</ContentsLink>
          </>
        )}
        <EndMark />
      </p>
    </footer>
  );
}
