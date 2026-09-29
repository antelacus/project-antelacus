import test from 'node:test';
import assert from 'node:assert/strict';

// REQ §5.6 — the bucket mirror's listing walks folders and pages, and its plan reuses only unchanged files.

const load = () => import('../scripts/sync-bucket.mjs') as Promise<{
  listBucket: (fetchImpl: typeof fetch, base: string, key: string, bucket: string) => Promise<{ path: string; size: number | null; updatedAt: number | null }[]>;
  planSync: (objects: { path: string; size: number | null; updatedAt: number | null }[], existing: Map<string, { size: number; mtimeMs: number }>) => { reuse: unknown[]; fetch: unknown[] };
}>;

const entry = (name: string, size?: number) => (size === undefined ? { name, id: null } : { name, id: name, updated_at: '2026-01-01T00:00:00.000Z', metadata: { size } });

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

test('planSync reuses a file only when size and modification time both match, and fetches the rest', async () => {
  const { planSync } = await load();
  const t = Date.parse('2026-01-01T00:00:00.000Z');
  const plan = planSync(
    [{ path: 'a.jpg', size: 10, updatedAt: t }, { path: 'b.jpg', size: 20, updatedAt: t }, { path: 'c.jpg', size: null, updatedAt: t }, { path: 'd.jpg', size: 5, updatedAt: t }, { path: 'e.jpg', size: 9, updatedAt: t + 5000 }],
    new Map([['a.jpg', { size: 10, mtimeMs: t }], ['b.jpg', { size: 21, mtimeMs: t }], ['c.jpg', { size: 7, mtimeMs: t }], ['e.jpg', { size: 9, mtimeMs: t }], ['stale.jpg', { size: 1, mtimeMs: t }]]),
  );
  assert.deepEqual(plan.reuse.map((o) => (o as { path: string }).path), ['a.jpg']);
  assert.deepEqual(plan.fetch.map((o) => (o as { path: string }).path), ['b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'], 'e.jpg: same size, newer upload');
});

test('the service-role key comes from a mounted file when one is named, else from the environment', async () => {
  const { serviceRoleKey } = await import('../scripts/sync-bucket.mjs') as unknown as { serviceRoleKey: (env: Record<string, string | undefined>, read: (path: string) => string) => string | undefined };
  const files: Record<string, string> = { '/run/secrets/service-role': 'from-file\n' };
  const read = (path: string) => files[path];
  assert.equal(serviceRoleKey({ SUPABASE_SERVICE_ROLE_KEY_FILE: '/run/secrets/service-role' }, read), 'from-file');
  assert.equal(serviceRoleKey({ SUPABASE_SERVICE_ROLE_KEY: 'from-env' }, read), 'from-env');
  // The file wins: the backup passes only the file, and a stray variable must not override it.
  assert.equal(serviceRoleKey({ SUPABASE_SERVICE_ROLE_KEY_FILE: '/run/secrets/service-role', SUPABASE_SERVICE_ROLE_KEY: 'stray' }, read), 'from-file');
  assert.equal(serviceRoleKey({}, read), undefined);
});
