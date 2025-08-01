"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';
import { useState } from 'react';

interface NoteCardProps {
  note: NoteMeta;
}

export default function NoteCard({ note }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const truncateSummary = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trimEnd() + '...';
  };

  const displaySummary = note.summary ? truncateSummary(note.summary) : '';

  return (
    <Link 
      href={`/notes/${note.slug}`} 
      className="block p-4 rounded-md transition-colors duration-300"
      style={{ backgroundColor: isHovered ? 'var(--color-wash-stone)' : 'transparent' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      prefetch={true}
    >
      <article>
        <header>
          <h2 className="text-xl font-normal mb-1">{note.title}</h2>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            {note.date}
          </div>
        </header>
        {displaySummary && (
          <p className="mt-2 text-sm" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{displaySummary}</p>
        )}
        <footer 
          className="mt-3 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          {note.tags?.map(tag => (
            <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
          ))}
        </footer>
      </article>
    </Link>
  );
}
