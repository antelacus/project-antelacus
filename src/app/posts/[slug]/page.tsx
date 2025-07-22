import { getPostBySlug } from '../../../lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import type { Metadata, ResolvingMetadata } from 'next';
interface PageProps { params: { slug: string }; searchParams: { [key: string]: string | string[] | undefined } }

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: '文章未找到 | antelacus.com',
      description: '你访问的文章不存在或已被删除。',
    };
  }
  return {
    title: `${post.title} | antelacus.com`,
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

export default async function PostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return (
      <main style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>文章未找到</h1>
        <p>你访问的文章不存在或已被删除。</p>
        <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>返回首页</Link>
      </main>
    );
  }
  return (
    <main>
      <article className="card" style={{ marginTop: '2rem' }}>
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
      <div style={{ textAlign: 'center', margin: '2.5rem 0 0 0' }}>
        <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>← 返回首页</Link>
      </div>
    </main>
  );
} 