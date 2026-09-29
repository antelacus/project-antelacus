// Acceptance checks that only a running server can answer (REQ §5.2, §5.3-a, §5.4-c).
//   BASE_URL=http://localhost:3000 npm run test:runtime          — a local build; pages that need the database are left out
//   BASE_URL=https://www.antelacus.com RUNTIME_DB=1 npm run test:runtime — production, everything
//   scripts/ui-check.sh                                          — everything, against the seeded local stack
//   BASE_URL=https://staging.antelacus.com RUNTIME_DB=1 CF_ACCESS_CLIENT_ID=… CF_ACCESS_CLIENT_SECRET=… — staging (branch.yml)
// Every public page reads the database; without one, only the proxy, the 404 page and the admin render.
// A build's route table is not evidence of cacheability; these response headers are.
//
// A local server needs no database for this subset. Build and start it with placeholder values:
//   export NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy \
//          SUPABASE_SERVICE_ROLE_KEY=dummy
//   npx next build && npx next start -p 3917 &      then   BASE_URL=http://localhost:3917 npm run test:runtime
import test from 'node:test';
import assert from 'node:assert/strict';
import { headItems } from './head-items.mjs';

const BASE = process.env.BASE_URL?.replace(/\/$/, '');
if (!BASE) throw new Error('BASE_URL is required — refusing to report a green run that checked nothing');
const WITH_DB = process.env.RUNTIME_DB === '1';
// A post in production and in supabase/seed.sql alike.
const POST_SLUG = '2025-07-13-llm-note';
// A page in the site's own document without the database: the 404.
const SHELL = '/essays';

// Staging sits behind Cloudflare Access: the service token, when given, rides on every request.
const ACCESS = process.env.CF_ACCESS_CLIENT_ID
  ? { 'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID, 'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '' }
  : {};
const get = (path, headers = {}) => fetch(BASE + path, { redirect: 'manual', headers: { ...ACCESS, ...headers } });
// A tag in use wherever the suite runs (production has no `seed`), plain enough to need no encoding.
const someTag = async () => {
  const tags = (await (await get('/api/search-index')).json()).flatMap((item) => item.tags);
  const tag = tags.find((t) => /^[A-Za-z0-9-]+$/.test(t));
  assert.ok(tag, 'no plain tag in the search index');
  return tag;
};
const locationPath = (res) => new URL(res.headers.get('location'), BASE).pathname;
const htmlLang = (html) => /<html[^>]*\blang="([^"]*)"/i.exec(html)?.[1] ?? null;

test('§5.2-a the page language is the URL language', async () => {
  if (!WITH_DB) return;
  // Every page form, not the about page alone (TD-021 C-12).
  for (const path of ['/en/about', '/zh-CN/about', '/fr/about', '/en', '/zh-HK', '/es/posts', '/fr/notes', '/zh-CN/tags', `/zh-HK/posts/${POST_SLUG}`]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.equal(htmlLang(await res.text()), path.split('/')[1], path);
  }
});

