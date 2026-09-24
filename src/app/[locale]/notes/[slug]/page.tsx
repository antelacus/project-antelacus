import Article from '@/components/Article';
import { getNoteBySlug, getNoteSlugs } from '@/lib/notes';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isNotFoundError } from '@/lib/not-found';
import { detailTrail, languageAlternates } from '@/lib/seo';
import { SITE_ORIGIN } from '@/lib/site';
import { noteJsonLd, jsonLdScript, breadcrumbJsonLd } from '@/lib/structured-data';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Metadata renders outside the error boundary: a database failure here would be a bare 500, so
  // it falls back to the layout's defaults and lets the page body raise the error where it is caught.
  try {
    if (!(await getNoteSlugs()).includes(slug)) notFound();
    const note = await getNoteBySlug(slug);
    if (!note) notFound();
    return { 
      title: note.title, 
      description: note.summary || '',
      alternates: {
        languages: languageAlternates(`/notes/${note.slug}`),
      },
      openGraph: {
        title: note.title,
        description: note.summary || '',
        type: 'article',
        url: `${SITE_ORIGIN}/notes/${note.slug}`,
        images: [{ url: `/notes/${note.slug}/og.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`/notes/${note.slug}/og.png`],
      },
    };
  } catch (error) {
    if (isNotFoundError(error)) throw error;
    return {};
  }
}

export default async function NotePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!(await getNoteSlugs()).includes(slug)) notFound();
  const note = await getNoteBySlug(slug);
  if (!note) notFound();

  return (
    <div className="page page-narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(noteJsonLd(note)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(await detailTrail(locale, 'notes', slug, note.title))) }} />
      <Article title={note.title} lang={note.lang} date={note.date} lead={note.summary} cover={note.cover} body={note.content}
        colophon={{ date: note.date, tags: note.tags, lang: note.lang }} />
    </div>
  );
}
