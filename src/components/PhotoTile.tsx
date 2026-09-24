import Image from 'next/image';

import type { Entry } from '@/lib/entry';
import EntryMeta from './EntryMeta';
import SiteLink from './SiteLink';

// One album in the photo grid: its cover, framed in a thin ink line, with the title and the meta line
// always below it — nothing waits for a hover.
export default function PhotoTile({ entry }: { entry: Entry }) {
  return (
    <article className="entry tile" data-photo-tile>
      <SiteLink href={entry.href} className="entry-link" lang={entry.lang}>
        {entry.cover && <Image className="tile-image" src={entry.cover} alt={entry.coverAlt ?? ''} width={800} height={600} sizes="(min-width: 48rem) 33vw, 100vw" />}
        <h2 className="entry-title" data-meta="title">{entry.title}</h2>
      </SiteLink>
      <EntryMeta entry={entry} />
    </article>
  );
}
