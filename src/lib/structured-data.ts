import { locales } from '@/i18n/routing';

import { SITE_ORIGIN } from '@/lib/site';

const SITE_URL = SITE_ORIGIN;
const SITE_NAME = 'AnteLacus';

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Ante Lacus, Pax Mentis',
    inLanguage: [...locales],
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  summary?: string;
  date: string;
  slug: string;
  tags?: string[];
  lang?: string;
  cover?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary ?? '',
    datePublished: post.date,
    dateModified: post.date,
    url: `${SITE_URL}/posts/${post.slug}`,
    image: post.cover ?? `${SITE_URL}/posts/${post.slug}/og.png`,
    inLanguage: post.lang ?? 'zh-CN',
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/posts/${post.slug}`,
    },
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
  };
}

export function noteJsonLd(note: {
  title: string;
  summary?: string;
  date: string;
  slug: string;
  tags?: string[];
  lang?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description: note.summary ?? '',
    datePublished: note.date,
    dateModified: note.date,
    url: `${SITE_URL}/notes/${note.slug}`,
    image: `${SITE_URL}/notes/${note.slug}/og.png`,
    inLanguage: note.lang ?? 'zh-CN',
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/notes/${note.slug}`,
    },
    ...(note.tags?.length ? { keywords: note.tags.join(', ') } : {}),
  };
}

export function imageGalleryJsonLd(photo: {
  title: string;
  caption?: string;
  date: string;
  slug: string;
  coverImage: string;
  location?: string;
  photos: { path: string; caption?: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: photo.title,
    description: photo.caption ?? '',
    datePublished: photo.date,
    url: `${SITE_URL}/gallery/${photo.slug}`,
    ...(photo.location ? { contentLocation: { '@type': 'Place', name: photo.location } } : {}),
    image: photo.photos.slice(0, 10).map((p) => ({
      '@type': 'ImageObject',
      contentUrl: p.path.startsWith('http') ? p.path : `${SITE_URL}${p.path}`,
      ...(p.caption ? { description: p.caption } : {}),
    })),
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function softwareProjectJsonLd(project: {
  name: string;
  description: string;
  slug: string;
  repo: string;
  date: string;
  demo?: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.name,
    description: project.description,
    datePublished: project.date,
    url: `${SITE_URL}/projects/${project.slug}`,
    codeRepository: project.repo || undefined,
    ...(project.demo ? { targetProduct: { '@type': 'WebApplication', url: project.demo } } : {}),
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(project.tags?.length ? { keywords: project.tags.join(', ') } : {}),
  };
}

// Where a piece sits: home › section › piece, each with its localized URL. Rendered by the page on the
// server, so it is in the HTML a crawler fetches.
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({ '@type': 'ListItem', position: i + 1, name: step.name, item: `${SITE_URL}${step.path}` })),
  };
}

// JSON inside a <script> ends at the first `</script`, whatever the JSON thinks. `<` as its JSON escape
// keeps a title such as `</script><script>…` inert; the parsed value is unchanged.
export function jsonLdScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
