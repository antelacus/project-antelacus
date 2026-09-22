import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import {
  getPublishedGalleryItemBySlug,
  getPublishedGalleryItems,
} from './server/gallery-repo';
import type { Photo, PhotoMeta } from './photo-types';
import { DATA_CACHE_SECONDS } from './cache-lifetime';

export type { Photo, PhotoInfo, PhotoMeta } from './photo-types';

const getAllPhotosMetaUncached = async (): Promise<PhotoMeta[]> => {
  return getPublishedGalleryItems();
};

export const getAllPhotosMeta = unstable_cache(
  getAllPhotosMetaUncached,
  ['photos-meta', 'dynamic-content-v3'],
  {
    revalidate: DATA_CACHE_SECONDS,
    tags: ['gallery'],
  },
);

const getPhotoBySlugUncached = async (slug: string): Promise<Photo | null> => {
  return getPublishedGalleryItemBySlug(slug);
};

export const getPhotoBySlug = cache(
  unstable_cache(
    getPhotoBySlugUncached,
    ['photo', 'dynamic-content-v3'],
    {
      revalidate: DATA_CACHE_SECONDS,
      tags: ['gallery'],
    },
  ),
);
