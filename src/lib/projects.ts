import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface ProjectMeta {
  slug: string;
  name: string;
  description: string;
  repo: string;
  tags?: string[];
  star?: number;
}

export interface Project extends ProjectMeta {
  content: string;
}

const PROJECTS_DIR = path.join(process.cwd(), 'src/content/projects');

export async function getAllProjectsMeta(): Promise<ProjectMeta[]> {
  const files = await fs.readdir(PROJECTS_DIR);
  const projects: ProjectMeta[] = [];
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const filePath = path.join(PROJECTS_DIR, file);
    const source = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(source);
    projects.push({
      slug: file.replace(/\.mdx$/, ''),
      name: data.name,
      description: data.description,
      repo: data.repo,
      tags: data.tags || [],
      star: data.star,
    });
  }
  return projects;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const filePath = path.join(PROJECTS_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    return {
      slug,
      name: data.name,
      description: data.description,
      repo: data.repo,
      tags: data.tags || [],
      star: data.star,
      content,
    };
  } catch (e) {
    return null;
  }
} 