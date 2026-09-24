// REQ visual-upgrade §5.1-c — the core public tasks with the keyboard alone (desktop context).
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');
const focused = (page) => page.evaluate(() => {
  const el = document.activeElement;
  return { tag: el?.tagName, name: el?.getAttribute('aria-label') ?? el?.textContent?.trim().slice(0, 40), outline: el ? getComputedStyle(el).outlineStyle : 'none' };
});

async function tabTo(page, predicate, limit = 40) {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    assert.notEqual(f.outline, 'none', `focus on ${f.tag} "${f.name}" is not visible`);
    if (await predicate(page)) return;
  }
  assert.fail('target never received focus');
}

test('acceptance §5.1-c search: open, type, reach a result, Esc returns focus to the trigger', async () => {
  const { visit } = await h();
  await visit(['desktop'], [{ name: 'home', path: '/en' }], async (page) => {
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.matches('[data-open-search]')));
    await page.keyboard.press('Enter');
    assert.ok(await page.evaluate(() => document.activeElement?.closest('dialog[open]') !== null), 'focus did not move into the dialog');
    await page.keyboard.type('seed');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => document.activeElement?.closest('dialog[open]') !== null), 'Tab left the dialog');
    }
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(() => document.activeElement?.matches('[data-open-search]')), 'focus did not return to the trigger');
  });
});

test('acceptance §5.1-c language: switch to another language with the keyboard', async () => {
  const { visit } = await h();
  await visit(['desktop'], [{ name: 'posts', path: '/en/posts' }], async (page) => {
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.matches('[data-language-switch] summary')));
    await page.keyboard.press('Enter');
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.getAttribute('hreflang') === 'fr'), 10);
    await Promise.all([page.waitForURL(/\/fr\/posts$/), page.keyboard.press('Enter')]);
  });
});

test('acceptance §5.1-c gallery: open the viewer, page through, Esc returns focus to the photo', async () => {
  const { visit, SEED } = await h();
  await visit(['desktop'], [{ name: 'album', path: `/en/gallery/${SEED.gallery}` }], async (page) => {
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.matches('[data-photo-index="0"]')));
    await page.keyboard.press('Enter');
    await page.waitForSelector('.pswp--open');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.pswp--open', { state: 'detached' });
    assert.ok(await page.evaluate(() => document.activeElement?.matches('[data-photo-index="0"]')), 'focus did not return to the photo');
  });
});
