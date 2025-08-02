"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ProjectMeta } from '../lib/projects';
import { useState, useEffect } from 'react';

interface ProjectCardProps {
  project: ProjectMeta;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [naturalTilt, setNaturalTilt] = useState('');
  const [inkVariant, setInkVariant] = useState('');

  // Qi Enhancement: Natural Spontaneity - generate subtle randomness
  useEffect(() => {
    const tiltVariants = ['natural-tilt-1', 'natural-tilt-2', 'natural-tilt-3', 'natural-tilt-4', 'natural-tilt-5'];
    const inkVariants = ['ink-variant-1', 'ink-variant-2', 'ink-variant-3', 'ink-variant-4', 'ink-variant-5'];
    
    setNaturalTilt(tiltVariants[Math.floor(Math.random() * tiltVariants.length)]);
    setInkVariant(inkVariants[Math.floor(Math.random() * inkVariants.length)]);
  }, []);

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
      className={`block p-4 rounded-md card-organic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B42A1E] ${naturalTilt}`}
      onClick={() => {
        // Only set navigatedFromHome flag when clicking from homepage
        if (window.location.pathname === '/') {
          sessionStorage.setItem('navigatedFromHome', 'true');
        }
      }}
      style={{ 
        backgroundColor: isHovered ? 'var(--color-wash-stone)' : 'var(--color-paper)',
        transform: isHovered 
          ? 'translateY(-3px) scale(1.01)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 8px 25px rgba(29, 29, 27, 0.12), 0 4px 10px rgba(29, 29, 27, 0.06)' 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`查看实验室项目：${project.name}`}
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
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyDjvZiJzhJ8z5S3dNkEGgZi2eI9a1S3jcJnFqNpKJzGOiMU1rCfE5H2T4xLAAHlPw1N8YO2N5jBBj3sBXXm4dO38g/9k="
            />
          </div>
        )}
        <header>
          <h2 
            className={`text-xl font-normal mb-1 card-title ${inkVariant}`}
            style={{
              color: isHovered ? 'var(--color-ink)' : 'rgba(30, 30, 29, 0.85)',
              transition: 'color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: isHovered ? '0.1s' : '0s',
            }}
          >
            {project.name}
          </h2>
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
          className="mt-3"
          style={{ 
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(project.repo, '_blank', 'noopener,noreferrer');
              }}
              className="hover:text-[--color-seal] bg-transparent border-none p-0 cursor-pointer text-sm"
              style={{ color: 'inherit' }}
            >
              📁 源码
            </button>
            {project.demo && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(project.demo, '_blank', 'noopener,noreferrer');
                }}
                className="hover:text-[--color-seal] bg-transparent border-none p-0 cursor-pointer text-sm"
                style={{ color: 'inherit' }}
              >
                🚀 演示
              </button>
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
