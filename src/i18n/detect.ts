import { defaultLocale, type AppLocale } from './routing';

const TRADITIONAL_CHINESE_SUBTAGS = new Set(['hant', 'tw', 'hk', 'mo']);

// Maps a language tag to a supported locale by its PRIMARY subtag (`en-US` → `en`).
// Never by string prefix: `essays` starts with "es" and is not Spanish.
export function mapLanguageTag(tag: string): AppLocale | null {
  const [primary, ...subtags] = tag.trim().toLowerCase().split('-');
  // `en--US`, `zh-`: every subtag of a language tag is a non-empty run of letters or digits.
  if (!subtags.every((subtag) => /^[a-z0-9]+$/.test(subtag))) return null;

  if (primary === 'en' || primary === 'fr' || primary === 'es') return primary;
  if (primary === 'zh') {
    return subtags.some((subtag) => TRADITIONAL_CHINESE_SUBTAGS.has(subtag)) ? 'zh-HK' : 'zh-CN';
  }
  return null;
}

// The first tag of an Accept-Language value that maps to a supported locale, in the order the
// client listed them; the default locale when none does or the header is absent or malformed.
export function normalizeToSupportedLocale(input: string | null | undefined): AppLocale {
  for (const part of (input ?? '').split(',')) {
    const locale = mapLanguageTag(part.split(';')[0]);
    if (locale) return locale;
  }
  return defaultLocale;
}

// Convenience util usable in both Edge and Node runtimes
export function detectFromRequestHeaders(headers: Headers): AppLocale {
  return normalizeToSupportedLocale(headers.get('accept-language'));
}
