"use client";
import Link from 'next/link';
import { ProjectMeta } from '../lib/projects';

interface ProjectCardProps {
  project: ProjectMeta;
  showLinks?: boolean;  // 是否显示源码/演示链接（首页不显示，详情页显示）
  showType?: boolean;   // 是否显示类别标识（首页显示，专门页面不显示）
}

export default function ProjectCard({ project, showLinks = false, showType = true }: ProjectCardProps) {
  const showCover = project.cover && project.cover.trim() !== '';

  const cardContent = (
    <article className="card masonry-item project-card">
      {showCover && (
        <div className="card-cover">
          <img 
            src={project.cover} 
            alt={project.name} 
            className="card-cover-image"
            onError={(e) => {
              const coverDiv = e.currentTarget.parentElement;
              if (coverDiv) {
                coverDiv.style.display = 'none';
              }
            }}
          />
        </div>
      )}
      <div className="card-content">
        <div className="card-meta">
          {showType && <span className="card-type">实验室</span>}
          <time className="card-date">
            {project.date}
          </time>
          {project.status && (
            <span className={`project-status status-${project.status}`}>
              {project.status === 'active' ? '活跃' : 
               project.status === 'beta' ? '测试' : 
               project.status === 'archived' ? '归档' : project.status}
            </span>
          )}
        </div>
        <h2 className="card-title">
          {project.name}
        </h2>
        <p className="card-summary">{project.description}</p>
        
        {showLinks && (
          <div className="project-links">
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
                <span>体验网址</span>
              </a>
            )}
          </div>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="card-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );

  // 如果显示链接（在项目页面），则不包裹Link，避免嵌套a标签
  if (showLinks) {
    return cardContent;
  }

  // 如果不显示链接（在首页），则包裹Link使整个卡片可点击
  return (
    <Link href={`/projects/${project.slug}`} className="card-link">
      {cardContent}
    </Link>
  );
} 