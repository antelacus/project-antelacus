import { mapLanguageTag, normalizeToSupportedLocale } from './detect';
import { isSupportedLocale, localizedSections, unlocalizedFiles, unlocalizedTrees, type AppLocale } from './routing';

export type LocaleRouteInput = { pathname: string; acceptLanguage: string | null; preferredLocale: string | null };
export type LocaleRouteDecision = { kind: 'pass' } | { kind: 'redirect'; pathname: string } | { kind: 'not-found' };

const PASS: LocaleRouteDecision = { kind: 'pass' };

export function decideLocaleRoute({ pathname, acceptLanguage, preferredLocale }: LocaleRouteInput): LocaleRouteDecision {
  const [, first = '', ...rest] = pathname.split('/');
  if (isSupportedLocale(first) || isServedUnlocalized(pathname, first, rest)) return PASS;

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
  return { kind: 'not-found' };
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
