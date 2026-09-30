import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { proxy } from '../src/proxy';

// routing-slimdown DESIGN §2.2, §6: the proxy looks content up in /api/route-index and answers a missing
// piece's 404 itself; an index it cannot read or cannot trust never turns existing content into a 404.

const INDEX = { posts: ['a-post'], notes: [], gallery: [], projects: [], tags: [], about: true };

async function run(path: string, index: () => Promise<Response>, headers: Record<string, string> = {}) {
  const realFetch = globalThis.fetch;
  const realError = console.error;
  globalThis.fetch = (() => index()) as typeof fetch;
  console.error = () => {};
  try {
    return await proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));
  } finally {
    globalThis.fetch = realFetch;
    console.error = realError;
  }
}

const json = (value: unknown, status = 200) => async () => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const passed = (res: Response) => res.headers.get('x-middleware-next') === '1';
const rewrittenTo404 = (res: Response) => (res.headers.get('x-middleware-rewrite') ?? '').endsWith('/404/unmatched');

test('a piece the index lists passes; one it does not is the 404, in the address\'s language', async () => {
  assert.ok(passed(await run('/en/posts/a-post', json(INDEX))));
  const missing = await run('/fr/posts/no-such-post', json(INDEX));
  assert.ok(rewrittenTo404(missing));
  assert.equal(missing.headers.get('x-middleware-request-x-site-locale'), 'fr');
});

test('an index that cannot be read or trusted lets the page answer', async () => {
  const faults: [string, () => Promise<Response>][] = [
    ['HTML with 200', async () => new Response('<html>oops</html>', { status: 200 })],
    ['500', json({ error: 'unavailable' }, 500)],
    ['wrong shape', json({ posts: null })],
    ['connection refused', async () => { throw new TypeError('fetch failed'); }],
  ];
  for (const [name, index] of faults) assert.ok(passed(await run('/en/posts/a-post', index)), name);
});

test('a language header sent by the client is never what the 404 is shown in', async () => {
  const res = await run('/essays', json(INDEX), { 'x-site-locale': 'fr', 'accept-language': 'en' });
  assert.ok(rewrittenTo404(res));
  assert.equal(res.headers.get('x-middleware-request-x-site-locale'), null);
  // The override lists every header the rewritten request keeps; the client's copy is not among them.
  const kept = (res.headers.get('x-middleware-override-headers') ?? '').split(',').filter(Boolean);
  assert.ok(kept.includes('accept-language'), 'no header override: the request went on unchanged');
  assert.ok(!kept.includes('x-site-locale'), 'the client\'s copy was kept');
});
