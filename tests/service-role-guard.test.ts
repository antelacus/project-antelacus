import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';

// The service-role client bypasses RLS and can read drafts. Its only legitimate
// holder is the admin guard; a layout-level check does not protect a page, because
// Next renders layout and page in parallel and streams the page regardless.

const ROOT = join(import.meta.dirname, '..');
const SERVICE_ROLE_MODULE = 'src/lib/supabase/service-role.ts';
const GUARD_MODULE = 'src/lib/server/admin-auth.ts';
const GUARD_FUNCTION = 'getAdminServiceRoleClient';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function importsServiceRole(path: string): boolean {
  const { importedFiles } = ts.preProcessFile(readFileSync(path, 'utf8'), true, true);
  return importedFiles.some(({ fileName }) => /(^|\/)service-role$/.test(fileName));
}

test('only the admin guard imports the service-role client', () => {
  const files = [...sourceFiles(join(ROOT, 'src')), join(ROOT, 'middleware.ts')];
  assert.ok(files.length > 50, `scanned ${files.length} files — the scan itself looks broken`);

  const importers = files.filter(importsServiceRole).map((path) => relative(ROOT, path));
  assert.deepEqual(importers, [GUARD_MODULE]);
});

test('the admin guard verifies the admin before creating the service-role client', () => {
  const source = ts.createSourceFile(
    GUARD_MODULE,
    readFileSync(join(ROOT, GUARD_MODULE), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const guard = source.statements.find(
    (node): node is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(node) && node.name?.text === GUARD_FUNCTION,
  );
  assert.ok(guard?.body, `${GUARD_FUNCTION} is missing from ${GUARD_MODULE}`);

  const calls = guard.body.statements.map((statement) => statement.getText(source));
  assert.match(calls[0] ?? '', /^await requireAdminUser\(/, 'the first statement must be the admin check');
  assert.ok(
    calls.slice(1).some((text) => text.includes('createSupabaseServiceRoleClient(')),
    'the client must be created after the check, inside the guard',
  );
});

test(`${SERVICE_ROLE_MODULE} still exists (the scan above is not vacuous)`, () => {
  assert.ok(statSync(join(ROOT, SERVICE_ROLE_MODULE)).isFile());
});
