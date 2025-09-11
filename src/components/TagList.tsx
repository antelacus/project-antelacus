"use client";
import React from 'react';

export default function TagList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;

  const openSearchWithTag = (tag: string) => {
    const event = new CustomEvent('open-search', {
      detail: { tags: [tag], type: 'all' }, // type not filtered per requirement
    });
    window.dispatchEvent(event);
  };

  return (
    <span>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => openSearchWithTag(tag)}
          aria-label={`按标签 ${tag} 搜索`}
          style={{
            fontSize: '12px',
            padding: '2px 6px',
            border: 'none',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
            marginRight: '6px',
            color: 'rgba(29,29,27,0.7)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-seal)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(29,29,27,0.7)'; }}
        >
          #{tag}
        </button>
      ))}
    </span>
  );
}


