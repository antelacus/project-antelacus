import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';

import { locales } from '@/i18n/routing';

export function revalidateNoteArtifacts(slug: string, tags: string[]) {
  revalidateTag('notes');

  revalidatePath('/');
  revalidatePath('/notes');
  revalidatePath(`/notes/${slug}`);
  revalidatePath(`/notes/${slug}/og.png`);
  revalidatePath('/tags');
  revalidatePath('/search');
  revalidatePath('/sitemap.xml');

  locales.forEach((locale) => {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/notes`);
    revalidatePath(`/${locale}/notes/${slug}`);
    revalidatePath(`/${locale}/tags`);
    revalidatePath(`/${locale}/search`);
    tags.forEach((tag) => {
      revalidatePath(`/${locale}/tags/${encodeURIComponent(tag)}`);
    });
  });
}
