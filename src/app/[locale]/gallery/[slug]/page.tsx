import { getPhotoBySlug } from '@/lib/gallery';
import { setRequestLocale } from 'next-intl/server';
import { languageAlternates } from '@/lib/seo';
import { imageGalleryJsonLd } from '@/lib/structured-data';
// import { notFound } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import Link from 'next/link';
import PhotoViewer from '@/components/PhotoViewer';
import TagList from '@/components/TagList';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) {
    return {
      title: '照片集未找到',
      description: '你访问的照片集不存在或已被删除。',
    };
  }
  return {
    title: photo.title,
    description: photo.caption || `视觉作品 - ${photo.title}`,
    alternates: {
      languages: languageAlternates(`/gallery/${photo.slug}`),
    },
    openGraph: {
      title: photo.title,
      description: photo.caption || `视觉作品 - ${photo.title}`,
      type: 'article',
      url: `https://antelacus.com/gallery/${photo.slug}`,
      images: [{ url: `/gallery/${photo.slug}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/gallery/${photo.slug}/og.png`],
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const photo = await getPhotoBySlug(slug);
  
  if (!photo) {
    return (
      <main className="content-container content-container-standard text-center">
        <h1>照片集未找到</h1>
        <p>你访问的照片集不存在或已被删除。</p>
        <Link href="../">返回视觉</Link>
      </main>
    );
  }

  const jsonLd = imageGalleryJsonLd(photo);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="content-container content-container-standard text-center mt-12">
        <h1>{photo.title}</h1>
        <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
          <span>{photo.date}</span>
          {photo.location && (
            <>
              <span className="mx-2">|</span>
              <span>{photo.location}</span>
            </>
          )}
          <span className="mx-2">|</span>
          <span>{photo.photoCount} 张照片</span>
        </div>
        {photo.tags && photo.tags.length > 0 && (
          <div className="mt-2">
            <TagList tags={photo.tags} />
          </div>
        )}
        {photo.caption && (
          <p className="mt-4 text-base">{photo.caption}</p>
        )}
      </header>

      <div className="content-container content-container-wide">
        <PhotoViewer photos={photo.photos} location={photo.location} date={photo.date} />
      </div>

      {photo.content && (
        <div className="content-container content-container-standard">
          <article className="prose" data-title={photo.title}>
            {renderMarkdown(photo.content)}
          </article>
        </div>
      )}
    </main>
  );
}
