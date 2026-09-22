import 'server-only';

import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

import type { ContentType } from '@/lib/server/database.types';
import { getAdminServiceRoleClient } from './admin-auth';

// Uploads go to the `media` bucket, under <type>/<slug>/, with a random prefix so re-uploading a
// file of the same name never overwrites — and never collides with an image a page already shows.
export const MEDIA_BUCKET = 'media';
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
// Body images are plain <img> tags (the Markdown renderer's output), not next/image, so what sits in the
// bucket is what browsers get. A phone's HEIC would show only in Safari: photos (HEIC, HEIF, JPEG) are
// therefore re-encoded as JPEG at most PHOTO_LONG_EDGE wide before upload. PNG, WebP, GIF, AVIF are
// stored as they are (a screenshot's text must not be smeared; an animation must stay one).
export const PHOTO_LONG_EDGE = 2400;
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
  const prepared = await prepareImage(Buffer.from(await file.arrayBuffer()), file.type, extension);
  const path = `${type}/${slug}/${randomBytes(4).toString('hex')}-${safeName(file.name)}.${prepared.extension}`;
  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(path, prepared.bytes, { contentType: prepared.contentType, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  return { url: client.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl, path };
}

const PHOTO_TYPES = new Set(['image/heic', 'image/heif', 'image/jpeg']);

// Photos come back as JPEG no wider than PHOTO_LONG_EDGE, EXIF orientation applied; everything else untouched.
export async function prepareImage(bytes: Buffer, contentType: string, extension: string): Promise<{ bytes: Buffer; contentType: string; extension: string }> {
  if (!PHOTO_TYPES.has(contentType)) return { bytes, contentType, extension };
  const out = await sharp(bytes)
    .rotate()
    .resize({ width: PHOTO_LONG_EDGE, height: PHOTO_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return { bytes: out, contentType: 'image/jpeg', extension: 'jpg' };
}
