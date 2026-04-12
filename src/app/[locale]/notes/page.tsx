import { getAllNotesMeta } from '@/lib/notes';
import NoteCard from '@/components/NoteCard';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.notes_title'),
    description: await getMetaMessage(locale, 'meta.notes_description'),
    alternates: {
      canonical: canonicalFor(locale, '/notes'),
      languages: languageAlternates('/notes'),
    },
  };
}

export default async function NotesPage() {
  const notes = await getAllNotesMeta();
  return (
    <div className="content-container content-container-standard">
      {notes.length === 0 && <p>暂无内容。</p>}
      <div className="content-list">
        {notes.map((note, index) => (
          <div key={note.slug} className="content-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <NoteCard note={note} />
          </div>
        ))}
      </div>
    </div>
  );
}

