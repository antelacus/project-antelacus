import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { DATA_CACHE_SECONDS } from './cache-lifetime';
import { pickPageLocale } from './page-locale';
import { listPublishedPageVersions } from './server/pages-repo';
import { createSupabasePublicServerClient } from './supabase/public-server';

// The cache tag of every standalone page; the admin's page save expires it.
export const PAGES_TAG = 'pages';

// The standalone pages that exist. The database takes any slug; the admin accepts only these.
export const PAGE_SLUGS = ['about'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

// One entry per page holding all its published languages, so a save refreshes every language at once —
// including those that fall back to the saved one.
const getPublishedVersions = cache(
  unstable_cache(
    (slug: string) => listPublishedPageVersions(createSupabasePublicServerClient(), slug),
    ['page-versions', 'site-pages-v1'],
    { revalidate: DATA_CACHE_SECONDS, tags: [PAGES_TAG] },
  ),
);

export type Page = { lang: string; title: string; body: string };

/** The page in the visitor's language, else the fallback (page-locale.ts); `lang` is the version's own. */
export async function getPage(slug: string, locale: string): Promise<Page | null> {
  const versions = await getPublishedVersions(slug);
  const lang = pickPageLocale(versions.map((v) => v.locale), locale);
  const version = versions.find((v) => v.locale === lang);
  return version ? { lang: version.locale, title: version.title, body: version.body_markdown } : null;
}

export async function hasPublishedPage(slug: string): Promise<boolean> {
  return (await getPublishedVersions(slug)).length > 0;
}
