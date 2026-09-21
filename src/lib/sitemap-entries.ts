import { locales } from '@/i18n/routing';
import { getAllPostsMeta } from '@/lib/posts';
import { getAllNotesMeta } from '@/lib/notes';
import { getAllProjectsMeta } from '@/lib/projects';
import { getAllPhotosMeta } from '@/lib/gallery';

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages: Record<string, string>;
  };
};

const BASE = 'https://antelacus.com';

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

// Deliberately not `app/sitemap.ts`: a file of that name is itself a route generated at build time,
// which would make the build need the database.
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  // Static top-level pages for each locale
  for (const l of locales) {
    entries.push(page(`/${l}`, undefined, 1.0));
    entries.push(page(`/${l}/about`, undefined, 0.6));
    entries.push(page(`/${l}/posts`, undefined, 0.8));
    entries.push(page(`/${l}/notes`, undefined, 0.7));
    entries.push(page(`/${l}/gallery`, undefined, 0.7));
    entries.push(page(`/${l}/projects`, undefined, 0.7));
    entries.push(page(`/${l}/tags`, undefined, 0.6));
  }

  // Content-driven pages (canonical single MDX per content; replicate per-locale paths)
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);

  // Posts
  for (const p of posts) {
    for (const l of locales) {
      entries.push(page(`/${l}/posts/${p.slug}`, p.date, 0.9));
    }
  }

  // Notes
  for (const n of notes) {
    for (const l of locales) {
      entries.push(page(`/${l}/notes/${n.slug}`, n.date, 0.8));
    }
  }

  // Gallery albums
  for (const g of photos) {
    for (const l of locales) {
      entries.push(page(`/${l}/gallery/${g.slug}`, g.date, 0.7));
    }
  }

  // Projects
  for (const prj of projects) {
    for (const l of locales) {
      entries.push(page(`/${l}/projects/${prj.slug}`, prj.date, 0.75));
    }
  }

  // Tag detail pages (based on current tag registry)
  try {
    const { getAllTags } = await import('@/lib/tags');
    const tags = await getAllTags();
    for (const tag of tags) {
      for (const l of locales) {
        entries.push(page(`/${l}/tags/${encodeURIComponent(tag)}`, undefined, 0.6));
      }
    }
  } catch {
    // tags optional
  }

  // De-duplicate just in case
  const seen = new Set<string>();
  const deduped: SitemapEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.url)) continue;
    seen.add(e.url);
    deduped.push(e);
  }
  return deduped;
}
