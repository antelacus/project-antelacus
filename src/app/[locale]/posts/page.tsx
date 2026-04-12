import { getAllPostsMeta } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import { getMetaMessage, languageAlternates, canonicalFor } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: await getMetaMessage(locale, 'meta.posts_title'),
    description: await getMetaMessage(locale, 'meta.posts_description'),
    alternates: {
      canonical: canonicalFor(locale, '/posts'),
      languages: languageAlternates('/posts'),
    },
  };
}

export default async function PostsPage({ params }: { params: Promise<{ locale: string }> }) {
  await params;
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

