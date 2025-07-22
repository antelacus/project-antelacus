import { getAllNotesMeta } from '../../lib/notes';
import Link from 'next/link';

export const metadata = {
  title: '灵光一闪',
  description: '短内容与同步 X 帖子合集。',
};

// 复用首页的截断逻辑
const truncateSummary = (text: string, maxLength: number = 80) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '');
};

export default async function NotesPage() {
  const notes = await getAllNotesMeta();
  return (
    <main>
      {notes.length === 0 && <p>暂无内容。</p>}
      {notes.map(note => {
        const displaySummary = note.summary ? truncateSummary(note.summary) : '';
        
        return (
          <article className="card note-card" key={note.slug} style={{ marginBottom: '1rem' }}>
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
                <div className="note-preview">
                  <p className="card-summary">
                    {displaySummary}
                    {note.summary.length > 80 && <span className="ellipsis">...</span>}
                  </p>
                  <div className="read-more-hint">
                    <Link href={`/notes/${note.slug}`} className="read-more-link">
                      <span>阅读完整内容</span>
                      <span className="arrow">→</span>
                    </Link>
                  </div>
                </div>
              )}
              <div className="card-author">
                <span>AnteLacus</span>
              </div>
            </div>
          </article>
        );
      })}
    </main>
  );
} 