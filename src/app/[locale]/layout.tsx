import React from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {defaultLocale} from '@/i18n/routing';
import Nav from '../../components/Nav';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Nav />
      {children}
    </NextIntlClientProvider>
  );
}


