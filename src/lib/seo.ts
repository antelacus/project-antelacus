import { locales, defaultLocale } from '@/i18n/routing';

type Messages = Record<string, Record<string, string>>;

export async function getMetaMessage(locale: string, key: string): Promise<string> {
  let messages: Messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`@/messages/${defaultLocale}.json`)).default;
  }
  const [section, field] = key.split('.');
  return messages[section]?.[field] ?? key;
}

// next/og serves its images as `immutable` for a year by default, but a share image follows the title
// and summary, which change. One day, like the other images.
export const SHARE_IMAGE_CACHE_CONTROL = 'public, max-age=86400';

export function languageAlternates(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const map: Record<string, string> = {};
  for (const l of locales) {
    map[l] = `/${l}${normalized}`.replace(/\/+/, '/');
  }
  return map;
}

export function canonicalFor(locale: string, path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`.replace(/\/+/, '/');
}


