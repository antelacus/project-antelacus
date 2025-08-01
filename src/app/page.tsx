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

  // A unified content stream, sorted by date.
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
    <main className="content-container content-container-wide">
      <MasonryGrid columns={3} gap={32}>
        {feed.map((item, index) => (
          <div key={`${item.type}-${item.slug}`}>
            {item.component}
          </div>
        ))}
      </MasonryGrid>
    </main>
  );
}
