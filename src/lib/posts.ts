import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

export interface PostMeta {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	cover?: string;
	summary?: string;
	lang?: string;
}

export interface Post extends PostMeta {
	content: string;
}

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

// 缓存所有文章元数据，缓存1小时（单一规范稿件，不做按语言区分）
const getAllPostsMetaUncached = async (): Promise<PostMeta[]> => {
	const files = await fs.readdir(POSTS_DIR);
	const posts: PostMeta[] = [];
	for (const file of files) {
		if (!file.endsWith('.mdx')) continue;
		// 仅纳入规范文件：不含语言后缀的 {slug}.mdx
		if (/\.[a-z]{2}(?:-[A-Z]{2})?\.mdx$/.test(file)) continue;
		const slug = file.replace(/\.mdx$/, '');
		const filePath = path.join(POSTS_DIR, file);
		const source = await fs.readFile(filePath, 'utf-8');
		const { data } = matter(source);
		posts.push({
			slug,
			title: data.title,
			date: data.date,
			tags: data.tags || [],
			cover: data.cover,
			summary: data.summary,
			lang: data.lang,
		});
	}
	// 按日期倒序排列
	posts.sort((a, b) => b.date.localeCompare(a.date));
	return posts;
};

export const getAllPostsMeta = () =>
	unstable_cache(
		() => getAllPostsMetaUncached(),
		['posts-meta', 'default'],
		{
			revalidate: 3600, // 1小时缓存
			tags: ['posts']
		}
	)();

// 解析规范文章文件（仅 {slug}.mdx）
function resolvePostFile(slug: string): string | null {
	const canonical = path.join(POSTS_DIR, `${slug}.mdx`);
	return canonical;
}

// 缓存单个文章数据，缓存2小时（单一规范稿件）
const getPostBySlugUncached = async (slug: string): Promise<Post | null> => {
	const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
	try {
		await fs.access(filePath);
	} catch {
		return null;
	}
	try {
		const source = await fs.readFile(filePath, 'utf-8');
		const { data, content } = matter(source);
		return {
			slug,
			title: data.title,
			date: data.date,
			tags: data.tags || [],
			cover: data.cover,
			summary: data.summary,
			lang: data.lang,
			content,
		};
	} catch {
		return null;
	}
};

export const getPostBySlug = (slug: string) =>
	cache(
		unstable_cache(
			() => getPostBySlugUncached(slug),
			['post', slug],
			{
				revalidate: 7200, // 2小时缓存
				tags: ['posts']
			}
		)
	)();