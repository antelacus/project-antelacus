"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PostMeta } from '../lib/posts';

export default function PostListCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.slug}`} className="card-link" prefetch={true}>
      <article className="card post-list-card masonry-item">
        <div className="post-list-content">
          <h2 className="post-list-title">
            {post.title}
          </h2>
          <div className="post-list-date">
            {post.date}
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
            <Image
              src={post.cover}
              alt={post.title}
              className="post-list-image"
              width={180}
              height={135}
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 180px"
              priority={false}
            />
          </div>
        )}
      </article>
    </Link>
  );
} 