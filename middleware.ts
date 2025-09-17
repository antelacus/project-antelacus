import { NextResponse, type NextRequest } from 'next/server';
import { locales } from './src/i18n/routing';
import { normalizeToSupportedLocale, mapPathLocaleSegment } from './src/i18n/detect';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Ignore internal/static paths (kept in config.matcher too)
  const ignored = pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/ads.txt') ||
    pathname.startsWith('/api');
  if (ignored) return NextResponse.next();

  // Get the first path segment
  const segments = pathname.split('/'); // "" | locale | ...
  const first = segments[1] || '';

  // If already prefixed with a supported locale, allow through
  if (locales.includes(first as typeof locales[number])) {
    // Also set cookie to help server components render correct <html lang>
    const res = NextResponse.next();
    res.cookies.set('NEXT_LOCALE', first, { path: '/' });
    return res;
  }

  // If prefixed with an unsupported-but-related tag, redirect to mapped supported locale
  if (first) {
    const mapped = mapPathLocaleSegment(first);
    if (mapped) {
      const rest = segments.slice(2).join('/')
        .replace(/^\/?/, '');
      const url = req.nextUrl.clone();
      url.pathname = `/${mapped}/${rest}`.replace(/\/$/, '') || `/${mapped}`;
      const res = NextResponse.redirect(url);
      res.cookies.set('NEXT_LOCALE', mapped, { path: '/' });
      return res;
    }
  }

  // No locale prefix → detect from Accept-Language and redirect
  const accept = req.headers.get('accept-language');
  const detected = normalizeToSupportedLocale(accept);
  const url = req.nextUrl.clone();
  url.pathname = `/${detected}${pathname}`;
  const res = NextResponse.redirect(url);
  res.cookies.set('NEXT_LOCALE', detected, { path: '/' });
  return res;
}

export const config = {
  matcher: [
    '/((?!_next|favicon|images|fonts|robots.txt|sitemap.xml|sw.js|ads.txt|api).*)',
  ],
};


