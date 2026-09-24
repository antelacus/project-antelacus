import test from 'node:test';
import assert from 'node:assert/strict';

import { getPageVersion, listPageVersions, listPublishedPageVersions, savePageVersion } from '../src/lib/server/pages-repo';
import { fakeSupabase } from './fakes/supabase';
import type { ContentClient } from '../src/lib/server/content-repo';

// DESIGN visual-upgrade §2.2 — every read and write of site_pages, against the in-memory fake.

const row = (locale: string, status: 'draft' | 'published', slug = 'about') => ({ slug, locale, title: `t-${locale}`, body_markdown: `b-${locale}`, status, updated_at: '2026-09-23T00:00:00Z' });
const seeded = () => fakeSupabase({ site_pages: [row('en', 'published'), row('zh-CN', 'published'), row('es', 'draft'), row('fr', 'published', 'other')] });
const asClient = (fake: ReturnType<typeof fakeSupabase>) => fake.client as unknown as ContentClient;

test('the public read returns every published language of one page, and nothing else', async () => {
  const fake = seeded();
  const versions = await listPublishedPageVersions(asClient(fake), 'about');
  assert.deepEqual(versions.map((v) => v.locale).sort(), ['en', 'zh-CN']);
  const en = versions.find((v) => v.locale === 'en');
  assert.equal(en?.title, 't-en');
  assert.equal(en?.body_markdown, 'b-en');
  assert.equal(fake.selects('site_pages').at(-1), 'locale, title, body_markdown');
});

test('the admin list shows every language of the page, drafts included, without bodies', async () => {
  const fake = seeded();
  const versions = await listPageVersions(asClient(fake), 'about');
  assert.deepEqual(versions.map((v) => `${v.locale}:${v.status}`).sort(), ['en:published', 'es:draft', 'zh-CN:published']);
  assert.doesNotMatch(fake.selects('site_pages').at(-1) ?? '', /body_markdown/);
});

test('the admin reads one language whatever its status; a missing one is null', async () => {
  const fake = seeded();
  assert.equal((await getPageVersion(asClient(fake), 'about', 'es'))?.body_markdown, 'b-es');
  assert.equal(await getPageVersion(asClient(fake), 'about', 'fr'), null);
});

test('a save writes by page and language: a second save of the same pair replaces it', async () => {
  const fake = seeded();
  await savePageVersion(asClient(fake), { slug: 'about', locale: 'fr', title: 'À propos', body: 'v1', status: 'draft' });
  await savePageVersion(asClient(fake), { slug: 'about', locale: 'fr', title: 'À propos', body: 'v2', status: 'published' });
  const fr = fake.rows('site_pages').filter((r) => r.slug === 'about' && r.locale === 'fr');
  assert.equal(fr.length, 1);
  assert.equal(fr[0].body_markdown, 'v2');
  assert.equal(fr[0].status, 'published');
  assert.deepEqual(fake.upsertConflicts('site_pages'), ['slug,locale', 'slug,locale']);
});
