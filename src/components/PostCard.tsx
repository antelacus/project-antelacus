"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PostMeta } from '../lib/posts';

interface PostCardProps {
  post: PostMeta;
  showType?: boolean;   // 是否显示类别标识（首页显示，专门页面不显示）
}

export default function PostCard({ post, showType = true }: PostCardProps) {
  const showCover = post.cover && post.cover.trim() !== '';

  return (
    <Link href={`/posts/${post.slug}`} className="card-link" prefetch={true}>
      <article className="card masonry-item">
        {showCover && (
          <div className="card-cover">
            <Image
              src={post.cover!}
              alt={post.title}
              className="card-cover-image"
              width={400}
              height={160}
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
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