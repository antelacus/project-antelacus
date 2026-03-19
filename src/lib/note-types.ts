import type { Json } from '@/lib/server/database.types';

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

export type TagJoinRow = {
  content_tags: {
    name: string;
  } | null;
};

export type NoteRecordRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  locale: string;
  cover_image_url: string | null;
  extra_metadata: Json | null;
  content_item_tags?: TagJoinRow[] | null;
};

function extractMetadataValue(metadata: Json | null, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function getNoteTags(row: NoteRecordRow): string[] {
  return (row.content_item_tags ?? [])
    .map((entry) => entry.content_tags?.name?.trim())
    .filter((value): value is string => Boolean(value));
}

function resolveDisplayDate(row: NoteRecordRow): string {
  return extractMetadataValue(row.extra_metadata, 'displayDate')
    ?? row.published_at
    ?? row.updated_at;
}

export function mapNoteRecordToNoteMeta(row: NoteRecordRow): NoteMeta {
  return {
    slug: row.slug,
    title: row.title,
    date: resolveDisplayDate(row),
    lang: row.locale,
    summary: row.summary ?? undefined,
    cover: row.cover_image_url ?? undefined,
    tags: getNoteTags(row),
  };
}

export function mapNoteRecordToNote(row: NoteRecordRow): Note {
  return {
    ...mapNoteRecordToNoteMeta(row),
    content: row.body_markdown,
  };
}
