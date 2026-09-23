// The UI gate's browser side: opens seeded pages in each context, proves each is the page it claims to
// be before a check sees it, and records which template × context combinations axe actually judged.
// Run only by scripts/ui-check.sh, which starts the local stack and passes BASE_URL and the admin's login.
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { ADMIN_TEMPLATES, CONTEXTS, EXTRA_CONTEXTS, SEED, TEMPLATES } from './manifest.mjs';

export { ADMIN_TEMPLATES, CONTEXTS, SEED, TEMPLATES };

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
export const BASE = process.env.BASE_URL?.replace(/\/$/, '');
if (!BASE) throw new Error('BASE_URL is required (scripts/ui-check.sh sets it)');
// The gate seeds, logs in and saves: it must never reach a site with real content.
if (!LOOPBACK.has(new URL(BASE).hostname)) throw new Error(`refusing a BASE_URL off this machine: ${BASE}`);

const ALL_CONTEXTS = { ...CONTEXTS, ...EXTRA_CONTEXTS };
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const engines = { chromium, webkit };
const browsers = new Map();

async function browserFor(engine) {
  if (!browsers.has(engine)) browsers.set(engine, engines[engine].launch());
  return browsers.get(engine);
}

export async function closeBrowsers() {
  for (const pending of browsers.values()) await (await pending).close();
  browsers.clear();
}

// ---------- coverage ----------

const manifestEntries = new Set([...TEMPLATES, ...ADMIN_TEMPLATES]);
const judged = new Set();
const opened = new WeakMap(); // page → its combination key, for manifest templates only
const key = (ctx, t) => `${ctx} · ${t.name}`;

/** Every combination the manifest requires axe to judge: templates in each §5.1-a context, admin on desktop. */
export function requiredCoverage() {
  return [
    ...Object.keys(CONTEXTS).flatMap((ctx) => TEMPLATES.map((t) => ({ key: key(ctx, t), state: t.state }))),
    ...ADMIN_TEMPLATES.map((t) => ({ key: key('admin', t), state: undefined })),
  ];
}

export const judgedCoverage = () => new Set(judged);

// ---------- opening a page ----------

async function assertIdentity(page, response, t) {
  assert.equal(response?.status(), t.status ?? 200, `status of ${t.path}`);
  await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.locator('main, [role="main"]').count(), 'no <main>: not the site shell');
  if (t.text) assert.ok(await page.locator('main').getByText(t.text).count(), `"${t.text}" is not on the page`);
  const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
  assert.deepEqual(broken, [], 'broken images');
}

// A trigger the page does not render fails at once, not after the action's timeout.
async function present(page, selector) {
  const locator = page.locator(selector).first();
  assert.ok(await locator.count(), `no ${selector} on the page`);
  return locator;
}

async function enterState(page, state) {
  switch (state) {
    case undefined:
      return;
    case 'search':
      await (await present(page, '[data-open-search]')).click();
      await page.locator('dialog[open]').waitFor();
      return;
    case 'viewer':
      await (await present(page, '[data-photo-index="0"]')).click();
      await page.locator('.pswp--open').waitFor();
      return;
    case 'toc':
      await (await present(page, 'details[data-toc] > summary')).click();
      assert.notEqual(await page.locator('details[data-toc]').getAttribute('open'), null, 'the TOC did not open');
      return;
    case 'hover':
      await (await present(page, '[data-catalog-row] a')).hover();
      return;
    case 'focus': {
      // By keyboard, so :focus-visible applies as it does for a reader. WebKit, like Safari, skips links
      // on a plain Tab.
      const tab = page.context().browser().browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press(tab);
        if (await page.evaluate(() => document.activeElement?.closest('main') !== null)) return;
      }
      assert.fail('Tab never reached a link in <main>');
      return;
    }
    default:
      throw new Error(`unknown state ${state}`);
  }
}

/**
 * Opens each template in each named context and hands the page to `check`. Every combination is tried;
 * the failures are reported together at the end, so one broken page does not hide the others.
 */
export async function visit(contextNames, templates, check, { storageState, coverageAs } = {}) {
  const failures = [];
  for (const ctx of contextNames) {
    const spec = ALL_CONTEXTS[ctx];
    assert.ok(spec, `unknown context ${ctx}`);
    for (const t of templates) {
      const context = await (await browserFor(spec.engine)).newContext({ ...spec.options, storageState });
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      try {
        const response = await page.goto(BASE + t.path, { waitUntil: 'load' });
        await assertIdentity(page, response, t);
        await enterState(page, t.state);
        if (manifestEntries.has(t)) opened.set(page, key(coverageAs ?? ctx, t));
        await check(page, ctx, t);
      } catch (error) {
        failures.push(`${ctx} ${t.name}: ${error.message.split('\n')[0]}`);
      } finally {
        await context.close();
      }
    }
  }
  assert.deepEqual(failures, [], `${failures.length} of ${contextNames.length * templates.length} failed`);
}

let adminSession;

async function logIn() {
  const { UI_ADMIN_EMAIL: email, UI_ADMIN_PASSWORD: password } = process.env;
  assert.ok(email && password, 'UI_ADMIN_EMAIL and UI_ADMIN_PASSWORD are required (scripts/ui-check.sh sets them)');
  const context = await (await browserFor('chromium')).newContext(CONTEXTS.desktop.options);
  try {
    const page = await context.newPage();
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name=email]', email);
    await page.fill('input[name=password]', password);
    await Promise.all([page.waitForURL(`${BASE}/admin`), page.click('button[type=submit]')]);
    return await context.storageState();
  } finally {
    await context.close();
  }
}

/** Opens admin templates on desktop, logged in as the seeded admin unless the template is `anonymous`. */
export async function visitAdmin(templates, check) {
  adminSession ??= logIn();
  const session = await adminSession;
  const failures = [];
  for (const anonymous of [true, false]) {
    const group = templates.filter((t) => Boolean(t.anonymous) === anonymous);
    if (!group.length) continue;
    await visit(['desktop'], group, async (page, ctx, t) => {
      if (!anonymous) assert.doesNotMatch(new URL(page.url()).pathname, /^\/admin\/login/, 'not logged in');
      await check(page, t);
    }, { storageState: anonymous ? undefined : session, coverageAs: 'admin' }).catch((error) => failures.push(error.message));
  }
  assert.deepEqual(failures, []);
}

/** The page's axe violations under the WCAG 2.x A and AA rules; records the combination as judged. */
export async function axe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  if (opened.has(page)) judged.add(opened.get(page));
  return violations;
}

/** The HTML an anonymous visitor gets: no browser, no cookies. */
export async function anonymousHtml(path) {
  const res = await fetch(BASE + path);
  assert.equal(res.status, 200, path);
  return res.text();
}
