import { NextResponse } from 'next/server';

import type { RouteIndex } from '@/i18n/route-decision';
import { getPhotoSlugs } from '@/lib/gallery';
import { getNoteSlugs } from '@/lib/notes';
import { hasPublishedPage } from '@/lib/pages';
import { getPostSlugs } from '@/lib/posts';
import { getProjectSlugs } from '@/lib/projects';
import { getAllTags } from '@/lib/tags';

// What the proxy looks an address up in before any page runs (routing-slimdown DESIGN §2.2): the same cached
// reads, under the same tags, that the pages decide their own 404 with — so the two agree, and a save that
// invalidates a type updates both. Everything here is public already (sitemap, search index).
export async function GET() {
  try {
    const [posts, notes, gallery, projects, tags, about] = await Promise.all([
      getPostSlugs(),
      getNoteSlugs(),
      getPhotoSlugs(),
      getProjectSlugs(),
      getAllTags(),
      hasPublishedPage('about'),
    ]);
    const index: RouteIndex = { posts, notes, gallery, projects, tags, about };
    return NextResponse.json(index, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Never the database's own words: this endpoint is public.
    return NextResponse.json({ error: 'unavailable' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
