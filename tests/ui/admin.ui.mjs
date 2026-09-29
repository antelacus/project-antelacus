// REQ visual-upgrade §5.1-b — the admin templates, logged in as the seeded synthetic admin.
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');

test('acceptance §5.1-b the four admin templates have zero axe violations', async () => {
  const { visitAdmin, axe, ADMIN_TEMPLATES } = await h();
  const failures = [];
  await visitAdmin(ADMIN_TEMPLATES, async (page, t) => {
    for (const v of await axe(page)) failures.push(`${t.name}: ${v.id} ×${v.nodes.length}`);
  });
  assert.deepEqual(failures, []);
});

test('acceptance §5.3-a through the page: each language shows its own version, a draft or missing one falls back to English', async () => {
  const { anonymousHtml } = await h();
  const title = (html) => /<h1[^>]*>([^<]*)<\/h1>/.exec(html)?.[1];
  const lang = (html) => /<div class="prose[^"]*" lang="([^"]+)"/.exec(html)?.[1];
  assert.deepEqual([title(await anonymousHtml('/zh-CN/about')), lang(await anonymousHtml('/zh-CN/about'))], ['种子关于页', 'zh-CN']);
  for (const path of ['/es/about', '/fr/about']) {
    const html = await anonymousHtml(path);
    assert.deepEqual([title(html), lang(html)], ['Seed about', 'en'], `${path}: not the English fallback`);
  }
});

test('acceptance §5.3-b after a save the next anonymous visit shows it, fallback languages included', async () => {
  const { anonymousHtml, visitAdmin, BASE } = await h();
  const marker = `marker-${Date.now()}`;
  // Warm the caches: English directly, French through the fallback to English.
  for (const path of ['/en/about', '/fr/about']) assert.doesNotMatch(await anonymousHtml(path), new RegExp(marker));
  await visitAdmin([{ name: 'about en editor', path: '/admin/pages/about/en' }], async (page) => {
    const body = page.locator('[data-editor-body] .cm-content');
    await body.click();
    await page.keyboard.press('End');
    await page.keyboard.type(`\n\n${marker}`);
    await Promise.all([page.waitForURL(/saved=/), page.getByRole('button', { name: /publish|发布|save|保存/i }).first().click()]);
  });
  for (const path of ['/en/about', '/fr/about']) assert.match(await anonymousHtml(path), new RegExp(marker), `${BASE}${path} is stale`);
});

test('acceptance §5.3-b a language added in the admin is what the next visit to it shows', async () => {
  const { anonymousHtml, visitAdmin } = await h();
  const title = `Version française ${Date.now()}`;
  assert.doesNotMatch(await anonymousHtml('/fr/about'), new RegExp(title));
  await visitAdmin([{ name: 'about fr editor', path: '/admin/pages/about/fr' }], async (page) => {
    await page.fill('input[name=title]', title);
    await page.locator('[data-editor-body] .cm-content').click();
    await page.keyboard.type('Une page en français.');
    await Promise.all([page.waitForURL(/saved=published/), page.getByRole('button', { name: 'Publish', exact: true }).click()]);
  });
  const html = await anonymousHtml('/fr/about');
  assert.match(html, new RegExp(title), '/fr/about still shows the fallback');
  assert.match(html, /<div class="prose[^"]*" lang="fr"/);
});

test('a new item\'s unsaved body survives leaving the editor and coming back within the app', async () => {
  const { visitAdmin } = await h();
  const marker = `unsaved-${Date.now()}`;
  await visitAdmin([{ name: 'new post editor', path: '/admin/content/post/new' }], async (page) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type(marker);
    // Client-side both ways: the module, and whatever it cached on the first visit, stays loaded.
    await Promise.all([page.waitForURL(/\/admin\/content\/post$/), page.getByRole('link', { name: 'posts', exact: true }).click()]);
    await Promise.all([page.waitForURL(/\/admin\/content\/post\/new$/), page.getByRole('link', { name: 'New post' }).click()]);
    await page.locator('.cm-content', { hasText: marker }).waitFor({ timeout: 5000 });
  });
});

