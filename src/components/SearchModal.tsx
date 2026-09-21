"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import PostCard from './PostCard';
import NoteCard from './NoteCard';
import PhotoCard from './PhotoCard';
import ProjectCard from './ProjectCard';
import { PostMeta } from '../lib/posts';
import { NoteMeta } from '../lib/notes';
import { PhotoMeta } from '../lib/gallery';
import { ProjectMeta } from '../lib/projects';
import { locales } from '@/i18n/routing';

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
  lang?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  preset?: {
    tags?: string[];
    type?: 'post' | 'note' | 'photo' | 'project' | 'all';
    q?: string;
    year?: string;
  };
}

async function tryLoadDynamicIndex(): Promise<SearchIndexItem[] | null> {
  try {
    const apiRes = await fetch('/api/search-index', { cache: 'no-store' });
    if (!apiRes.ok) return null;
    return (await apiRes.json()) as SearchIndexItem[];
  } catch {
    return null;
  }
}

export default function SearchModal({ open, onClose, preset }: Props) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ContentType>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const LANG_FILTERS = ['all', ...locales] as const;
  type LangFilter = typeof LANG_FILTERS[number];
  const [selectedLang, setSelectedLang] = useState<LangFilter>('all');
  const isLangFilter = (v: string): v is LangFilter => (LANG_FILTERS as readonly string[]).includes(v);
  const [sort, setSort] = useState<'relevance' | 'newest' | 'oldest'>('newest');

  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mobile-aware UI state
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Apply preset filters when opening
    if (preset?.tags) setSelectedTags(preset.tags);
    if (preset?.type) setSelectedType(preset.type);
    if (preset?.q !== undefined) setQ(preset.q);
    if (preset?.year) setSelectedYear(preset.year);
    setLoading(true);
    (async () => {
      try {
        const dynamicData = await tryLoadDynamicIndex();
        if (!dynamicData) throw new Error('索引接口不可用');
        setItems(dynamicData);
        setError(null);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '索引加载失败';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, preset?.tags, preset?.type, preset?.q, preset?.year]);

  // Allow ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Close when clicking anywhere outside the modal container
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open, onClose]);

  // Track viewport to switch layout and default filter visibility
  useEffect(() => {
    const handle = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Desktop: always show filters; Mobile: default隐藏
      setShowFilters(prev => (mobile ? prev : true));
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

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

  const allLangs = useMemo(() => {
    // Only collect langs from posts and notes
    const s = new Set<string>();
    items.forEach(it => {
      if ((it.type === 'post' || it.type === 'note') && it.lang) s.add(it.lang);
    });
    return Array.from(s).sort();
  }, [items]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = items.filter(it => {
      if (selectedType !== 'all' && it.type !== selectedType) return false;
      if (selectedTags.length && !selectedTags.every(t => it.tags.includes(t))) return false;
      if (selectedYear !== 'all' && !(it.date || '').startsWith(selectedYear)) return false;
      if (selectedLang !== 'all') {
        // Only apply language filter to post/note types
        if (it.type === 'post' || it.type === 'note') {
          if ((it.lang || '') !== selectedLang) return false;
        }
      }
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
  }, [items, q, selectedType, selectedTags, selectedYear, selectedLang, sort]);

  const clearAll = () => {
    setQ('');
    setSelectedType('all');
    setSelectedTags([]);
    setSelectedYear('all');
    setSelectedLang('all');
    setSort('newest');
  };

  // Unified filters block; used by desktop sidebar and mobile overlay
  const Filters = () => (
    <>
      <div className="mb-4">
        <div className="mb-2 font-medium">{t('search.sort')}</div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'relevance' | 'newest' | 'oldest')}
          style={{ 
            width: '100%', 
            border: '1px solid rgba(30, 30, 29, 0.1)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            background: 'transparent',
            color: 'var(--color-ink, #1E1E1D)',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onFocus={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
            (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
          }}
          onMouseEnter={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            }
          }}
          onMouseLeave={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          <option value="relevance">{t('search.sortRelevance')}</option>
          <option value="newest">{t('search.sortNewest')}</option>
          <option value="oldest">{t('search.sortOldest')}</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="mb-2 font-medium">{t('search.type')}</div>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value as 'all' | ContentType)}
          style={{ 
            width: '100%', 
            border: '1px solid rgba(30, 30, 29, 0.1)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            background: 'transparent',
            color: 'var(--color-ink, #1E1E1D)',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onFocus={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
            (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
          }}
          onMouseEnter={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            }
          }}
          onMouseLeave={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          <option value="all">{t('search.all')}</option>
          <option value="post">{t('nav.posts')}</option>
          <option value="note">{t('nav.notes')}</option>
          <option value="photo">{t('nav.gallery')}</option>
          <option value="project">{t('nav.projects')}</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="mb-2 font-medium">{t('search.language') || '语言'}</div>
        <select
          value={selectedLang}
          onChange={e => setSelectedLang(isLangFilter(e.target.value) ? e.target.value : 'all')}
          style={{ 
            width: '100%', 
            border: '1px solid rgba(30, 30, 29, 0.1)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            background: 'transparent',
            color: 'var(--color-ink, #1E1E1D)',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onFocus={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
            (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
          }}
          onMouseEnter={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            }
          }}
          onMouseLeave={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          <option value="all">{t('search.allLanguages') || '全部语言'}</option>
          {allLangs.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Year before Tags */}
      <div className="mb-4">
        <div className="mb-2 font-medium">{t('search.year')}</div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          style={{ 
            width: '100%', 
            border: '1px solid rgba(30, 30, 29, 0.1)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            background: 'transparent',
            color: 'var(--color-ink, #1E1E1D)',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onFocus={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
            (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
          }}
          onMouseEnter={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
            }
          }}
          onMouseLeave={(e) => {
            if (e.target !== document.activeElement) {
              (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          <option value="all">{t('search.allYears')}</option>
          {allYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <div className="mb-2 font-medium">{t('search.tags')}</div>
        <div className="flex flex-wrap gap-1" style={{ maxHeight: '180px', overflow: 'auto' }}>
          {allTags.map(tg => {
            const active = selectedTags.includes(tg);
            return (
              <button
                key={tg}
                onClick={() => setSelectedTags(prev => active ? prev.filter(x => x !== tg) : [...prev, tg])}
                style={{
                  fontSize: '12px',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: active ? 'var(--color-seal, #B42A1E)' : 'var(--color-ink, #1E1E1D)',
                  cursor: 'pointer',
                  marginRight: '3px',
                  marginBottom: '3px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = 'var(--color-seal, #B42A1E)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = active ? 'var(--color-seal, #B42A1E)' : 'var(--color-ink, #1E1E1D)';
                }}
              >
                #{tg}
              </button>
            );
          })}
          {allTags.length === 0 && <span className="text-sm opacity-70">{t('search.noTags')}</span>}
        </div>
      </div>
    </>
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        style={{
          maxWidth: '1100px',
          margin: '5vh auto 0 auto',
          height: '90vh',
          background: 'var(--color-paper)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid var(--color-wash-stone, #EAEAEA)',
          textAlign: 'left'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full search-modal-content">
          {/* Left: search + results */}
          <div
            className="flex-1 search-modal-results"
            style={{
              borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.08)',
              borderBottom: isMobile ? '1px solid rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              position: 'relative'
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-2 search-modal-toolbar">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder={t('search.placeholder')}
                    aria-label={t('search.search')}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(30, 30, 29, 0.1)',
                      padding: '12px 56px 12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'transparent',
                      color: 'var(--color-ink, #1E1E1D)',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
                      (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                      (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
                    }}
                    onMouseEnter={(e) => {
                      if (e.target !== document.activeElement) {
                        (e.target as HTMLElement).style.borderColor = 'var(--color-seal, #B42A1E)';
                        (e.target as HTMLElement).style.backgroundColor = 'var(--color-wash-moss, #EFF1ED)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (e.target !== document.activeElement) {
                        (e.target as HTMLElement).style.borderColor = 'rgba(30, 30, 29, 0.1)';
                        (e.target as HTMLElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  />
                  {q && (
                    <button
                      onClick={clearAll}
                      aria-label={t('search.clear')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 10px',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        color: 'var(--color-seal, #B42A1E)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >{t('search.clear')}</button>
                  )}
                </div>
                {/* Mobile-only filter toggle */}
                {isMobile && (
                  <button
                    type="button"
                    className="action-button"
                    aria-expanded={showFilters}
                    onClick={() => setShowFilters(v => !v)}
                  >{t('search.filters')}</button>
                )}
              </div>
            </div>
            {isMobile && showFilters ? (
              <div
                className="search-modal-filters-inline"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  padding: '16px'
                }}
              >
                <Filters />
              </div>
            ) : (
              <div
                className="p-4 overflow-auto"
                style={{ flex: 1, minHeight: 0 }}
              >
                {loading ? (
                  <p>{t('search.loading')}</p>
                ) : error ? (
                  <p>{t('search.error', {message: error})}</p>
                ) : (
                  <div className="space-y-3">
                    {results.map(it => {
                      // Convert SearchIndexItem to the appropriate meta type and render the corresponding card
                      const baseData = {
                        slug: it.slug,
                        title: it.title,
                        date: it.date,
                        tags: it.tags || [],
                        ...(it.summary && { summary: it.summary }),
                        ...(it.cover && { cover: it.cover }),
                        ...(it.lang && { lang: it.lang })
                      };

                      // Intelligent animation suppression: disable for large result sets
                      const suppressAnimations = results.length > 8;
                      const compact = results.length > 12;

                      switch (it.type) {
                        case 'post':
                          return (
                            <PostCard
                              key={it.id}
                              post={baseData as PostMeta}
                              layout="search"
                              compact={compact}
                              suppressAnimations={suppressAnimations}
                            />
                          );
                        case 'note':
                          return (
                            <NoteCard
                              key={it.id}
                              note={baseData as NoteMeta}
                              layout="search"
                              compact={compact}
                              suppressAnimations={suppressAnimations}
                            />
                          );
                        case 'photo':
                          return (
                            <PhotoCard
                              key={it.id}
                              photo={{
                                ...baseData,
                                coverImage: it.cover,
                                caption: it.summary, // Use summary as caption for search
                                location: undefined // We don't have location in search index
                              } as PhotoMeta}
                              layout="search"
                              compact={compact}
                              suppressAnimations={suppressAnimations}
                            />
                          );
                        case 'project':
                          return (
                            <ProjectCard
                              key={it.id}
                              project={{
                                ...baseData,
                                name: it.title,
                                description: it.summary || '',
                                repo: '#', // We don't have repo URL in search index
                                status: undefined // We don't have status in search index
                              } as ProjectMeta}
                              layout="search"
                              compact={compact}
                              suppressAnimations={suppressAnimations}
                            />
                          );
                        default:
                          return null;
                      }
                    })}
                    {results.length === 0 && (
                      <div className="text-center py-8 opacity-70">
                        <p>{t('search.noResults')}</p>
                        <p className="text-sm mt-2">{t('search.tryAdjust')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: filters */}
          <div
            className="p-4 search-modal-filters"
            style={{
              width: isMobile ? '100%' : '320px',
              display: isMobile ? 'none' : 'block',
              height: isMobile ? 'auto' : '100%',
              overflowY: 'auto'
            }}
          >
            <Filters />
          </div>
        </div>
      </div>
    </div>
  );
}
