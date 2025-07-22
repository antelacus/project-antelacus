import { getAllPhotosMeta } from '../../lib/gallery';

export const metadata = {
  title: '光影记录',
  description: '精选 Instagram 照片集。',
};

export default async function GalleryPage() {
  const photos = await getAllPhotosMeta();
  return (
    <main>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.2rem' }}>光影记录</h1>
      {photos.length === 0 && <p>暂无照片。</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {photos.map(photo => (
          <a key={photo.slug} href={photo.sourceUrl || photo.image} target="_blank" rel="noopener noreferrer" style={{ position: 'relative' }}>
            <img src={photo.image} alt={photo.caption || ''} style={{ width: '100%', borderRadius: '6px', objectFit: 'cover' }} />
          </a>
        ))}
      </div>
    </main>
  );
} 