import Image from 'next/image';
import type { ReactNode } from 'react';

import { renderMarkdownWithToc } from '@/lib/markdown';
import Colophon, { type ColophonProps } from './Colophon';
import PageTransition from './PageTransition';
import Toc, { TOC_MIN_ITEMS } from './Toc';

type Props = {
  title: string;
  /** The piece's own language: the body and the opening are read in it, whatever the URL says. */
  lang: string;
  body: string;
  /** In the opening: only the date (is this still current?), never the rest of the metadata. */
  date?: string;
  lead?: string;
  cover?: string;
  /** Between the body and the tail, e.g. an album's photos. */
  after?: ReactNode;
  colophon: ColophonProps;
};

// A piece as a handscroll (docs/aesthetic-thesis.md, 二「手卷」): the opening, a folded contents line for a
// long piece, the body undisturbed, and the tail. Everything is present at once and nothing moves.
export default function Article({ title, lang, body, date, lead, cover, after, colophon }: Props) {
  const day = date?.slice(0, 10);
  const { content, toc: contents } = renderMarkdownWithToc(body);
  return (
    <PageTransition>
    <article className="scroll" data-title={title}>
      <header className="scroll-opening" lang={lang}>
        {day && <time className="scroll-date" dateTime={day}>{day}</time>}
        <h1 className="scroll-title">{title}</h1>
        {lead && <p className="scroll-lead">{lead}</p>}
        {cover && <Image className="scroll-cover" src={cover} alt="" width={1600} height={900} sizes="(min-width: 52rem) 48rem, 100vw" priority />}
      </header>
      <Toc items={contents} lang={lang} />
      {body.trim() && (
        <div className="prose scroll-body" lang={lang} data-content>
          {content}
        </div>
      )}
      {after}
      <Colophon {...colophon} hasContents={contents.length >= TOC_MIN_ITEMS} />
    </article>
    </PageTransition>
  );
}
