import { getProjectBySlug } from '@/lib/projects';
import { setRequestLocale } from 'next-intl/server';
import { languageAlternates } from '@/lib/seo';
import { softwareProjectJsonLd } from '@/lib/structured-data';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import TagList from '@/components/TagList';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return { title: '项目未找到' };
  }
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
      url: `https://antelacus.com/projects/${project.slug}`,
      images: [{ url: `/projects/${project.slug}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/projects/${project.slug}/og.png`],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = await getProjectBySlug(slug);
  
  if (!project) {
    return (
      <main className="content-container content-container-standard text-center">
        <h1>项目未找到</h1>
        <p>你访问的项目不存在或已被删除。</p>
        <Link href="../">返回实验室</Link>
      </main>
    );
  }
  
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
          <a href={project.repo} target="_blank" rel="noopener noreferrer" className="action-button" aria-label="查看源码">
            <span className="icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-3 3-3-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10h6.586L12 17.414 13.414 16H20V6H4z"/>
              </svg>
            </span>
            源码
          </a>
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
          <MDXRemote 
            source={project.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              }
            }}
          />
        </div>
      </article>
    </div>
  );
}
