import { locales } from '@/i18n/routing';

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


