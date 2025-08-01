"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ProjectMeta } from '../lib/projects';
import { useState } from 'react';

interface ProjectCardProps {
  project: ProjectMeta;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'beta': return '测试';
      case 'archived': return '归档';
      default: return status;
    }
  };

  return (
    <Link 
      href={`/projects/${project.slug}`} 
      className="block p-4 rounded-md transition-colors duration-300"
      style={{ backgroundColor: isHovered ? 'var(--color-wash-stone)' : 'transparent' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      prefetch={true}
    >
      <article>
        {project.cover && (
          <div className="mb-4">
            <Image
              src={project.cover}
              alt={project.name}
              width={400}
              height={225} // 16:9 aspect ratio
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <header>
          <h2 className="text-xl font-normal mb-1">{project.name}</h2>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            <span>{project.date}</span>
            {project.status && (
              <>
                <span className="mx-2">|</span>
                <span>{getStatusLabel(project.status)}</span>
              </>
            )}
          </div>
        </header>
        <p className="mt-2 text-sm" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{project.description}</p>
        
        <footer 
          className="mt-3 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={project.repo} target="_blank" rel="noopener noreferrer" className="hover:text-[--color-seal]">
              📁 源码
            </a>
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noopener noreferrer" className="hover:text-[--color-seal]">
                🚀 演示
              </a>
            )}
          </div>
          <div className="mt-2">
            {project.tags?.map(tag => (
              <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
            ))}
          </div>
        </footer>
      </article>
    </Link>
  );
}
