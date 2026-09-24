import { getAllPhotosMeta } from '@/lib/gallery';
import { setRequestLocale } from 'next-intl/server';
import PageTransition from '@/components/PageTransition';
import PhotoTile from '@/components/PhotoTile';
import { fromPhoto } from '@/lib/entry';
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
  const albums = (await getAllPhotosMeta()).map(fromPhoto);
  return (
    <PageTransition>
    <div className="page">
      <h1 className="page-title">{await getMetaMessage(locale, 'meta.gallery_title')}</h1>
      {albums.length === 0 ? (
        <p className="page-empty">{await getMetaMessage(locale, 'list.empty')}</p>
      ) : (
        <ul className="tiles">
          {albums.map((album) => (
            <li key={album.slug}>
              <PhotoTile entry={album} />
            </li>
          ))}
        </ul>
      )}
    </div>
    </PageTransition>
  );
}
