import type { ContentRow } from '@/lib/content-row';
import { displayDate, tagNames } from '@/lib/content-row';

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

export type PostRecordRow = ContentRow;

export function mapPostRecordToPostMeta(row: PostRecordRow): PostMeta {
  return {
    slug: row.slug,
    title: row.title,
    date: displayDate(row),
    tags: tagNames(row),
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
