import { NextResponse, type NextRequest } from 'next/server';
import { decideLocaleRoute } from '@/i18n/route-decision';
import { PREFERRED_LOCALE_COOKIE } from '@/i18n/routing';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

// No route matches this: under `[locale]` only the sections listed in routing.ts exist. Rewriting to it
// makes Next answer with src/app/global-not-found.tsx and a 404, without rendering any page.
const UNMATCHED_PATH = '/404/unmatched';

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
  if (decision.kind === 'not-found') return NextResponse.rewrite(new URL(UNMATCHED_PATH, req.url));
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

export const config = {
  // Only the framework's own namespaces are skipped. Everything else goes through the decision above:
  // a list of exclusions here would be matched by prefix and could not be unit-tested.
  matcher: ['/((?!_next/|__nextjs).*)'],
};
