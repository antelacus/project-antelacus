"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PhotoMeta } from '../lib/gallery';
import { useState } from 'react';

interface PhotoCardProps {
  photo: PhotoMeta;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href={`/gallery/${photo.slug}`} 
      className="block relative overflow-hidden rounded-md transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B42A1E]"
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 6px 20px rgba(29, 29, 27, 0.12)' : '0 0 0 rgba(29, 29, 27, 0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`查看视觉作品：${photo.title}${photo.location ? `，拍摄于${photo.location}` : ''}`}
      prefetch={true}
    >
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
        <h2 className="text-lg font-normal">{photo.title}</h2>
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
    </Link>
  );
}
