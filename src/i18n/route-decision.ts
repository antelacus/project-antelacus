import { mapLanguageTag, normalizeToSupportedLocale } from './detect';
import { SLUG_PATTERN } from '@/lib/content-slug';
import { isSupportedLocale, localizedSections, slugSections, unlocalizedFiles, unlocalizedTrees, type AppLocale } from './routing';

export type LocaleRouteInput = { pathname: string; acceptLanguage: string | null; preferredLocale: string | null };
export type SlugSection = (typeof slugSections)[number];
/** A piece of content an address names; whether it exists is read from the content index. */
export type ContentItem = { section: SlugSection; slug: string } | { section: 'tags'; tag: string } | { section: 'about' };

export type LocaleRouteDecision =
  | { kind: 'pass' }
  | { kind: 'redirect'; pathname: string }
  // `locale` is the language the 404 page is shown in; null when the address carries none.
  | { kind: 'not-found'; locale: AppLocale | null }
  // The address can exist; the proxy looks the item up and passes, or answers the 404 in `locale`.
  | { kind: 'lookup'; locale: AppLocale; item: ContentItem };

/** What /api/route-index serves: every published slug per section, every tag in use, whether an about page is published. */
export type RouteIndex = { [S in SlugSection]: string[] } & { tags: string[]; about: boolean };

const PASS: LocaleRouteDecision = { kind: 'pass' };

export function decideLocaleRoute({ pathname, acceptLanguage, preferredLocale }: LocaleRouteInput): LocaleRouteDecision {
  const [, first = '', ...rest] = pathname.split('/');
  if (isSupportedLocale(first)) {
    const shape = shapeUnder(rest);
    if (shape === 'none') return { kind: 'not-found', locale: first };
    return shape === 'page' ? PASS : { kind: 'lookup', locale: first, item: shape };
  }
  if (isServedUnlocalized(pathname, first, rest)) return PASS;

  // No locale prefix: the site root, or a section that exists under every locale.
  if (first === '' || (localizedSections as readonly string[]).includes(first)) {
    // A manual choice made earlier beats the browser's languages; a value we do not support is ignored.
    const locale = isSupportedLocale(preferredLocale) ? preferredLocale : normalizeToSupportedLocale(acceptLanguage);
    return redirect(locale, pathname);
  }

  // A variant of a supported language (`zh-tw`, `en-US`): same path under the supported locale.
  const variant = mapLanguageTag(first);
  if (variant) return redirect(variant, `/${rest.join('/')}`);

  // Neither a language nor a section. Decided here rather than passed on: `[locale]` would match it,
  // and a 404 raised from there still renders the page (database reads, a cache entry per junk URL).
  return { kind: 'not-found', locale: null };
}

// Under `/<locale>/`, the shapes a route exists for: the home page and a section's list (a page, always there),
// a slug in a slug section, a tag, the about page (content, looked up). Anything else is decided here rather
// than left to the router: a 404 raised below `[locale]` is never server-rendered (routing-slimdown DESIGN §8),
// and one decided here is, in the address's language.
function shapeUnder(rest: string[]): 'page' | 'none' | ContentItem {
  // A trailing slash leaves an empty last segment; it names the same page.
  const segments = rest.at(-1) === '' ? rest.slice(0, -1) : rest;
  const [section, item, ...more] = segments;
  if (section === undefined) return 'page';
  if (!(localizedSections as readonly string[]).includes(section) || more.length) return 'none';
  if (section === 'about') return item === undefined ? { section: 'about' } : 'none';
  if (item === undefined) return 'page';
  if (isSlugSection(section)) return SLUG_PATTERN.test(item) ? { section, slug: item } : 'none';
  if (section === 'tags') {
    // Decoded once, as the tag page decodes it; an escape that does not decode names no tag.
    const tag = decoded(item);
    return tag === null ? 'none' : { section: 'tags', tag };
  }
  return 'none';
}

const isSlugSection = (section: string): section is SlugSection => (slugSections as readonly string[]).includes(section);

function decoded(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/** Whether the content index lists the item. */
export function isPublished(item: ContentItem, index: RouteIndex): boolean {
  if (item.section === 'about') return index.about;
  if (item.section === 'tags') return index.tags.includes(item.tag);
  return index[item.section].includes(item.slug);
}

/** The content index, or null when the value is not one — an index of the wrong shape is treated as no index. */
export function parseRouteIndex(value: unknown): RouteIndex | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const strings = (x: unknown) => Array.isArray(x) && x.every((s) => typeof s === 'string');
  const lists = [...slugSections, 'tags'].every((key) => strings(v[key]));
  return lists && typeof v.about === 'boolean' ? (value as RouteIndex) : null;
}

// Compared by whole segment, never by prefix: `/apiary` is not under `/api`, `/authors` is not under `/auth`.
function isServedUnlocalized(pathname: string, first: string, rest: string[]): boolean {
  // Share images keep the addresses external platforms have cached: `/og.png`, `/<section>/<slug>/og.png`.
  if (pathname.endsWith('/og.png')) return true;
  if ((unlocalizedFiles as readonly string[]).includes(first)) return rest.length === 0;
  // Only `/admin` is itself a page; the bare name of the other trees matches no route.
  return (unlocalizedTrees as readonly string[]).includes(first) && (first === 'admin' || rest.some(Boolean));
}

function redirect(locale: AppLocale, rest: string): LocaleRouteDecision {
  return { kind: 'redirect', pathname: `/${locale}${rest}`.replace(/\/+$/, '') };
}
