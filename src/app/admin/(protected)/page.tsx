import Link from 'next/link';

import { CONTENT_TYPE_KEYS, CONTENT_TYPES } from '@/lib/content-types';
import { getAdminServiceRoleClient } from '@/lib/server/admin-auth';
import { listAdminSummaries } from '@/lib/server/content-repo';

export default async function AdminDashboardPage() {
  const client = await getAdminServiceRoleClient('/admin');
  const counts = await Promise.all(CONTENT_TYPE_KEYS.map(async (type) => {
    const rows = await listAdminSummaries(client, type);
    return { type, total: rows.length, published: rows.filter((row) => row.status === 'published').length };
  }));

  return (
    <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
      {counts.map(({ type, total, published }) => (
        <Link key={type} href={`/admin/content/${type}`} className="admin-card" style={{ borderBottom: 'none', display: 'block' }}>
          <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>{CONTENT_TYPES[type].section}</p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{published} published</h2>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.7 }}>{total - published} draft{total - published === 1 ? '' : 's'}</p>
        </Link>
      ))}
    </section>
  );
}
