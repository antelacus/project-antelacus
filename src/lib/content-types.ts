import type { ContentType } from '@/lib/server/database.types';
import type { Note, NoteMeta, NoteRecordRow } from '@/lib/note-types';
import { mapNoteRecordToNote, mapNoteRecordToNoteMeta } from '@/lib/note-types';
import type { Photo, PhotoMeta, PhotoRecordRow } from '@/lib/photo-types';
import { mapPhotoRecordToPhoto, mapPhotoRecordToPhotoMeta } from '@/lib/photo-types';
import type { Post, PostMeta, PostRecordRow } from '@/lib/post-types';
import { mapPostRecordToPost, mapPostRecordToPostMeta } from '@/lib/post-types';
import type { Project, ProjectMeta, ProjectRecordRow } from '@/lib/project-types';
import { mapProjectRecordToProject, mapProjectRecordToProjectMeta } from '@/lib/project-types';

// What differs between the four content types, in one place: the repo, the loaders and the admin
// all read it here instead of each carrying its own copy. Adding a type is adding a row.
export type ContentShapes = {
  post: { row: PostRecordRow; meta: PostMeta; full: Post };
  note: { row: NoteRecordRow; meta: NoteMeta; full: Note };
  gallery: { row: PhotoRecordRow; meta: PhotoMeta; full: Photo };
  project: { row: ProjectRecordRow; meta: ProjectMeta; full: Project };
};

export type RowOf<K extends ContentType> = ContentShapes[K]['row'];
export type MetaOf<K extends ContentType> = ContentShapes[K]['meta'];
export type FullOf<K extends ContentType> = ContentShapes[K]['full'];

export type ContentTypeSpec<K extends ContentType> = {
  /** The cache tag every reader of this type goes through and every writer invalidates. */
  tag: string;
  /** The public section under /<locale>/. */
  section: string;
  /** The relation this type selects in addition to the shared columns and tags; empty when none. */
  relations: string;
  mapMeta: (row: RowOf<K>) => MetaOf<K>;
  mapFull: (row: RowOf<K>) => FullOf<K>;
};

export const CONTENT_TYPES: { [K in ContentType]: ContentTypeSpec<K> } = {
  post: { tag: 'posts', section: 'posts', relations: '', mapMeta: mapPostRecordToPostMeta, mapFull: mapPostRecordToPost },
  note: { tag: 'notes', section: 'notes', relations: '', mapMeta: mapNoteRecordToNoteMeta, mapFull: mapNoteRecordToNote },
  gallery: {
    tag: 'gallery',
    section: 'gallery',
    relations: 'gallery_images ( storage_path, public_url, alt_text, sort_order, captured_at, created_at )',
    mapMeta: mapPhotoRecordToPhotoMeta,
    mapFull: mapPhotoRecordToPhoto,
  },
  project: {
    tag: 'projects',
    section: 'projects',
    relations: 'project_links ( label, url, link_type )',
    mapMeta: mapProjectRecordToProjectMeta,
    mapFull: mapProjectRecordToProject,
  },
};

export const CONTENT_TYPE_KEYS = Object.keys(CONTENT_TYPES) as ContentType[];
