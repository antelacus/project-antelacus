"use client";
import Link from 'next/link';
import { PostMeta } from '../lib/posts';

export default function PostListCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.slug}`} className="card-link">
      <article className="card post-list-card">
        <div className="post-list-content">
          <h2 className="post-list-title">
            {post.title}
          </h2>
          <div className="post-list-date">
            {new Date(post.date).toLocaleDateString('zh-CN')}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="post-list-tags">
              {post.tags.map(tag => (
                <span key={tag} className="post-list-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {post.summary && (
            <p className="post-list-summary">{post.summary}</p>
          )}
        </div>
        {post.cover && (
          <div className="post-list-cover">
            <img
              src={post.cover}
              alt={post.title}
              className="post-list-image"
              onError={(e) => {
                const coverDiv = e.currentTarget.parentElement;
                if (coverDiv) {
                  coverDiv.style.display = 'none';
                }
              }}
            />
          </div>
        )}
      </article>
    </Link>
  );
} 