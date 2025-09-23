import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectFromRequestHeaders } from '@/i18n/detect';
import { languageAlternates } from '@/lib/seo';

// 主页metadata配置
export const metadata: Metadata = {
  title: 'Ante Lacus, Pax Mentis',
  description: 'Ante Lacus, Pax Mentis',
  keywords: [
    'AnteLacus',
    '个人博客',
    '技术博客',
    '学习笔记',
    '项目展示',
    '创意空间',
    '设计思考',
    '技术分享'
  ],
  authors: [{ name: 'AnteLacus' }],
  creator: 'AnteLacus',
  publisher: 'AnteLacus',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://antelacus.com'),
  alternates: {
    canonical: '/',
    languages: languageAlternates('/'),
  },
  openGraph: {
    title: 'Ante Lacus, Pax Mentis',
    description: 'Ante Lacus, Pax Mentis',
    url: 'https://antelacus.com',
    siteName: 'AnteLacus',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Ante Lacus, Pax Mentis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ante Lacus, Pax Mentis',
    description: 'Ante Lacus, Pax Mentis',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


export default async function HomePage() {
  const hdrs = await headers();
  const detected = detectFromRequestHeaders(hdrs);
  redirect(`/${detected}`);
}
