import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <section
      style={{
        display: 'grid',
        gap: '1rem',
      }}
    >
      <div
        style={{
          border: '1px solid rgba(29, 29, 27, 0.14)',
          borderRadius: '12px',
          padding: '1.5rem',
          background: 'rgba(249, 248, 246, 0.96)',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Batch 1 foundation is ready</h2>
        <p>
          Supabase client wiring, service-role boundaries, and protected `/admin` access are now in
          place. The next phase can add note CRUD forms and publish-time revalidation inside this
          workspace.
        </p>
      </div>

      <div
        style={{
          border: '1px solid rgba(29, 29, 27, 0.14)',
          borderRadius: '12px',
          padding: '1.5rem',
          background: 'rgba(239, 241, 237, 0.65)',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Next implementation targets</h2>
        <p style={{ marginBottom: '0.5rem' }}>Use this area for the first dynamic content type:</p>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>
            <Link href="/admin/notes">create and edit notes</Link>
          </li>
          <li>validation and persistence via Supabase</li>
          <li>publish flow with route/tag revalidation</li>
        </ul>
      </div>
    </section>
  );
}
