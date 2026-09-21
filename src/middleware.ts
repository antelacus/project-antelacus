import { NextResponse, type NextRequest } from 'next/server';
import { decideLocaleRoute } from '@/i18n/route-decision';
import { PREFERRED_LOCALE_COOKIE } from '@/i18n/routing';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

// No route matches this: under `[locale]` only the sections listed in routing.ts exist. Rewriting to it
// makes Next answer with src/app/global-not-found.tsx and a 404, without rendering any page.
const UNMATCHED_PATH = '/404/unmatched';

// A thin shell: the locale rules live in src/i18n/route-decision.ts, none of them here.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Share images keep their unprefixed addresses; the matcher cannot express a suffix readably.
  if (pathname.endsWith('/og.png')) return NextResponse.next();

  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) {
    return updateSupabaseSession(req);
  }

  const decision = decideLocaleRoute({
    pathname,
    acceptLanguage: req.headers.get('accept-language'),
    preferredLocale: req.cookies.get(PREFERRED_LOCALE_COOKIE)?.value ?? null,
  });
  if (decision.kind === 'pass') return NextResponse.next();
  if (decision.kind === 'not-found') return NextResponse.rewrite(new URL(UNMATCHED_PATH, req.url));

  // Cloning keeps the query string.
  const url = req.nextUrl.clone();
  url.pathname = decision.pathname;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    '/((?!_next|favicon|images|fonts|robots.txt|sitemap.xml|sw.js|ads.txt|api).*)',
  ],
};
