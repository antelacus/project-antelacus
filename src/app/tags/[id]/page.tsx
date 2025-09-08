import { getContentByTag } from '../../../lib/tags';
import PostCard from '../../../components/PostCard';
import NoteCard from '../../../components/NoteCard';
import PhotoCard from '../../../components/PhotoCard';
import ProjectCard from '../../../components/ProjectCard';

interface Props { params: { id: string } }

export function generateMetadata({ params }: Props) {
  const tag = params.id;
  return {
    title: `#${tag} 标签`,
    description: `与标签 #${tag} 相关的内容`,
  };
}

export default async function TagDetailPage({ params }: Props) {
  const tag = decodeURIComponent(params.id);
  const items = await getContentByTag(tag);

  return (
    <div className="content-container content-container-standard">
      <h1 className="text-xl mb-4">#{tag}</h1>
      {items.length === 0 && <p>暂无内容。</p>}
      <div className="content-list">
        {items.map((item, index) => (
          <div key={`${item.type}:${item.slug}`} className="content-item" style={{ animationDelay: `${index * 0.1}s` }}>
            {item.type === 'post' && <PostCard post={item as any} layout="horizontal" />}
            {item.type === 'note' && <NoteCard note={item as any} />}
            {item.type === 'photo' && <PhotoCard photo={item as any} />}
            {item.type === 'project' && <ProjectCard project={item as any} />}
          </div>
        ))}
      </div>
    </div>
  );
}


