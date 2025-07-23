import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface NoteMeta {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  cover?: string;
  tags?: string[];     // 统一标签系统
}

export interface Note extends NoteMeta {
  content: string;
}

const NOTES_DIR = path.join(process.cwd(), 'src/content/notes');

export async function getAllNotesMeta(): Promise<NoteMeta[]> {
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
      summary: data.summary,
      cover: data.cover,
      tags: data.tags || [],
    });
  }
  notes.sort((a, b) => b.date.localeCompare(a.date));
  return notes;
}

export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const filePath = path.join(NOTES_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    return {
      slug,
      title: data.title,
      date: data.date,
      summary: data.summary,
      cover: data.cover,
      tags: data.tags || [],
      content,
    };
  } catch (e) {
    return null;
  }
} 