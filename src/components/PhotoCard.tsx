"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { PhotoMeta } from '../lib/gallery';
import { useState, useEffect } from 'react';

interface PhotoCardProps {
  photo: PhotoMeta;
  layout?: 'vertical' | 'search' | 'gallery';
  compact?: boolean;
  suppressAnimations?: boolean;
}

export default function PhotoCard({ photo, layout = 'vertical', compact = false, suppressAnimations = false }: PhotoCardProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const currentPath = usePathname?.() || pathname || '/';
  const currentLocale = (currentPath.split('/')[1] || '');
  const prefix = ['zh-CN','zh-HK','en','fr','es'].includes(currentLocale) ? `/${currentLocale}` : '';
  const [isHovered, setIsHovered] = useState(false);
  const [naturalTilt, setNaturalTilt] = useState('');

  const isSearch = layout === 'search';
  const isGallery = layout === 'gallery';

  // Qi Enhancement: Natural Spontaneity - generate subtle randomness
  useEffect(() => {
    const tiltVariants = ['natural-tilt-1', 'natural-tilt-2', 'natural-tilt-3', 'natural-tilt-4', 'natural-tilt-5'];
    setNaturalTilt(tiltVariants[Math.floor(Math.random() * tiltVariants.length)]);
  }, []);

  return (
    <Link 
      href={`${prefix}/gallery/${photo.slug}`} 
      className={`${isSearch ? 'card-link card-organic' : 'block relative overflow-hidden rounded-md card-organic focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B42A1E]'} ${naturalTilt}`}
      onClick={() => {
        // Only set navigatedFromHome flag when clicking from homepage
        if (window.location.pathname === '/') {
          sessionStorage.setItem('navigatedFromHome', 'true');
        }
      }}
      style={isSearch ? {
        backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'var(--color-paper)',
        transform: isHovered 
          ? 'translateY(-1px) scale(1.005)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 4px 15px rgba(29, 29, 27, 0.12), 0 2px 6px rgba(29, 29, 27, 0.06)' 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: suppressAnimations ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      } : isGallery ? {
        backgroundColor: 'transparent',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 6px 20px rgba(29,29,27,0.1)' : 'none',
        transition: suppressAnimations ? 'none' : 'all 0.35s cubic-bezier(0.215, 0.61, 0.355, 1)',
      } : {
        transform: isHovered 
          ? 'translateY(-4px) scale(1.02)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 12px 35px rgba(29, 29, 27, 0.15), 0 6px 15px rgba(29, 29, 27, 0.08)' 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: suppressAnimations ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`查看视觉作品：${photo.title}${photo.location ? `，拍摄于${photo.location}` : ''}`}
      prefetch={true}
    >
{isSearch ? (
        // Search layout - horizontal
        <article className="card photo-search-card">
          <div className="photo-search-content">
            <header>
              <h2 className="text-lg font-normal mb-1 card-title" style={{
                color: isHovered ? 'var(--color-ink)' : 'rgba(30, 30, 29, 0.85)',
                transition: suppressAnimations ? 'none' : `color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${isHovered ? '0.1s' : '0s'}`,
              }}>
                {photo.title}
              </h2>
              <div className="text-xs" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
                photo · {photo.date}
                {photo.location && ` · ${photo.location}`}
              </div>
            </header>
            {photo.caption && (
              <p className="mt-2 text-xs line-clamp-2" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{photo.caption}</p>
            )}
            {photo.tags && photo.tags.length > 0 && (
              <footer 
                className={isSearch ? "mt-1" : "mt-2"}
                style={{ 
                  opacity: suppressAnimations || isHovered ? 1 : (compact ? 1 : 0),
                  transform: suppressAnimations || isHovered ? 'translateY(0)' : (compact ? 'translateY(0)' : 'translateY(4px)'),
                  transition: suppressAnimations ? 'none' : 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                {photo.tags.map(tag => (
                  <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
                ))}
              </footer>
            )}
          </div>
          <div className="photo-search-cover">
            <Image
              src={photo.coverImage!}
              alt={photo.caption || photo.title || ''}
              className="photo-search-image"
              width={120}
              height={90}
              style={{ objectFit: 'cover' }}
              sizes="120px"
              loading="lazy"
            />
          </div>
        </article>
      ) : isGallery ? (
        // Gallery layout - framed image with subtle caption below
        <article>
          <div className="photo-grid-item">
            <Image
              src={photo.coverImage!}
              alt={photo.caption || photo.title || ''}
              width={800}
              height={600}
              className="photo-grid-image"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
          </div>
          <div className="mt-2">
            <h2 className="text-base font-normal card-title" style={{ color: 'rgba(30, 30, 29, 0.9)'}}>{photo.title}</h2>
            <div className="text-xs" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
              <span>{photo.date}</span>
              {photo.location && <><span className="mx-2">|</span><span>{photo.location}</span></>}
            </div>
          </div>
        </article>
      ) : (
        // Vertical layout - overlay style
        <>
          <Image
            src={photo.coverImage!}
            alt={photo.caption || photo.title || ''}
            width={400}
            height={300}
            className="w-full h-auto transition-transform duration-300"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyDjvZiJzhJ8z5S3dNkEGgZi2eI9a1S3jcJnFqNpKJzGOiMU1rCfE5H2T4xLAAHlPw1N8YO2N5jBBj3sBXXm4dO38g/9k="
          />
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 text-[--color-paper] transition-transform duration-300"
            style={{ 
              backgroundColor: 'rgba(29, 29, 27, 0.8)',
              transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          >
            <h2 
              className="text-lg font-normal card-title"
              style={{
                color: isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                transition: `color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${isHovered ? '0.1s' : '0s'}`,
              }}
            >
              {photo.title}
            </h2>
            <div className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)'}}>
              <span>{photo.date}</span>
              {photo.location && (
                <>
                  <span className="mx-2">|</span>
                  <span>{photo.location}</span>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Link>
  );
}
