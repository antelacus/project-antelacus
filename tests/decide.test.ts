import test from 'node:test';
import assert from 'node:assert/strict';

// The release state transitions behind REQ release-pipeline §5.1 and §5.2 (DESIGN §5); the criteria
// themselves are in tests/acceptance-release-pipeline.test.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- plain .mjs module
const decide = (): Promise<any> => import('../scripts/release/decide.mjs');

const entry = (key: string, version = '2.5.0') => ({ key, imageId: `sha256:${key}`, sha: key, version });

test('a verified image is recorded once, newest first, ten at most', async () => {
  const { afterVerified } = await decide();
  let state = {};
  for (let i = 0; i < 12; i += 1) state = afterVerified({ state, key: `k${i}`, imageId: `i${i}` });
  state = afterVerified({ state, key: 'k5', imageId: 'i5' });
  const keys = (state as { verified: { key: string }[] }).verified.map((v) => v.key);
  assert.equal(keys.length, 10);
  assert.equal(keys[0], 'k5');
  assert.equal(new Set(keys).size, 10);
});

test('production may run only the image staging verified for that key', async () => {
  const { afterVerified, mayPromote } = await decide();
  const state = afterVerified({ state: {}, key: 'k1', imageId: 'sha256:a' });
  assert.equal(mayPromote({ state, key: 'k1', imageId: 'sha256:a' }), true);
  assert.equal(mayPromote({ state, key: 'k1', imageId: 'sha256:b' }), false, 'a rebuilt image with the same key was promoted');
  assert.equal(mayPromote({ state, key: 'k2', imageId: 'sha256:a' }), false);
  assert.equal(mayPromote({ state: {}, key: 'k1', imageId: 'sha256:a' }), false);
});

test('a production deploy becomes the newest kept image; five are kept', async () => {
  const { afterDeploy } = await decide();
  let state = {};
  for (const key of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6']) state = afterDeploy({ state, env: 'production', entry: entry(key) });
  const s = state as { production: { key: string }; kept: { key: string }[] };
  assert.equal(s.production.key, 'k6');
  assert.deepEqual(s.kept.map((k) => k.key), ['k6', 'k5', 'k4', 'k3', 'k2']);
  const again = afterDeploy({ state, env: 'production', entry: entry('k4') }) as typeof s;
  assert.deepEqual(again.kept.map((k) => k.key), ['k4', 'k6', 'k5', 'k3', 'k2'], 'a redeploy duplicated a kept image');
});

test('a staging deploy touches only staging', async () => {
  const { afterDeploy } = await decide();
  const state = afterDeploy({ state: { production: entry('p'), kept: [entry('p')] }, env: 'staging', entry: entry('s') });
  assert.equal(state.staging.key, 's');
  assert.equal(state.production.key, 'p');
});

test('pruning spares kept, verified, staging and production images', async () => {
  const { pruneImages } = await decide();
  const state = { production: entry('p'), kept: [entry('p'), entry('k')], staging: entry('s'), verified: [{ key: 'v', imageId: 'x' }] };
  assert.deepEqual(pruneImages({ images: ['p', 'k', 's', 'v', 'old1', 'old2'], state }), ['old1', 'old2']);
});
