import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import {
  getPublishedProjectBySlug,
  getPublishedProjects,
} from './server/projects-repo';
import type { Project, ProjectMeta } from './project-types';
import { DATA_CACHE_SECONDS } from './cache-lifetime';

export type { Project, ProjectMeta } from './project-types';

const getAllProjectsMetaUncached = async (): Promise<ProjectMeta[]> => {
  return getPublishedProjects();
};

export const getAllProjectsMeta = unstable_cache(
  getAllProjectsMetaUncached,
  ['projects-meta', 'dynamic-content-v5'],
  {
    revalidate: DATA_CACHE_SECONDS,
    tags: ['projects'],
  },
);

const getProjectBySlugUncached = async (slug: string): Promise<Project | null> => {
  return getPublishedProjectBySlug(slug);
};

export const getProjectBySlug = cache(
  unstable_cache(
    getProjectBySlugUncached,
    ['project', 'dynamic-content-v5'],
    {
      revalidate: DATA_CACHE_SECONDS,
      tags: ['projects'],
    },
  ),
);
