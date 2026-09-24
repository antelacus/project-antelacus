import { notFound } from 'next/navigation';

import ContentEditor, { type EditorValue } from '@/components/admin/ContentEditor';
import { stringMetadata } from '@/lib/content-row';
import type { PhotoRecordRow } from '@/lib/photo-types';
import type { ProjectRecordRow } from '@/lib/project-types';
import { getAdminServiceRoleClient } from '@/lib/server/admin-auth';
import { getAdminRow } from '@/lib/server/content-repo';
import { contentTypeSchema } from '@/lib/server/database.types';

export async function generateMetadata({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params;
  return { title: slug === 'new' ? `New ${type} · Admin` : `${slug} · ${type}s · Admin` };
}

type Props = {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ saved?: string; stale?: string }>;
};

export default async function AdminContentEditorPage({ params, searchParams }: Props) {
  const { type: rawType, slug } = await params;
  const type = contentTypeSchema.safeParse(rawType);
  if (!type.success) notFound();
  const query = await searchParams;

  let value: EditorValue | null = null;
  if (slug !== 'new') {
    const row = await getAdminRow(await getAdminServiceRoleClient(`/admin/content/${type.data}`), type.data, slug);
    if (!row) notFound();
    value = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary ?? '',
      content: row.body_markdown,
      lang: row.locale,
      cover: row.cover_image_url ?? '',
      displayDate: stringMetadata(row.extra_metadata, 'displayDate') ?? '',
      tags: (row.content_item_tags ?? []).map((entry) => entry.content_tags?.name).filter(Boolean).join(', '),
      seoTitle: row.seo_title ?? '',
      seoDescription: row.seo_description ?? '',
      metadata: row.extra_metadata && typeof row.extra_metadata === 'object' && !Array.isArray(row.extra_metadata) ? (row.extra_metadata as Record<string, unknown>) : {},
      status: row.status,
      images: ((row as PhotoRecordRow).gallery_images ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({ storage_path: image.storage_path, public_url: image.public_url, alt_text: image.alt_text ?? '', captured_at: image.captured_at })),
      links: ((row as ProjectRecordRow).project_links ?? []).map((link) => ({ label: link.label, url: link.url, link_type: link.link_type })),
    };
  }

  return <ContentEditor type={type.data} initial={value} notice={query.saved ? { saved: query.saved, stale: query.stale === '1' } : null} />;
}
