'use client';

// The admin's error page. A save that failed rolled back entirely; the editor keeps what was typed
// (its body is backed up in the tab), so "go back" is the way out.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="content-container content-container-standard">
      <div className="admin-card" style={{ display: 'grid', gap: '0.75rem' }}>
        <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>Admin</p>
        <h1 style={{ margin: 0 }}>That did not go through</h1>
        <p style={{ margin: 0 }}>Nothing was saved. Go back to the editor — your text is still there — and try again.</p>
        {error.digest && <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>Reference: {error.digest}</p>}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="admin-button" onClick={() => history.back()}>Go back</button>
          <button type="button" className="admin-button" onClick={reset}>Try again</button>
        </div>
      </div>
    </main>
  );
}
