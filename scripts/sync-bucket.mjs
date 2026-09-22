#!/usr/bin/env node
// Mirrors Supabase Storage buckets into a directory, with nothing but Node's own fetch.
//   node sync-bucket.mjs <destination-dir> <bucket> [<bucket>…]
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Per bucket: list every object (folders recursed, pages of 1000), build the next mirror in a sibling
// directory — unchanged files hard-linked from the current mirror, new or changed ones downloaded —
// verify the file count equals the listing, then swap directories. A short listing or a failed
// download therefore never replaces a good mirror with a worse one.
import { link, mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const PAGE = 1000;

export async function listBucket(fetchImpl, base, key, bucket) {
  const objects = [];
  const folders = [''];
  while (folders.length) {
    const prefix = folders.pop();
    for (let offset = 0; ; offset += PAGE) {
      const res = await fetchImpl(`${base}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } }),
      });
      if (!res.ok) throw new Error(`list ${bucket}/${prefix}: ${res.status}`);
      const entries = await res.json();
      for (const entry of entries) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        // A folder comes back without an id; an object carries its size in metadata.
        if (entry.id === null || entry.id === undefined) folders.push(path);
        else objects.push({ path, size: entry.metadata?.size ?? null, etag: entry.metadata?.eTag ?? null });
      }
      if (entries.length < PAGE) break;
    }
  }
  return objects;
}

// Which listed objects can be reused from the current mirror (same path and size) and which must be fetched.
export function planSync(objects, existing) {
  const reuse = [];
  const fetchList = [];
  for (const object of objects) {
    const have = existing.get(object.path);
    if (have !== undefined && object.size !== null && have === object.size) reuse.push(object);
    else fetchList.push(object);
  }
  return { reuse, fetch: fetchList };
}

async function filesUnder(dir) {
  const out = new Map();
  async function walk(current, rel) {
    let entries;
    try { entries = await readdir(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = join(current, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(full, relPath);
      else out.set(relPath, (await stat(full)).size);
    }
  }
  await walk(dir, '');
  return out;
}

export async function syncBucket({ fetchImpl = fetch, base, key, bucket, dest }) {
  const objects = await listBucket(fetchImpl, base, key, bucket);
  const current = join(dest, bucket);
  const next = join(dest, `${bucket}.next`);
  await rm(next, { recursive: true, force: true });
  const plan = planSync(objects, await filesUnder(current));

  for (const object of plan.reuse) {
    await mkdir(dirname(join(next, object.path)), { recursive: true });
    await link(join(current, object.path), join(next, object.path));
  }
  for (const object of plan.fetch) {
    const res = await fetchImpl(`${base}/storage/v1/object/${bucket}/${object.path.split('/').map(encodeURIComponent).join('/')}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`download ${bucket}/${object.path}: ${res.status}`);
    await mkdir(dirname(join(next, object.path)), { recursive: true });
    await writeFile(join(next, object.path), Buffer.from(await res.arrayBuffer()));
  }

  const written = (await filesUnder(next)).size;
  if (written !== objects.length) throw new Error(`${bucket}: listed ${objects.length} objects, mirrored ${written}`);
  await rm(current, { recursive: true, force: true });
  await rename(next, current);
  return { listed: objects.length, reused: plan.reuse.length, fetched: plan.fetch.length };
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
  const [dest, ...buckets] = process.argv.slice(2);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dest || buckets.length === 0 || !base || !key) {
    console.error('usage: sync-bucket.mjs <dest> <bucket>… with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set');
    process.exit(2);
  }
  for (const bucket of buckets) {
    const result = await syncBucket({ base, key, bucket, dest });
    console.log(`${bucket}: ${result.listed} objects (${result.reused} reused, ${result.fetched} fetched)`);
  }
}
