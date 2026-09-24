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
