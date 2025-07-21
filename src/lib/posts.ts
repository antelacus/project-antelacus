import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  cover?: string;
  summary?: string;
}

export interface Post extends PostMeta {
  content: string;
}

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  const files = await fs.readdir(POSTS_DIR);
  const posts: PostMeta[] = [];
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const filePath = path.join(POSTS_DIR, file);
    const source = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(source);
    posts.push({
      slug: file.replace(/\.mdx$/, ''),
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      cover: data.cover,
      summary: data.summary,
    });
  }
  // 按日期倒序排列
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    return {
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      cover: data.cover,
      summary: data.summary,
      content,
    };
  } catch (e) {
    return null;
  }
} 