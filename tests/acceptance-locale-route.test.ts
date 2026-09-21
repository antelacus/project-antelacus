import test from 'node:test';
import assert from 'node:assert/strict';

// REQ §5.2 — the routing rules, exercised on the pure decision function.
// Modules are imported inside each test: until they exist the test must fail as a todo,
// not crash the file.

type Decision = { kind: 'pass' } | { kind: 'redirect'; pathname: string };
type Input = { pathname: string; acceptLanguage?: string | null; preferredLocale?: string | null };

// Resolved at run time so the type check stays green while the modules do not exist yet;
// batch 2 replaces these with static imports.
const ROUTE_DECISION = '../src/i18n/route-decision';
const DETECT = '../src/i18n/detect';

async function decide(input: Input): Promise<Decision> {
  const { decideLocaleRoute } = (await import(ROUTE_DECISION)) as { decideLocaleRoute: (input: Required<Input>) => Decision };
  return decideLocaleRoute({ acceptLanguage: null, preferredLocale: null, ...input });
}

const redirectTo = (pathname: string): Decision => ({ kind: 'redirect', pathname });
const pass: Decision = { kind: 'pass' };

test('acceptance §5.2-a supported locale prefixes pass through', { todo: 'batch 2' }, async () => {
  assert.deepEqual(await decide({ pathname: '/en/posts' }), pass);
  assert.deepEqual(await decide({ pathname: '/zh-CN/posts' }), pass);
  assert.deepEqual(await decide({ pathname: '/fr' }), pass);
});

test('acceptance §5.2-b no prefix: Accept-Language decides, en when absent', { todo: 'batch 2' }, async () => {
  assert.deepEqual(await decide({ pathname: '/posts', acceptLanguage: 'fr' }), redirectTo('/fr/posts'));
  assert.deepEqual(await decide({ pathname: '/posts' }), redirectTo('/en/posts'));
  assert.deepEqual(await decide({ pathname: '/' }), redirectTo('/en'));
  assert.deepEqual(await decide({ pathname: '/', acceptLanguage: 'zh-TW,zh;q=0.9' }), redirectTo('/zh-HK'));
});

test('acceptance §5.2-c locale variants redirect to the supported locale, path kept', { todo: 'batch 2' }, async () => {
  assert.deepEqual(await decide({ pathname: '/zh-tw/posts' }), redirectTo('/zh-HK/posts'));
  assert.deepEqual(await decide({ pathname: '/en-US/about' }), redirectTo('/en/about'));
  assert.deepEqual(await decide({ pathname: '/zh-Hans/notes/some-slug' }), redirectTo('/zh-CN/notes/some-slug'));
});

test('acceptance §5.2-d unknown first segments are passed on to become a direct 404', { todo: 'batch 2' }, async () => {
  for (const pathname of ['/xx-anything/posts', '/essays', '/friends', '/english-notes', '/unknown', '/de/posts']) {
    assert.deepEqual(await decide({ pathname, acceptLanguage: 'es' }), pass, pathname);
  }
});

test('acceptance §5.2-e language tags map by primary subtag, never by string prefix', { todo: 'batch 2' }, async () => {
  const { mapLanguageTag, normalizeToSupportedLocale } = (await import(DETECT)) as {
    mapLanguageTag: (tag: string) => string | null;
    normalizeToSupportedLocale: (input: string | null) => string;
  };

  for (const word of ['essays', 'friends', 'english-notes', 'esperanto', 'french', '', 'de', 'xx-anything']) {
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

test('acceptance §5.2-g unprefixed detail URLs keep working', { todo: 'batch 2' }, async () => {
  assert.deepEqual(await decide({ pathname: '/posts/2025-07-13-llm-note' }), redirectTo('/en/posts/2025-07-13-llm-note'));
  assert.deepEqual(await decide({ pathname: '/tags/ai', acceptLanguage: 'es-MX' }), redirectTo('/es/tags/ai'));
});

test('acceptance §5.2-h a remembered manual choice beats the browser, the URL beats both', { todo: 'batch 2' }, async () => {
  assert.deepEqual(await decide({ pathname: '/', acceptLanguage: 'en-US', preferredLocale: 'zh-CN' }), redirectTo('/zh-CN'));
  assert.deepEqual(await decide({ pathname: '/fr/posts', acceptLanguage: 'en-US', preferredLocale: 'zh-CN' }), pass);
  assert.deepEqual(await decide({ pathname: '/', acceptLanguage: 'fr', preferredLocale: 'xx' }), redirectTo('/fr'));
  assert.deepEqual(await decide({ pathname: '/', acceptLanguage: 'fr', preferredLocale: '' }), redirectTo('/fr'));
});
