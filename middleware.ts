import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './src/i18n/routing';

// Normalize arbitrary language tags to one of the supported app locales
function normalizeToSupportedLocale(input: string | null | undefined): typeof locales[number] {
  if (!input) return defaultLocale;

  // Take only the language tag (strip weights, spaces)
  const tags = input.split(',').map(part => part.split(';')[0].trim()).filter(Boolean);

  // Try each tag in order of client preference
  for (const rawTag of tags) {
    const tag = rawTag.toLowerCase();

    // Direct matches (case-insensitive)
    if (locales.includes(rawTag as typeof locales[number])) {
      return rawTag as typeof locales[number];
    }

    // English/French/Spanish fall back to base language
    if (tag.startsWith('en')) return 'en';
    if (tag.startsWith('fr')) return 'fr';
    if (tag.startsWith('es')) return 'es';

    // Chinese script/region mapping
    // Simplified bucket
    if (
      tag === 'zh' ||
      tag.startsWith('zh-hans') ||
      tag.startsWith('zh-cn') ||
      tag.startsWith('zh-sg') ||
      tag.startsWith('zh-my')
    ) {
      return 'zh-CN';
    }
    // Traditional bucket
    if (
      tag.startsWith('zh-hant') ||
      tag.startsWith('zh-tw') ||
      tag.startsWith('zh-hk') ||
      tag.startsWith('zh-mo')
    ) {
      return 'zh-HK';
    }
  }

  return defaultLocale;
}

// If path is prefixed with an unsupported-but-related tag, map it to the nearest supported locale
function mapPathLocaleSegment(segment: string): typeof locales[number] | null {
  const lower = segment.toLowerCase();
  if (locales.includes(segment as typeof locales[number])) return segment as typeof locales[number];

  if (lower === 'zh' || lower === 'zh-hans' || lower === 'zh-cn' || lower === 'zh-sg' || lower === 'zh-my') {
    return 'zh-CN';
  }
  if (lower === 'zh-hant' || lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-mo') {
    return 'zh-HK';
  }
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('es')) return 'es';
  return null;
}

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


