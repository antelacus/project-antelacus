import './globals.css';
import React from 'react';
import Nav from '../components/Nav';
import PerformanceMonitor from '../components/PerformanceMonitor';
import SkipLink from '../components/SkipLink';
import type { Metadata, Viewport } from 'next';
import { cormorantGaramond, sourceSerif4, jetbrainsMono, sourceHanSerif } from './fonts';

export const metadata: Metadata = {
  title: {
    default: 'AnteLacus',
    template: '%s | AnteLacus',
  },
  description: 'AnteLacus 个人博客 - 记录思考、分享创意',
  keywords: ['博客', '个人网站', 'AnteLacus'],
  icons: {
    icon: '/images/common/logo-icon.svg',
    shortcut: '/images/common/logo-icon.svg',
    apple: '/images/common/logo-icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${cormorantGaramond.variable} ${sourceSerif4.variable} ${jetbrainsMono.variable} ${sourceHanSerif.variable}`}
    >
      <head>
        {/* Preload critical fonts for immediate rendering */}
        <link
          rel="preload"
          href="/fonts/cormorant-garamond-v16-latin-500.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/source-serif-4-v8-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Critical CSS for immediate paint */}
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
        
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <PerformanceMonitor enableDevLogs={process.env.NODE_ENV === 'development'} />
        <SkipLink />
        <Nav />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
