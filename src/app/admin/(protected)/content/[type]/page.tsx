import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CONTENT_TYPES } from '@/lib/content-types';
import { getAdminServiceRoleClient } from '@/lib/server/admin-auth';
import { listAdminSummaries } from '@/lib/server/content-repo';
import { contentTypeSchema } from '@/lib/server/database.types';

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  return { title: `${(await params).type}s · Admin` };
}

export default async function AdminContentListPage({ params }: { params: Promise<{ type: string }> }) {
  const type = contentTypeSchema.safeParse((await params).type);
  if (!type.success) notFound();

  const rows = await listAdminSummaries(await getAdminServiceRoleClient(`/admin/content/${type.data}`), type.data);

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>{CONTENT_TYPES[type.data].section}</p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{rows.length} {type.data}{rows.length === 1 ? '' : 's'}</h2>
        </div>
        <Link href={`/admin/content/${type.data}/new`} className="admin-button admin-button-primary">New {type.data}</Link>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
        {rows.map((row) => (
          <li key={row.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Link href={`/admin/content/${type.data}/${encodeURIComponent(row.slug)}`} style={{ borderBottom: 'none' }}>
              <span lang={row.locale} style={{ display: 'block', fontWeight: 600 }}>{row.title}</span>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>/{row.slug} · {row.locale}</span>
            </Link>
            <span style={{ fontSize: '0.85rem', color: row.status === 'published' ? 'var(--color-ink)' : 'var(--color-seal)' }}>
              {row.status} · {row.updated_at.slice(0, 10)}
            </span>
          </li>
        ))}
        {rows.length === 0 && <li style={{ opacity: 0.7 }}>Nothing here yet.</li>}
      </ul>
    </section>
  );
}
