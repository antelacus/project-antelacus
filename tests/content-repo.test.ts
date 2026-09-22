import test from 'node:test';
import assert from 'node:assert/strict';

import { getPublished, listPublished, listPublishedSlugs, saveContent, type ContentClient } from '../src/lib/server/content-repo';
import { fakeSupabase } from './fakes/supabase';

// The one repo behind four content types (DESIGN §2.1): what differs per type comes from the registry.

const base = {
  title: 'T', summary: null, body_markdown: 'b', status: 'published', published_at: '2026-01-02T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-03T00:00:00.000Z', locale: 'en', cover_image_url: null, extra_metadata: null,
};
const seed = () => fakeSupabase({
  content_items: [
    { id: 'p1', content_type: 'post', slug: 'hello', ...base },
    { id: 'p2', content_type: 'post', slug: 'draft', ...base, status: 'draft' },
    { id: 'g1', content_type: 'gallery', slug: 'album', ...base, gallery_images: [{ storage_path: 'album/1.jpg', public_url: 'https://cdn/album/1.jpg', alt_text: null, sort_order: 1, captured_at: null, created_at: '2026-01-01T00:00:00.000Z' }] },
    { id: 'j1', content_type: 'project', slug: 'tool', ...base, project_links: [{ label: 'Repo', url: 'https://github.com/x', link_type: 'repository' }] },
  ],
});
const asClient = (db: ReturnType<typeof fakeSupabase>) => db.client as unknown as ContentClient;

test('listPublished selects each type\'s own relation and only published rows', async () => {
  const db = seed();
  const posts = await listPublished(asClient(db), 'post');
  assert.deepEqual(posts.map((p) => p.slug), ['hello']);
  const photos = await listPublished(asClient(db), 'gallery');
  assert.equal(photos[0].photoCount, 1);
  const projects = await listPublished(asClient(db), 'project');
  assert.equal(projects[0].repo, 'https://github.com/x');
  const selects = db.selects('content_items');
  assert.ok(selects.some((s) => s.includes('gallery_images')), 'gallery selects its images');
  assert.ok(selects.some((s) => s.includes('project_links')), 'projects select their links');
  assert.ok(!selects[0].includes('gallery_images') && !selects[0].includes('project_links'), 'posts select no relation');
});

test('listPublishedSlugs is the slug column of published rows', async () => {
  const db = seed();
  assert.deepEqual(await listPublishedSlugs(asClient(db), 'post'), ['hello']);
  assert.deepEqual(db.selects('content_items'), ['slug']);
});

test('getPublished maps a hit and returns null for a miss or a draft', async () => {
  const db = seed();
  assert.equal((await getPublished(asClient(db), 'post', 'hello'))?.content, 'b');
  assert.equal(await getPublished(asClient(db), 'post', 'draft'), null);
  assert.equal(await getPublished(asClient(db), 'note', 'hello'), null, 'a slug of another type is not found');
});

test('saveContent writes the type it is given and replaces the tags', async () => {
  const db = seed();
  const result = await saveContent(asClient(db), 'note', { slug: 'n', title: 'N', content: 'c', tags: [' a ', 'b', 'a'], lang: 'en', status: 'draft' });
  assert.deepEqual(result.tags, ['a', 'b']);
  const row = db.rows('content_items').find((r) => r.slug === 'n');
  assert.equal(row?.content_type, 'note');
  assert.equal(row?.published_at, null, 'a draft has no publication date');
});
