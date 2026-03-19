import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapPostRecordToPost,
  mapPostRecordToPostMeta,
} from '../src/lib/post-types';

const sampleRecord = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  slug: 'dynamic-post',
  title: 'Dynamic post',
  summary: 'Loaded from the database',
  body_markdown: '# Dynamic post',
  status: 'published' as const,
  published_at: '2026-03-19T11:00:00.000Z',
  created_at: '2026-03-19T11:00:00.000Z',
  updated_at: '2026-03-19T11:30:00.000Z',
  locale: 'en',
  cover_image_url: 'https://example.com/post-cover.jpg',
  extra_metadata: {
    displayDate: '2026-03-19T11:00:00.000Z',
  },
  content_item_tags: [
    {
      content_tags: {
        name: 'dynamic-content',
      },
    },
    {
      content_tags: {
        name: 'posts',
      },
    },
  ],
};

test('mapPostRecordToPostMeta preserves the legacy post interface', () => {
  assert.deepEqual(mapPostRecordToPostMeta(sampleRecord), {
    slug: 'dynamic-post',
    title: 'Dynamic post',
    date: '2026-03-19T11:00:00.000Z',
    tags: ['dynamic-content', 'posts'],
    cover: 'https://example.com/post-cover.jpg',
    summary: 'Loaded from the database',
    lang: 'en',
  });
});

test('mapPostRecordToPostMeta prefers the legacy displayDate over published_at', () => {
  const post = mapPostRecordToPostMeta({
    ...sampleRecord,
    published_at: '2026-03-20T00:00:00.000Z',
  });

  assert.equal(post.date, '2026-03-19T11:00:00.000Z');
});

test('mapPostRecordToPost includes markdown content', () => {
  assert.equal(mapPostRecordToPost(sampleRecord).content, '# Dynamic post');
});
