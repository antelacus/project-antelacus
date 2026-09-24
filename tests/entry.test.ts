import test from 'node:test';
import assert from 'node:assert/strict';

import { fromNote, fromPhoto, fromPost, fromProject, fromSearchItem } from '../src/lib/entry';
import { mapPhotoRecordToPhotoMeta } from '../src/lib/photo-types';
import { mapProjectRecordToProjectMeta } from '../src/lib/project-types';
import { mapPostRecordToPostMeta } from '../src/lib/post-types';
import { mapNoteRecordToNoteMeta } from '../src/lib/note-types';
import type { ContentRow } from '../src/lib/content-row';

// visual-upgrade DESIGN §2.2, invariant 23 — the four types reach the shared components as one shape,
// each with its writing language and its own address.

const row = (locale: string, extra: Partial<ContentRow> = {}) => ({
  id: 'x', slug: 'the-slug', title: 'Title', summary: 'Summary', body_markdown: '', status: 'published', published_at: '2026-01-02T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', locale, cover_image_url: '/images/c.png', seo_title: null, seo_description: null,
  extra_metadata: {}, content_item_tags: [{ content_tags: { name: 'a' } }], ...extra,
}) as ContentRow;

test('invariant 23 — every type adapts to an entry with its language and its section address', () => {
  const entries = [
    fromPost(mapPostRecordToPostMeta(row('zh-CN'))),
    fromNote(mapNoteRecordToNoteMeta(row('en'))),
    fromPhoto(mapPhotoRecordToPhotoMeta({ ...row('fr'), gallery_images: [] })),
    fromProject(mapProjectRecordToProjectMeta({ ...row('es'), project_links: [] })),
  ];
  assert.deepEqual(entries.map((e) => `${e.type} ${e.href} ${e.lang}`), [
    'post /posts/the-slug zh-CN',
    'note /notes/the-slug en',
    'gallery /gallery/the-slug fr',
    'project /projects/the-slug es',
  ]);
  for (const e of entries) {
    assert.equal(e.title, 'Title');
    assert.equal(e.summary, 'Summary');
    assert.deepEqual(e.tags, ['a']);
    assert.equal(e.date, '2026-01-02T00:00:00Z');
  }
});

test('an album entry carries its cover photo; the cover falls back to the first photo', () => {
  const images = [{ storage_path: 'a/1.png', public_url: '/images/1.png', alt_text: 'One', sort_order: 1, captured_at: null, created_at: '' }];
  const album = fromPhoto(mapPhotoRecordToPhotoMeta({ ...row('en', { cover_image_url: null }), gallery_images: images }));
  assert.equal(album.cover, '/images/1.png');
  assert.equal(album.coverAlt, 'One');
});

test('a search index item adapts like the rest; the index\'s `photo` is an album', () => {
  const album = fromSearchItem({ id: 'photo:a', type: 'photo', slug: 'a', title: 'A', tags: ['x'], date: '2026-01-01', locale: 'zh', lang: 'fr' });
  assert.deepEqual([album.type, album.href, album.lang], ['gallery', '/gallery/a', 'fr']);
});
