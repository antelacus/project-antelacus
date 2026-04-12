import { getAllProjectsMeta } from '@/lib/projects';
import ProjectCard from '@/components/ProjectCard';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.projects_title'),
    description: await getMetaMessage(locale, 'meta.projects_description'),
    alternates: {
      canonical: canonicalFor(locale, '/projects'),
      languages: languageAlternates('/projects'),
    },
  };
}

export default async function ProjectsPage() {
  const projects = await getAllProjectsMeta();
  return (
    <div className="content-container content-container-standard">
      {projects.length === 0 && <p>暂无项目。</p>}
      <div className="content-list">
        {projects.map((project, index) => (
          <div key={project.slug} className="content-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </div>
  );
}

