import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import Catalog from '@/components/Catalog';
import { canonicalFor, getMetaMessage, languageAlternates } from '@/lib/seo';
import { getEntriesByTag } from '@/lib/tags';

type RouteParams = Promise<{ locale: string; id: string }>;

// Nothing is built ahead of time (the build must not need the database); the empty list is what lets
// Next cache each tag page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: RouteParams }) {
  const { locale, id } = await params;
  const tag = decodeURIComponent(id);
  return {
    title: `#${tag}`,
    description: (await getMetaMessage(locale, 'meta.tag_description')).replace('{tag}', tag),
    alternates: { canonical: canonicalFor(locale, `/tags/${id}`), languages: languageAlternates(`/tags/${id}`) },
  };
}

export default async function TagDetailLocalePage({ params }: { params: RouteParams }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tag = decodeURIComponent(id);
  // Otherwise any made-up tag would be a page, and cached.
  const entries = await getEntriesByTag(tag);
  if (!entries.length) notFound();
  return <Catalog title={`#${tag}`} entries={entries} empty={await getMetaMessage(locale, 'list.empty')} showKind />;
}
