import type { Json } from '@/lib/server/database.types';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  cover?: string;
  summary?: string;
  lang?: string;
}

export interface Post extends PostMeta {
  content: string;
}

export type PostTagJoinRow = {
  content_tags: {
    name: string;
  } | null;
};

export type PostRecordRow = {
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
  content_item_tags?: PostTagJoinRow[] | null;
};

function extractMetadataValue(metadata: Json | null, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function getPostTags(row: PostRecordRow): string[] {
  return (row.content_item_tags ?? [])
    .map((entry) => entry.content_tags?.name?.trim())
    .filter((value): value is string => Boolean(value));
}

function resolveDisplayDate(row: PostRecordRow): string {
  return extractMetadataValue(row.extra_metadata, 'displayDate')
    ?? row.published_at
    ?? row.updated_at;
}

export function mapPostRecordToPostMeta(row: PostRecordRow): PostMeta {
  return {
    slug: row.slug,
    title: row.title,
    date: resolveDisplayDate(row),
    tags: getPostTags(row),
    cover: row.cover_image_url ?? undefined,
    summary: row.summary ?? undefined,
    lang: row.locale,
  };
}

export function mapPostRecordToPost(row: PostRecordRow): Post {
  return {
    ...mapPostRecordToPostMeta(row),
    content: row.body_markdown,
  };
}
