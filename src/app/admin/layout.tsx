import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import SiteDocument from '@/components/SiteDocument';
import { hasSupabasePublicEnv } from '@/lib/supabase/public-env';
import { siteMetadata, siteViewport } from '../site-metadata';

// A root layout: a title template only reaches child segments, so the default is spelled out in full.
export const metadata: Metadata = {
  ...siteMetadata,
  title: { default: 'Admin | AnteLacus', template: '%s | AnteLacus' },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = siteViewport;

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Without the service-role key (staging) the admin still opens and reads; saves say so (admin-auth.ts).
  const configured = hasSupabasePublicEnv();
  return <SiteDocument lang="en">{configured ? children : <SetupRequired />}</SiteDocument>;
}

function SetupRequired() {
  return (
    <div className="content-container content-container-standard">
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
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to your local environment, and `SUPABASE_SERVICE_ROLE_KEY` to save.
        </p>
      </section>
    </div>
  );
}
