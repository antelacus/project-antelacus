import '@/app/globals.css';
import 'katex/dist/katex.min.css';
import React from 'react';
import SkipLink from './SkipLink';
import { cormorantGaramond, sourceSerif4, jetbrainsMono, sourceHanSerif } from '@/app/fonts';
import type { AppLocale } from '@/i18n/routing';
import { getMetaMessage } from '@/lib/seo';
import { jsonLdScript, websiteJsonLd } from '@/lib/structured-data';

// The document shell shared by the two root layouts. It must not read the request (cookies, headers):
// the caller passes `lang`, which keeps every public page cacheable.
type Props = {
  lang: AppLocale;
  children: React.ReactNode;
  /** Rendered before <main>, so a skip link really skips it. */
  nav?: React.ReactNode;
  /** Wraps nav and main together (a translation provider both need). */
  wrap?: (content: React.ReactNode) => React.ReactNode;
};

export default async function SiteDocument({ lang, children, nav, wrap = (content) => content }: Props) {
  // Rendered above the translation provider, so the one string the shell shows is read here.
  const skipLabel = await getMetaMessage(lang, 'utility.skip_to_content');
  return (
    <html
      lang={lang}
      className={`${cormorantGaramond.variable} ${sourceSerif4.variable} ${jetbrainsMono.variable} ${sourceHanSerif.variable}`}
    >
      {/* eslint-disable-next-line @next/next/no-head-element -- this IS the root layouts' document; the rule only knows app/layout.tsx */}
      <head>
        {/* Inline so the first paint has the paper colour before the stylesheet arrives */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-paper: #F9F8F6;
              --color-ink: #1E1E1D;
              --color-seal: #B42A1E;
              --color-wash-moss: #EFF1ED;
              --color-wash-stone: #EAEAEA;
            }
            body {
              background-color: var(--color-paper);
              color: var(--color-ink);
              margin: 0;
              padding: 0;
              line-height: 1.7;
              font-family: var(--font-source-serif-4), serif;
            }
            .content-container {
              width: 100%;
              margin: 0 auto;
              padding: 2rem 1rem;
            }
            @media (min-width: 768px) {
              .content-container { padding: 4rem 2rem; }
            }
          `
        }} />
        
        <link rel="icon" href="/images/common/logo-icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/images/common/logo-icon.svg" />
        <link rel="apple-touch-icon" href="/images/common/logo-icon.svg" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd()) }}
        />
      </head>
      <body>
        <SkipLink label={skipLabel} />
        {wrap(
          <>
            {nav}
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </>,
        )}
      </body>
    </html>
  );
}
