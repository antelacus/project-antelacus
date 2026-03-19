import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapNoteRecordToNoteMeta,
  mapNoteRecordToNote,
} from '../src/lib/note-types';

const sampleRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'dynamic-note',
  title: 'Dynamic note',
  summary: 'Loaded from the database',
  body_markdown: '# Dynamic note',
  status: 'published' as const,
  published_at: '2026-03-19T08:00:00.000Z',
  created_at: '2026-03-19T08:00:00.000Z',
  updated_at: '2026-03-19T08:30:00.000Z',
  locale: 'en',
  cover_image_url: 'https://example.com/cover.jpg',
  extra_metadata: {
    displayDate: '2026-03-19T08:00:00.000Z',
  },
  content_item_tags: [
    {
      content_tags: {
        name: 'dynamic-content',
      },
    },
  ],
};

test('mapNoteRecordToNoteMeta preserves the legacy note interface', () => {
  assert.deepEqual(mapNoteRecordToNoteMeta(sampleRecord), {
    slug: 'dynamic-note',
    title: 'Dynamic note',
    date: '2026-03-19T08:00:00.000Z',
    lang: 'en',
    summary: 'Loaded from the database',
    cover: 'https://example.com/cover.jpg',
    tags: ['dynamic-content'],
  });
});

test('mapNoteRecordToNoteMeta prefers the legacy displayDate over published_at', () => {
  const note = mapNoteRecordToNoteMeta({
    ...sampleRecord,
    published_at: '2026-03-20T00:00:00.000Z',
  });

  assert.equal(note.date, '2026-03-19T08:00:00.000Z');
});

test('mapNoteRecordToNote includes markdown content', () => {
  assert.equal(mapNoteRecordToNote(sampleRecord).content, '# Dynamic note');
});
