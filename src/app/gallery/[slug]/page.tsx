import { getPhotoBySlug } from '../../../lib/gallery';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import PhotoViewer from '../../../components/PhotoViewer';

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
    openGraph: {
      title: photo.title,
      description: photo.caption || `视觉作品 - ${photo.title}`,
      type: 'article',
      url: `https://antelacus.com/gallery/${photo.slug}`,
      images: photo.coverImage ? [photo.coverImage] : [],
    },
  };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const photo = await getPhotoBySlug(slug);
  
  if (!photo) {
    return (
      <main style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>照片集未找到</h1>
        <p>你访问的照片集不存在或已被删除。</p>
        <Link href="/gallery" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>返回视觉</Link>
      </main>
    );
  }

  return (
    <main className="gallery-detail">
      <div className="gallery-header">
        <div className="gallery-meta">
          <h1 className="gallery-title">{photo.title}</h1>
          <div className="gallery-info">
            <time className="gallery-date">
              {photo.date}
            </time>
            {photo.location && (
              <span className="gallery-location">
                <span className="location-icon">📍</span>
                {photo.location}
              </span>
            )}
            <span className="gallery-count">
              <span className="count-icon">📷</span>
              {photo.photoCount} 张照片
            </span>
          </div>
          {photo.caption && (
            <p className="gallery-caption">{photo.caption}</p>
          )}
        </div>
      </div>

      <div className="gallery-photos">
        <PhotoViewer photos={photo.photos} location={photo.location} date={photo.date} />
      </div>

      {photo.content && (
        <div className="gallery-content">
          <div className="content-wrapper">
            <MDXRemote source={photo.content} />
          </div>
        </div>
      )}
    </main>
  );
} 