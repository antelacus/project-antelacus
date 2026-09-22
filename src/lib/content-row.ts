import type { ContentStatus, Json } from '@/lib/server/database.types';

// The row every content type shares, as the repo selects it (columns plus the tag relation). A type's
// own relation (gallery images, project links) is added by that type's row type.
export type TagJoinRow = {
  content_tags: {
    name: string;
  } | null;
};

export type ContentRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  locale: string;
  cover_image_url: string | null;
  extra_metadata: Json | null;
  content_item_tags?: TagJoinRow[] | null;
};

export function metadataValue(metadata: Json | null, key: string): Json | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  return metadata[key];
}

export function stringMetadata(metadata: Json | null, key: string): string | undefined {
  const value = metadataValue(metadata, key);
  return typeof value === 'string' ? value : undefined;
}

export function numberMetadata(metadata: Json | null, key: string): number | undefined {
  const value = metadataValue(metadata, key);

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function tagNames(row: ContentRow): string[] {
  return (row.content_item_tags ?? [])
    .map((entry) => entry.content_tags?.name?.trim())
    .filter((value): value is string => Boolean(value));
}

// The date a page shows: an explicit display date wins, then publication, then the last edit.
export function displayDate(row: ContentRow): string {
  return stringMetadata(row.extra_metadata, 'displayDate')
    ?? row.published_at
    ?? row.updated_at;
}
