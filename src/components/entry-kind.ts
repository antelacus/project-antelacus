import type { ContentType } from '@/lib/server/database.types';

// The navigation's name for each type is also what an entry is called when types are mixed.
export const KIND_MESSAGE: Record<ContentType, 'posts' | 'notes' | 'gallery' | 'projects'> = {
  post: 'posts',
  note: 'notes',
  gallery: 'gallery',
  project: 'projects',
};
