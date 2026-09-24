import { getAllPostsMeta } from './posts';
import { getAllNotesMeta } from './notes';
import { getAllPhotosMeta } from './gallery';
import { getAllProjectsMeta } from './projects';
import { fromNote, fromPhoto, fromPost, fromProject, type Entry } from './entry';

// 统一的内容元数据类型（用于标签聚合）
export interface ContentMeta {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
  type: 'post' | 'note' | 'photo' | 'project';
}

// 标签统计信息
export interface TagStats {
  tag: string;
  count: number;
  types: Set<string>;
  items: ContentMeta[];
}

export interface TagSummary {
  id: string;
  count: number;
  types: string[];
}

// 聚合所有内容的标签
export async function getAllTags(): Promise<string[]> {
  return Array.from((await getTagStats()).keys()).sort();
}

// 获取标签统计信息
export async function getTagStats(): Promise<Map<string, TagStats>> {
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);

  const tagStatsMap = new Map<string, TagStats>();

  // 处理所有内容类型
  const allContent: ContentMeta[] = [
    ...posts.map(p => ({ ...p, type: 'post' as const })),
    ...notes.map(n => ({ ...n, type: 'note' as const })),
    ...photos.map(p => ({ ...p, type: 'photo' as const })),
    ...projects.map(p => ({ ...p, title: p.name, type: 'project' as const })),
  ];

  // 统计每个标签的使用情况
  allContent.forEach(content => {
    content.tags?.forEach(tag => {
      if (!tagStatsMap.has(tag)) {
        tagStatsMap.set(tag, {
          tag,
          count: 0,
          types: new Set(),
          items: [],
        });
      }
      
      const stats = tagStatsMap.get(tag)!;
      stats.count += 1;
      stats.types.add(content.type);
      stats.items.push(content);
    });
  });

  return tagStatsMap;
}

export async function getTagSummaries(): Promise<TagSummary[]> {
  return Array.from((await getTagStats()).values())
    .map((stats) => ({
      id: stats.tag,
      count: stats.count,
      types: Array.from(stats.types).sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Every published piece with this tag, newest first, as entries for the catalogue. */
export async function getEntriesByTag(tag: string): Promise<Entry[]> {
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);
  return [...posts.map(fromPost), ...notes.map(fromNote), ...photos.map(fromPhoto), ...projects.map(fromProject)]
    .filter((entry) => entry.tags.includes(tag))
    .sort((a, b) => b.date.localeCompare(a.date));
}
