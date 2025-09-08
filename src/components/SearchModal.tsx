"use client";
import { useEffect, useMemo, useState } from 'react';

type ContentType = 'post' | 'note' | 'photo' | 'project';

interface SearchIndexItem {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  date: string; // ISO or YYYY-MM-DD
  locale: string;
  cover?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

async function tryLoadStaticIndex(): Promise<SearchIndexItem[] | null> {
  try {
    const res = await fetch('/search-index/manifest.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const manifest = await res.json();
    const filename = manifest.files?.zh;
    if (!filename) return null;
    const idxRes = await fetch(`/search-index/${filename}`, { cache: 'no-store' });
    if (!idxRes.ok) return null;
    return (await idxRes.json()) as SearchIndexItem[];
  } catch {
    return null;
  }
}

export default function SearchModal({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ContentType>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sort, setSort] = useState<'relevance' | 'newest' | 'oldest'>('newest');

  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const staticData = await tryLoadStaticIndex();
        if (staticData && staticData.length) {
          setItems(staticData);
        } else {
          const apiRes = await fetch('/api/search-index', { cache: 'no-store' });
          if (!apiRes.ok) throw new Error('索引接口不可用');
          const data = (await apiRes.json()) as SearchIndexItem[];
          setItems(data);
        }
        setError(null);
      } catch (e: any) {
        setError(e.message || '索引加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  // Allow ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach(it => (it.tags || []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  const allYears = useMemo(() => {
    const s = new Set<string>();
    items.forEach(it => {
      const y = (it.date || '').slice(0, 4);
      if (y) s.add(y);
    });
    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    let filtered = items.filter(it => {
      if (selectedType !== 'all' && it.type !== selectedType) return false;
      if (selectedTags.length && !selectedTags.every(t => it.tags.includes(t))) return false;
      if (selectedYear !== 'all' && !(it.date || '').startsWith(selectedYear)) return false;
      if (!query) return true;
      const hay = `${it.title}\n${it.summary || ''}`.toLowerCase();
      return hay.includes(query);
    });

    if (sort === 'newest') filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    else if (sort === 'oldest') filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    else if (sort === 'relevance' && query) {
      const score = (it: SearchIndexItem) => {
        const title = (it.title || '').toLowerCase();
        const summary = (it.summary || '').toLowerCase();
        let s = 0;
        if (title.includes(query)) s += 3;
        if (summary.includes(query)) s += 1;
        return s;
      };
      filtered.sort((a, b) => score(b) - score(a));
    }
    return filtered;
  }, [items, q, selectedType, selectedTags, selectedYear, sort]);

  const clearAll = () => {
    setQ('');
    setSelectedType('all');
    setSelectedTags([]);
    setSelectedYear('all');
    setSort('newest');
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '5vh auto 0 auto',
          height: '90vh',
          background: 'var(--color-paper)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid var(--color-wash-stone, #EAEAEA)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full">
          {/* Left: search + results */}
          <div className="flex-1 border-r" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-2">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="搜索标题与摘要..."
                    aria-label="搜索"
                    style={{
                      width: '100%',
                      border: '1px solid var(--color-ink, #1E1E1D)',
                      padding: '8px 56px 8px 12px',
                      borderRadius: '8px',
                      background: 'var(--color-paper, #F9F8F6)',
                      color: 'var(--color-ink, #1E1E1D)'
                    }}
                  />
                  {q && (
                    <button
                      onClick={clearAll}
                      aria-label="清空"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '4px 8px',
                        border: '1px solid var(--color-seal, #B42A1E)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--color-seal, #B42A1E)',
                        cursor: 'pointer'
                      }}
                    >清空</button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 64px)' }}>
              {loading ? (
                <p>索引加载中...</p>
              ) : error ? (
                <p>加载失败：{error}</p>
              ) : (
                <ul className="space-y-3">
                  {results.map(it => (
                    <li key={it.id}>
                      <a className="card-link" href={`/${it.type === 'post' ? 'posts' : it.type === 'note' ? 'notes' : it.type === 'photo' ? 'gallery' : 'projects'}/${it.slug}`}>
                        <div className="card p-3" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="text-sm opacity-70">{it.type} · {new Date(it.date).toLocaleDateString()}</div>
                            <div className="font-medium">{it.title}</div>
                            {it.summary && <div className="opacity-80 text-sm line-clamp-2">{it.summary}</div>}
                          </div>
                          {it.cover && (
                            <div style={{ width: '130px', height: '90px', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--color-ink)', borderRadius: '6px' }}>
                              <img src={it.cover} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                  {results.length === 0 && <li className="opacity-70">未找到匹配结果。</li>}
                </ul>
              )}
            </div>
          </div>

          {/* Right: filters */}
          <div style={{ width: '320px' }} className="p-4">
            <div className="mb-4">
              <div className="mb-2 font-medium">排序</div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as any)}
                style={{ width: '100%', border: '1px solid var(--color-ink, #1E1E1D)', padding: '8px', borderRadius: '8px', background: 'var(--color-paper, #F9F8F6)' }}
              >
                <option value="relevance">最相关</option>
                <option value="newest">最新</option>
                <option value="oldest">最早</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="mb-2 font-medium">类型</div>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as any)}
                style={{ width: '100%', border: '1px solid var(--color-ink, #1E1E1D)', padding: '8px', borderRadius: '8px', background: 'var(--color-paper, #F9F8F6)' }}
              >
                <option value="all">全部</option>
                <option value="post">专栏</option>
                <option value="note">闪念</option>
                <option value="photo">视觉</option>
                <option value="project">实验室</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="mb-2 font-medium">标签</div>
              <div className="flex flex-wrap gap-2" style={{ maxHeight: '180px', overflow: 'auto' }}>
                {allTags.map(t => {
                  const active = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTags(prev => active ? prev.filter(x => x !== t) : [...prev, t])}
                      className="text-xs px-2 py-1 border rounded"
                      style={{
                        background: active ? 'var(--color-seal)' : 'transparent',
                        color: active ? 'white' : 'inherit'
                      }}
                    >
                      #{t}
                    </button>
                  );
                })}
                {allTags.length === 0 && <span className="text-sm opacity-70">暂无标签</span>}
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 font-medium">年份</div>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                style={{ width: '100%', border: '1px solid var(--color-ink, #1E1E1D)', padding: '8px', borderRadius: '8px', background: 'var(--color-paper, #F9F8F6)' }}
              >
                <option value="all">全部年份</option>
                {allYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


