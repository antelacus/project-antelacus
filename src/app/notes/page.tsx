import { getAllNotesMeta } from '../../lib/notes';
import NoteCard from '../../components/NoteCard';

export const metadata = {
  title: '闪念',
  description: '思维碎片与灵感记录合集。',
};

export default async function NotesPage() {
  const notes = await getAllNotesMeta();
  return (
    <main className="container">
      {notes.length === 0 && <p>暂无内容。</p>}
      {notes.map((note, index) => (
        <div key={note.slug} style={{ animationDelay: `${index * 0.1}s` }}>
          <NoteCard note={note} showType={false} />
        </div>
      ))}
    </main>
  );
} 