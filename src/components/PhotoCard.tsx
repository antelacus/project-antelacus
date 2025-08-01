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
      className="block relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
