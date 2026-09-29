import test from 'node:test';
import assert from 'node:assert/strict';

import { mapLanguageTag, normalizeToSupportedLocale } from '../src/i18n/detect';
import { decideLocaleRoute, type LocaleRouteDecision, type LocaleRouteInput } from '../src/i18n/route-decision';

// REQ §5.2 — the routing rules, exercised on the pure decision function.

const decide = (input: Pick<LocaleRouteInput, 'pathname'> & Partial<LocaleRouteInput>) =>
  decideLocaleRoute({ acceptLanguage: null, preferredLocale: null, ...input });

const redirectTo = (pathname: string): LocaleRouteDecision => ({ kind: 'redirect', pathname });
const pass: LocaleRouteDecision = { kind: 'pass' };
const notFound: LocaleRouteDecision = { kind: 'not-found', locale: null };
const notFoundIn = (locale: string) => ({ kind: 'not-found', locale }) as LocaleRouteDecision;

test('acceptance §5.2-a supported locale prefixes pass through', () => {
  assert.deepEqual(decide({ pathname: '/en/posts' }), pass);
  assert.deepEqual(decide({ pathname: '/zh-CN/posts' }), pass);
  assert.deepEqual(decide({ pathname: '/fr' }), pass);
});

test('acceptance §5.2-b no prefix: Accept-Language decides, en when absent', () => {
  assert.deepEqual(decide({ pathname: '/posts', acceptLanguage: 'fr' }), redirectTo('/fr/posts'));
  assert.deepEqual(decide({ pathname: '/posts' }), redirectTo('/en/posts'));
  assert.deepEqual(decide({ pathname: '/' }), redirectTo('/en'));
  assert.deepEqual(decide({ pathname: '/', acceptLanguage: 'zh-TW,zh;q=0.9' }), redirectTo('/zh-HK'));
});

test('acceptance §5.2-c locale variants redirect to the supported locale, path kept', () => {
  assert.deepEqual(decide({ pathname: '/zh-tw/posts' }), redirectTo('/zh-HK/posts'));
  assert.deepEqual(decide({ pathname: '/en-US/about' }), redirectTo('/en/about'));
  assert.deepEqual(decide({ pathname: '/zh-Hans/notes/some-slug' }), redirectTo('/zh-CN/notes/some-slug'));
});

test('acceptance §5.2-d unknown first segments are a direct 404, decided here and not by a page', () => {
  for (const pathname of ['/xx-anything/posts', '/essays', '/essays/about', '/friends', '/english-notes', '/unknown', '/de/posts']) {
    assert.deepEqual(decide({ pathname, acceptLanguage: 'es', preferredLocale: 'fr' }), notFound, pathname);
  }
  for (const pathname of ['/en--US/about', '/zh-/posts']) assert.deepEqual(decide({ pathname }), notFound, pathname);
  // Under a supported locale an unknown section is decided here too, in that language (rule 8).
  assert.deepEqual(decide({ pathname: '/en/garbage' }), notFoundIn('en'));
});

test('routing-slimdown §5.2 rule 8 under a language, an address that cannot exist is a 404 in that language', () => {
  for (const pathname of ['/fr/no-such-section', '/fr/about/extra', '/fr/posts/Bad_Slug', '/fr/notes/a.b', '/fr/posts/ok-slug/extra',
    '/fr/posts/ok-slug/og.png', '/fr/no-such-section/og.png', '/fr/tags/a/b', '/fr/tags/%E0%A4%A', '/fr/gallery/' + 'x'.repeat(81)]) {
    assert.deepEqual(decide({ pathname }), notFoundIn('fr'), pathname);
  }
  assert.deepEqual(decide({ pathname: '/zh-HK/garbage' }), notFoundIn('zh-HK'));
  // The home page and every section's list pass; whether a piece, a tag or the about page exists is looked up.
  for (const pathname of ['/fr', '/fr/', '/fr/posts', '/fr/posts/', '/fr/tags', '/fr/tags/']) assert.deepEqual(decide({ pathname }), pass, pathname);
  const lookup = (item: object) => ({ kind: 'lookup', locale: 'fr', item });
  assert.deepEqual(decide({ pathname: '/fr/about' }), lookup({ section: 'about' }));
  assert.deepEqual(decide({ pathname: '/fr/about/' }), lookup({ section: 'about' }));
  for (const section of ['posts', 'notes', 'gallery', 'projects']) {
    assert.deepEqual(decide({ pathname: `/fr/${section}/ok-slug` }), lookup({ section, slug: 'ok-slug' }), section);
  }
  // A tag is decoded once, as the tag page decodes it.
  assert.deepEqual(decide({ pathname: '/fr/tags/Some%20Tag' }), lookup({ section: 'tags', tag: 'Some Tag' }));
  assert.deepEqual(decide({ pathname: '/fr/tags/%E4%B8%AD%E6%96%87' }), lookup({ section: 'tags', tag: '中文' }));
  assert.deepEqual(decide({ pathname: '/fr/tags/a%2Fb' }), lookup({ section: 'tags', tag: 'a/b' }));
  assert.deepEqual(decide({ pathname: '/fr/tags/100%25' }), lookup({ section: 'tags', tag: '100%' }));
});

