import { getAllPostsMeta } from '../lib/posts';
import { getAllNotesMeta } from '../lib/notes';
import { getAllPhotosMeta } from '../lib/gallery';
import { getAllProjectsMeta } from '../lib/projects';
import ClientPostCard from '../components/ClientPostCard';
import ClientNoteCard from '../components/ClientNoteCard';
import ClientPhotoCard from '../components/ClientPhotoCard';
import ClientProjectCard from '../components/ClientProjectCard';
import type { Metadata } from 'next';

// 主页metadata配置
export const metadata: Metadata = {
  title: 'Ante Lacus, Pax Mentis',
  description: 'Ante Lacus, Pax Mentis',
  keywords: [
    'AnteLacus',
    '个人博客',
    '技术博客',
    '学习笔记',
    '项目展示',
    '创意空间',
    '设计思考',
    '技术分享'
  ],
  authors: [{ name: 'AnteLacus' }],
  creator: 'AnteLacus',
  publisher: 'AnteLacus',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://antelacus.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ante Lacus, Pax Mentis',
    description: 'Ante Lacus, Pax Mentis',
    url: 'https://antelacus.com',
    siteName: 'AnteLacus',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Ante Lacus, Pax Mentis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ante Lacus, Pax Mentis',
    description: 'Ante Lacus, Pax Mentis',
    images: ['/images/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


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
              <ClientPostCard post={post} />
            </div>
          ))}
        </section>

        {/* 几块奇石 (The Scholar's Rocks) */}
        <section className="scholars-rocks">
          {featuredNotes.map((note) => (
            <div key={note.slug} className="scholar-rock">
              <ClientNoteCard note={note} />
            </div>
          ))}
        </section>

        {/* 一池锦鲤 & 一座亭台 (The Koi Pond & The Pavilion) */}
        <section className="secondary-features">
          {featuredPhoto && (
            <div className="koi-pond">
              <ClientPhotoCard photo={featuredPhoto} />
            </div>
          )}

          {featuredProject && (
            <div className="pavilion">
              <ClientProjectCard project={featuredProject} />
            </div>
          )}
        </section>
      </main>


    </div>
  );
}
