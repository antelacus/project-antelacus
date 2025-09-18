import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';

interface TagRegistryManifest {
  updatedAt: string;
  tags: { id: string; count: number; types: string[] }[];
}

async function readRegistry(): Promise<TagRegistryManifest | null> {
  try {
    const file = path.join(process.cwd(), 'src/content/tag-registry.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function TagsIndexLocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const registry = await readRegistry();
  const tags = registry?.tags ?? [];
  return (
    <div className="content-container content-container-standard">
      {tags.length === 0 ? (
        <p>暂无标签。</p>
      ) : (
        <div className="content-list">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tags.map(t => (
              <li key={t.id}>
                <Link className="card-link" href={`/${locale}/tags/${encodeURIComponent(t.id)}`}>
                  <div className="card p-3 flex items-center justify-between">
                    <span>#{t.id}</span>
                    <span style={{opacity: 0.7}}>{t.count}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


