'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { fromSearchItem, type Entry, type SearchIndexItem } from '@/lib/entry';
import { searchEntries } from '@/lib/search-filter';
import CatalogRow from './CatalogRow';

type Load = 'idle' | 'loading' | 'ready' | 'failed';

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keys the native modal gets wrong. Esc closes from anywhere inside — in a filled search field the browser
// would spend it on clearing the text. Tab past the last control comes back to the first, and Shift+Tab
// the other way (WAI-ARIA modal dialog pattern); a native modal lets focus leave for the browser's own
// interface.
function dialogKeys(event: React.KeyboardEvent<HTMLDialogElement>) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.currentTarget.close();
    return;
  }
  if (event.key !== 'Tab') return;
  const tabbable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => el.getClientRects().length > 0);
  const first = tabbable[0];
  const last = tabbable[tabbable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// Search as a native modal dialog: the browser makes the page behind it inert, moves focus in and closes
// it on Esc. What the browser does not do is done here: keys (dialogKeys); the index is fetched once,
// on first open; a status line announces loading, the count and failure (a dialog does not announce
// text that appears later); and focus goes back to the button that opened it — saved by hand, because
// Safari does not focus a button when it is clicked. Choosing a result navigates, and focus goes with it.
export default function SearchDialog() {
  const t = useTranslations('search');
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const leaving = useRef(false);
  const [load, setLoad] = useState<Load>('idle');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState('');

  const fetchIndex = async () => {
    setLoad('loading');
    try {
      const res = await fetch('/api/search-index');
      if (!res.ok) throw new Error(String(res.status));
      setEntries(((await res.json()) as SearchIndexItem[]).map(fromSearchItem));
      setLoad('ready');
      // A retry that succeeds removes its own button; focus moves on to the field instead of the page.
      if (document.activeElement?.hasAttribute('data-search-retry')) input.current?.focus();
    } catch {
      setLoad('failed');
    }
  };

  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    trigger.current = event.currentTarget;
    leaving.current = false;
    dialog.current?.showModal();
    input.current?.focus();
    if (load === 'idle' || load === 'failed') void fetchIndex();
  };

  const results = load === 'ready' ? searchEntries(entries, query) : [];
  const status =
    load === 'loading' ? t('loading')
    : load === 'failed' ? t('failed')
    : load === 'ready' ? (results.length ? t('results', { count: results.length }) : t('noResults'))
    : '';

  return (
    <>
      <button type="button" className="nav-button" data-open-search onClick={open}>
        {t('search')}
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-labelledby="search-title"
        onKeyDown={dialogKeys}
        onClose={() => {
          if (!leaving.current) trigger.current?.focus();
        }}
        // Only a click on the backdrop lands on the <dialog> itself; the panel covers the rest of it.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="search-panel">
          <div className="search-head">
            <h2 id="search-title">{t('search')}</h2>
            <button type="button" className="nav-button" onClick={() => dialog.current?.close()}>
              {t('close')}
            </button>
          </div>
          <label className="search-label" htmlFor="search-field">{t('label')}</label>
          <input
            ref={input}
            id="search-field"
            className="search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <p className="search-status" role="status">
            {status}
          </p>
          {load === 'failed' && (
            <button type="button" className="nav-button" data-search-retry onClick={() => void fetchIndex()}>
              {t('retry')}
            </button>
          )}
          {results.length > 0 && (
            <ul
              className="catalog"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) {
                  leaving.current = true;
                  dialog.current?.close();
                }
              }}
            >
              {results.map((entry) => (
                <li key={`${entry.type}:${entry.slug}`}>
                  <CatalogRow entry={entry} showKind headingLevel={3} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
