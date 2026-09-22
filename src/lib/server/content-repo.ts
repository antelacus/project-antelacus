import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { CONTENT_TYPES, type FullOf, type MetaOf, type RowOf } from '@/lib/content-types';
import type { ContentStatus, ContentType, Database, Json } from '@/lib/server/database.types';

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
  seo_title,
  seo_description,
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

export type AdminSummary = { id: string; slug: string; title: string; status: ContentStatus; locale: string; updated_at: string };

// What the admin's list and dashboard need — never the bodies or relations.
export async function listAdminSummaries(client: ContentClient, type: ContentType): Promise<AdminSummary[]> {
  const { data, error } = await client
    .from('content_items')
    .select('id, slug, title, status, locale, updated_at')
    .eq('content_type', type)
    .order('updated_at', { ascending: false });

  if (error) fail(`list admin ${type}s`, error);

  return (data ?? []) as AdminSummary[];
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
  seoTitle?: string;
  seoDescription?: string;
  /** The row's existing extra_metadata; keys the editor has no field for survive a save. */
  metadata?: Record<string, unknown>;
  images?: { storage_path: string; public_url: string; alt_text?: string | null; sort_order?: number; captured_at?: string | null }[];
  links?: { label: string; url: string; link_type: 'repository' | 'demo' | 'reference' | 'other' }[];
};

// An edit carries the row's metadata back in; only the display date is the editor's to set or clear.
function mergeMetadata(existing: Record<string, unknown> | undefined, displayDate: string | undefined): Record<string, unknown> {
  const { displayDate: _previous, ...rest } = existing ?? {};
  void _previous;
  return displayDate ? { ...rest, displayDate } : rest;
}

const normalizeTags = (tags: string[]) => Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));

// One transaction on the database side (supabase/migrations/…_save_content_item.sql): the row and all
// of its relations land together or not at all. What the function does with ids, natural keys,
// publication dates and covers is documented there, once.
export async function saveContent(client: ContentClient, type: ContentType, input: SaveContentInput): Promise<{ id: string; slug: string; tags: string[] }> {
  const tags = normalizeTags(input.tags);
  const payload = {
    id: input.id || null,
    content_type: type,
    slug: input.slug,
    title: input.title,
    summary: input.summary || null,
    body_markdown: input.content,
    status: input.status,
    published_at: input.displayDate || null,
    locale: input.lang,
    cover_image_url: input.cover || null,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    extra_metadata: mergeMetadata(input.metadata, input.displayDate),
    tags,
    images: input.images ?? [],
    links: input.links ?? [],
  };

  // The metadata is JSON by construction (it came out of the row); the payload type just cannot say so.
  const { data, error } = await client.rpc('save_content_item', { payload: payload as unknown as Json });
  if (error || !data) fail(`save ${type}`, error);

  const row = data as unknown as { id: string; slug: string };
  return { id: row.id, slug: row.slug, tags };
}

// The raw row (with its relation) for the editor, which needs ids and storage paths the mappers drop.
export async function getAdminRow<K extends ContentType>(client: ContentClient, type: K, slug: string): Promise<RowOf<K> | null> {
  const { data, error } = await client
    .from('content_items')
    .select(selectFor(type))
    .eq('content_type', type)
    .eq('slug', slug)
    .maybeSingle();

  if (error) fail(`load admin ${type} row "${slug}"`, error);

  return (data ?? null) as unknown as RowOf<K> | null;
}
