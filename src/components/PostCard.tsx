"use client";
import Link from 'next/link';
import { PostMeta } from '../lib/posts';

export default function PostCard({ post }: { post: PostMeta }) {
  // 只在cover存在且不为空时显示封面
  const showCover = post.cover && post.cover.trim() !== '';

  return (
    <article className="card masonry-item post-card">
      {showCover && (
        <div className="post-cover">
          <img 
            src={post.cover} 
            alt={post.title} 
            className="post-cover-image"
            onError={(e) => {
              // 图片加载失败时隐藏封面容器
              const coverDiv = e.currentTarget.parentElement;
              if (coverDiv) {
                coverDiv.style.display = 'none';
              }
            }}
          />
        </div>
      )}
      <div className="post-content">
        <div className="post-meta">
          <span className="post-type">长内容</span>
          <time className="post-date">
            {new Date(post.date).toLocaleDateString('zh-CN')}
          </time>
        </div>
        <h2 className="post-title">
          <Link href={`/posts/${post.slug}`} className="post-title-link">
            {post.title}
          </Link>
        </h2>
        {post.summary && (
          <p className="post-summary">{post.summary}</p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag post-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
} 