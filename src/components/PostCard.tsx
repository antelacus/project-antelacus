"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PostMeta } from '../lib/posts';
import { useState } from 'react';

interface PostCardProps {
  post: PostMeta;
}

export default function PostCard({ post }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href={`/posts/${post.slug}`} 
      className="block p-4 rounded-md transition-colors duration-300"
      style={{ backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'transparent' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      prefetch={true}
    >
      <article>
        {post.cover && (
          <div className="mb-4">
            <Image
              src={post.cover}
              alt={post.title}
              width={400}
              height={225} // 16:9 aspect ratio
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <header>
          <h2 className="text-xl font-normal mb-1">{post.title}</h2>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            {post.date}
          </div>
        </header>
        {post.summary && (
          <p className="mt-2 text-sm" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{post.summary}</p>
        )}
        <footer 
          className="mt-3 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          {post.tags?.map(tag => (
            <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
          ))}
        </footer>
      </article>
    </Link>
  );
}
