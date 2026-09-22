import test from 'node:test';
import assert from 'node:assert/strict';

import { mapNoteRecordToNoteMeta } from '../src/lib/note-types';
import { mapPhotoRecordToPhotoMeta } from '../src/lib/photo-types';
import { mapPostRecordToPostMeta } from '../src/lib/post-types';
import { mapProjectRecordToProjectMeta } from '../src/lib/project-types';

// REQ §5.11-a — the paths the full-fixture snapshots never take: null dates, odd metadata, no tags.

const bare = {
  id: 'x', slug: 's', title: 't', summary: null, body_markdown: '', status: 'published' as const,
  published_at: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-03T00:00:00.000Z',
  locale: 'en', cover_image_url: null, extra_metadata: null,
};

test('acceptance §5.11-a a row with no publication date and no metadata falls back to its last edit', () => {
  for (const map of [mapPostRecordToPostMeta, mapNoteRecordToNoteMeta, mapPhotoRecordToPhotoMeta, mapProjectRecordToProjectMeta]) {
    assert.equal(map(bare).date, bare.updated_at, map.name);
    assert.deepEqual(map(bare).tags, [], map.name);
  }
  assert.equal(mapPostRecordToPostMeta({ ...bare, published_at: '2026-01-02T00:00:00.000Z' }).date, '2026-01-02T00:00:00.000Z', 'publication beats the last edit');
});

test('acceptance §5.11-a metadata that is an array, a string or has the wrong value types is ignored', () => {
  assert.equal(mapPostRecordToPostMeta({ ...bare, extra_metadata: ['displayDate'] }).date, bare.updated_at);
  assert.equal(mapPostRecordToPostMeta({ ...bare, extra_metadata: 'displayDate' }).date, bare.updated_at);
  assert.equal(mapPostRecordToPostMeta({ ...bare, extra_metadata: { displayDate: 42 } }).date, bare.updated_at);
  assert.equal(mapProjectRecordToProjectMeta({ ...bare, extra_metadata: { star: '12' } }).star, 12);
  assert.equal(mapProjectRecordToProjectMeta({ ...bare, extra_metadata: { star: 'many' } }).star, undefined);
});

test('acceptance §5.11-a tags with an empty name or a missing join row are dropped', () => {
  const row = { ...bare, content_item_tags: [{ content_tags: { name: ' a ' } }, { content_tags: { name: '  ' } }, { content_tags: null }] };
  assert.deepEqual(mapNoteRecordToNoteMeta(row).tags, ['a']);
});

test('acceptance §5.11-a an album with no images has no cover and a count of zero; a cover set explicitly wins', () => {
  const empty = mapPhotoRecordToPhotoMeta({ ...bare, gallery_images: null });
  assert.equal(empty.photoCount, 0);
  assert.equal(empty.coverImage, '');
  const withCover = mapPhotoRecordToPhotoMeta({ ...bare, cover_image_url: 'https://cdn/c.jpg', gallery_images: [{ storage_path: 'a/1.jpg', public_url: 'https://cdn/a/1.jpg', alt_text: null, sort_order: 0, captured_at: null, created_at: bare.created_at }] });
  assert.equal(withCover.coverImage, 'https://cdn/c.jpg');
  assert.equal(withCover.photos[0].filename, '1.jpg');
});
