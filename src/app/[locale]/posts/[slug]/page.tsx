import Article from '@/components/Article';
import { getPostBySlug, getPostSlugs } from '@/lib/posts';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isNotFoundError } from '@/lib/not-found';
import { canonicalFor, detailTrail, languageAlternates } from '@/lib/seo';
import { SITE_ORIGIN } from '@/lib/site';
import { blogPostingJsonLd, jsonLdScript, breadcrumbJsonLd } from '@/lib/structured-data';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  // Metadata renders outside the error boundary: a database failure here would be a bare 500, so
  // it falls back to the layout's defaults and lets the page body raise the error where it is caught.
  try {
    if (!(await getPostSlugs()).includes(slug)) notFound();
    const post = await getPostBySlug(slug);
    if (!post) notFound();
    return {
      title: post.title,
      description: post.summary || '',
      alternates: {
        canonical: canonicalFor(locale, `/posts/${post.slug}`),
        languages: languageAlternates(`/posts/${post.slug}`),
      },
      openGraph: {
        title: post.title,
        description: post.summary || '',
        type: 'article',
        url: `${SITE_ORIGIN}/posts/${post.slug}`,
        images: [{ url: `/posts/${post.slug}/og.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`/posts/${post.slug}/og.png`],
      },
    };
  } catch (error) {
    if (isNotFoundError(error)) throw error;
    return {};
  }
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!(await getPostSlugs()).includes(slug)) notFound();
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="page page-narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostingJsonLd(post)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(await detailTrail(locale, 'posts', slug, post.title))) }} />
      <Article title={post.title} lang={post.lang} date={post.date} lead={post.summary} cover={post.cover} body={post.content}
        colophon={{ date: post.date, tags: post.tags, lang: post.lang }} />
    </div>
  );
}
