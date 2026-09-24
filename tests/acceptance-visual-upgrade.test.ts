import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// REQ docs/features/visual-upgrade/REQ.md — the criteria a unit test can carry. Each is marked `todo`
// with its batch until that batch lands; the version cannot close with a mark left. Criteria that need
// a browser are in tests/ui/ (run by scripts/ui-check.sh); Jason's device run and sign-off are Phase 4
// evidence in the TRACK.

const ROOT = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

// Modules a later batch creates are imported by a runtime path so the type check stays green until then.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the module's types do not exist yet
const load = (path: string): Promise<any> => import(path);

// ---------- §5.2 临湖 ----------

test('acceptance §5.2-g the home windows are the newest item of each type, an empty type has none', async () => {
  const { selectWindows } = await load('../src/lib/home.js');
  const item = (type: string, slug: string, date: string, extra = {}) => ({ type, slug, title: slug, date, tags: [], ...extra });
  const windows = selectWindows({
    post: [item('post', 'old-post', '2025-01-01'), item('post', 'new-post', '2025-07-22')],
    note: [item('note', 'a-note', '2025-07-24')],
    gallery: [item('gallery', 'album', '2025-08-31', { cover: '/images/a.jpg' })],
    project: [],
  });
  assert.deepEqual(windows.map((w: { type: string; slug: string }) => `${w.type}:${w.slug}`).sort(),
    ['gallery:album', 'note:a-note', 'post:new-post']);
  assert.equal(windows.find((w: { type: string }) => w.type === 'gallery').image, '/images/a.jpg', 'the photo window shows the album cover');
});

// Invariant 18 (DESIGN §4): vermilion and the gate's typeface are each reachable from exactly one rule,
// so neither can spread by a stylesheet edit that no browser check happens to look at.
test('invariant 18 — globals.css uses vermilion only for the end mark and Cormorant only for the gate', () => {
  const css = read('src/app/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const rulesUsing = (needle: string) => [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)]
    .filter(([, , body]) => body.includes(needle)).map(([, selector]) => selector.trim());
  assert.deepEqual(rulesUsing('var(--color-seal)'), ['.end-mark']);
  assert.deepEqual(rulesUsing('var(--font-gate)'), ['.gate']);
  assert.deepEqual(rulesUsing('--font-cormorant-garamond'), [':root'], 'only the --font-gate definition names Cormorant');
});

// Invariant 19 (DESIGN §4): hover is the stylesheet's, and colour too — a component that sets either in
// script bypasses the one place the thesis's rules are checked.
test('invariant 19 — public components have no mouse-over handlers and no inline colours', () => {
  const files = (dir: string): string[] => readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(ROOT, path)).isDirectory() ? files(path) : /\.tsx$/.test(name) ? [path] : [];
  });
  const publicFiles = [...files('src/components').filter((f) => !f.startsWith(join('src/components', 'admin'))), ...files('src/app/[locale]')];
  assert.ok(publicFiles.length > 20, `scanned ${publicFiles.length} files — the scan looks broken`);
  const offenders = publicFiles.filter((f) => /onMouse(Enter|Leave)|style=\{\{[^}]*\b(color|background(Color)?|borderColor)\s*:/.test(read(f)));
  assert.deepEqual(offenders.map((f) => relative(ROOT, join(ROOT, f))), []);
});

// ---------- §5.3 about page in the database ----------

test('acceptance §5.3-a the about page falls back: requested language, then English, then any', async () => {
  const { pickPageLocale } = await load('../src/lib/page-locale.js');
  assert.equal(pickPageLocale(['en', 'zh-CN', 'fr'], 'fr'), 'fr');
  assert.equal(pickPageLocale(['en', 'zh-CN'], 'fr'), 'en');
  assert.equal(pickPageLocale(['zh-CN', 'es'], 'fr'), pickPageLocale(['es', 'zh-CN'], 'fr'), '"any" is deterministic, not row order');
  assert.ok(['zh-CN', 'es'].includes(pickPageLocale(['zh-CN', 'es'], 'fr')));
  assert.equal(pickPageLocale([], 'fr'), null);
});

test('acceptance §5.3-c no MDX renderer and no repo-file pages remain', () => {
  const pkg = JSON.parse(read('package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps['next-mdx-remote'], undefined, 'next-mdx-remote is still a dependency');
  assert.equal(deps['gray-matter'], undefined, 'gray-matter is still a dependency');
  assert.ok(!existsSync(join(ROOT, 'src/content/pages')), 'src/content/pages still exists');
});

// The pre-launch check of DESIGN §2.6 that SQL cannot make: each migrated body renders, with no
// leftover markup from the MDX it came from, and every link is one the renderer keeps.
test('acceptance §5.3 the about migration holds five languages whose bodies render cleanly', async () => {
  const sql = read('supabase/migrations/20260923100100_about_content.sql');
  const rows = [...sql.matchAll(/\('about', '([^']+)', '[^']+', \$md\$([\s\S]*?)\$md\$, 'published'\)/g)];
  assert.deepEqual(rows.map(([, locale]) => locale).sort(), ['en', 'es', 'fr', 'zh-CN', 'zh-HK']);
  const { renderMarkdown } = await load('../src/lib/markdown/index.js');
  const { renderToStaticMarkup } = await import('react-dom/server');
  for (const [, locale, body] of rows) {
    const html = renderToStaticMarkup(renderMarkdown(body));
    assert.doesNotMatch(body, /<[a-z]|className=/i, `${locale}: MDX markup left in the body`);
    assert.doesNotMatch(html, /<h1/, `${locale}: a second h1`);
    assert.equal((html.match(/<a /g) ?? []).length, 4, `${locale}: the four contact links`);
    assert.match(html, /Ante Lacus, Pax Mentis/, `${locale}: the motto`);
  }
});

// ---------- §5.4 hook rules ----------

test('acceptance §5.4-a the three React Compiler rules are errors for the site\'s components', async () => {
  // What ESLint actually applies to a component, not what the config file happens to say.
  const { ESLint } = await import('eslint');
  const config = await new ESLint({ cwd: ROOT }).calculateConfigForFile(join(ROOT, 'src/components/Nav.tsx'));
  for (const rule of ['set-state-in-effect', 'immutability', 'static-components']) {
    const setting = config.rules?.[`react-hooks/${rule}`];
    const level = Array.isArray(setting) ? setting[0] : setting;
    assert.ok(level === 2 || level === 'error', `react-hooks/${rule} is ${JSON.stringify(setting)}, not an error`);
  }
});

// ---------- §5.5 the gate ----------

test('acceptance §5.5-a the gate runs the UI checks on every push, and a deploy waits for them', () => {
  const gate = read('.github/workflows/check.yml');
  assert.match(gate, /^on:\n(?: {2}.*\n)*? {2}push:/m, 'check.yml does not run on push');
  assert.match(gate, /^ {2}ui:\n(?: {4}.*\n|\n)*? {6}- run: scripts\/ui-check\.sh$/m, 'check.yml has no ui job running the UI gate');
  // A called workflow is one unit to its caller: `needs: check` waits for every job in check.yml.
  const deploy = read('.github/workflows/deploy.yml');
  assert.match(deploy, /^ {2}check:\n {4}uses: \.\/\.github\/workflows\/check\.yml$/m, 'deploy.yml does not call the gate');
  assert.match(deploy, /^ {4}needs: check$/m, 'the deploy job does not wait for the gate');
});
