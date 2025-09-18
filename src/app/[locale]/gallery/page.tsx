import { getAllPhotosMeta } from '@/lib/gallery';
import PhotoCard from '@/components/PhotoCard';
import MasonryGrid from '@/components/MasonryGrid';

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
          <MasonryGrid columns={3} gap={20}>
            {photos.map((photo, index) => (
              <div key={photo.slug} style={{ animationDelay: `${index * 0.1}s` }}>
                <PhotoCard photo={photo} />
              </div>
            ))}
          </MasonryGrid>
        </div>
      )}
    </div>
  );
}

