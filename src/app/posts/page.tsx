import { getAllPostsMeta } from '../../lib/posts';
import PostCard from '../../components/PostCard';

export const metadata = {
  title: '专栏',
  description: '深度文章与专题分析合集。',
};

export default async function PostsPage() {
  const posts = await getAllPostsMeta();
  return (
    <div className="content-container content-container-standard">
      {posts.length === 0 && <p>暂无内容。</p>}
      <div className="content-list">
        {posts.map((post, index) => (
          <div key={post.slug} className="content-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <PostCard post={post} layout="horizontal" />
          </div>
        ))}
      </div>
    </div>
  );
} 