import { getPostBySlug } from '../../../lib/posts';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
// Enable LaTeX: remark-math parses $...$ and $$...$$; rehype-katex renders to HTML
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import Image from 'next/image';
import TagList from '../../../components/TagList';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: '文章未找到',
      description: '你访问的文章不存在或已被删除。',
    };
  }
  return {
    title: post.title,
    description: post.summary || '',
    openGraph: {
      title: post.title,
      description: post.summary || '',
      type: 'article',
      url: `https://antelacus.com/posts/${post.slug}`,
      images: post.cover ? [post.cover] : [],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    // Though notFound() is better, we'll keep this custom message for now.
    return (
      <main className="content-container content-container-standard text-center">
        <h1>文章未找到</h1>
        <p>你访问的文章不存在或已被删除。</p>
        <Link href="/posts">返回专栏</Link>
      </main>
    );
  }

  return (
    <div className="content-container content-container-standard">
      <article data-title={post.title}>
        <header>
          <h1>{post.title}</h1>
          <div className="text-sm" style={{ color: 'rgba(29, 29, 27, 0.6)'}}>
            <span>{post.date}</span>
            {post.tags && post.tags.length > 0 && (
              <span className="mx-2">|</span>
            )}
            {post.tags && post.tags.length > 0 && (
              <TagList tags={post.tags} />
            )}
          </div>
        </header>

        {post.cover && (
          <div className="my-8">
            <Image
              src={post.cover}
              alt={post.title}
              width={800}
              height={450}
              className="w-full h-auto"
              priority={true}
            />
          </div>
        )}

        <div className="prose">
          <MDXRemote 
            source={post.content} 
            options={{
              mdxOptions: {
                remarkPlugins: [remarkMath],
                rehypePlugins: [rehypeKatex],
              }
            }}
          />
        </div>

      </article>
    </div>
  );
}
