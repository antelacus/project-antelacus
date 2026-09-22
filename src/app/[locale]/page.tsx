import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getAllPostsMeta } from '@/lib/posts';
import { getAllNotesMeta } from '@/lib/notes';
import { getAllPhotosMeta } from '@/lib/gallery';
import { getAllProjectsMeta } from '@/lib/projects';
import PostCard from '@/components/PostCard';
import NoteCard from '@/components/NoteCard';
import PhotoCard from '@/components/PhotoCard';
import ProjectCard from '@/components/ProjectCard';

export const metadata: Metadata = {
  title: { absolute: 'Ante Lacus, Pax Mentis' },
  description: 'Ante Lacus, Pax Mentis',
};

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [posts, notes, photos, projects] = await Promise.all([
    getAllPostsMeta(),
    getAllNotesMeta(),
    getAllPhotosMeta(),
    getAllProjectsMeta(),
  ]);

  const featuredPosts = posts.slice(0, 2);
  const featuredNotes = notes.slice(0, 2);
  const featuredPhoto = photos.length > 0 ? photos[0] : null;
  const featuredProject = projects.length > 0 ? projects[0] : null;

  return (
    <div className="garden-entrance">
      <header className="garden-plaque">
        <h1 className="garden-name">
          {"AnteLacus".split('').map((letter, index) => (
            <span
              key={index}
              className="garden-name-letter"
              style={{ '--letter-index': index } as React.CSSProperties}
            >
              {letter}
            </span>
          ))}
        </h1>
        <div className="garden-seal">■</div>
        <p className="garden-motto">Ante Lacus, Pax Mentis</p>
      </header>

      <div className="framed-views">
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

        <section className="scholars-rocks">
          {featuredNotes.map((note) => (
            <div key={note.slug} className="scholar-rock">
              <NoteCard note={note} />
            </div>
          ))}
        </section>

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
      </div>
    </div>
  );
}

