import { setRequestLocale } from 'next-intl/server';

import Catalog from '@/components/Catalog';
import { canonicalFor, getMetaMessage, languageAlternates } from '@/lib/seo';
import { getEntriesByTag } from '@/lib/tags';

type RouteParams = Promise<{ locale: string; id: string }>;

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
  return <Catalog title={`#${tag}`} entries={await getEntriesByTag(tag)} empty={await getMetaMessage(locale, 'list.empty')} showKind />;
}
