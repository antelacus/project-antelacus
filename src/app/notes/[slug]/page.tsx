import { getNoteBySlug } from '../../../lib/notes';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return { title: '笔记未找到 | antelacus.com' };
  }
  return { title: `${note.title} | antelacus.com`, description: note.summary || '' };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return (
      <main style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>笔记未找到</h1>
        <Link href="/notes" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>返回列表</Link>
      </main>
    );
  }
  return (
    <main>
      <article className="card" style={{ marginTop: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{note.title}</h1>
        <div style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{new Date(note.date).toLocaleDateString('zh-CN')}</div>
        <div style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>
          <MDXRemote source={note.content} />
        </div>
      </article>
      <div style={{ textAlign: 'center', margin: '2rem 0 0 0' }}>
        <Link href="/notes" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>← 返回列表</Link>
      </div>
    </main>
  );
} 