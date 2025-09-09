import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function run() {
  // Load tag registry if available
  let tagIds: Set<string> | null = null;
  try {
    const registryPath = path.join(process.cwd(), 'src/content/tag-registry.json');
    const raw = await fs.readFile(registryPath, 'utf-8');
    const data = JSON.parse(raw) as { tags: { id: string }[] };
    tagIds = new Set(data.tags.map(t => t.id));
  } catch (e) {
    // No registry yet: skip strict tag membership validation
    console.warn('Tag registry not found, skipping tag membership validation');
  }

  const tagArray = z.array(z.string()).optional().refine(arr => {
    if (!arr || !tagIds) return true;
    // Ensure all tags exist in registry and are normalized
    return arr.every(t => tagIds!.has(t.trim().toLowerCase()));
  }, { message: 'Tag not found in registry or not normalized (lowercase, hyphenated)' });

  const postSchema = z.object({ 
    title: z.string(), 
    date: z.string(),
    tags: tagArray,
  });
  
  const noteSchema = z.object({ 
    title: z.string(), 
    date: z.string(),
    tags: tagArray,
  });
  
  const photoSchema = z.object({ 
    title: z.string(),
    date: z.string(),
    imageFolder: z.string(),
    tags: tagArray,
  });
  
  const projectSchema = z.object({ 
    name: z.string(), 
    description: z.string(), 
    repo: z.string(),
    date: z.string(),
    tags: tagArray,
  });

  // Read MDX frontmatters directly to avoid importing Next runtime code in Node
  const readDir = async (dir: string) => (await fs.readdir(dir)).filter(f => f.endsWith('.mdx'));
  const base = path.join(process.cwd(), 'src/content');

  const postFiles = await readDir(path.join(base, 'posts'));
  const posts = await Promise.all(postFiles.map(async (file) => {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(base, 'posts', file), 'utf-8');
    const { data } = matter(raw);
    return { slug, title: (data as any).title, date: (data as any).date, tags: (data as any).tags || [] } as { slug: string; title: string; date: string; tags?: string[] };
  }));

  let errorCount = 0;
  posts.forEach(p => {
    const res = postSchema.safeParse(p);
    if (!res.success) {
      console.error('Post validation error', p.slug, res.error.errors);
      errorCount++;
    }
  });

  const noteFiles = await readDir(path.join(base, 'notes'));
  const notes = await Promise.all(noteFiles.map(async (file) => {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(base, 'notes', file), 'utf-8');
    const { data } = matter(raw);
    return { slug, title: (data as any).title, date: (data as any).date, tags: (data as any).tags || [] } as { slug: string; title: string; date: string; tags?: string[] };
  }));
  notes.forEach(n => {
    const res = noteSchema.safeParse(n);
    if (!res.success) {
      console.error('Note validation error', n.slug, res.error.errors);
      errorCount++;
    }
  });

  const photoFiles = await readDir(path.join(base, 'gallery'));
  const photos = await Promise.all(photoFiles.map(async (file) => {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(base, 'gallery', file), 'utf-8');
    const { data } = matter(raw);
    return { slug, title: (data as any).title, date: (data as any).date, imageFolder: (data as any).imageFolder || slug, tags: (data as any).tags || [] } as { slug: string; title: string; date: string; imageFolder: string; tags?: string[] };
  }));
  photos.forEach(ph => {
    const res = photoSchema.safeParse(ph);
    if (!res.success) {
      console.error('Photo validation error', ph.slug, res.error.errors);
      errorCount++;
    }
  });

  const projectFiles = await readDir(path.join(base, 'projects'));
  const projects = await Promise.all(projectFiles.map(async (file) => {
    const slug = file.replace(/\.mdx$/, '');
    const raw = await fs.readFile(path.join(base, 'projects', file), 'utf-8');
    const { data } = matter(raw);
    return {
      slug,
      name: (data as any).name,
      description: (data as any).description,
      repo: (data as any).repo,
      date: (data as any).date,
      tags: (data as any).tags || []
    } as { slug: string; name: string; description: string; repo: string; date: string; tags?: string[] };
  }));
  projects.forEach(pr => {
    const res = projectSchema.safeParse(pr);
    if (!res.success) {
      console.error('Project validation error', pr.slug, res.error.errors);
      errorCount++;
    }
  });

  if (errorCount === 0) {
    console.log('All content validated successfully');
  } else {
    console.error(`Validation completed with ${errorCount} error(s).`);
    process.exit(1);
  }
}

run(); 