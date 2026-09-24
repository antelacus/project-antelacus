import Article from '@/components/Article';
import { getProjectBySlug, getProjectSlugs } from '@/lib/projects';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isNotFoundError } from '@/lib/not-found';
import { canonicalFor, detailTrail, getMetaMessage, languageAlternates } from '@/lib/seo';
import { SITE_ORIGIN } from '@/lib/site';
import { softwareProjectJsonLd, jsonLdScript, breadcrumbJsonLd } from '@/lib/structured-data';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
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
        canonical: canonicalFor(locale, `/projects/${project.slug}`),
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

  const links = [
    ...(project.repo ? [{ label: await getMetaMessage(locale, 'article.source'), url: project.repo }] : []),
    ...(project.demo ? [{ label: await getMetaMessage(locale, 'article.demo'), url: project.demo }] : []),
  ];
  return (
    <div className="page page-narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareProjectJsonLd(project)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(await detailTrail(locale, 'projects', slug, project.name))) }} />
      <Article title={project.name} lang={project.lang} date={project.date} lead={project.description} cover={project.cover} body={project.content}
        colophon={{ date: project.date, tags: project.tags, lang: project.lang, links }} />
    </div>
  );
}
