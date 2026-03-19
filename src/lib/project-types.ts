import type { Json } from '@/lib/server/database.types';

export interface ProjectMeta {
  slug: string;
  name: string;
  description: string;
  repo: string;
  date: string;
  tags?: string[];
  star?: number;
  status?: string;
  demo?: string;
  cover?: string;
}

export interface Project extends ProjectMeta {
  content: string;
}

export type ProjectTagJoinRow = {
  content_tags: {
    name: string;
  } | null;
};

export type ProjectLinkRow = {
  label: string;
  url: string;
  link_type: 'repository' | 'demo' | 'reference' | 'other';
};

export type ProjectRecordRow = {
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
  content_item_tags?: ProjectTagJoinRow[] | null;
  project_links?: ProjectLinkRow[] | null;
};

function extractMetadataValue(metadata: Json | null, key: string): Json | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  return metadata[key];
}

function getStringMetadataValue(metadata: Json | null, key: string): string | undefined {
  const value = extractMetadataValue(metadata, key);
  return typeof value === 'string' ? value : undefined;
}

function getNumberMetadataValue(metadata: Json | null, key: string): number | undefined {
  const value = extractMetadataValue(metadata, key);

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getProjectTags(row: ProjectRecordRow): string[] {
  return (row.content_item_tags ?? [])
    .map((entry) => entry.content_tags?.name?.trim())
    .filter((value): value is string => Boolean(value));
}

function getProjectLink(row: ProjectRecordRow, type: ProjectLinkRow['link_type']): string | undefined {
  return row.project_links?.find((link) => link.link_type === type)?.url;
}

function resolveDisplayDate(row: ProjectRecordRow): string {
  return getStringMetadataValue(row.extra_metadata, 'displayDate')
    ?? row.published_at
    ?? row.updated_at;
}

export function mapProjectRecordToProjectMeta(row: ProjectRecordRow): ProjectMeta {
  return {
    slug: row.slug,
    name: row.title,
    description: row.summary ?? '',
    repo: getProjectLink(row, 'repository') ?? getStringMetadataValue(row.extra_metadata, 'repo') ?? '',
    date: resolveDisplayDate(row),
    tags: getProjectTags(row),
    star: getNumberMetadataValue(row.extra_metadata, 'star'),
    status: getStringMetadataValue(row.extra_metadata, 'status'),
    demo: getProjectLink(row, 'demo') ?? getStringMetadataValue(row.extra_metadata, 'demo'),
    cover: row.cover_image_url ?? undefined,
  };
}

export function mapProjectRecordToProject(row: ProjectRecordRow): Project {
  return {
    ...mapProjectRecordToProjectMeta(row),
    content: row.body_markdown,
  };
}
