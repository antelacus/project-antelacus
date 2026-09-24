import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import Article from '@/components/Article';
import { getPage } from '@/lib/pages';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.about_title'),
    description: await getMetaMessage(locale, 'meta.about_description'),
    alternates: {
      canonical: canonicalFor(locale, '/about'),
      languages: languageAlternates('/about'),
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await getPage('about', locale);
  if (!page) notFound();

  // The version shown may be in another language than the URL's (the fallback): it carries its own.
  // A page has no date, tags or language line to report, so its tail is the mark alone.
  return (
    <div className="page page-narrow">
      <Article title={page.title} lang={page.lang} body={page.body} colophon={{}} />
    </div>
  );
}
