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

// 缓存所有文章元数据，缓存1小时（支持可选 locale，用于未来多语言标题/摘要覆盖）
const getAllPostsMetaUncached = async (locale?: string): Promise<PostMeta[]> => {
	const files = await fs.readdir(POSTS_DIR);
	const baseMd: Record<string, string> = {};
	const localizedMd: Record<string, string> = {};

	for (const file of files) {
		if (!file.endsWith('.mdx')) continue;
		const match = file.match(/^(.*?)(?:\.([a-z]{2}(?:-[A-Z]{2})?))?\.mdx$/);
		if (!match) continue;
		const slug = match[1];
		const loc = match[2];
		if (loc) {
			localizedMd[`${slug}.${loc}`] = file;
		} else {
			baseMd[slug] = file;
		}
	}

	const posts: PostMeta[] = [];
	const slugs = Object.keys(baseMd);
	for (const slug of slugs) {
		// Try localized file first
		const tryLocales = [locale].filter(Boolean) as string[];
		const localizedFile = tryLocales.length ? localizedMd[`${slug}.${tryLocales[0]}`] : undefined;
		const filename = localizedFile || baseMd[slug];
		const filePath = path.join(POSTS_DIR, filename);
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

export const getAllPostsMeta = (locale?: string) =>
	unstable_cache(
		() => getAllPostsMetaUncached(locale),
		['posts-meta', locale || 'default'],
		{
			revalidate: 3600, // 1小时缓存
			tags: ['posts']
		}
	)();

// 将任意 locale 归并为可用的具体文件名（若无则回退 zh-CN，再回退默认）
function resolvePostFile(slug: string, locale?: string): string {
	const candidates: string[] = [];
	if (locale) {
		candidates.push(`${slug}.${locale}.mdx`);
	}
	// 优先中文简体作为缺省内容
	candidates.push(`${slug}.zh-CN.mdx`);
	// 基础稿（视为 zh-CN）
	candidates.push(`${slug}.mdx`);
	return candidates.find(() => false) as string; // placeholder, real logic below
}

// 缓存单个文章数据，缓存2小时（支持 locale 覆盖并回退 zh-CN）
const getPostBySlugUncached = async (slug: string, locale?: string): Promise<Post | null> => {
	// Build candidate list
	const candidates: string[] = [];
	if (locale) {
		candidates.push(path.join(POSTS_DIR, `${slug}.${locale}.mdx`));
	}
	candidates.push(path.join(POSTS_DIR, `${slug}.zh-CN.mdx`));
	candidates.push(path.join(POSTS_DIR, `${slug}.mdx`));

	let filePath: string | null = null;
	for (const p of candidates) {
		try {
			await fs.access(p);
			filePath = p;
			break;
		} catch {
			// continue
		}
	}
	if (!filePath) return null;

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

export const getPostBySlug = (slug: string, locale?: string) =>
	cache(
		unstable_cache(
			() => getPostBySlugUncached(slug, locale),
			['post', slug, locale || 'default'],
			{
				revalidate: 7200, // 2小时缓存
				tags: ['posts']
			}
		)
	)(); 