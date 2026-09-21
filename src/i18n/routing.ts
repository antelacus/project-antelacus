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

// Holds the language a visitor picked by hand. Written only by the language switch, read only by the
// middleware: a page or layout that reads it stops being cacheable.
export const PREFERRED_LOCALE_COOKIE = 'preferred_locale';

export function isSupportedLocale(locale: string | undefined | null): locale is AppLocale {
  return !!locale && (locales as readonly string[]).includes(locale);
}

