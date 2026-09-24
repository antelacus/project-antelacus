import 'server-only';

import type { ContentClient } from '@/lib/server/content-repo';
import type { ContentStatus } from '@/lib/server/database.types';

// Every read and write of site_pages. As with content-repo, the caller hands in the client — anonymous
// for the public loader, service-role for the admin — so this module never decides who sees drafts.
// updated_at is the database trigger's business.

export type PublishedPageVersion = { locale: string; title: string; body_markdown: string };
export type PageVersionSummary = { locale: string; title: string; status: ContentStatus; updated_at: string };
export type PageVersion = PageVersionSummary & { slug: string; body_markdown: string };

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Failed to ${what}: ${error?.message ?? 'unknown error'}`);
}

export async function listPublishedPageVersions(client: ContentClient, slug: string): Promise<PublishedPageVersion[]> {
  const { data, error } = await client
    .from('site_pages')
    .select('locale, title, body_markdown')
    .eq('slug', slug)
    .eq('status', 'published');
  if (error) fail(`load page "${slug}"`, error);
  return data ?? [];
}

export async function listPageVersions(client: ContentClient, slug: string): Promise<PageVersionSummary[]> {
  const { data, error } = await client
    .from('site_pages')
    .select('locale, title, status, updated_at')
    .eq('slug', slug);
  if (error) fail(`list page "${slug}"`, error);
  return data ?? [];
}

export async function getPageVersion(client: ContentClient, slug: string, locale: string): Promise<PageVersion | null> {
  const { data, error } = await client
    .from('site_pages')
    .select('slug, locale, title, body_markdown, status, updated_at')
    .eq('slug', slug)
    .eq('locale', locale)
    .maybeSingle();
  if (error) fail(`load page "${slug}" (${locale})`, error);
  return data ?? null;
}

export type SavePageInput = { slug: string; locale: string; title: string; body: string; status: ContentStatus };

// Keyed by page and language: saving a pair that exists replaces it, and the last save wins.
export async function savePageVersion(client: ContentClient, input: SavePageInput): Promise<void> {
  const { error } = await client
    .from('site_pages')
    .upsert({ slug: input.slug, locale: input.locale, title: input.title, body_markdown: input.body, status: input.status }, { onConflict: 'slug,locale' });
  if (error) fail(`save page "${input.slug}" (${input.locale})`, error);
}
