import { getAllPostsMeta } from '../lib/posts';
import { getAllNotesMeta } from '../lib/notes';
import { getAllPhotosMeta } from '../lib/gallery';
import PostCard from '../components/PostCard';
import NoteCard from '../components/NoteCard';
import PhotoCard from '../components/PhotoCard';

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
      component: <PostCard key={`post-${p.slug}`} post={p} />,
    })),
    ...notes.map(n => ({
      type: 'note' as const,
      date: n.date,
      component: <NoteCard key={`note-${n.slug}`} note={n} />,
    })),
    ...photos.map(photo => ({
      type: 'photo' as const,
      date: photo.date,
      component: <PhotoCard key={`photo-${photo.slug}`} photo={photo} />,
    })),
  ];

  feed.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="homepage">
      <section className="homepage-hero">
        <div className="hero-content">
          <h1 className="hero-title">欢迎来到 AnteLacus</h1>
          <p className="hero-description">
            这里记录我的思考、创意和生活片段 —— 长内容、灵感速记、照片分享，以及正在进行的项目。
          </p>
        </div>
      </section>
      
      <section className="homepage-feed">
        <div className="masonry">
          {feed.map(item => item.component)}
        </div>
      </section>
    </main>
  );
}
