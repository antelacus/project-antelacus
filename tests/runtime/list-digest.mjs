// A digest of what a list page shows — the links and headings inside <main>, sorted — so two builds
// can be compared without a byte-level diff (hashed asset names differ every build).
//   node tests/runtime/list-digest.mjs https://www.antelacus.com > tests/runtime/fixtures/list-pages-baseline.json
// REQ §5.10-b: the baseline is production before v2.3.0; Phase 4 diffs the deployed site against it.

export const LIST_PAGES = ['/en', '/en/posts', '/en/notes', '/en/gallery', '/en/projects', '/en/tags', '/zh-CN/posts'];

export async function listDigest(base, paths = LIST_PAGES) {
  const digest = {};
  for (const path of paths) {
    const html = await (await fetch(base + path, { redirect: 'manual', headers: { 'accept-language': 'en' } })).text();
    const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
    const links = [...main.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !h.startsWith('#')).sort();
    const headings = [...main.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gs)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).sort();
    digest[path] = { links, headings };
  }
  return digest;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const base = process.argv[2];
  if (!base) { console.error('usage: node list-digest.mjs <base-url>'); process.exit(2); }
  listDigest(base.replace(/\/$/, '')).then((d) => console.log(JSON.stringify(d, null, 2)));
}
