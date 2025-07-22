"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';

export default function NoteCard({ note }: { note: NoteMeta }) {
  if (note.type === 'tweet' && note.tweetId) {
    return (
      <article className="card masonry-item note-card tweet-card">
        <div className="tweet-header">
          <div className="tweet-icon">🐦</div>
          <span className="tweet-label">来自 X</span>
        </div>
        <div className="tweet-content">
          <p className="tweet-text">
            {note.summary || '查看原始推文内容'}
          </p>
          <a 
            href={`https://x.com/i/web/status/${note.tweetId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="tweet-link"
          >
            查看原始推文 ↗
          </a>
        </div>
        <time className="note-date">
          {new Date(note.date).toLocaleDateString('zh-CN')}
        </time>
      </article>
    );
  }

  return (
    <article className="card masonry-item note-card">
      <div className="note-content">
        <div className="note-meta">
          <span className="note-type">灵感速记</span>
          <time className="note-date">
            {new Date(note.date).toLocaleDateString('zh-CN')}
          </time>
        </div>
        <h2 className="note-title">
          <Link href={`/notes/${note.slug}`} className="note-title-link">
            {note.title}
          </Link>
        </h2>
        {note.summary && (
          <p className="note-summary">{note.summary}</p>
        )}
      </div>
    </article>
  );
} 