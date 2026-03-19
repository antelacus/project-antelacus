import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import {
  getPublishedProjectBySlug,
  getPublishedProjects,
} from './server/projects-repo';
import type { Project, ProjectMeta } from './project-types';

export type { Project, ProjectMeta } from './project-types';

const getAllProjectsMetaUncached = async (): Promise<ProjectMeta[]> => {
  return getPublishedProjects();
};

export const getAllProjectsMeta = unstable_cache(
  getAllProjectsMetaUncached,
  ['projects-meta', 'dynamic-content-v5'],
  {
    revalidate: 3600,
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
      revalidate: 7200,
      tags: ['projects'],
    },
  ),
);
