import { getNoteBySlug, getNoteSlugs } from '@/lib/notes';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isNotFoundError } from '@/lib/not-found';
import { languageAlternates } from '@/lib/seo';
import { noteJsonLd } from '@/lib/structured-data';
import Link from 'next/link';
import { renderMarkdown } from '@/lib/markdown';
import TagList from '@/components/TagList';

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
        url: `https://antelacus.com/notes/${note.slug}`,
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

  const jsonLd = noteJsonLd(note);

  return (
    <div className="content-container content-container-standard">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article data-title={note.title}>
        <header>
          <h1>{note.title}</h1>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            <span>{note.date}</span>
            {note.lang && (
              <>
                <span className="mx-2">|</span>
                <span>{note.lang}</span>
              </>
            )}
            {note.tags && note.tags.length > 0 && (
              <>
                <span className="mx-2">|</span>
                <TagList tags={note.tags} />
              </>
            )}
          </div>
        </header>
        
        <div className="prose mt-8">
          {renderMarkdown(note.content)}
        </div>
        
      </article>
    </div>
  );
}
