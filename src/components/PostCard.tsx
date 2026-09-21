"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { PostMeta } from '../lib/posts';
import { useState, useEffect } from 'react';
import { isSupportedLocale } from '@/i18n/routing';

interface PostCardProps {
  post: PostMeta;
  layout?: 'vertical' | 'horizontal' | 'search';
  compact?: boolean;
  suppressAnimations?: boolean;
}

export default function PostCard({ post, layout = 'vertical', compact = false, suppressAnimations = false }: PostCardProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Fallback-safe current path when rendering during SSR/hydration
  const currentPath = usePathname?.() || pathname || '/';
  const currentLocale = (currentPath.split('/')[1] || '');
  const prefix = isSupportedLocale(currentLocale) ? `/${currentLocale}` : '';
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

  // Determine layout classes based on layout prop
  const isHorizontal = layout === 'horizontal';
  const isSearch = layout === 'search';
  const isHorizontalLike = isHorizontal || isSearch;
  
  // Search layout uses similar structure to horizontal but with compact styling
  const cardClass = isHorizontalLike ? 'card-link card-organic' : 'block p-4 rounded-md card-organic focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B42A1E]';
  const articleClass = isHorizontalLike ? `card ${isSearch ? 'post-search-card' : 'post-list-card'} ${!suppressAnimations ? 'masonry-item' : ''}` : '';
  
  // Unified hover styles for horizontal-like layouts
  const horizontalLikeHoverStyle = isHorizontalLike ? {
    backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'var(--color-paper)',
    transform: isHovered 
      ? `translateY(${isSearch ? '-1px' : '-3px'}) scale(${isSearch ? '1.005' : '1.01'})` 
      : 'translateY(0) scale(1)',
    boxShadow: isHovered 
      ? `0 ${isSearch ? '4px 15px' : '8px 25px'} rgba(29, 29, 27, 0.12), 0 ${isSearch ? '2px 6px' : '4px 10px'} rgba(29, 29, 27, 0.06)` 
      : '0 0 0 rgba(29, 29, 27, 0)',
    transition: suppressAnimations ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  } : undefined;

  return (
    <Link 
      href={`${prefix}/posts/${post.slug}`} 
      className={`${cardClass} ${naturalTilt}`}
      style={isHorizontalLike ? horizontalLikeHoverStyle : { 
        backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'var(--color-paper)',
        transform: isHovered 
          ? 'translateY(-3px) scale(1.01)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 8px 25px rgba(29, 29, 27, 0.12), 0 4px 10px rgba(29, 29, 27, 0.06)' 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: suppressAnimations ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        // Only set navigatedFromHome flag when clicking from homepage
        if (window.location.pathname === '/') {
          sessionStorage.setItem('navigatedFromHome', 'true');
        }
      }}
      aria-label={`阅读专栏文章：${post.title}`}
      prefetch={true}
    >
      <article className={articleClass}>
        {isHorizontalLike ? (
          // Horizontal-like layout (for posts list page and search) - unified with other card styles
          <>
            <div className={isSearch ? "post-search-content" : "post-list-content"}>
              <header>
                <h2 
                  className={`${isSearch ? 'text-lg' : 'text-xl'} font-normal mb-1 card-title ${inkVariant}`}
                  style={{
                    color: isHovered ? 'var(--color-ink)' : 'rgba(30, 30, 29, 0.85)',
                    transition: suppressAnimations ? 'none' : `color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${isHovered ? '0.1s' : '0s'}`,
                  }}
                >
                  {post.title}
                </h2>
                <div className={`${isSearch ? 'text-xs' : 'text-sm'}`} style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
                  {isSearch ? 'post · ' : ''}{post.date}
                  {post.lang && (
                    <>
                      <span className="mx-2">|</span>
                      <span>{post.lang}</span>
                    </>
                  )}
                </div>
              </header>
              {post.summary && (
                <p className={`mt-2 ${isSearch ? 'text-xs' : 'text-sm'} ${isSearch ? 'line-clamp-2' : ''}`} style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{post.summary}</p>
              )}
              {post.tags && post.tags.length > 0 && (
                <footer 
                  className={isSearch ? "mt-1" : "mt-3"}
                  style={{ 
                    opacity: suppressAnimations || isHovered ? 1 : (compact ? 1 : 0),
                    transform: suppressAnimations || isHovered ? 'translateY(0)' : (compact ? 'translateY(0)' : 'translateY(4px)'),
                    transition: suppressAnimations ? 'none' : 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
                  ))}
                </footer>
              )}
            </div>
            {post.cover && (
              <div className={isSearch ? "post-search-cover" : "post-list-cover"} style={{ position: 'relative' }}>
                <Image
                  src={post.cover}
                  alt={post.title}
                  className={isSearch ? "post-search-image" : "post-list-image"}
                  width={isSearch ? 120 : 180}
                  height={isSearch ? 90 : 135}
                  style={{ objectFit: 'cover' }}
                  sizes={isSearch ? "120px" : "(max-width: 768px) 100vw, 180px"}
                  loading="lazy"
                />
                {isSearch && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: '4px 6px',
                      background: 'linear-gradient(to top, rgba(29,29,27,0.65), rgba(29,29,27,0.25), transparent)',
                      color: 'var(--color-paper)',
                      fontSize: '10px',
                      lineHeight: 1.2
                    }}
                  >
                    <span style={{ opacity: 0.95 }}>{post.date}</span>
                    {post.lang && (
                      <>
                        <span style={{ margin: '0 6px', opacity: 0.7 }}>|</span>
                        <span style={{ opacity: 0.95 }}>{post.lang}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Vertical layout (for homepage)
          <>
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
                  color: isHovered ? 'var(--color-ink)' : 'rgba(30, 30, 29, 0.85)',
                  transition: `color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${isHovered ? '0.1s' : '0s'}`,
                }}
              >
                {post.title}
              </h2>
              <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
                {post.date}
                {post.lang && (
                  <>
                    <span className="mx-2">|</span>
                    <span>{post.lang}</span>
                  </>
                )}
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
          </>
        )}
      </article>
    </Link>
  );
}
