"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';
import { useState, useEffect } from 'react';

interface NoteCardProps {
  note: NoteMeta;
}

export default function NoteCard({ note }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [naturalTilt, setNaturalTilt] = useState('');
  const [inkVariant, setInkVariant] = useState('');

  // Qi Enhancement: Natural Spontaneity - generate subtle randomness
  useEffect(() => {
    const tiltVariants = ['natural-tilt-1', 'natural-tilt-2', 'natural-tilt-3', 'natural-tilt-4', 'natural-tilt-5'];
    const inkVariants = ['ink-variant-1', 'ink-variant-2', 'ink-variant-3', 'ink-variant-4', 'ink-variant-5'];
    
    setNaturalTilt(tiltVariants[Math.floor(Math.random() * tiltVariants.length)]);
    setInkVariant(inkVariants[Math.floor(Math.random() * inkVariants.length)]);
  }, []);

  const truncateSummary = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trimEnd() + '...';
  };

  const displaySummary = note.summary ? truncateSummary(note.summary) : '';

  return (
    <Link 
      href={`/notes/${note.slug}`} 
      className={`block p-4 rounded-md card-organic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B42A1E] ${naturalTilt}`}
      style={{ 
        backgroundColor: isHovered ? 'var(--color-wash-stone)' : 'var(--color-paper)',
        transform: isHovered 
          ? 'translateY(-3px) scale(1.01)' 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 8px 25px rgba(29, 29, 27, 0.12), 0 4px 10px rgba(29, 29, 27, 0.06)' 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`查看思维闪念：${note.title}`}
      prefetch={true}
    >
      <article>
        <header>
          <h2 
            className={`text-xl font-normal mb-1 card-title ${inkVariant}`}
            style={{
              color: isHovered ? 'var(--color-ink)' : 'rgba(30, 30, 29, 0.85)',
              transition: 'color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: isHovered ? '0.1s' : '0s',
            }}
          >
            {note.title}
          </h2>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            {note.date}
          </div>
        </header>
        {displaySummary && (
          <p className="mt-2 text-sm" style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{displaySummary}</p>
        )}
        <footer 
          className="mt-3"
          style={{ 
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {note.tags?.map(tag => (
            <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
          ))}
        </footer>
      </article>
    </Link>
  );
}
