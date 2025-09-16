import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

export interface ProjectMeta {
  slug: string;
  name: string;
  description: string;
  repo: string;
  date: string;         // 项目发布/更新时间
  tags?: string[];      // 项目标签
  star?: number;        // GitHub星数
  status?: string;      // 项目状态（active/archived/beta）
  demo?: string;        // 在线演示链接
  cover?: string;       // 项目封面图
}

export interface Project extends ProjectMeta {
  content: string;
}

const PROJECTS_DIR = path.join(process.cwd(), 'src/content/projects');

const getAllProjectsMetaUncached = async (): Promise<ProjectMeta[]> => {
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
      date: data.date,
      tags: data.tags || [],
      star: data.star,
      status: data.status,
      demo: data.demo,
      cover: data.cover,
    });
  }
  // 按日期倒序排列
  projects.sort((a, b) => b.date.localeCompare(a.date));
  return projects;
};

export const getAllProjectsMeta = unstable_cache(
  getAllProjectsMetaUncached,
  ['projects-meta'],
  {
    revalidate: 3600,
    tags: ['projects']
  }
);

const getProjectBySlugUncached = async (slug: string): Promise<Project | null> => {
  const filePath = path.join(PROJECTS_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    return {
      slug,
      name: data.name,
      description: data.description,
      repo: data.repo,
      date: data.date,
      tags: data.tags || [],
      star: data.star,
      status: data.status,
      demo: data.demo,
      cover: data.cover,
      content,
    };
  } catch {
    return null;
  }
};

export const getProjectBySlug = cache(
  unstable_cache(
    getProjectBySlugUncached,
    ['project'],
    {
      revalidate: 7200,
      tags: ['projects']
    }
  )
); 