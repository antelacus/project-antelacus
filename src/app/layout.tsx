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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
