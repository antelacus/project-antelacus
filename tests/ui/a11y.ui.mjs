// REQ visual-upgrade §5.1 — accessibility floor, judged in a browser against the seeded local stack.
// Run by scripts/ui-check.sh; the harness (Batch 1) refuses any BASE_URL that is not this machine.
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');
const CJK = /[㐀-鿿]/;

test('acceptance §5.1-a every public template has zero axe violations in all four contexts', { todo: 'Batch 6' }, async () => {
  const { visit, axe, TEMPLATES, CONTEXTS } = await h();
  const failures = [];
  await visit(Object.keys(CONTEXTS), TEMPLATES, async (page, ctx, t) => {
    for (const v of await axe(page)) failures.push(`${ctx} ${t.name}: ${v.id} ×${v.nodes.length}`);
  });
  assert.deepEqual(failures, []);
});

test('acceptance §5.1-d without hover, every item on the home and list pages shows title, date and tags', async () => {
  const { visit, TEMPLATES } = await h();
  const lists = TEMPLATES.filter((t) => t.kind === 'home' || t.kind === 'list');
  await visit(['touchWebkit', 'touchBlink'], lists, async (page, ctx, t) => {
    const items = page.locator('[data-window], [data-catalog-row], [data-photo-tile]');
    assert.ok((await items.count()) > 0, `${ctx} ${t.name}: no items`);
    for (const item of await items.all()) {
      for (const part of ['title', 'date', 'tags']) {
        const el = item.locator(`[data-meta="${part}"]`);
        if (part === 'tags' && (await el.count()) === 0) continue; // an item without tags has no tag line
        await el.scrollIntoViewIfNeeded();
        assert.ok(await el.isVisible(), `${ctx} ${t.name}: ${part} not visible`);
        const opacity = await el.evaluate((n) => Number(getComputedStyle(n).opacity));
        assert.ok(opacity > 0.5, `${ctx} ${t.name}: ${part} opacity ${opacity}`);
      }
    }
  });
});

test('acceptance §5.1-e at 320px no public page scrolls sideways', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['narrow'], TEMPLATES, async (page, ctx, t) => {
    const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert.ok(scroll <= client, `${t.name}: scrollWidth ${scroll} > ${client}`);
  });
});

test('acceptance §5.1-f English pages name no interface element in Chinese; the article body carries its own language', { todo: 'Batch 6' }, async () => {
  const { visit, TEMPLATES, SEED } = await h();
  const english = TEMPLATES.filter((t) => t.path.startsWith('/en'));
  await visit(['desktop'], english, async (page, ctx, t) => {
    const names = await page.$$eval('[aria-label], button, [role="button"], summary', (els) =>
      els.filter((el) => !el.closest('[data-content]')).map((el) => el.getAttribute('aria-label') ?? el.textContent ?? ''));
    const chinese = names.filter((n) => CJK.test(n));
    assert.deepEqual(chinese, [], `${t.name}: interface names in Chinese`);
  });
  await visit(['desktop'], [{ name: 'zh post under /en', path: `/en/posts/${SEED.post}` }], async (page) => {
    assert.equal(await page.getAttribute('[data-content]', 'lang'), 'zh-CN');
  });
});

test('acceptance §5.1-g every public page has exactly one h1 and no skipped heading level', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    const levels = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) => els.map((e) => Number(e.tagName[1])));
    assert.equal(levels.filter((l) => l === 1).length, 1, `${t.name}: h1 count`);
    levels.forEach((l, i) => i > 0 && assert.ok(l <= levels[i - 1] + 1, `${t.name}: h${levels[i - 1]} → h${l}`));
  });
});

test('acceptance §5.1-i tablet and 200% zoom do not scroll sideways; WCAG 1.4.12 spacing clips no text', { todo: 'Batch 6' }, async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['tablet', 'zoom200'], TEMPLATES, async (page, ctx, t) => {
    const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert.ok(scroll <= client, `${ctx} ${t.name}: scrollWidth ${scroll} > ${client}`);
  });
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
    const clipped = await page.$$eval('body *', (els) => els.filter((el) => {
      const s = getComputedStyle(el);
      const hides = [s.overflow, s.overflowX, s.overflowY].some((o) => o === 'hidden' || o === 'clip');
      return hides && el.textContent?.trim() && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    }).map((el) => el.tagName));
    assert.deepEqual(clipped, [], `${t.name}: text clipped under 1.4.12 spacing`);
  });
});
