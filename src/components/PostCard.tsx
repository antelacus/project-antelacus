"use client";
import Link from 'next/link';
import { PostMeta } from '../lib/posts';

interface PostCardProps {
  post: PostMeta;
  showType?: boolean;   // 是否显示类别标识（首页显示，专门页面不显示）
}

export default function PostCard({ post, showType = true }: PostCardProps) {
  const showCover = post.cover && post.cover.trim() !== '';

  return (
    <Link href={`/posts/${post.slug}`} className="card-link">
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
            {showType && <span className="card-type">专栏</span>}
            <time className="card-date">
              {post.date}
            </time>
          </div>
          <h2 className="card-title">
            {post.title}
          </h2>
          {post.summary && (
            <p className="card-summary">{post.summary}</p>
          )}
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
    </Link>
  );
} 