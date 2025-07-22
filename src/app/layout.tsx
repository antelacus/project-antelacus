import './globals.css';
import React from 'react';
import Nav from '../components/Nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'AnteLacus',
    template: '%s | AnteLacus'
  },
  description: 'AnteLacus 个人博客 - 记录思考、分享创意',
  keywords: ['博客', '个人网站', 'AnteLacus'],
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/logo-icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/logo-icon.svg" />
        <link rel="apple-touch-icon" href="/logo-icon.svg" />
      </head>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
