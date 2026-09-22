import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import {
  getPublishedPostBySlug,
  getPublishedPosts,
} from './server/posts-repo';
import type { Post, PostMeta } from './post-types';
import { DATA_CACHE_SECONDS } from './cache-lifetime';

export type { Post, PostMeta } from './post-types';

const getAllPostsMetaUncached = async (): Promise<PostMeta[]> => {
  return getPublishedPosts();
};

export const getAllPostsMeta = () =>
  unstable_cache(
    getAllPostsMetaUncached,
    ['posts-meta', 'dynamic-content-v5'],
    {
      revalidate: DATA_CACHE_SECONDS,
      tags: ['posts'],
    },
  )();

const getPostBySlugUncached = async (slug: string): Promise<Post | null> => {
  return getPublishedPostBySlug(slug);
};

export const getPostBySlug = (slug: string) =>
  cache(
    unstable_cache(
      getPostBySlugUncached,
      ['post', 'dynamic-content-v5'],
      {
        revalidate: DATA_CACHE_SECONDS,
        tags: ['posts'],
      },
    ),
  )(slug);
