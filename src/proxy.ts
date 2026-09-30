import { NextResponse, type NextRequest } from 'next/server';
import { decideLocaleRoute, isPublished, parseRouteIndex, type RouteIndex } from '@/i18n/route-decision';
import { PREFERRED_LOCALE_COOKIE, SITE_LOCALE_HEADER } from '@/i18n/routing';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

// No route matches this: under `[locale]` only the sections listed in routing.ts exist. Rewriting to it
// makes Next answer with src/app/global-not-found.tsx and a 404, without rendering any page — a document
// rendered on the server, which a 404 raised by a page under `[locale]` never is (routing-slimdown DESIGN §8).
const UNMATCHED_PATH = '/404/unmatched';

// How long a request waits for the content index before the page answers instead.
const ROUTE_INDEX_TIMEOUT_MS = 500;

// These keep the admin signed in: their session is renewed on the way through.
const SESSION_TREES = ['admin', 'auth'];

// A thin shell: which paths exist and where they lead is decided in src/i18n/route-decision.ts, not here.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const decision = decideLocaleRoute({
    pathname,
    acceptLanguage: req.headers.get('accept-language'),
    preferredLocale: req.cookies.get(PREFERRED_LOCALE_COOKIE)?.value ?? null,
  });
  if (decision.kind === 'not-found') return notFound(req, decision.locale);
  if (decision.kind === 'lookup') {
    const index = await routeIndex();
    // Without an index the page answers, as it would without this step: an index fault must never turn
    // content that exists into a 404 (routing-slimdown DESIGN §6).
    if (index && !isPublished(decision.item, index)) return notFound(req, decision.locale);
    return NextResponse.next();
  }
  if (decision.kind === 'redirect') {
    // Cloning keeps the query string.
    const url = req.nextUrl.clone();
    url.pathname = decision.pathname;
    const res = NextResponse.redirect(url, 308);
    // Where this leads depends on the visitor (remembered choice, browser language), so it must not be
    // replayed from a cache: a browser that stored `/` → `/en` would never ask again after a manual switch.
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  }

  return SESSION_TREES.includes(pathname.split('/')[1]) ? updateSupabaseSession(req) : NextResponse.next();
}

function notFound(req: NextRequest, locale: string | null) {
  // The 404 page learns its language from this header; a copy sent by the client is never trusted.
  const headers = new Headers(req.headers);
  headers.delete(SITE_LOCALE_HEADER);
  if (locale) headers.set(SITE_LOCALE_HEADER, locale);
  return NextResponse.rewrite(new URL(UNMATCHED_PATH, req.url), { request: { headers } });
}

// Over loopback, from this same server: the proxy has no data cache of its own (unstable_cache does not
// cache here), the route handler has the pages' one. Next records the address it serves itself on in
// __NEXT_PRIVATE_ORIGIN — its own self-requests use it — under `next start` and the standalone server alike.
async function routeIndex(): Promise<RouteIndex | null> {
  const origin = process.env.__NEXT_PRIVATE_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
  try {
    const res = await fetch(`${origin}/api/route-index`, { cache: 'no-store', signal: AbortSignal.timeout(ROUTE_INDEX_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const index = parseRouteIndex(await res.json());
    if (!index) throw new Error('not a content index');
    return index;
  } catch (error) {
    console.error(`proxy: content index unavailable (${error instanceof Error ? error.message : String(error)}); the page answers`);
    return null;
  }
}

export const config = {
  // Only the framework's own namespaces are skipped. Everything else goes through the decision above:
  // a list of exclusions here would be matched by prefix and could not be unit-tested.
  matcher: ['/((?!_next/|__nextjs).*)'],
};
