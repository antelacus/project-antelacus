import { locales, localizedSections } from '@/i18n/routing';
import { getAllPostsMeta } from '@/lib/posts';
import { getAllNotesMeta } from '@/lib/notes';
import { getAllProjectsMeta } from '@/lib/projects';
import { getAllPhotosMeta } from '@/lib/gallery';
import { getAllTags } from '@/lib/tags';
import { hasPublishedPage } from '@/lib/pages';
import { SITE_ORIGIN } from '@/lib/site';

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages: Record<string, string>;
  };
};

const BASE = SITE_ORIGIN;

function withLocales(path: string): Record<string, string> {
  // Given a path that already includes defaultLocale prefix (e.g. /en/posts)
  // we derive alternates for every supported locale by swapping the prefix.
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const parts = normalized.split('/').filter(Boolean);
  const rest = parts.slice(1).join('/');
  const languages: Record<string, string> = {};
  for (const l of locales) {
    const localizedPath = `/${l}${rest ? '/' + rest : ''}`;
    languages[l] = `${BASE}${localizedPath}`;
  }
  return languages;
}

function page(urlPath: string, lastModified?: string | Date, priority?: number): SitemapEntry {
  const localizedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return {
    url: `${BASE}${localizedPath}`,
    lastModified,
    changeFrequency: 'weekly',
    priority,
    alternates: {
      languages: withLocales(localizedPath),
    },
  };
}

export type SitemapContent = { slug: string; date?: string };
export type SitemapData = {
  posts: SitemapContent[];
  notes: SitemapContent[];
  photos: SitemapContent[];
  projects: SitemapContent[];
  tags: string[];
  /** Whether the about page has a published version in any language; without one it is a 404. */
  about: boolean;
};

// Pure: every locale gets the home page, every section, every content page and every tag page, and
// each entry lists its alternates in all locales. Tested without a database.
export function buildSitemapEntries(data: SitemapData): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  // The home page and every public section, from the one registry; a section not listed here gets the default weight.
  const sectionPriority: Partial<Record<(typeof localizedSections)[number], number>> = { posts: 0.8, notes: 0.7, gallery: 0.7, projects: 0.7 };
  for (const l of locales) {
    entries.push(page(`/${l}`, undefined, 1.0));
    for (const section of localizedSections) {
      if (section === 'about' && !data.about) continue;
      entries.push(page(`/${l}/${section}`, undefined, sectionPriority[section] ?? 0.6));
    }
  }

  const contentPriority: [string, SitemapContent[], number][] = [
    ['posts', data.posts, 0.9],
    ['notes', data.notes, 0.8],
    ['gallery', data.photos, 0.7],
    ['projects', data.projects, 0.75],
  ];
  for (const [section, items, priority] of contentPriority) {
    for (const item of items) {
      for (const l of locales) entries.push(page(`/${l}/${section}/${item.slug}`, item.date, priority));
    }
  }

  for (const tag of data.tags) {
    for (const l of locales) entries.push(page(`/${l}/tags/${encodeURIComponent(tag)}`, undefined, 0.6));
  }

  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
}

// Deliberately not `app/sitemap.ts`: a file of that name is itself a route generated at build time,
// which would make the build need the database.
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const [posts, notes, photos, projects, tags, about] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
    getAllTags(),
    hasPublishedPage('about'),
  ]);
  return buildSitemapEntries({ posts, notes, photos, projects, tags, about });
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Hand-rendered so the xhtml namespace Google expects is present; every value is escaped.
export function renderSitemapXml(entries: SitemapEntry[]): string {
  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
  for (const e of entries) {
    parts.push('<url>');
    parts.push(`<loc>${escapeXml(e.url)}</loc>`);
    for (const [lang, href] of Object.entries(e.alternates?.languages ?? {})) {
      parts.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`);
    }
    if (e.lastModified) {
      const lastmod = typeof e.lastModified === 'string' ? e.lastModified : e.lastModified.toISOString();
      parts.push(`<lastmod>${escapeXml(lastmod)}</lastmod>`);
    }
    if (e.changeFrequency) parts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
    if (typeof e.priority === 'number') parts.push(`<priority>${e.priority}</priority>`);
    parts.push('</url>');
  }
  parts.push('</urlset>');
  return parts.join('\n');
}
