import type { ContentRow } from '@/lib/content-row';
import { displayDate, numberMetadata, stringMetadata, tagNames } from '@/lib/content-row';

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

export type ProjectLinkRow = {
  label: string;
  url: string;
  link_type: 'repository' | 'demo' | 'reference' | 'other';
};

export type ProjectRecordRow = ContentRow & {
  project_links?: ProjectLinkRow[] | null;
};

function getProjectLink(row: ProjectRecordRow, type: ProjectLinkRow['link_type']): string | undefined {
  return row.project_links?.find((link) => link.link_type === type)?.url;
}

export function mapProjectRecordToProjectMeta(row: ProjectRecordRow): ProjectMeta {
  return {
    slug: row.slug,
    name: row.title,
    description: row.summary ?? '',
    repo: getProjectLink(row, 'repository') ?? stringMetadata(row.extra_metadata, 'repo') ?? '',
    date: displayDate(row),
    tags: tagNames(row),
    star: numberMetadata(row.extra_metadata, 'star'),
    status: stringMetadata(row.extra_metadata, 'status'),
    demo: getProjectLink(row, 'demo') ?? stringMetadata(row.extra_metadata, 'demo'),
    cover: row.cover_image_url ?? undefined,
  };
}

export function mapProjectRecordToProject(row: ProjectRecordRow): Project {
  return {
    ...mapProjectRecordToProjectMeta(row),
    content: row.body_markdown,
  };
}
