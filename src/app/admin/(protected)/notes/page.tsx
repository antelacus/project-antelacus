import Link from 'next/link';

import { locales } from '@/i18n/routing';
import { mapNoteRecordToNoteMeta } from '@/lib/note-types';
import { getAdminServiceRoleClient } from '@/lib/server/admin-auth';
import { getAdmin, listAdmin } from '@/lib/server/content-repo';
import { publishNoteAction, saveDraftNoteAction } from './actions';

type AdminNotesPageProps = {
  searchParams: Promise<{
    slug?: string;
    saved?: string;
    error?: string;
  }>;
};

function formatDateInput(value?: string): string {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 16) : value;
}

export default async function AdminNotesPage({ searchParams }: AdminNotesPageProps) {
  const params = await searchParams;
  const [rows, selectedNote] = await Promise.all([
    listAdmin(await getAdminServiceRoleClient('/admin/notes'), 'note'),
    params.slug ? getAdmin(await getAdminServiceRoleClient('/admin/notes'), 'note', params.slug) : Promise.resolve(null),
  ]);

  const notes = rows.map(mapNoteRecordToNoteMeta);

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>Batch 2</p>
          <h2 style={{ margin: '0.35rem 0 0' }}>Notes publishing workspace</h2>
        </div>
        <Link href="/admin/notes" style={{ borderBottom: 'none' }}>
          Start a new note
        </Link>
      </div>

      {params.saved && (
        <p
          role="status"
          style={{
            margin: 0,
            padding: '0.875rem 1rem',
            borderRadius: '10px',
            background: 'rgba(239, 241, 237, 0.95)',
          }}
        >
          Note saved as <strong>{params.saved}</strong>.
        </p>
      )}

      {params.error === 'validation' && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: '0.875rem 1rem',
            borderRadius: '10px',
            background: 'rgba(180, 42, 30, 0.08)',
            color: 'var(--color-seal)',
          }}
        >
          Please fill in the required note fields before saving.
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'minmax(0, 18rem) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <aside
          style={{
            border: '1px solid rgba(29, 29, 27, 0.14)',
            borderRadius: '12px',
            padding: '1rem',
            background: 'rgba(249, 248, 246, 0.96)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Existing notes</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
            {notes.map((note) => (
              <li key={note.slug}>
                <Link href={`/admin/notes?slug=${encodeURIComponent(note.slug)}`}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{note.title}</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(29, 29, 27, 0.65)' }}>
                    {note.date} · {note.lang ?? locales[0]}
                  </span>
                </Link>
              </li>
            ))}
            {notes.length === 0 && (
              <li style={{ color: 'rgba(29, 29, 27, 0.65)' }}>
                No note records in Supabase yet.
              </li>
            )}
          </ul>
        </aside>

        <form
          style={{
            display: 'grid',
            gap: '1rem',
            border: '1px solid rgba(29, 29, 27, 0.14)',
            borderRadius: '12px',
            padding: '1.5rem',
            background: 'rgba(249, 248, 246, 0.96)',
          }}
        >
          <input type="hidden" name="id" value={rows.find((row) => row.slug === params.slug)?.id ?? ''} />

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Title</span>
              <input name="title" defaultValue={selectedNote?.title ?? ''} required />
            </label>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Slug</span>
              <input name="slug" defaultValue={selectedNote?.slug ?? ''} required />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span>Summary</span>
            <textarea name="summary" defaultValue={selectedNote?.summary ?? ''} rows={3} />
          </label>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Language</span>
              <select name="lang" defaultValue={selectedNote?.lang ?? locales[0]}>
                {locales.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Display date</span>
              <input
                type="datetime-local"
                name="displayDate"
                defaultValue={formatDateInput(selectedNote?.date)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              <span>Cover URL</span>
              <input name="cover" defaultValue={selectedNote?.cover ?? ''} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span>Tags</span>
            <input
              name="tags"
              defaultValue={selectedNote?.tags?.join(', ') ?? ''}
              placeholder="tag-one, tag-two"
            />
          </label>

          <label style={{ display: 'grid', gap: '0.5rem' }}>
            <span>Markdown</span>
            <textarea
              name="content"
              defaultValue={selectedNote?.content ?? ''}
              rows={18}
              required
              style={{ fontFamily: 'var(--font-mono)', minHeight: '24rem' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="submit" formAction={saveDraftNoteAction}>
              Save draft
            </button>
            <button
              type="submit"
              formAction={publishNoteAction}
              style={{
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                borderRadius: '999px',
                padding: '0.75rem 1.1rem',
              }}
            >
              Publish now
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
