"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';

export default function NoteCard({ note }: { note: NoteMeta }) {
  // 截断summary，确保显示"未完整"的感觉
  const truncateSummary = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '');
  };

  const displaySummary = note.summary ? truncateSummary(note.summary) : '';

  return (
    <article className="card masonry-item note-card">
      <div className="card-content">
        <div className="card-meta">
          <span className="card-type">灵光一闪</span>
          <time className="card-date">
            {new Date(note.date).toLocaleDateString('zh-CN')}
          </time>
        </div>
        <h2 className="card-title">
          <Link href={`/notes/${note.slug}`} className="card-title-link">
            {note.title}
          </Link>
        </h2>
        {note.summary && (
          <div className="note-preview">
            <p className="card-summary">
              {displaySummary}
              {note.summary.length > 80 && <span className="ellipsis">...</span>}
            </p>
            <div className="read-more-hint">
              <Link href={`/notes/${note.slug}`} className="read-more-link">
                <span>阅读完整内容</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        )}
        <div className="card-author">
          <span>AnteLacus</span>
        </div>
      </div>
    </article>
  );
} 