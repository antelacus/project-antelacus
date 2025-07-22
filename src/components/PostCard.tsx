"use client";
import Link from 'next/link';
import { PostMeta } from '../lib/posts';

export default function PostCard({ post }: { post: PostMeta }) {
  const showCover = post.cover && post.cover.trim() !== '';

  return (
    <article className="card masonry-item">
      {showCover && (
        <div className="card-cover">
          <img 
            src={post.cover} 
            alt={post.title} 
            className="card-cover-image"
            onError={(e) => {
              const coverDiv = e.currentTarget.parentElement;
              if (coverDiv) {
                coverDiv.style.display = 'none';
              }
            }}
          />
        </div>
      )}
      <div className="card-content">
        <div className="card-meta">
          <span className="card-type">深度思考</span>
          <time className="card-date">
            {new Date(post.date).toLocaleDateString('zh-CN')}
          </time>
        </div>
        <h2 className="card-title">
          <Link href={`/posts/${post.slug}`} className="card-title-link">
            {post.title}
          </Link>
        </h2>
        {post.summary && (
          <p className="card-summary">{post.summary}</p>
        )}
        <div className="card-author">
          <span>AnteLacus</span>
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="card-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
} 