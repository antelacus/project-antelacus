import test from 'node:test';
import assert from 'node:assert/strict';

// REQ §5.6 — the bucket mirror's listing walks folders and pages, and its plan reuses only unchanged files.

const load = () => import('../scripts/sync-bucket.mjs') as Promise<{
  listBucket: (fetchImpl: typeof fetch, base: string, key: string, bucket: string) => Promise<{ path: string; size: number | null }[]>;
  planSync: (objects: { path: string; size: number | null }[], existing: Map<string, number>) => { reuse: unknown[]; fetch: unknown[] };
}>;

const entry = (name: string, size?: number) => (size === undefined ? { name, id: null } : { name, id: name, metadata: { size } });

test('listBucket recurses into folders and follows pagination', async () => {
  const { listBucket } = await load();
  const calls: { prefix: string; offset: number }[] = [];
  const fakeFetch = (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { prefix: string; offset: number; limit: number };
    calls.push({ prefix: body.prefix, offset: body.offset });
    let entries: unknown[] = [];
    if (body.prefix === '' && body.offset === 0) entries = [entry('posts'), entry('root.jpg', 3)];
    if (body.prefix === 'posts' && body.offset === 0) entries = Array.from({ length: body.limit }, (_, i) => entry(`a-${i}.jpg`, 1));
    if (body.prefix === 'posts' && body.offset === body.limit) entries = [entry('last.jpg', 2)];
    return new Response(JSON.stringify(entries), { status: 200 });
  }) as unknown as typeof fetch;
  const objects = await listBucket(fakeFetch, 'https://x.supabase.co', 'k', 'media');
  assert.equal(objects.length, 1 + 1000 + 1);
  assert.ok(objects.some((o) => o.path === 'posts/last.jpg' && o.size === 2));
  assert.deepEqual(calls.map((c) => `${c.prefix}@${c.offset}`), ['@0', 'posts@0', 'posts@1000']);
});

test('planSync reuses a file only when the size matches, and fetches the rest', async () => {
  const { planSync } = await load();
  const plan = planSync(
    [{ path: 'a.jpg', size: 10 }, { path: 'b.jpg', size: 20 }, { path: 'c.jpg', size: null }, { path: 'd.jpg', size: 5 }],
    new Map([['a.jpg', 10], ['b.jpg', 21], ['c.jpg', 7], ['stale.jpg', 1]]),
  );
  assert.deepEqual(plan.reuse.map((o) => (o as { path: string }).path), ['a.jpg']);
  assert.deepEqual(plan.fetch.map((o) => (o as { path: string }).path), ['b.jpg', 'c.jpg', 'd.jpg']);
});
