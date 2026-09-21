import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';

import { getTagSummaries } from '@/lib/tags';

export default async function TagsIndexLocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tags = await getTagSummaries();

  return (
    <div className="content-container content-container-standard">
      {tags.length === 0 ? (
        <p>暂无标签。</p>
      ) : (
        <div className="content-list">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link className="card-link" href={`/${locale}/tags/${encodeURIComponent(tag.id)}`}>
                  <div className="card p-3 flex items-center justify-between">
                    <span>#{tag.id}</span>
                    <span style={{ opacity: 0.7 }}>{tag.count}</span>
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
