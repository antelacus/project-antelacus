import { getAllPostsMeta } from '../lib/posts';
import { getAllNotesMeta } from '../lib/notes';
import { getAllPhotosMeta } from '../lib/gallery';
import Link from 'next/link';

export default async function HomePage() {
  const [posts, notes, photos] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
  ]);

  // unify
  const feed = [
    ...posts.map(p => ({
      type: 'post' as const,
      date: p.date,
      component: (
        <article className="card masonry-item" key={`post-${p.slug}`}>
          {p.cover && (
            <img src={p.cover} alt={p.title} style={{ width: '100%', borderRadius: '6px', marginBottom: '0.8rem', objectFit: 'cover' }} />
          )}
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
            <Link href={`/posts/${p.slug}`}>{p.title}</Link>
          </h2>
          <div style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{new Date(p.date).toLocaleDateString('zh-CN')}</div>
          {p.summary && <p style={{ margin: 0 }}>{p.summary}</p>}
        </article>
      ),
    })),
    ...notes.map(n => ({
      type: 'note' as const,
      date: n.date,
      component: (
        <article className="card masonry-item" key={`note-${n.slug}`}>
          <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem' }}>
            <Link href={`/notes/${n.slug}`}>{n.title}</Link>
          </h2>
          <div style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{new Date(n.date).toLocaleDateString('zh-CN')}</div>
          {n.summary && <p style={{ margin: 0 }}>{n.summary}</p>}
        </article>
      ),
    })),
    ...photos.map(photo => ({
      type: 'photo' as const,
      date: photo.date,
      component: (
        <div className="masonry-item" key={`photo-${photo.slug}`} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
          <a href={photo.sourceUrl || photo.image} target="_blank" rel="noopener noreferrer">
            <img src={photo.image} alt={photo.caption || ''} style={{ width: '100%', borderRadius: '6px', objectFit: 'cover' }} />
          </a>
          {photo.caption && <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>{photo.caption}</p>}
        </div>
      ),
    })),
  ];

  feed.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>欢迎来到 AnteLacus</h1>
      </section>
      <div className="masonry">
        {feed.map(item => item.component)}
      </div>
    </main>
  );
}
