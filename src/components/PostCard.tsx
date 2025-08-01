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
      className="block p-4 rounded-md transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B42A1E]"
      style={{ 
        backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'transparent',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(29, 29, 27, 0.08)' : '0 0 0 rgba(29, 29, 27, 0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`阅读专栏文章：${post.title}`}
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
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyDjvZiJzhJ8z5S3dNkEGgZi2eI9a1S3jcJnFqNpKJzGOiMU1rCfE5H2T4xLAAHlPw1N8YO2N5jBBj3sBXXm4dO38g/9k="
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
