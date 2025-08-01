"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PostMeta } from '../lib/posts';
import { useState, useEffect } from 'react';

interface PostCardProps {
  post: PostMeta;
}

export default function PostCard({ post }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
    <Link 
      href={`/posts/${post.slug}`} 
      className={`block p-4 rounded-md card-organic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B42A1E] ${naturalTilt}`}
      style={{ 
        backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'transparent',
        transform: isHovered 
          ? 'translateY(-3px) scale(1.01)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 8px 25px rgba(29, 29, 27, 0.12), 0 4px 10px rgba(29, 29, 27, 0.06)' 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
          <h2 
            className={`text-xl font-normal mb-1 card-title ${inkVariant}`}
            style={{
              letterSpacing: isHovered ? '0.02em' : '0',
              transition: 'letter-spacing 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {post.title}
          </h2>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            {post.date}
          </div>
        </header>
        {post.summary && (
          <p className="mt-2 text-sm" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{post.summary}</p>
        )}
        <footer 
          className="mt-3"
          style={{ 
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {post.tags?.map(tag => (
            <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
          ))}
        </footer>
      </article>
    </Link>
  );
}
