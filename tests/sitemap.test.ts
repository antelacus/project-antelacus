import test from 'node:test';
import assert from 'node:assert/strict';

import { locales, localizedSections } from '../src/i18n/routing';
import { buildSitemapEntries, renderSitemapXml } from '../src/lib/sitemap-entries';

// REQ §5.11-a — the sitemap's locale expansion and XML escaping, on the pure functions.

const data = { posts: [{ slug: 'p', date: '2026-01-02' }], notes: [], photos: [], projects: [{ slug: 'q' }], tags: ['a&b', 'c d'] };

test('acceptance §5.11-a every page exists once per locale and lists every locale as an alternate', () => {
  const entries = buildSitemapEntries(data);
  const urls = entries.map((e) => e.url);
  const pages = 1 + localizedSections.length + 1 + 1 + 2; // home, sections, one post, one project, two tags
  assert.equal(urls.length, pages * locales.length);
  assert.equal(new Set(urls).size, urls.length, 'no duplicates');
  for (const l of locales) {
    assert.ok(urls.includes(`https://www.antelacus.com/${l}/posts/p`), l);
    assert.ok(urls.includes(`https://www.antelacus.com/${l}/tags/${encodeURIComponent('a&b')}`), l);
  }
  const post = entries.find((e) => e.url.endsWith('/en/posts/p'))!;
  assert.deepEqual(Object.keys(post.alternates!.languages).sort(), [...locales].sort());
  assert.equal(post.alternates!.languages['zh-HK'], 'https://www.antelacus.com/zh-HK/posts/p');
  assert.equal(post.lastModified, '2026-01-02');
});

test('acceptance §5.11-a the XML escapes every value it interpolates', () => {
  const xml = renderSitemapXml(buildSitemapEntries({ ...data, tags: ['a&b'] }));
  assert.doesNotMatch(xml, /a&b/);
  assert.match(xml, /tags\/a%26b/);
  const raw = renderSitemapXml([{ url: 'https://x/<"\'>&', lastModified: 'l<m', changeFrequency: 'weekly', priority: 0.5, alternates: { languages: { en: 'https://x/?a=1&b=2' } } }]);
  assert.match(raw, /<loc>https:\/\/x\/&lt;&quot;&apos;&gt;&amp;<\/loc>/);
  assert.match(raw, /href="https:\/\/x\/\?a=1&amp;b=2"/);
  assert.match(raw, /<lastmod>l&lt;m<\/lastmod>/);
  assert.match(raw, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
});
