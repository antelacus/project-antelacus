import { mapLanguageTag, normalizeToSupportedLocale } from './detect';
import { isSupportedLocale, localizedSections, type AppLocale } from './routing';

export type LocaleRouteInput = { pathname: string; acceptLanguage: string | null; preferredLocale: string | null };
export type LocaleRouteDecision = { kind: 'pass' } | { kind: 'redirect'; pathname: string } | { kind: 'not-found' };

const PASS: LocaleRouteDecision = { kind: 'pass' };

export function decideLocaleRoute({ pathname, acceptLanguage, preferredLocale }: LocaleRouteInput): LocaleRouteDecision {
  const [, first = '', ...rest] = pathname.split('/');
  if (isSupportedLocale(first)) return PASS;

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

function redirect(locale: AppLocale, rest: string): LocaleRouteDecision {
  return { kind: 'redirect', pathname: `/${locale}${rest}`.replace(/\/+$/, '') };
}
