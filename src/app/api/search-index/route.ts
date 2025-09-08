import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

type ContentType = 'post' | 'note' | 'photo' | 'project';

interface SearchIndexItem {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  date: string;
  locale: string;
  cover?: string;
}

export async function GET() {
  try {
    const postsDir = path.join(process.cwd(), 'src/content/posts');
    const notesDir = path.join(process.cwd(), 'src/content/notes');
    const galleryDir = path.join(process.cwd(), 'src/content/gallery');
    const projectsDir = path.join(process.cwd(), 'src/content/projects');

    const readDir = async (dir: string) => (await fs.readdir(dir)).filter(f => f.endsWith('.mdx'));
    const [postFiles, noteFiles, galleryFiles, projectFiles] = await Promise.all([
      readDir(postsDir), readDir(notesDir), readDir(galleryDir), readDir(projectsDir)
    ]);

    const locale = 'zh';
    const items: SearchIndexItem[] = [];

    for (const file of postFiles) {
      const slug = file.replace(/\.mdx$/, '');
      const raw = await fs.readFile(path.join(postsDir, file), 'utf-8');
      const { data } = matter(raw);
      items.push({ id: `post:${slug}`, type: 'post', slug, title: (data as any).title, summary: (data as any).summary, tags: (data as any).tags || [], date: (data as any).date, locale, cover: (data as any).cover });
    }
    for (const file of noteFiles) {
      const slug = file.replace(/\.mdx$/, '');
      const raw = await fs.readFile(path.join(notesDir, file), 'utf-8');
      const { data } = matter(raw);
      items.push({ id: `note:${slug}`, type: 'note', slug, title: (data as any).title, summary: (data as any).summary, tags: (data as any).tags || [], date: (data as any).date, locale });
    }
    for (const file of galleryFiles) {
      const slug = file.replace(/\.mdx$/, '');
      const raw = await fs.readFile(path.join(galleryDir, file), 'utf-8');
      const { data } = matter(raw);
      const imageFolder = (data as any).imageFolder || slug;
      let cover: string | undefined = undefined;
      try {
        const dirPath = path.join(process.cwd(), 'public/images/gallery', imageFolder);
        const files = (await fs.readdir(dirPath)).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
        if (files.length > 0) cover = `/images/gallery/${imageFolder}/${files[0]}`;
      } catch {}
      items.push({ id: `photo:${slug}`, type: 'photo', slug, title: (data as any).title, summary: (data as any).caption, tags: (data as any).tags || [], date: (data as any).date, locale, cover });
    }
    for (const file of projectFiles) {
      const slug = file.replace(/\.mdx$/, '');
      const raw = await fs.readFile(path.join(projectsDir, file), 'utf-8');
      const { data } = matter(raw);
      items.push({ id: `project:${slug}`, type: 'project', slug, title: (data as any).name, summary: (data as any).description, tags: (data as any).tags || [], date: (data as any).date, locale, cover: (data as any).cover });
    }

    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}


