import { getAllPostsMeta } from '../../lib/posts';
import Link from 'next/link';

export const metadata = {
  title: '深度思考',
  description: '博客文章与深度思考合集。',
};

export default async function PostsPage() {
  const posts = await getAllPostsMeta();
  return (
    <main className="container">
      {posts.length === 0 && <p>暂无内容。</p>}
      {posts.map(post => (
        <article
          className="card post-list-card"
          key={post.slug}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.2rem 1.2rem',
            marginBottom: '1.2rem',
            minHeight: '110px',
            gap: '1.2rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3, whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            <div style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              {new Date(post.date).toLocaleDateString('zh-CN')}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div style={{ marginBottom: '0.4rem' }}>
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--color-card-bg)',
                      color: 'var(--color-secondary)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      marginRight: '0.4rem',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {post.summary && <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.98rem', lineHeight: 1.5, whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.summary}</p>}
          </div>
          {post.cover && (
            <img
              src={post.cover}
              alt={post.title}
              style={{
                width: '180px',
                height: '135px',
                objectFit: 'cover',
                borderRadius: '10px',
                marginLeft: '1.2rem',
                flexShrink: 0,
                background: '#eee',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                display: 'block',
                maxWidth: '100%'
              }}
            />
          )}
        </article>
      ))}
    </main>
  );
} 