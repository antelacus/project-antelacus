import { getAllProjectsMeta } from '../../lib/projects';
import ProjectCard from '../../components/ProjectCard';

export const metadata = {
  title: '实验室',
  description: '技术实验与创意项目展示。',
};

export default async function ProjectsPage() {
  const projects = await getAllProjectsMeta();
  return (
    <div className="container">
      {projects.length === 0 && <p>暂无项目。</p>}
      {projects.map((project, index) => (
        <div key={project.slug} style={{ animationDelay: `${index * 0.1}s` }}>
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
} 