import { getAllNotesMeta } from '@/lib/notes';
import NoteCard from '@/components/NoteCard';

export const metadata = {
  title: '闪念',
  description: '思维碎片与灵感记录合集。',
};

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

