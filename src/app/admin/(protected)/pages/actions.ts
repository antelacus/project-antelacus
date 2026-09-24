'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { locales } from '@/i18n/routing';
import { PAGE_SLUGS, PAGES_TAG } from '@/lib/pages';
import { getAdminServiceRoleClient, requireAdminUser } from '@/lib/server/admin-auth';
import { savePageVersion } from '@/lib/server/pages-repo';

export type PageSaveState = { errors: Record<string, string>; message?: string } | null;

const formSchema = z.object({
  slug: z.enum(PAGE_SLUGS),
  locale: z.enum(locales),
  title: z.string().trim().min(1, 'required'),
  body: z.string().refine((value) => value.trim() !== '', 'required'),
  intent: z.enum(['draft', 'publish']),
});

export async function savePageAction(_previous: PageSaveState, formData: FormData): Promise<PageSaveState> {
  await requireAdminUser('/admin/pages/about');

  const parsed = formSchema.safeParse(Object.fromEntries(['slug', 'locale', 'title', 'body', 'intent'].map((name) => [name, formData.get(name) ?? undefined])));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? 'form')] ??= issue.message;
    return { errors };
  }

  const { slug, locale, title, body, intent } = parsed.data;
  const status = intent === 'publish' ? 'published' : 'draft';
  try {
    await savePageVersion(await getAdminServiceRoleClient(`/admin/pages/${slug}/${locale}`), { slug, locale, title, body, status });
  } catch (error) {
    return { errors: {}, message: error instanceof Error ? error.message : 'Could not save' };
  }

  // As with content (content/actions.ts): updateTag so the very next visit is fresh, in every language
  // that shows this version; if it throws, the save stands and the pages catch up within the cache lifetime.
  let stale = '';
  try {
    updateTag(PAGES_TAG);
  } catch {
    stale = '&stale=1';
  }
  redirect(`/admin/pages/${slug}/${locale}?saved=${status}${stale}`);
}
