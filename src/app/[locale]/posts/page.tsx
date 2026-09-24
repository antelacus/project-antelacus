import { getAllPostsMeta } from '@/lib/posts';
import { setRequestLocale } from 'next-intl/server';
import Catalog from '@/components/Catalog';
import { fromPost } from '@/lib/entry';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.posts_title'),
    description: await getMetaMessage(locale, 'meta.posts_description'),
    alternates: {
      canonical: canonicalFor(locale, '/posts'),
      languages: languageAlternates('/posts'),
    },
  };
}

export default async function PostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entries = (await getAllPostsMeta()).map(fromPost);
  return <Catalog title={await getMetaMessage(locale, 'meta.posts_title')} entries={entries} empty={await getMetaMessage(locale, 'list.empty')} />;
}
