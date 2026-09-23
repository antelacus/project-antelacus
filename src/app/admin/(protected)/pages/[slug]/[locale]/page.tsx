import { notFound } from 'next/navigation';

import PageEditor from '@/components/admin/PageEditor';
import { isSupportedLocale } from '@/i18n/routing';
import { PAGE_SLUGS } from '@/lib/pages';
import { getAdminServiceRoleClient } from '@/lib/server/admin-auth';
import { getPageVersion } from '@/lib/server/pages-repo';

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ saved?: string; stale?: string }>;
};

export default async function AdminPageEditorPage({ params, searchParams }: Props) {
  const { slug, locale } = await params;
  if (!(PAGE_SLUGS as readonly string[]).includes(slug) || !isSupportedLocale(locale)) notFound();
  const query = await searchParams;

  const version = await getPageVersion(await getAdminServiceRoleClient(`/admin/pages/${slug}/${locale}`), slug, locale);

  return (
    <PageEditor
      slug={slug}
      locale={locale}
      initial={version && { title: version.title, body: version.body_markdown, status: version.status }}
      notice={query.saved ? { saved: query.saved, stale: query.stale === '1' } : null}
    />
  );
}
