import { getAllProjectsMeta } from '../../lib/projects';
import Link from 'next/link';

export const metadata = {
  title: '作品展示',
  description: '个人开源项目展示。',
};

export default async function ProjectsPage() {
  const projects = await getAllProjectsMeta();
  return (
    <main>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.2rem' }}>作品展示</h1>
      {projects.length === 0 && <p>暂无项目。</p>}
      {projects.map(p => (
        <article className="card" key={p.slug} style={{ marginBottom: '1.2rem' }}>
          <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.4rem' }}>{p.name}</h2>
          <div style={{ color: 'var(--color-secondary)', fontSize: '0.95rem', marginBottom: '0.6rem' }}>{p.description}</div>
          <div style={{ marginBottom: '0.6rem' }}>
            <a href={p.repo} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
              GitHub 仓库 ↗
            </a>
          </div>
          {p.tags && p.tags.map(tag => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </article>
      ))}
    </main>
  );
} 