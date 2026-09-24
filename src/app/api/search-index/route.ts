import { NextResponse } from 'next/server';

import { getAllPhotosMeta } from '@/lib/gallery';
import { getAllNotesMeta } from '@/lib/notes';
import { getAllPostsMeta } from '@/lib/posts';
import { getAllProjectsMeta } from '@/lib/projects';
import { fromNote, fromPhoto, fromPost, fromProject, type Entry } from '@/lib/entry';

// Every published piece as the search dialog shows it. No covers: a search result never shows one
// (REQ §5.2-f), and the index is downloaded whole.
export async function GET() {
  try {
    const [posts, notes, photos, projects] = await Promise.all([
      getAllPostsMeta(),
      getAllNotesMeta(),
      getAllPhotosMeta(),
      getAllProjectsMeta(),
    ]);
    const entries: Entry[] = [...posts.map(fromPost), ...notes.map(fromNote), ...photos.map(fromPhoto), ...projects.map(fromProject)]
      .map((entry) => ({ ...entry, cover: undefined, coverAlt: undefined }));
    return NextResponse.json(entries, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Never the database's own words: this endpoint is public.
    return NextResponse.json({ error: 'unavailable' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
