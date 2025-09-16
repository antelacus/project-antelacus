import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAboutMdx } from '../../lib/pages';
import { languageAlternates, canonicalFor } from '../../lib/seo';

export async function generateMetadata({ params }: { params?: Promise<{ locale?: string }> }) {
  const locale = params ? (await params).locale || 'en' : 'en';
  return {
    title: '关于我',
    description: '关于 AnteLacus 博客和站长的介绍。',
    alternates: {
      canonical: canonicalFor(locale, '/about'),
      languages: languageAlternates('/about'),
    },
  };
}

export default async function AboutPage({ params }: { params?: Promise<{ locale?: string }> }) {
  const locale = params ? (await params).locale || 'zh-CN' : 'zh-CN';
  const mdx = await getAboutMdx(locale);
  if (!mdx) {
    return null;
  }
  return (
    <div className="content-container content-container-standard">
      <div className="about-content">
        <article>
          {/* SEO alternates for About */}
          <meta name="alternates" content="" />
          <MDXRemote source={mdx.content} />
        </article>
      </div>
    </div>
  );
}