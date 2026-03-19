import 'server-only';

import type { Note, NoteMeta, NoteRecordRow } from '@/lib/note-types';
import { mapNoteRecordToNote, mapNoteRecordToNoteMeta } from '@/lib/note-types';
import { createSupabasePublicServerClient } from '@/lib/supabase/public-server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

export type AdminNoteInput = {
  id?: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;
  tags: string[];
  lang: string;
  cover?: string;
  displayDate?: string;
  status: 'draft' | 'published';
};

async function listPublishedNoteRecords(): Promise<NoteRecordRow[]> {
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
    .eq('content_type', 'note')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load published notes from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? []) as unknown as NoteRecordRow[];
}

async function getPublishedNoteRecordBySlug(slug: string): Promise<NoteRecordRow | null> {
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
    .eq('content_type', 'note')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load note "${slug}" from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? null) as unknown as NoteRecordRow | null;
}

export async function getPublishedNotes(): Promise<NoteMeta[]> {
  const rows = await listPublishedNoteRecords();
  return rows.map(mapNoteRecordToNoteMeta);
}

export async function getPublishedNoteBySlug(slug: string): Promise<Note | null> {
  const row = await getPublishedNoteRecordBySlug(slug);
  return row ? mapNoteRecordToNote(row) : null;
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function parseTagInput(tags: string[] | string): string[] {
  if (Array.isArray(tags)) {
    return normalizeTags(tags);
  }

  return normalizeTags(tags.split(','));
}

function buildExtraMetadata(input: AdminNoteInput): Record<string, string> {
  const metadata: Record<string, string> = {};

  if (input.displayDate) {
    metadata.displayDate = input.displayDate;
  }

  return metadata;
}

export async function listAdminNotes(): Promise<NoteRecordRow[]> {
  const supabase = createSupabaseServiceRoleClient();
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
    .eq('content_type', 'note')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list admin notes: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? []) as unknown as NoteRecordRow[];
}

export async function getAdminNoteBySlug(slug: string): Promise<Note | null> {
  const supabase = createSupabaseServiceRoleClient();
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
    .eq('content_type', 'note')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin note "${slug}": ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  const row = (data ?? null) as unknown as NoteRecordRow | null;
  return row ? mapNoteRecordToNote(row) : null;
}

async function upsertTagsForNote(contentItemId: string, tags: string[]) {
  const supabase = createSupabaseServiceRoleClient();
  const normalizedTags = parseTagInput(tags);

  const { error: deleteError } = await supabase
    .from('content_item_tags')
    .delete()
    .eq('content_item_id', contentItemId);

  if (deleteError) {
    throw new Error(`Failed to replace note tags: ${deleteError.message}`);
  }

  if (normalizedTags.length === 0) {
    return normalizedTags;
  }

  const { error: tagUpsertError } = await supabase
    .from('content_tags')
    .upsert(
      normalizedTags.map((tag) => ({
        name: tag,
        slug: tag.toLowerCase(),
      })),
      { onConflict: 'slug' },
    );

  if (tagUpsertError) {
    throw new Error(`Failed to upsert note tags: ${tagUpsertError.message}`);
  }

  const { data: tagRows, error: tagFetchError } = await supabase
    .from('content_tags')
    .select('id, name')
    .in('name', normalizedTags);

  if (tagFetchError) {
    throw new Error(`Failed to load note tag ids: ${tagFetchError.message}`);
  }

  const { error: relationError } = await supabase
    .from('content_item_tags')
    .insert(
      (tagRows ?? []).map((tag) => ({
        content_item_id: contentItemId,
        tag_id: tag.id,
      })),
    );

  if (relationError) {
    throw new Error(`Failed to attach note tags: ${relationError.message}`);
  }

  return normalizedTags;
}

export async function saveAdminNote(input: AdminNoteInput): Promise<{ slug: string; tags: string[] }> {
  const supabase = createSupabaseServiceRoleClient();
  const publishDate = input.status === 'published'
    ? (input.displayDate || new Date().toISOString())
    : null;

  const { data, error } = await supabase
    .from('content_items')
    .upsert({
      id: input.id,
      content_type: 'note',
      slug: input.slug,
      title: input.title,
      summary: input.summary || null,
      body_markdown: input.content,
      status: input.status,
      published_at: publishDate,
      locale: input.lang,
      cover_image_url: input.cover || null,
      extra_metadata: buildExtraMetadata(input),
    }, { onConflict: 'id' })
    .select('id, slug')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save note: ${error?.message ?? 'unknown error'}`);
  }

  const tags = await upsertTagsForNote(data.id, input.tags);

  return {
    slug: data.slug,
    tags,
  };
}
