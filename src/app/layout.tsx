import './globals.css';
import React from 'react';
import Nav from '../components/Nav';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'AnteLacus',
    template: '%s | AnteLacus'
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
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/images/common/logo-icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/images/common/logo-icon.svg" />
        <link rel="apple-touch-icon" href="/images/common/logo-icon.svg" />
      </head>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
