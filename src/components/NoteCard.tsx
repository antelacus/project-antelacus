"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';

interface NoteCardProps {
  note: NoteMeta;
  showType?: boolean;   // 是否显示类别标识（首页显示，专门页面不显示）
}

export default function NoteCard({ note, showType = true }: NoteCardProps) {
  // 截断summary，确保显示"未完整"的感觉
  const truncateSummary = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '');
  };

  const displaySummary = note.summary ? truncateSummary(note.summary) : '';

  return (
    <Link href={`/notes/${note.slug}`} className="card-link">
      <article className="card masonry-item note-card">
        <div className="card-content">
          <div className="card-meta">
            {showType && <span className="card-type">闪念</span>}
            <time className="card-date">
              {note.date}
            </time>
          </div>
          <h2 className="card-title">
            {note.title}
          </h2>
          {note.summary && (
            <p className="card-summary">
              {displaySummary}
              {note.summary.length > 80 && <span className="ellipsis">...</span>}
            </p>
          )}
          {note.tags && note.tags.length > 0 && (
            <div className="card-tags">
              {note.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
} 