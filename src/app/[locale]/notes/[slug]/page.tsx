import { getNoteBySlug } from '@/lib/notes';
import { setRequestLocale } from 'next-intl/server';
import { languageAlternates } from '@/lib/seo';
import { noteJsonLd } from '@/lib/structured-data';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import TagList from '@/components/TagList';
import remarkGfm from 'remark-gfm';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return { title: '笔记未找到' };
  }
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
}

export default async function NotePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const note = await getNoteBySlug(slug);

  if (!note) {
    return (
      <main className="content-container content-container-standard text-center">
        <h1>笔记未找到</h1>
        <p>你访问的笔记不存在或已被删除。</p>
        <Link href="../">返回闪念</Link>
      </main>
    );
  }

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
          <MDXRemote 
            source={note.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              }
            }}
          />
        </div>
        
      </article>
    </div>
  );
}
