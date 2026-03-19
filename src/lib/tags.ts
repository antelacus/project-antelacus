import { getAllPostsMeta } from './posts';
import { getAllNotesMeta } from './notes';
import { getAllPhotosMeta } from './gallery';
import { getAllProjectsMeta } from './projects';

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

// 根据标签筛选内容
export async function getContentByTag(tag: string): Promise<ContentMeta[]> {
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);

  const filteredContent: ContentMeta[] = [];

  // 筛选包含该标签的内容
  posts.forEach(post => {
    if (post.tags?.includes(tag)) {
      filteredContent.push({ ...post, type: 'post' });
    }
  });

  notes.forEach(note => {
    if (note.tags?.includes(tag)) {
      filteredContent.push({ ...note, type: 'note' });
    }
  });

  photos.forEach(photo => {
    if (photo.tags?.includes(tag)) {
      filteredContent.push({ ...photo, type: 'photo' });
    }
  });

  projects.forEach(project => {
    if (project.tags?.includes(tag)) {
      filteredContent.push({ ...project, title: project.name, type: 'project' });
    }
  });

  // 按日期排序
  return filteredContent.sort((a, b) => b.date.localeCompare(a.date));
}

// 标签规范化工具
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

// 标签验证工具
export function validateTags(tags: string[]): string[] {
  return tags
    .filter(tag => tag && tag.trim().length > 0)
    .map(tag => tag.trim())
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // 去重
}

// 获取热门标签（按使用频率排序）
export async function getPopularTags(limit: number = 10): Promise<TagStats[]> {
  const tagStatsMap = await getTagStats();
  const sortedTags = Array.from(tagStatsMap.values())
    .sort((a, b) => b.count - a.count);
  
  return sortedTags.slice(0, limit);
}

// 获取相关标签（基于共同出现的内容）
export async function getRelatedTags(targetTag: string, limit: number = 5): Promise<string[]> {
  const tagStatsMap = await getTagStats();
  const targetStats = tagStatsMap.get(targetTag);
  
  if (!targetStats) return [];

  const relatedTagCounts = new Map<string, number>();

  // 统计与目标标签共同出现的其他标签
  targetStats.items.forEach(item => {
    item.tags?.forEach(tag => {
      if (tag !== targetTag) {
        relatedTagCounts.set(tag, (relatedTagCounts.get(tag) || 0) + 1);
      }
    });
  });

  // 按共同出现次数排序
  return Array.from(relatedTagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
} 
