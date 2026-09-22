import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { DATA_CACHE_SECONDS } from './cache-lifetime';
import { CONTENT_TYPES } from './content-types';
import { getPublished, listPublished, listPublishedSlugs } from './server/content-repo';
import { createSupabasePublicServerClient } from './supabase/public-server';

export type { Post, PostMeta } from './post-types';

const { tag } = CONTENT_TYPES.post;
const options = { revalidate: DATA_CACHE_SECONDS, tags: [tag] };

export const getAllPostsMeta = unstable_cache(
  () => listPublished(createSupabasePublicServerClient(), 'post'),
  ['posts-meta', 'dynamic-content-v6'],
  options,
);

export const getPostSlugs = unstable_cache(
  () => listPublishedSlugs(createSupabasePublicServerClient(), 'post'),
  ['posts-slugs', 'dynamic-content-v6'],
  options,
);

// cache() dedupes within one request; wrapping at module level (not per call) is what makes it work.
export const getPostBySlug = cache(
  unstable_cache(
    (slug: string) => getPublished(createSupabasePublicServerClient(), 'post', slug),
    ['post', 'dynamic-content-v6'],
    options,
  ),
);
