import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

test('acceptance §5.2-g the home windows are the newest item of each type, an empty type has none', { todo: 'Batch 3' }, async () => {
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

// ---------- §5.3 about page in the database ----------

test('acceptance §5.3-a the about page falls back: requested language, then English, then any', { todo: 'Batch 2' }, async () => {
  const { pickPageLocale } = await load('../src/lib/page-locale.js');
  assert.equal(pickPageLocale(['en', 'zh-CN', 'fr'], 'fr'), 'fr');
  assert.equal(pickPageLocale(['en', 'zh-CN'], 'fr'), 'en');
  assert.equal(pickPageLocale(['zh-CN', 'es'], 'fr'), pickPageLocale(['es', 'zh-CN'], 'fr'), '"any" is deterministic, not row order');
  assert.ok(['zh-CN', 'es'].includes(pickPageLocale(['zh-CN', 'es'], 'fr')));
  assert.equal(pickPageLocale([], 'fr'), null);
});

test('acceptance §5.3-c no MDX renderer and no repo-file pages remain', { todo: 'Batch 2' }, () => {
  const pkg = JSON.parse(read('package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps['next-mdx-remote'], undefined, 'next-mdx-remote is still a dependency');
  assert.equal(deps['gray-matter'], undefined, 'gray-matter is still a dependency');
  assert.ok(!existsSync(join(ROOT, 'src/content/pages')), 'src/content/pages still exists');
});

// ---------- §5.4 hook rules ----------

test('acceptance §5.4-a the three React Compiler rules are no longer downgraded', { todo: 'Batch 6' }, () => {
  const config = read('eslint.config.mjs');
  for (const rule of ['set-state-in-effect', 'immutability', 'static-components']) {
    assert.doesNotMatch(config, new RegExp(`react-hooks/${rule}['"]\\s*:\\s*['"]?(warn|off|1|0)`), `${rule} is still downgraded`);
  }
});

// ---------- §5.5 the gate ----------

test('acceptance §5.5-a the gate runs the UI checks on every push, and a deploy waits for them', () => {
  const gate = read('.github/workflows/check.yml');
  assert.match(gate, /^ {2}ui:\n(?: {4}.*\n|\n)*? {6}- run: scripts\/ui-check\.sh$/m, 'check.yml has no ui job running the UI gate');
  // A called workflow is one unit to its caller: `needs: check` waits for every job in check.yml.
  const deploy = read('.github/workflows/deploy.yml');
  assert.match(deploy, /^ {2}check:\n {4}uses: \.\/\.github\/workflows\/check\.yml$/m, 'deploy.yml does not call the gate');
  assert.match(deploy, /^ {4}needs: check$/m, 'the deploy job does not wait for the gate');
});
