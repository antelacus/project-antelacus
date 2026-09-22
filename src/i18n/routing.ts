// The order is the order of the language menu.
export const locales = [
  'zh-CN',
  'zh-HK',
  'en',
  'es',
  'fr',
] as const;

export type AppLocale = typeof locales[number];

export const defaultLocale: AppLocale = 'en';

// The first path segments that exist under `/<locale>/`. An unprefixed URL is redirected into a
// locale only when its first segment is listed here; anything else falls through to a 404.
// tests/invariants.test.ts keeps this equal to the directories under src/app/[locale].
export const localizedSections = ['about', 'gallery', 'notes', 'posts', 'projects', 'tags'] as const;

// The sections whose next segment is a content slug. A slug that is not lowercase letters, digits and
// hyphens is answered 404 by the proxy before any page runs (no database read, no cache entry).
// tests/invariants.test.ts keeps this equal to the content-type registry's sections.
export const slugSections = ['gallery', 'notes', 'posts', 'projects'] as const;

// What is served outside `/<locale>/`: directories (`src/app/<name>/…`, `public/<name>/…`) and single files.
// The middleware answers 404 for every first segment that is neither here nor a section nor a language,
// so a new top-level route or public file must be added here. tests/invariants.test.ts keeps this complete.
export const unlocalizedTrees = ['admin', 'api', 'auth', 'images'] as const;
export const unlocalizedFiles = ['robots.txt', 'sitemap.xml', 'sw.js', 'ads.txt'] as const;

// Holds the language a visitor picked by hand. Written only by the language switch, read only by the
// middleware: a page or layout that reads it stops being cacheable.
export const PREFERRED_LOCALE_COOKIE = 'preferred_locale';

export function isSupportedLocale(locale: string | undefined | null): locale is AppLocale {
  return !!locale && (locales as readonly string[]).includes(locale);
}

