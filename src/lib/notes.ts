import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { DATA_CACHE_SECONDS } from './cache-lifetime';
import { CONTENT_TYPES } from './content-types';
import { getPublished, listPublished, listPublishedSlugs } from './server/content-repo';
import { createSupabasePublicServerClient } from './supabase/public-server';

export type { Note, NoteMeta } from './note-types';

const { tag } = CONTENT_TYPES.note;
const options = { revalidate: DATA_CACHE_SECONDS, tags: [tag] };

export const getAllNotesMeta = unstable_cache(
  () => listPublished(createSupabasePublicServerClient(), 'note'),
  ['notes-meta', 'dynamic-content-v6'],
  options,
);

export const getNoteSlugs = unstable_cache(
  () => listPublishedSlugs(createSupabasePublicServerClient(), 'note'),
  ['notes-slugs', 'dynamic-content-v6'],
  options,
);

export const getNoteBySlug = cache(
  unstable_cache(
    (slug: string) => getPublished(createSupabasePublicServerClient(), 'note', slug),
    ['note', 'dynamic-content-v6'],
    options,
  ),
);
