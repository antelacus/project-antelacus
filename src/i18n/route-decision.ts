import { mapLanguageTag, normalizeToSupportedLocale } from './detect';
import { SLUG_PATTERN } from '@/lib/content-slug';
import { isSupportedLocale, localizedSections, slugSections, unlocalizedFiles, unlocalizedTrees, type AppLocale } from './routing';

export type LocaleRouteInput = { pathname: string; acceptLanguage: string | null; preferredLocale: string | null };
export type LocaleRouteDecision =
  | { kind: 'pass' }
  | { kind: 'redirect'; pathname: string }
  // `locale` is the language the 404 page is shown in; null when the address carries none.
  | { kind: 'not-found'; locale: AppLocale | null };

const PASS: LocaleRouteDecision = { kind: 'pass' };

export function decideLocaleRoute({ pathname, acceptLanguage, preferredLocale }: LocaleRouteInput): LocaleRouteDecision {
  const [, first = '', ...rest] = pathname.split('/');
  if (isSupportedLocale(first)) return canExistUnder(rest) ? PASS : { kind: 'not-found', locale: first };
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

// Under `/<locale>/`, the shapes a route exists for: the home page, a section's own page, a slug in a slug
// section, a tag. Anything else is decided here rather than left to the router: a 404 raised below `[locale]`
// is never server-rendered (routing-slimdown DESIGN §8), and one decided here is, in the address's language.
function canExistUnder(rest: string[]): boolean {
  // A trailing slash leaves an empty last segment; it names the same page.
  const segments = rest.at(-1) === '' ? rest.slice(0, -1) : rest;
  const [section, item, ...more] = segments;
  if (section === undefined) return true;
  if (!(localizedSections as readonly string[]).includes(section) || more.length) return false;
  if (item === undefined) return true;
  if ((slugSections as readonly string[]).includes(section)) return SLUG_PATTERN.test(item);
  // Decoded once, as the tag page decodes it; an escape that does not decode names no tag.
  if (section === 'tags') return decodes(item);
  return false;
}

function decodes(segment: string): boolean {
  try {
    decodeURIComponent(segment);
    return true;
  } catch {
    return false;
  }
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
