"use client";
import Link from 'next/link';
import { PhotoMeta } from '../lib/gallery';

export default function PhotoCard({ photo }: { photo: PhotoMeta }) {
  const showCover = photo.coverImage && photo.coverImage.trim() !== '';

  return (
    <article className="card masonry-item photo-card">
      {showCover && (
        <div className="card-cover">
          <img 
            src={photo.coverImage} 
            alt={photo.caption || photo.title || ''} 
            className="card-cover-image"
            onError={(e) => {
              const coverDiv = e.currentTarget.parentElement;
              if (coverDiv) {
                coverDiv.style.display = 'none';
              }
            }}
          />
          <div className="photo-overlay">
            <div className="photo-count">
              <span className="photo-count-icon">📷</span>
              <span className="photo-count-text">
                {photo.photoCount} 张
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="card-content">
        <div className="card-meta">
          <span className="card-type">光影记录</span>
          <time className="card-date">
            {new Date(photo.date).toLocaleDateString('zh-CN')}
          </time>
        </div>
        <h2 className="card-title">
          <Link href={`/gallery/${photo.slug}`} className="card-title-link">
            {photo.title}
          </Link>
        </h2>
        {photo.location && (
          <div className="photo-location">
            <span className="location-icon">📍</span>
            <span className="location-text">{photo.location}</span>
          </div>
        )}
        {photo.caption && (
          <p className="card-summary">{photo.caption}</p>
        )}
        <div className="card-author">
          <span>AnteLacus</span>
        </div>
      </div>
    </article>
  );
} 