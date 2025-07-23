import { z } from 'zod';
import { getAllPostsMeta } from '../src/lib/posts';
import { getAllNotesMeta } from '../src/lib/notes';
import { getAllPhotosMeta } from '../src/lib/gallery';
import { getAllProjectsMeta } from '../src/lib/projects';

async function run() {
  const postSchema = z.object({ 
    title: z.string(), 
    date: z.string(),
    tags: z.array(z.string()).optional(),
  });
  
  const noteSchema = z.object({ 
    title: z.string(), 
    date: z.string(),
    tags: z.array(z.string()).optional(),
  });
  
  const photoSchema = z.object({ 
    title: z.string(),
    date: z.string(),
    imageFolder: z.string(),
    tags: z.array(z.string()).optional(),
  });
  
  const projectSchema = z.object({ 
    name: z.string(), 
    description: z.string(), 
    repo: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
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