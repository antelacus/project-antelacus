import { getAllPostsMeta } from '../lib/posts';
import { getAllNotesMeta } from '../lib/notes';
import { getAllPhotosMeta } from '../lib/gallery';
import PostCard from '../components/PostCard';
import NoteCard from '../components/NoteCard';
import PhotoCard from '../components/PhotoCard';
import MasonryGrid from '../components/MasonryGrid';

export default async function HomePage() {
  const [posts, notes, photos] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
  ]);

  // 统一内容流，按时间排序
  const feed = [
    ...posts.map(p => ({
      type: 'post' as const,
      date: p.date,
      slug: p.slug,
      component: <PostCard post={p} />,
    })),
    ...notes.map(n => ({
      type: 'note' as const,
      date: n.date,
      slug: n.slug,
      component: <NoteCard note={n} />,
    })),
    ...photos.map(photo => ({
      type: 'photo' as const,
      date: photo.date,
      slug: photo.slug,
      component: <PhotoCard photo={photo} />,
    })),
  ];

  feed.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="homepage">
      <section className="homepage-hero">
        <div className="hero-content">
          <h1 className="hero-title">欢迎来到 AnteLacus</h1>
          <p className="hero-description">
            这里记录我的思考、创意和生活片段 —— 深度思考、灵光一闪、光影记录，以及精彩的作品展示。
          </p>
        </div>
      </section>
      
      <section className="homepage-feed">
        <MasonryGrid columns={4} gap={20}>
          {feed.map((item, index) => (
            <div key={`${item.type}-${item.slug}`} style={{ animationDelay: `${index * 0.1}s` }}>
              {item.component}
            </div>
          ))}
        </MasonryGrid>
      </section>
    </main>
  );
}
