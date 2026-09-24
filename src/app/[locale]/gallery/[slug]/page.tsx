import Article from '@/components/Article';
import { getPhotoBySlug, getPhotoSlugs } from '@/lib/gallery';
import { setRequestLocale } from 'next-intl/server';
import { detailTrail, languageAlternates } from '@/lib/seo';
import { SITE_ORIGIN } from '@/lib/site';
import { imageGalleryJsonLd, jsonLdScript, breadcrumbJsonLd } from '@/lib/structured-data';
import { notFound } from 'next/navigation';
import { isNotFoundError } from '@/lib/not-found';
import { renderMarkdown } from '@/lib/markdown';
import PhotoViewer from '@/components/PhotoViewer';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Metadata renders outside the error boundary: a database failure here would be a bare 500, so
  // it falls back to the layout's defaults and lets the page body raise the error where it is caught.
  try {
    if (!(await getPhotoSlugs()).includes(slug)) notFound();
    const photo = await getPhotoBySlug(slug);
    if (!photo) notFound();
    return {
      title: photo.title,
      description: photo.caption || photo.title,
      alternates: {
        languages: languageAlternates(`/gallery/${photo.slug}`),
      },
      openGraph: {
        title: photo.title,
        description: photo.caption || photo.title,
        type: 'article',
        url: `${SITE_ORIGIN}/gallery/${photo.slug}`,
        images: [{ url: `/gallery/${photo.slug}/og.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`/gallery/${photo.slug}/og.png`],
      },
    };
  } catch (error) {
    if (isNotFoundError(error)) throw error;
    return {};
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!(await getPhotoSlugs()).includes(slug)) notFound();
  const album = await getPhotoBySlug(slug);
  if (!album) notFound();

  // An album's photos are its body; its notes, if any, follow them.
  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(imageGalleryJsonLd(album)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(await detailTrail(locale, 'gallery', slug, album.title))) }} />
      <Article title={album.title} lang={album.lang} date={album.date} lead={album.caption} body=""
        after={
          <>
            <PhotoViewer photos={album.photos} />
            {album.content.trim() && <div className="prose scroll-body" lang={album.lang} data-content>{renderMarkdown(album.content)}</div>}
          </>
        }
        colophon={{ date: album.date, tags: album.tags, lang: album.lang }} />
    </div>
  );
}
