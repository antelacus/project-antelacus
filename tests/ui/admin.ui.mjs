// REQ visual-upgrade §5.1-b — the admin templates, logged in as the seeded synthetic admin.
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');

test('acceptance §5.1-b the four admin templates have zero axe violations', { todo: 'Batch 6' }, async () => {
  const { visitAdmin, axe, ADMIN_TEMPLATES } = await h();
  const failures = [];
  await visitAdmin(ADMIN_TEMPLATES, async (page, t) => {
    for (const v of await axe(page)) failures.push(`${t.name}: ${v.id} ×${v.nodes.length}`);
  });
  assert.deepEqual(failures, []);
});

test('acceptance §5.3-b after a save the next anonymous visit shows it, fallback languages included', { todo: 'Batch 2' }, async () => {
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
