import { getAllProjectsMeta } from '@/lib/projects';
import { setRequestLocale } from 'next-intl/server';
import Catalog from '@/components/Catalog';
import { fromProject } from '@/lib/entry';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.projects_title'),
    description: await getMetaMessage(locale, 'meta.projects_description'),
    alternates: {
      canonical: canonicalFor(locale, '/projects'),
      languages: languageAlternates('/projects'),
    },
  };
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entries = (await getAllProjectsMeta()).map(fromProject);
  return <Catalog title={await getMetaMessage(locale, 'meta.projects_title')} entries={entries} empty={await getMetaMessage(locale, 'list.empty')} />;
}
