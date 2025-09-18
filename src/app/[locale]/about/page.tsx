import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAboutMdx } from '@/lib/pages';
import { languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: '关于我',
    description: '关于 AnteLacus 博客和站长的介绍。',
    alternates: {
      canonical: canonicalFor(locale, '/about'),
      languages: languageAlternates('/about'),
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const mdx = await getAboutMdx(locale);
  if (!mdx) {
    return null;
  }
  return (
    <div className="content-container content-container-standard">
      <div className="about-content">
        <article>
          <MDXRemote source={mdx.content} />
        </article>
      </div>
    </div>
  );
}

