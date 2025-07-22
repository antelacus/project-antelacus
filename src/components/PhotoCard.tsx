"use client";
import { PhotoMeta } from '../lib/gallery';

export default function PhotoCard({ photo }: { photo: PhotoMeta }) {
  return (
    <article className="masonry-item photo-card">
      <div className="photo-container">
        <a 
          href={photo.sourceUrl || photo.image} 
          target="_blank" 
          rel="noopener noreferrer"
          className="photo-link"
        >
          <img 
            src={photo.image} 
            alt={photo.caption || ''} 
            className="photo-image"
          />
          <div className="photo-overlay">
            <span className="photo-view-hint">点击查看原图</span>
          </div>
        </a>
                 {(photo.caption || photo.sourceUrl) && (
           <div className="photo-info">
             {photo.caption && (
               <p className="photo-caption">{photo.caption}</p>
             )}
             <div className="photo-meta">
               <time className="photo-date">
                 {new Date(photo.date).toLocaleDateString('zh-CN')}
               </time>
               {photo.sourceUrl && (
                 <span className="photo-source">
                   {photo.sourceUrl.includes('instagram') ? '📷 Instagram' : 
                    photo.sourceUrl.includes('twitter') || photo.sourceUrl.includes('x.com') ? '🐦 X' : 
                    '🔗 原始来源'}
                 </span>
               )}
             </div>
           </div>
         )}
      </div>
    </article>
  );
} 