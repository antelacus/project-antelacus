"use client";
import Link from 'next/link';
import { PhotoMeta } from '../lib/gallery';

export default function PhotoCard({ photo }: { photo: PhotoMeta }) {
  const showCover = photo.image && photo.image.trim() !== '';

  return (
    <article className="card masonry-item">
      {showCover && (
        <div className="card-cover">
          <img 
            src={photo.image} 
            alt={photo.caption || photo.title || ''} 
            className="card-cover-image"
            onError={(e) => {
              const coverDiv = e.currentTarget.parentElement;
              if (coverDiv) {
                coverDiv.style.display = 'none';
              }
            }}
          />
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
          {photo.title ? (
            <Link href={`/gallery/${photo.slug}`} className="card-title-link">
              {photo.title}
            </Link>
          ) : (
            <span className="card-title-text">摄影作品</span>
          )}
        </h2>
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