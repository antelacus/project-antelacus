import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';

// REQ docs/features/content-publishing/REQ.md — one test per acceptance criterion that a unit test can
// carry. Each is marked `todo` with its batch until that batch lands; the version cannot close with a
// mark left. Criteria that need a running server are in tests/runtime/acceptance.runtime.mjs; those
// that need production data or a phone are Phase 4 evidence in the TRACK.

const ROOT = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

// Modules a later batch creates are imported by a runtime path so the type check stays green until then.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the module's types do not exist yet
const load = (path: string): Promise<any> => import(path);

const renderToHtml = async (markdown: string): Promise<string> => {
  const { renderMarkdown } = await load('../src/lib/markdown/index.js');
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(renderMarkdown(markdown));
};

// ---------- §5.1 dependency upgrade ----------

test('acceptance §5.1-a the gate audits production dependencies', () => {
  const gate = read('.github/workflows/check.yml');
  assert.match(gate, /npm audit --omit=dev/, 'check.yml has no production audit step');
});

// ---------- §5.2 body rendering ----------

test('acceptance §5.2-a script, expression, import and JSX in a body are shown as text, never run', async () => {
  const html = await renderToHtml("<script>alert(1)</script>\n\n{1+1}\n\nimport x from 'y'\n\n<Component />");
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /\b2\b/);
  for (const literal of ['&lt;script&gt;alert(1)&lt;/script&gt;', '{1+1}', 'import x from &#x27;y&#x27;', '&lt;Component /&gt;']) {
    assert.ok(html.includes(literal), `expected the text ${literal} in: ${html}`);
  }
});

