import { MDXRemote } from 'next-mdx-remote/rsc';
import { setRequestLocale } from 'next-intl/server';
import { getAboutMdx } from '@/lib/pages';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.about_title'),
    description: await getMetaMessage(locale, 'meta.about_description'),
    alternates: {
      canonical: canonicalFor(locale, '/about'),
      languages: languageAlternates('/about'),
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
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

