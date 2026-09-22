import 'server-only';

import { randomBytes } from 'node:crypto';

import type { ContentType } from '@/lib/server/database.types';
import { getAdminServiceRoleClient } from './admin-auth';

// Uploads go to the `media` bucket, under <type>/<slug>/, with a random prefix so re-uploading a
// file of the same name never overwrites — and never collides with an image a page already shows.
export const MEDIA_BUCKET = 'media';
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
// HEIC is accepted as is: Next's image optimiser (sharp with libheif) serves it as WebP.
export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export class UploadRejected extends Error {}

export type UploadedImage = { url: string; path: string };

const safeName = (name: string) =>
  name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';

export async function uploadImage(input: { type: ContentType; slug: string; file: File }): Promise<UploadedImage> {
  const { type, slug, file } = input;
  const extension = IMAGE_TYPES[file.type];
  if (!extension) throw new UploadRejected(`Not an accepted image type: ${file.type || 'unknown'}`);
  if (file.size > MAX_IMAGE_BYTES) throw new UploadRejected(`Larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
  if (file.size === 0) throw new UploadRejected('The file is empty');

  const client = await getAdminServiceRoleClient('/admin');
  const path = `${type}/${slug}/${randomBytes(4).toString('hex')}-${safeName(file.name)}.${extension}`;
  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  return { url: client.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl, path };
}
