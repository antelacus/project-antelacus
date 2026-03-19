import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/server/admin-auth';
import { hasConfiguredAdminEmails } from '@/lib/server/supabase-env';
import { hasSupabasePublicEnv } from '@/lib/supabase/public-env';
import { login } from './actions';

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  credentials: 'Login failed. Check the admin credentials configured in Supabase Auth.',
  validation: 'Enter a valid email address and password before continuing.',
  config: 'Admin auth is not fully configured yet.',
};

function getSafeNextPath(nextPath?: string): string {
  if (!nextPath || !nextPath.startsWith('/admin')) {
    return '/admin';
  }

  return nextPath;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  if (hasSupabasePublicEnv() && hasConfiguredAdminEmails()) {
    const session = await getAdminSession();
    if (session) {
      redirect('/admin');
    }
  }

  const nextPath = getSafeNextPath(params.next);
  const errorMessage = params.error ? errorMessages[params.error] ?? errorMessages.config : null;

  return (
    <main className="content-container content-container-standard">
      <section
        style={{
          maxWidth: '34rem',
          margin: '0 auto',
          border: '1px solid rgba(29, 29, 27, 0.16)',
          borderRadius: '12px',
          padding: '2rem',
          background: 'rgba(249, 248, 246, 0.96)',
        }}
      >
        <p style={{ marginBottom: '0.75rem', color: 'var(--color-seal)', fontSize: '0.95rem' }}>
          Private admin
        </p>
        <h1 style={{ marginTop: 0 }}>Sign in to manage dynamic content</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          This route is reserved for the site owner. Admin access is granted only to emails listed in
          `SUPABASE_ADMIN_EMAILS`.
        </p>

        {errorMessage && (
          <p
            role="alert"
            style={{
              marginBottom: '1rem',
              padding: '0.875rem 1rem',
              borderRadius: '10px',
              background: 'rgba(180, 42, 30, 0.08)',
              color: 'var(--color-seal)',
            }}
          >
            {errorMessage}
          </p>
        )}

        <form action={login} style={{ display: 'grid', gap: '1rem' }}>
          <input type="hidden" name="next" value={nextPath} />
          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              style={{
                border: '1px solid rgba(29, 29, 27, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 0.875rem',
                background: '#fff',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span>Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              style={{
                border: '1px solid rgba(29, 29, 27, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 0.875rem',
                background: '#fff',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '0.8rem 1.2rem',
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
