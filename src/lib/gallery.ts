import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface PhotoMeta {
  slug: string;
  date: string;
  caption?: string;
  image: string; // url or path
  sourceUrl?: string; // Instagram link
}

export interface Photo extends PhotoMeta {
  content: string;
}

const GALLERY_DIR = path.join(process.cwd(), 'src/content/gallery');

export async function getAllPhotosMeta(): Promise<PhotoMeta[]> {
  const files = await fs.readdir(GALLERY_DIR);
  const photos: PhotoMeta[] = [];
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const filePath = path.join(GALLERY_DIR, file);
    const source = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(source);
    photos.push({
      slug: file.replace(/\.mdx$/, ''),
      date: data.date,
      caption: data.caption,
      image: data.image,
      sourceUrl: data.sourceUrl,
    });
  }
  photos.sort((a, b) => b.date.localeCompare(a.date));
  return photos;
}

export async function getPhotoBySlug(slug: string): Promise<Photo | null> {
  const filePath = path.join(GALLERY_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    return {
      slug,
      date: data.date,
      caption: data.caption,
      image: data.image,
      sourceUrl: data.sourceUrl,
      content,
    };
  } catch (e) {
    return null;
  }
} 