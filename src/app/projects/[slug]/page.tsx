import { getProjectBySlug } from '../../../lib/projects';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';

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
      <main style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>项目未找到</h1>
        <Link href="/projects" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>返回实验室</Link>
      </main>
    );
  }
  
  return (
    <main className="gallery-detail">
      <article className="card">
        {project.cover && (
          <Image
            src={project.cover}
            alt={project.name}
            width={800}
            height={320}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '320px',
              borderRadius: '6px',
              marginBottom: '1.2rem',
              objectFit: 'cover'
            }}
            priority={true}
          />
        )}
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          {project.name}
        </h1>
        <div style={{ color: 'var(--color-secondary)', fontSize: '1em', marginBottom: '0.7em' }}>
          {project.date}
          {project.status && (
            <span className={`project-status status-${project.status}`} style={{ marginLeft: '1rem' }}>
              {project.status === 'active' ? '活跃' :
               project.status === 'beta' ? '测试' :
               project.status === 'archived' ? '归档' : project.status}
            </span>
          )}
        </div>
        
        <p style={{ color: 'var(--color-text)', marginBottom: '1.2rem', fontSize: '1.1rem' }}>
          {project.description}
        </p>
        
        <div className="project-links" style={{ marginBottom: '1.2rem' }}>
          <a 
            href={project.repo} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="project-link"
          >
            <span className="link-icon">📁</span>
            <span>源码</span>
          </a>
          {project.demo && (
            <a 
              href={project.demo} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="project-link"
            >
              <span className="link-icon">🚀</span>
              <span>演示</span>
            </a>
          )}
          {project.star && project.star > 0 && (
            <span className="project-stars" style={{ marginLeft: '1rem' }}>
              <span className="star-icon">⭐</span>
              <span>{project.star}</span>
            </span>
          )}
        </div>
        
        {project.tags && project.tags.length > 0 && (
          <div style={{ marginBottom: '1.2em' }}>
            {project.tags.map(tag => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        )}
        
        <div style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>
          <MDXRemote source={project.content} />
        </div>
      </article>
    </main>
  );
}