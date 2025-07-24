import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

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

// 缓存所有文章元数据，缓存1小时
const getAllPostsMetaUncached = async (): Promise<PostMeta[]> => {
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
};

export const getAllPostsMeta = unstable_cache(
  getAllPostsMetaUncached,
  ['posts-meta'],
  {
    revalidate: 3600, // 1小时缓存
    tags: ['posts']
  }
);

// 缓存单个文章数据，缓存2小时
const getPostBySlugUncached = async (slug: string): Promise<Post | null> => {
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
};

export const getPostBySlug = cache(
  unstable_cache(
    getPostBySlugUncached,
    ['post'],
    {
      revalidate: 7200, // 2小时缓存
      tags: ['posts']
    }
  )
); 