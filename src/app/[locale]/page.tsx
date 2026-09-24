import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import Gate from '@/components/Gate';
import Window from '@/components/Window';
import { fromNote, fromPhoto, fromPost, fromProject } from '@/lib/entry';
import { getAllPhotosMeta } from '@/lib/gallery';
import { selectWindows } from '@/lib/home';
import { getAllNotesMeta } from '@/lib/notes';
import { getAllPostsMeta } from '@/lib/posts';
import { getAllProjectsMeta } from '@/lib/projects';

export const metadata: Metadata = {
  title: { absolute: 'Ante Lacus, Pax Mentis' },
  description: 'Ante Lacus, Pax Mentis',
};

// The gate, then the framed view: the newest album as the large window, the newest post, note and
// project beside it (docs/aesthetic-thesis.md, 五「首页」).
export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [posts, notes, photos, projects] = await Promise.all([getAllPostsMeta(), getAllNotesMeta(), getAllPhotosMeta(), getAllProjectsMeta()]);
  const windows = selectWindows({ post: posts.map(fromPost), note: notes.map(fromNote), gallery: photos.map(fromPhoto), project: projects.map(fromProject) });
  const photo = windows.find((w) => w.type === 'gallery');
  const others = windows.filter((w) => w !== photo);

  return (
    <div className="page">
      <Gate />
      <div className={photo ? 'windows' : 'windows windows-text-only'}>
        {photo && <Window window={photo} />}
        {others.length > 0 && (
          <div className="windows-side">
            {others.map((w) => <Window key={w.type} window={w} />)}
          </div>
        )}
      </div>
    </div>
  );
}
