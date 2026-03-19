import 'server-only';

import type { Project, ProjectMeta, ProjectRecordRow } from '@/lib/project-types';
import { mapProjectRecordToProject, mapProjectRecordToProjectMeta } from '@/lib/project-types';
import { createSupabasePublicServerClient } from '@/lib/supabase/public-server';

async function listPublishedProjectRecords(): Promise<ProjectRecordRow[]> {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      slug,
      title,
      summary,
      body_markdown,
      status,
      published_at,
      created_at,
      updated_at,
      locale,
      cover_image_url,
      extra_metadata,
      content_item_tags (
        content_tags (
          name
        )
      ),
      project_links (
        label,
        url,
        link_type
      )
    `)
    .eq('content_type', 'project')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load published projects from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? []) as unknown as ProjectRecordRow[];
}

async function getPublishedProjectRecordBySlug(slug: string): Promise<ProjectRecordRow | null> {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      slug,
      title,
      summary,
      body_markdown,
      status,
      published_at,
      created_at,
      updated_at,
      locale,
      cover_image_url,
      extra_metadata,
      content_item_tags (
        content_tags (
          name
        )
      ),
      project_links (
        label,
        url,
        link_type
      )
    `)
    .eq('content_type', 'project')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load project "${slug}" from Supabase: ${error.message}`);
  }

  // REASON: nested relation selects are broader than the hand-maintained Database type.
  return (data ?? null) as unknown as ProjectRecordRow | null;
}

export async function getPublishedProjects(): Promise<ProjectMeta[]> {
  const rows = await listPublishedProjectRecords();
  return rows.map(mapProjectRecordToProjectMeta);
}

export async function getPublishedProjectBySlug(slug: string): Promise<Project | null> {
  const row = await getPublishedProjectRecordBySlug(slug);
  return row ? mapProjectRecordToProject(row) : null;
}
