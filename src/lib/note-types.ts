import type { ContentRow } from '@/lib/content-row';
import { displayDate, tagNames } from '@/lib/content-row';

export interface NoteMeta {
  slug: string;
  title: string;
  date: string;
  lang?: string;
  summary?: string;
  cover?: string;
  tags?: string[];
}

export interface Note extends NoteMeta {
  content: string;
}

export type NoteRecordRow = ContentRow;

export function mapNoteRecordToNoteMeta(row: NoteRecordRow): NoteMeta {
  return {
    slug: row.slug,
    title: row.title,
    date: displayDate(row),
    lang: row.locale,
    summary: row.summary ?? undefined,
    cover: row.cover_image_url ?? undefined,
    tags: tagNames(row),
  };
}

export function mapNoteRecordToNote(row: NoteRecordRow): Note {
  return {
    ...mapNoteRecordToNoteMeta(row),
    content: row.body_markdown,
  };
}
