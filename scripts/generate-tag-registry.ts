import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

interface TagRegistryItem {
  id: string;              // canonical tag id (lowercase, hyphen)
  count: number;           // total usage count across all content
  types: string[];         // content types where it appears
}

interface TagRegistryManifest {
  updatedAt: string;
  tags: TagRegistryItem[];
}

function normalizeTagId(raw: string): string {
  return raw.trim().toLowerCase();
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readFrontmatters(dir: string, type: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    const tags: string[] = [];
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const fp = path.join(dir, file);
      const raw = await fs.readFile(fp, 'utf-8');
      const { data } = matter(raw);
      const arr = (data as any).tags as string[] | undefined;
      if (Array.isArray(arr)) {
        for (const t of arr) tags.push(`${type}:${t}`);
      }
    }
    return tags;
  } catch {
    return [];
  }
}

async function run() {
  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const notesDir = path.join(process.cwd(), 'src/content/notes');
  const galleryDir = path.join(process.cwd(), 'src/content/gallery');
  const projectsDir = path.join(process.cwd(), 'src/content/projects');

  const [pt, nt, gt, prt] = await Promise.all([
    readFrontmatters(postsDir, 'post'),
    readFrontmatters(notesDir, 'note'),
    readFrontmatters(galleryDir, 'photo'),
    readFrontmatters(projectsDir, 'project'),
  ]);

  const tagMap = new Map<string, { count: number; types: Set<string> }>();

  const collect = (tagWithType: string) => {
    const [type, raw] = tagWithType.split(':');
    const id = normalizeTagId(raw);
    if (!tagMap.has(id)) {
      tagMap.set(id, { count: 0, types: new Set<string>() });
    }
    const stat = tagMap.get(id)!;
    stat.count += 1;
    stat.types.add(type);
  };

  [...pt, ...nt, ...gt, ...prt].forEach(collect);

  const items: TagRegistryItem[] = Array.from(tagMap.entries())
    .map(([id, { count, types }]) => ({ id, count, types: Array.from(types).sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const registry: TagRegistryManifest = {
    updatedAt: new Date().toISOString(),
    tags: items,
  };

  const outDir = path.join(process.cwd(), 'src/content');
  await ensureDir(outDir);
  const outFile = path.join(outDir, 'tag-registry.json');
  await fs.writeFile(outFile, JSON.stringify(registry, null, 2), 'utf-8');
  console.log(`Tag registry written: ${path.relative(process.cwd(), outFile)} (${items.length} tags)`);
}

run().catch(err => {
  console.error('Failed to generate tag registry:', err);
  process.exit(1);
});


