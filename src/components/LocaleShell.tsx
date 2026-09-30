import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { defaultLocale, type AppLocale } from '@/i18n/routing';
import Nav from '@/components/Nav';
import SiteDocument from '@/components/SiteDocument';

// The public site's document in one language: its interface text (a key missing from the language falls
// back to English), the navigation and the translation context. The caller has already called
// setRequestLocale(locale) — without it next-intl reads the request headers and the page stops being cacheable.
export default async function LocaleShell({ locale, children }: { locale: AppLocale; children: React.ReactNode }) {
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
