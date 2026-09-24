'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { fromSearchItem, type Entry, type SearchIndexItem } from '@/lib/entry';
import { PAGE_IDS } from '@/lib/page-ids';
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
  // Where focus goes when the dialog closes: back to its button, to this page's <main> (a result on this
  // very page), or nowhere yet (a result elsewhere: the navigation effect takes it to the new page).
  const after = useRef<'trigger' | 'main' | 'navigation'>('trigger');
  const [load, setLoad] = useState<Load>('idle');
  // Once a load has failed, Retry stays mounted through the next attempt: removing a focused button
  // drops focus onto the page.
  const [failedBefore, setFailedBefore] = useState(false);
  const pathname = usePathname();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState('');

  const fetchIndex = async () => {
    if (load === 'loading') return;
    setLoad('loading');
    try {
      const res = await fetch('/api/search-index');
      if (!res.ok) throw new Error(String(res.status));
      setEntries(((await res.json()) as SearchIndexItem[]).map(fromSearchItem));
      // A retry that succeeds removes its own button; focus moves on to the field, not the page.
      if (document.activeElement?.hasAttribute('data-search-retry')) input.current?.focus();
      setFailedBefore(false);
      setLoad('ready');
    } catch {
      setFailedBefore(true);
      setLoad('failed');
    }
  };

  // Choosing a result navigates; the dialog stays in the layout, so focus is taken to the new page.
  useEffect(() => {
    if (after.current !== 'navigation') return;
    after.current = 'trigger';
    document.getElementById(PAGE_IDS.main)?.focus();
  }, [pathname]);

  // `from` is where focus returns on close: the button, or whatever the reader was on when they pressed
  // the shortcut (nothing, mid-page) — never the button at the top of a page they were reading.
  const open = (from: HTMLElement | null) => {
    trigger.current = from;
    after.current = 'trigger';
    dialog.current?.showModal();
    input.current?.focus();
    if (load === 'idle' || load === 'failed') void fetchIndex();
  };

  // ⌘K / Ctrl+K opens search from anywhere on the page: the navigation stays at the top and does not
  // follow the reader. A modifier, not a bare character (WCAG 2.1.4). Re-subscribed on each render so the
  // handler sees the current load state.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (dialog.current?.open) return;
      event.preventDefault();
      const active = document.activeElement;
      open(active instanceof HTMLElement && active !== document.body ? active : null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const results = load === 'ready' ? searchEntries(entries, query) : [];
  const status =
    load === 'loading' ? t('loading')
    : load === 'failed' ? t('failed')
    : load === 'ready' ? (results.length ? t('results', { count: results.length }) : t('noResults'))
    : '';

  return (
    <>
      <button type="button" className="nav-button" data-open-search aria-keyshortcuts="Meta+K Control+K" onClick={(event) => open(event.currentTarget)}>
        {t('search')}
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-labelledby={PAGE_IDS.searchTitle}
        onKeyDown={dialogKeys}
        // The close event arrives after close() returns, so this is the one place focus is decided.
        onClose={() => {
          if (after.current === 'trigger') trigger.current?.focus();
          if (after.current === 'main') {
            after.current = 'trigger';
            document.getElementById(PAGE_IDS.main)?.focus();
          }
        }}
        // Only a click on the backdrop lands on the <dialog> itself; the panel covers the rest of it.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="search-panel">
          <div className="search-head">
            <h2 id={PAGE_IDS.searchTitle}>{t('search')}</h2>
            <button type="button" className="nav-button" onClick={() => dialog.current?.close()}>
              {t('close')}
            </button>
          </div>
          <label className="search-label" htmlFor={PAGE_IDS.searchField}>{t('label')}</label>
          <input
            ref={input}
            id={PAGE_IDS.searchField}
            className="search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <p className="search-status" role="status">
            {status}
          </p>
          {(load === 'failed' || (load === 'loading' && failedBefore)) && (
            <button type="button" className="nav-button" data-search-retry aria-disabled={load === 'loading'} onClick={() => void fetchIndex()}>
              {t('retry')}
            </button>
          )}
          {results.length > 0 && (
            <ul
              className="catalog"
              onClick={(event) => {
                const link = (event.target as HTMLElement).closest('a');
                if (!link) return;
                // A result on this very page causes no navigation to wait for.
                after.current = new URL(link.href).pathname === window.location.pathname ? 'main' : 'navigation';
                dialog.current?.close();
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
