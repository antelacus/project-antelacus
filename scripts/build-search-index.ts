/*
中文说明：构建静态搜索索引
— 作用：扫描 src/content 下的 MDX 内容（post/note/photo/project），生成轻量 JSON 索引和 manifest，供前端搜索模态加载。
— 使用方式：
  • 自动触发：随 `npm run build` 完成后在 `postbuild` 阶段通过 `npm run build:search-index` 自动执行。
  • 手动执行：`npm run build:search-index`
— 注意：仅索引规范稿 {slug}.mdx（跳过携带语言后缀的文件）；输出写入 public/search-index，文件名包含内容哈希以便缓存与增量失效。
*/
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';

type ContentType = 'post' | 'note' | 'photo' | 'project';

interface SearchIndexItem {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  date: string;
  locale: string; // placeholder for future i18n; current site uses single locale
  cover?: string; // optional cover for post/project; gallery uses first image
  lang?: string; // language for post/note only
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 10);
}

async function run() {
  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const notesDir = path.join(process.cwd(), 'src/content/notes');
  const galleryDir = path.join(process.cwd(), 'src/content/gallery');
  const projectsDir = path.join(process.cwd(), 'src/content/projects');

  const readDir = async (dir: string) => (await fs.readdir(dir)).filter(f => f.endsWith('.mdx'));
  const [postFiles, noteFiles, galleryFiles, projectFiles] = await Promise.all([
    readDir(postsDir), readDir(notesDir), readDir(galleryDir), readDir(projectsDir)
  ]);

  const locale = 'zh';

  const items: SearchIndexItem[] = [];

  for (const file of postFiles) {
    // 跳过带语言后缀的帖子文件（仅索引规范 {slug}.mdx）
    if (/\.[a-z]{2}(?:-[A-Z]{2})?\.mdx$/i.test(file)) continue;
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(postsDir, file), 'utf-8');
    const { data } = matter(raw);
    items.push({
      id: `post:${slug}`,
      type: 'post',
      slug,
      title: (data as any).title,
      summary: (data as any).summary,
      tags: (data as any).tags || [],
      date: (data as any).date,
      locale,
      cover: (data as any).cover,
      lang: (data as any).lang,
    });
  }

  for (const file of noteFiles) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(notesDir, file), 'utf-8');
    const { data } = matter(raw);
    items.push({
      id: `note:${slug}`,
      type: 'note',
      slug,
      title: (data as any).title,
      summary: (data as any).summary,
      tags: (data as any).tags || [],
      date: (data as any).date,
      locale,
      lang: (data as any).lang,
    });
  }

  for (const file of galleryFiles) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(galleryDir, file), 'utf-8');
    const { data } = matter(raw);
    const imageFolder = (data as any).imageFolder || slug;
    let cover: string | undefined = undefined;
    try {
      const dirPath = path.join(process.cwd(), 'public/images/gallery', imageFolder);
      const files = (await fs.readdir(dirPath)).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
      if (files.length > 0) cover = `/images/gallery/${imageFolder}/${files[0]}`;
    } catch {
      // ignore
    }
    items.push({
      id: `photo:${slug}`,
      type: 'photo',
      slug,
      title: (data as any).title,
      summary: (data as any).caption,
      tags: (data as any).tags || [],
      date: (data as any).date,
      locale,
      cover,
    });
  }

  for (const file of projectFiles) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(projectsDir, file), 'utf-8');
    const { data } = matter(raw);
    items.push({
      id: `project:${slug}`,
      type: 'project',
      slug,
      title: (data as any).name,
      summary: (data as any).description,
      tags: (data as any).tags || [],
      date: (data as any).date,
      locale,
      cover: (data as any).cover,
    });
  }

  items.sort((a, b) => b.date.localeCompare(a.date));

  const outDir = path.join(process.cwd(), 'public/search-index');
  await ensureDir(outDir);
  const body = JSON.stringify(items);
  const digest = hashContent(body);
  const filename = `index.${locale}.${digest}.json`;
  await fs.writeFile(path.join(outDir, filename), body, 'utf-8');

  const manifest = {
    version: 1,
    locale,
    files: {
      [locale]: filename,
    },
    generatedAt: new Date().toISOString(),
    count: items.length,
  };
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Search index written: ${filename} (${items.length} items)`);
}

run().catch(err => {
  console.error('Failed to build search index:', err);
  process.exit(1);
});


