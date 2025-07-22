import Link from 'next/link';
import { NoteMeta } from '../lib/notes';

export default function NoteCard({ note }: { note: NoteMeta }) {
  if (note.type === 'tweet' && note.tweetId) {
    return (
      <div className="masonry-item" style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
        <a href={`https://x.com/i/web/status/${note.tweetId}`} target="_blank" rel="noopener noreferrer">
          查看原始推文 ↗
        </a>
      </div>
    );
  }
  return (
    <article className="card masonry-item" key={note.slug}>
      <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem' }}>
        <Link href={`/notes/${note.slug}`}>{note.title}</Link>
      </h2>
      <div style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{new Date(note.date).toLocaleDateString('zh-CN')}</div>
      {note.summary && <p style={{ margin: 0 }}>{note.summary}</p>}
    </article>
  );
} 