import { getAllNotesMeta } from '../../lib/notes';
import Link from 'next/link';

export const metadata = {
  title: '灵光一闪',
  description: '短内容与同步 X 帖子合集。',
};

export default async function NotesPage() {
  const notes = await getAllNotesMeta();
  return (
    <main>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.2rem' }}>灵光一闪</h1>
      {notes.length === 0 && <p>暂无内容。</p>}
      {notes.map(note => (
        <article className="card" key={note.slug} style={{ marginBottom: '1rem' }}>
          {note.type === 'tweet' && note.tweetId ? (
            <a href={`https://x.com/i/web/status/${note.tweetId}`} target="_blank" rel="noopener noreferrer">
              查看原始推文
            </a>
          ) : (
            <>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
                <Link href={`/notes/${note.slug}`}>{note.title}</Link>
              </h2>
              <div style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '0.6rem' }}>{new Date(note.date).toLocaleDateString('zh-CN')}</div>
              {note.summary && <p style={{ margin: 0 }}>{note.summary}</p>}
            </>
          )}
        </article>
      ))}
    </main>
  );
} 