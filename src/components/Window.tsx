import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { HomeWindow } from '@/lib/home';
import EntryMeta from './EntryMeta';
import SiteLink from './SiteLink';
import { KIND_MESSAGE } from './entry-kind';

// One window of the home page's framed view: the newest piece of one type. Only the photo window has an
// image (lib/home.ts guarantees it); it shares one link with the title, so the pair is one tab stop.
export default function Window({ window: w }: { window: HomeWindow }) {
  const t = useTranslations('nav');
  const title = <h2 className="entry-title" data-meta="title">{w.title}</h2>;
  return (
    <article className={`entry window${w.image ? ' window-photo' : ''}`} data-window>
      <p className="entry-kind">{t(KIND_MESSAGE[w.type])}</p>
      <SiteLink href={w.href} className="entry-link" lang={w.lang}>
        {w.image && <Image className="window-image" src={w.image} alt={w.imageAlt ?? ''} width={1200} height={1200} sizes="(min-width: 48rem) 55vw, 100vw" priority />}
        {title}
      </SiteLink>
      {w.summary && <p className="entry-summary" lang={w.lang}>{w.summary}</p>}
      <EntryMeta entry={w} />
    </article>
  );
}
