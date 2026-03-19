import 'server-only';

import type { Photo, PhotoMeta, PhotoRecordRow } from '@/lib/photo-types';
import { mapPhotoRecordToPhoto, mapPhotoRecordToPhotoMeta } from '@/lib/photo-types';
import { createSupabasePublicServerClient } from '@/lib/supabase/public-server';

async function listPublishedPhotoRecords(): Promise<PhotoRecordRow[]> {
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
      ),
      gallery_images (
        storage_path,
        public_url,
        alt_text,
        sort_order,
        captured_at,
        created_at
      )
    `)
    .eq('content_type', 'gallery')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load published gallery items from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? []) as unknown as PhotoRecordRow[];
}

async function getPublishedPhotoRecordBySlug(slug: string): Promise<PhotoRecordRow | null> {
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
      ),
      gallery_images (
        storage_path,
        public_url,
        alt_text,
        sort_order,
        captured_at,
        created_at
      )
    `)
    .eq('content_type', 'gallery')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load gallery "${slug}" from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? null) as unknown as PhotoRecordRow | null;
}

export async function getPublishedGalleryItems(): Promise<PhotoMeta[]> {
  const rows = await listPublishedPhotoRecords();
  return rows.map(mapPhotoRecordToPhotoMeta);
}

export async function getPublishedGalleryItemBySlug(slug: string): Promise<Photo | null> {
  const row = await getPublishedPhotoRecordBySlug(slug);
  return row ? mapPhotoRecordToPhoto(row) : null;
}
