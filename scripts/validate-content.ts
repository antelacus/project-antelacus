import { z } from 'zod';
import { getAllPostsMeta } from '../src/lib/posts';
import { getAllNotesMeta } from '../src/lib/notes';
import { getAllPhotosMeta } from '../src/lib/gallery';
import { getAllProjectsMeta } from '../src/lib/projects';
import fs from 'fs/promises';
import path from 'path';

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

  let errorCount = 0;
  const posts = await getAllPostsMeta();
  posts.forEach(p => {
    const res = postSchema.safeParse(p);
    if (!res.success) {
      console.error('Post validation error', p.slug, res.error.errors);
      errorCount++;
    }
  });

  const notes = await getAllNotesMeta();
  notes.forEach(n => {
    const res = noteSchema.safeParse(n);
    if (!res.success) {
      console.error('Note validation error', n.slug, res.error.errors);
      errorCount++;
    }
  });

  const photos = await getAllPhotosMeta();
  photos.forEach(ph => {
    const res = photoSchema.safeParse(ph);
    if (!res.success) {
      console.error('Photo validation error', ph.slug, res.error.errors);
      errorCount++;
    }
  });

  const projects = await getAllProjectsMeta();
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