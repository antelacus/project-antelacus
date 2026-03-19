import 'server-only';

import type { Post, PostMeta, PostRecordRow } from '@/lib/post-types';
import { mapPostRecordToPost, mapPostRecordToPostMeta } from '@/lib/post-types';
import { createSupabasePublicServerClient } from '@/lib/supabase/public-server';

async function listPublishedPostRecords(): Promise<PostRecordRow[]> {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      slug,
      title,
      summary,
      body_markdown,
      status,
      published_at,
      created_at,
      updated_at,
      locale,
      cover_image_url,
      extra_metadata,
      content_item_tags (
        content_tags (
          name
        )
      )
    `)
    .eq('content_type', 'post')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load published posts from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? []) as unknown as PostRecordRow[];
}

async function getPublishedPostRecordBySlug(slug: string): Promise<PostRecordRow | null> {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      slug,
      title,
      summary,
      body_markdown,
      status,
      published_at,
      created_at,
      updated_at,
      locale,
      cover_image_url,
      extra_metadata,
      content_item_tags (
        content_tags (
          name
        )
      )
    `)
    .eq('content_type', 'post')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load post "${slug}" from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? null) as unknown as PostRecordRow | null;
}

export async function getPublishedPosts(): Promise<PostMeta[]> {
  const rows = await listPublishedPostRecords();
  return rows.map(mapPostRecordToPostMeta);
}

export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const row = await getPublishedPostRecordBySlug(slug);
  return row ? mapPostRecordToPost(row) : null;
}
