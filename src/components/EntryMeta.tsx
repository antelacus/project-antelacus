import { Fragment } from 'react';

import { isSupportedLocale, languageNames } from '@/i18n/routing';
import type { Entry } from '@/lib/entry';
import SiteLink from './SiteLink';

// The line under every entry: date, language, tags — always visible, never behind a hover.
export default function EntryMeta({ entry }: { entry: Pick<Entry, 'date' | 'lang' | 'tags'> }) {
  const day = entry.date.slice(0, 10);
  return (
    <p className="entry-meta">
      <time data-meta="date" dateTime={day}>{day}</time>
      <span aria-hidden="true"> · </span>
      <span data-meta="language" lang={entry.lang}>{isSupportedLocale(entry.lang) ? languageNames[entry.lang] : entry.lang}</span>
      {entry.tags.length > 0 && (
        <>
          <span aria-hidden="true"> · </span>
          <span data-meta="tags">
            {entry.tags.map((tag, i) => (
              <Fragment key={tag}>
                {i > 0 && ', '}
                <SiteLink href={`/tags/${encodeURIComponent(tag)}`}>{tag}</SiteLink>
              </Fragment>
            ))}
          </span>
        </>
      )}
    </p>
  );
}