test('acceptance §5.2-b GFM, math and the image-row rule render', async () => {
  const html = await renderToHtml([
    '| a | b |', '|---|---|', '| 1 | 2 |', '',
    '~~gone~~ and https://example.com and', '', '- [ ] task', '',
    'inline $x^2$ and', '', '$$\\int_0^1 f$$', '',
    '![one](/a.png "First") ![two](/b.png "Second") ![three](/c.png "Third")',
  ].join('\n'));
  assert.match(html, /<table/);
  assert.match(html, /<del>gone<\/del>/);
  assert.match(html, /<a [^>]*href="https:\/\/example\.com"/);
  assert.match(html, /<input [^>]*type="checkbox"/);
  assert.match(html, /class="katex/);
  assert.equal((html.match(/class="image-row"/g) ?? []).length, 1, 'one row for the image paragraph');
  assert.equal((html.match(/<figure>/g) ?? []).length, 3, 'a figure per image');
  assert.equal((html.match(/<figcaption>/g) ?? []).length, 3, 'a caption per image');
  assert.match(html, /<figcaption>Second<\/figcaption>/);
});

test('acceptance §5.2-b links and images with a javascript:, data: or protocol-relative address lose it; KaTeX survives', async () => {
  const html = await renderToHtml('[x](javascript:alert(1)) ![y](javascript:alert(2)) [d](data:text/html,hi) ![p](//evil.example/a.png) [ok](https://example.com) $\\frac{a}{b}$');
  assert.doesNotMatch(html, /javascript:|data:text|evil\.example/i);
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /class="katex/);
  assert.match(html, /aria-hidden="true"/, 'KaTeX aria attributes survive the sanitizer');
});

test('acceptance §5.2-d the container runs as a non-root user', () => {
  const dockerfile = read('Dockerfile');
  const runner = dockerfile.slice(dockerfile.indexOf('AS runner'));
  assert.match(runner, /^USER node$/m, 'the runner stage has no USER node');
  assert.ok(runner.indexOf('USER node') < runner.indexOf('CMD'), 'USER must come before CMD');
});

// ---------- §5.3 publishing entry ----------

test('acceptance §5.3-b saving the same natural key twice is one insert then an update', async () => {
  const { saveContent } = await load('../src/lib/server/content-repo.js');
  const { fakeSupabase } = await load('./fakes/supabase.js');
  const db = fakeSupabase();
  const input = { slug: 'twice', title: 'Twice', content: 'body', lang: 'en', status: 'draft' as const, tags: [], summary: '', cover: '' };
  await saveContent(db.client, 'note', input);
  await saveContent(db.client, 'note', { ...input, title: 'Twice, edited' });
  assert.equal(db.rpcCalls('save_content_item').length, 2, 'every save is the one transactional RPC');
  assert.equal(db.rows('content_items').length, 1);
  assert.equal(db.rows('content_items')[0].title, 'Twice, edited');
});

test('acceptance §5.3-b the editor form cannot be submitted twice while a submit is in flight', () => {
  const editor = read('src/components/admin/ContentEditor.tsx');
  assert.match(editor, /useFormStatus|pending/, 'no in-flight state on the submit buttons');
});

test('acceptance §5.3 rule 4 a slug is lowercase letters, digits and hyphens', async () => {
  const { isValidSlug } = await load('../src/lib/content-slug.js');
  for (const ok of ['a', '2025-07-13-llm-note', 'project-white']) assert.equal(isValidSlug(ok), true, ok);
  for (const bad of ['', 'A', 'a_b', 'a b', 'a/b', '..', 'x'.repeat(81), 'é']) assert.equal(isValidSlug(bad), false, JSON.stringify(bad));
});

test('acceptance §5.3-g every admin action and the upload path check the admin before touching data', () => {
  for (const path of ['src/app/admin/(protected)/content/actions.ts', 'src/app/api/admin/upload/route.ts', 'src/lib/server/media.ts']) {
    assert.ok(existsSync(join(ROOT, path)), `${path} missing`);
    const source = read(path);
    assert.match(source, /requireAdminUser|getAdminServiceRoleClient|getAdminSession/, `${path} never checks the admin`);
    assert.doesNotMatch(source, /createSupabaseServiceRoleClient/, `${path} creates the service-role client itself`);
  }
});

// ---------- §5.4 failure handling ----------

test('acceptance §5.4-d a malformed detail slug is decided "not found" before any page runs', async () => {
  const { decideLocaleRoute } = await import('../src/i18n/route-decision.js');
  const decide = (pathname: string) => decideLocaleRoute({ pathname, acceptLanguage: null, preferredLocale: null });
  for (const bad of ['/en/posts/Bad', '/en/notes/a_b', '/fr/projects/' + 'x'.repeat(81), '/zh-CN/gallery/a.b']) {
    assert.deepEqual(decide(bad), { kind: 'not-found' }, bad);
  }
  assert.deepEqual(decide('/en/posts/2025-07-13-llm-note'), { kind: 'pass' });
  assert.deepEqual(decide('/en/posts'), { kind: 'pass' });
  assert.deepEqual(decide('/en/tags/Some Tag'), { kind: 'pass' }, 'tags are not slugs');
  assert.deepEqual(decide('/en/about/anything'), { kind: 'pass' }, 'only slug sections are checked');
});

test('acceptance §5.4 the loading placeholder that turned 404 into 200 is gone', () => {
  assert.equal(existsSync(join(ROOT, 'src/app/[locale]/loading.tsx')), false);
  assert.ok(existsSync(join(ROOT, 'src/app/[locale]/error.tsx')));
  assert.ok(existsSync(join(ROOT, 'src/app/admin/error.tsx')));
});

// ---------- §5.5 hardening ----------

test('acceptance §5.5-b JSON-LD cannot close its own script tag; project links must be http(s)', async () => {
  const { jsonLdScript } = await load('../src/lib/structured-data.js');
  const out = jsonLdScript({ name: 'x</script><script>alert(1)</script>' });
  assert.doesNotMatch(out, /<\/script/);
  assert.match(out, /\\u003c\/script/, 'the angle bracket is written as the JSON escape');
  const { isSafeExternalUrl } = await load('../src/lib/content-slug.js');
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('https://example.com/x'), true);
  assert.equal(isSafeExternalUrl('http://example.com'), true);
  assert.equal(isSafeExternalUrl('data:text/html,hi'), false);
});

