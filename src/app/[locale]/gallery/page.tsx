import { getAllPhotosMeta } from '@/lib/gallery';
import PhotoCard from '@/components/PhotoCard';

export const metadata = {
  title: '视觉',
  description: '摄影作品与视觉创作合集。',
};

export default async function GalleryPage() {
  const photos = await getAllPhotosMeta();
  
  return (
    <div className="content-container content-container-wide">
      {photos.length === 0 ? (
        <div className="gallery-empty">
          <p>暂无照片作品。</p>
        </div>
      ) : (
        <div className="gallery-content">
          <div className="interwoven-grid">
            {photos.map((photo, index) => {
              const isFeatured = index % 9 === 0 || index % 9 === 5; // curated pattern
              return (
                <div
                  key={photo.slug}
                  className="interwoven-item"
                  style={isFeatured ? { gridColumn: 'span 6' } : undefined}
                >
                  <PhotoCard photo={photo} layout="gallery" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

