import { getProjectBySlug } from '../../../lib/projects';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import TagList from '../../../components/TagList';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return { title: '项目未找到' };
  }
  return { 
    title: project.name, 
    description: project.description || '' 
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  
  if (!project) {
    return (
      <main className="content-container content-container-standard text-center">
        <h1>项目未找到</h1>
        <p>你访问的项目不存在或已被删除。</p>
        <Link href="/projects">返回实验室</Link>
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

  return (
    <div className="content-container content-container-standard">
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
        
        <div className="flex flex-wrap gap-4 my-6">
          <a href={project.repo} target="_blank" rel="noopener noreferrer">
            📁 源码
          </a>
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer">
              🚀 演示
            </a>
          )}
        </div>
        
        <div className="prose">
          <MDXRemote source={project.content} />
        </div>
      </article>
    </div>
  );
}
