import { getAllPhotosMeta } from '@/lib/gallery';
import { setRequestLocale } from 'next-intl/server';
import PhotoCard from '@/components/PhotoCard';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.gallery_title'),
    description: await getMetaMessage(locale, 'meta.gallery_description'),
    alternates: {
      canonical: canonicalFor(locale, '/gallery'),
      languages: languageAlternates('/gallery'),
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
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

