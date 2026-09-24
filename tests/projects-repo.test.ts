import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapProjectRecordToProject,
  mapProjectRecordToProjectMeta,
} from '../src/lib/project-types';

const sampleRecord = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  slug: 'dynamic-project',
  title: 'Dynamic project',
  summary: 'Loaded from the database',
  body_markdown: '# Dynamic project',
  status: 'published' as const,
  published_at: '2026-03-19T12:30:00.000Z',
  created_at: '2026-03-19T12:30:00.000Z',
  updated_at: '2026-03-19T13:00:00.000Z',
  locale: 'en',
  cover_image_url: '/images/projects/dynamic-project.jpg',
  extra_metadata: {
    displayDate: '2026-03-19T12:30:00.000Z',
    status: 'active',
    star: 42,
  },
  content_item_tags: [
    {
      content_tags: {
        name: 'dynamic-content',
      },
    },
  ],
  project_links: [
    {
      label: 'Repository',
      url: 'https://github.com/example/dynamic-project',
      link_type: 'repository' as const,
    },
    {
      label: 'Demo',
      url: 'https://dynamic-project.example.com',
      link_type: 'demo' as const,
    },
  ],
};

test('mapProjectRecordToProjectMeta preserves the legacy project interface', () => {
  assert.deepEqual(mapProjectRecordToProjectMeta(sampleRecord), {
    slug: 'dynamic-project',
    name: 'Dynamic project',
    description: 'Loaded from the database',
    repo: 'https://github.com/example/dynamic-project',
    date: '2026-03-19T12:30:00.000Z',
    tags: ['dynamic-content'],
    star: 42,
    status: 'active',
    demo: 'https://dynamic-project.example.com',
    cover: '/images/projects/dynamic-project.jpg',
    lang: 'en',
  });
});

test('mapProjectRecordToProjectMeta prefers the legacy displayDate over published_at', () => {
  const project = mapProjectRecordToProjectMeta({
    ...sampleRecord,
    published_at: '2026-03-20T00:00:00.000Z',
  });

  assert.equal(project.date, '2026-03-19T12:30:00.000Z');
});

test('mapProjectRecordToProject includes markdown content', () => {
  assert.equal(mapProjectRecordToProject(sampleRecord).content, '# Dynamic project');
});
