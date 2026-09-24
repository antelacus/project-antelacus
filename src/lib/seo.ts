import { locales, defaultLocale } from '@/i18n/routing';

type Messages = Record<string, Record<string, string>>;

// A key missing from a locale falls back to the default locale, like the client-side messages do.
export async function getMetaMessage(locale: string, key: string): Promise<string> {
  const [section, field] = key.split('.');
  const lookup = async (l: string) => ((await import(`@/messages/${l}.json`)).default as Messages)[section]?.[field];
  let value: string | undefined;
  try {
    value = await lookup(locale);
  } catch {
    value = undefined;
  }
  return value ?? (await lookup(defaultLocale)) ?? key;
}

// next/og serves its images as `immutable` for a year by default, but a share image follows the title
// and summary, which change. One day, like the other images.
export const SHARE_IMAGE_CACHE_CONTROL = 'public, max-age=86400';

// A page's path under a locale; the home page is the locale itself, without a trailing slash.
function underLocale(locale: string, path: string) {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${locale}/${trimmed}` : `/${locale}`;
}

export function languageAlternates(path: string) {
  return Object.fromEntries(locales.map((l) => [l, underLocale(l, path)]));
}

export function canonicalFor(locale: string, path: string) {
  return underLocale(locale, path);
}

// The trail a detail page reports in its structured data: home, its section, itself.
export async function detailTrail(locale: string, section: 'posts' | 'notes' | 'gallery' | 'projects', slug: string, title: string) {
  return [
    { name: await getMetaMessage(locale, 'nav.home'), path: `/${locale}` },
    { name: await getMetaMessage(locale, `meta.${section}_title`), path: `/${locale}/${section}` },
    { name: title, path: `/${locale}/${section}/${slug}` },
  ];
}