// ---------- REQ release-pipeline §5.8, §5.10 — marked `todo` with their batch until it lands ----------

test('acceptance release-pipeline §5.8-a RLS: a signed-in non-admin sees no drafts, the admin sees them', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.UI_SUPABASE_URL;
  const key = process.env.UI_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(url && key && process.env.UI_MEMBER_EMAIL, 'ui-check.sh does not hand over the stack and a non-admin user yet');
  const drafts = async (email, password) => {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email, password });
    assert.equal(error, null, `${email} could not sign in`);
    const { data } = await client.from('content_items').select('slug').eq('status', 'draft');
    return data?.length ?? 0;
  };
  assert.equal(await drafts(process.env.UI_MEMBER_EMAIL, process.env.UI_MEMBER_PASSWORD), 0, 'a non-admin reads drafts');
  assert.ok(await drafts(process.env.UI_ADMIN_EMAIL, process.env.UI_ADMIN_PASSWORD) > 0, 'the admin reads no drafts');
});

test('acceptance release-pipeline §5.8-b/c without the service-role key the admin opens, shows drafts, and refuses to save', async () => {
  const { SEED } = await h();
  const base = process.env.UI_READONLY_BASE_URL;
  assert.ok(base, 'ui-check.sh does not start a read-only instance yet');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name=email]', process.env.UI_ADMIN_EMAIL);
    await page.fill('input[name=password]', process.env.UI_ADMIN_PASSWORD);
    await Promise.all([page.waitForURL(`${base}/admin`), page.click('button[type=submit]')]);
    await page.goto(`${base}/admin/content/post`);
    assert.ok(await page.getByText(SEED.draftTitle).count(), 'the list shows no draft');
    await page.goto(`${base}/admin/content/post/${SEED.post}`);
    // The seeded post is published, so its save button reads "Publish changes".
    await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
    await page.getByText('Read-only environment — not saved.').waitFor({ timeout: 5000 });
  } finally {
    await browser.close();
  }
});

test('acceptance release-pipeline §5.10-b an uploaded image lands in the bucket and loads on the page', async () => {
  const { visitAdmin, SEED } = await h();
  // An existing post: an upload is filed under the item's slug, and a new item has none yet.
  await visitAdmin([{ name: 'post editor upload', path: `/admin/content/post/${SEED.post}` }], async (page) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/admin/upload')),
      page.locator('input[type=file]').first().setInputFiles('public/images/posts/content/2025-07-13-llm-note/image2.png'),
    ]);
    assert.equal(response.status(), 200, `the upload failed: ${await response.text()}`);
    const { url } = await response.json();
    const image = await fetch(url);
    assert.equal(image.status, 200, `${url} is not in the bucket`);
    assert.match(image.headers.get('content-type') ?? '', /^image\//, url);
    const shown = page.locator(`img[src="${url}"]`);
    if (await shown.count()) assert.ok(await shown.first().evaluate((img) => img.complete && img.naturalWidth > 0), 'the uploaded image does not load on the page');
  });
});

test('acceptance release-pipeline §5.10-c after signing out the admin is back at the login page', async () => {
  const { visitAdmin, BASE } = await h();
  await visitAdmin([{ name: 'sign out', path: '/admin' }], async (page) => {
    await Promise.all([page.waitForURL(/\/admin\/login/), page.getByRole('button', { name: /sign out/i }).click()]);
    await page.goto(`${BASE}/admin`);
    assert.match(new URL(page.url()).pathname, /^\/admin\/login/);
  });
});

test('acceptance release-pipeline §5.10-d every content type and the about page have list and editor checks', async () => {
  const { ADMIN_TEMPLATES } = await h();
  const paths = ADMIN_TEMPLATES.map((t) => t.path);
  for (const type of ['post', 'note', 'gallery', 'project']) {
    assert.ok(paths.includes(`/admin/content/${type}`), `no ${type} list`);
    assert.ok(paths.some((p) => p.startsWith(`/admin/content/${type}/`)), `no ${type} editor`);
  }
  assert.ok(paths.includes('/admin/pages/about') && paths.some((p) => p.startsWith('/admin/pages/about/')), 'no about page list or editor');
});
