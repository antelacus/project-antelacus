import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

export interface NoteMeta {
  slug: string;
  title: string;
  date: string;
  lang?: string;
  summary?: string;
  cover?: string;
  tags?: string[];     // 统一标签系统
}

export interface Note extends NoteMeta {
  content: string;
}

const NOTES_DIR = path.join(process.cwd(), 'src/content/notes');

const getAllNotesMetaUncached = async (): Promise<NoteMeta[]> => {
  const files = await fs.readdir(NOTES_DIR);
  const notes: NoteMeta[] = [];
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const filePath = path.join(NOTES_DIR, file);
    const source = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(source);
    notes.push({
      slug: file.replace(/\.mdx$/, ''),
      title: data.title,
      date: data.date,
      lang: data.lang,
      summary: data.summary,
      cover: data.cover,
      tags: data.tags || [],
    });
  }
  notes.sort((a, b) => b.date.localeCompare(a.date));
  return notes;
};

export const getAllNotesMeta = unstable_cache(
  getAllNotesMetaUncached,
  ['notes-meta'],
  {
    revalidate: 3600,
    tags: ['notes']
  }
);

const getNoteBySlugUncached = async (slug: string): Promise<Note | null> => {
  const filePath = path.join(NOTES_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    return {
      slug,
      title: data.title,
      date: data.date,
      lang: data.lang,
      summary: data.summary,
      cover: data.cover,
      tags: data.tags || [],
      content,
    };
  } catch {
    return null;
  }
};

export const getNoteBySlug = cache(
  unstable_cache(
    getNoteBySlugUncached,
    ['note'],
    {
      revalidate: 7200,
      tags: ['notes']
    }
  )
); 