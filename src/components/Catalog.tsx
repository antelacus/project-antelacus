import type { Entry } from '@/lib/entry';
import CatalogRow from './CatalogRow';
import PageTransition from './PageTransition';

type Props = { title: string; entries: Entry[]; empty: string; showKind?: boolean };

// A list page: its title, then one row per piece (docs/aesthetic-thesis.md, 五「列表页」).
export default function Catalog({ title, entries, empty, showKind }: Props) {
  return (
    <PageTransition>
    <div className="page page-narrow">
      <h1 className="page-title">{title}</h1>
      {entries.length === 0 ? (
        <p className="page-empty">{empty}</p>
      ) : (
        <ul className="catalog">
          {entries.map((entry) => (
            <li key={`${entry.type}:${entry.slug}`}>
              <CatalogRow entry={entry} showKind={showKind} />
            </li>
          ))}
        </ul>
      )}
    </div>
    </PageTransition>
  );
}
