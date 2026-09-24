import { useTranslations } from 'next-intl';

import type { TocItem } from '@/lib/markdown';

// The contents of a long piece: one folded line after the opening, opened only by the reader. Fewer
// than three sections need no map (REQ §5.2).
export const TOC_MIN_ITEMS = 3;

export default function Toc({ items, lang }: { items: TocItem[]; lang: string }) {
  const t = useTranslations('article');
  if (items.length < TOC_MIN_ITEMS) return null;
  return (
    <details className="toc" data-toc>
      <summary>{t('toc')}</summary>
      <ol lang={lang}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </details>
  );
}
