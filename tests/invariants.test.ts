import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';

// DESIGN §7 — properties no change may break. (Invariant 1 lives in service-role-guard.test.ts,
// invariants 5 and 6 are asserted by the CI gate on the built artefact.)

const ROOT = join(import.meta.dirname, '..');
const rel = (path: string) => relative(ROOT, path);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const parse = (path: string) => ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

const allSources = sourceFiles(join(ROOT, 'src'));

test('invariant 2a — only admin/auth code reads the request (next/headers)', { todo: 'batch 3' }, () => {
  assert.ok(allSources.length > 50, `scanned ${allSources.length} files — the scan looks broken`);
  // Reading cookies or headers anywhere on the public render path turns every page into no-store.
  const allowed = (path: string) =>
    /^src\/app\/(admin|auth)\//.test(path) || ['src/lib/supabase/server.ts', 'src/lib/server/admin-auth.ts'].includes(path);

  const offenders = allSources
    .filter((path) => ts.preProcessFile(readFileSync(path, 'utf8'), true, true).importedFiles.some((f) => f.fileName === 'next/headers'))
    .map(rel)
    .filter((path) => !allowed(path));
  assert.deepEqual(offenders, []);
});

test('invariant 2b — every layout and page under [locale] calls setRequestLocale', { todo: 'batch 3' }, () => {
  // Without it next-intl resolves the locale from request headers and the page silently becomes no-store.
  const entries = sourceFiles(join(ROOT, 'src/app/[locale]')).filter((path) => /\/(layout|page)\.tsx$/.test(path));
  assert.ok(entries.length >= 10, `found ${entries.length} layouts/pages under [locale] — the scan looks broken`);

  const missing = entries.filter((path) => {
    let called = false;
    walk(parse(path), (node) => {
      if (ts.isCallExpression(node) && node.expression.getText() === 'setRequestLocale') called = true;
    });
    return !called;
  });
  assert.deepEqual(missing.map(rel), []);
});

test('invariant 3 — the supported locales are listed only in src/i18n/routing.ts', { todo: 'batch 3' }, () => {
  const offenders = allSources
    .filter((path) => rel(path) !== 'src/i18n/routing.ts')
    .filter((path) => {
      let found = false;
      walk(parse(path), (node) => {
        if (!ts.isArrayLiteralExpression(node)) return;
        const strings = node.elements.filter(ts.isStringLiteralLike).map((element) => element.text);
        if (strings.includes('zh-CN') && strings.includes('zh-HK')) found = true;
      });
      return found;
    });
  assert.deepEqual(offenders.map(rel), []);
});

test('invariant 4 — the public section registry equals the directories under [locale]', { todo: 'batch 2' }, async () => {
  // A section that exists but is not registered would 404 on its unprefixed URL instead of redirecting.
  const routing = (await import('../src/i18n/routing')) as { localizedSections?: readonly string[] };
  const localeDir = join(ROOT, 'src/app/[locale]');
  const directories = readdirSync(localeDir).filter((name) => statSync(join(localeDir, name)).isDirectory());

  assert.ok(directories.length >= 5, `found ${directories.length} sections — the scan looks broken`);
  assert.deepEqual([...(routing.localizedSections ?? [])].sort(), directories.sort());
});
