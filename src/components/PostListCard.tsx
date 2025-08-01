"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PostMeta } from '../lib/posts';
import { useState, useEffect } from 'react';

export default function PostListCard({ post }: { post: PostMeta }) {
  const [naturalTilt, setNaturalTilt] = useState('');
  const [inkVariant, setInkVariant] = useState('');

  // Qi Enhancement: Natural Spontaneity - generate subtle randomness
  useEffect(() => {
    const tiltVariants = ['natural-tilt-1', 'natural-tilt-2', 'natural-tilt-3', 'natural-tilt-4', 'natural-tilt-5'];
    const inkVariants = ['ink-variant-1', 'ink-variant-2', 'ink-variant-3', 'ink-variant-4', 'ink-variant-5'];
    
    setNaturalTilt(tiltVariants[Math.floor(Math.random() * tiltVariants.length)]);
    setInkVariant(inkVariants[Math.floor(Math.random() * inkVariants.length)]);
  }, []);

  return (
    <Link href={`/posts/${post.slug}`} className={`card-link ${naturalTilt}`} prefetch={true}>
      <article className="card post-list-card masonry-item">
        <div className="post-list-content">
          <div className="post-list-meta">
            <div className="post-list-date">{post.date}</div>
          </div>
          <h2 className={`post-list-title ${inkVariant}`}>{post.title}</h2>
          {post.summary && (
            <p className="post-list-summary">{post.summary}</p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="post-list-tags">
              {post.tags.map(tag => (
                <span key={tag} className="post-list-tag">
                  {tag}
                </span>
              ))}
            </div>
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