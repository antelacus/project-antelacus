import { getSitemapEntries } from '@/lib/sitemap-entries';

// Generated per request; the data behind it is cached by the loaders. A static handler would run at build time.
export const dynamic = 'force-dynamic';

// Custom XML renderer to ensure correct namespaces expected by Google
// Uses http:// schema URIs per sitemaps.org and W3C specs
export async function GET() {
  const entries = await getSitemapEntries();

  const xmlParts: string[] = [];
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlParts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');

  for (const e of entries) {
    xmlParts.push('<url>');
    xmlParts.push(`<loc>${escapeXml(e.url)}</loc>`);

    // xhtml:link alternates
    if (e.alternates?.languages) {
      for (const [lang, href] of Object.entries(e.alternates.languages)) {
        xmlParts.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`);
      }
    }

    if (e.lastModified) {
      const lastmod = typeof e.lastModified === 'string' ? e.lastModified : e.lastModified.toISOString();
      xmlParts.push(`<lastmod>${escapeXml(lastmod)}</lastmod>`);
    }
    if (e.changeFrequency) {
      xmlParts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
    }
    if (typeof e.priority === 'number') {
      xmlParts.push(`<priority>${e.priority}</priority>`);
    }
    xmlParts.push('</url>');
  }

  xmlParts.push('</urlset>');
  const body = xmlParts.join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

