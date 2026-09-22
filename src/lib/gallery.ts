import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { DATA_CACHE_SECONDS } from './cache-lifetime';
import { CONTENT_TYPES } from './content-types';
import { getPublished, listPublished, listPublishedSlugs } from './server/content-repo';
import { createSupabasePublicServerClient } from './supabase/public-server';

export type { Photo, PhotoInfo, PhotoMeta } from './photo-types';

const { tag } = CONTENT_TYPES.gallery;
const options = { revalidate: DATA_CACHE_SECONDS, tags: [tag] };

export const getAllPhotosMeta = unstable_cache(
  () => listPublished(createSupabasePublicServerClient(), 'gallery'),
  ['photos-meta', 'dynamic-content-v6'],
  options,
);

export const getPhotoSlugs = unstable_cache(
  () => listPublishedSlugs(createSupabasePublicServerClient(), 'gallery'),
  ['photos-slugs', 'dynamic-content-v6'],
  options,
);

export const getPhotoBySlug = cache(
  unstable_cache(
    (slug: string) => getPublished(createSupabasePublicServerClient(), 'gallery', slug),
    ['photo', 'dynamic-content-v6'],
    options,
  ),
);
