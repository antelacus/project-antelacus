import { CONTENT_TYPES } from './content-types';
import type { ContentType } from './server/database.types';
import type { NoteMeta } from './note-types';
import type { PhotoMeta } from './photo-types';
import type { PostMeta } from './post-types';
import type { ProjectMeta } from './project-types';

// The one shape the shared components (window, catalog row, photo tile, search result) accept. Each
// content type's own domain object is adapted here, so a component never learns four vocabularies.
export type Entry = {
  type: ContentType;
  slug: string;
  /** Without the locale prefix; the site's link component adds it. */
  href: string;
  title: string;
  summary?: string;
  /** As stored (ISO); components format it. */
  date: string;
  tags: string[];
  /** The language it is written in. */
  lang: string;
  /** The item's cover. Only a photo may show it outside the item's own page (REQ §5.2-f). */
  cover?: string;
  coverAlt?: string;
};

const href = (type: ContentType, slug: string) => `/${CONTENT_TYPES[type].section}/${slug}`;

export const fromPost = (post: PostMeta): Entry => ({
  type: 'post', slug: post.slug, href: href('post', post.slug), title: post.title, summary: post.summary,
  date: post.date, tags: post.tags, lang: post.lang, cover: post.cover,
});

export const fromNote = (note: NoteMeta): Entry => ({
  type: 'note', slug: note.slug, href: href('note', note.slug), title: note.title, summary: note.summary,
  date: note.date, tags: note.tags ?? [], lang: note.lang, cover: note.cover,
});

export const fromPhoto = (album: PhotoMeta): Entry => ({
  type: 'gallery', slug: album.slug, href: href('gallery', album.slug), title: album.title, summary: album.caption,
  date: album.date, tags: album.tags ?? [], lang: album.lang, cover: album.coverImage || undefined,
  coverAlt: album.photos.find((photo) => photo.path === album.coverImage)?.caption,
});

export const fromProject = (project: ProjectMeta): Entry => ({
  type: 'project', slug: project.slug, href: href('project', project.slug), title: project.name, summary: project.description || undefined,
  date: project.date, tags: project.tags ?? [], lang: project.lang, cover: project.cover,
});
