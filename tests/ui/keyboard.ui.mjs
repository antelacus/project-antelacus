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

test('acceptance §5.1-c search: the results are announced, and choosing one takes focus to the new page', async () => {
  const { visit, SEED } = await h();
  await visit(['desktop'], [{ name: 'home', path: '/en' }], async (page) => {
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.matches('[data-open-search]')));
    await page.keyboard.press('Enter');
    await page.keyboard.type('seed note');
    await page.waitForFunction(() => /\d/.test(document.querySelector('dialog[open] [role="status"]')?.textContent ?? ''));
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.closest('dialog[open] .catalog [data-meta="title"]') !== null), 10);
    await Promise.all([page.waitForURL(new RegExp(`/en/notes/${SEED.note}$`)), page.keyboard.press('Enter')]);
    await page.waitForFunction(() => document.activeElement?.id === 'main-content');
    assert.equal(await page.locator('dialog[open]').count(), 0, 'the dialog stayed open');
  });
});

test('acceptance §5.1-c search: choosing the page already open takes focus to its content, not back to the button', async () => {
  const { visit, SEED } = await h();
  await visit(['desktop'], [{ name: 'note', path: `/en/notes/${SEED.note}` }], async (page) => {
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.matches('[data-open-search]')));
    await page.keyboard.press('Enter');
    await page.keyboard.type('seed note');
    await page.waitForFunction(() => /\d/.test(document.querySelector('dialog[open] [role="status"]')?.textContent ?? ''));
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.closest('dialog[open] .catalog [data-meta="title"]') !== null), 10);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'main-content', 'focus went back to the search button');
  });
});

test('acceptance §5.1-c search: Ctrl+K opens it mid-page, and Esc returns the reader to where they were', async () => {
  const { visit, SEED } = await h();
  await visit(['desktop'], [{ name: 'post', path: `/en/posts/${SEED.post}` }], async (page) => {
    const link = page.locator('[data-content] a[href^="http"]').first();
    await link.focus();
    await page.keyboard.press('Control+K');
    await page.locator('dialog[open]').waitFor();
    assert.ok(await page.evaluate(() => document.activeElement?.id === 'search-field'), 'focus did not move into the search field');
    await page.keyboard.press('Escape');
    assert.ok(await link.evaluate((el) => el === document.activeElement), 'focus did not return to the reader\'s place');
  });
});

test('acceptance §5.1-c search: when the index fails, Retry announces it and keeps focus', async () => {
  const { visit } = await h();
  await visit(['desktop'], [{ name: 'home', path: '/en' }], async (page) => {
    let fail = true;
    await page.route('**/api/search-index', (route) => (fail ? route.fulfill({ status: 500, body: '{}' }) : route.continue()));
    await tabTo(page, (p) => p.evaluate(() => document.activeElement?.matches('[data-open-search]')));
    await page.keyboard.press('Enter');
    await page.locator('[data-search-retry]').waitFor();
    assert.ok((await page.textContent('dialog[open] [role="status"]'))?.trim(), 'the failure is not announced');
    await page.locator('[data-search-retry]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-search-retry]:not([aria-disabled="true"])').waitFor();
    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-search-retry')), 'a failed retry lost focus');
    fail = false;
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'search-field');
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
    await page.waitForFunction(() => document.querySelector('.pswp__counter')?.textContent?.trim().startsWith('2'));
    await page.keyboard.press('Escape');
    await page.waitForSelector('.pswp--open', { state: 'detached' });
    assert.ok(await page.evaluate(() => document.activeElement?.matches('[data-photo-index="0"]')), 'focus did not return to the photo');
  });
});
