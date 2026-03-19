import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { hasConfiguredAdminEmails, hasSupabaseServiceRoleEnv } from '@/lib/server/supabase-env';
import { hasSupabasePublicEnv } from '@/lib/supabase/public-env';

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (hasSupabasePublicEnv() && hasConfiguredAdminEmails() && hasSupabaseServiceRoleEnv()) {
    return children;
  }

  return (
    <main className="content-container content-container-standard">
      <section
        style={{
          border: '1px solid rgba(29, 29, 27, 0.16)',
          borderRadius: '12px',
          padding: '2rem',
          background: 'rgba(249, 248, 246, 0.96)',
        }}
      >
        <p style={{ marginBottom: '0.75rem', color: 'var(--color-seal)', fontSize: '0.95rem' }}>
          Admin setup required
        </p>
        <h1 style={{ marginTop: 0 }}>Configure Supabase before using `/admin`</h1>
        <p>
          Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ADMIN_EMAILS`
          to your local environment.
        </p>
      </section>
    </main>
  );
}
