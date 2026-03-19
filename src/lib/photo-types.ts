import path from 'path';

import type { Json } from '@/lib/server/database.types';

export interface PhotoInfo {
  filename: string;
  path: string;
  caption?: string;
  location?: string;
  camera?: string;
  lens?: string;
  settings?: string;
  timestamp?: string;
}

export interface PhotoMeta {
  slug: string;
  title: string;
  date: string;
  caption?: string;
  location?: string;
  imageFolder: string;
  coverImage: string;
  photoCount: number;
  photos: PhotoInfo[];
  tags?: string[];
}

export interface Photo extends PhotoMeta {
  content: string;
}

export type PhotoTagJoinRow = {
  content_tags: {
    name: string;
  } | null;
};

export type GalleryImageRow = {
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  captured_at: string | null;
  created_at: string;
};

export type PhotoRecordRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  locale: string;
  cover_image_url: string | null;
  extra_metadata: Json | null;
  content_item_tags?: PhotoTagJoinRow[] | null;
  gallery_images?: GalleryImageRow[] | null;
};

function extractMetadataValue(metadata: Json | null, key: string): Json | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  return metadata[key];
}

function getStringMetadataValue(metadata: Json | null, key: string): string | undefined {
  const value = extractMetadataValue(metadata, key);
  return typeof value === 'string' ? value : undefined;
}

function getPhotoTags(row: PhotoRecordRow): string[] {
  return (row.content_item_tags ?? [])
    .map((entry) => entry.content_tags?.name?.trim())
    .filter((value): value is string => Boolean(value));
}

function mapGalleryImageToPhotoInfo(
  image: GalleryImageRow,
  row: PhotoRecordRow,
): PhotoInfo {
  const location = getStringMetadataValue(row.extra_metadata, 'location');
  const fileName = path.basename(image.storage_path || image.public_url);

  return {
    filename: fileName,
    path: image.public_url,
    caption: image.alt_text ?? row.summary ?? undefined,
    location,
    timestamp: image.captured_at ?? undefined,
  };
}

function getSortedGalleryImages(row: PhotoRecordRow): GalleryImageRow[] {
  return [...(row.gallery_images ?? [])].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }

    return a.created_at.localeCompare(b.created_at);
  });
}

function resolveDisplayDate(row: PhotoRecordRow): string {
  return getStringMetadataValue(row.extra_metadata, 'displayDate')
    ?? row.published_at
    ?? row.updated_at;
}

export function mapPhotoRecordToPhotoMeta(row: PhotoRecordRow): PhotoMeta {
  const sortedImages = getSortedGalleryImages(row);
  const photos = sortedImages.map((image) => mapGalleryImageToPhotoInfo(image, row));
  const imageFolder = getStringMetadataValue(row.extra_metadata, 'imageFolder') ?? row.slug;
  const coverImage = row.cover_image_url ?? photos[0]?.path ?? '';

  return {
    slug: row.slug,
    title: row.title,
    date: resolveDisplayDate(row),
    caption: row.summary ?? undefined,
    location: getStringMetadataValue(row.extra_metadata, 'location'),
    imageFolder,
    coverImage,
    photoCount: photos.length,
    photos,
    tags: getPhotoTags(row),
  };
}

export function mapPhotoRecordToPhoto(row: PhotoRecordRow): Photo {
  return {
    ...mapPhotoRecordToPhotoMeta(row),
    content: row.body_markdown,
  };
}
