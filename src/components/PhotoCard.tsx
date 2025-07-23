"use client";
import Link from 'next/link';
import { PhotoMeta } from '../lib/gallery';

interface PhotoCardProps {
  photo: PhotoMeta;
  showType?: boolean;   // 是否显示类别标识（首页显示，专门页面不显示）
}

export default function PhotoCard({ photo, showType = true }: PhotoCardProps) {
  const showCover = photo.coverImage && photo.coverImage.trim() !== '';

  return (
    <Link href={`/gallery/${photo.slug}`} className="card-link">
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
              <div className="photo-info">
                <div className="photo-count">
                  <span className="photo-count-icon">📷</span>
                  <span className="photo-count-text">
                    {photo.photoCount} 张
                  </span>
                </div>
                {photo.caption && (
                  <p className="photo-caption">{photo.caption}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="card-content">
          <div className="card-meta">
            {showType && <span className="card-type">视觉</span>}
            <time className="card-date">
              {new Date(photo.date).toLocaleDateString('zh-CN')}
            </time>
          </div>
          <h2 className="card-title">
            {photo.title}
          </h2>
          {photo.location && (
            <div className="photo-location">
              <span className="location-icon">📍</span>
              <span className="location-text">{photo.location}</span>
            </div>
          )}
          {photo.tags && photo.tags.length > 0 && (
            <div className="card-tags">
              {photo.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
} 