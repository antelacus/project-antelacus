import type { ReactNode } from 'react';

import { requireAdminUser } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminUser('/admin');

  return (
    <main className="content-container content-container-standard">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(29, 29, 27, 0.12)',
        }}
      >
        <div>
          <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>Admin workspace</p>
          <h1 style={{ marginTop: '0.25rem', marginBottom: 0 }}>Dynamic content control room</h1>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{session.email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              style={{
                marginTop: '0.5rem',
                border: '1px solid rgba(29, 29, 27, 0.18)',
                borderRadius: '999px',
                padding: '0.45rem 0.85rem',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {children}
    </main>
  );
}
