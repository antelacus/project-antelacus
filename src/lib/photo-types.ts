import type { ContentRow } from '@/lib/content-row';
import { displayDate, stringMetadata, tagNames } from '@/lib/content-row';

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

export type GalleryImageRow = {
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  captured_at: string | null;
  created_at: string;
};

export type PhotoRecordRow = ContentRow & {
  gallery_images?: GalleryImageRow[] | null;
};

// The last path segment; a plain string operation so this module can also run in the browser.
const fileName = (value: string) => value.split('/').filter(Boolean).pop() ?? value;

function mapGalleryImageToPhotoInfo(image: GalleryImageRow, row: PhotoRecordRow): PhotoInfo {
  return {
    filename: fileName(image.storage_path || image.public_url),
    path: image.public_url,
    caption: image.alt_text ?? row.summary ?? undefined,
    location: stringMetadata(row.extra_metadata, 'location'),
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

export function mapPhotoRecordToPhotoMeta(row: PhotoRecordRow): PhotoMeta {
  const photos = getSortedGalleryImages(row).map((image) => mapGalleryImageToPhotoInfo(image, row));

  return {
    slug: row.slug,
    title: row.title,
    date: displayDate(row),
    caption: row.summary ?? undefined,
    location: stringMetadata(row.extra_metadata, 'location'),
    imageFolder: stringMetadata(row.extra_metadata, 'imageFolder') ?? row.slug,
    coverImage: row.cover_image_url ?? photos[0]?.path ?? '',
    photoCount: photos.length,
    photos,
    tags: tagNames(row),
  };
}

export function mapPhotoRecordToPhoto(row: PhotoRecordRow): Photo {
  return {
    ...mapPhotoRecordToPhotoMeta(row),
    content: row.body_markdown,
  };
}
