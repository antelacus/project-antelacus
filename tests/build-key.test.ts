import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Edges of the build input key beyond REQ §5.1-b (tests/acceptance-release-pipeline.test.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- plain .mjs module
const load = (): Promise<any> => import('../scripts/release/build-key.mjs');

const dir = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'build-key-edge-'));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
  return root;
};

test('the executable bit is part of the key: Docker copies it into the image', async () => {
  const { buildKey } = await load();
  const plain = dir({ 'run.sh': 'echo' });
  const executable = dir({ 'run.sh': 'echo' });
  chmodSync(join(executable, 'run.sh'), 0o755);
  assert.notEqual(buildKey({ root: plain, buildArgs: {} }), buildKey({ root: executable, buildArgs: {} }));
});

test('a symlink is keyed by its target, not followed', async () => {
  const { buildKey } = await load();
  const a = dir({ 'x.txt': 'x' });
  symlinkSync('x.txt', join(a, 'link'));
  const b = dir({ 'x.txt': 'x' });
  symlinkSync('elsewhere.txt', join(b, 'link'));
  assert.notEqual(buildKey({ root: a, buildArgs: {} }), buildKey({ root: b, buildArgs: {} }));
});

test('build argument order does not matter', async () => {
  const { buildKey } = await load();
  const root = dir({ 'a.txt': 'a' });
  assert.equal(buildKey({ root, buildArgs: { A: '1', B: '2' } }), buildKey({ root, buildArgs: { B: '2', A: '1' } }));
});
