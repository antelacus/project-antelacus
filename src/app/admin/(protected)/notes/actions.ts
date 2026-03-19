'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireAdminUser } from '@/lib/server/admin-auth';
import { revalidateNoteArtifacts } from '@/lib/server/note-revalidation';
import { saveAdminNote } from '@/lib/server/notes-repo';

const noteFormSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  content: z.string().min(1),
  tags: z.string().optional(),
  lang: z.string().trim().min(2),
  cover: z.string().trim().url().optional().or(z.literal('')),
  displayDate: z.string().trim().optional(),
});

async function saveNoteAction(formData: FormData, intent: 'draft' | 'publish') {
  await requireAdminUser('/admin/notes');

  const parsed = noteFormSchema.safeParse({
    id: formData.get('id'),
    slug: formData.get('slug'),
    title: formData.get('title'),
    summary: formData.get('summary'),
    content: formData.get('content'),
    tags: formData.get('tags'),
    lang: formData.get('lang'),
    cover: formData.get('cover'),
    displayDate: formData.get('displayDate'),
  });

  if (!parsed.success) {
    redirect('/admin/notes?error=validation');
  }

  const result = await saveAdminNote({
    id: parsed.data.id || undefined,
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary,
    content: parsed.data.content,
    tags: parsed.data.tags?.split(',') ?? [],
    lang: parsed.data.lang,
    cover: parsed.data.cover || undefined,
    displayDate: parsed.data.displayDate || undefined,
    status: intent === 'publish' ? 'published' : 'draft',
  });

  revalidateNoteArtifacts(result.slug, result.tags);
  redirect(`/admin/notes?slug=${encodeURIComponent(result.slug)}&saved=${intent}`);
}

export async function saveDraftNoteAction(formData: FormData) {
  await saveNoteAction(formData, 'draft');
}

export async function publishNoteAction(formData: FormData) {
  await saveNoteAction(formData, 'publish');
}