test('acceptance §5.5-b the photo viewer builds its details from text, not HTML strings', () => {
  assert.doesNotMatch(read('src/components/PhotoViewer.tsx'), /innerHTML/);
});

test('acceptance §5.5-c the canonical origin is one constant with www', () => {
  const bare = sourceFiles(join(ROOT, 'src')).filter((file) => readFileSync(file, 'utf8').includes('https://antelacus.com'));
  assert.deepEqual(bare, [], 'the bare domain appears in src');
  const www = sourceFiles(join(ROOT, 'src')).filter((file) => readFileSync(file, 'utf8').includes('https://www.antelacus.com')).map((f) => relative(ROOT, f));
  assert.deepEqual(www, ['src/lib/site.ts'], 'the origin is written in exactly one place');
});

test('acceptance §5.5-d the image Node major equals the gate\'s and is still maintained', () => {
  const image = /^FROM node:(\d+)/m.exec(read('Dockerfile'))?.[1];
  const gate = /node-version:\s*(\d+)/.exec(read('.github/workflows/check.yml'))?.[1];
  assert.equal(image, gate, 'Dockerfile and check.yml disagree on Node');
  // Node 20 left maintenance in April 2026; 22 is maintained to April 2027, 24 is the active LTS.
  assert.ok(Number(image) >= 22, `node:${image} is past end-of-life`);
});

// ---------- §5.8 language memory ----------

test('acceptance §5.8-a no page script writes document.cookie', () => {
  const offenders = sourceFiles(join(ROOT, 'src')).filter((file) => readFileSync(file, 'utf8').includes('document.cookie'));
  assert.deepEqual(offenders, []);
});

// ---------- §5.10 consolidation ----------

test('acceptance §5.10-c every loader\'s request-level cache() wrapper is created once, at module level', () => {
  for (const name of ['posts', 'notes', 'gallery', 'projects']) {
    const path = `src/lib/${name}.ts`;
    const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true);
    const nested: string[] = [];
    const visit = (node: ts.Node, depth: number) => {
      if (ts.isCallExpression(node) && node.expression.getText() === 'cache' && depth > 0) nested.push(node.getText().slice(0, 40));
      const inner = ts.isFunctionLike(node) ? depth + 1 : depth;
      node.forEachChild((child) => visit(child, inner));
    };
    visit(source, 0);
    assert.deepEqual(nested, [], `${path}: cache() is called inside a function, so each call gets a fresh memo`);
  }
});

test('acceptance §5.3 every admin action invalidates the tag the type registry names, with the Next 16 profile', () => {
  const path = 'src/app/admin/(protected)/content/actions.ts';
  const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true);
  const calls: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'revalidateTag') calls.push(node.arguments.map((a) => a.getText()).join(', '));
    node.forEachChild(visit);
  };
  visit(source);
  assert.ok(calls.length > 0, 'no revalidateTag call in the content actions');
  for (const call of calls) {
    assert.match(call, /tag/, `the tag must come from the type registry, saw revalidateTag(${call})`);
    assert.match(call, /'max'/, `Next 16 needs the second argument, saw revalidateTag(${call})`);
  }
});

test('acceptance §5.10 the four repos are one', () => {
  for (const gone of ['posts-repo', 'notes-repo', 'gallery-repo', 'projects-repo']) {
    assert.equal(existsSync(join(ROOT, `src/lib/server/${gone}.ts`)), false, `${gone}.ts still exists`);
  }
  assert.ok(existsSync(join(ROOT, 'src/lib/server/content-repo.ts')));
  const prefixLines = sourceFiles(join(ROOT, 'src/components')).filter((file) => /isSupportedLocale\(currentLocale\) \?/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(prefixLines, [], 'the locale-prefix expression is still repeated in components');
});

test('invariant 17 — the proxy\'s slug sections are the content-type registry\'s sections', async () => {
  const { slugSections } = await import('../src/i18n/routing.js');
  const { CONTENT_TYPES } = await import('../src/lib/content-types.js');
  assert.deepEqual([...slugSections].sort(), Object.values(CONTENT_TYPES).map((spec) => spec.section).sort());
});
