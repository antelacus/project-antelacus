// REQ visual-upgrade §5.2 — the machine-decidable rules of docs/aesthetic-thesis.md.
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');
const SEAL = 'rgb(180, 42, 30)'; // 朱砂 #B42A1E

test('acceptance §5.2-a vermilion appears only on the end mark, at most once per page', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    const users = await page.$$eval('body *', (els, seal) => els.filter((el) => [getComputedStyle(el), getComputedStyle(el, '::before'), getComputedStyle(el, '::after')].some((s) => {
      return [s.color, s.backgroundColor, s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor, s.outlineColor]
        .some((c) => c === seal) && (s.color === seal || s.backgroundColor === seal || s.borderStyle !== 'none' || s.outlineStyle !== 'none');
    })).map((el) => el.hasAttribute('data-end-mark') ? 'end-mark' : el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map((c) => '.' + c).join('')), SEAL);
    assert.ok(users.every((u) => u === 'end-mark'), `${t.name}: vermilion on ${users.filter((u) => u !== 'end-mark')}`);
    assert.ok(users.length <= 1, `${t.name}: ${users.length} end marks`);
  });
});

test('acceptance §5.2-b nothing moves while the reader does nothing', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    await page.waitForTimeout(1500);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    assert.equal(running, 0, `${t.name}: ${running} animations running at rest`);
  });
});

test('acceptance §5.2-c no element casts a shadow', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    const shadowed = await page.$$eval('body *', (els) => els.filter((el) => {
      const s = getComputedStyle(el);
      return s.boxShadow !== 'none' || s.textShadow !== 'none';
    }).map((el) => el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map((c) => '.' + c).join('')));
    assert.deepEqual(shadowed, [], `${t.name}: shadows on ${shadowed}`);
  });
});

test('acceptance §5.2-d Cormorant Garamond is used only inside the gate', async () => {
  const { visit, TEMPLATES } = await h();
  await visit(['desktop'], TEMPLATES, async (page, ctx, t) => {
    const outside = await page.$$eval('body *', (els) => els.filter((el) =>
      /cormorant/i.test(getComputedStyle(el).fontFamily) && !el.closest('[data-gate]') && el.textContent?.trim()).map((el) => el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map((c) => '.' + c).join('')));
    assert.deepEqual(outside, [], `${t.name}: Cormorant outside the gate on ${outside}`);
  });
});

test('acceptance §5.2-e the navigation scrolls away with the page', async () => {
  const { visit, SEED, TEMPLATES } = await h();
  await visit(['desktop'], [{ name: 'post', path: `/en/posts/${SEED.post}` }], async (page) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const box = await page.locator('[data-site-nav]').boundingBox();
    assert.ok(box === null || box.y + box.height <= 0, 'the navigation is still in the viewport');
  });
  // Every other page may be too short to scroll; there, nothing may pin the navigation instead.
  await visit(['desktop'], TEMPLATES.filter((t) => !t.state && t.kind !== '404'), async (page, ctx, t) => {
    const pinned = await page.$eval('[data-site-nav]', (nav) => {
      for (let el = nav; el; el = el.parentElement) if (['fixed', 'sticky'].includes(getComputedStyle(el).position)) return el.tagName;
      return null;
    });
    assert.equal(pinned, null, `${t.name}: the navigation is pinned`);
  });
});

test('acceptance §5.2-f no post or project cover on the home or list pages', async () => {
  const { visit, TEMPLATES, SEED } = await h();
  const lists = TEMPLATES.filter((t) => t.kind === 'home' || t.kind === 'list');
  await visit(['desktop'], lists, async (page, ctx, t) => {
    const srcs = await page.$$eval('img', (imgs) => imgs.map((i) => i.currentSrc || i.src));
    const covers = srcs.filter((s) => SEED.coverFiles.some((f) => s.includes(f)));
    assert.deepEqual(covers, [], `${t.name}: cover images shown`);
    // Whatever the file: the only images on these pages are albums' own photos.
    const strays = await page.$$eval('main img', (imgs) => imgs.filter((i) => !i.closest('.window-photo, [data-photo-tile]')).map((i) => i.currentSrc || i.src));
    assert.deepEqual(strays, [], `${t.name}: images other than album photos`);
  });
});

test('acceptance §5.2-h the tail carries date, tags and language and ends on the end mark; the TOC starts closed', async () => {
  const { visit, SEED } = await h();
  await visit(['desktop'], [{ name: 'post', path: `/en/posts/${SEED.post}` }, { name: 'short note', path: `/en/notes/${SEED.note}` }, { name: 'project', path: `/en/projects/${SEED.project}` }, { name: 'album', path: `/en/gallery/${SEED.gallery}` }], async (page, ctx, t) => {
    const tail = page.locator('[data-colophon]');
    for (const part of ['written', 'tags', 'language']) assert.equal(await tail.locator(`[data-meta="${part}"]`).count(), 1, `${t.name}: no ${part}`);
    assert.ok(await tail.evaluate((el) => el.querySelector('[data-end-mark]') !== null && el.lastElementChild?.matches('[data-end-mark], :has(> [data-end-mark])')), `${t.name}: tail does not end on the end mark`);
  });
  // The tail's last line leads back up (the navigation does not follow the reader) and carries the mark.
  await visit(['desktop'], [{ name: 'post', path: `/en/posts/${SEED.post}` }], async (page) => {
    const back = page.locator('[data-colophon] [data-meta="return"]');
    assert.equal(await back.locator('[data-end-mark]').count(), 1, 'the mark is not on the return line');
    await back.locator('a[href="#site-nav"]').click();
    const navTop = await page.locator('[data-site-nav]').boundingBox();
    assert.ok(navTop && navTop.y >= 0 && navTop.y < 50, 'back to top did not reach the navigation');
    await back.locator('a[href="#contents"]').click();
    assert.notEqual(await page.locator('details[data-toc]').getAttribute('open'), null, 'the contents link did not unfold the contents');
  });
  await visit(['desktop'], [{ name: 'short note', path: `/en/notes/${SEED.note}` }], async (page) => {
    assert.equal(await page.locator('[data-colophon] a[href="#contents"]').count(), 0, 'a piece without contents offers a link to them');
  });
  await visit(['desktop'], [{ name: 'post', path: `/en/posts/${SEED.post}` }], async (page) => {
    const toc = page.locator('details[data-toc]');
    assert.equal(await toc.count(), 1, 'a post with three h2 has no TOC');
    assert.equal(await toc.getAttribute('open'), null, 'the TOC starts open');
    await toc.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.notEqual(await toc.getAttribute('open'), null, 'Enter did not open the TOC');
  });
  await visit(['desktop'], [{ name: 'short note', path: `/en/notes/${SEED.note}` }], async (page) => {
    assert.equal(await page.locator('details[data-toc]').count(), 0, 'a note with fewer than three h2 has a TOC');
  });
});
