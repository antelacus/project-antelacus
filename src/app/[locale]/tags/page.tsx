import { setRequestLocale } from 'next-intl/server';

import SiteLink from '@/components/SiteLink';
import { canonicalFor, getMetaMessage, languageAlternates } from '@/lib/seo';
import { getTagSummaries } from '@/lib/tags';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.tags_title'),
    description: await getMetaMessage(locale, 'meta.tags_description'),
    alternates: { canonical: canonicalFor(locale, '/tags'), languages: languageAlternates('/tags') },
  };
}

export default async function TagsIndexLocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tags = await getTagSummaries();

  return (
    <div className="page page-narrow">
      <h1 className="page-title">{await getMetaMessage(locale, 'meta.tags_title')}</h1>
      {tags.length === 0 ? (
        <p className="page-empty">{await getMetaMessage(locale, 'list.empty')}</p>
      ) : (
        <ul className="tag-index">
          {tags.map((tag) => (
            <li key={tag.id}>
              <SiteLink href={`/tags/${encodeURIComponent(tag.id)}`}>{tag.id}</SiteLink> <span className="tag-count">{tag.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
