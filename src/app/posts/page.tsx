import { getAllPostsMeta } from '../../lib/posts';
import PostListCard from '../../components/PostListCard';

export const metadata = {
  title: '专栏',
  description: '深度文章与专题分析合集。',
};

export default async function PostsPage() {
  const posts = await getAllPostsMeta();
  return (
    <div className="container">
      {posts.length === 0 && <p>暂无内容。</p>}
      {posts.map((post, index) => (
        <div key={post.slug} style={{ animationDelay: `${index * 0.1}s` }}>
          <PostListCard post={post} />
        </div>
      ))}
    </div>
  );
} 