"use client";
import Link from 'next/link';
import { NoteMeta } from '../lib/notes';
import { useState, useEffect } from 'react';
import { useLocalePrefix } from '@/i18n/use-locale-prefix';

interface NoteCardProps {
  note: NoteMeta;
  layout?: 'vertical' | 'search';
  compact?: boolean;
  suppressAnimations?: boolean;
}

export default function NoteCard({ note, layout = 'vertical', compact = false, suppressAnimations = false }: NoteCardProps) {
  const prefix = useLocalePrefix();
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

  const isSearch = layout === 'search';
  
  const truncateSummary = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trimEnd() + '...';
  };

  // Adjust max length based on layout
  const maxSummaryLength = isSearch ? 60 : 80;
  const displaySummary = note.summary ? truncateSummary(note.summary, maxSummaryLength) : '';

  return (
    <Link 
      href={`${prefix}/notes/${note.slug}`} 
      className={`${isSearch ? 'card-link card-organic' : 'block p-4 rounded-md card-organic focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B42A1E]'} ${naturalTilt}`}
      onClick={() => {
        // Only set navigatedFromHome flag when clicking from homepage
        if (window.location.pathname === '/') {
          sessionStorage.setItem('navigatedFromHome', 'true');
        }
      }}
      style={{ 
        backgroundColor: isHovered ? 'var(--color-wash-moss)' : 'var(--color-paper)',
        transform: isHovered 
          ? `translateY(${isSearch ? '-1px' : '-3px'}) scale(${isSearch ? '1.005' : '1.01'})` 
          : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 ${isSearch ? '4px 15px' : '8px 25px'} rgba(29, 29, 27, 0.12), 0 ${isSearch ? '2px 6px' : '4px 10px'} rgba(29, 29, 27, 0.06)` 
          : '0 0 0 rgba(29, 29, 27, 0)',
        transition: suppressAnimations ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`查看思维闪念：${note.title}`}
      prefetch={true}
    >
      <article className={isSearch ? 'card note-search-card' : ''}>
        <header>
          <h2 
            className={`${isSearch ? 'text-lg' : 'text-xl'} font-normal mb-1 card-title ${inkVariant}`}
            style={{
              color: isHovered ? 'var(--color-ink)' : 'rgba(30, 30, 29, 0.85)',
              transition: suppressAnimations ? 'none' : `color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${isHovered ? '0.1s' : '0s'}`,
            }}
          >
            {note.title}
          </h2>
          <div className={`${isSearch ? 'text-xs' : 'text-sm'}`} style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            {isSearch ? 'note · ' : ''}{note.date}
            {note.lang && (
              <>
                <span className="mx-2">|</span>
                <span>{note.lang}</span>
              </>
            )}
          </div>
        </header>
        {displaySummary && (
          <p className={`mt-2 ${isSearch ? 'text-xs' : 'text-sm'} ${isSearch ? 'line-clamp-2' : ''}`} style={{ color: 'rgba(29, 29, 27, 0.8)'}}>{displaySummary}</p>
        )}
        {note.tags && note.tags.length > 0 && (
          <footer 
            className={isSearch ? "mt-1" : "mt-3"}
            style={{ 
              opacity: suppressAnimations || isHovered ? 1 : (compact ? 1 : 0),
              transform: suppressAnimations || isHovered ? 'translateY(0)' : (compact ? 'translateY(0)' : 'translateY(4px)'),
              transition: suppressAnimations ? 'none' : 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {note.tags.map(tag => (
              <span key={tag} className="text-xs mr-2" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>#{tag}</span>
            ))}
          </footer>
        )}
      </article>
    </Link>
  );
}
