import { getAllPostsMeta } from '../lib/posts';
import Link from 'next/link';

export default async function HomePage() {
  const posts = await getAllPostsMeta();
  return (
    <main>
      <section style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>欢迎来到 antelacus.com 博客</h1>
        <p style={{ color: 'var(--color-secondary)', fontSize: '1.15rem', marginBottom: 0 }}>
          这里是一个专注于技术、生活与思考的个人博客，记录成长与灵感，分享开发经验与见解。
        </p>
      </section>
      {posts.map(post => (
        <article className="card" key={post.slug}>
          {post.cover && (
            <img src={post.cover} alt={post.title} style={{ width: '100%', borderRadius: '6px', marginBottom: '1rem', maxHeight: 220, objectFit: 'cover' }} />
          )}
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          <div style={{ color: 'var(--color-secondary)', fontSize: '0.98em', marginBottom: '0.5em' }}>{new Date(post.date).toLocaleDateString('zh-CN')}</div>
          {post.summary && <p style={{ margin: '0 0 0.7em 0', color: 'var(--color-text)' }}>{post.summary}</p>}
          <div>
            {post.tags && post.tags.map(tag => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        </article>
      ))}
    </main>
  );
}
