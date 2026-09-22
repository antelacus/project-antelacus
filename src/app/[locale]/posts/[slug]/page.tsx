import { getPostBySlug } from '@/lib/posts';
import { setRequestLocale } from 'next-intl/server';
// import { notFound } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import Link from 'next/link';
import Image from 'next/image';
import TagList from '@/components/TagList';
import { languageAlternates } from '@/lib/seo';
import { blogPostingJsonLd } from '@/lib/structured-data';

// Nothing is built ahead of time (the build must not need the database); an empty list is what lets
// Next cache each page after its first visit instead of rendering it on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: '文章未找到',
      description: '你访问的文章不存在或已被删除。',
    };
  }
  return {
    title: post.title,
    description: post.summary || '',
    alternates: {
      // canonical will be resolved by current locale layout; keep language alternates for SEO
      languages: languageAlternates(`/posts/${post.slug}`),
    },
    openGraph: {
      title: post.title,
      description: post.summary || '',
      type: 'article',
      url: `https://antelacus.com/posts/${post.slug}`,
      images: [{ url: `/posts/${post.slug}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/posts/${post.slug}/og.png`],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await getPostBySlug(slug);

  if (!post) {
    // Though notFound() is better, we'll keep this custom message for now.
    return (
      <main className="content-container content-container-standard text-center">
        <h1>文章未找到</h1>
        <p>你访问的文章不存在或已被删除。</p>
        <Link href="../">返回专栏</Link>
      </main>
    );
  }

  const jsonLd = blogPostingJsonLd(post);

  return (
    <div className="content-container content-container-standard">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article data-title={post.title}>
        <header>
          <h1>{post.title}</h1>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            <span>{post.date}</span>
            {post.lang && (
              <>
                <span className="mx-2">|</span>
                <span>{post.lang}</span>
              </>
            )}
            {post.tags && post.tags.length > 0 && (
              <span className="mx-2">|</span>
            )}
            {post.tags && post.tags.length > 0 && (
              <TagList tags={post.tags} />
            )}
          </div>
        </header>

        {post.cover && (
          <div className="my-8">
            <Image
              src={post.cover}
              alt={post.title}
              width={800}
              height={450}
              className="w-full h-auto"
              priority={true}
            />
          </div>
        )}

        <div className="prose">
          {renderMarkdown(post.content)}
        </div>

      </article>
    </div>
  );
}
