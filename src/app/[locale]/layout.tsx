import React from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { isSupportedLocale } from '@/i18n/routing';
import LocaleShell from '@/components/LocaleShell';
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

  return <LocaleShell locale={locale}>{children}</LocaleShell>;
}
