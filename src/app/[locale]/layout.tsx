import React from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { defaultLocale, isSupportedLocale } from '@/i18n/routing';
import Nav from '@/components/Nav';
import SiteDocument from '@/components/SiteDocument';
import { siteMetadata, siteViewport } from '../site-metadata';

export const metadata = siteMetadata;
export const viewport = siteViewport;

// `[locale]` is a dynamic segment: without this every page under it renders per request (no-store).
// Empty, so nothing is built ahead of time — the build must not need the database.
export function generateStaticParams() {
  return [];
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// The root layout of the public site.
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  // A backstop only: the middleware answers unsupported first segments itself. Next discourages
  // notFound() in a root layout, so nothing may rely on reaching this line.
  if (!isSupportedLocale(locale)) notFound();

  // Without this next-intl resolves the locale from request headers and the page silently becomes no-store.
  setRequestLocale(locale);

  let messages: Record<string, unknown> = {};
  try {
    const [base, current] = await Promise.all([
      import(`@/messages/${defaultLocale}.json`).then(m => m.default),
      import(`@/messages/${locale}.json`).then(m => m.default).catch(() => ({})),
    ]);
    // Shallow merge; keys missing in locale fall back to default
    messages = { ...base, ...current } as Record<string, unknown>;
  } catch {
    messages = (await import(`@/messages/${defaultLocale}.json`)).default;
  }

  return (
    <SiteDocument
      lang={locale}
      nav={<Nav />}
      wrap={(content) => <NextIntlClientProvider locale={locale} messages={messages}>{content}</NextIntlClientProvider>}
    >
      {children}
    </SiteDocument>
  );
}
