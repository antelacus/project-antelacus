import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { renderMarkdown } from '@/lib/markdown';
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

  // The version shown may be another language than the URL's (the fallback): it says so itself.
  return (
    <div className="content-container content-container-standard">
      <article lang={page.lang} data-content>
        <h1>{page.title}</h1>
        <div className="prose">{renderMarkdown(page.body)}</div>
      </article>
    </div>
  );
}
