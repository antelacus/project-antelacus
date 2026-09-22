import { getSitemapEntries, renderSitemapXml } from '@/lib/sitemap-entries';

// Generated per request; the data behind it is cached by the loaders. A static handler would run at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(renderSitemapXml(await getSitemapEntries()), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
