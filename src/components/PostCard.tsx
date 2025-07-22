import Link from 'next/link';
import { PostMeta } from '../lib/posts';

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="card masonry-item" key={post.slug}>
      {post.cover && (
        <img src={post.cover} alt={post.title} style={{ width: '100%', borderRadius: '6px', marginBottom: '0.8rem', objectFit: 'cover' }} />
      )}
      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <div style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{new Date(post.date).toLocaleDateString('zh-CN')}</div>
      {post.summary && <p style={{ margin: 0 }}>{post.summary}</p>}
    </article>
  );
} 