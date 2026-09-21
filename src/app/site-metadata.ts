import type { Metadata, Viewport } from 'next';

// Both root layouts (`[locale]` and `admin`) export these: metadata and viewport are route-segment
// exports, so a shared component cannot carry them.
export const siteMetadata: Metadata = {
  title: {
    default: 'AnteLacus',
    template: '%s | AnteLacus',
  },
  description: 'Ante Lacus, Pax Mentis',
  metadataBase: new URL('https://antelacus.com'),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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
  verification: {
    google: process.env.SITE_VERIFICATION_GOOGLE || undefined,
    other: {
      ...(process.env.SITE_VERIFICATION_BING ? { 'msvalidate.01': process.env.SITE_VERIFICATION_BING } : {}),
      ...(process.env.SITE_VERIFICATION_BAIDU ? { 'baidu-site-verification': process.env.SITE_VERIFICATION_BAIDU } : {}),
    },
  },
  openGraph: {
    title: 'AnteLacus',
    description: 'Ante Lacus, Pax Mentis',
    siteName: 'AnteLacus',
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
    title: 'AnteLacus',
    description: 'Ante Lacus, Pax Mentis',
    images: ['/og.png'],
  },
  icons: {
    icon: '/images/common/logo-icon.svg',
    shortcut: '/images/common/logo-icon.svg',
    apple: '/images/common/logo-icon.svg',
  },
};

export const siteViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#F9F8F6',
};
