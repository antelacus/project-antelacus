import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';

// REQ §5.3-b and §5.4 — freshness on save, and what must be gone.

const ROOT = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const pkg = () => JSON.parse(read('package.json')) as { scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> };

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|mjs|cjs)$/.test(name) ? [path] : [];
  });
}

const REMOVED_FILES = [
  'src/styles/color-schemes.ts',
  'src/lib/performance.ts',
  'src/lib/supabase/client.ts',
  'src/components/MasonryGrid.tsx',
  'src/components/NavigationTracker.tsx',
  'src/components/PerformanceMonitor.tsx',
  'src/components/ClientPostCard.tsx',
  'src/components/ClientNoteCard.tsx',
  'src/components/ClientPhotoCard.tsx',
  'src/components/ClientProjectCard.tsx',
  'scripts/validate-dynamic-content-schema.ts',
  'scripts/seo-check.cjs',
  'scripts/validate-metadata.cjs',
  'scripts/generate-og-image.js',
  'scripts/submit-sitemap.cjs',
];

test('acceptance §5.3-b saving a note invalidates the notes cache tag', () => {
  const path = 'src/app/admin/(protected)/notes/actions.ts';
  const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true);
  const calls: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'revalidateTag') calls.push(node.arguments[0]?.getText() ?? '');
    node.forEachChild(visit);
  };
  visit(source);
  assert.ok(calls.some((argument) => /^['"]notes['"]$/.test(argument)), `revalidateTag('notes') not found; saw: ${calls.join(', ') || 'no revalidateTag call'}`);
});

test('acceptance §5.3 data is cached for at most half an hour, so an edit shows within the hour', async () => {
  const { DATA_CACHE_SECONDS } = await import('../src/lib/cache-lifetime');
  assert.ok(DATA_CACHE_SECONDS <= 1800, `page cache stacks on data cache: ${DATA_CACHE_SECONDS}s × 2 exceeds the hour`);
  for (const name of ['posts', 'notes', 'gallery', 'projects']) {
    const lifetimes = [...read(`src/lib/${name}.ts`).matchAll(/revalidate:\s*([\w.]+)/g)].map((match) => match[1]);
    assert.ok(lifetimes.length >= 2, `${name}.ts: expected a list and a detail cache, found ${lifetimes.length}`);
    assert.deepEqual([...new Set(lifetimes)], ['DATA_CACHE_SECONDS'], `${name}.ts: every lifetime comes from the one constant`);
  }
});

test('acceptance §5.4-a every remaining npm script points at something that exists', () => {
  const { scripts, dependencies, devDependencies } = pkg();
  for (const gone of ['validate:dynamic-content', 'seo:check', 'seo:og-image', 'seo:validate', 'seo:submit']) {
    assert.equal(scripts[gone], undefined, `script "${gone}" proves nothing and must go`);
  }
  for (const [name, command] of Object.entries(scripts)) {
    for (const file of command.match(/(?:scripts|tests)\/[\w./-]+\.(?:ts|js|cjs|mjs|py|sh)/g) ?? []) {
      assert.ok(existsSync(join(ROOT, file)), `script "${name}" references missing ${file}`);
    }
  }
  for (const unused of ['ts-node', 'image-size', 'next-tweet']) {
    assert.equal({ ...dependencies, ...devDependencies }[unused], undefined, `dependency "${unused}" has no importer`);
  }
});

test('acceptance §5.4-b removed files are gone and nothing imports them', () => {
  assert.deepEqual(REMOVED_FILES.filter((path) => existsSync(join(ROOT, path))), [], 'still present');

  const removedStems = REMOVED_FILES.map((path) => path.replace(/\.(ts|tsx|js|cjs)$/, '').split('/').pop() as string);
  const files = [...sourceFiles(join(ROOT, 'src')), ...sourceFiles(join(ROOT, 'scripts')), ...sourceFiles(join(ROOT, 'tests'))];
  const importers = files.flatMap((path) =>
    ts.preProcessFile(readFileSync(path, 'utf8'), true, true).importedFiles
      .filter(({ fileName }) => removedStems.includes(fileName.split('/').pop() as string))
      .map(({ fileName }) => `${relative(ROOT, path)} → ${fileName}`),
  );
  assert.deepEqual(importers, []);
});

test('acceptance §5.4-c the service worker is a self-removing stub and nothing registers one', () => {
  const worker = read('public/sw.js');
  assert.match(worker, /skipWaiting\(\)/);
  assert.match(worker, /registration\.unregister\(\)/);
  assert.match(worker, /caches\.delete\(/);
  assert.doesNotMatch(worker, /addEventListener\(\s*['"]fetch['"]/, 'a stub must not intercept requests');
  assert.ok(worker.split('\n').length <= 30, 'a stub is a few lines');

  const registering = sourceFiles(join(ROOT, 'src')).filter((path) => /serviceWorker\s*\.\s*register/.test(readFileSync(path, 'utf8')));
  assert.deepEqual(registering.map((path) => relative(ROOT, path)), []);

  // The blanket rule is what served /sw.js as immutable for a year.
  assert.doesNotMatch(read('next.config.ts'), /\(\?:css\|js\)/);
});
