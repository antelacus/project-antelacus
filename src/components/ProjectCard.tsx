"use client";
import Link from 'next/link';
import { ProjectMeta } from '../lib/projects';

export default function ProjectCard({ project }: { project: ProjectMeta }) {
  const showCover = project.cover && project.cover.trim() !== '';

  return (
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
          <span className="card-type">实验室</span>
          <time className="card-date">
            {new Date(project.date).toLocaleDateString('zh-CN')}
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
        
        <div className="project-links">
          <a 
            href={project.repo} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="project-link"
            onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => e.stopPropagation()}
            >
              <span className="link-icon">🚀</span>
              <span>演示</span>
            </a>
          )}
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="card-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="card-author">
          <span>AnteLacus</span>
          {project.star && project.star > 0 && (
            <span className="project-stars">
              <span className="star-icon">⭐</span>
              <span>{project.star}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
} 