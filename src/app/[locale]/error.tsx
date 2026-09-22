'use client';

// What a visitor sees when a page throws (the database unreachable, a render failing): the site's own
// words, never the error. Next renders this boundary on the client, inside the locale layout.
export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="content-container content-container-standard" style={{ textAlign: 'center', marginTop: '6rem' }}>
      <h1>Something went wrong</h1>
      <p>This page could not be shown right now. It is not you; please try again in a moment.</p>
      <button type="button" onClick={reset} style={{ marginTop: '1rem', font: 'inherit', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
        Try again
      </button>
    </div>
  );
}
