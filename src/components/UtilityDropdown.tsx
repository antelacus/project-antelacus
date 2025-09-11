"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number; // 2, 3, 4
}

export default function UtilityDropdown({
  open,
  onClose,
  onOpenSearch,
  showToc,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  showToc: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Build ToC lazily when opened
  useEffect(() => {
    if (!open || !showToc) return;
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>("article h2, article h3, article h4")
    );
    const items: TocItem[] = [];
    const usedIds = new Map<string, number>();
    const slugify = (s: string) =>
      s
        .toLowerCase()
        .replace(/<[^>]+>/g, "")
        .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    headings.forEach((el) => {
      const level = Number(el.tagName.substring(1));
      const text = (el.textContent || "").trim();
      if (!text) return;
      let id = el.id || slugify(text);
      if (usedIds.has(id)) {
        const n = (usedIds.get(id) || 0) + 1;
        usedIds.set(id, n);
        id = `${id}-${n}`;
      } else {
        usedIds.set(id, 0);
      }
      if (!el.id) el.id = id;
      items.push({ id, text, level });
    });
    setToc(items);
  }, [open, showToc]);

  // Active section highlight
  useEffect(() => {
    if (!open || !showToc) return;
    const onScroll = () => {
      const offsets = toc.map((t) => {
        const el = document.getElementById(t.id);
        if (!el) return { id: t.id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: t.id, top: Math.abs(rect.top - 80) }; // account for header paddings
      });
      offsets.sort((a, b) => a.top - b.top);
      if (offsets.length) setActiveId(offsets[0].id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, showToc, toc]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="功能与目录"
      style={{
        position: "absolute",
        top: "64px",
        right: "16px",
        width: "min(92vw, 380px)",
        maxHeight: "70vh",
        overflow: "auto",
        background: "var(--color-paper)",
        border: "1px solid rgba(30,30,29,0.08)",
        borderRadius: "12px",
        boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
        zIndex: 10000,
        padding: "12px",
        animation: "quietReveal 0.4s cubic-bezier(0.4,0,0.2,1) both",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="搜索"
          style={{
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            cursor: "pointer",
            transition: "all .3s cubic-bezier(0.4,0,0.2,1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-wash-moss)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          <img 
            src="/images/common/search.svg" 
            alt="搜索" 
            width={16} 
            height={16} 
            style={{ 
              display: 'block',
              border: 'none',
              padding: '0',
              borderRadius: '0'
            }}
          />
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="语言切换（即将推出）"
          title="语言切换（即将推出）"
          style={{
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            cursor: "not-allowed",
          }}
        >
          <img 
            src="/images/common/globe.svg" 
            alt="语言切换" 
            width={16} 
            height={16} 
            style={{ 
              display: 'block',
              border: 'none',
              padding: '0',
              borderRadius: '0',
              opacity: '0.4'
            }}
          />
        </button>
      </div>

      {showToc && toc.length > 0 && (
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(30,30,29,0.08)" }}>
          <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "6px" }}>文章目录</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {toc.map((t) => (
              <li key={t.id} style={{ margin: "4px 0" }}>
                <a
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(t.id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    onClose();
                  }}
                  style={{
                    display: "block",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    paddingLeft: `${(t.level - 2) * 16}px`,
                    background: activeId === t.id ? "var(--color-wash-moss)" : "transparent",
                    color: activeId === t.id ? "var(--color-ink)" : "inherit",
                    border: activeId === t.id ? "1px solid var(--color-seal)" : "1px solid transparent",
                    transition: "all .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-wash-moss)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = activeId === t.id ? "var(--color-wash-moss)" : "transparent";
                  }}
                >
                  {t.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


