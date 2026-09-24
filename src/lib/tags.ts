import { getAllPostsMeta } from './posts';
import { getAllNotesMeta } from './notes';
import { getAllPhotosMeta } from './gallery';
import { getAllProjectsMeta } from './projects';
import { fromNote, fromPhoto, fromPost, fromProject, type Entry } from './entry';

export interface TagSummary {
  id: string;
  count: number;
}

async function allEntries(): Promise<Entry[]> {
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);
  return [...posts.map(fromPost), ...notes.map(fromNote), ...photos.map(fromPhoto), ...projects.map(fromProject)];
}

/** Every tag in use and how many pieces carry it, by tag. */
export async function getTagSummaries(): Promise<TagSummary[]> {
  const counts = new Map<string, number>();
  for (const entry of await allEntries()) for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return Array.from(counts, ([id, count]) => ({ id, count })).sort((a, b) => a.id.localeCompare(b.id));
}

export async function getAllTags(): Promise<string[]> {
  return (await getTagSummaries()).map((summary) => summary.id);
}

/** Every published piece with this tag, newest first, as entries for the catalogue. */
export async function getEntriesByTag(tag: string): Promise<Entry[]> {
  return (await allEntries()).filter((entry) => entry.tags.includes(tag)).sort((a, b) => b.date.localeCompare(a.date));
}
