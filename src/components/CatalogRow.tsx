import { useTranslations } from 'next-intl';

import type { Entry } from '@/lib/entry';
import EntryMeta from './EntryMeta';
import SiteLink from './SiteLink';
import { KIND_MESSAGE } from './entry-kind';

type Props = {
  entry: Entry;
  /** Where types are mixed (a tag page, search results), each row says what it is. */
  showKind?: boolean;
  /** h2 under a page's h1; h3 inside a section that has its own h2. */
  headingLevel?: 2 | 3;
};

// One line of a catalogue: title, summary, date, language, tags. The title and each tag are separate
// links, never nested.
export default function CatalogRow({ entry, showKind = false, headingLevel = 2 }: Props) {
  const t = useTranslations('nav');
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="entry catalog-row" data-catalog-row>
      {showKind && <p className="entry-kind">{t(KIND_MESSAGE[entry.type])}</p>}
      <Heading className="entry-title" data-meta="title" lang={entry.lang}>
        <SiteLink href={entry.href} className="entry-link">{entry.title}</SiteLink>
      </Heading>
      {entry.summary && <p className="entry-summary" lang={entry.lang}>{entry.summary}</p>}
      <EntryMeta entry={entry} />
    </article>
  );
}
