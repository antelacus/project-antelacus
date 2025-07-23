import { getPostBySlug } from '../../../lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: '文章未找到',
      description: '你访问的文章不存在或已被删除。',
    };
  }
  return {
    title: post.title,
    description: post.summary || '',
    openGraph: {
      title: post.title,
      description: post.summary || '',
      type: 'article',
      url: `https://antelacus.com/posts/${post.slug}`,
      images: post.cover ? [post.cover] : [],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return (
      <main style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>文章未找到</h1>
        <p>你访问的文章不存在或已被删除。</p>
        <Link href="/posts" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>返回专栏</Link>
      </main>
    );
  }
  return (
    <main className="gallery-detail">
      <div className="gallery-header">
        <div className="gallery-breadcrumb">
          <Link href="/posts" className="breadcrumb-link">专栏</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{post.title}</span>
        </div>
      </div>
      <article className="card" style={{ marginTop: '0' }}>
        {post.cover && (
          <img src={post.cover} alt={post.title} style={{ width: '100%', borderRadius: '6px', marginBottom: '1.2rem', maxHeight: 320, objectFit: 'cover' }} />
        )}
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{post.title}</h1>
        <div style={{ color: 'var(--color-secondary)', fontSize: '1em', marginBottom: '0.7em' }}>{new Date(post.date).toLocaleDateString('zh-CN')}</div>
        <div style={{ marginBottom: '1.2em' }}>
          {post.tags && post.tags.map(tag => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>
        <div style={{ color: 'var(--color-text)', lineHeight: 1.8 }}>
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  );
} 