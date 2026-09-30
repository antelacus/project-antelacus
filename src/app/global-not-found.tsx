import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import LocaleShell from '@/components/LocaleShell';
import NotFoundPage from '@/components/NotFoundPage';
import SiteDocument from '@/components/SiteDocument';
import { isSupportedLocale, SITE_LOCALE_HEADER, type AppLocale } from '@/i18n/routing';
import { getMetaMessage } from '@/lib/seo';
import { siteMetadata, siteViewport } from './site-metadata';

// The 404 for every URL the proxy decides cannot exist, and for every URL that matches no route. It is served
// without a layout and rendered on the server — the reason every foreseeable 404 comes here (routing-slimdown
// DESIGN §8). Reading the request header is harmless here: a 404 is never cached.
async function requestedLocale(): Promise<AppLocale | null> {
  const locale = (await headers()).get(SITE_LOCALE_HEADER);
  return isSupportedLocale(locale) ? locale : null;
}

// Without a layout above it, this document declares what the root layouts do: icons, theme colour, viewport.
export const viewport = siteViewport;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await requestedLocale()) ?? 'en';
  // The title template applies to segments below a layout, not to this one. Next marks a 404 noindex itself;
  // the site's robots entry (index) must not contradict it.
  const { robots: _indexed, ...rest } = siteMetadata;
  return { ...rest, title: `${await getMetaMessage(locale, 'status.notFoundTitle')} | AnteLacus` };
}

export default async function GlobalNotFound() {
  const locale = await requestedLocale();
  if (locale) {
    setRequestLocale(locale);
    return <LocaleShell locale={locale}><NotFoundPage /></LocaleShell>;
  }
  // No language in the address: English, and no navigation to a language the visitor never chose.
  return (
    <SiteDocument lang="en">
      <div className="page page-narrow">
        <div className="scroll-opening">
          <h1 className="scroll-title">Page not found</h1>
          <p className="scroll-lead">The page you are looking for does not exist or has been moved.</p>
          <p><Link href="/">Back to the front page</Link></p>
        </div>
      </div>
    </SiteDocument>
  );
}
