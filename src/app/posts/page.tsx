import { getAllPostsMeta } from '../../lib/posts';
import Link from 'next/link';

export const metadata = {
  title: '深度思考',
  description: '博客文章与深度思考合集。',
};

export default async function PostsPage() {
  const posts = await getAllPostsMeta();
  return (
    <main>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.2rem' }}>深度思考</h1>
      {posts.length === 0 && <p>暂无内容。</p>}
      {posts.map(post => (
        <article className="card" key={post.slug} style={{ marginBottom: '1rem' }}>
          {post.cover && (
            <img 
              src={post.cover} 
              alt={post.title} 
              style={{ 
                width: '100%', 
                borderRadius: '6px', 
                marginBottom: '0.8rem', 
                objectFit: 'cover',
                maxHeight: '200px'
              }} 
            />
          )}
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          <div style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '0.6rem' }}>
            {new Date(post.date).toLocaleDateString('zh-CN')}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div style={{ marginBottom: '0.6rem' }}>
              {post.tags.map(tag => (
                <span 
                  key={tag} 
                  style={{ 
                    display: 'inline-block',
                    backgroundColor: 'var(--color-card-bg)',
                    color: 'var(--color-secondary)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    marginRight: '0.5rem',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {post.summary && <p style={{ margin: 0, color: 'var(--color-text)' }}>{post.summary}</p>}
        </article>
      ))}
    </main>
  );
} 