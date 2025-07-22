"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';

export default function NoteCard({ note }: { note: NoteMeta }) {
  const showCover = note.cover && note.cover.trim() !== '';

  return (
    <article className="card masonry-item">
      {showCover && (
        <div className="card-cover">
          <img 
            src={note.cover} 
            alt={note.title} 
            className="card-cover-image"
            onError={(e) => {
              const coverDiv = e.currentTarget.parentElement;
              if (coverDiv) {
                coverDiv.style.display = 'none';
              }
            }}
          />
        </div>
      )}
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
          <p className="card-summary">{note.summary}</p>
        )}
        <div className="card-author">
          <span>AnteLacus</span>
        </div>
      </div>
    </article>
  );
} 