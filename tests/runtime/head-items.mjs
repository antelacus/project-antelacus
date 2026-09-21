// Reduces a page to the document-level items a visitor, a crawler or a share preview depends on.
// The whole document is scanned, not just <head>: Next streams <title> and <meta> into the body
// for ordinary user agents. Hashed build artefacts (`/_next/…`) change on every build and are left out.
export function headItems(html) {
  const head = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map((m) => [m[1].toLowerCase(), m[2]]));
  const items = [];

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
  if (title !== undefined) items.push(`title=${title.trim()}`);

  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(tag);
    const key = a.name ?? a.property ?? a['http-equiv'] ?? (a.charset !== undefined ? 'charset' : null);
    if (key) items.push(`meta:${key}=${a.content ?? a.charset ?? ''}`);
  }
  for (const [tag] of head.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(tag);
    if (!a.rel || !a.href || a.href.startsWith('/_next/')) continue;
    items.push(`link:${a.rel}${a.hreflang ? `[${a.hreflang}]` : ''}${a.as ? `(${a.as})` : ''}=${a.href}`);
  }
  return [...new Set(items)].sort();
}
