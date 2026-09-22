import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
  getPublishedNoteBySlug,
  getPublishedNotes,
} from './server/notes-repo';
import type { Note, NoteMeta } from './note-types';
import { DATA_CACHE_SECONDS } from './cache-lifetime';
export type { Note, NoteMeta } from './note-types';

const getAllNotesMetaUncached = async (): Promise<NoteMeta[]> => {
  return getPublishedNotes();
};

export const getAllNotesMeta = unstable_cache(
  getAllNotesMetaUncached,
  ['notes-meta', 'dynamic-content-v3'],
  {
    revalidate: DATA_CACHE_SECONDS,
    tags: ['notes']
  }
);

const getNoteBySlugUncached = async (slug: string): Promise<Note | null> => {
  return getPublishedNoteBySlug(slug);
};

export const getNoteBySlug = cache(
  unstable_cache(
    getNoteBySlugUncached,
    ['note', 'dynamic-content-v3'],
    {
      revalidate: DATA_CACHE_SECONDS,
      tags: ['notes']
    }
  )
); 
