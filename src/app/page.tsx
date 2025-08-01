import Link from 'next/link';
import { getAllPostsMeta } from '../lib/posts';
import { getAllNotesMeta } from '../lib/notes';
import { getAllPhotosMeta } from '../lib/gallery';
import { getAllProjectsMeta } from '../lib/projects';
import PostCard from '../components/PostCard';
import NoteCard from '../components/NoteCard';
import PhotoCard from '../components/PhotoCard';
import ProjectCard from '../components/ProjectCard';

export default async function HomePage() {
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);

  // Curated garden views - select the most representative pieces
  const featuredPosts = posts.slice(0, 2); // Two recent posts as the "mountain range"
  const featuredNotes = notes.slice(0, 2); // Two "scholar's rocks"
  const featuredPhoto = photos.length > 0 ? photos[0] : null; // The "koi pond"
  const featuredProject = projects.length > 0 ? projects[0] : null; // The "pavilion"

  return (
    <div className="garden-entrance">
      {/* 园名匾额 (The Name Plaque) */}
      <header className="garden-plaque">
        <h1 className="garden-name">antelacus.com</h1>
        <div className="garden-seal">■</div>
        <p className="garden-motto">Ante Lacus, Pax Mentis</p>
      </header>

      {/* 框景布局 (Framed Views) */}
      <main className="framed-views">
        {/* 山峦叠嶂 (The Mountain Range) */}
        <section className="mountain-range">
          {featuredPosts.map((post, index) => (
            <div 
              key={post.slug} 
              className="mountain-peak"
              style={{ '--peak-index': index } as React.CSSProperties}
            >
              <PostCard post={post} />
            </div>
          ))}
        </section>

        {/* 几块奇石 (The Scholar's Rocks) */}
        <section className="scholars-rocks">
          {featuredNotes.map((note) => (
            <div key={note.slug} className="scholar-rock">
              <NoteCard note={note} />
            </div>
          ))}
        </section>

        {/* 一池锦鲤 & 一座亭台 (The Koi Pond & The Pavilion) */}
        <section className="secondary-features">
          {featuredPhoto && (
            <div className="koi-pond">
              <PhotoCard photo={featuredPhoto} />
            </div>
          )}

          {featuredProject && (
            <div className="pavilion">
              <ProjectCard project={featuredProject} />
            </div>
          )}
        </section>
      </main>

      {/* 游廊引路 (Pathway Invitations) */}
      <nav className="garden-pathways">
        <Link href="/posts" className="pathway-link">观所有文章 →</Link>
        <Link href="/notes" className="pathway-link">览全部闪念 →</Link>
        <Link href="/gallery" className="pathway-link">赏所有视觉 →</Link>
        <Link href="/projects" className="pathway-link">探所有实验 →</Link>
      </nav>
    </div>
  );
}
