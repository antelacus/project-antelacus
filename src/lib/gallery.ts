import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

export interface PhotoInfo {
  filename: string;
  path: string;
  caption?: string;
  location?: string;
  camera?: string;
  lens?: string;
  settings?: string;
  timestamp?: string;
}

export interface PhotoMeta {
  slug: string;
  title: string;
  date: string;
  caption?: string;
  location?: string;
  imageFolder: string; // 照片文件夹路径
  coverImage: string; // 封面图路径（第一张照片）
  photoCount: number; // 照片数量
  photos: PhotoInfo[]; // 所有照片信息
  tags?: string[];    // 统一标签系统
}

export interface Photo extends PhotoMeta {
  content: string;
}

const GALLERY_DIR = path.join(process.cwd(), 'src/content/gallery');
const PUBLIC_GALLERY_DIR = path.join(process.cwd(), 'public/gallery');

// 获取照片文件夹中的所有照片
async function getPhotosFromFolder(folderName: string): Promise<PhotoInfo[]> {
  const folderPath = path.join(PUBLIC_GALLERY_DIR, folderName);
  
  try {
    const files = await fs.readdir(folderPath);
    const imageFiles = files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort(); // 按文件名排序
    
    return imageFiles.map(filename => ({
      filename,
      path: `/gallery/${folderName}/${filename}`,
      // 可以在这里添加EXIF读取逻辑
    }));
  } catch (error) {
    console.warn(`Warning: Could not read gallery folder ${folderName}:`, error);
    return [];
  }
}

const getAllPhotosMetaUncached = async (): Promise<PhotoMeta[]> => {
  const files = await fs.readdir(GALLERY_DIR);
  const photos: PhotoMeta[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;
    const filePath = path.join(GALLERY_DIR, file);
    const source = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(source);
    
    const slug = file.replace(/\.mdx$/, '');
    const imageFolder = data.imageFolder || slug; // 默认使用slug作为文件夹名
    const photosInFolder = await getPhotosFromFolder(imageFolder);
    
    photos.push({
      slug,
      title: data.title,
      date: data.date,
      caption: data.caption,
      location: data.location,
      imageFolder,
      coverImage: photosInFolder[0]?.path || '',
      photoCount: photosInFolder.length,
      photos: photosInFolder,
      tags: data.tags || [],
    });
  }
  
  photos.sort((a, b) => b.date.localeCompare(a.date));
  return photos;
};

export const getAllPhotosMeta = unstable_cache(
  getAllPhotosMetaUncached,
  ['photos-meta'],
  {
    revalidate: 3600,
    tags: ['gallery']
  }
);

const getPhotoBySlugUncached = async (slug: string): Promise<Photo | null> => {
  const filePath = path.join(GALLERY_DIR, `${slug}.mdx`);
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(source);
    
    const imageFolder = data.imageFolder || slug;
    const photosInFolder = await getPhotosFromFolder(imageFolder);
    
    return {
      slug,
      title: data.title,
      date: data.date,
      caption: data.caption,
      location: data.location,
      imageFolder,
      coverImage: photosInFolder[0]?.path || '',
      photoCount: photosInFolder.length,
      photos: photosInFolder,
      tags: data.tags || [],
      content,
    };
  } catch (e) {
    return null;
  }
};

export const getPhotoBySlug = cache(
  unstable_cache(
    getPhotoBySlugUncached,
    ['photo'],
    {
      revalidate: 7200,
      tags: ['gallery']
    }
  )
); 