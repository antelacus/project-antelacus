import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// REQ §5.5-a — every file path and npm script named in CLAUDE.md exists.

const ROOT = join(import.meta.dirname, '..');
const claudeMd = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
const scripts = (JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;

// A backticked token is treated as a repo path when it has a slash, no spaces, and none of the
// marks of a pattern, a URL or a package name (`*`, `{`, `<`, a leading `/`, a leading `@`).
const looksLikeRepoPath = (token: string) =>
  token.includes('/') && !/[\s*{}<>]/.test(token) && !token.startsWith('/') && !token.startsWith('@') && !/^https?:/.test(token) && !token.includes('…');

const namedPaths = (text: string) => [...new Set([...text.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]).filter(looksLikeRepoPath))];

test('acceptance §5.5-a CLAUDE.md names only paths and npm scripts that exist', () => {
  const paths = namedPaths(claudeMd);
  assert.ok(paths.length >= 5, `recognised only ${paths.length} paths — the extraction looks broken`);
  assert.deepEqual(paths.filter((path) => !existsSync(join(ROOT, path))), [], 'paths that do not exist');

  const named = [...new Set([...claudeMd.matchAll(/npm run ([\w:-]+)/g)].map((match) => match[1]))];
  assert.ok(named.length >= 3, `recognised only ${named.length} npm scripts — the extraction looks broken`);
  assert.deepEqual(named.filter((name) => !(name in scripts)), [], 'npm scripts that do not exist');
});

test('every CSS class CLAUDE.md names under Styling is still defined in globals.css', () => {
  const css = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf8');
  const styling = /### Styling\n([\s\S]*?)\n#/.exec(claudeMd)?.[1] ?? '';
  const classes = [...new Set([...styling.matchAll(/`\.([a-z][\w-]*)`/g)].map((match) => match[1]))];
  assert.ok(classes.length > 0, 'no class names found under Styling — the extraction looks broken');
  assert.deepEqual(classes.filter((name) => !new RegExp(`\\.${name}(?![\\w-])`).test(css)), [], 'classes that no longer exist');
});

// The README is a map for a human arriving cold: every place it sends them must exist.
test('README names only paths that exist', () => {
  const paths = namedPaths(readFileSync(join(ROOT, 'README.md'), 'utf8'));
  assert.ok(paths.length >= 5, `recognised only ${paths.length} paths — the extraction looks broken`);
  assert.deepEqual(paths.filter((path) => !existsSync(join(ROOT, path))), [], 'paths that do not exist');
});
