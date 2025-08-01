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
      className="block p-4 rounded-md transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B42A1E]"
      style={{ 
        backgroundColor: isHovered ? 'var(--color-wash-stone)' : 'transparent',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(29, 29, 27, 0.08)' : '0 0 0 rgba(29, 29, 27, 0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`查看思维闪念：${note.title}`}
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
