import { getAllNotesMeta } from '@/lib/notes';
import { setRequestLocale } from 'next-intl/server';
import Catalog from '@/components/Catalog';
import { fromNote } from '@/lib/entry';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.notes_title'),
    description: await getMetaMessage(locale, 'meta.notes_description'),
    alternates: {
      canonical: canonicalFor(locale, '/notes'),
      languages: languageAlternates('/notes'),
    },
  };
}

export default async function NotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entries = (await getAllNotesMeta()).map(fromNote);
  return <Catalog title={await getMetaMessage(locale, 'meta.notes_title')} entries={entries} empty={await getMetaMessage(locale, 'list.empty')} />;
}
