// Acceptance checks that only a running server can answer (REQ §5.2, §5.3-a, §5.4-c, §6-a).
//   BASE_URL=http://localhost:3000 npm run test:runtime          — a local build; pages that need the database are left out
//   BASE_URL=https://www.antelacus.com RUNTIME_DB=1 npm run test:runtime — production, everything
// A build's route table is not evidence of cacheability; these response headers are.
//
// A local server needs no database for this subset. Build and start it with placeholder values:
//   export NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy \
//          SUPABASE_SERVICE_ROLE_KEY=dummy SUPABASE_ADMIN_EMAILS=owner@example.com
//   npx next build && npx next start -p 3917 &      then   BASE_URL=http://localhost:3917 npm run test:runtime
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { headItems } from './head-items.mjs';

const BASE = process.env.BASE_URL?.replace(/\/$/, '');
if (!BASE) throw new Error('BASE_URL is required — refusing to report a green run that checked nothing');
const WITH_DB = process.env.RUNTIME_DB === '1';
const POST_SLUG = '2025-07-13-llm-note';

const get = (path, headers = {}) => fetch(BASE + path, { redirect: 'manual', headers });
const locationPath = (res) => new URL(res.headers.get('location'), BASE).pathname;
const htmlLang = (html) => /<html[^>]*\blang="([^"]*)"/i.exec(html)?.[1] ?? null;

test('§5.2-a the page language is the URL language', async () => {
  for (const locale of ['en', 'zh-CN', 'fr']) {
    const res = await get(`/${locale}/about`);
    assert.equal(res.status, 200, `/${locale}/about`);
    assert.equal(htmlLang(await res.text()), locale);
  }
});

test('§5.2-b an unprefixed URL is redirected by Accept-Language, en when absent', async () => {
  const french = await get('/posts', { 'accept-language': 'fr' });
  assert.equal(french.status, 308);
  assert.equal(locationPath(french), '/fr/posts');
  const none = await get('/posts');
  assert.equal(none.status, 308);
  assert.equal(locationPath(none), '/en/posts');
});

test('§5.2-c a locale variant is redirected to the supported locale', async () => {
  for (const [from, to] of [['/zh-tw/posts', '/zh-HK/posts'], ['/en-US/about', '/en/about']]) {
    const res = await get(from);
    assert.equal(res.status, 308, from);
    assert.equal(locationPath(res), to);
  }
});

test('§5.2-d an unknown first segment is a direct 404, not a redirect', async () => {
  for (const path of ['/xx-anything/posts', '/essays', '/essays/about', '/unknown', '/en/no-such-section']) {
    assert.equal((await get(path, { 'accept-language': 'es' })).status, 404, path);
  }
});

// The 404 page depends on an experimental Next feature (global-not-found). If an upgrade changes it,
// the status code alone would not show that visitors now get a bare framework page.
test('§5.2-d the 404 is the site\'s own page, complete without JavaScript', async () => {
  const html = (await (await get('/essays')).text()).replace(/<script\b[\s\S]*?<\/script>/gi, '');
  assert.equal(htmlLang(html), 'en');
  assert.match(html, /<link[^>]+rel="stylesheet"/, 'no stylesheet: not the site shell');
  assert.match(html, /<h1[^>]*>Page not found<\/h1>/);
  assert.match(html, /<meta name="robots" content="noindex"/);
});

test('the skip link speaks the page language', async () => {
  for (const [path, label] of [['/en/about', 'Skip to main content'], ['/zh-CN/about', '跳转到主要内容'], ['/fr/about', 'Aller au contenu principal']]) {
    assert.match(await (await get(path)).text(), new RegExp(`class="skip-link"[^>]*>${label}<`), path);
  }
});

test('§5.2-f share images are served where they always were', async () => {
  for (const path of ['/og.png', ...(WITH_DB ? [`/posts/${POST_SLUG}/og.png`] : [])]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type') ?? '', /^image\//, path);
  }
});

test('§5.2-g an old unprefixed detail URL still leads to the page', async () => {
  const res = await get(`/posts/${POST_SLUG}`);
  assert.equal(res.status, 308);
  assert.equal(locationPath(res), `/en/posts/${POST_SLUG}`);
});

test('§5.2-h a remembered manual choice beats the browser; opening a link is not a choice', async () => {
  const remembered = await get('/', { 'accept-language': 'en-US', cookie: 'preferred_locale=zh-CN' });
  assert.equal(locationPath(remembered), '/zh-CN');
  const garbage = await get('/', { 'accept-language': 'fr', cookie: 'preferred_locale=xx' });
  assert.equal(locationPath(garbage), '/fr');
  const visit = await get('/fr/about', { cookie: 'preferred_locale=zh-CN' });
  assert.equal(visit.status, 200);
  assert.doesNotMatch(visit.headers.get('set-cookie') ?? '', /preferred_locale/, 'visiting a prefixed URL must not record a choice');
});

test('§5.3-a public pages are cacheable, the admin is not', async () => {
  const paths = ['/en/about', ...(WITH_DB ? ['/en', '/en/posts', `/en/posts/${POST_SLUG}`] : [])];
  for (const path of paths) {
    await get(path);
    const second = await get(path);
    assert.doesNotMatch(second.headers.get('cache-control') ?? '', /no-store/, `${path} cache-control`);
    assert.match(second.headers.get('x-nextjs-cache') ?? '', /^(HIT|STALE)$/, `${path} second request`);
  }
  assert.match((await get('/admin/login')).headers.get('cache-control') ?? '', /no-store/);
});

test('§5.4-c /sw.js is a short-lived, self-removing stub', { todo: 'batch 5' }, async () => {
  const res = await get('/sw.js');
  assert.equal(res.status, 200);
  const cacheControl = res.headers.get('cache-control') ?? '';
  assert.doesNotMatch(cacheControl, /immutable/);
  assert.ok(Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? 0) <= 3600, `max-age too long: ${cacheControl}`);
  assert.match(await res.text(), /registration\.unregister\(\)/);
});

test('§6-a document metadata is unchanged by the root-layout move', async () => {
  const baseline = JSON.parse(readFileSync(new URL('./fixtures/head-baseline.json', import.meta.url), 'utf8')).pages;
  const needsDb = (path) => !['/en/about', '/admin/login'].includes(path);
  // Ruled an allowed difference (REQ §6): which pages preload the nav image changed with the layout move.
  const comparable = (item) => !item.startsWith('link:preload(image)=');
  const paths = Object.keys(baseline).filter((path) => WITH_DB || !needsDb(path));
  assert.ok(paths.length >= 2, 'nothing to compare');
  for (const path of paths) {
    const res = await fetch(BASE + path);
    assert.equal(res.status, baseline[path].status, path);
    assert.deepEqual(headItems(await res.text()).filter(comparable), baseline[path].head.filter(comparable), path);
  }
});
