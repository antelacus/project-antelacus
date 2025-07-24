import { getNoteBySlug } from '../../../lib/notes';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return { title: '笔记未找到' };
  }
  return { title: note.title, description: note.summary || '' };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return (
      <main style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>笔记未找到</h1>
        <Link href="/notes" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>返回闪念</Link>
      </main>
    );
  }
  return (
    <main className="gallery-detail">
      <article className="card">
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{note.title}</h1>
        <div style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{note.date}</div>
        <div style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>
          <MDXRemote source={note.content} />
        </div>
      </article>
    </main>
  );
} 