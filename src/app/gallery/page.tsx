import { getAllPhotosMeta } from '../../lib/gallery';
import PhotoCard from '../../components/PhotoCard';
import MasonryGrid from '../../components/MasonryGrid';

export const metadata = {
  title: '光影记录',
  description: '摄影作品与光影记录合集。',
};

export default async function GalleryPage() {
  const photos = await getAllPhotosMeta();
  
  return (
    <main className="gallery-page">
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
    </main>
  );
} 