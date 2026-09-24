import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapPhotoRecordToPhoto,
  mapPhotoRecordToPhotoMeta,
} from '../src/lib/photo-types';

const sampleRecord = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  slug: 'dynamic-gallery',
  title: 'Dynamic gallery',
  summary: 'Loaded from the database',
  body_markdown: '# Dynamic gallery',
  status: 'published' as const,
  published_at: '2026-03-19T13:00:00.000Z',
  created_at: '2026-03-19T13:00:00.000Z',
  updated_at: '2026-03-19T13:30:00.000Z',
  locale: 'en',
  cover_image_url: '/images/gallery/sample/cover.jpeg',
  extra_metadata: {
    displayDate: '2026-03-19T13:00:00.000Z',
    location: 'Test Location',
    imageFolder: 'sample',
  },
  content_item_tags: [
    {
      content_tags: {
        name: 'dynamic-content',
      },
    },
  ],
  gallery_images: [
    {
      storage_path: 'gallery/sample/IMG_0002.jpeg',
      public_url: 'https://example.supabase.co/storage/v1/object/public/gallery/sample/IMG_0002.jpeg',
      alt_text: 'Second image',
      sort_order: 2,
      captured_at: '2026-03-19T13:02:00.000Z',
      created_at: '2026-03-19T13:02:00.000Z',
    },
    {
      storage_path: 'gallery/sample/IMG_0001.jpeg',
      public_url: 'https://example.supabase.co/storage/v1/object/public/gallery/sample/IMG_0001.jpeg',
      alt_text: 'First image',
      sort_order: 1,
      captured_at: '2026-03-19T13:01:00.000Z',
      created_at: '2026-03-19T13:01:00.000Z',
    },
  ],
};

test('mapPhotoRecordToPhotoMeta preserves the legacy gallery interface', () => {
  assert.deepEqual(mapPhotoRecordToPhotoMeta(sampleRecord), {
    slug: 'dynamic-gallery',
    title: 'Dynamic gallery',
    date: '2026-03-19T13:00:00.000Z',
    caption: 'Loaded from the database',
    location: 'Test Location',
    imageFolder: 'sample',
    coverImage: '/images/gallery/sample/cover.jpeg',
    photoCount: 2,
    photos: [
      {
        filename: 'IMG_0001.jpeg',
        path: 'https://example.supabase.co/storage/v1/object/public/gallery/sample/IMG_0001.jpeg',
        caption: 'First image',
        location: 'Test Location',
        timestamp: '2026-03-19T13:01:00.000Z',
      },
      {
        filename: 'IMG_0002.jpeg',
        path: 'https://example.supabase.co/storage/v1/object/public/gallery/sample/IMG_0002.jpeg',
        caption: 'Second image',
        location: 'Test Location',
        timestamp: '2026-03-19T13:02:00.000Z',
      },
    ],
    tags: ['dynamic-content'],
    lang: 'en',
  });
});

test('mapPhotoRecordToPhotoMeta prefers the legacy displayDate and image paths', () => {
  const photo = mapPhotoRecordToPhotoMeta({
    ...sampleRecord,
    published_at: '2026-03-20T00:00:00.000Z',
    cover_image_url: 'https://example.supabase.co/storage/v1/object/public/gallery/sample/cover.jpeg',
  });

  assert.equal(photo.date, '2026-03-19T13:00:00.000Z');
  assert.equal(photo.coverImage, 'https://example.supabase.co/storage/v1/object/public/gallery/sample/cover.jpeg');
  assert.equal(photo.photos[0]?.path, 'https://example.supabase.co/storage/v1/object/public/gallery/sample/IMG_0001.jpeg');
});

test('mapPhotoRecordToPhoto includes markdown content', () => {
  assert.equal(mapPhotoRecordToPhoto(sampleRecord).content, '# Dynamic gallery');
});
