import Link from 'next/link';
import { notFound } from 'next/navigation';

import { locales } from '@/i18n/routing';
import { PAGE_SLUGS } from '@/lib/pages';
import { getAdminServiceRoleClient } from '@/lib/server/admin-auth';
import { listPageVersions } from '@/lib/server/pages-repo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: `/${(await params).slug} · Admin` };
}

// One row per site language, written or not: a language without a version is where a new one starts.
export default async function AdminPageLanguagesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(PAGE_SLUGS as readonly string[]).includes(slug)) notFound();

  const versions = await listPageVersions(await getAdminServiceRoleClient(`/admin/pages/${slug}`), slug);
  const byLocale = new Map(versions.map((v) => [v.locale, v]));

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>pages</p>
        <h2 style={{ margin: '0.35rem 0 0' }}>/{slug}</h2>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
        {locales.map((locale) => {
          const version = byLocale.get(locale);
          return (
            <li key={locale} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <Link href={`/admin/pages/${slug}/${locale}`} style={{ borderBottom: 'none' }}>
                <span lang={version ? locale : undefined} style={{ display: 'block', fontWeight: 600 }}>{version?.title ?? 'Not written'}</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{locale}</span>
              </Link>
              <span style={{ fontSize: '0.85rem', color: version?.status === 'published' ? 'var(--color-ink)' : 'var(--color-seal)' }}>
                {version ? `${version.status} · ${version.updated_at.slice(0, 10)}` : 'falls back'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
