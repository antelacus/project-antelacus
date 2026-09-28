// REQ docs/features/release-pipeline/REQ.md — what only a deployed staging or production site can answer.
//   RELEASE_ENV=staging    BASE_URL=https://staging.antelacus.com EXPECTED_KEY=<key> \
//     CF_ACCESS_CLIENT_ID=… CF_ACCESS_CLIENT_SECRET=… node --test tests/runtime/release.runtime.mjs
//   RELEASE_ENV=production BASE_URL=https://www.antelacus.com     EXPECTED_KEY=<key> node --test tests/runtime/release.runtime.mjs
// Each check is marked `todo` with its batch until that batch lands.
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL?.replace(/\/$/, '');
const ENV = process.env.RELEASE_ENV;
if (!BASE || !['staging', 'production'].includes(ENV)) {
  throw new Error('BASE_URL and RELEASE_ENV=staging|production are required — refusing a run that checked nothing');
}
const access = process.env.CF_ACCESS_CLIENT_ID
  ? { 'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID, 'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '' }
  : {};
const get = (path, headers = access) => fetch(BASE + path, { redirect: 'manual', headers });
const staging = { skip: ENV !== 'staging' && 'staging only' };

test('acceptance §5.3-a staging without Access credentials never reaches the origin', { ...staging, todo: 'Batch 4' }, async () => {
  const res = await get('/en', {});
  assert.ok([302, 303].includes(res.status), `status ${res.status}`);
  assert.match(res.headers.get('location') ?? '', /\.cloudflareaccess\.com\//);
});

test('acceptance §5.3-b every staging response says noindex', { ...staging, todo: 'Batch 4' }, async () => {
  for (const path of ['/en', '/en/about', '/api/build', '/admin/login', '/og.png', '/no-such-page']) {
    const res = await get(path);
    assert.match(res.headers.get('x-robots-tag') ?? '', /noindex/, path);
  }
});

test('acceptance §5.3-d / §5.5-b the site serves the build it was given', { todo: 'Batch 4' }, async () => {
  const expected = process.env.EXPECTED_KEY;
  assert.match(expected ?? '', /^[0-9a-f]{64}$/, 'EXPECTED_KEY is not a build input key');
  const res = await get('/api/build');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control') ?? '', /no-store/);
  assert.equal((await res.json()).key, expected);
});
