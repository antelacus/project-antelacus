"use client";
import ProjectCard from './ProjectCard';
import { ProjectMeta } from '../lib/projects';

interface ClientProjectCardProps {
  project: ProjectMeta;
}

/**
 * Client-side wrapper for ProjectCard to handle navigation tracking
 * This ensures the onClick handler works in Server Component contexts
 */
export default function ClientProjectCard({ project }: ClientProjectCardProps) {
  return <ProjectCard project={project} />;
}