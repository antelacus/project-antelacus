import { getContentByTag } from '@/lib/tags';
import { setRequestLocale } from 'next-intl/server';
import PostCard from '@/components/PostCard';
import NoteCard from '@/components/NoteCard';
import PhotoCard from '@/components/PhotoCard';
import ProjectCard from '@/components/ProjectCard';
import type { PostMeta } from '@/lib/posts';
import type { NoteMeta } from '@/lib/notes';
import type { PhotoMeta } from '@/lib/gallery';
import type { ProjectMeta } from '@/lib/projects';

type RouteParams = Promise<{ locale: string; id: string }>; // Align with Next.js PageProps typing

export async function generateMetadata({ params }: { params: RouteParams }) {
  const { id } = await params;
  const tag = id;
  return {
    title: `#${tag} 标签`,
    description: `与标签 #${tag} 相关的内容`,
  };
}

export default async function TagDetailLocalePage({ params }: { params: RouteParams }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tag = decodeURIComponent(id);
  const items = await getContentByTag(tag);

  return (
    <div className="content-container content-container-standard">
      <h1 className="text-xl mb-4">#{tag}</h1>
      {items.length === 0 && <p>暂无内容。</p>}
      <div className="content-list">
        {items.map((item, index) => (
          <div key={`${item.type}:${item.slug}`} className="content-item" style={{ animationDelay: `${index * 0.1}s` }}>
            {item.type === 'post' && <PostCard post={item as unknown as PostMeta} layout="horizontal" />}
            {item.type === 'note' && <NoteCard note={item as unknown as NoteMeta} />}
            {item.type === 'photo' && <PhotoCard photo={item as unknown as PhotoMeta} />}
            {item.type === 'project' && <ProjectCard project={item as unknown as ProjectMeta} />}
          </div>
        ))}
      </div>
    </div>
  );
}


