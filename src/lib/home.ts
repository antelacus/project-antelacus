import type { Entry } from './entry';
import type { ContentType } from './server/database.types';

// A home window: the newest item of one type. It has no cover field at all — only the photo window
// carries an image, the album's cover — so a post or project cover cannot reach the home page.
export type HomeWindow = Omit<Entry, 'cover' | 'coverAlt'> & { image?: string; imageAlt?: string };

// The photo first: it is the large window, the others stand beside it.
const ORDER: ContentType[] = ['gallery', 'post', 'note', 'project'];

/** One window per type that has anything published; an empty type is simply absent, not filled in. */
export function selectWindows(byType: Record<ContentType, Entry[]>): HomeWindow[] {
  return ORDER.flatMap((type) => {
    const newest = [...byType[type]].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!newest) return [];
    const { cover, coverAlt, ...rest } = newest;
    return [type === 'gallery' ? { ...rest, image: cover, imageAlt: coverAlt } : rest];
  });
}
