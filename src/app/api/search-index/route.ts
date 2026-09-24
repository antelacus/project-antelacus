import { NextResponse } from 'next/server';

import { getAllPhotosMeta } from '@/lib/gallery';
import { getAllNotesMeta } from '@/lib/notes';
import { getAllPostsMeta } from '@/lib/posts';
import { getAllProjectsMeta } from '@/lib/projects';

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
  lang: string;
}

export async function GET() {
  try {
    const locale = 'zh';
    const [posts, notes, photos, projects] = await Promise.all([
      getAllPostsMeta(),
      getAllNotesMeta(),
      getAllPhotosMeta(),
      getAllProjectsMeta(),
    ]);

    const items: SearchIndexItem[] = [
      ...posts.map((post) => ({
        id: `post:${post.slug}`,
        type: 'post' as const,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        tags: post.tags || [],
        date: post.date || '',
        locale,
        cover: post.cover,
        lang: post.lang,
      })),
      ...notes.map((note) => ({
        id: `note:${note.slug}`,
        type: 'note' as const,
        slug: note.slug,
        title: note.title,
        summary: note.summary,
        tags: note.tags || [],
        date: note.date || '',
        locale,
        cover: note.cover,
        lang: note.lang,
      })),
      ...photos.map((photo) => ({
        id: `photo:${photo.slug}`,
        type: 'photo' as const,
        slug: photo.slug,
        title: photo.title,
        summary: photo.caption,
        tags: photo.tags || [],
        date: photo.date || '',
        locale,
        cover: photo.coverImage,
        lang: photo.lang,
      })),
      ...projects.map((project) => ({
        id: `project:${project.slug}`,
        type: 'project' as const,
        slug: project.slug,
        title: project.name,
        summary: project.description,
        tags: project.tags || [],
        date: project.date || '',
        locale,
        cover: project.cover,
        lang: project.lang,
      })),
    ];

    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Never the database's own words: this endpoint is public.
    return NextResponse.json({ error: 'unavailable' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
