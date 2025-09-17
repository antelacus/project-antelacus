import { locales, defaultLocale, type AppLocale } from './routing';

// Normalize arbitrary language tags to one of the supported app locales
export function normalizeToSupportedLocale(input: string | null | undefined): AppLocale {
  if (!input) return defaultLocale;

  // Take only the language tag (strip weights, spaces)
  const tags = input
    .split(',')
    .map(part => part.split(';')[0].trim())
    .filter(Boolean);

  // Try each tag in order of client preference
  for (const rawTag of tags) {
    const tag = rawTag.toLowerCase();

    // Direct matches (case-insensitive)
    if ((locales as readonly string[]).includes(rawTag)) {
      return rawTag as AppLocale;
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
export function mapPathLocaleSegment(segment: string): AppLocale | null {
  const lower = segment.toLowerCase();
  if ((locales as readonly string[]).includes(segment)) return segment as AppLocale;

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

// Convenience util usable in both Edge and Node runtimes
export function detectFromRequestHeaders(headers: Headers): AppLocale {
  const accept = headers.get('accept-language');
  return normalizeToSupportedLocale(accept);
}


