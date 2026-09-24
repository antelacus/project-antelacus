import { defaultLocale, locales } from '@/i18n/routing';

// Which version of a standalone page a visitor gets: their language, else English, else the first the
// language menu lists. The last step reads the menu order, never the order the rows arrived in, so the
// same set of versions always yields the same page.
export function pickPageLocale(available: readonly string[], requested: string): string | null {
  if (available.includes(requested)) return requested;
  if (available.includes(defaultLocale)) return defaultLocale;
  return locales.find((locale) => available.includes(locale)) ?? null;
}
