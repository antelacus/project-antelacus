'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { locales } from '@/i18n/routing';
import { isAllowedImageUrl, isSafeExternalUrl, isValidSlug } from '@/lib/content-slug';
import { CONTENT_TYPES } from '@/lib/content-types';
import { getAdminServiceRoleClient, requireAdminUser } from '@/lib/server/admin-auth';
import { saveContent } from '@/lib/server/content-repo';
import { contentTypeSchema, projectLinkTypeSchema } from '@/lib/server/database.types';

export type SaveState = { errors: Record<string, string>; message?: string } | null;

const jsonArray = <T extends z.ZodTypeAny>(item: T) =>
  z.string().optional().transform((raw, ctx) => {
    if (!raw) return [] as z.infer<T>[];
    try {
      const parsed = z.array(item).safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: parsed.error.issues[0]?.message ?? 'invalid' });
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'not valid JSON' });
    }
    return z.NEVER;
  });

const formSchema = z.object({
  type: contentTypeSchema,
  id: z.string().uuid().optional().or(z.literal('')),
  slug: z.string().trim().refine(isValidSlug, 'lowercase letters, digits and hyphens only (max 80)'),
  title: z.string().trim().min(1, 'required'),
  summary: z.string().trim().optional(),
  content: z.string(),
  tags: z.string().optional(),
  lang: z.string().refine((value) => (locales as readonly string[]).includes(value), 'not a supported language'),
  cover: z.string().trim().optional(),
  displayDate: z.string().trim().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  metadata: z.string().optional().transform((raw, ctx) => {
    if (!raw) return {} as Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch { /* fall through */ }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'not an object' });
    return z.NEVER;
  }),
  images: jsonArray(z.object({
    storage_path: z.string().min(1),
    public_url: z.string().url(),
    alt_text: z.string().nullable().optional(),
    sort_order: z.number().int().nonnegative().optional(),
    captured_at: z.string().nullable().optional(),
  })),
  links: jsonArray(z.object({
    label: z.string().trim().min(1, 'a link needs a label'),
    url: z.string().trim().refine(isSafeExternalUrl, 'links must be http(s)'),
    link_type: projectLinkTypeSchema,
  })),
  intent: z.enum(['draft', 'publish']),
}).superRefine((value, ctx) => {
  // An album's text is its summary; every other type needs a body.
  if (value.type !== 'gallery' && value.content.trim() === '') ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'required' });
  if (value.cover && !isAllowedImageUrl(value.cover)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cover'], message: 'must be an image on this site or in the storage bucket' });
});

const field = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === 'string' ? value : undefined;
};

export async function saveContentAction(_previous: SaveState, formData: FormData): Promise<SaveState> {
  const type = contentTypeSchema.safeParse(field(formData, 'type'));
  if (!type.success) return { errors: { type: 'unknown content type' } };
  await requireAdminUser(`/admin/content/${type.data}`);

  const parsed = formSchema.safeParse(Object.fromEntries(
    ['type', 'id', 'slug', 'title', 'summary', 'content', 'tags', 'lang', 'cover', 'displayDate', 'seoTitle', 'seoDescription', 'metadata', 'images', 'links', 'intent']
      .map((name) => [name, field(formData, name)]),
  ));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? 'form')] ??= issue.message;
    return { errors };
  }

  const input = parsed.data;
  const status = input.intent === 'publish' ? 'published' : 'draft';
  let saved: { slug: string };
  try {
    saved = await saveContent(await getAdminServiceRoleClient(`/admin/content/${input.type}`), input.type, {
      id: input.id || undefined,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      content: input.content,
      tags: input.tags?.split(',') ?? [],
      lang: input.lang,
      cover: input.cover,
      displayDate: input.displayDate,
      status,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      metadata: input.metadata,
      images: input.images.map((image, index) => ({ ...image, sort_order: index })),
      links: input.links,
    });
  } catch (error) {
    // The transaction rolled back; nothing was written. The form keeps what was typed.
    return { errors: {}, message: error instanceof Error ? error.message : 'Could not save' };
  }

  // Every page showing this type reads it through this tag. updateTag, not revalidateTag('max'): the
  // latter serves the stale page once and refreshes behind it, so the author's own change would show
  // on the second visit; updateTag expires the tag so the very next request is fresh (REQ §5.3 rule 6).
  // If it throws, the save has still happened — the editor says so and the pages refresh within the
  // cache lifetime.
  let stale = '';
  try {
    updateTag(CONTENT_TYPES[input.type].tag);
  } catch {
    stale = '&stale=1';
  }
  redirect(`/admin/content/${input.type}/${encodeURIComponent(saved.slug)}?saved=${status}${stale}`);
}
