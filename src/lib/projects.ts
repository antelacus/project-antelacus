import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { DATA_CACHE_SECONDS } from './cache-lifetime';
import { CONTENT_TYPES } from './content-types';
import { getPublished, listPublished, listPublishedSlugs } from './server/content-repo';
import { createSupabasePublicServerClient } from './supabase/public-server';

export type { Project, ProjectMeta } from './project-types';

const { tag } = CONTENT_TYPES.project;
const options = { revalidate: DATA_CACHE_SECONDS, tags: [tag] };

export const getAllProjectsMeta = unstable_cache(
  () => listPublished(createSupabasePublicServerClient(), 'project'),
  ['projects-meta', 'dynamic-content-v6'],
  options,
);

export const getProjectSlugs = unstable_cache(
  () => listPublishedSlugs(createSupabasePublicServerClient(), 'project'),
  ['projects-slugs', 'dynamic-content-v6'],
  options,
);

export const getProjectBySlug = cache(
  unstable_cache(
    (slug: string) => getPublished(createSupabasePublicServerClient(), 'project', slug),
    ['project', 'dynamic-content-v6'],
    options,
  ),
);
