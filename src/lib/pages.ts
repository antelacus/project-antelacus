import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ABOUT_DIR = path.join(process.cwd(), 'src', 'content', 'pages', 'about');

export async function getAboutMdx(locale: string): Promise<{ content: string; file: string } | null> {
  const candidates = [
    `about.${locale}.mdx`,
    `about.zh-CN.mdx`,
    `about.en.mdx`,
  ];

  for (const name of candidates) {
    try {
      const filePath = path.join(ABOUT_DIR, name);
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = matter(raw);
      return { content: parsed.content, file: filePath };
    } catch {
      // try next
    }
  }
  return null;
}


