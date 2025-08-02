"use client";
import NoteCard from './NoteCard';
import { NoteMeta } from '../lib/notes';

interface ClientNoteCardProps {
  note: NoteMeta;
}

/**
 * Client-side wrapper for NoteCard to handle navigation tracking
 * This ensures the onClick handler works in Server Component contexts
 */
export default function ClientNoteCard({ note }: ClientNoteCardProps) {
  return <NoteCard note={note} />;
}