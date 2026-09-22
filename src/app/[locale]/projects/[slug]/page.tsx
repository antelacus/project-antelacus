import { getProjectBySlug, getProjectSlugs } from '@/lib/projects';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isNotFoundError } from '@/lib/not-found';
import { languageAlternates } from '@/lib/seo';
import { SITE_ORIGIN } from '@/lib/site';
import { softwareProjectJsonLd, jsonLdScript } from '@/lib/structured-data';
import Link from 'next/link';
import Image from 'next/image';
import { renderMarkdown } from '@/lib/markdown';
import TagList from '@/components/TagList';

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
    if (!(await getProjectSlugs()).includes(slug)) notFound();
    const project = await getProjectBySlug(slug);
    if (!project) notFound();
    return { 
      title: project.name, 
      description: project.description || '',
      alternates: {
        languages: languageAlternates(`/projects/${project.slug}`),
      },
      openGraph: {
        title: project.name,
        description: project.description || '',
        type: 'article',
        url: `${SITE_ORIGIN}/projects/${project.slug}`,
        images: [{ url: `/projects/${project.slug}/og.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`/projects/${project.slug}/og.png`],
      },
    };
  } catch (error) {
    if (isNotFoundError(error)) throw error;
    return {};
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!(await getProjectSlugs()).includes(slug)) notFound();
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'beta': return '测试';
      case 'archived': return '归档';
      default: return status;
    }
  };

  const jsonLd = softwareProjectJsonLd(project);

  return (
    <div className="content-container content-container-standard">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <article data-title={project.name}>
        <header>
          <h1>{project.name}</h1>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            <span>{project.date}</span>
            {project.status && (
              <>
                <span className="mx-2">|</span>
                <span>状态: {getStatusLabel(project.status)}</span>
              </>
            )}
            {project.star && project.star > 0 && (
                <>
                  <span className="mx-2">|</span>
                  <span>⭐ {project.star}</span>
                </>
            )}
          </div>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-2">
              <TagList tags={project.tags} />
            </div>
          )}
        </header>

        {project.cover && (
          <div className="my-8">
            <Image
              src={project.cover}
              alt={project.name}
              width={800}
              height={450}
              className="w-full h-auto"
              priority={true}
            />
          </div>
        )}

        <p className="text-lg" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{project.description}</p>
        
        <div className="flex flex-wrap gap-3 my-6">
          {project.repo && (
            <a href={project.repo} target="_blank" rel="noopener noreferrer" className="action-button" aria-label="查看源码">
              <span className="icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-3 3-3-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10h6.586L12 17.414 13.414 16H20V6H4z"/>
                </svg>
              </span>
              源码
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="action-button" aria-label="查看演示">
              <span className="icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3h18v2H3V3zm0 14h6v4H3v-4zm12 0h6v4h-6v-4zM3 7h18v8H3V7zm8 2v4l4-2-4-2z"/>
                </svg>
              </span>
              演示
            </a>
          )}
        </div>
        
        <div className="prose">
          {renderMarkdown(project.content)}
        </div>
      </article>
    </div>
  );
}