test('§5.2-b an unprefixed URL is redirected by Accept-Language, en when absent', async () => {
  const french = await get('/posts', { 'accept-language': 'fr' });
  assert.equal(french.status, 308);
  assert.equal(locationPath(french), '/fr/posts');
  const none = await get('/posts');
  assert.equal(none.status, 308);
  // The target depends on the visitor: a cached copy would defeat the remembered choice (§5.2-h).
  assert.match(none.headers.get('cache-control') ?? '', /no-store/, 'a locale redirect must not be cacheable');
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
  // The second row: look-alikes of paths that do exist. A prefix is not a segment.
  for (const path of ['/xx-anything/posts', '/essays', '/essays/about', '/unknown', '/en/no-such-section',
    '/apiary', '/imagesfoo', '/administrator', '/authors', '/auth', '/sw.jsx', '/favicon.ico', '/en--US/about']) {
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

test('only content-hashed files are cached as immutable', async () => {
  // A stable URL whose content can change must be allowed to refresh: one day at most.
  for (const path of ['/og.png', '/images/common/logo-icon.svg', ...(WITH_DB ? [`/posts/${POST_SLUG}/og.png`] : [])]) {
    const cacheControl = (await get(path)).headers.get('cache-control') ?? '';
    assert.doesNotMatch(cacheControl, /immutable/, path);
    assert.ok(Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? Infinity) <= 86400, `${path}: ${cacheControl}`);
  }
  // …and the rule above must not have weakened the hashed assets (the login page names its fonts without a
  // database; the 404 names none).
  const html = await (await get('/admin/login')).text();
  const hashed = /(\/_next\/static\/media\/[^"\\]+\.woff2)/.exec(html)?.[1];
  assert.ok(hashed, 'found no hashed font to check');
  assert.match((await get(hashed)).headers.get('cache-control') ?? '', /immutable/, hashed);
});

test('no page preloads a file that does not exist', async () => {
  // The 404 shell, the admin and, with a database, the pages readers see (TD-021 C-14).
  for (const path of [SHELL, '/admin/login', ...(WITH_DB ? ['/en', `/en/posts/${POST_SLUG}`, '/zh-CN/gallery'] : [])]) {
    const html = await (await get(path)).text();
    const preloads = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/gi)].map(([tag]) => /href="([^"]+)"/.exec(tag)?.[1]).filter(Boolean);
    assert.ok(preloads.length >= 1, `${path}: found no preloads at all — the extraction looks broken`);
    for (const href of preloads) assert.equal((await get(href)).status, 200, `${path}: ${href}`);
  }
});

test('the skip link speaks the page language', async () => {
  if (!WITH_DB) return;
  for (const [path, label] of [['/en/about', 'Skip to main content'], ['/zh-CN/about', '跳转到主要内容'], ['/fr/about', 'Aller au contenu principal']]) {
    assert.match(await (await get(path)).text(), new RegExp(`class="skip-link"[^>]*>${label}<`), path);
  }
});

test('§5.2 rule 5 what is served outside /<locale>/ still is', async () => {
  // Served means 200 (TD-021 C-15). Only the two routes that read the database may fail without one — and then
  // with a 500 of their own, not a redirect or a 404.
  const needsDb = new Set(['/sitemap.xml', '/api/search-index']);
  for (const path of ['/robots.txt', '/sitemap.xml', '/sw.js', '/ads.txt', '/images/common/logo-icon.svg', '/api/search-index', '/admin/login']) {
    const res = await get(path, { 'accept-language': 'es' });
    const expected = !WITH_DB && needsDb.has(path) ? 500 : 200;
    assert.equal(res.status, expected, path);
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
  // …and the redirect ends on the page itself (TD-021 C-16).
  if (WITH_DB) assert.equal((await get(locationPath(res))).status, 200);
});

test('§5.2-h a remembered manual choice beats the browser; opening a link is not a choice', async () => {
  const remembered = await get('/', { 'accept-language': 'en-US', cookie: 'preferred_locale=zh-CN' });
  assert.equal(locationPath(remembered), '/zh-CN');
  const garbage = await get('/', { 'accept-language': 'fr', cookie: 'preferred_locale=xx' });
  assert.equal(locationPath(garbage), '/fr');
  const visit = await get('/fr/about', { cookie: 'preferred_locale=zh-CN' });
  if (WITH_DB) assert.equal(visit.status, 200);
  assert.doesNotMatch(visit.headers.get('set-cookie') ?? '', /preferred_locale/, 'visiting a prefixed URL must not record a choice');
});

test('§5.3-a public pages are cacheable, the admin is not', async () => {
  const paths = WITH_DB ? ['/en/about', '/en', '/en/posts', '/en/notes', '/en/projects', '/en/gallery', '/en/tags', `/en/tags/${await someTag()}`, `/en/posts/${POST_SLUG}`] : [];
  for (const path of paths) {
    await get(path);
    const second = await get(path);
    assert.doesNotMatch(second.headers.get('cache-control') ?? '', /no-store/, `${path} cache-control`);
    assert.match(second.headers.get('x-nextjs-cache') ?? '', /^(HIT|STALE)$/, `${path} second request`);
  }
  assert.match((await get('/admin/login')).headers.get('cache-control') ?? '', /no-store/);
});

test('a tag nothing carries is a 404, on every visit', async () => {
  if (!WITH_DB) return;
  for (let i = 0; i < 2; i++) assert.equal((await get('/en/tags/no-such-tag-anywhere')).status, 404);
});

test('§5.4-c /sw.js is a short-lived, self-removing stub', async () => {
  const res = await get('/sw.js');
  assert.equal(res.status, 200);
  const cacheControl = res.headers.get('cache-control') ?? '';
  assert.doesNotMatch(cacheControl, /immutable/);
  assert.ok(Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? 0) <= 3600, `max-age too long: ${cacheControl}`);
  assert.match(await res.text(), /registration\.unregister\(\)/);
});

// What routing-slimdown §6-a guarded with a frozen copy of production's heads, asserted by meaning so
// that a redesign can change the page and not break the check (visual-upgrade REQ §6).
test('every public page names itself, describes itself, and points to its languages and share image', async () => {
  if (!WITH_DB) return;
  for (const path of ['/en', '/zh-CN/posts', '/es/gallery', '/fr/projects', '/en/tags', `/zh-HK/tags/${await someTag()}`, `/en/posts/${POST_SLUG}`, '/fr/about']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    const items = headItems(await res.text());
    const values = (prefix) => items.filter((item) => item.startsWith(prefix)).map((item) => item.slice(prefix.length));
    assert.equal(values('title=').filter(Boolean).length, 1, `${path}: title`);
    assert.ok(values('meta:description=')[0], `${path}: description`);
    assert.deepEqual(values('link:canonical='), [`https://www.antelacus.com${path}`], `${path}: canonical`);
    const rest = path.split('/').slice(2).join('/');
    for (const locale of ['zh-CN', 'zh-HK', 'en', 'es', 'fr']) {
      assert.deepEqual(values(`link:alternate[${locale}]=`), [`https://www.antelacus.com/${locale}${rest ? `/${rest}` : ''}`], `${path}: alternate ${locale}`);
    }
    assert.match(values('meta:og:image=')[0] ?? '', /^https:\/\/www\.antelacus\.com\/.+/, `${path}: share image`);
  }
});

// ---------- v2.3.0 (docs/features/content-publishing/REQ.md); todo until the named batch lands ----------

// The site's own 404 page under a known language, not any HTML that says 404 (TD-021 C-17, C-18). Scripts
// are cut first: the framework's empty 404 shell carries the not-found page in its script data, where a
// search for the page's words would find it (routing-slimdown DESIGN §7-9).
const withoutScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const assertSite404 = async (res, path) => {
  assert.equal(res.status, 404, path);
  const html = withoutScripts(await res.text());
  assert.equal(htmlLang(html), path.split('/')[1], `${path}: language`);
  assert.match(html, /<link[^>]+rel="stylesheet"/, `${path}: not the site shell`);
  assert.match(html, /<h1 class="scroll-title">[^<]+<\/h1>/, `${path}: not the site's 404 page`);
};

test('§5.4-a an unknown but well-formed slug is a 404 with the site\'s 404 page', async () => {
  if (!WITH_DB) return;
  await assertSite404(await get('/en/posts/this-slug-does-not-exist'), '/en/posts/this-slug-does-not-exist');
});

test('§5.4-b with the database unreachable, a page answers 500 without the database\'s words', async () => {
  if (WITH_DB) return;
  // A cached page that fails to generate is answered by the framework itself (DESIGN §3): the status
  // is right and nothing leaks; the site-styled error page is reserved for client-side navigation.
  const res = await get('/en/posts/anything');
  assert.equal(res.status, 500);
  const html = await res.text();
  assert.doesNotMatch(html, /supabase|ECONN|fetch failed/i);
});

test('§5.4-c the search index never echoes a database error', async () => {
  if (WITH_DB) return;
  const res = await get('/api/search-index');
  assert.equal(res.status, 500);
  const body = await res.text();
  assert.doesNotMatch(body, /supabase|fetch failed|ECONN/i);
});

test('§5.4-d a malformed slug is a 404 without the database', async () => {
  // In the database-free run a read would have answered 500: a 404 there shows none happened.
  for (const path of ['/en/posts/Bad_Slug', '/en/notes/a.b', '/fr/projects/' + 'x'.repeat(81)]) await assertSite404(await get(path), path);
});

// routing-slimdown REQ §5.2 rule 8: a 404 under a language prefix is in that language, whole without JavaScript.
test('routing-slimdown §5.2-i a 404 under a language prefix is that language\'s page, server-rendered', async () => {
  const paths = ['/fr/no-such-section', '/fr/posts/Bad_Slug', ...(WITH_DB ? ['/fr/posts/this-slug-does-not-exist', '/fr/tags/no-such-tag'] : [])];
  for (const path of paths) {
    const res = await get(path);
    await assertSite404(res.clone(), path);
    assert.match(withoutScripts(await res.text()), /<h1 class="scroll-title">Page introuvable<\/h1>/, `${path}: not in French`);
  }
});

test('§5.5-a security headers are present and x-powered-by is not', async () => {
  for (const path of [SHELL, '/admin/login']) {
    const res = await get(path);
    const csp = res.headers.get('content-security-policy') ?? '';
    assert.match(csp, /default-src 'self'/, path);
    // Self-hosted everything (REQ §6): the only outside origin any directive names is the image storage
    // (127.0.0.1 in a build against the local stack).
    for (const directive of csp.split(';').map((d) => d.trim()).filter(Boolean)) {
      const [name, ...sources] = directive.split(/\s+/);
      const outside = sources.filter((src) => /^https?:|^\*|^wss?:/.test(src) && !(name === 'img-src' && /^https:\/\/([a-z0-9-]+\.supabase\.co|127\.0\.0\.1)$/.test(src)));
      assert.deepEqual(outside, [], `${path}: ${name} admits ${outside}`);
    }
    assert.match(res.headers.get('strict-transport-security') ?? '', /max-age=\d+/, path);
    assert.equal(res.headers.get('x-powered-by'), null, path);
  }
});

test('§5.5-c canonical and alternate links use the www origin', async () => {
  if (!WITH_DB) return;
  const html = await (await get('/en/about')).text();
  const hrefs = [...html.matchAll(/<link[^>]+rel="(?:canonical|alternate)"[^>]+href="([^"]+)"/g)].map((m) => m[1]).filter((h) => h.startsWith('http'));
  assert.ok(hrefs.length > 0);
  for (const href of hrefs) assert.ok(href.startsWith('https://www.antelacus.com/'), href);
});

test('§5.8-a the language choice is remembered by a server-set cookie for a year', async () => {
  const res = await get('/api/locale?to=zh-CN&next=/zh-CN/about');
  assert.equal(res.status, 303);
  assert.equal(locationPath(res), '/zh-CN/about');
  const cookie = res.headers.get('set-cookie') ?? '';
  assert.match(cookie, /preferred_locale=zh-CN/);
  assert.match(cookie, /Max-Age=31536000/);
  assert.match(cookie, /Secure/);
  assert.match(res.headers.get('cache-control') ?? '', /no-store/);
  const evil = await get('/api/locale?to=zh-CN&next=https://evil.example/');
  assert.equal(locationPath(evil), '/zh-CN', 'an external next must not be followed');
});

test('§5.9-a one <main>, and the navigation sits before it', async () => {
  // A public page must have its navigation, before <main>; the skip link must land on <main> (TD-021 C-21).
  const pages = [['/admin/login', false], ...(WITH_DB ? [['/en/about', true], ['/en', true], ['/en/posts', true], [`/en/posts/${POST_SLUG}`, true]] : [])];
  for (const [path, public_] of pages) {
    const html = await (await get(path)).text();
    assert.equal((html.match(/<main\b/g) ?? []).length, 1, path);
    const nav = html.indexOf('<nav');
    if (public_) assert.ok(nav !== -1, `${path}: no <nav>`);
    if (nav !== -1) assert.ok(nav < html.indexOf('<main'), `${path}: <nav> is inside or after <main>`);
    const skip = /<a[^>]*class="skip-link"[^>]*href="#([^"]+)"|<a[^>]*href="#([^"]+)"[^>]*class="skip-link"/.exec(html);
    if (public_) {
      assert.ok(skip, `${path}: no skip link`);
      assert.match(html, new RegExp(`<main\\b[^>]*id="${skip[1] ?? skip[2]}"`), `${path}: the skip link does not land on <main>`);
    }
  }
});
