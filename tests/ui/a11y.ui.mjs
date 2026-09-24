// REQ visual-upgrade §5.1 — accessibility floor, judged in a browser against the seeded local stack.
// Run by scripts/ui-check.sh; the harness (Batch 1) refuses any BASE_URL that is not this machine.
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');
const CJK = /[㐀-鿿]/;

test('acceptance §5.1-a every public template has zero axe violations in all four contexts', async () => {
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

test('acceptance §5.1-f English pages name no interface element in Chinese; the article body carries its own language', async () => {
  const { visit, TEMPLATES, SEED } = await h();
  const english = TEMPLATES.filter((t) => t.path.startsWith('/en'));
  await visit(['desktop'], english, async (page, ctx, t) => {
    // Interface, not content: a piece's own words carry their own lang (or are tags, the author's words).
    const names = await page.$$eval('[aria-label], button, [role="button"], summary, a, label', (els) =>
      els.filter((el) => !el.closest('[data-content], [data-meta="tags"]') && el.closest('[lang]')?.getAttribute('lang') === document.documentElement.lang)
        .map((el) => el.getAttribute('aria-label') ?? el.textContent ?? ''));
    const chinese = names.filter((n) => CJK.test(n));
    assert.deepEqual(chinese, [], `${t.name}: interface names in Chinese: ${chinese.map((n) => n.trim().slice(0, 20))}`);
  });
  for (const [path, lang] of [[`/en/posts/${SEED.post}`, 'zh-CN'], [`/zh-CN/notes/${SEED.note}`, 'en'], [`/fr/projects/${SEED.project}`, 'en'], ['/fr/about', 'en']]) {
    await visit(['desktop'], [{ name: path, path }], async (page) => {
      assert.equal(await page.getAttribute('[data-content]', 'lang'), lang, `${path}: body language`);
    });
  }
  // The motto is Latin under every language, and marked so.
  for (const locale of ['en', 'zh-CN', 'zh-HK', 'es', 'fr']) {
    await visit(['desktop'], [{ name: `home ${locale}`, path: `/${locale}` }], async (page) => {
      const motto = page.locator('[data-gate] [lang="la"]');
      assert.equal((await motto.textContent())?.trim(), 'Ante Lacus, Pax Mentis', `/${locale}: the motto is not the Latin`);
      // The mark closes the motto (a ruling of 2026-09-24), not the name.
      assert.equal(await page.locator('[data-gate] h1 [data-end-mark]').count(), 0, `/${locale}: the mark is beside the name`);
      assert.equal(await page.locator('[data-gate] .gate-motto [data-end-mark]').count(), 1, `/${locale}: the mark does not close the motto`);
    });
  }
});

test('acceptance §5.1-g every public page has exactly one h1 and no skipped heading level', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    const levels = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) => els.map((e) => Number(e.tagName[1])));
    assert.equal(levels.filter((l) => l === 1).length, 1, `${t.name}: h1 count`);
    levels.forEach((l, i) => i > 0 && assert.ok(l <= levels[i - 1] + 1, `${t.name}: h${levels[i - 1]} → h${l}`));
  });
});

test('acceptance §5.1-i tablet and 200% zoom do not scroll sideways; WCAG 1.4.12 spacing clips no text', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['tablet', 'zoom200'], TEMPLATES, async (page, ctx, t) => {
    const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert.ok(scroll <= client, `${ctx} ${t.name}: scrollWidth ${scroll} > ${client}`);
  });
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
    // Clipped text, not clipped content: a line of text that ends up outside a container that hides its
    // overflow. (A carousel hiding its off-screen images is not a 1.4.12 failure.)
    const clipped = await page.$$eval('body *', (els) => els.filter((el) => {
      const s = getComputedStyle(el);
      if (![s.overflow, s.overflowX, s.overflowY].some((o) => o === 'hidden' || o === 'clip')) return false;
      const box = el.getBoundingClientRect();
      // A box of a pixel or less is text hidden on purpose for screen readers (KaTeX's MathML copy, the
      // usual visually-hidden pattern) — never meant to be seen, so never clipped in 1.4.12's sense.
      if (box.width <= 1 || box.height <= 1) return false;
      const texts = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = texts.nextNode(); node; node = texts.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const line of range.getClientRects()) {
          if (line.width && (line.bottom > box.bottom + 1 || line.right > box.right + 1 || line.top < box.top - 1 || line.left < box.left - 1)) return true;
        }
      }
      return false;
    }).map((el) => el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map((c) => '.' + c).join('')));
    assert.deepEqual(clipped, [], `${t.name}: text clipped under 1.4.12 spacing in ${clipped}`);
  });
});