test('routing-slimdown §5.2 rule 8 whether looked-up content exists is read from the content index', async () => {
  const { isPublished, parseRouteIndex } = await import('../src/i18n/route-decision');
  const index = { posts: ['a-post'], notes: [], gallery: ['an-album'], projects: [], tags: ['中文', 'a/b'], about: false };
  assert.equal(isPublished({ section: 'posts', slug: 'a-post' }, index), true);
  assert.equal(isPublished({ section: 'posts', slug: 'an-album' }, index), false, 'a slug of another type');
  assert.equal(isPublished({ section: 'gallery', slug: 'an-album' }, index), true);
  assert.equal(isPublished({ section: 'tags', tag: '中文' }, index), true);
  assert.equal(isPublished({ section: 'tags', tag: 'a' }, index), false);
  assert.equal(isPublished({ section: 'about' }, index), false);
  assert.equal(isPublished({ section: 'about' }, { ...index, about: true }), true);
  // An index of the wrong shape is no index: the proxy then lets the page answer (DESIGN §6).
  assert.deepEqual(parseRouteIndex(index), index);
  for (const bad of [null, {}, 'html', [], { ...index, posts: null }, { ...index, tags: [1] }, { ...index, about: 'yes' }]) {
    assert.equal(parseRouteIndex(bad), null, JSON.stringify(bad));
  }
});

test('acceptance §5.2 rule 5 paths outside /<locale>/ are recognised by whole segment, look-alikes are 404', () => {
  for (const pathname of ['/admin', '/admin/notes', '/auth/signout', '/api/search-index', '/images/common/logo-icon.svg',
    '/robots.txt', '/sitemap.xml', '/sw.js', '/ads.txt', '/og.png', '/posts/some-slug/og.png']) {
    assert.deepEqual(decide({ pathname, acceptLanguage: 'es' }), pass, pathname);
  }
  // A prefix is not a segment: `/apiary` is not under `/api`, `/authors` is not under `/auth`.
  for (const pathname of ['/apiary', '/imagesfoo', '/administrator', '/authors', '/sw.jsx', '/sitemap.xmlx', '/ads.txtx',
    '/robots.txt/x', '/favicon.ico', '/fonts/a.woff2', '/_nextfoo']) {
    assert.deepEqual(decide({ pathname, acceptLanguage: 'es' }), notFound, pathname);
  }
  // A directory with no page of its own is not a page.
  for (const pathname of ['/auth', '/api', '/images']) assert.deepEqual(decide({ pathname }), notFound, pathname);
});

test('acceptance §5.2-e language tags map by primary subtag, never by string prefix', () => {
  for (const word of ['essays', 'friends', 'english-notes', 'esperanto', 'french', '', 'de', 'xx-anything', 'en--US', 'zh-', 'en-', 'fr-*', 'zh-t w']) {
    assert.equal(mapLanguageTag(word), null, `"${word}" is not a supported language`);
  }
  for (const tag of ['zh', 'zh-Hans', 'zh-SG', 'ZH-cn']) assert.equal(mapLanguageTag(tag), 'zh-CN', tag);
  for (const tag of ['zh-Hant', 'zh-TW', 'zh-MO', 'zh-hk']) assert.equal(mapLanguageTag(tag), 'zh-HK', tag);
  assert.equal(mapLanguageTag('en-GB'), 'en');
  assert.equal(mapLanguageTag('es-419'), 'es');

  assert.equal(normalizeToSupportedLocale('de, fr;q=0.8'), 'fr');
  assert.equal(normalizeToSupportedLocale(null), 'en');
  assert.equal(normalizeToSupportedLocale(''), 'en');
  assert.equal(normalizeToSupportedLocale('essays, friends'), 'en');
  assert.equal(normalizeToSupportedLocale(';;;,,,'), 'en');
});

test('acceptance §5.2-g unprefixed detail URLs keep working', () => {
  assert.deepEqual(decide({ pathname: '/posts/2025-07-13-llm-note' }), redirectTo('/en/posts/2025-07-13-llm-note'));
  assert.deepEqual(decide({ pathname: '/tags/ai', acceptLanguage: 'es-MX' }), redirectTo('/es/tags/ai'));
});

test('acceptance §5.2-h a remembered manual choice beats the browser, the URL beats both', () => {
  assert.deepEqual(decide({ pathname: '/', acceptLanguage: 'en-US', preferredLocale: 'zh-CN' }), redirectTo('/zh-CN'));
  assert.deepEqual(decide({ pathname: '/fr/posts', acceptLanguage: 'en-US', preferredLocale: 'zh-CN' }), pass);
  assert.deepEqual(decide({ pathname: '/', acceptLanguage: 'fr', preferredLocale: 'xx' }), redirectTo('/fr'));
  assert.deepEqual(decide({ pathname: '/', acceptLanguage: 'fr', preferredLocale: '' }), redirectTo('/fr'));
});
