import { getAllPostsMeta } from '../lib/posts';
import { getAllNotesMeta } from '../lib/notes';
import { getAllPhotosMeta } from '../lib/gallery';
import { getAllProjectsMeta } from '../lib/projects';
import PostCard from '../components/PostCard';
import NoteCard from '../components/NoteCard';
import PhotoCard from '../components/PhotoCard';
import ProjectCard from '../components/ProjectCard';
import MasonryGrid from '../components/MasonryGrid';

export default async function HomePage() {
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
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
    ...projects.map(project => ({
      type: 'project' as const,
      date: project.date,
      slug: project.slug,
      component: <ProjectCard project={project} />,
    })),
  ];

  feed.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="homepage">
      <section className="homepage-hero">
        <div className="hero-content">
          <h1 className="hero-title">Ante lacus, pax mentis.</h1>
          <p className="hero-description">
            做更好的作品，精益求精。
          </p>
          <div className="hero-highlights">
            <span className="highlight-item">📝 记录想法</span>
            <span className="highlight-item">💡 实践美学</span>
            <span className="highlight-item">🔬 探索技术</span>
          </div>
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
