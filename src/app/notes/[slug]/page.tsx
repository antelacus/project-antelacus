import { getNoteBySlug } from '../../../lib/notes';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import TagList from '../../../components/TagList';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) {
    return { title: '笔记未找到' };
  }
  return { title: note.title, description: note.summary || '' };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    return (
      <main className="content-container content-container-standard text-center">
        <h1>笔记未找到</h1>
        <p>你访问的笔记不存在或已被删除。</p>
        <Link href="../">返回闪念</Link>
      </main>
    );
  }

  return (
    <div className="content-container content-container-standard">
      <article data-title={note.title}>
        <header>
          <h1>{note.title}</h1>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            <span>{note.date}</span>
            {note.tags && note.tags.length > 0 && (
              <>
                <span className="mx-2">|</span>
                <TagList tags={note.tags} />
              </>
            )}
          </div>
        </header>
        
        <div className="prose mt-8">
          <MDXRemote source={note.content} />
        </div>
        
      </article>
    </div>
  );
}
