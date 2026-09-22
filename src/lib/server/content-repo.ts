import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { CONTENT_TYPES, type FullOf, type MetaOf, type RowOf } from '@/lib/content-types';
import type { ContentStatus, ContentType, Database } from '@/lib/server/database.types';

// Every read and write of content_items, for every type. The client is handed in by the caller —
// the public loaders pass the anonymous client, the admin passes the service-role one it obtained
// through the admin check — so this module never decides who may see what, and a test can pass a fake.
export type ContentClient = SupabaseClient<Database>;

const SHARED_COLUMNS = `
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
  )`;

function selectFor(type: ContentType): string {
  const { relations } = CONTENT_TYPES[type];
  return relations ? `${SHARED_COLUMNS},\n  ${relations}` : SHARED_COLUMNS;
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Failed to ${what}: ${error?.message ?? 'unknown error'}`);
}

export async function listPublished<K extends ContentType>(client: ContentClient, type: K): Promise<MetaOf<K>[]> {
  const { data, error } = await client
    .from('content_items')
    .select(selectFor(type))
    .eq('content_type', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) fail(`load published ${type}s`, error);

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return ((data ?? []) as unknown as RowOf<K>[]).map(CONTENT_TYPES[type].mapMeta);
}

// The slugs alone: the one cheap lookup a detail page makes before deciding whether it exists.
export async function listPublishedSlugs(client: ContentClient, type: ContentType): Promise<string[]> {
  const { data, error } = await client
    .from('content_items')
    .select('slug')
    .eq('content_type', type)
    .eq('status', 'published');

  if (error) fail(`load published ${type} slugs`, error);

  return (data ?? []).map((row) => row.slug);
}

export async function getPublished<K extends ContentType>(client: ContentClient, type: K, slug: string): Promise<FullOf<K> | null> {
  const { data, error } = await client
    .from('content_items')
    .select(selectFor(type))
    .eq('content_type', type)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) fail(`load ${type} "${slug}"`, error);

  const row = (data ?? null) as unknown as RowOf<K> | null;
  return row ? CONTENT_TYPES[type].mapFull(row) : null;
}

export async function listAdmin<K extends ContentType>(client: ContentClient, type: K): Promise<RowOf<K>[]> {
  const { data, error } = await client
    .from('content_items')
    .select(selectFor(type))
    .eq('content_type', type)
    .order('updated_at', { ascending: false });

  if (error) fail(`list admin ${type}s`, error);

  return (data ?? []) as unknown as RowOf<K>[];
}

export async function getAdmin<K extends ContentType>(client: ContentClient, type: K, slug: string): Promise<FullOf<K> | null> {
  const { data, error } = await client
    .from('content_items')
    .select(selectFor(type))
    .eq('content_type', type)
    .eq('slug', slug)
    .maybeSingle();

  if (error) fail(`load admin ${type} "${slug}"`, error);

  const row = (data ?? null) as unknown as RowOf<K> | null;
  return row ? CONTENT_TYPES[type].mapFull(row) : null;
}

export type SaveContentInput = {
  id?: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;
  tags: string[];
  lang: string;
  cover?: string;
  displayDate?: string;
  status: ContentStatus;
};

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

async function replaceTags(client: ContentClient, contentItemId: string, tags: string[]): Promise<string[]> {
  const names = normalizeTags(tags);

  const { error: deleteError } = await client.from('content_item_tags').delete().eq('content_item_id', contentItemId);
  if (deleteError) fail('replace tags', deleteError);
  if (names.length === 0) return names;

  const { error: upsertError } = await client
    .from('content_tags')
    .upsert(names.map((name) => ({ name, slug: name.toLowerCase() })), { onConflict: 'slug' });
  if (upsertError) fail('upsert tags', upsertError);

  const { data: tagRows, error: fetchError } = await client.from('content_tags').select('id, name').in('name', names);
  if (fetchError) fail('load tag ids', fetchError);

  const { error: linkError } = await client
    .from('content_item_tags')
    .insert((tagRows ?? []).map((tag) => ({ content_item_id: contentItemId, tag_id: tag.id })));
  if (linkError) fail('attach tags', linkError);

  return names;
}

export async function saveContent(client: ContentClient, type: ContentType, input: SaveContentInput): Promise<{ id: string; slug: string; tags: string[] }> {
  const publishDate = input.status === 'published' ? (input.displayDate || new Date().toISOString()) : null;

  const { data, error } = await client
    .from('content_items')
    .upsert({
      id: input.id,
      content_type: type,
      slug: input.slug,
      title: input.title,
      summary: input.summary || null,
      body_markdown: input.content,
      status: input.status,
      published_at: publishDate,
      locale: input.lang,
      cover_image_url: input.cover || null,
      extra_metadata: input.displayDate ? { displayDate: input.displayDate } : {},
    }, { onConflict: 'id' })
    .select('id, slug')
    .single();

  if (error || !data) fail(`save ${type}`, error);

  const tags = await replaceTags(client, data.id, input.tags);
  return { id: data.id, slug: data.slug, tags };
}
