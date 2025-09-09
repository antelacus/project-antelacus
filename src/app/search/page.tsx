"use client";
import { useEffect, useMemo, useState } from 'react';

interface SearchIndexItem {
  id: string;
  type: 'post' | 'note' | 'photo' | 'project';
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  date: string;
  locale: string;
}

async function fetchManifest() {
  const res = await fetch('/search-index/manifest.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load search manifest');
  return res.json() as Promise<{ files: Record<string, string> }>; 
}

async function fetchIndex(filename: string) {
  const res = await fetch(`/search-index/${filename}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load search index');
  return res.json() as Promise<SearchIndexItem[]>;
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [type, setType] = useState<'all' | 'post' | 'note' | 'photo' | 'project'>('all');
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const manifest = await fetchManifest();
        // single-locale for now
        const filename = manifest.files['zh'];
        const data = await fetchIndex(filename);
        setItems(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load index';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter(item => {
      if (type !== 'all' && item.type !== type) return false;
      if (selectedTags.length && !selectedTags.every(t => item.tags.includes(t))) return false;
      if (!query) return true;
      const hay = `${item.title}\n${item.summary || ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, selectedTags, type, items]);

  return (
    <div className="content-container content-container-standard">
      <h1 className="text-xl mb-4">搜索</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="搜索标题与摘要..."
          className="border px-3 py-2 rounded min-w-[260px]"
        />
        <select value={type} onChange={e => setType(e.target.value as 'all' | 'post' | 'note' | 'photo' | 'project')} className="border px-2 py-2 rounded">
          <option value="all">全部类型</option>
          <option value="post">专栏</option>
          <option value="note">闪念</option>
          <option value="photo">视觉</option>
          <option value="project">实验室</option>
        </select>
      </div>
      {loading ? (
        <p>索引加载中...</p>
      ) : error ? (
        <p>加载失败：{error}</p>
      ) : (
        <div className="content-list">
          {results.length === 0 && <p>未找到匹配结果。</p>}
          <ul className="space-y-3">
            {results.map(it => (
              <li key={it.id}>
                <a className="card-link" href={`/${it.type === 'post' ? 'posts' : it.type === 'note' ? 'notes' : it.type === 'photo' ? 'gallery' : 'projects'}/${it.slug}`}>
                  <div className="card p-3">
                    <div className="text-sm opacity-70">{it.type} · {new Date(it.date).toLocaleDateString()}</div>
                    <div className="font-medium">{it.title}</div>
                    {it.summary && <div className="opacity-80 text-sm line-clamp-2">{it.summary}</div>}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


