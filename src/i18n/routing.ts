export const locales = [
  'zh-CN',
  'zh-HK',
  'en',
  'fr',
  'es',
] as const;

export type AppLocale = typeof locales[number];

export const defaultLocale: AppLocale = 'en';

export function isSupportedLocale(locale: string | undefined | null): locale is AppLocale {
  return !!locale && (locales as readonly string[]).includes(locale);
}

